import hashlib
import importlib.util
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

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
