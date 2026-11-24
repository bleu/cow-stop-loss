import hashlib
import importlib.util
import json
from contextlib import ExitStack
import pathlib
import tempfile
import unittest
from unittest.mock import patch

from test_catalog_live import abi_text, word

SCRIPTS = pathlib.Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("catalog_expand", SCRIPTS / "catalog-expand.py")
expand = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(expand)

PROXY = "0x" + "1" * 40
TOKEN = "0x" + "2" * 40
OTHER_TOKEN = "0x" + "3" * 40
BUY = {"tokenAddress": OTHER_TOKEN}
FEED = {
    "name": "APE / USD", "path": "ape-usd", "proxyAddress": PROXY,
    "feedCategory": "low", "decimals": 8, "heartbeat": 86400,
    "docs": {"assetClass": "Crypto", "productType": "Price", "baseAsset": "APE", "quoteAsset": "USD"},
}
APPROVAL = {
    "chainId": 1, "tokenAddress": TOKEN, "path": "ape-usd", "proxyAddress": PROXY,
    "quote": "USD", "expectedDecimals": 8, "maxAgeSeconds": 129660,
}


class CatalogExpansionTests(unittest.TestCase):
    def test_symbols_only_supply_hints_for_exact_contracts(self):
        tokens = {
            (1, TOKEN): {"symbol": "APE", "name": "ApeCoin", "assetClass": "volatile"},
            (1, OTHER_TOKEN): {"symbol": "APE", "name": "Different token", "assetClass": "unknown"},
            (56, TOKEN): {"symbol": "APE", "name": "ApeCoin", "assetClass": "volatile"},
        }
        report, unresolved = expand.screen_directories({"1": [FEED]}, tokens, [])
        self.assertEqual(report["1"][0]["reason"], "needs-exact-evidence")
        self.assertEqual([hint["address"] for hint in report["1"][0]["tokenHints"]], [TOKEN, OTHER_TOKEN])
        self.assertEqual([token["sourceHints"] for token in unresolved], [["ape-usd"], []])

    def test_requires_exact_primary_row_and_same_quote(self):
        self.assertEqual(expand.primary_row([FEED], APPROVAL), FEED)
        for rows, approval, error in (
            ([FEED, FEED], APPROVAL, "ambiguous primary source"),
            ([FEED], {**APPROVAL, "proxyAddress": OTHER_TOKEN}, "ambiguous primary source"),
            ([FEED], {**APPROVAL, "quote": "ETH"}, "quote differs"),
            ([FEED], {**APPROVAL, "maxAgeSeconds": 129661}, "heartbeat limit"),
            ([{**FEED, "docs": {**FEED["docs"], "stablecoinCapped": True}}], APPROVAL, "ambiguous primary source"),
        ):
            with self.subTest(error=error), self.assertRaisesRegex(ValueError, error):
                expand.primary_row(rows, approval)

    def test_excludes_stable_sells_and_unproven_wrappers(self):
        with self.assertRaisesRegex(ValueError, "Not a volatile sell token"):
            expand.check_sell(APPROVAL, {"address": TOKEN, "assetClass": "usd-linked"}, BUY)
        with self.assertRaisesRegex(ValueError, "Missing canonical wrapper evidence"):
            expand.check_sell({**APPROVAL, "assetRelationship": "native-wrapper"}, {"address": TOKEN, "assetClass": "volatile"}, BUY)

    def test_snapshot_requires_unchanged_bytes(self):
        url = "https://reference-data-directory.vercel.app/feeds-mainnet.json"
        data = json.dumps([FEED]).encode()
        with tempfile.TemporaryDirectory() as path, patch.object(expand, "source_urls", return_value={"1": url}):
            directory = pathlib.Path(path)
            expand.write(directory / "sources.json", {"1": {"url": url, "sha256": hashlib.sha256(data).hexdigest()}})
            (directory / "1.json").write_bytes(data)
            self.assertEqual(expand.read_snapshot(directory)[1], {"1": [FEED]})
            (directory / "1.json").write_bytes(data + b"\n")
            with self.assertRaisesRegex(ValueError, "Snapshot source changed"):
                expand.read_snapshot(directory)


class RobinhoodStagingTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = pathlib.Path(temporary.name)
        self.inventory = self.root / "inventory"
        self.evidence_path = self.root / "evidence.json"
        self.output = self.root / "output"
        self.rows, self.identities, self.overrides, self.replies = [], [], [], {}
        self.weth = self.leg("WETH", "ETH", "0x0bd7d308f8e1639fab988df18a8011f41eacad73",
                             "0x78f3556b67e17df817d51ef5a990cdaf09e8d3a9", 18, "volatile")
        self.usdg = self.leg("USDG", "USDG", "0x5fc5360d0400a0fd4f2af552add042d716f1d168",
                             "0x61b7e5650328764b076a108eff5fa7282a1b9ad2", 6, "usd-pegged")
        self.rows[-1]["docs"].update(productTypeCode="RefPrice", deliveryChannelCode="DF",
                                     blockchainName="Robinhood", marketHours="Crypto")
        self.approvals = [self.weth]

    def leg(self, symbol, base, address, proxy, decimals, asset_class):
        path, description = base.lower() + "-usd-shared-svr", base + " / USD"
        self.rows.append({"path": path, "proxyAddress": proxy, "feedCategory": "medium", "decimals": 8, "heartbeat": 86400,
                          "docs": {"assetClass": "Crypto", "productType": "Price", "baseAsset": base, "quoteAsset": "USD"}})
        self.identities.append({"chainId": 4663, "address": address, "assetClass": asset_class, "logoSource": "https://example.com/token.png"})
        self.overrides.append({"chainId": 4663, "address": address, "metadata": {"symbol": symbol, "name": symbol, "decimals": decimals}, "reason": "Fixture token metadata"})
        self.replies.update({
            (address, "0x313ce567"): "0x" + word(decimals),
            (address, "0x95d89b41"): abi_text(symbol),
            (proxy, "0x7284e416"): abi_text(description),
            (proxy, "0x313ce567"): "0x" + word(8),
            (proxy, "0xfeaf968c"): "0x" + "".join(word(value) for value in (7, 100000000, 1795450000, 1795450000, 7)),
        })
        return {"chainId": 4663, "tokenAddress": address, "path": path, "proxyAddress": proxy, "quote": "USD",
                "expectedDescription": description, "expectedDecimals": 8, "maxAgeSeconds": 86400,
                "assetRelationship": "bridged-underlying" if symbol == "WETH" else "exact-asset",
                "assetRelationshipReason": "Fixture relationship", "reviewDate": "2026-11-23",
                **dict.fromkeys(expand.catalog.EVIDENCE_FIELDS, "Fixture evidence")}

    def stage(self):
        self.inventory.mkdir()
        data = json.dumps(self.rows).encode()
        directory_url = "https://reference-data-directory.vercel.app/feeds-robinhood-mainnet.json"
        expand.write(self.inventory / "sources.json", {"4663": {"url": directory_url, "sha256": hashlib.sha256(data).hexdigest()}})
        (self.inventory / "4663.json").write_bytes(data)
        expand.write(self.evidence_path, {
            "pilot": {"chain": {"status": "pilot-only", "executionEvidence": "Fixture deployment",
                                "arithmeticBoundsEvidence": "Fixture handler", "reviewDate": "2026-11-23"},
                      "fixedBuy": self.usdg},
            "approvals": self.approvals, "newIdentities": self.identities, "metadataOverrides": self.overrides,
        })
        manifest = expand.read("metadata-sources")
        expand.write(self.root / "scripts/catalog-policy-verification.json", {"chains": {}})
        documents = {
            "identities": {"tokens": [], "usdTokens": {}}, "metadata-overrides": {"schemaVersion": 1, "tokens": []},
            "metadata-sources": manifest, "feeds": {}, "sources": {"feedSources": {}},
            "policy": {"schemaVersion": 1, "verificationFile": "scripts/catalog-policy-verification.json", "approvals": [],
                       "chains": {str(chain): {"status": "unavailable", "unavailableReason": "Fixture"} for chain in expand.CHAINS}},
        }
        live, assets = (expand.load_script(name) for name in ("catalog-live", "catalog-assets"))
        with ExitStack() as stack:
            stack.enter_context(patch.object(expand, "ROOT", self.root))
            stack.enter_context(patch.object(expand, "read", side_effect=documents.__getitem__))
            stack.enter_context(patch.object(expand, "load_script", side_effect={"catalog-live": live, "catalog-assets": assets}.__getitem__))
            stack.enter_context(patch.object(expand.metadata, "fetch_sources", return_value={source["id"]: {"tokens": []} for source in manifest["sources"]}))
            stack.enter_context(patch.object(assets, "download", return_value=b"\x89PNG\r\n\x1a\n" + b"0" * 100))
            stack.enter_context(patch.object(live, "rpc", side_effect=lambda chain, calls: [{"result": self.replies[call]} for call in calls]))
            stack.enter_context(patch.object(live.time, "time", return_value=1795450100))
            expand.stage(self.inventory, [self.evidence_path], self.output)

    def test_stages_weth_into_the_verified_fixed_usdg_buy(self):
        self.stage()
        self.assertEqual(json.loads((self.output / "results.json").read_text()), {"added": [{
            "chainId": 4663, "address": self.weth["tokenAddress"], "symbol": "WETH", "path": "eth-usd-shared-svr",
        }], "skipped": []})
        policy = json.loads((self.output / "scripts/catalog-policy.json").read_text())
        self.assertEqual(policy["chains"]["4663"]["status"], "pilot-only")
        self.assertEqual({entry["tokenAddress"] for entry in policy["approvals"]}, {self.weth["tokenAddress"], self.usdg["tokenAddress"]})
        identities = json.loads((self.output / "scripts/catalog-identities.json").read_text())
        self.assertEqual(identities["usdTokens"], {"4663": self.usdg["tokenAddress"]})

    def test_rejects_bootstrap_when_usdg_price_method_changes(self):
        self.rows[1]["docs"]["productTypeCode"] = "DexPrice"
        with self.assertRaisesRegex(ValueError, "Missing or ambiguous primary source"):
            self.stage()
        self.assertFalse((self.output / "scripts/catalog-policy.json").exists())

    def test_rejects_bootstrap_when_usdg_heartbeat_changes(self):
        self.rows[1]["heartbeat"] = 172800
        with self.assertRaisesRegex(ValueError, "Missing or ambiguous primary source"):
            self.stage()

    def test_does_not_stage_any_route_when_usdg_round_is_invalid(self):
        self.dell()
        self.replies[(self.usdg["proxyAddress"], "0xfeaf968c")] = "0x" + "".join(
            word(value) for value in (7, 0, 1795450000, 1795450000, 7)
        )
        self.stage()
        results = json.loads((self.output / "results.json").read_text())
        self.assertEqual(results["added"], [])
        self.assertEqual({item["address"] for item in results["skipped"]},
                         {entry["tokenAddress"] for entry in self.approvals})
        self.assertFalse((self.output / "scripts/catalog-policy.json").exists())

    def dell(self):
        entry = self.leg("DELL", "RHDELL", "0x941ae714ec6d8130c7b75d67160ca08f1e7d11dd",
                         "0x1c6c8cadbe02e19129c39ddb92281ce4c0bf206b", 18, "volatile")
        uid = "0x0000000000000000000000000000000014eaef73a2c44d62b7952cfd0a44ff51"
        self.identities[-1]["robinhoodStockToken"] = {"uid": uid, "feedBase": "RHDELL"}
        self.rows[-1]["feedCategory"] = "custom"
        self.rows[-1]["docs"].update(assetClass="Equity", productTypeCode="primaryTokenizedPrice", deliveryChannelCode="DF",
                                     blockchainName="Robinhood", marketHours="us_equities_24/5")
        self.replies[(entry["proxyAddress"], "0x7284e416")] = abi_text("Robinhood DELL-USD")
        self.replies[(entry["tokenAddress"], "0xf514ce36")] = uid
        entry.update(expectedDescription="Robinhood DELL-USD", marketHours="us_equities_24/5", sourceCategorySuitability={
            "category": "custom", "decision": "accepted", "reviewDate": "2026-11-23", "evidence": "Reviewed issuer token price",
        })
        self.approvals.append(entry)
        return entry

    def test_stages_dell_with_the_reviewed_rhdell_feed_alias(self):
        entry = self.dell()
        self.stage()
        results = json.loads((self.output / "results.json").read_text())
        self.assertEqual(results["skipped"], [])
        self.assertIn({"chainId": 4663, "address": entry["tokenAddress"], "symbol": "DELL", "path": "rhdell-usd-shared-svr"}, results["added"])
        policy = json.loads((self.output / "scripts/catalog-policy.json").read_text())
        approval = next(item for item in policy["approvals"] if item["tokenAddress"] == entry["tokenAddress"])
        self.assertEqual(approval["marketHours"], "us_equities_24/5")

    def test_rejects_stock_source_drift_after_staging(self):
        entry = self.dell()
        self.stage()

        def staged(name):
            return json.loads((self.output / f"scripts/catalog-{name}.json").read_text())

        manifest = expand.read("metadata-sources")
        documents = {source["id"]: {"tokens": []} for source in manifest["sources"]}
        identities, _ = expand.metadata.resolve_metadata(staged("identities"), manifest, staged("metadata-overrides"), documents)
        feeds, policy, verification = (staged(name) for name in ("feeds", "policy", "policy-verification"))
        expand.catalog.approved_feeds(identities, feeds, policy, verification)
        row = next(row for row in feeds["4663"] if row["path"] == entry["path"])
        row["heartbeat"] = 90000
        with self.assertRaisesRegex(ValueError, "Approval snapshot fingerprint changed"):
            expand.catalog.approved_feeds(identities, feeds, policy, verification)

    def assert_skips_stock_source(self, entry):
        self.stage()
        results = json.loads((self.output / "results.json").read_text())
        self.assertEqual([item["symbol"] for item in results["added"]], ["WETH"])
        self.assertEqual(results["skipped"], [{
            "chainId": 4663, "address": entry["tokenAddress"], "path": entry["path"],
            "reason": "Missing or ambiguous primary source",
        }])

    def test_skips_stock_source_that_prices_the_share_instead_of_the_token(self):
        entry = self.dell()
        self.rows[-1]["docs"]["productTypeCode"] = "RefPrice"
        self.assert_skips_stock_source(entry)

    def test_skips_stock_source_with_a_24_hour_session(self):
        entry = self.dell()
        self.rows[-1]["docs"]["marketHours"] = "Crypto"
        self.assert_skips_stock_source(entry)

    def test_skips_stock_contract_with_a_different_live_issuer_uid(self):
        entry = self.dell()
        self.replies[(entry["tokenAddress"], "0xf514ce36")] = "0x" + word(99)
        self.stage()
        results = json.loads((self.output / "results.json").read_text())
        self.assertEqual([item["symbol"] for item in results["added"]], ["WETH"])
        self.assertIn("issuer UID differs", results["skipped"][0]["reason"])
