#!/usr/bin/env python3
"""Build or check the pinned catalog without network access."""
import argparse
import collections
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
ADDRESS = re.compile(r"0x[0-9a-fA-F]{40}")
PRODUCTION_CHAINS = {1, 100, 42161, 8453, 137, 43114, 56, 59144, 9745}


def read(name):
    return json.loads((ROOT / name).read_text())


def excluded_reason(feed):
    docs = feed.get("docs", {})
    if feed.get("feedCategory") in {"hidden", "deprecating"} or docs.get("hidden") or docs.get("shutdownDate"):
        return "hidden-or-deprecating"
    if not ADDRESS.fullmatch(feed.get("proxyAddress") or ""):
        return "no-onchain-proxy"
    if docs.get("assetClass") != "Crypto":
        return "non-crypto-price-or-data"
    if docs.get("productType") == "Price" and docs.get("attributeType") in {"glv", "gm", "GLVCustomPrice"}:
        return "unresolved-exact-pool-token-contract"
    if docs.get("productType") != "Price" or docs.get("attributeType") not in {"cex_price", "dex_state_price", "calculated"} or docs.get("productSubType") not in {"Reference", "Calculated"}:
        return "reserve-nav-ratio-exchange-rate-or-non-price"
    if "exchange rate" in feed["name"].lower():
        return "exchange-rate"
    if docs.get("quoteAsset") not in {"ETH", "USD"}:
        return "unsupported-quote"
    return None


def quote(feed):
    # RDD labels xSUSHI as USD in docs, but its name and live description say ETH.
    if feed["path"] == "calc-xsushi-eth":
        return "ETH"
    return feed["docs"]["quoteAsset"]


def missing_identity_reason(chain, feed):
    base = (feed.get("docs", {}).get("baseAsset") or "").upper()
    if base == "BTC":
        return "native-bitcoin-is-not-an-erc20"
    if chain == 9745 and base == "USDT":
        return "use-exact-usdt0-feed-for-usdt0-contract"
    if chain == 9745 and base == "XAUT":
        return "xaut0-is-not-the-exact-xaut-feed-asset"
    eth_only = {
        42161: {"RETH", "RSETH", "CBETH", "WEETH", "EZETH", "WSTETH"},
        8453: {"WSTETH", "RETH", "SUPEROETHB", "EZETH", "WEETH", "RSETH"},
        137: {"CBETH", "WSTETH", "YFI", "MLN"},
        59144: {"WEETH", "EZETH"},
    }
    if base in eth_only.get(chain, set()):
        return "eth-only-feed-buy-token-has-no-eth-feed"
    collisions = {
        1: {"TRUMP"},
        42161: {"CVX", "RON", "SNX"},
        8453: {"DOGE", "OP", "PEPE", "SHIB", "TRUMP", "HYPE"},
        43114: {"CVX"},
        56: {"CFX"},
    }
    if base in collisions.get(chain, set()):
        return "same-symbol-contract-is-a-different-asset"
    return "unresolved-verified-same-chain-contract"


def build():
    identities = read("scripts/catalog-identities.json")
    inventories = read("scripts/catalog-feeds.json")
    tokens, audit, used = [], [], set()
    for identity in identities["tokens"]:
        chain = identity["chainId"]
        token = {key: identity[key] for key in ("chainId", "address", "symbol", "name", "decimals", "logoURI")}
        token["address"] = token["address"].lower()
        token["logoURI"] = identity["localLogo"]
        token["oracles"] = {}
        candidates = [feed for feed in inventories.get(str(chain), []) if not excluded_reason(feed) and (feed["docs"].get("baseAsset") in identity["baseAssets"] or feed["path"] in identity.get("feedPaths", []))]
        candidates.sort(key=lambda feed: (bool(feed.get("svrDisplayLabel")), feed["path"]))
        for feed in candidates:
            denomination = quote(feed)
            if denomination not in token["oracles"]:
                token["oracles"][denomination] = feed["proxyAddress"].lower()
                used.add((chain, feed["path"], feed.get("proxyAddress")))
        if chain in PRODUCTION_CHAINS:
            assert token["oracles"], f"No price feed: {token}"
        tokens.append(token)
    keys = [(token["chainId"], token["address"]) for token in tokens]
    assert len(keys) == len(set(keys)), "Duplicate token contract"
    assert set(map(int, identities["usdTokens"])) == PRODUCTION_CHAINS | {11155111}
    for token in tokens:
        assert ADDRESS.fullmatch(token["address"])
        assert isinstance(token["decimals"], int) and 0 <= token["decimals"] <= 36
        assert token["symbol"] and token["name"]
        image = ROOT / "public" / token["logoURI"].lstrip("/")
        assert image.is_file() and image.stat().st_size > 100, f"Missing logo: {image}"
        if token["chainId"] in PRODUCTION_CHAINS:
            buy = next(item for item in tokens if item["chainId"] == token["chainId"] and item["address"] == identities["usdTokens"][str(token["chainId"])] .lower())
            assert buy["oracles"].get("USD"), f"Buy token lacks USD quote: {buy}"
            assert set(token["oracles"]) & set(buy["oracles"]), f"No quote route: {token}"
    for chain, feeds in inventories.items():
        covered = {base for identity in identities["tokens"] if identity["chainId"] == int(chain) for base in identity["baseAssets"]}
        for feed in feeds:
            reason = excluded_reason(feed)
            if (int(chain), feed["path"], feed.get("proxyAddress")) in used:
                reason = "included"
            elif reason is None:
                if feed["docs"].get("baseAsset") in covered:
                    reason = "alternate-price-proxy"
                else:
                    reason = missing_identity_reason(int(chain), feed)
            status = "included" if reason == "included" else "unresolved" if reason.startswith("unresolved-") else "excluded"
            audit.append({"chainId": int(chain), "name": feed["name"], "path": feed["path"], "proxyAddress": feed.get("proxyAddress"), "baseAsset": feed.get("docs", {}).get("baseAsset"), "status": status, "reason": reason})
    tokens.sort(key=lambda token: (token["chainId"], token["symbol"].lower(), token["address"]))
    return {"tokens": tokens, "usdTokens": identities["usdTokens"]}, audit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check generated files without changing them")
    args = parser.parse_args()
    catalog, audit = build()
    for filename, value in [("src/lib/tokenCatalogData.json", catalog), ("scripts/catalog-audit.json", audit)]:
        content = json.dumps(value, indent=2, ensure_ascii=False) + "\n"
        path = ROOT / filename
        if args.check:
            assert path.read_text() == content, f"Run python3 scripts/catalog.py: {filename} differs"
        else:
            path.write_text(content)
    print("Tokens by chain:", dict(sorted(collections.Counter(token["chainId"] for token in catalog["tokens"]).items())))
    print("Feed rows:", len(audit), dict(collections.Counter(row["reason"] for row in audit)))


if __name__ == "__main__":
    main()
