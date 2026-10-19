"""Offline approval-policy tests. Run with python3 -m unittest discover -s scripts -p 'test_*.py'."""
import copy
import hashlib
import importlib.util
import io
import json
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
            "logoSha256": hashlib.sha256(b"x" * 101).hexdigest(),
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
        self.assertEqual(result["chains"]["1"], {
            "status": "approved",
            "executionEvidence": "Reviewed handler and route deployment at pinned block",
            "arithmeticBoundsEvidence": "Reviewed nonzero normalization and overflow bounds for the execution route",
            "reviewDate": "2026-01-01",
        })
        self.assertEqual([row["reason"] for row in audit], ["approved", "approved", "awaiting-approval", "awaiting-approval"])
        self.assertEqual(token["assetClass"], "volatile")
        self.assertEqual(token["classificationReason"], "Fixture classification")
        self.assertNotIn("logoSources", token)

    def bounded_buy_approval(self):
        self.buy_feed["docs"]["stablecoinCapped"] = True
        approval = self.policy["approvals"][0]
        approval["boundedPriceSuitability"] = {
            "decision": "accepted-for-fixed-buy",
            "evidence": "Reviewed capped USD price for the fixed buy token",
            "reviewDate": "2026-01-01",
        }
        self.refingerprint(approval, self.buy, self.buy_feed)
        return approval

    def test_bounded_fixed_buy_can_be_approved_without_changing_source(self):
        approval = self.bounded_buy_approval()
        source = copy.deepcopy(self.buy_feed)
        self.assertEqual(catalog.excluded_reason(self.buy_feed), "bounded-price-methodology-not-approved")
        result, audit = self.build()
        self.assertEqual(self.token(result, self.buy)["oracles"], {"USD": self.buy_feed["proxyAddress"]})
        self.assertEqual(self.token(result, self.buy)["oracleApprovals"]["USD"]["boundedPriceSuitability"], approval["boundedPriceSuitability"])
        self.assertEqual(audit[0]["reason"], "approved")
        self.assertEqual(self.buy_feed, source)
        self.assertEqual(catalog.excluded_reason(self.buy_feed), "bounded-price-methodology-not-approved")

    def test_bounded_buy_requires_complete_suitability_review(self):
        approval = self.bounded_buy_approval()
        valid = copy.deepcopy(approval["boundedPriceSuitability"])
        invalid = [None, True, "accepted-for-fixed-buy", {},
                   dict(valid, decision="accepted"), dict(valid, evidence=" "),
                   dict(valid, evidence=None), dict(valid, reviewDate="2026-02-30"),
                   dict(valid, reviewDate="20260101"), dict(valid, reviewDate="9999-01-01")]
        invalid.extend({key: value for key, value in valid.items() if key != field} for field in valid)
        for suitability in invalid:
            with self.subTest(suitability=suitability):
                approval["boundedPriceSuitability"] = suitability
                with self.assertRaises(ValueError):
                    self.build()
        del approval["boundedPriceSuitability"]
        with self.assertRaisesRegex(ValueError, "bounded-price-methodology-not-approved"):
            self.build()

    def test_bounded_suitability_is_limited_to_exact_fixed_buy_usd(self):
        approval = self.bounded_buy_approval()
        for scope in ("other-token", "other-chain", "ETH", "native-wrapper", "underlying", "bridge", "derivative"):
            with self.subTest(scope=scope):
                identities = copy.deepcopy(self.identities)
                policy = copy.deepcopy(self.policy)
                inventories = copy.deepcopy(self.inventories)
                verification = copy.deepcopy(self.verification)
                entry = policy["approvals"][0]
                feed = inventories["1"][0]
                identity = identities["tokens"][0]
                if scope == "other-token":
                    identity = next(item for item in identities["tokens"] if item["address"] == self.sell["address"])
                    identity["symbol"] = "BUY"
                    identity["assetClass"] = "usd-pegged"
                    policy["approvals"].pop(1)
                    entry["tokenAddress"] = identity["address"]
                    verification["chains"]["1"]["tokens"][identity["address"]]["symbol"] = "BUY"
                elif scope == "other-chain":
                    identities["usdTokens"]["1"] = identities["usdTokens"]["100"]
                    identities["usdTokens"]["100"] = self.buy["address"]
                    other_chain_buy = next(item for item in identities["tokens"] if item["chainId"] == 100)
                    identities["tokens"].extend([dict(other_chain_buy, chainId=1), dict(self.buy, chainId=100)])
                elif scope == "ETH":
                    entry["quote"] = feed["docs"]["quoteAsset"] = "ETH"
                else:
                    entry["assetRelationship"] = scope
                    identity["canonicalNativeWrapper"] = True
                    identity["canonicalNativeWrapperEvidence"] = "Reviewed canonical wrapper"
                entry["snapshotFingerprint"] = catalog.snapshot_fingerprint(identity, feed, verification)
                with self.assertRaisesRegex(ValueError, "boundedPriceSuitability requires fixed buy token, USD quote and exact-asset relationship"):
                    catalog.build(identities, inventories, policy, verification)
        self.assertEqual(approval["assetRelationship"], "exact-asset")

    def test_bounded_suitability_does_not_bypass_other_source_requirements(self):
        self.bounded_buy_approval()
        for target, field, value, reason in [
            ("feed", "feedCategory", "hidden", "hidden-or-deprecating"),
            ("feed", "feedCategory", "deprecating", "hidden-or-deprecating"),
            ("docs", "hidden", True, "hidden-or-deprecating"),
            ("docs", "shutdownDate", "2099-01-01", "hidden-or-deprecating"),
            ("feed", "proxyAddress", "invalid", "no-onchain-proxy"),
            ("docs", "assetClass", "Equities", "non-crypto-price-or-data"),
            ("feed", "status", "inactive", "inactive-feed"),
            ("feed", "feedCategory", "medium", "not-low-risk-category"),
            ("docs", "productType", "NAVLink", "not-cex-reference-price"),
            ("docs", "attributeType", "calculated", "not-cex-reference-price"),
            ("docs", "attributeType", "dex_state_price", "not-cex-reference-price"),
            ("docs", "productSubType", "Calculated", "not-cex-reference-price"),
            ("feed", "name", "BUY exchange rate", "exchange-rate"),
            ("docs", "quoteAsset", "BTC", "unsupported-quote"),
            ("docs", "baseAsset", "", "missing-source-metadata"),
            ("feed", "path", "", "missing-source-metadata"),
            ("feed", "decimals", 37, "missing-source-metadata"),
            ("feed", "heartbeat", 0, "missing-source-metadata"),
        ]:
            with self.subTest(field=field, value=value):
                inventories = copy.deepcopy(self.inventories)
                feed = inventories["1"][0]
                (feed if target == "feed" else feed["docs"])[field] = value
                self.assertEqual(catalog.excluded_reason(feed, bounded_price_approved=True), reason)
                policy = copy.deepcopy(self.policy)
                approval = policy["approvals"][0]
                approval["proxyAddress"], approval["path"] = feed["proxyAddress"], feed["path"]
                approval["snapshotFingerprint"] = catalog.snapshot_fingerprint(self.buy, feed, self.verification)
                error = "proxyAddress" if field == "proxyAddress" else "Missing approval path" if field == "path" else reason
                with self.assertRaisesRegex(ValueError, error):
                    catalog.build(self.identities, inventories, policy, self.verification)

    def test_bounded_suitability_does_not_replace_other_approval_checks(self):
        self.bounded_buy_approval()
        for field in list(catalog.EVIDENCE_FIELDS) + ["assetRelationshipReason", "reviewDate", "maxAgeSeconds", "expectedDescription", "expectedDecimals", "snapshotFingerprint"]:
            with self.subTest(field=field):
                policy = copy.deepcopy(self.policy)
                del policy["approvals"][0][field]
                with self.assertRaises(ValueError):
                    catalog.build(self.identities, self.inventories, policy, self.verification)
        self.policy["chains"]["1"] = {"status": "unavailable", "unavailableReason": "Unverified handler"}
        with self.assertRaisesRegex(ValueError, "execution approval"):
            self.build()

    def test_bounded_buy_review_does_not_cover_another_feed_or_quote(self):
        approval = self.bounded_buy_approval()
        self.sell_feed["docs"]["stablecoinCapped"] = True
        self.refingerprint(self.policy["approvals"][1], self.sell, self.sell_feed)
        with self.assertRaisesRegex(ValueError, "bounded-price-methodology-not-approved"):
            self.build()
        self.sell_feed["docs"].pop("stablecoinCapped")
        self.refingerprint(self.policy["approvals"][1], self.sell, self.sell_feed)
        self.buy_feed["docs"]["quoteAsset"] = "ETH"
        self.refingerprint(approval, self.buy, self.buy_feed)
        with self.assertRaisesRegex(ValueError, "Approval quote differs from source"):
            self.build()

    def test_bounded_buy_still_requires_valid_live_verification(self):
        self.bounded_buy_approval()
        for record, field, value, error in [
            ("chain", "issues", ["RPC failed"], "errors or issues"),
            ("token", "symbol", "WRONG", "Token verification metadata differs"),
            ("token", "decimals", 6, "Token verification metadata differs"),
            ("feed", "latestRoundDataError", "RPC failed", "errors or issues"),
            ("feed", "roundId", "0", "Incomplete verified feed round"),
            ("feed", "answeredInRound", "122", "Incomplete verified feed round"),
            ("feed", "description", "WRONG / USD", "Feed description differs"),
            ("feed", "decimals", 18, "Feed decimals differ"),
            ("feed", "answer", "0", "Feed answer must be positive"),
            ("feed", "updatedAt", 0, "Invalid feed timestamps"),
            ("feed", "updatedAt", 1011, "Invalid feed timestamps"),
            ("feed", "observedAt", 10000, "Feed snapshot exceeds maxAgeSeconds"),
            ("feed", "ageSeconds", 0, "Feed snapshot exceeds maxAgeSeconds"),
            ("feed", "heartbeat", 1, "Feed heartbeat differs"),
        ]:
            with self.subTest(record=record, field=field):
                verification = copy.deepcopy(self.verification)
                chain = verification["chains"]["1"]
                target = chain if record == "chain" else chain["tokens"][self.buy["address"]] if record == "token" else chain["feeds"][self.buy_feed["proxyAddress"]]
                target[field] = value
                policy = copy.deepcopy(self.policy)
                policy["approvals"][0]["snapshotFingerprint"] = catalog.snapshot_fingerprint(self.buy, self.buy_feed, verification)
                with self.assertRaisesRegex(ValueError, error):
                    catalog.build(self.identities, self.inventories, policy, verification)

    def test_unknown_approval_targets_fail(self):
        for field, value in [("chainId", 999), ("tokenAddress", address(999)), ("quote", "BTC"), ("path", "absent"), ("proxyAddress", address(999))]:
            with self.subTest(field=field):
                policy = copy.deepcopy(self.policy)
                policy["approvals"][1][field] = value
                with self.assertRaises(ValueError):
                    catalog.build(self.identities, self.inventories, policy, self.verification)

    def test_approval_requires_its_reviewed_source_row(self):
        self.inventories["1"].remove(self.sell_feed)
        with self.assertRaisesRegex(ValueError, "exactly one source path/proxy"):
            self.build()

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

    def test_resolved_symbol_and_decimals_changes_invalidate_approval(self):
        for field, value in [("symbol", "ALIAS"), ("decimals", 6)]:
            with self.subTest(field=field):
                original = self.sell[field]
                self.sell[field] = value
                with self.assertRaisesRegex(ValueError, "fingerprint changed"):
                    self.build()
                self.sell[field] = original

    def test_live_token_metadata_must_match_resolved_identity(self):
        token = self.verification["chains"]["1"]["tokens"][self.sell["address"]]
        for field, value in [("symbol", "ALIAS"), ("decimals", 6)]:
            with self.subTest(field=field):
                original = token[field]
                token[field] = value
                self.refingerprint(self.policy["approvals"][1], self.sell, self.sell_feed)
                with self.assertRaisesRegex(ValueError, "Token verification metadata differs"):
                    self.build()
                token[field] = original

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

    def test_logo_digest_is_required_and_must_match_file(self):
        for digest in [None, "", "invalid", "0" * 64]:
            with self.subTest(digest=digest):
                identity = copy.deepcopy(self.identities)
                if digest is None:
                    del identity["tokens"][0]["logoSha256"]
                else:
                    identity["tokens"][0]["logoSha256"] = digest
                with self.assertRaisesRegex(ValueError, "logoSha256|Logo digest differs"):
                    catalog.build(identity, self.inventories, self.policy, self.verification)
        (catalog.ROOT / "public/token.svg").write_text("y" * 101)
        with self.assertRaisesRegex(ValueError, "Logo digest differs"):
            self.build()

    def test_audit_accounts_for_each_fixture_source_row(self):
        capped = self.feed(1, 80004, "capped-usd", "CAPPED")
        capped["docs"]["stablecoinCapped"] = True
        hidden = self.feed(100, 80005, "hidden-usd", "HIDDEN")
        hidden["docs"]["hidden"] = True
        _, audit = self.build()
        self.assertEqual(len(audit), sum(map(len, self.inventories.values())))
        self.assertCountEqual(
            [(row["chainId"], row["path"], row["proxyAddress"]) for row in audit],
            [(int(chain), feed["path"], feed["proxyAddress"]) for chain, feeds in self.inventories.items() for feed in feeds],
        )
        self.assertEqual(
            {row["path"]: (row["status"], row["reason"]) for row in audit},
            {
                "buy-usd": ("included", "approved"),
                "sell-usd": ("included", "approved"),
                "other-usd": ("unresolved", "awaiting-approval"),
                "capped-usd": ("excluded", "bounded-price-methodology-not-approved"),
                "hidden-usd": ("excluded", "hidden-or-deprecating"),
            },
        )

    def test_empty_reviewed_inputs_expose_no_production_routes(self):
        inventories = {}
        policy = copy.deepcopy(self.policy)
        policy["approvals"] = []
        policy["chains"] = {
            str(chain): {"status": "unavailable", "unavailableReason": "Awaiting execution review"}
            for chain in catalog.PRODUCTION_CHAINS
        }
        verification = {"chains": {}}
        result, audit = catalog.build(self.identities, inventories, policy, verification)
        self.assertEqual(audit, [])
        self.assertEqual(len(result["tokens"]), len(self.identities["tokens"]))
        self.assertTrue(all(not token["oracles"] and not token["oracleApprovals"] for token in result["tokens"]))
        for chain in catalog.PRODUCTION_CHAINS:
            with self.subTest(chain=chain):
                self.assertEqual(result["chains"][str(chain)], policy["chains"][str(chain)])
                self.assertEqual(result["chains"][str(chain)]["status"], "unavailable")
        self.assertEqual(result["chains"]["11155111"]["status"], "test-only")


class CatalogCliTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = pathlib.Path(self.directory.name)
        (self.root / "scripts").mkdir()
        (self.root / "src/lib").mkdir(parents=True)
        self.manifest = self.root / "scripts/catalog-metadata-sources.json"
        self.manifest.write_text("{}\n")
        self.snapshot = self.root / "src/lib/tokenCatalogData.json"
        self.result = {"tokens": [{"chainId": 1}], "usdTokens": {}, "chains": {}}
        self.audit = [{"reason": "awaiting-approval"}]
        self.identities = {"tokens": []}
        self.metadata = {"summary": {"tokens": 1}}
        for target, kwargs in [
            ("ROOT", {"new": self.root}),
            ("load_metadata", {"return_value": (self.identities, self.metadata)}),
            ("build", {"return_value": (self.result, self.audit)}),
        ]:
            mock = patch.object(catalog, target, **kwargs)
            setattr(self, target, mock.start())
            self.addCleanup(mock.stop)

    def run_cli(self, *args):
        with patch("sys.argv", ["catalog.py", *map(str, args)]), patch("sys.stdout", new_callable=io.StringIO):
            catalog.main()

    def files(self):
        return {path.relative_to(self.root) for path in self.root.rglob("*") if path.is_file()}

    def test_default_writes_only_runtime_snapshot(self):
        self.run_cli()
        self.load_metadata.assert_called_once_with(self.root, None)
        self.build.assert_called_once_with(identities=self.identities)
        self.assertEqual(self.snapshot.read_text(), json.dumps(self.result, indent=2) + "\n")
        self.assertEqual(self.files(), {self.manifest.relative_to(self.root), self.snapshot.relative_to(self.root)})

    def test_reports_are_optional_and_written_to_requested_directory(self):
        reports = self.root / "reports/nested"
        cache = self.root / "cache"
        self.run_cli("--reports", reports, "--cache-dir", cache)
        self.load_metadata.assert_called_once_with(self.root, cache)
        self.assertEqual(json.loads(self.snapshot.read_text()), self.result)
        self.assertEqual(json.loads((reports / "catalog-audit.json").read_text()), self.audit)
        self.assertEqual(json.loads((reports / "catalog-metadata-report.json").read_text()), {
            "schemaVersion": 1,
            "sourceManifest": "scripts/catalog-metadata-sources.json",
            "sourceManifestSha256": hashlib.sha256(self.manifest.read_bytes()).hexdigest(),
            **self.metadata,
        })
        self.assertEqual(self.files(), {
            self.manifest.relative_to(self.root), self.snapshot.relative_to(self.root),
            pathlib.Path("reports/nested/catalog-audit.json"),
            pathlib.Path("reports/nested/catalog-metadata-report.json"),
        })

    def test_check_needs_only_runtime_snapshot_and_writes_no_reports(self):
        content = json.dumps(self.result, indent=2) + "\n"
        self.snapshot.write_text(content)
        with patch.object(pathlib.Path, "write_text") as write:
            self.run_cli("--check")
        write.assert_not_called()
        self.assertEqual(self.snapshot.read_text(), content)
        self.assertEqual(self.files(), {self.manifest.relative_to(self.root), self.snapshot.relative_to(self.root)})

    def test_check_rejects_missing_or_stale_snapshot_without_writing(self):
        for content in [None, "{}\n"]:
            with self.subTest(content=content):
                if content is not None:
                    self.snapshot.write_text(content)
                with patch.object(pathlib.Path, "write_text") as write:
                    with self.assertRaisesRegex(ValueError, "tokenCatalogData.json differs"):
                        self.run_cli("--check")
                write.assert_not_called()
                if content is None:
                    self.assertFalse(self.snapshot.exists())
                else:
                    self.assertEqual(self.snapshot.read_text(), content)

    def test_check_and_reports_are_mutually_exclusive(self):
        reports = self.root / "reports"
        for args in [("--check", "--reports", reports), ("--reports", reports, "--check")]:
            with self.subTest(args=args), patch("sys.stderr", new_callable=io.StringIO):
                with self.assertRaises(SystemExit) as error:
                    self.run_cli(*args)
                self.assertEqual(error.exception.code, 2)
        self.load_metadata.assert_not_called()
        self.build.assert_not_called()
        self.assertEqual(self.files(), {self.manifest.relative_to(self.root)})


if __name__ == "__main__":
    unittest.main()
