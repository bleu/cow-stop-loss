#!/usr/bin/env python3
"""Read live token metadata and price-feed state; never send transactions."""
import argparse
import concurrent.futures
import datetime
import json
import os
import pathlib
import subprocess
import tempfile
import time

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
    by_id = {reply["id"]: reply for reply in replies}
    assert int(by_id[len(calls)]["result"], 16) == chain, "RPC chain ID differs"
    return [by_id.get(index, {"error": "missing response"}) for index in range(len(calls))]


def text(value):
    raw = bytes.fromhex(value[2:])
    if len(raw) == 32:
        return raw.rstrip(b"\0").decode()
    offset = int.from_bytes(raw[:32], "big")
    length = int.from_bytes(raw[offset:offset + 32], "big")
    return raw[offset + 32:offset + 32 + length].decode()


def verify_chain(item):
    chain, tokens = item
    requests, labels = [], []
    feeds = {}
    for token in tokens:
        for label, selector in [("decimals", "0x313ce567"), ("symbol", "0x95d89b41")]:
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
        responses = rpc(chain, requests[start:start + batch_size])
        for (kind, address, field), response in zip(labels[start:start + batch_size], responses):
            record = records[kind + "s"].setdefault(address, {})
            try:
                value = response["result"]
                if field in {"symbol", "description"}:
                    record[field] = text(value)
                elif field == "decimals":
                    record[field] = int(value, 16)
                else:
                    raw = bytes.fromhex(value[2:])
                    assert len(raw) >= 160, "Incomplete latestRoundData"
                    record["roundId"] = str(int.from_bytes(raw[:32], "big"))
                    record["answer"] = str(int.from_bytes(raw[32:64], "big", signed=True))
                    record["updatedAt"] = int.from_bytes(raw[96:128], "big")
                    record["answeredInRound"] = str(int.from_bytes(raw[128:160], "big"))
                    assert int(record["answer"]) > 0 and record["updatedAt"] > 0, "Invalid round"
                    assert int(record["roundId"]) > 0 and int(record["answeredInRound"]) >= int(record["roundId"]), "Incomplete round"
            except Exception as error:
                record[field + "Error"] = str(response.get("error", error))
    issues = []
    for token in tokens:
        live = records["tokens"][token["address"]]
        if live.get("decimals") != token["decimals"]:
            issues.append(f"{token['symbol']} decimals: catalog={token['decimals']} live={live}")
        if live.get("symbol") != token["symbol"]:
            issues.append(f"Token symbol differs: {token['address']}: expected={token['symbol']} live={live}")
    inventory = json.loads((ROOT / "scripts/catalog-feeds.json").read_text())[str(chain)]
    for address, feed in records["feeds"].items():
        approval = feeds[address]
        metadata = next(item for item in inventory if item["path"] == approval["path"] and (item.get("proxyAddress") or "").lower() == address.lower())
        feed["heartbeat"] = metadata.get("heartbeat")
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
        chain = approval.get("chainId")
        address = approval.get("tokenAddress", "").lower()
        denomination = approval.get("quote")
        if chain not in RPCS or denomination not in {"ETH", "USD"}:
            raise ValueError("Invalid candidate chain or quote")
        token = next((item for item in tokens if item["chainId"] == chain and item["address"].lower() == address), None)
        matches = [feed for feed in inventories.get(str(chain), []) if feed.get("path") == approval.get("path") and (feed.get("proxyAddress") or "").lower() == approval.get("proxyAddress", "").lower() and feed.get("docs", {}).get("quoteAsset") == denomination]
        if token is None or len(matches) != 1:
            raise ValueError("Candidate must match an exact known token and source path/proxy/quote")
        if not isinstance(approval.get("expectedDescription"), str) or not approval["expectedDescription"] or type(approval.get("expectedDecimals")) is not int or not 0 <= approval["expectedDecimals"] <= 18 or type(approval.get("maxAgeSeconds")) is not int or approval["maxAgeSeconds"] <= 0:
            raise ValueError("Candidate requires expected description, decimals and freshness limit")
        entry = selected.setdefault((chain, address), {**token, "oracles": {}, "oracleApprovals": {}})
        if denomination in entry["oracles"]:
            raise ValueError("Duplicate candidate token/quote")
        entry["oracles"][denomination] = approval["proxyAddress"].lower()
        entry["oracleApprovals"][denomination] = approval
    return list(selected.values())


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
