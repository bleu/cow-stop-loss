import contextlib
import copy
import importlib.util
import io
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("catalog_live", pathlib.Path(__file__).with_name("catalog-live.py"))
LIVE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(LIVE)


def word(value):
    return value.to_bytes(32, "big").hex()


def abi_text(value):
    encoded = value.encode()
    return "0x" + word(32) + word(len(encoded)) + encoded.hex().ljust(64, "0")


class LiveApprovalTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = pathlib.Path(self.temporary.name)
        (self.root / "scripts").mkdir()
        self.address = "0x" + "1" * 40
        self.proxy = "0x" + "2" * 40
        (self.root / "scripts/catalog-feeds.json").write_text(json.dumps({"1": [{"path": "asset-usd", "proxyAddress": self.proxy, "heartbeat": 3600}]}))
        self.token = {"address": self.address, "symbol": "ASSET", "decimals": 18, "oracles": {"USD": self.proxy}, "oracleApprovals": {"USD": {"proxyAddress": self.proxy, "path": "asset-usd", "expectedDescription": "ASSET / USD", "expectedDecimals": 8, "maxAgeSeconds": 3600}}}
        self.replies = ["0x" + word(18), abi_text("ASSET"), abi_text("ASSET / USD"), "0x" + word(8), "0x" + "".join(word(value) for value in (7, 100000000, 9900, 9900, 7))]

    def verify(self):
        with patch.object(LIVE, "ROOT", self.root), patch.object(LIVE, "rpc", return_value=[{"result": value} for value in self.replies]), patch.object(LIVE.time, "time", return_value=10000), contextlib.redirect_stdout(io.StringIO()):
            return LIVE.verify_chain((1, [self.token]))[1]

    def test_exact_approved_metadata_passes(self):
        self.assertEqual(self.verify()["issues"], [])

    def test_nonempty_wrong_symbol_fails(self):
        self.replies[1] = abi_text("OTHER")
        self.assertIn("symbol differs", self.verify()["issues"][0])

    def test_quote_only_description_is_not_identity(self):
        self.replies[2] = abi_text("OTHER / USD")
        self.assertIn("description differs", self.verify()["issues"][0])

    def test_feed_decimals_must_match_approval(self):
        self.replies[3] = "0x" + word(18)
        self.assertIn("decimals differ", self.verify()["issues"][0])

    def test_incomplete_round_fails(self):
        self.replies[4] = "0x" + "".join(word(value) for value in (7, 100000000, 9900, 9900, 6))
        self.assertTrue(self.verify()["issues"])

    def test_future_timestamp_fails(self):
        self.replies[4] = "0x" + "".join(word(value) for value in (7, 100000000, 10001, 10001, 7))
        self.assertIn("freshness limit", self.verify()["issues"][0])

    def test_candidates_can_be_observed_before_approval(self):
        token = {**self.token, "chainId": 1, "oracles": {}, "oracleApprovals": {}}
        approval = {**self.token["oracleApprovals"]["USD"], "chainId": 1, "tokenAddress": self.address, "quote": "USD"}
        inventory = {"1": [{"path": "asset-usd", "proxyAddress": self.proxy, "docs": {"quoteAsset": "USD"}}]}
        selected = LIVE.candidate_tokens({"approvals": [approval]}, [token], inventory)
        self.assertEqual(selected[0]["oracles"], {"USD": self.proxy})
        self.assertEqual(token["oracles"], {})
        with patch.object(LIVE, "rpc") as rpc:
            with self.assertRaisesRegex(ValueError, "exact known token"):
                LIVE.candidate_tokens({"approvals": [{**approval, "proxyAddress": self.address}]}, [token], inventory)
            for missing in ({}, {"1": []}, {"100": inventory["1"]}):
                with self.subTest(inventory=missing):
                    with self.assertRaisesRegex(ValueError, "exact known token"):
                        LIVE.candidate_tokens({"approvals": [approval]}, [token], missing)
            rpc.assert_not_called()

    def test_candidate_quote_and_duplicates_fail_before_reads(self):
        token = {**self.token, "chainId": 1}
        approval = {**self.token["oracleApprovals"]["USD"], "chainId": 1, "tokenAddress": self.address, "quote": "USD"}
        inventory = {"1": [{"path": "asset-usd", "proxyAddress": self.proxy, "docs": {"quoteAsset": "USD"}}]}
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            LIVE.candidate_tokens({"approvals": [approval, approval]}, [token], inventory)
        with self.assertRaisesRegex(ValueError, "exact known token"):
            LIVE.candidate_tokens({"approvals": [{**approval, "quote": "ETH"}]}, [token], inventory)

    def test_missing_approval_does_not_make_rpc_call(self):
        self.token["oracleApprovals"] = {}
        with patch.object(LIVE, "rpc") as rpc:
            with self.assertRaisesRegex(ValueError, "Missing exact feed approval"):
                LIVE.verify_chain((1, [self.token]))
            rpc.assert_not_called()


