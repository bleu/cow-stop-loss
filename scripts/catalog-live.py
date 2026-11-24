#!/usr/bin/env python3
"""Read live token metadata and price-feed state; never send transactions."""
import argparse
import collections
import concurrent.futures
import copy
import datetime
import json
import os
import pathlib
import subprocess
import tempfile
import time

from catalog_observations import (
    ADDRESS, MAX_ORACLE_DECIMALS, approval_key, approval_pin, checked_at, integer,
    no_check_errors, nonempty, require, source_rows, validate_leg,
)

ROOT = pathlib.Path(__file__).resolve().parents[1]
RPCS = {
    1: "https://ethereum-rpc.publicnode.com",
    100: "https://gnosis-rpc.publicnode.com",
    42161: "https://arbitrum-one-rpc.publicnode.com",
    8453: "https://base-rpc.publicnode.com",
    137: "https://polygon-bor-rpc.publicnode.com",
    43114: "https://avalanche-c-chain-rpc.publicnode.com",
    56: "https://bsc-rpc.publicnode.com",
    59144: "https://rpc.linea.build",
    9745: "https://rpc.plasma.to",
    4663: "https://rpc.mainnet.chain.robinhood.com",
}


def rpc(chain, calls):
    endpoint = os.getenv(f"CATALOG_RPC_{chain}", RPCS[chain])
    payload = [{"jsonrpc": "2.0", "id": index, "method": "eth_call", "params": [{"to": address, "data": selector}, "latest"]} for index, (address, selector) in enumerate(calls)]
    payload.append({"jsonrpc": "2.0", "id": len(calls), "method": "eth_chainId", "params": []})
    with tempfile.NamedTemporaryFile(mode="w") as source:
        json.dump(payload, source)
        source.flush()
        result = subprocess.run(["curl", "-Lsf", "--retry", "2", "--max-time", "90", endpoint, "-H", "Content-Type: application/json", "--data-binary", "@" + source.name], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f"RPC {chain}: {result.stderr}")
    replies = json.loads(result.stdout)
    if not isinstance(replies, list):
        raise RuntimeError(f"RPC {chain}: {replies}")
    by_id = {}
    for reply in replies:
        response_id = reply.get("id") if isinstance(reply, dict) else None
        require(integer(response_id, 0, len(calls)) and response_id not in by_id, f"RPC {chain}: unexpected or duplicate response ID")
        by_id[response_id] = reply
    chain_reply = by_id.get(len(calls), {})
    actual = chain_reply.get("result")
    require("error" not in chain_reply and isinstance(actual, str) and int(actual, 16) == chain, "RPC chain ID differs")
    return [by_id.get(index, {"error": "missing response"}) for index in range(len(calls))]


def text(value):
    raw = bytes.fromhex(value[2:])
    if len(raw) == 32:
        return raw.rstrip(b"\0").decode()
    offset = int.from_bytes(raw[:32], "big")
    length = int.from_bytes(raw[offset:offset + 32], "big")
    return raw[offset + 32:offset + 32 + length].decode()


