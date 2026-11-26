"""Resolve issuer-backed instruments for catalog staging and discovery."""
import datetime
import hashlib
import json
import re
import urllib.request
from collections import defaultdict

from .metadata import MAX_BYTES, PinnedRedirectHandler
from .observations import ADDRESS, MAX_ORACLE_DECIMALS, integer, require
from .snapshot import excluded_reason

PAXOS_URL = "https://raw.githubusercontent.com/paxosglobal/paxos-gold-contract/1a21e856ebe70360de3817edd5c89baf30a429a4/README.md"
PLASMA_ROOT = "https://raw.githubusercontent.com/PlasmaLaboratories/plasma-tokenlist/5920b4bdb56d87d3afd4a1187cffcef8d1c2f45a/"
BRIDGE_URL = "https://usdt0.to/assets/xaut0"
BRIDGE_PLASMA_URL = "https://usdt0.to/ecosystem/plasma"
ONDO_URL = "https://raw.githubusercontent.com/ondoprotocol/ondo-global-markets-token-list/c2741088e2a3b323ee8c42bcbf6f010cd7476f86/tokenlist.json"
ROBINHOOD_URL = "https://api.robinhood.com/rhj/assets"
ROBINHOOD_DIRECTORY = "https://reference-data-directory.vercel.app/feeds-robinhood-mainnet.json"
ISSUER_SOURCES = {
    "paxos": (PAXOS_URL, "c0866a05442e4fbe5f4de704f75b6be87a5bf85b40368d61177295a6c99725de"),
    "plasma": (PLASMA_ROOT + "plasma.tokenlist.json", "d70d54b7170a973c7919e245b4ebb8db98ccaad102b2b6e2e9c726abb18f9842"),
    "xaut0": (BRIDGE_URL, None),
    "xaut0-plasma": (BRIDGE_PLASMA_URL, None),
    "ondo": (ONDO_URL, "8dfddd09b29d8529ead98ad6bd34fa1786e083af508898ac4f929bc10d8c141c"),
    "robinhood": (ROBINHOOD_URL, None),
}
GOLD_ISSUERS = {
    1: ("paxos",),
    9745: ("plasma", "xaut0-plasma", "xaut0"),
}
GOLD_FEEDS = {
    1: ("paxg-usd", "0x9944D86CEB9160aF5C5feB251FD671923323f8C3", "crypto-PAXG"),
    9745: ("xaut-usd", "0x354Df1ca4AE838A45405B3486ED0161AA7f01191", "crypto-XAUT"),
}
WEEK_SECONDS = 7 * 86_400
XAUT_BACKING = (
    "XAUT0 is the version of Tether Gold built to move across supported networks while maintaining 1:1 backing with XAUT on Ethereum.",
    "When you bridge to a supported chain, tokens are minted only after the original XAUT is locked in a transparent smart contract.",
)


