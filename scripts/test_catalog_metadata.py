"""Pinned metadata resolver tests. All downloads use fixture bytes."""
import copy
import hashlib
import http.client
import io
import json
import pathlib
import tempfile
import unittest
import urllib.error
from unittest import mock

import catalog_metadata as metadata

ADDRESS = "0x" + "ab" * 20
OTHER_ADDRESS = "0x" + "cd" * 20
REVISION = "a" * 40


def token(chain=1, address=ADDRESS, symbol="TOK", name="Token", decimals=18):
    return {"chainId": chain, "address": address, "symbol": symbol, "name": name, "decimals": decimals}


def identity(chain=1, address=ADDRESS):
    return {"chainId": chain, "address": address, "assetClass": "volatile", "localLogo": "/assets/token.svg"}


def source(source_id="cow", data=b"", chain=None):
    filename = "CowSwap.json" if source_id == "cow" else source_id + ".json"
    result = {"id": source_id, "url": f"https://raw.githubusercontent.com/cowprotocol/token-lists/{REVISION}/src/public/{filename}", "sha256": hashlib.sha256(data).hexdigest()}
    if chain is not None:
        result["chainId"] = chain
    return result


def manifest(sources=None):
    return {"schemaVersion": 1, "revision": REVISION, "sources": sources if sources is not None else [source()]}


def overlay(entries=None):
    return {"schemaVersion": 1, "tokens": entries or []}


def correction(fields=None, expected=None):
    return {"chainId": 1, "address": ADDRESS, "metadata": fields or {"symbol": "LOCAL"}, "expected": expected or {"symbol": "TOK"}, "reason": "Keep the reviewed display symbol"}


