"""Build or check the pinned catalog without network access."""
import collections
import datetime
import hashlib
import json
import pathlib
import re

from . import ROOT
from .metadata import MANIFEST_PATH, PRODUCTION_CHAINS, ROBINHOOD_CHAIN
from .observations import (
    ADDRESS, MAX_ORACLE_DECIMALS, approval_key, checked_at, integer, no_check_errors,
    nonempty, require, source_rows, validate_leg, validate_observations,
)

TEST_CHAINS = {11155111}
ROBINHOOD_FIXED_BUY = "0x5fc5360d0400a0fd4f2af552add042d716f1d168"
ROBINHOOD_FIXED_FEED = ("usdg-usd-shared-svr", "0x61b7e5650328764b076a108eff5fa7282a1b9ad2")
ROBINHOOD_MAX_AGE = 86400
ROBINHOOD_MARKET_HOURS = "us_equities_24/5"
ROBINHOOD_FEED_ALIASES = {"0x941ae714ec6d8130c7b75d67160ca08f1e7d11dd": ("DELL", "RHDELL")}
ASSET_CLASSES = {"volatile", "usd-pegged", "usd-linked", "other-stable", "unknown"}
EVIDENCE_FIELDS = ("identityEvidence", "representationEvidence", "methodologyEvidence", "sourceEvidence")


def read(name):
    return json.loads((ROOT / name).read_text())


def review_date(value):
    require(nonempty(value), "Missing reviewDate")
    try:
        parsed = datetime.date.fromisoformat(value)
    except ValueError as error:
        raise ValueError("Invalid reviewDate") from error
    require(parsed.isoformat() == value and parsed <= datetime.date.today(), "Invalid reviewDate")


def excluded_reason(feed, *, bounded_price_approved=False, robinhood_stock=False):
    docs = feed.get("docs", {})
    if feed.get("feedCategory") in {"hidden", "deprecating"} or docs.get("hidden") or docs.get("shutdownDate"):
        return "hidden-or-deprecating"
    if not ADDRESS.fullmatch(feed.get("proxyAddress") or ""):
        return "no-onchain-proxy"
    if docs.get("assetClass") != ("Equity" if robinhood_stock else "Crypto"):
        return "non-crypto-price-or-data"
    if docs.get("stablecoinCapped") and not bounded_price_approved:
        return "bounded-price-methodology-not-approved"
    if feed.get("status") not in {None, "active"}:
        return "inactive-feed"
    categories = {"low", "medium", "high", "veryhigh", "new"}
    if robinhood_stock:
        categories.add("custom")
    if feed.get("feedCategory") not in categories:
        return "unsupported-risk-category"
    if docs.get("productType") != "Price":
        return "not-price-data"
    if docs.get("quoteAsset") not in {"ETH", "USD"}:
        return "unsupported-quote"
    if not nonempty(docs.get("baseAsset")) or not nonempty(feed.get("path")):
        return "missing-source-metadata"
    if not integer(feed.get("decimals"), 0, 36) or not integer(feed.get("heartbeat"), 1):
        return "missing-source-metadata"
    return None