def fetch_issuer(name, *, snapshot=None):
    url, expected = ISSUER_SOURCES[name]
    if snapshot is not None:
        require(name == "robinhood", "Only Robinhood discovery accepts a supplied issuer snapshot")
        with snapshot.open("rb") as source:
            raw = source.read(MAX_BYTES + 1)
        provenance = {"suppliedSnapshot": True}
    else:
        opener = urllib.request.build_opener(PinnedRedirectHandler())
        with opener.open(url, timeout=15) as response:
            raw = response.read(MAX_BYTES + 1)
        provenance = {"retrievedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    require(0 < len(raw) <= MAX_BYTES, f"Invalid issuer snapshot size: {name}")
    digest = hashlib.sha256(raw).hexdigest()
    require(expected is None or digest == expected, f"Issuer snapshot digest changed: {name}")
    return raw, {"url": url, "sha256": digest, **provenance}


def primary_gold_feed(rows, path, proxy, instrument):
    matches = [row for row in rows if row.get("path") == path]
    require(len(matches) == 1, "Missing or ambiguous instrument price path")
    row, = matches
    require(isinstance(row.get("proxyAddress"), str) and row["proxyAddress"].lower() == proxy.lower(), "Primary instrument proxy changed")
    require(sum(str(item.get("proxyAddress")).lower() == proxy.lower() for item in rows) == 1, "Ambiguous instrument price proxy")
    require(excluded_reason(row) is None, "Instrument price does not pass the production feed filter")
    docs = row["docs"]
    require(docs.get("baseAssetEntityId") == instrument and docs.get("quoteAsset") == "USD", "Feed does not price the intended instrument in USD")
    require(docs.get("attributeType") == "cex_price" and docs.get("productTypeCode") == "RefPrice"
            and docs.get("deliveryChannelCode") == "DF" and docs.get("marketHours") == "Crypto",
            "Price method is not a continuous token reference Data Feed")
    require(integer(row["decimals"], 0, MAX_ORACLE_DECIMALS), "Unsupported instrument price decimals")
    return row


def gold_identity(chain, snapshots):
    if chain == 1:
        addresses = re.findall(r"Interaction with PAXG is done at the address of the proxy at `(0x[0-9a-fA-F]{40})`", snapshots["paxos"].decode())
        require(len(addresses) == 1, "Missing or ambiguous Paxos gold proxy")
        return addresses[0].lower(), None
    tokens = json.loads(snapshots["plasma"])["tokens"]
    matches = [token for token in tokens if token.get("chainId") == 9745 and token.get("symbol") == "XAUT0"]
    require(len(matches) == 1, "Missing or ambiguous listed Plasma gold token")
    token, = matches
    address = token["address"]
    issuer = snapshots["xaut0-plasma"].decode().lower()
    require(ADDRESS.fullmatch(address) and f'/plasma/address/{address.lower()}"' in issuer, "Plasma and bridge operator disagree on the token address")
    backing = snapshots["xaut0"].decode()
    require(all(claim in backing for claim in XAUT_BACKING), "Missing issuer evidence of locked 1:1 XAUT backing")
    require(token.get("decimals") == 6 and token.get("name") == "Tether Gold", "Plasma gold token metadata changed")
    logo = PLASMA_ROOT + f"logos/9745/{address}.png"
    return address.lower(), {"chainId": chain, "address": address.lower(), "assetClass": "volatile", "logoSource": logo,
                             "classificationReason": "XAUt0 tracks gold, whose USD price changes; it is not a fiat stablecoin."}


def round_observation(reply, expected_id=None):
    require(isinstance(reply.get("result"), str) and "error" not in reply, "Missing historical price round")
    raw = bytes.fromhex(reply["result"][2:])
    require(len(raw) == 160, "Incomplete historical price round")
    round_id = int.from_bytes(raw[:32], "big")
    answer = int.from_bytes(raw[32:64], "big", signed=True)
    updated_at = int.from_bytes(raw[96:128], "big")
    answered_in = int.from_bytes(raw[128:160], "big")
    require(0 < round_id < 2**80 and answered_in >= round_id and answer > 0 and updated_at > 0, "Invalid historical price round")
    require(expected_id is None or round_id == expected_id, "Historical round ID differs from request")
    return round_id, updated_at


def publication_window(points, heartbeat, now):
    latest = points[0][1]
    max_age = 3 * heartbeat // 2 + 60
    require(0 <= now - latest <= max_age, "Latest historical observation is stale or in the future")
    require(latest - points[-1][1] >= WEEK_SECONDS, "Price history does not cover seven days")
    gaps = [left[1] - right[1] for left, right in zip(points, points[1:])]
    require(all(0 <= gap <= max_age for gap in gaps), "Price history has an unexpected publication gap")
    days = {datetime.datetime.fromtimestamp(item[1], datetime.timezone.utc).weekday() for item in points}
    require({5, 6} <= days, "Price history does not show Saturday and Sunday updates")
    return {"firstRoundId": str(points[-1][0]), "lastRoundId": str(points[0][0]), "firstUpdate": points[-1][1],
            "lastUpdate": latest, "rounds": len(points), "maxGapSeconds": max(gaps), "checkedAt": now}


def read_publication_window(chain, feed, rpc, now):
    proxy = feed["proxyAddress"]
    points = [round_observation(rpc(chain, [(proxy, "0xfeaf968c")])[0])]
    for _ in range(20):
        if points[0][1] - points[-1][1] >= WEEK_SECONDS:
            break
        last_id = points[-1][0]
        require(last_id % 2**64 > 10, "Price history reaches a proxy phase boundary")
        ids = range(last_id - 1, last_id - 11, -1)
        replies = rpc(chain, [(proxy, f"0x9a6fc8f5{round_id:064x}") for round_id in ids])
        require(len(replies) == len(ids), "Incomplete historical price response")
        points.extend(round_observation(reply, round_id) for reply, round_id in zip(replies, ids))
    return publication_window(points, feed["heartbeat"], now())


def metadata_override(chain, address, listed):
    current = {key: listed[key] for key in ("symbol", "name", "decimals") if listed and key in listed}
    expected = {"symbol": "XAUt0", "name": "Tether Gold", "decimals": 6}
    changes = {key: value for key, value in expected.items() if current.get(key) != value}
    if not changes:
        return None
    entry = {"chainId": chain, "address": address, "metadata": changes,
             "reason": f"{PLASMA_ROOT}plasma.tokenlist.json: issuer-listed token; use the live ERC-20 symbol and decimals."}
    if current:
        entry["expected"] = {key: current[key] for key in changes}
    return entry


def source_pin(source):
    return f"{source['url']} (SHA-256 {source['sha256']})"


def gold_evidence(chain, address, row, sources, directory, window):
    relationship = "exact-asset" if chain == 1 else "bridged-underlying"
    verified_at = datetime.datetime.fromtimestamp(window["checkedAt"], datetime.timezone.utc).date().isoformat()
    if chain == 1:
        reason = "The feed prices the Paxos PAXG token held on Ethereum."
        backing = source_pin(sources["paxos"])
    else:
        reason = "The bridge locks original XAUT for XAUt0 on Plasma. XAUT/USD does not price bridge or custody risk."
        backing = source_pin(sources["xaut0"])
    evidence = {
        "chainId": chain, "tokenAddress": address, "quote": "USD", "path": row["path"],
        "proxyAddress": row["proxyAddress"], "assetRelationship": relationship, "assetRelationshipReason": reason,
        "identityEvidence": "; ".join(source_pin(sources[name]) for name in GOLD_ISSUERS[chain] if name != "xaut0"),
        "representationEvidence": backing,
        "methodologyEvidence": (
            f"Chainlink cex_price token reference feed ({row['docs']['baseAssetEntityId']}). "
            f"Read {window['rounds']} consecutive rounds ({window['firstRoundId']} to {window['lastRoundId']}) "
            f"over at least seven days, with Saturday and Sunday updates and a maximum gap of {window['maxGapSeconds']} seconds."
        ),
        "sourceEvidence": source_pin(directory),
        "expectedDescription": row["name"], "expectedDecimals": row["decimals"],
        "maxAgeSeconds": 3 * row["heartbeat"] // 2 + 60, "reviewDate": verified_at,
    }
    if relationship == "bridged-underlying":
        evidence["representationSuitability"] = {
            "decision": "accepted-underlying-feed", "bridgeRisk": "not-priced-by-feed",
            "evidence": backing, "reviewDate": verified_at,
        }
    return evidence


def stock_addresses(rows, issuer):
    addresses = defaultdict(set)
    for chain, symbol, address in rows:
        require(integer(chain, 1) and isinstance(symbol, str) and symbol and isinstance(address, str) and ADDRESS.fullmatch(address), f"Invalid {issuer} stock registry entry")
        addresses[chain, symbol.casefold()].add(address.lower())
    require(addresses, f"Empty {issuer} stock registry")
    return addresses


def registry_rows(document, field):
    rows = document.get(field) if isinstance(document, dict) else None
    require(isinstance(rows, list) and all(isinstance(row, dict) for row in rows), f"Invalid issuer registry {field}")
    return rows


def ondo_addresses(raw):
    rows = ((token.get("chainId"), token.get("symbol"), token.get("address"))
            for token in registry_rows(json.loads(raw), "tokens"))
    return stock_addresses(rows, "Ondo")


def robinhood_addresses(raw):
    rows = ((deployment.get("chainId"), token.get("tokenSymbol"), deployment.get("contractAddress"))
            for token in registry_rows(json.loads(raw), "assets") if token.get("status") == "ASSET_STATUS_ACTIVE"
            for deployment in registry_rows(token, "deployments"))
    return stock_addresses(rows, "Robinhood")


def issuer_stock_row(row, issuer):
    asset = str(row.get("assetName") or "")
    name = str(row.get("name") or "")
    if issuer == "ondo":
        return "(Ondo Tokenized" in asset or "(Ondo API)" in name
    return asset.startswith("Robinhood ") or name.startswith("Robinhood ") or "(Robinhood Tokenized" in asset


def stock_report(chain, rows, addresses, issuer):
    results = []
    for row in rows:
        docs = row.get("docs", {})
        if docs.get("assetClass") not in {"Equity", "Equities", "TokenizedEquities", "ETF"} or not issuer_stock_row(row, issuer):
            continue
        base = docs.get("baseAsset")
        hints = sorted(addresses.get((chain, base.casefold()), [])) if isinstance(base, str) else []
        if docs.get("productType") != "Price" or docs.get("productTypeCode") != "primaryTokenizedPrice":
            reason = "unsupported-stock-price-method"
        elif docs.get("deliveryChannelCode") != "DF" or not ADDRESS.fullmatch(row.get("proxyAddress") or ""):
            reason = "no-onchain-price-proxy"
        elif (row.get("feedCategory") in {"hidden", "deprecating"} or docs.get("hidden") or docs.get("shutdownDate")
              or row.get("status") not in {None, "active"} or docs.get("quoteAsset") != "USD"):
            reason = "inactive-or-incompatible-stock-price"
        elif docs.get("marketHours") != "us_equities_24/5":
            reason = "unsupported-stock-market-session"
        else:
            reason = "session-guard-required"
        results.append({"chainId": chain, "issuer": issuer, "baseAsset": base, "path": row.get("path"),
                        "proxyAddress": row.get("proxyAddress"), "tokenHints": hints, "reason": reason})
    return results