class ResolverTests(unittest.TestCase):
    def resolve(self, tokens=None, documents=None, sources=None, overrides=None):
        return metadata.resolve_metadata({"tokens": tokens if tokens is not None else [identity()], "usdTokens": {"1": ADDRESS}}, manifest(sources), overrides or overlay(), documents if documents is not None else {"cow": {"tokens": [token()]}})

    def test_exact_contract_resolution_preserves_identity_and_input(self):
        selected = [identity(address=ADDRESS.upper().replace("0X", "0x"))]
        before = copy.deepcopy(selected)
        resolved, report = self.resolve(tokens=selected)
        self.assertEqual(selected, before)
        self.assertEqual(resolved["tokens"][0]["symbol"], "TOK")
        self.assertEqual(resolved["tokens"][0]["localLogo"], selected[0]["localLogo"])
        self.assertEqual(resolved["usdTokens"], {"1": ADDRESS})
        self.assertNotIn("metadataSource", resolved["tokens"][0])
        self.assertEqual(report["tokens"][0], {"chainId": 1, "address": ADDRESS, "source": "cow", "overriddenFields": []})

    def test_source_priority_and_no_auto_import(self):
        sources = [source(), source("coingecko-1", chain=1), source("uniswap-1", chain=1)]
        documents = {"cow": {"tokens": [token()]}, "coingecko-1": {"tokens": [token(symbol="CG"), token(address=OTHER_ADDRESS, symbol="ONLYCG")]}, "uniswap-1": {"tokens": [token(symbol="UNI")]}}
        resolved, report = self.resolve(documents=documents, sources=sources)
        self.assertEqual(len(resolved["tokens"]), 1)
        self.assertEqual(resolved["tokens"][0]["symbol"], "TOK")
        documents["cow"]["tokens"] = []
        resolved, report = self.resolve(documents=documents, sources=sources)
        self.assertEqual(resolved["tokens"][0]["symbol"], "CG")
        self.assertEqual(report["tokens"][0]["source"], "coingecko-1")
        documents["coingecko-1"]["tokens"] = []
        resolved, _ = self.resolve(documents=documents, sources=sources)
        self.assertEqual(resolved["tokens"][0]["symbol"], "UNI")

    def test_cross_chain_and_symbol_never_match(self):
        for candidate in [token(chain=100), token(address=OTHER_ADDRESS)]:
            with self.subTest(candidate=candidate), self.assertRaisesRegex(ValueError, "Missing metadata"):
                self.resolve(documents={"cow": {"tokens": [candidate]}})

    def test_same_address_can_have_different_metadata_on_each_chain(self):
        resolved, _ = self.resolve(tokens=[identity(), identity(chain=100)], documents={"cow": {"tokens": [token(), token(chain=100, symbol="OTHER")]}})
        self.assertEqual([item["symbol"] for item in resolved["tokens"]], ["TOK", "OTHER"])

    def test_identical_upstream_duplicates_collapse(self):
        uppercase = ADDRESS.upper().replace("0X", "0x")
        documents = {"cow": {"tokens": [token(), dict(token(address=uppercase), logoURI="different.png")]}}
        resolved, report = self.resolve(documents=documents)
        self.assertEqual(len(resolved["tokens"]), 1)
        self.assertEqual(report["summary"]["external"], 1)

    def test_duplicate_normalized_contracts_rejected(self):
        uppercase = ADDRESS.upper().replace("0X", "0x")
        for field, value in [("symbol", "OTHER"), ("name", "Other Token"), ("decimals", 6)]:
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, "conflicting duplicate token"):
                self.resolve(documents={"cow": {"tokens": [token(), dict(token(address=uppercase), **{field: value})]}})
        with self.assertRaisesRegex(ValueError, "Duplicate identity"):
            self.resolve(tokens=[identity(), identity(address=uppercase)])

    def test_out_of_scope_upstream_chains_filtered(self):
        resolved, _ = self.resolve(documents={"cow": {"tokens": [token(), {"chainId": 57073, "address": "irrelevant"}, {"chainId": "solana", "address": "non-EVM"}]}})
        self.assertEqual(len(resolved["tokens"]), 1)

    def test_unknown_local_chains_rejected(self):
        with self.assertRaisesRegex(ValueError, "unsupported chainId"):
            self.resolve(tokens=[identity(chain=57073)])
        entry = correction()
        entry["chainId"] = 57073
        with self.assertRaisesRegex(ValueError, "unsupported chainId"):
            self.resolve(overrides=overlay([entry]))

    def test_invalid_upstream_tokens_rejected(self):
        invalid = [{"chainId": "1"}, {"chainId": True}, {"chainId": None}, {"address": "0x123"}, {"symbol": " "}, {"name": ""}, {"decimals": True}, {"decimals": -1}, {"decimals": 37}, {"decimals": "18"}]
        for changes in invalid:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                self.resolve(documents={"cow": {"tokens": [dict(token(), **changes)]}})
        incomplete = token()
        incomplete.pop("name")
        with self.assertRaisesRegex(ValueError, "missing metadata fields"):
            self.resolve(documents={"cow": {"tokens": [incomplete]}})

    def test_per_chain_source_cannot_supply_other_supported_chain(self):
        with self.assertRaisesRegex(ValueError, "differs from source"):
            self.resolve(sources=[source(), source("coingecko-1", chain=1)], documents={"cow": {"tokens": [token()]}, "coingecko-1": {"tokens": [token(chain=100)]}})

    def test_full_local_metadata_for_missing_and_test_contracts(self):
        entry = {"chainId": 11155111, "address": ADDRESS, "metadata": {"symbol": "TEST", "name": "Test Token", "decimals": 6}, "reason": "Test deployment"}
        resolved, report = self.resolve(tokens=[identity(chain=11155111)], documents={"cow": {"tokens": []}}, overrides=overlay([entry]))
        self.assertEqual(resolved["tokens"][0]["decimals"], 6)
        self.assertEqual(report["summary"], {"tokens": 1, "external": 0, "local": 1, "corrected": 0, "sources": {"local": 1}})
        del entry["metadata"]["name"]
        with self.assertRaisesRegex(ValueError, "missing metadata fields"):
            self.resolve(tokens=[identity(chain=11155111)], documents={"cow": {"tokens": []}}, overrides=overlay([entry]))

    def test_partial_correction_and_drift(self):
        resolved, report = self.resolve(overrides=overlay([correction()]))
        self.assertEqual(resolved["tokens"][0]["symbol"], "LOCAL")
        self.assertEqual(resolved["tokens"][0]["name"], "Token")
        self.assertEqual(report["summary"]["corrected"], 1)
        self.assertEqual(report["tokens"][0]["overriddenFields"], ["symbol"])
        with self.assertRaisesRegex(ValueError, "expected metadata drift"):
            self.resolve(overrides=overlay([correction()]), documents={"cow": {"tokens": [token(symbol="CHANGED")]}})

    def test_source_removal_fails_even_for_full_correction(self):
        entry = correction({"symbol": "OLD", "name": "Old Token", "decimals": 6}, {"symbol": "TOK", "name": "Token", "decimals": 18})
        with self.assertRaisesRegex(ValueError, "source disappeared"):
            self.resolve(documents={"cow": {"tokens": []}}, overrides=overlay([entry]))
        with self.assertRaisesRegex(ValueError, "Missing metadata"):
            self.resolve(documents={"cow": {"tokens": []}})

    def test_overlay_validation(self):
        cases = []
        for changes in [{"reason": " "}, {"unknown": True}, {"metadata": {}}, {"metadata": {"symbol": "TOK"}}, {"metadata": {"name": "Changed"}}, {"expected": {"symbol": "TOK", "name": "Token"}}, {"address": OTHER_ADDRESS}, {"metadata": {"symbol": "LOCAL", "typo": "bad"}}]:
            cases.append(overlay([dict(correction(), **changes)]))
        missing_expected = correction()
        missing_expected.pop("expected")
        cases.extend([overlay([missing_expected]), overlay([correction(), correction()]), {"schemaVersion": True, "tokens": []}, {"schemaVersion": 1, "tokens": [], "extra": True}])
        for overrides in cases:
            with self.subTest(overrides=overrides), self.assertRaises(ValueError):
                self.resolve(overrides=overrides)

    def test_inline_metadata_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "display metadata"):
            self.resolve(tokens=[dict(identity(), symbol="HIDDEN")])

    def test_manifest_validation(self):
        cases = []
        for changes in [{"revision": "main"}, {"revision": "a" * 39}, {"schemaVersion": True}, {"extra": True}, {"sources": []}]:
            cases.append(dict(manifest(), **changes))
        for changes in [{"id": "other"}, {"url": source()["url"].replace(REVISION, "main")}, {"url": source()["url"].replace("raw.githubusercontent.com", "evil.example")}, {"url": source()["url"] + "?x=1"}, {"url": source()["url"].replace("CowSwap.json", "../CowSwap.json")}, {"sha256": "0" * 63}, {"chainId": 57073}, {"unexpected": True}]:
            cases.append(manifest([dict(source(), **changes)]))
        cases.extend([manifest([source(), source()]), manifest([source("coingecko-1")]), manifest([source(), source("uniswap-1"), source("coingecko-1")]), manifest([source(), source("coingecko-57073")]), manifest([source(), source("coingecko-1", chain=100)])])
        for candidate in cases:
            with self.subTest(candidate=candidate), self.assertRaises(ValueError):
                metadata.validate_manifest(candidate)