def approval_source_reason(feed, approval, identity, *, bounded_price_approved=False):
    docs = feed.get("docs", {})
    if (approval.get("chainId") == ROBINHOOD_CHAIN
            and (approval.get("tokenAddress") or "").lower() == ROBINHOOD_FIXED_BUY):
        if (docs.get("blockchainName"), docs.get("deliveryChannelCode"), docs.get("productTypeCode"),
                docs.get("baseAsset"), docs.get("quoteAsset"), docs.get("marketHours")) != (
                "Robinhood", "DF", "RefPrice", "USDG", "USD", "Crypto"):
            return "unsupported-robinhood-fixed-buy-price-method"
        if feed.get("heartbeat") != ROBINHOOD_MAX_AGE:
            return "unsupported-robinhood-fixed-buy-heartbeat"
    stock = identity.get("robinhoodStockToken") if identity else None
    market_hours = approval.get("marketHours")
    robinhood_stock = stock is not None or "marketHours" in approval
    if robinhood_stock:
        if (approval.get("chainId") != ROBINHOOD_CHAIN or approval.get("quote") != "USD"
                or identity is None or identity.get("assetClass") != "volatile"
                or identity.get("address", "").lower() != (approval.get("tokenAddress") or "").lower()
                or approval.get("assetRelationship") != "exact-asset" or not isinstance(stock, dict)
                or not re.fullmatch(r"0x[0-9a-f]{64}", stock.get("uid") or "") or int(stock["uid"], 16) == 0):
            return "missing-exact-robinhood-stock-identity"
        symbol = identity.get("symbol")
        expected_base = ROBINHOOD_FEED_ALIASES.get(identity["address"].lower(), (symbol, symbol))
        if (symbol, stock.get("feedBase")) != expected_base or docs.get("baseAsset") != stock["feedBase"]:
            return "stock-feed-identity-differs"
        if (docs.get("blockchainName"), docs.get("deliveryChannelCode"), docs.get("productTypeCode"), docs.get("quoteAsset")) != (
                "Robinhood", "DF", "primaryTokenizedPrice", "USD"):
            return "unsupported-robinhood-stock-price-method"
        if market_hours != ROBINHOOD_MARKET_HOURS or docs.get("marketHours") != market_hours:
            return "unsupported-robinhood-stock-market-session"
        if approval.get("maxAgeSeconds") != ROBINHOOD_MAX_AGE:
            return "stock-age-must-match-fixed-buy"
    category = feed.get("feedCategory")
    if "sourceCategorySuitability" in approval or (robinhood_stock and category == "custom"):
        suitability = approval.get("sourceCategorySuitability")
        allowed = {"medium", "custom"} if robinhood_stock else {"medium"}
        require(isinstance(suitability, dict) and suitability.get("decision") == "accepted", "Invalid sourceCategorySuitability decision")
        require(category in allowed and suitability.get("category") == category, "sourceCategorySuitability must match medium or reviewed Robinhood custom source category")
        require(nonempty(suitability.get("evidence")), "Missing sourceCategorySuitability evidence")
        review_date(suitability.get("reviewDate"))
    return excluded_reason(feed, bounded_price_approved=bounded_price_approved, robinhood_stock=robinhood_stock)


