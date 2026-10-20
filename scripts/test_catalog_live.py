import contextlib
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


if __name__ == "__main__":
    unittest.main()
