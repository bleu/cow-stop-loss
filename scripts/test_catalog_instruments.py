import datetime
import json
import unittest

from token_catalog import instruments
from token_catalog import snapshot as catalog

TOKEN = "0x" + "a" * 40
OTHER_TOKEN = "0x" + "b" * 40
PROXY = "0x" + "c" * 40
GOLD = {
    "name": "PAXG / USD", "path": "paxg-usd", "proxyAddress": PROXY, "feedCategory": "low", "decimals": 8,
    "heartbeat": 86_400, "docs": {"assetClass": "Crypto", "productType": "Price", "baseAsset": "PAXG",
                                  "baseAssetEntityId": "crypto-PAXG", "quoteAsset": "USD", "attributeType": "cex_price",
                                  "productTypeCode": "RefPrice", "deliveryChannelCode": "DF", "marketHours": "Crypto"},
}
STOCK = {
    "name": "SPYon / USD (Calculated)", "assetName": "SPDR S&P 500 ETF (Ondo Tokenized ETF)",
    "path": "spyon-usd-calculated", "proxyAddress": PROXY, "feedCategory": "custom",
    "docs": {"assetClass": "ETF", "productType": "Price", "productTypeCode": "primaryTokenizedPrice",
             "deliveryChannelCode": "DF", "marketHours": "us_equities_24/5", "baseAsset": "SPYon", "quoteAsset": "USD"},
}