class Response(io.BytesIO):
    status = 200

    def __init__(self, data, url, length=None):
        super().__init__(data)
        self.url = url
        self.headers = {"Content-Length": str(len(data)) if length is None else length}

    def geturl(self):
        return self.url


class CacheTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = pathlib.Path(self.temporary.name).resolve()
        (self.root / "scripts").mkdir()
        self.cache = self.root / "cache"
        self.data = json.dumps({"tokens": [token()]}).encode()
        self.source = source(data=self.data)
        self.write(metadata.MANIFEST_PATH, manifest([self.source]))
        self.write(metadata.OVERRIDES_PATH, overlay())
        self.write(metadata.IDENTITIES_PATH, {"tokens": [identity()], "usdTokens": {"1": ADDRESS}})
        self.path = self.cache / f"{self.source['sha256']}.json"
        self.opener = mock.Mock()
        self.patcher = mock.patch.object(metadata.urllib.request, "build_opener", return_value=self.opener)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)
        self.opener.open.return_value = Response(self.data, self.source["url"])

    def write(self, path, value):
        (self.root / path).write_text(json.dumps(value))

    def fetch(self):
        return metadata.fetch_sources(self.root, self.cache)

    def load(self):
        return metadata.load_metadata(self.root, self.cache)

    def test_cold_fetch_and_verified_offline_reuse(self):
        documents = self.fetch()
        self.assertEqual(documents["cow"]["tokens"][0], token())
        self.assertEqual(self.path.read_bytes(), self.data)
        self.assertEqual(list(self.cache.iterdir()), [self.path])
        request = self.opener.open.call_args.args[0]
        self.assertEqual(request.full_url, self.source["url"])
        self.assertEqual(self.opener.open.call_args.kwargs["timeout"], metadata.TIMEOUT_SECONDS)
        self.opener.open.reset_mock()
        self.opener.open.side_effect = AssertionError("Network access with warm cache")
        self.fetch()
        resolved, _ = self.load()
        self.assertEqual(resolved["tokens"][0]["symbol"], "TOK")
        self.assertEqual(metadata.load_identities(self.root, self.cache), resolved)
        self.opener.open.assert_not_called()

    def test_default_cache_is_content_addressed(self):
        metadata.fetch_sources(self.root)
        self.assertEqual((self.root / ".cache/token-catalog" / self.path.name).read_bytes(), self.data)

    def test_missing_cache_never_fetches_on_load(self):
        with self.assertRaisesRegex(ValueError, "Missing pinned metadata cache"):
            self.load()
        self.opener.open.assert_not_called()

    def test_corrupt_cache_never_repairs_or_fetches(self):
        self.cache.mkdir()
        self.path.write_bytes(b"corrupt")
        for action in [self.fetch, self.load]:
            with self.assertRaisesRegex(ValueError, "digest mismatch"):
                action()
        self.assertEqual(self.path.read_bytes(), b"corrupt")
        self.opener.open.assert_not_called()

    def test_bad_download_digest_leaves_no_cache_entry(self):
        self.opener.open.return_value = Response(b"wrong", self.source["url"])
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            self.fetch()
        self.assertEqual(list(self.cache.iterdir()), [])

    def test_transport_failure_leaves_no_partial_entry(self):
        self.opener.open.side_effect = urllib.error.URLError("offline")
        with self.assertRaisesRegex(ValueError, "Cannot fetch pinned metadata"):
            self.fetch()
        self.assertEqual(list(self.cache.iterdir()), [])

    def test_interrupted_download_leaves_no_partial_entry(self):
        response = mock.MagicMock()
        response.__enter__.return_value = response
        response.geturl.return_value = self.source["url"]
        response.status = 200
        for failure in [OSError("connection closed"), http.client.IncompleteRead(b"partial", 100)]:
            response.read.side_effect = failure
            self.opener.open.return_value = response
            with self.subTest(failure=failure), self.assertRaisesRegex(ValueError, "Cannot fetch pinned metadata"):
                self.fetch()
            self.assertEqual(list(self.cache.iterdir()), [])

    def test_truncated_download_rejected(self):
        self.opener.open.return_value = Response(self.data, self.source["url"], length=str(len(self.data) + 1))
        with self.assertRaisesRegex(ValueError, "Incomplete"):
            self.fetch()
        self.assertEqual(list(self.cache.iterdir()), [])

    def test_oversized_download_is_bounded(self):
        with mock.patch.object(metadata, "MAX_BYTES", 8):
            self.opener.open.return_value = Response(self.data, self.source["url"])
            with self.assertRaises(ValueError):
                self.fetch()
        self.assertEqual(list(self.cache.iterdir()), [])

    def test_oversized_cached_bytes_rejected(self):
        self.fetch()
        with mock.patch.object(metadata, "MAX_BYTES", 8), self.assertRaisesRegex(ValueError, "byte limit"):
            self.load()

    def test_redirects_rejected(self):
        self.opener.open.return_value = Response(self.data, "https://evil.example/list.json")
        with self.assertRaisesRegex(ValueError, "redirected"):
            self.fetch()
        handler = metadata.PinnedRedirectHandler()
        request = metadata.urllib.request.Request(self.source["url"])
        with self.assertRaisesRegex(ValueError, "redirected"):
            handler.redirect_request(request, None, 302, "Found", {}, "https://evil.example")
        self.assertEqual(list(self.cache.iterdir()), [])

    def test_invalid_document_cannot_enter_cache_even_with_correct_digest(self):
        self.data = b'{"tokens":[{"chainId":1,"address":"bad"}]}'
        self.source = source(data=self.data)
        self.write(metadata.MANIFEST_PATH, manifest([self.source]))
        self.opener.open.return_value = Response(self.data, self.source["url"])
        with self.assertRaisesRegex(ValueError, "invalid address"):
            self.fetch()
        self.assertEqual(list(self.cache.iterdir()), [])

    def test_failed_atomic_write_cleans_temporary_file(self):
        with mock.patch.object(metadata.os, "replace", side_effect=OSError("disk error")), self.assertRaises(OSError):
            self.fetch()
        self.assertEqual(list(self.cache.iterdir()), [])

    def test_symlink_cache_directory_and_file_rejected(self):
        target = self.root / "target"
        target.mkdir()
        self.cache.symlink_to(target, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "symlinks"):
            self.fetch()
        self.cache.unlink()
        self.cache.mkdir()
        destination = target / "document.json"
        destination.write_bytes(self.data)
        self.path.symlink_to(destination)
        for action in [self.fetch, self.load]:
            with self.assertRaisesRegex(ValueError, "symlink"):
                action()
        self.opener.open.assert_not_called()

    def test_file_in_cache_directory_path_rejected(self):
        self.cache.write_bytes(b"not a directory")
        with self.assertRaisesRegex(ValueError, "not a directory"):
            self.fetch()


if __name__ == "__main__":
    unittest.main()
