#!/usr/bin/env python3
"""Build or check the pinned catalog without network access."""
import argparse
import collections
import datetime
import hashlib
import json
import pathlib
import re

from catalog_metadata import load_identities, load_metadata

ROOT = pathlib.Path(__file__).resolve().parents[1]
ADDRESS = re.compile(r"0x[0-9a-fA-F]{40}")
PRODUCTION_CHAINS = {1, 100, 42161, 8453, 137, 43114, 56, 59144, 9745}
TEST_CHAINS = {11155111}
ASSET_CLASSES = {"volatile", "usd-pegged", "usd-linked", "other-stable", "unknown"}
EVIDENCE_FIELDS = ("identityEvidence", "representationEvidence", "methodologyEvidence", "sourceEvidence")
# The handler can truncate prices with more than 18 decimals to zero.
MAX_ORACLE_DECIMALS = 18


def read(name):
    return json.loads((ROOT / name).read_text())


def require(condition, message):
    if not condition:
        raise ValueError(message)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def integer(value, minimum, maximum=None):
    return type(value) is int and value >= minimum and (maximum is None or value <= maximum)


def round_number(value):
    if isinstance(value, str) and value.isascii() and value.isdecimal():
        return int(value)
    return value if type(value) is int else 0


def no_check_errors(record):
    return not any(value for key, value in record.items() if key.lower().endswith(("error", "errors", "issues")))


def review_date(value):
    require(nonempty(value), "Missing reviewDate")
    try:
        parsed = datetime.date.fromisoformat(value)
    except ValueError as error:
        raise ValueError("Invalid reviewDate") from error
    require(parsed.isoformat() == value and parsed <= datetime.date.today(), "Invalid reviewDate")


def excluded_reason(feed):
    docs = feed.get("docs", {})
    if feed.get("feedCategory") in {"hidden", "deprecating"} or docs.get("hidden") or docs.get("shutdownDate"):
        return "hidden-or-deprecating"
    if not ADDRESS.fullmatch(feed.get("proxyAddress") or ""):
        return "no-onchain-proxy"
    if docs.get("assetClass") != "Crypto":
        return "non-crypto-price-or-data"
    if docs.get("stablecoinCapped"):
        return "bounded-price-methodology-not-approved"
    if feed.get("status") not in {None, "active"}:
        return "inactive-feed"
    if feed.get("feedCategory") != "low":
        return "not-low-risk-category"
    if docs.get("productType") != "Price" or docs.get("attributeType") != "cex_price" or docs.get("productSubType") != "Reference":
        return "not-cex-reference-price"
    if "exchange rate" in feed.get("name", "").lower():
        return "exchange-rate"
    if docs.get("quoteAsset") not in {"ETH", "USD"}:
        return "unsupported-quote"
    if not nonempty(docs.get("baseAsset")) or not nonempty(feed.get("path")):
        return "missing-source-metadata"
    if not integer(feed.get("decimals"), 0, 36) or not integer(feed.get("heartbeat"), 1):
        return "missing-source-metadata"
    return None