class CatalogInstrumentTests(unittest.TestCase):
    def test_gold_identity_requires_the_issuer_contract_and_unit(self):
        paxos = f"Interaction with PAXG is done at the address of the proxy at `{TOKEN}`".encode()
        self.assertEqual(instruments.gold_identity(1, {"paxos": paxos}), (TOKEN, None))
        with self.assertRaisesRegex(ValueError, "ambiguous Paxos gold proxy"):
            instruments.gold_identity(1, {"paxos": paxos + b"\n" + paxos})
        plasma_token = {"chainId": 9745, "address": TOKEN, "symbol": "XAUT0", "name": "Tether Gold", "decimals": 6}
        snapshots = {"plasma": json.dumps({"tokens": [plasma_token]}).encode(),
                     "xaut0-plasma": f'href="https://layerzeroscan.com/api/explorer/plasma/address/{TOKEN}"'.encode(),
                     "xaut0": " ".join(instruments.XAUT_BACKING).encode()}
        address, identity = instruments.gold_identity(9745, snapshots)
        self.assertEqual((address, identity["assetClass"]), (TOKEN, "volatile"))
        with self.assertRaisesRegex(ValueError, "disagree on the token address"):
            instruments.gold_identity(9745, {**snapshots, "xaut0-plasma": snapshots["xaut0-plasma"].replace(TOKEN.encode(), OTHER_TOKEN.encode())})
        with self.assertRaisesRegex(ValueError, "locked 1:1 XAUT backing"):
            instruments.gold_identity(9745, {**snapshots, "xaut0": b"The original XAUT is locked"})

    def test_gold_feed_requires_an_exact_unique_primary_token_reference(self):
        def select(rows):
            return instruments.primary_gold_feed(rows, GOLD["path"], PROXY, "crypto-PAXG")

        self.assertEqual(select([GOLD]), GOLD)
        for rows, message in (
            ([GOLD, GOLD], "ambiguous instrument price path"),
            ([GOLD, {**GOLD, "path": "alternate"}], "Ambiguous instrument price proxy"),
            ([{**GOLD, "proxyAddress": OTHER_TOKEN}], "Primary instrument proxy changed"),
            ([{**GOLD, "docs": {**GOLD["docs"], "baseAssetEntityId": "commodity-XAU"}}], "intended instrument"),
            ([{**GOLD, "docs": {**GOLD["docs"], "productTypeCode": "247"}}], "continuous token reference"),
        ):
            with self.subTest(message=message), self.assertRaisesRegex(ValueError, message):
                select(rows)

    def test_publication_requires_valid_rounds_and_a_week_with_weekend_updates(self):
        end = int(datetime.datetime(2026, 11, 23, tzinfo=datetime.timezone.utc).timestamp())
        day = 86_400
        points = [(20 - i, end - i * day) for i in range(8)]
        self.assertEqual(instruments.publication_window(points, day, end)["maxGapSeconds"], day)
        with self.assertRaisesRegex(ValueError, "does not cover seven days"):
            instruments.publication_window(points[:-1], day, end)
        with self.assertRaisesRegex(ValueError, "unexpected publication gap"):
            instruments.publication_window([points[0], *points[2:]], day, end)
        with self.assertRaisesRegex(ValueError, "Saturday and Sunday"):
            instruments.publication_window([points[0], *points[3:]], 2 * day, end)
        for round_values, message in (((21, 100, end, end, 21), "differs from request"),
                                      ((20, 0, end, end, 20), "Invalid historical price round")):
            with self.subTest(message=message), self.assertRaisesRegex(ValueError, message):
                instruments.round_observation({"result": "0x" + "".join(f"{value:064x}" for value in round_values)}, 20)
        with self.assertRaisesRegex(ValueError, "Missing historical price round"):
            instruments.read_publication_window(1, GOLD, lambda *_: [{"error": "no response"}], lambda: end)

    def test_stock_report_keeps_ticker_matches_as_hints(self):
        registry = {"tokens": [{"chainId": chain, "address": address, "symbol": symbol} for chain, address, symbol in (
            (1, TOKEN, "SPYon"), (1, OTHER_TOKEN, "SPYON"), (56, PROXY, "SPYon"),
        )]}
        hints = instruments.ondo_addresses(json.dumps(registry).encode())
        raw_share = {**STOCK, "name": "SPY / USD", "assetName": "SPDR S&P 500 ETF"}
        rows = [raw_share, STOCK, {**STOCK, "docs": {**STOCK["docs"], "productTypeCode": "247"}},
                {**STOCK, "docs": {**STOCK["docs"], "deliveryChannelCode": "DS"}},
                {**STOCK, "docs": {**STOCK["docs"], "marketHours": "NYSE"}}]
        report = instruments.stock_report(1, rows, hints, "ondo")
        self.assertEqual([entry["reason"] for entry in report], ["session-guard-required", "unsupported-stock-price-method",
                                                                "no-onchain-price-proxy", "unsupported-stock-market-session"])
        self.assertEqual(report[0]["tokenHints"], [TOKEN, OTHER_TOKEN])
        self.assertEqual(catalog.excluded_reason(STOCK), "non-crypto-price-or-data")

    def test_robinhood_hints_use_active_mainnet_deployments(self):
        active = {"tokenSymbol": "AAPL", "status": "ASSET_STATUS_ACTIVE", "deployments": [
            {"chainId": 4663, "contractAddress": TOKEN}, {"chainId": 46630, "contractAddress": OTHER_TOKEN},
        ]}
        inactive = {**active, "status": "ASSET_STATUS_INACTIVE", "deployments": [{"chainId": 4663, "contractAddress": OTHER_TOKEN}]}
        hints = instruments.robinhood_addresses(json.dumps({"assets": [active, inactive]}).encode())
        row = {**STOCK, "name": "Robinhood AAPL / USD", "assetName": "Apple Inc.",
               "docs": {**STOCK["docs"], "baseAsset": "AAPL"}}
        entry, = instruments.stock_report(4663, [row], hints, "robinhood")
        self.assertEqual(entry["tokenHints"], [TOKEN])
        self.assertEqual(entry["reason"], "session-guard-required")
        with self.assertRaisesRegex(ValueError, "Invalid issuer registry deployments"):
            instruments.robinhood_addresses(json.dumps({"assets": [{**active, "deployments": {}}]}).encode())

    def test_metadata_override_preserves_the_onchain_symbol_case(self):
        listed = {"symbol": "XAUT0", "name": "Tether Gold", "decimals": 6}
        override = instruments.metadata_override(9745, TOKEN, listed)
        self.assertEqual(override["metadata"], {"symbol": "XAUt0"})
        self.assertEqual(override["expected"], {"symbol": "XAUT0"})