def verify_chain(item, *, inventories=None):
    chain, tokens = item
    if inventories is None:
        inventories = json.loads((ROOT / "scripts/catalog-feeds.json").read_text())
    requests, labels = [], []
    feeds = {}
    for token in tokens:
        token_fields = [("decimals", "0x313ce567"), ("symbol", "0x95d89b41")]
        if "robinhoodStockToken" in token:
            token_fields.append(("uid", "0xf514ce36"))
        for label, selector in token_fields:
            requests.append((token["address"], selector))
            labels.append(("token", token["address"], label))
        for quote, address in token["oracles"].items():
            approval = token.get("oracleApprovals", {}).get(quote)
            if not approval or approval.get("proxyAddress", "").lower() != address.lower():
                raise ValueError(f"Missing exact feed approval: {chain}/{token['address']}/{quote}")
            if address in feeds:
                previous = feeds[address]
                if any(previous.get(key) != approval.get(key) for key in ("expectedDescription", "expectedDecimals")):
                    raise ValueError(f"Conflicting feed approvals: {address}")
                approval = {**approval, "maxAgeSeconds": min(previous["maxAgeSeconds"], approval["maxAgeSeconds"])}
            feeds[address] = approval
    for address in feeds:
        for label, selector in [("description", "0x7284e416"), ("decimals", "0x313ce567"), ("round", "0xfeaf968c")]:
            requests.append((address, selector))
            labels.append(("feed", address, label))
    records = {"tokens": {}, "feeds": {}}
    batch_size = 10 if chain == 9745 else 40
    for start in range(0, len(requests), batch_size):
        batch = requests[start:start + batch_size]
        responses = rpc(chain, batch)
        require(len(responses) == len(batch), f"RPC {chain}: incomplete response coverage")
        for (kind, address, field), response in zip(labels[start:start + batch_size], responses):
            record = records[kind + "s"].setdefault(address, {})
            try:
                require("error" not in response, "RPC call failed")
                value = response["result"]
                if field in {"symbol", "description"}:
                    record[field] = text(value)
                elif field == "decimals":
                    record[field] = int(value, 16)
                elif field == "uid":
                    record[field] = value.lower()
                else:
                    raw = bytes.fromhex(value[2:])
                    require(len(raw) == 160, "Incomplete latestRoundData")
                    record["roundId"] = str(int.from_bytes(raw[:32], "big"))
                    record["answer"] = str(int.from_bytes(raw[32:64], "big", signed=True))
                    record["updatedAt"] = int.from_bytes(raw[96:128], "big")
                    record["answeredInRound"] = str(int.from_bytes(raw[128:160], "big"))
                    require(int(record["answer"]) > 0 and record["updatedAt"] > 0, "Invalid round")
                    require(int(record["roundId"]) > 0 and int(record["answeredInRound"]) >= int(record["roundId"]), "Incomplete round")
            except Exception as error:
                record[field + "Error"] = str(response.get("error", error) if isinstance(response, dict) else error)
    issues = []
    for token in tokens:
        live = records["tokens"][token["address"]]
        if live.get("decimals") != token["decimals"]:
            issues.append(f"{token['symbol']} decimals: catalog={token['decimals']} live={live}")
        if live.get("symbol") != token["symbol"]:
            issues.append(f"Token symbol differs: {token['address']}: expected={token['symbol']} live={live}")
        if "robinhoodStockToken" in token and live.get("uid") != token["robinhoodStockToken"]["uid"]:
            issues.append(f"Token issuer UID differs: {token['address']}: {live}")
    for address, feed in records["feeds"].items():
        approval = feeds[address]
        matches = source_rows({**approval, "chainId": chain}, inventories)
        require(len(matches) == 1, f"Verification requires exactly one inventory path/proxy: {chain}/{address}")
        feed["heartbeat"] = matches[0].get("heartbeat")
        feed["observedAt"] = int(time.time())
        feed["ageSeconds"] = feed["observedAt"] - feed.get("updatedAt", 0)
        if any(key.endswith("Error") for key in feed):
            issues.append(f"Feed {address}: {feed}")
        elif feed.get("description") != approval["expectedDescription"]:
            issues.append(f"Feed description differs: {address}: {feed}")
        elif feed.get("decimals") != approval["expectedDecimals"]:
            issues.append(f"Feed decimals differ: {address}: {feed}")
        elif not feed["heartbeat"]:
            issues.append(f"Feed has no published heartbeat: {address}")
        elif feed["ageSeconds"] > approval["maxAgeSeconds"] or feed["ageSeconds"] < 0:
            issues.append(f"Feed is outside its approved freshness limit: {address}: {feed}")
    print(f"{chain}: {len(tokens)} tokens, {len(feeds)} feeds, {len(issues)} issues", flush=True)
    return str(chain), {**records, "issues": issues}


def candidate_tokens(policy, tokens, inventories):
    """Prepare proposed exact mappings for observation, without approving them."""
    selected = {}
    for approval in policy.get("approvals", []):
        chain, address, denomination = approval_key(approval)
        require(chain in RPCS, "Invalid candidate chain or quote")
        proxy = approval.get("proxyAddress")
        require(isinstance(proxy, str) and ADDRESS.fullmatch(proxy) and nonempty(approval.get("path")), "Candidate must match an exact known token and source path/proxy/quote")
        tokens_at_address = [item for item in tokens if item["chainId"] == chain and item["address"].lower() == address]
        matches = [feed for feed in source_rows(approval, inventories) if feed.get("docs", {}).get("quoteAsset") == denomination]
        require(len(tokens_at_address) == len(matches) == 1, "Candidate must match an exact known token and source path/proxy/quote")
        require(nonempty(approval.get("expectedDescription")) and integer(approval.get("expectedDecimals"), 0, MAX_ORACLE_DECIMALS) and integer(approval.get("maxAgeSeconds"), 1), "Candidate requires expected description, decimals and freshness limit")
        entry = selected.setdefault((chain, address), {**tokens_at_address[0], "address": address, "oracles": {}, "oracleApprovals": {}})
        require(denomination not in entry["oracles"], "Duplicate candidate token/quote")
        entry["oracles"][denomination] = proxy.lower()
        entry["oracleApprovals"][denomination] = approval
    return list(selected.values())