def snapshot_fingerprint(identity, feed, verification):
    """Bind review to the complete identity, source row and relevant live observations."""
    chain = verification.get("chains", {}).get(str(identity["chainId"]), {})
    snapshot = {
        "identity": identity,
        "feed": feed,
        "tokenVerification": chain.get("tokens", {}).get(identity["address"].lower()),
        "feedVerification": chain.get("feeds", {}).get(feed["proxyAddress"].lower()),
    }
    encoded = json.dumps(snapshot, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return "sha256:" + hashlib.sha256(encoded).hexdigest()


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
    require(set(chains) == {str(chain) for chain in PRODUCTION_CHAINS}, "Policy must cover exactly the production chains")
    for chain, entry in chains.items():
        require(entry.get("status") in {"approved", "unavailable"}, f"Invalid chain status: {chain}")
        if entry["status"] == "unavailable":
            require(nonempty(entry.get("unavailableReason")), f"Missing unavailableReason: {chain}")
        else:
            require(nonempty(entry.get("executionEvidence")), f"Missing chain executionEvidence: {chain}")
            require(nonempty(entry.get("arithmeticBoundsEvidence")), f"Missing chain arithmeticBoundsEvidence: {chain}")
            review_date(entry.get("reviewDate"))
    require(isinstance(policy.get("approvals"), list), "Missing approvals list")


def approved_feeds(identities, inventories, policy, verification):
    validate_policy(policy)
    identity_map = {(item["chainId"], item["address"].lower()): item for item in identities["tokens"]}
    approvals = {}
    for entry in policy["approvals"]:
        chain = entry.get("chainId")
        address = entry.get("tokenAddress", "")
        require(type(chain) is int and chain in PRODUCTION_CHAINS, "Unknown approval chain")
        require(isinstance(address, str) and ADDRESS.fullmatch(address), "Invalid approval tokenAddress")
        identity = identity_map.get((chain, address.lower()))
        require(identity is not None, "Unknown approval token")
        require(identity.get("assetClass") in ASSET_CLASSES - {"unknown"}, "Unclassified approval token")
        denomination = entry.get("quote")
        require(denomination in {"USD", "ETH"}, "Unsupported approval quote")
        key = (chain, address.lower(), denomination)
        require(key not in approvals, "Duplicate token/quote approval")
        require(policy["chains"][str(chain)]["status"] == "approved", "Approval requires chain execution approval")
        proxy = entry.get("proxyAddress", "")
        require(isinstance(proxy, str) and ADDRESS.fullmatch(proxy), "Invalid approval proxyAddress")
        require(nonempty(entry.get("path")), "Missing approval path")
        matches = [feed for feed in inventories.get(str(chain), []) if feed.get("path") == entry["path"] and (feed.get("proxyAddress") or "").lower() == proxy.lower()]
        require(len(matches) == 1, "Approval must match exactly one source path/proxy")
        feed = matches[0]
        reason = excluded_reason(feed)
        require(reason is None, f"Ineligible approved source: {reason}")
        require(feed["docs"]["quoteAsset"] == denomination, "Approval quote differs from source")
        for field in EVIDENCE_FIELDS:
            require(nonempty(entry.get(field)), f"Missing {field}")
        relationship = entry.get("assetRelationship")
        require(relationship in {"exact-asset", "native-wrapper"}, "Unsupported assetRelationship: underlying substitutions are not allowed")
        require(nonempty(entry.get("assetRelationshipReason")), "Missing assetRelationshipReason")
        if relationship == "native-wrapper":
            require(identity.get("canonicalNativeWrapper") is True and nonempty(identity.get("canonicalNativeWrapperEvidence")), "Native-wrapper requires reviewed canonical identity marker and evidence")
        review_date(entry.get("reviewDate"))
        require(integer(entry.get("maxAgeSeconds"), 1), "Invalid maxAgeSeconds")
        require(entry["maxAgeSeconds"] <= (3 * feed["heartbeat"]) // 2 + 60, "maxAgeSeconds exceeds heartbeat safety cap")
        require(nonempty(entry.get("expectedDescription")), "Missing expectedDescription")
        require(integer(entry.get("expectedDecimals"), 0, MAX_ORACLE_DECIMALS), "Invalid expectedDecimals: handler supports only 0..18")
        require(entry.get("snapshotFingerprint") == snapshot_fingerprint(identity, feed, verification), "Approval snapshot fingerprint changed")
        checked_chain = verification.get("chains", {}).get(str(chain), {})
        checked_token = checked_chain.get("tokens", {}).get(address.lower(), {})
        observed = checked_chain.get("feeds", {}).get(proxy.lower(), {})
        require(checked_chain.get("issues") == [] and all(no_check_errors(record) for record in (verification, checked_chain, checked_token, observed)), "Verification contains errors or issues")
        require(checked_token.get("decimals") == identity["decimals"] and checked_token.get("symbol") == identity["symbol"], "Token verification metadata differs")
        round_id, answered_in_round = round_number(observed.get("roundId")), round_number(observed.get("answeredInRound"))
        require(round_id > 0 and answered_in_round >= round_id, "Incomplete verified feed round")
        require(observed.get("description") == entry["expectedDescription"], "Feed description differs")
        require(observed.get("decimals") == entry["expectedDecimals"] == feed["decimals"], "Feed decimals differ")
        try:
            answer = int(observed.get("answer", ""))
        except (ValueError, TypeError):
            answer = 0
        require(answer > 0, "Feed answer must be positive")
        updated, timestamp = observed.get("updatedAt"), observed.get("observedAt")
        require(integer(updated, 1) and integer(timestamp, 1) and updated <= timestamp, "Invalid feed timestamps")
        age = timestamp - updated
        require(age <= entry["maxAgeSeconds"] and observed.get("ageSeconds") == age, "Feed snapshot exceeds maxAgeSeconds")
        require(observed.get("heartbeat") == feed["heartbeat"], "Feed heartbeat differs")
        approvals[key] = dict(entry, tokenAddress=address.lower(), proxyAddress=proxy.lower())
    return approvals


def build(identities=None, inventories=None, policy=None, verification=None):
    identities = load_identities(ROOT) if identities is None else identities
    inventories = read("scripts/catalog-feeds.json") if inventories is None else inventories
    policy = read("scripts/catalog-policy.json") if policy is None else policy
    verification = read(verification_file(policy)) if verification is None else verification
    tokens, audit = [], []
    for identity in identities["tokens"]:
        require(type(identity.get("chainId")) is int and identity["chainId"] in PRODUCTION_CHAINS | TEST_CHAINS, "Unknown identity chain")
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
    require(set(identities["usdTokens"]) == {str(chain) for chain in PRODUCTION_CHAINS | TEST_CHAINS}, "Invalid buy-token chain map")
    token_map = dict(zip(keys, tokens))
    for identity, token in zip(identities["tokens"], tokens):
        require(ADDRESS.fullmatch(token["address"]), "Invalid token contract")
        require(integer(token["decimals"], 0, 36), "Invalid token decimals")
        require(nonempty(token["symbol"]) and nonempty(token["name"]), "Missing token metadata")
        image = ROOT / "public" / token["logoURI"].lstrip("/")
        require(image.is_file() and 100 < image.stat().st_size <= 4 * 1024 * 1024, f"Missing or oversized logo: {image}")
        require(re.fullmatch(r"[0-9a-f]{64}", identity.get("logoSha256", "")), "Missing logoSha256")
        require(hashlib.sha256(image.read_bytes()).hexdigest() == identity["logoSha256"], f"Logo digest differs: {image}")
    for chain, address in identities["usdTokens"].items():
        require((int(chain), address.lower()) in token_map, f"Missing buy-token metadata: {chain}")
    approvals = approved_feeds(identities, inventories, policy, verification)
    chains = {}
    for chain in sorted(PRODUCTION_CHAINS):
        execution = policy["chains"][str(chain)]
        buy_address = identities["usdTokens"][str(chain)].lower()
        if execution["status"] != "approved":
            chains[str(chain)] = {"status": "unavailable", "unavailableReason": execution["unavailableReason"]}
            continue
        if (chain, buy_address, "USD") not in approvals:
            chains[str(chain)] = {"status": "unavailable", "unavailableReason": "buy-token-has-no-approved-usd-feed"}
            continue
        chains[str(chain)] = {"status": "approved"}
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
        require(int(chain) in PRODUCTION_CHAINS, f"Unknown source chain: {chain}")
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    output_mode = parser.add_mutually_exclusive_group()
    output_mode.add_argument("--check", action="store_true", help="Check the runtime snapshot without changing files")
    output_mode.add_argument("--reports", type=pathlib.Path, help="Also write optional audit and metadata reports to this directory")
    parser.add_argument("--cache-dir", type=pathlib.Path, help="Read pinned source bytes from this cache")
    args = parser.parse_args()
    identities, metadata = load_metadata(ROOT, args.cache_dir)
    manifest_path = "scripts/catalog-metadata-sources.json"
    metadata = {
        "schemaVersion": 1,
        "sourceManifest": manifest_path,
        "sourceManifestSha256": hashlib.sha256((ROOT / manifest_path).read_bytes()).hexdigest(),
        **metadata,
    }
    catalog, audit = build(identities=identities)
    outputs = [(ROOT / "src/lib/tokenCatalogData.json", catalog)]
    if args.reports is not None:
        args.reports.mkdir(parents=True, exist_ok=True)
        outputs.extend([(args.reports / "catalog-audit.json", audit), (args.reports / "catalog-metadata-report.json", metadata)])
    for path, value in outputs:
        content = json.dumps(value, indent=2, ensure_ascii=False) + "\n"
        if args.check:
            require(path.is_file() and path.read_text() == content, f"Run python3 scripts/catalog.py: {path.relative_to(ROOT)} differs")
        else:
            path.write_text(content)
    print("Metadata:", metadata["summary"])
    print("Tokens by chain:", dict(sorted(collections.Counter(token["chainId"] for token in catalog["tokens"]).items())))
    print("Feed rows:", len(audit), dict(collections.Counter(row["reason"] for row in audit)))


if __name__ == "__main__":
    main()