def _fingerprint(snapshot):
    encoded = json.dumps(snapshot, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return "sha256:" + hashlib.sha256(encoded).hexdigest()


def _batch_routes(verification):
    batches = verification.get("observationBatches", {})
    require(isinstance(batches, dict), "Invalid named observationBatches")
    indexed = collections.defaultdict(dict)
    for name, batch in batches.items():
        require(nonempty(name) and no_check_errors(batch, strict=True), "Invalid named verification batch")
        checked_at(batch.get("checkedAt"))
        routes = batch.get("routes")
        require(isinstance(routes, list) and routes, f"Missing routes in verification batch: {name}")
        for route in routes:
            require(isinstance(route, dict) and isinstance(route.get("sell"), dict), f"Missing sell leg in verification batch: {name}")
            key = approval_key(route["sell"].get("approval"))
            require(name not in indexed[key], f"Duplicate sell in verification batch: {name}")
            indexed[key][name] = batch["checkedAt"], route
    return indexed


def _named_route(approval, batch_routes):
    name = approval.get("verificationBatch")
    require(nonempty(name), "Invalid or missing approval verificationBatch")
    route = batch_routes.get(approval_key(approval), {}).get(name)
    require(route is not None, f"Missing exact sell route in verification batch: {name}")
    return name, *route


def _batch_fingerprint(identity, feed, name, checked_at, route):
    return _fingerprint({"identity": identity, "feed": feed, "verificationBatch": name, "checkedAt": checked_at, "route": route})


def snapshot_fingerprint(identity, feed, verification, approval=None):
    """Bind the review to the exact identity, source row and observations."""
    if approval is not None and "verificationBatch" in approval:
        return _batch_fingerprint(identity, feed, *_named_route(approval, _batch_routes(verification)))
    chain = verification.get("chains", {}).get(str(identity["chainId"]), {})
    return _fingerprint({
        "identity": identity,
        "feed": feed,
        "tokenVerification": chain.get("tokens", {}).get(identity["address"].lower()),
        "feedVerification": chain.get("feeds", {}).get(feed["proxyAddress"].lower()),
    })


def verification_file(policy):
    name = policy.get("verificationFile")
    require(nonempty(name), "Missing policy verificationFile")
    path = pathlib.Path(name)
    require(not path.is_absolute() and ".." not in path.parts and "\\" not in name and path.suffix == ".json", "verificationFile must be a local repository JSON path")
    require((ROOT / path).resolve().is_relative_to(ROOT.resolve()), "verificationFile resolves outside repository")
    return name


def validate_policy(policy):
    require(policy.get("schemaVersion") == 1, "Unsupported policy schemaVersion")
    verification_file(policy)
    chains = policy.get("chains", {})
    production = {str(chain) for chain in PRODUCTION_CHAINS}
    pilot = str(ROBINHOOD_CHAIN)
    require(set(chains) - {pilot} == production, "Policy must cover exactly the production chains and optional Robinhood pilot")
    for chain, entry in chains.items():
        statuses = {"pilot-only"} if chain == pilot else {"approved", "unavailable"}
        require(entry.get("status") in statuses, f"Invalid chain status: {chain}")
        if entry["status"] == "unavailable":
            require(nonempty(entry.get("unavailableReason")), f"Missing unavailableReason: {chain}")
        else:
            require(nonempty(entry.get("executionEvidence")), f"Missing chain executionEvidence: {chain}")
            require(nonempty(entry.get("arithmeticBoundsEvidence")), f"Missing chain arithmeticBoundsEvidence: {chain}")
            review_date(entry.get("reviewDate"))
    require(isinstance(policy.get("approvals"), list), "Missing approvals list")


def approved_feeds(identities, inventories, policy, verification):
    validate_policy(policy)
    pilot = str(ROBINHOOD_CHAIN)
    if pilot in policy["chains"]:
        require(identities["usdTokens"].get(pilot, "").lower() == ROBINHOOD_FIXED_BUY, "Robinhood pilot requires fixed buy USDG")
    identity_map = {(item["chainId"], item["address"].lower()): item for item in identities["tokens"]}
    approvals, sources = {}, {}
    batch_routes = _batch_routes(verification)
    for entry in policy["approvals"]:
        chain = entry.get("chainId")
        address = entry.get("tokenAddress", "")
        require(type(chain) is int and str(chain) in policy["chains"], "Unknown approval chain")
        require(isinstance(address, str) and ADDRESS.fullmatch(address), "Invalid approval tokenAddress")
        identity = identity_map.get((chain, address.lower()))
        require(identity is not None, "Unknown approval token")
        require(identity.get("assetClass") in ASSET_CLASSES - {"unknown"}, "Unclassified approval token")
        denomination = entry.get("quote")
        require(denomination in {"USD", "ETH"}, "Unsupported approval quote")
        key = (chain, address.lower(), denomination)
        require(key not in approvals, "Duplicate token/quote approval")
        execution = policy["chains"][str(chain)]["status"]
        require(execution in {"approved", "pilot-only"}, "Approval requires chain execution approval")
        if execution == "pilot-only":
            require(denomination == "USD", "Robinhood pilot requires USD feeds")
            if address.lower() == ROBINHOOD_FIXED_BUY:
                require((entry.get("path"), (entry.get("proxyAddress") or "").lower()) == ROBINHOOD_FIXED_FEED
                        and entry.get("maxAgeSeconds") == ROBINHOOD_MAX_AGE and identity["assetClass"] == "usd-pegged"
                        and identity["decimals"] == 6 and identity["symbol"] == "USDG"
                        and "boundedPriceSuitability" not in entry, "Invalid Robinhood fixed buy approval")
            else:
                require("verificationBatch" in entry, "Robinhood sell requires a named verification batch")
        proxy = entry.get("proxyAddress", "")
        require(isinstance(proxy, str) and ADDRESS.fullmatch(proxy), "Invalid approval proxyAddress")
        require(nonempty(entry.get("path")), "Missing approval path")
        matches = source_rows(entry, inventories)
        require(len(matches) == 1, "Approval must match exactly one source path/proxy")
        feed = matches[0]
        bounded_price_approved = False
        if "boundedPriceSuitability" in entry:
            suitability = entry["boundedPriceSuitability"]
            require(isinstance(suitability, dict) and suitability.get("decision") == "accepted-for-fixed-buy", "Invalid boundedPriceSuitability decision")
            require(nonempty(suitability.get("evidence")), "Missing boundedPriceSuitability evidence")
            review_date(suitability.get("reviewDate"))
            require(address.lower() == identities["usdTokens"].get(str(chain), "").lower() and denomination == "USD" and entry.get("assetRelationship") in {"exact-asset", "bridged-underlying"}, "boundedPriceSuitability requires fixed buy token, USD quote and exact-asset or reviewed bridged-underlying relationship")
            bounded_price_approved = True
        reason = approval_source_reason(feed, entry, identity, bounded_price_approved=bounded_price_approved)
        require(reason is None, f"Ineligible approved source: {reason}")
        require(feed["docs"]["quoteAsset"] == denomination, "Approval quote differs from source")
        for field in EVIDENCE_FIELDS:
            require(nonempty(entry.get(field)), f"Missing {field}")
        relationship = entry.get("assetRelationship")
        require(relationship in {"exact-asset", "native-wrapper", "bridged-underlying"}, "Unsupported assetRelationship: unreviewed underlying substitutions are not allowed")
        if "representationSuitability" in entry:
            suitability = entry.get("representationSuitability")
            require(relationship == "bridged-underlying" and isinstance(suitability, dict) and suitability.get("decision") == "accepted-underlying-feed", "Invalid representationSuitability decision")
            require(suitability.get("bridgeRisk") == "not-priced-by-feed", "representationSuitability must acknowledge bridge risk is not priced by feed")
            require(nonempty(suitability.get("evidence")), "Missing representationSuitability evidence")
            review_date(suitability.get("reviewDate"))
        require(nonempty(entry.get("assetRelationshipReason")), "Missing assetRelationshipReason")
        if relationship == "native-wrapper":
            require(identity.get("canonicalNativeWrapper") is True and nonempty(identity.get("canonicalNativeWrapperEvidence")), "Native-wrapper requires reviewed canonical identity marker and evidence")
        review_date(entry.get("reviewDate"))
        require(integer(entry.get("maxAgeSeconds"), 1), "Invalid maxAgeSeconds")
        require(entry["maxAgeSeconds"] <= (3 * feed["heartbeat"]) // 2 + 60, "maxAgeSeconds exceeds heartbeat safety cap")
        require(nonempty(entry.get("expectedDescription")), "Missing expectedDescription")
        require(integer(entry.get("expectedDecimals"), 0, MAX_ORACLE_DECIMALS), "Invalid expectedDecimals: handler supports only 0..18")
        if "verificationBatch" not in entry:
            require(key not in batch_routes, "Missing approval verificationBatch for a named sell route")
            require(entry.get("snapshotFingerprint") == snapshot_fingerprint(identity, feed, verification), "Approval snapshot fingerprint changed")
            checked_chain = verification.get("chains", {}).get(str(chain), {})
            validate_observations(identity, feed, entry, verification, checked_chain)
        approvals[key] = dict(entry, tokenAddress=address.lower(), proxyAddress=proxy.lower())
        sources[key] = feed
    for key, entry in approvals.items():
        if "verificationBatch" not in entry:
            continue
        name, timestamp, route = _named_route(entry, batch_routes)
        chain, sell_address, quote = key
        identity = identity_map[chain, sell_address]
        buy_address = identities["usdTokens"].get(str(chain), "").lower()
        require(identity["assetClass"] == "volatile" and sell_address != buy_address, "Named verification batch requires a volatile sell token")
        require((chain, buy_address, "USD") in approvals, "Named sell route requires an approved fixed USD buy feed")
        selected_quote = "ETH" if (chain, sell_address, "ETH") in approvals and (chain, buy_address, "ETH") in approvals else "USD"
        buy_key = (chain, buy_address, selected_quote)
        require(quote == selected_quote and buy_key in approvals, "Named sell route must match the selected fixed buy quote")
        require(entry.get("snapshotFingerprint") == _batch_fingerprint(identity, sources[key], name, timestamp, route), "Approval snapshot fingerprint changed")
        require(no_check_errors(verification) and no_check_errors(route, strict=True), "Verification contains errors or issues")
        validate_leg(route.get("sell"), identity, sources[key], entry)
        validate_leg(route.get("buy"), identity_map[chain, buy_address], sources[buy_key], approvals[buy_key], buy=True)
    if pilot in policy["chains"]:
        require((ROBINHOOD_CHAIN, ROBINHOOD_FIXED_BUY, "USD") in approvals, "Robinhood pilot requires an approved USDG feed")
    return approvals


def build(identities, inventories=None, policy=None, verification=None):
    inventories = read("scripts/catalog-feeds.json") if inventories is None else inventories
    policy = read("scripts/catalog-policy.json") if policy is None else policy
    verification = read(verification_file(policy)) if verification is None else verification
    configured = {int(chain) for chain in policy["chains"]} | TEST_CHAINS
    tokens, audit = [], []
    for identity in identities["tokens"]:
        require(type(identity.get("chainId")) is int and identity["chainId"] in configured, "Unknown identity chain")
        require(identity.get("assetClass") in ASSET_CLASSES, f"Missing or invalid assetClass: {identity.get('symbol')}")
        token = {key: identity[key] for key in ("chainId", "address", "symbol", "name", "decimals", "assetClass")}
        if "classificationReason" in identity:
            token["classificationReason"] = identity["classificationReason"]
        token["address"] = identity["address"].lower()
        token["logoURI"] = identity["localLogo"]
        token["oracles"] = {}
        token["oracleApprovals"] = {}
        tokens.append(token)
    keys = [(token["chainId"], token["address"]) for token in tokens]
    require(len(keys) == len(set(keys)), "Duplicate token contract")
    require(set(identities["usdTokens"]) == {str(chain) for chain in configured}, "Invalid buy-token chain map")
    token_map = dict(zip(keys, tokens))
    for token in tokens:
        require(ADDRESS.fullmatch(token["address"]), "Invalid token contract")
        require(integer(token["decimals"], 0, 36), "Invalid token decimals")
        require(nonempty(token["symbol"]) and nonempty(token["name"]), "Missing token metadata")
    for chain, address in identities["usdTokens"].items():
        require((int(chain), address.lower()) in token_map, f"Missing buy-token metadata: {chain}")
    approvals = approved_feeds(identities, inventories, policy, verification)
    chains = {}
    for chain in sorted(map(int, policy["chains"])):
        execution = policy["chains"][str(chain)]
        buy_address = identities["usdTokens"][str(chain)].lower()
        if execution["status"] == "unavailable":
            chains[str(chain)] = {"status": "unavailable", "unavailableReason": execution["unavailableReason"]}
            continue
        if (chain, buy_address, "USD") not in approvals:
            chains[str(chain)] = {"status": "unavailable", "unavailableReason": "buy-token-has-no-approved-usd-feed"}
            continue
        chains[str(chain)] = {key: execution[key] for key in ("status", "executionEvidence", "arithmeticBoundsEvidence", "reviewDate")}
        buy_quotes = {quote for approved_chain, address, quote in approvals if approved_chain == chain and address == buy_address}
        for (approved_chain, address, denomination), entry in approvals.items():
            if approved_chain == chain and denomination in buy_quotes:
                token = token_map[(chain, address)]
                token["oracles"][denomination] = entry["proxyAddress"]
                token["oracleApprovals"][denomination] = entry
    for chain in sorted(TEST_CHAINS):
        chains[str(chain)] = {"status": "test-only", "unavailableReason": "explicit-test-configuration-outside-production-policy"}
    used = {(token["chainId"], entry["path"], entry["proxyAddress"]) for token in tokens for entry in token["oracleApprovals"].values()}
    for chain, feeds in inventories.items():
        require(chain in policy["chains"], f"Unknown source chain: {chain}")
        for feed in feeds:
            key = (int(chain), feed.get("path"), (feed.get("proxyAddress") or "").lower())
            reason = excluded_reason(feed)
            if key in used:
                reason = "approved"
            elif reason is None:
                reason = "awaiting-approval"
            audit.append({
                "chainId": int(chain), "name": feed.get("name"), "path": feed.get("path"),
                "proxyAddress": feed.get("proxyAddress"), "baseAsset": feed.get("docs", {}).get("baseAsset"),
                "status": "included" if reason == "approved" else "unresolved" if reason == "awaiting-approval" else "excluded",
                "reason": reason,
            })
    tokens.sort(key=lambda token: (token["chainId"], token["symbol"].lower(), token["address"]))
    return {"tokens": tokens, "usdTokens": identities["usdTokens"], "chains": chains}, audit


def sync_snapshot(identities, metadata, *, check=False, reports=None):
    catalog, audit = build(identities=identities)
    path = ROOT / "src/lib/tokenCatalogData.json"
    content = (json.dumps(catalog, indent=2, ensure_ascii=False) + "\n").encode()
    if check:
        require(path.is_file() and path.read_bytes() == content, f"{path.relative_to(ROOT)} differs; run pnpm catalog generate")
    else:
        path.write_bytes(content)
    if reports is not None:
        reports.mkdir(parents=True, exist_ok=True)
        metadata = {
            "schemaVersion": 1,
            "sourceManifest": MANIFEST_PATH,
            "sourceManifestSha256": hashlib.sha256((ROOT / MANIFEST_PATH).read_bytes()).hexdigest(),
            **metadata,
        }
        for name, value in [("catalog-audit.json", audit), ("catalog-metadata-report.json", metadata)]:
            (reports / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Tokens by chain:", dict(sorted(collections.Counter(token["chainId"] for token in catalog["tokens"]).items())))
    print("Feed rows:", len(audit), dict(collections.Counter(row["reason"] for row in audit)))