class CandidateRouteTests(unittest.TestCase):
    def setUp(self):
        self.tokens, self.inventory, self.responses = [], {}, {}
        self.buy = self.leg(1, 10, "BUY", "usd-pegged")
        self.first = self.leg(1, 20, "FIRST", "volatile")
        self.second = self.leg(1, 30, "SECOND", "volatile")
        self.sells = [self.first, self.second]
        self.buys = [self.buy]

    def leg(self, chain, number, symbol, asset_class):
        token, proxy = ("0x" + format(value, "040x") for value in (number, number + 1))
        path, description = symbol.lower() + "-usd", symbol + " / USD"
        self.tokens.append({"chainId": chain, "address": token, "symbol": symbol, "decimals": 6, "assetClass": asset_class})
        self.inventory.setdefault(str(chain), []).append({"path": path, "proxyAddress": proxy, "docs": {"quoteAsset": "USD"}, "decimals": 8, "heartbeat": 3600})
        self.responses.update({
            (token, "0x313ce567"): {"result": "0x" + word(6)},
            (token, "0x95d89b41"): {"result": abi_text(symbol)},
            (proxy, "0x7284e416"): {"result": abi_text(description)},
            (proxy, "0x313ce567"): {"result": "0x" + word(8)},
            (proxy, "0xfeaf968c"): self.round_reply(7, 100000000, 9900, 7),
        })
        return {"chainId": chain, "tokenAddress": token, "path": path, "proxyAddress": proxy, "quote": "USD", "expectedDescription": description, "expectedDecimals": 8, "maxAgeSeconds": 3600}

    def round_reply(self, round_id, answer, updated, answered):
        return {"result": "0x" + "".join(word(value % (1 << 256)) for value in (round_id, answer, updated, updated, answered))}

    def observe(self):
        with patch.object(LIVE, "rpc", side_effect=lambda _, calls: [self.responses[call] for call in calls]) as rpc, patch.object(LIVE.time, "time", return_value=10000), contextlib.redirect_stdout(io.StringIO()):
            report = LIVE.verify_candidate_routes(self.sells, self.buys, self.tokens, self.inventory)
        return report, rpc

    def results(self, report):
        return LIVE.candidate_route_results(self.sells, self.buys, self.tokens, self.inventory, report)

    def batch(self, report):
        return LIVE.candidate_observation_batch(self.sells, self.buys, self.tokens, self.inventory, report)

    def test_staged_metadata_and_inventory_pass_without_changing_inputs(self):
        before = copy.deepcopy((self.tokens, self.inventory, self.sells, self.buys))
        report, rpc = self.observe()
        self.assertEqual(self.results(report), (self.sells, []))
        self.assertEqual(rpc.call_count, 3)
        self.assertEqual(len(report["buyLegs"]), 1)
        self.assertEqual(len(self.batch(report)["routes"]), 2)
        self.assertEqual((self.tokens, self.inventory, self.sells, self.buys), before)

    def test_partial_sell_report_is_pruned_without_losing_other_sells(self):
        report, _ = self.observe()
        report["sellLegs"].pop()
        passed, rejected = self.results(report)
        self.assertEqual(passed, [self.first])
        self.assertEqual(rejected, [(self.second, "sell leg: Verification failed: missing leg")])
        self.assertEqual([route["sell"]["approval"] for route in self.batch(report)["routes"]], [self.first])

    def test_missing_skipped_and_duplicate_reports_do_not_pass(self):
        report, _ = self.observe()
        bad_reports = ({}, {**report, "status": "not-performed"}, {**report, "skippedChains": {"1": "skipped"}},
                       {**report, "skipped": True}, {**report, "buyLegs": []}, {**report, "sellLegs": report["sellLegs"] * 2})
        for bad in bad_reports:
            with self.subTest(report=bad):
                self.assertEqual(self.results(bad)[0], [])
                with self.assertRaisesRegex(ValueError, "No passing candidate routes"):
                    self.batch(bad)

    def test_wrong_report_chain_or_inexact_coverage_fails_only_affected_sell(self):
        report, _ = self.observe()
        for change, reason in (({"chainId": 100}, "chain ID differs"), ({"tokens": {}}, "expected tokens"),
                               ({"feeds": {}}, "expected feeds"), ({"status": "skipped"}, "contains errors or issues")):
            with self.subTest(change=change):
                altered = copy.deepcopy(report)
                altered["sellLegs"][0]["observation"].update(change)
                passed, rejected = self.results(altered)
                self.assertEqual(passed, [self.second])
                self.assertEqual(rejected[0][0], self.first)
                self.assertIn(reason, rejected[0][1])

    def test_wrong_chain_from_rpc_never_passes(self):
        rpc_replies = [{"id": 0, "result": "0x64"}]
        with patch.object(LIVE.subprocess, "run") as run:
            run.return_value.returncode = 0
            run.return_value.stdout = json.dumps(rpc_replies)
            with self.assertRaisesRegex(ValueError, "RPC chain ID differs"):
                LIVE.rpc(1, [])
        with patch.object(LIVE, "verify_chain", return_value=("100", {})):
            report = LIVE.verify_candidate_routes(self.sells, self.buys, self.tokens, self.inventory)
        passed, rejected = self.results(report)
        self.assertEqual(passed, [])
        self.assertTrue(all("wrong chain ID" in reason for _, reason in rejected))

    def test_buy_failure_skips_dependent_sells_and_keeps_independent_chain(self):
        self.buys.append(self.leg(100, 40, "OTHER_BUY", "usd-pegged"))
        other_sell = self.leg(100, 50, "OTHER_SELL", "volatile")
        self.sells.append(other_sell)
        self.responses[(self.buy["proxyAddress"], "0xfeaf968c")] = {"error": "missing response"}
        report, rpc = self.observe()
        self.assertEqual([call.args[0] for call in rpc.call_args_list].count(1), 1)
        passed, rejected = self.results(report)
        self.assertEqual(passed, [other_sell])
        self.assertEqual([sell for sell, _ in rejected], [self.first, self.second])
        self.assertTrue(all("buy leg" in reason for _, reason in rejected))

    def test_buy_pin_must_match_exact_expected_approval(self):
        report, _ = self.observe()
        report["buyLegs"][0]["approval"]["path"] = "different-path"
        passed, rejected = self.results(report)
        self.assertEqual(passed, [])
        self.assertTrue(all("exact approval" in reason for _, reason in rejected))

    def test_stale_future_nonpositive_and_incomplete_rounds_are_isolated(self):
        for reply in (self.round_reply(7, 100, 5000, 7), self.round_reply(7, 100, 10100, 7),
                      self.round_reply(7, 0, 9900, 7), self.round_reply(7, -1, 9900, 7),
                      self.round_reply(0, 100, 9900, 0), self.round_reply(7, 100, 9900, 6), {"result": "0x00"}):
            with self.subTest(reply=reply):
                self.responses[(self.first["proxyAddress"], "0xfeaf968c")] = reply
                report, _ = self.observe()
                passed, rejected = self.results(report)
                self.assertEqual(passed, [self.second])
                self.assertEqual([sell for sell, _ in rejected], [self.first])

    def test_route_observation_checks_handler_arithmetic_bounds(self):
        max_answer = ((1 << 255) - 1) // 10 ** 28
        call = (self.first["proxyAddress"], "0xfeaf968c")
        self.responses[call] = self.round_reply(7, max_answer, 9900, 7)
        report, _ = self.observe()
        self.assertEqual(self.results(report), (self.sells, []))
        for answer, updated, max_age, reason in ((max_answer + 1, 9900, 3600, "exceeds int256"),
                                                 (100, 5000, 5000, "underflow")):
            with self.subTest(reason=reason):
                self.responses[call] = self.round_reply(7, answer, updated, 7)
                self.first["maxAgeSeconds"] = max_age
                report, _ = self.observe()
                passed, rejected = self.results(report)
                self.assertEqual(passed, [self.second])
                self.assertIn(reason, rejected[0][1])

    def test_candidate_report_keeps_the_reason_for_a_symbol_mismatch(self):
        self.responses[(self.first["tokenAddress"], "0x95d89b41")] = {"result": abi_text("OTHER")}
        report, _ = self.observe()
        passed, rejected = self.results(report)
        self.assertEqual(passed, [self.second])
        self.assertIn("Token symbol differs", rejected[0][1])
        self.assertIn("OTHER", rejected[0][1])

    def test_ambiguous_staged_identity_is_not_read(self):
        self.tokens.append(dict(self.tokens[1], symbol="AMBIGUOUS"))
        report, rpc = self.observe()
        self.assertEqual(rpc.call_count, 2)
        passed, rejected = self.results(report)
        self.assertEqual(passed, [self.second])
        self.assertIn("exact known token", rejected[0][1])


if __name__ == "__main__":
    unittest.main()