def _candidate_leg(approval, tokens, inventories):
    token, = candidate_tokens({"approvals": [approval]}, tokens, inventories)
    matches = source_rows(approval, inventories)
    require(len(matches) == 1, "Candidate requires exactly one inventory path/proxy")
    feed = matches[0]
    require(nonempty(token.get("symbol")) and integer(token.get("decimals"), 0, 36), "Invalid resolved token metadata")
    require(integer(feed.get("decimals"), 0, MAX_ORACLE_DECIMALS) and feed["decimals"] == approval["expectedDecimals"], "Candidate decimals differ from source")
    require(integer(feed.get("heartbeat"), 1) and approval["maxAgeSeconds"] <= (3 * feed["heartbeat"]) // 2 + 60, "Candidate freshness limit exceeds source heartbeat cap")
    return approval, token, feed


def _candidate_plan(sells, buy_approvals, tokens, inventories):
    buy_slots = collections.defaultdict(list)
    for buy in buy_approvals:
        chain, _, quote = approval_key(buy)
        buy_slots[chain, quote].append(buy)
    sell_keys = collections.Counter()
    for sell in sells:
        try:
            sell_keys[approval_key(sell)] += 1
        except ValueError:
            pass
    routes, rejected = [], []
    for sell in sells:
        try:
            chain, address, quote = approval_key(sell)
            require(sell_keys[chain, address, quote] == 1, "Duplicate candidate sell token/quote")
            sell_leg = _candidate_leg(sell, tokens, inventories)
            require(sell_leg[1].get("assetClass") == "volatile", "Candidate sell must be volatile")
            expected = buy_slots[chain, quote]
            require(len(expected) == 1, "Missing or ambiguous expected buy approval for candidate chain/quote")
            buy = expected[0]
            require(approval_key(buy)[1] != address, "Candidate sell is the expected buy token")
            routes.append((sell_leg, _candidate_leg(buy, tokens, inventories)))
        except ValueError as error:
            rejected.append((sell, str(error)))
    return routes, rejected


def _observe_candidate(leg, inventories, *, buy):
    approval, token, feed = leg
    chain = approval["chainId"]
    result = {"approval": approval_pin(approval, buy=buy)}
    try:
        key, observation = verify_chain((chain, [token]), inventories=inventories)
        require(key == str(chain), "Verification returned the wrong chain ID")
        result["observation"] = {"chainId": chain, **observation}
        validate_leg(result, token, feed, approval, buy=buy)
    except Exception as error:
        result["error"] = str(error) or type(error).__name__
    return result


def _observe_sells(sells, inventories):
    return [_observe_candidate(sell, inventories, buy=False) for sell in sells]


def verify_candidate_routes(sells, buy_approvals, tokens, inventories):
    """Read staged routes. A shared buy leg is checked once before its sells."""
    routes, _ = _candidate_plan(sells, buy_approvals, tokens, inventories)
    buys = {approval_key(buy[0]): buy for _, buy in routes}
    with concurrent.futures.ThreadPoolExecutor(max_workers=9) as pool:
        buy_futures = {key: pool.submit(_observe_candidate, buy, inventories, buy=True) for key, buy in buys.items()}
        buy_results = {key: future.result() for key, future in buy_futures.items()}
        sell_groups = collections.defaultdict(list)
        for sell, buy in routes:
            if no_check_errors(buy_results[approval_key(buy[0])]):
                sell_groups[sell[0]["chainId"]].append(sell)
        sell_futures = [pool.submit(_observe_sells, group[offset::2], inventories)
                        for offset in range(2) for group in sell_groups.values() if offset < len(group)]
        sell_results = [result for future in sell_futures for result in future.result()]
    return {
        "checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "scope": "candidate-route-review", "status": "checked" if buys else "not-performed",
        "buyLegs": list(buy_results.values()), "sellLegs": sell_results,
    }


def _report_legs(report, field, expected):
    legs, indexed = report.get(field), {}
    require(isinstance(legs, list), f"Missing candidate report {field}")
    for leg in legs:
        require(isinstance(leg, dict), f"Invalid candidate report {field}")
        key = approval_key(leg.get("approval"))
        require(key in expected and key not in indexed, f"Unexpected or duplicate candidate report {field}: {key}")
        indexed[key] = leg
    return indexed


def _reported_routes(sells, buy_approvals, tokens, inventories, report):
    routes, rejected = _candidate_plan(sells, buy_approvals, tokens, inventories)
    try:
        require(no_check_errors(report, strict=True) and report.get("scope") == "candidate-route-review" and report.get("status") == "checked", "Candidate route observations were not checked")
        checked_at(report.get("checkedAt"))
        buys = _report_legs(report, "buyLegs", {approval_key(buy[0]) for _, buy in routes})
        sells = _report_legs(report, "sellLegs", {approval_key(sell[0]) for sell, _ in routes})
    except ValueError as error:
        return [], rejected + [(sell[0], str(error)) for sell, _ in routes]
    passed = []
    for sell, buy in routes:
        pair = {}
        for role, (approval, token, feed), observed in (("buy", buy, buys), ("sell", sell, sells)):
            leg = observed.get(approval_key(approval))
            try:
                validate_leg(leg, token, feed, approval, buy=role == "buy")
            except ValueError as error:
                observation = leg.get("observation") if isinstance(leg, dict) else None
                issues = observation.get("issues") if isinstance(observation, dict) else None
                details = ": " + "; ".join(map(str, issues)) if isinstance(issues, list) and issues else ""
                rejected.append((sell[0], f"{role} leg: {error}{details}"))
                break
            pair[role] = leg
        else:
            passed.append((sell[0], pair))
    return passed, rejected


def candidate_route_results(sells, buy_approvals, tokens, inventories, report):
    """Return passing sell approvals and (sell approval, reason) rejections."""
    passed, rejected = _reported_routes(sells, buy_approvals, tokens, inventories, report)
    return [sell for sell, _ in passed], rejected


def candidate_observation_batch(sells, buy_approvals, tokens, inventories, report):
    """Pin only passing routes from a report for the full candidate set."""
    passed, _ = _reported_routes(sells, buy_approvals, tokens, inventories, report)
    require(passed, "No passing candidate routes to pin")
    return {"checkedAt": report["checkedAt"], "routes": copy.deepcopy([pair for _, pair in passed])}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=pathlib.Path, required=True, help="Write read-only verification evidence outside the app catalog")
    parser.add_argument("--candidates", type=pathlib.Path, help="Observe proposed policy mappings before approval; this does not approve routes")
    args = parser.parse_args()
    data = json.loads((ROOT / "src/lib/tokenCatalogData.json").read_text())
    scope = "candidate-review" if args.candidates else "approved-feeds"
    if args.candidates:
        policy = json.loads(args.candidates.read_text())
        inventory = json.loads((ROOT / "scripts/catalog-feeds.json").read_text())
        data["tokens"] = candidate_tokens(policy, data["tokens"], inventory)
    grouped = {chain: [token for token in data["tokens"] if token["chainId"] == chain and token.get("oracles")] for chain in RPCS}
    skipped = {str(chain): "No selected production feeds; live verification was not performed" for chain, tokens in grouped.items() if not tokens}
    grouped = {chain: tokens for chain, tokens in grouped.items() if tokens}
    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=9) as pool:
        futures = {pool.submit(verify_chain, item): item[0] for item in grouped.items()}
        for future in concurrent.futures.as_completed(futures):
            chain = futures[future]
            try:
                key, result = future.result()
                results[key] = result
            except Exception as error:
                results[str(chain)] = {"issues": [str(error)]}
                print(f"{chain}: {error}", flush=True)
    args.output.write_text(json.dumps({"checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "scope": scope, "status": "checked" if results else "not-performed", "chains": results, "skippedChains": skipped}, indent=2) + "\n")
    if not results:
        print("No selected production feeds. No live token/feed checks were performed.", flush=True)
    if any(result["issues"] for result in results.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
