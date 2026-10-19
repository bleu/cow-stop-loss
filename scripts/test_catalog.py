"""Offline approval-policy tests. Run with python3 -m unittest discover -s scripts -p 'test_*.py'."""
import copy
import importlib.util
import pathlib
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("catalog", pathlib.Path(__file__).with_name("catalog.py"))
catalog = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(catalog)


def address(number):
    return "0x" + format(number, "040x")


class CatalogPolicyTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        root = pathlib.Path(self.directory.name)
        (root / "public").mkdir()
        (root / "public" / "token.svg").write_text("x" * 101)
        self.root_patch = patch.object(catalog, "ROOT", root)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)
        self.identities = {"tokens": [], "usdTokens": {}}
        self.policy = {"schemaVersion": 1, "verificationFile": "scripts/catalog-policy-verification.json", "chains": {}, "approvals": []}
        self.inventories = {}
        self.verification = {"chains": {}}
        for chain in sorted(catalog.PRODUCTION_CHAINS | catalog.TEST_CHAINS):
            buy = self.identity(chain, chain, "BUY", "usd-pegged")
            self.identities["tokens"].append(buy)
            self.identities["usdTokens"][str(chain)] = buy["address"]
            if chain in catalog.PRODUCTION_CHAINS:
                self.policy["chains"][str(chain)] = {"status": "unavailable", "unavailableReason": "Awaiting execution review"}
        self.sell = self.identity(1, 90001, "SELL", "volatile")
        self.other = self.identity(1, 90002, "OTHER", "volatile")
        self.identities["tokens"].extend([self.sell, self.other])
        self.buy = self.identities["tokens"][0]
        self.buy_feed = self.feed(1, 80001, "buy-usd", "BUY")
        self.sell_feed = self.feed(1, 80002, "sell-usd", "SELL")
        self.other_feed = self.feed(1, 80003, "other-usd", "OTHER")
        self.policy["chains"]["1"] = {"status": "approved", "executionEvidence": "Reviewed handler and route deployment at pinned block", "arithmeticBoundsEvidence": "Reviewed nonzero normalization and overflow bounds for the execution route", "reviewDate": "2026-01-01"}
        self.approve(self.buy, self.buy_feed)
        self.approve(self.sell, self.sell_feed)

    def identity(self, chain, number, symbol, asset_class):
        return {
            "chainId": chain, "address": address(number), "symbol": symbol,
            "name": symbol + " token", "decimals": 18, "localLogo": "/token.svg",
            "logoURI": "https://example.test/token.svg", "assetClass": asset_class,
            "classificationReason": "Fixture classification", "baseAssets": [symbol],
            "logoSources": ["https://example.test/token.svg"],
        }

    def feed(self, chain, number, path, base, quote="USD"):
        feed = {
            "name": base + " / " + quote, "path": path, "proxyAddress": address(number),
            "feedCategory": "low", "heartbeat": 3600, "decimals": 8,
            "docs": {"assetClass": "Crypto", "productType": "Price", "attributeType": "cex_price", "productSubType": "Reference", "baseAsset": base, "quoteAsset": quote},
        }
        self.inventories.setdefault(str(chain), []).append(feed)
        checked = self.verification["chains"].setdefault(str(chain), {"tokens": {}, "feeds": {}, "issues": []})
        checked["feeds"][feed["proxyAddress"]] = {
            "description": feed["name"], "decimals": 8, "answer": "123456789",
            "updatedAt": 1000, "observedAt": 1010, "ageSeconds": 10, "heartbeat": 3600,
            "roundId": "123", "answeredInRound": "123",
        }
        return feed

    def approve(self, identity, feed):
        checked = self.verification["chains"][str(identity["chainId"])]
        checked["tokens"][identity["address"]] = {"symbol": identity["symbol"], "decimals": identity["decimals"]}
        approval = {
            "chainId": identity["chainId"], "tokenAddress": identity["address"],
            "quote": feed["docs"]["quoteAsset"], "proxyAddress": feed["proxyAddress"], "path": feed["path"],
            "identityEvidence": "Issuer contract evidence", "representationEvidence": "Exact representation reviewed",
            "methodologyEvidence": "Market-price methodology reviewed", "sourceEvidence": "Pinned official source",
            "assetRelationship": "exact-asset", "assetRelationshipReason": "Feed prices this exact token, not an underlying asset",
            "reviewDate": "2026-01-01", "maxAgeSeconds": 3600,
            "expectedDescription": feed["name"], "expectedDecimals": 8,
            "snapshotFingerprint": catalog.snapshot_fingerprint(identity, feed, self.verification),
        }
        self.policy["approvals"].append(approval)
        return approval

    def build(self):
        return catalog.build(self.identities, self.inventories, self.policy, self.verification)

    def token(self, result, identity):
        return next(token for token in result["tokens"] if token["chainId"] == identity["chainId"] and token["address"] == identity["address"])

    def refingerprint(self, approval, identity, feed):
        approval["snapshotFingerprint"] = catalog.snapshot_fingerprint(identity, feed, self.verification)

    def test_builder_reads_explicit_policy_verification_file(self):
        with patch.object(catalog, "read", return_value=self.verification) as read:
            catalog.build(self.identities, self.inventories, self.policy)
        read.assert_called_once_with("scripts/catalog-policy-verification.json")
        with patch.object(catalog, "read") as read:
            self.build()
        read.assert_not_called()

    def test_verification_file_is_required_and_must_stay_in_repository(self):
        for path in [None, "", "/tmp/verification.json", "../verification.json", "scripts/../../verification.json", "scripts/report.txt", "scripts\\\\report.json"]:
            with self.subTest(path=path):
                policy = copy.deepcopy(self.policy)
                if path is None:
                    del policy["verificationFile"]
                else:
                    policy["verificationFile"] = path
                with self.assertRaisesRegex(ValueError, "verificationFile"):
                    catalog.build(self.identities, self.inventories, policy, self.verification)
        (catalog.ROOT / "outside.json").symlink_to(catalog.ROOT.parent / "outside-verification.json")
        self.policy["verificationFile"] = "outside.json"
        with self.assertRaisesRegex(ValueError, "outside repository"):
            self.build()

    def test_only_exact_approved_feeds_are_exposed(self):
        alternate = self.feed(1, 80004, "aaa-sell-usd", "SELL")
        result, audit = self.build()
        token = self.token(result, self.sell)
        self.assertEqual(token["oracles"], {"USD": self.sell_feed["proxyAddress"]})
        self.assertNotEqual(token["oracles"]["USD"], alternate["proxyAddress"])
        self.assertEqual(token["oracleApprovals"]["USD"], self.policy["approvals"][1])
        self.assertEqual(self.token(result, self.other)["oracles"], {})
        self.assertEqual(result["chains"]["1"], {"status": "approved"})
        self.assertEqual([row["reason"] for row in audit], ["approved", "approved", "awaiting-approval", "awaiting-approval"])
        self.assertEqual(token["assetClass"], "volatile")
        self.assertEqual(token["classificationReason"], "Fixture classification")
        self.assertNotIn("logoSources", token)

    def test_unknown_approval_targets_fail(self):
        for field, value in [("chainId", 999), ("tokenAddress", address(999)), ("quote", "BTC"), ("path", "absent"), ("proxyAddress", address(999))]:
            with self.subTest(field=field):
                policy = copy.deepcopy(self.policy)
                policy["approvals"][1][field] = value
                with self.assertRaises(ValueError):
                    catalog.build(self.identities, self.inventories, policy, self.verification)

    def test_proxy_change_invalidates_approval(self):
        self.sell_feed["proxyAddress"] = address(79999)
        with self.assertRaisesRegex(ValueError, "path/proxy"):
            self.build()

    def test_source_snapshot_change_invalidates_approval(self):
        for field in ("assetName", "svrDisplayLabel"):
            with self.subTest(field=field):
                self.sell_feed[field] = "changed source metadata"
                with self.assertRaisesRegex(ValueError, "fingerprint changed"):
                    self.build()
                del self.sell_feed[field]
        self.sell_feed["docs"]["baseAsset"] = "DIFFERENT"
        with self.assertRaisesRegex(ValueError, "fingerprint changed"):
            self.build()

    def test_identity_change_invalidates_approval(self):
        self.sell["classificationReason"] = "Changed representation evidence"
        with self.assertRaisesRegex(ValueError, "fingerprint changed"):
            self.build()

    def test_live_snapshot_change_invalidates_approval(self):
        self.verification["chains"]["1"]["feeds"][self.sell_feed["proxyAddress"]]["answer"] = "1"
        with self.assertRaisesRegex(ValueError, "fingerprint changed"):
            self.build()

    def test_evidence_and_review_fields_are_required(self):
        fields = list(catalog.EVIDENCE_FIELDS) + ["assetRelationship", "assetRelationshipReason", "reviewDate", "maxAgeSeconds", "expectedDescription", "expectedDecimals", "snapshotFingerprint"]
        for field in fields:
            with self.subTest(field=field):
                policy = copy.deepcopy(self.policy)
                del policy["approvals"][1][field]
                with self.assertRaises(ValueError):
                    catalog.build(self.identities, self.inventories, policy, self.verification)

    def test_duplicate_token_quote_cannot_pick_a_proxy(self):
        self.policy["approvals"].append(copy.deepcopy(self.policy["approvals"][1]))
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            self.build()

    def test_execution_approval_is_required(self):
        self.policy["chains"]["1"] = {"status": "unavailable", "unavailableReason": "Unverified handler"}
        with self.assertRaisesRegex(ValueError, "execution approval"):
            self.build()
        self.policy["approvals"] = []
        result, _ = self.build()
        self.assertEqual(result["chains"]["1"]["unavailableReason"], "Unverified handler")
        self.assertTrue(all(not token["oracles"] for token in result["tokens"]))

    def test_chain_execution_evidence_is_required(self):
        del self.policy["chains"]["1"]["executionEvidence"]
        with self.assertRaisesRegex(ValueError, "executionEvidence"):
            self.build()

    def test_arithmetic_bounds_execution_evidence_is_required(self):
        del self.policy["chains"]["1"]["arithmeticBoundsEvidence"]
        with self.assertRaisesRegex(ValueError, "arithmeticBoundsEvidence"):
            self.build()

    def test_high_decimal_feed_cannot_be_approved(self):
        self.sell_feed["decimals"] = 19
        self.verification["chains"]["1"]["feeds"][self.sell_feed["proxyAddress"]]["decimals"] = 19
        self.policy["approvals"][1]["expectedDecimals"] = 19
        self.refingerprint(self.policy["approvals"][1], self.sell, self.sell_feed)
        with self.assertRaisesRegex(ValueError, "handler supports only 0..18"):
            self.build()

    def test_freshness_limit_is_capped_by_source_heartbeat(self):
        approval = self.policy["approvals"][1]
        approval["maxAgeSeconds"] = 5460
        self.build()
        approval["maxAgeSeconds"] = 5461
        with self.assertRaisesRegex(ValueError, "heartbeat safety cap"):
            self.build()
        self.sell_feed["heartbeat"] = 3601
        self.verification["chains"]["1"]["feeds"][self.sell_feed["proxyAddress"]]["heartbeat"] = 3601
        self.refingerprint(approval, self.sell, self.sell_feed)
        self.build()
        approval["maxAgeSeconds"] = 5462
        with self.assertRaisesRegex(ValueError, "heartbeat safety cap"):
            self.build()

    def test_complete_verified_round_is_required(self):
        observed = self.verification["chains"]["1"]["feeds"][self.sell_feed["proxyAddress"]]
        for field, value in [("roundId", None), ("roundId", "0"), ("roundId", True), ("answeredInRound", None), ("answeredInRound", "122")]:
            with self.subTest(field=field, value=value):
                original = observed[field]
                observed[field] = value
                self.refingerprint(self.policy["approvals"][1], self.sell, self.sell_feed)
                with self.assertRaisesRegex(ValueError, "Incomplete verified feed round"):
                    self.build()
                observed[field] = original

    def test_verification_errors_or_issues_block_approval(self):
        checked_chain = self.verification["chains"]["1"]
        records = [
            (self.verification, "errors", ["RPC failed"]),
            (checked_chain, "issues", ["Incomplete chain check"]),
            (checked_chain["tokens"][self.sell["address"]], "symbolError", "RPC failed"),
            (checked_chain["feeds"][self.sell_feed["proxyAddress"]], "latestRoundDataError", "RPC failed"),
        ]
        for record, field, error in records:
            with self.subTest(field=field):
                original = record.get(field)
                record[field] = error
                self.refingerprint(self.policy["approvals"][1], self.sell, self.sell_feed)
                with self.assertRaisesRegex(ValueError, "errors or issues"):
                    self.build()
                if original is None:
                    del record[field]
                else:
                    record[field] = original
        del checked_chain["issues"]
        self.refingerprint(self.policy["approvals"][1], self.sell, self.sell_feed)
        with self.assertRaisesRegex(ValueError, "errors or issues"):
            self.build()

    def test_underlying_bridge_and_derivative_substitutions_are_rejected(self):
        for relationship in ["underlying", "bridge", "derivative"]:
            with self.subTest(relationship=relationship):
                self.policy["approvals"][1]["assetRelationship"] = relationship
                with self.assertRaisesRegex(ValueError, "Unsupported assetRelationship"):
                    self.build()

    def test_native_wrapper_requires_reviewed_identity_marker_and_evidence(self):
        approval = self.policy["approvals"][1]
        approval["assetRelationship"] = "native-wrapper"
        with self.assertRaisesRegex(ValueError, "reviewed canonical identity"):
            self.build()
        self.sell["canonicalNativeWrapper"] = True
        self.refingerprint(approval, self.sell, self.sell_feed)
        with self.assertRaisesRegex(ValueError, "reviewed canonical identity"):
            self.build()
        self.sell["canonicalNativeWrapperEvidence"] = "Canonical native wrapping contract reviewed"
        self.refingerprint(approval, self.sell, self.sell_feed)
        result, _ = self.build()
        self.assertEqual(self.token(result, self.sell)["oracles"], {"USD": self.sell_feed["proxyAddress"]})

    def test_buy_without_approval_disables_all_sells_but_keeps_metadata(self):
        self.policy["approvals"].pop(0)
        result, audit = self.build()
        self.assertEqual(len(result["tokens"]), len(self.identities["tokens"]))
        self.assertEqual(self.token(result, self.buy)["decimals"], 18)
        self.assertTrue(all(not token["oracles"] and not token["oracleApprovals"] for token in result["tokens"]))
        self.assertEqual(result["chains"]["1"]["unavailableReason"], "buy-token-has-no-approved-usd-feed")
        self.assertTrue(all(row["reason"] == "awaiting-approval" for row in audit))

    def test_quote_without_buy_quote_is_not_exposed(self):
        eth_feed = self.feed(1, 80005, "sell-eth", "SELL", "ETH")
        self.approve(self.sell, eth_feed)
        result, audit = self.build()
        self.assertEqual(self.token(result, self.sell)["oracles"], {"USD": self.sell_feed["proxyAddress"]})
        self.assertEqual(audit[-1]["reason"], "awaiting-approval")

    def test_classification_is_required_on_every_identity(self):
        del self.other["assetClass"]
        with self.assertRaisesRegex(ValueError, "assetClass"):
            self.build()

    def test_unknown_class_is_metadata_only(self):
        self.other["assetClass"] = "unknown"
        result, _ = self.build()
        self.assertEqual(self.token(result, self.other)["oracles"], {})
        self.approve(self.other, self.other_feed)
        with self.assertRaisesRegex(ValueError, "Unclassified"):
            self.build()

    def test_strict_source_requirements(self):
        for target, field, value in [
            ("feed", "feedCategory", "medium"), ("docs", "attributeType", "calculated"),
            ("docs", "attributeType", "dex_state_price"), ("docs", "productSubType", "Calculated"),
            ("docs", "productType", "NAVLink"), ("docs", "hidden", True),
            ("docs", "shutdownDate", "2099-01-01"), ("docs", "stablecoinCapped", True),
            ("feed", "status", "inactive"),
        ]:
            with self.subTest(field=field, value=value):
                inventory = copy.deepcopy(self.inventories)
                feed = inventory["1"][1]
                (feed if target == "feed" else feed["docs"])[field] = value
                with self.assertRaisesRegex(ValueError, "Ineligible"):
                    catalog.build(self.identities, inventory, self.policy, self.verification)

    def test_live_metadata_and_active_price_are_required_after_review(self):
        proxy = self.sell_feed["proxyAddress"]
        original = copy.deepcopy(self.verification["chains"]["1"]["feeds"][proxy])
        for field, value in [("description", "WRONG / USD"), ("decimals", 18), ("answer", "0"), ("updatedAt", 0), ("updatedAt", 1011), ("observedAt", 10000), ("ageSeconds", 0), ("heartbeat", 1)]:
            with self.subTest(field=field):
                observed = dict(original, **{field: value})
                self.verification["chains"]["1"]["feeds"][proxy] = observed
                self.refingerprint(self.policy["approvals"][1], self.sell, self.sell_feed)
                with self.assertRaises(ValueError):
                    self.build()
        self.verification["chains"]["1"]["feeds"][proxy] = original

    def test_sepolia_is_separate_and_has_no_production_oracles(self):
        result, _ = self.build()
        self.assertEqual(result["chains"]["11155111"]["status"], "test-only")
        test_token = next(token for token in result["tokens"] if token["chainId"] == 11155111)
        self.assertEqual(test_token["oracles"], {})

    def test_initial_policy_audits_all_2102_source_rows_without_approval(self):
        root = pathlib.Path(__file__).resolve().parents[1]
        import json
        inventories = json.loads((root / "scripts/catalog-feeds.json").read_text())
        policy = json.loads((root / "scripts/catalog-policy.json").read_text())
        result, audit = catalog.build(self.identities, inventories, policy, self.verification)
        self.assertEqual(len(audit), 2102)
        self.assertEqual(len(audit), sum(map(len, inventories.values())))
        self.assertTrue(all(not token["oracles"] for token in result["tokens"]))
        self.assertTrue(all(row["status"] != "included" for row in audit))
        self.assertTrue(any(row["reason"] == "awaiting-approval" for row in audit))
        self.assertTrue(any(row["reason"] == "bounded-price-methodology-not-approved" for row in audit))
        self.assertTrue(all(result["chains"][str(chain)]["status"] == "unavailable" for chain in catalog.PRODUCTION_CHAINS))


if __name__ == "__main__":
    unittest.main()
