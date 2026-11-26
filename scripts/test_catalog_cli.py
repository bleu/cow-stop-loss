import hashlib
import io
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

import catalog
from test_catalog_assets import IMAGE, SOURCE
from token_catalog import assets, live, metadata, snapshot


class CatalogCliTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = pathlib.Path(temporary.name).resolve()
        self.cache = self.root / "cache"
        self.public = self.root / "images"
        self.snapshot = self.root / "src/lib/tokenCatalogData.json"
        self.snapshot.parent.mkdir(parents=True)
        self.address = "0x" + "1" * 40
        self.display = {"symbol": "BUY", "name": "Fixture buy token", "decimals": 6}
        image_digest = hashlib.sha256(IMAGE).hexdigest()
        logo = f"/assets/tokens/{image_digest[:20]}.svg"
        self.image = self.public / logo.lstrip("/")
        self.chains = {str(chain): {"status": "unavailable", "unavailableReason": "Fixture"}
                       for chain in snapshot.PRODUCTION_CHAINS}
        chain_ids = [*map(int, self.chains), 11155111]
        self.document = json.dumps({"tokens": [
            {"chainId": chain, "address": self.address, **self.display} for chain in chain_ids
        ]}).encode()
        digest = hashlib.sha256(self.document).hexdigest()
        self.cached_document = self.cache / f"{digest}.json"
        revision = "a" * 40
        self.manifest = self.write(metadata.MANIFEST_PATH, {
            "schemaVersion": 1, "revision": revision, "sources": [{
                "id": "cow", "url": f"https://raw.githubusercontent.com/cowprotocol/token-lists/{revision}/src/public/CowSwap.json",
                "sha256": digest,
            }],
        })
        self.write(metadata.OVERRIDES_PATH, {"schemaVersion": 1, "tokens": []})
        self.write(metadata.IDENTITIES_PATH, {
            "tokens": [{"chainId": chain, "address": self.address, "assetClass": "usd-pegged",
                        "localLogo": logo, "logoSha256": image_digest, "logoSource": SOURCE}
                       for chain in chain_ids],
            "usdTokens": dict.fromkeys(map(str, chain_ids), self.address),
        })
        verification = "scripts/catalog-policy-verification.json"
        self.write("scripts/catalog-policy.json", {"schemaVersion": 1, "verificationFile": verification,
                                                   "chains": self.chains, "approvals": []})
        self.write(verification, {"chains": {}})
        self.write("scripts/catalog-feeds.json", {})
        self.stderr = io.StringIO()
        for mock in (
            patch.object(catalog, "ROOT", self.root),
            patch.object(snapshot, "ROOT", self.root),
            patch("sys.stdout", new_callable=io.StringIO),
            patch("sys.stderr", new=self.stderr),
            patch.object(live, "rpc", side_effect=AssertionError("Unexpected RPC")),
            patch("urllib.request.OpenerDirector.open", side_effect=AssertionError("Unexpected HTTP request")),
        ):
            mock.start()
            self.addCleanup(mock.stop)

    def write(self, name, value):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value))
        return path

    def run_cli(self, command, *args):
        return catalog.main([command, *map(str, args), "--cache-dir", str(self.cache), "--public-dir", str(self.public)])

    def restore(self, *args):
        with patch.object(metadata, "download", return_value=self.document), patch.object(assets, "download", return_value=IMAGE):
            self.run_cli("prepare", *args)

    def test_prepare_restores_pinned_inputs_without_writing_snapshot(self):
        self.restore()
        self.assertEqual(self.cached_document.read_bytes(), self.document)
        self.assertEqual(self.image.read_bytes(), IMAGE)
        self.assertFalse(self.snapshot.exists())

    def assert_cli_error(self, message, run, *args):
        self.stderr.seek(0)
        self.stderr.truncate(0)
        with self.assertRaises(SystemExit) as error:
            run(*args)
        self.assertEqual(error.exception.code, 1)
        self.assertIn(message, self.stderr.getvalue())

    def test_prepare_check_restores_inputs_but_leaves_a_stale_snapshot_untouched(self):
        stale = b"{}\n"
        self.snapshot.write_bytes(stale)
        self.assert_cli_error("run pnpm catalog generate", self.restore, "--check")
        self.assertEqual(self.cached_document.read_bytes(), self.document)
        self.assertEqual(self.image.read_bytes(), IMAGE)
        self.assertEqual(self.snapshot.read_bytes(), stale)

    def test_generate_and_check_use_only_local_inputs(self):
        self.restore()
        files = {path for path in self.root.rglob("*") if path.is_file()}
        self.run_cli("generate")
        result = json.loads(self.snapshot.read_bytes())
        token = next(token for token in result["tokens"] if token["chainId"] == 1)
        self.assertEqual(token, {"chainId": 1, "address": self.address, **self.display,
                                 "assetClass": "usd-pegged", "logoURI": f"/{self.image.relative_to(self.public)}",
                                 "oracles": {}, "oracleApprovals": {}})
        self.assertEqual({path for path in self.root.rglob("*") if path.is_file()}, files | {self.snapshot})
        before = {path: (path.read_bytes(), path.stat().st_mtime_ns) for path in files | {self.snapshot}}
        self.run_cli("check")
        self.run_cli("prepare", "--check")
        after = {path: (path.read_bytes(), path.stat().st_mtime_ns) for path in self.root.rglob("*") if path.is_file()}
        self.assertEqual(after, before)

    def test_generate_can_write_optional_reports(self):
        self.restore()
        reports = self.root / "reports/nested"
        self.run_cli("generate", "--reports", reports)
        self.assertEqual(sorted(path.name for path in reports.iterdir()), ["catalog-audit.json", "catalog-metadata-report.json"])
        self.assertEqual(json.loads((reports / "catalog-audit.json").read_bytes()), [])
        report = json.loads((reports / "catalog-metadata-report.json").read_bytes())
        self.assertEqual(report["sourceManifest"], metadata.MANIFEST_PATH)
        self.assertEqual(report["sourceManifestSha256"], hashlib.sha256(self.manifest.read_bytes()).hexdigest())
        self.assertEqual(report["summary"]["sources"], {"cow": 10})

    def test_check_requires_matching_bytes_and_does_not_write(self):
        self.restore()
        self.assert_cli_error("tokenCatalogData.json differs", self.run_cli, "check")
        self.assertFalse(self.snapshot.exists())
        self.run_cli("generate")
        stale = self.snapshot.read_bytes().replace(b"\n", b"\r\n")
        self.snapshot.write_bytes(stale)
        self.assert_cli_error("tokenCatalogData.json differs", self.run_cli, "check")
        self.assertEqual(self.snapshot.read_bytes(), stale)

    def test_offline_commands_do_not_restore_missing_inputs(self):
        for command in ("generate", "check"):
            with self.subTest(command=command):
                self.assert_cli_error("Missing pinned metadata cache", self.run_cli, command)
                self.assertFalse(self.cache.exists())
        self.restore()
        self.image.unlink()
        for command in ("generate", "check"):
            with self.subTest(command=command):
                self.assert_cli_error("image is missing", self.run_cli, command)
                self.assertFalse(self.image.exists())
                self.assertFalse(self.snapshot.exists())

    def test_corrupt_existing_inputs_fail_without_replacement(self):
        self.restore()
        for path, message in ((self.cached_document, "Metadata digest mismatch"), (self.image, "SHA-256 does not match")):
            original = path.read_bytes()
            corrupt = original.replace(b" ", b"\t", 1)
            path.write_bytes(corrupt)
            for command in ("prepare", "generate", "check"):
                with self.subTest(path=path, command=command):
                    self.assert_cli_error(message, self.run_cli, command)
                    self.assertEqual(path.read_bytes(), corrupt)
                    self.assertFalse(self.snapshot.exists())
            path.write_bytes(original)

    def test_check_rejects_reports_option(self):
        reports = self.root / "reports"
        with self.assertRaises(SystemExit) as error:
            self.run_cli("check", "--reports", reports)
        self.assertEqual(error.exception.code, 2)
        self.assertFalse(reports.exists())
