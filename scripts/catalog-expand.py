#!/usr/bin/env python3
"""Screen official directories and stage verified sell routes for the pinned catalog."""
import argparse
import concurrent.futures
import datetime
import hashlib
import importlib.util
import json
import pathlib
import re
import urllib.request
from collections import Counter, defaultdict

import catalog
import catalog_metadata as metadata

ROOT = pathlib.Path(__file__).resolve().parents[1]
CHAINS = sorted(catalog.PRODUCTION_CHAINS)
DIRECTORY_URL = re.compile(r"https://reference-data-directory\.vercel\.app/feeds-[a-z0-9-]+\.json")


def load_script(name):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), ROOT / f"scripts/{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def read(name):
    return metadata.read_json(ROOT / f"scripts/catalog-{name}.json")


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def source_urls():
    entries = read("sources")["feedSources"]
    return {str(chain): entries[str(chain)]["url"] for chain in CHAINS}


def parse_directory(data, chain):
    rows = json.loads(data)
    catalog.require(isinstance(rows, list) and bool(rows) and all(isinstance(row, dict) for row in rows), f"Invalid directory: {chain}")
    return rows


def fetch_directory(item):
    chain, url = item
    catalog.require(DIRECTORY_URL.fullmatch(url) is not None, f"Unknown directory URL: {url}")
    opener = urllib.request.build_opener(metadata.PinnedRedirectHandler())
    with opener.open(url, timeout=30) as response:
        data = response.read(metadata.MAX_BYTES + 1)
    catalog.require(len(data) <= metadata.MAX_BYTES, f"Directory exceeds byte limit: {chain}")
    return chain, data, {"url": url, "retrievedAt": now(), "sha256": hashlib.sha256(data).hexdigest()}


def discovery_tokens():
    manifest = read("metadata-sources")
    documents = metadata.fetch_sources(ROOT)
    curated, _ = metadata.resolve_metadata(read("identities"), manifest, read("metadata-overrides"), documents)
    tokens = {(item["chainId"], item["address"].lower()): item for item in curated["tokens"]}
    for source in manifest["sources"]:
        for (chain, address), display in metadata.index_document(documents[source["id"]], source).items():
            tokens.setdefault((chain, address), {**display, "assetClass": "unknown"})
    return tokens


def screen_directories(directories, tokens, approvals):
    approved = {(entry["chainId"], entry["tokenAddress"].lower()) for entry in approvals}
    hints = defaultdict(set)
    for (chain, address), token in tokens.items():
        for value in (token["symbol"], token["name"]):
            hints[chain, value.casefold()].add(address)
    report, matched = {}, defaultdict(set)
    for chain, rows in directories.items():
        report[chain] = []
        for row in rows:
            docs = row.get("docs", {})
            reason = catalog.excluded_reason(row)
            if reason is None:
                if docs["quoteAsset"] != "USD":
                    reason = "no-fixed-buy-in-quote"
                elif row["decimals"] > catalog.MAX_ORACLE_DECIMALS:
                    reason = "unsupported-feed-decimals"
                else:
                    reason = "needs-exact-evidence"
            result = {"path": row.get("path"), "name": row.get("name"), "proxyAddress": row.get("proxyAddress"), "reason": reason}
            if reason == "needs-exact-evidence":
                addresses = set()
                for value in (docs.get("baseAsset"), row.get("assetName")):
                    if isinstance(value, str):
                        addresses.update(hints[int(chain), value.casefold()])
                result["tokenHints"] = [
                    {"address": address, "assetClass": tokens[int(chain), address]["assetClass"], "alreadyApproved": (int(chain), address) in approved}
                    for address in sorted(addresses)
                ]
                for address in addresses:
                    matched[int(chain), address].add(row["path"])
            report[chain].append(result)
    volatile = [
        {"chainId": chain, "address": address, "symbol": token["symbol"], "sourceHints": sorted(matched[chain, address])}
        for (chain, address), token in sorted(tokens.items())
        if chain in CHAINS and token["assetClass"] == "volatile" and (chain, address) not in approved
    ]
    return report, volatile


def scan(output):
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(CHAINS)) as pool:
        snapshots = list(pool.map(fetch_directory, source_urls().items()))
    directories = {chain: parse_directory(data, chain) for chain, data, _ in snapshots}
    report, volatile = screen_directories(directories, discovery_tokens(), read("policy")["approvals"])
    output.mkdir(parents=True, exist_ok=False)
    for chain, data, _ in snapshots:
        (output / f"{chain}.json").write_bytes(data)
    write(output / "sources.json", {chain: entry for chain, _, entry in snapshots})
    write(output / "screening.json", report)
    write(output / "unapproved-volatile.json", volatile)
    for chain, rows in report.items():
        print(f"{chain}: {len(rows)} directory rows, {sum(row['reason'] == 'needs-exact-evidence' for row in rows)} eligible USD source rows")
    print(f"{len(volatile)} known volatile tokens without approved feeds")


def read_snapshot(directory):
    sources = metadata.read_json(directory / "sources.json")
    urls = source_urls()
    catalog.require(set(sources) == set(urls), "Snapshot must cover every production chain")
    inventories = {}
    for chain, url in urls.items():
        entry = sources[chain]
        data = (directory / f"{chain}.json").read_bytes()
        catalog.require(entry["url"] == url and entry["sha256"] == hashlib.sha256(data).hexdigest(), f"Snapshot source changed: {chain}")
        inventories[chain] = parse_directory(data, chain)
    return sources, inventories


def route_key(entry):
    chain, address = metadata.token_key({"chainId": entry.get("chainId"), "address": entry.get("tokenAddress")}, "sell evidence")
    catalog.require(chain in CHAINS and entry.get("quote") == "USD", "Expected a production USD sell mapping")
    return chain, address, entry["quote"]


def source_key(entry):
    return entry.get("path"), (entry.get("proxyAddress") or "").lower()


def primary_row(rows, entry, *, fixed_buy=False):
    eligible = [row for row in rows if row.get("path") == entry.get("path")
                and catalog.excluded_reason(row, bounded_price_approved=fixed_buy and "boundedPriceSuitability" in entry) is None]
    catalog.require(len(eligible) == 1 and source_key(eligible[0]) == source_key(entry), "Missing or ambiguous primary source")
    row = eligible[0]
    catalog.require(row["docs"]["quoteAsset"] == entry["quote"], "Feed quote differs from the route quote")
    catalog.require(row["decimals"] == entry.get("expectedDecimals") and catalog.integer(row["decimals"], 0, catalog.MAX_ORACLE_DECIMALS), "Unsupported or mismatched feed decimals")
    catalog.require(catalog.integer(entry.get("maxAgeSeconds"), 1, 3 * row["heartbeat"] // 2 + 60), "Feed age ceiling exceeds the heartbeat limit")
    return row


def check_sell(entry, identity, fixed_buy):
    catalog.require(identity["assetClass"] == "volatile" and identity["address"].lower() != fixed_buy["tokenAddress"].lower(), "Not a volatile sell token")
    catalog.require(entry.get("assetRelationship") in {"exact-asset", "native-wrapper", "bridged-underlying"}, "Unsupported token representation")
    if entry["assetRelationship"] == "native-wrapper":
        catalog.require(identity.get("canonicalNativeWrapper") is True and catalog.nonempty(identity.get("canonicalNativeWrapperEvidence")), "Missing canonical wrapper evidence")
    for field in (*catalog.EVIDENCE_FIELDS, "assetRelationshipReason", "expectedDescription"):
        catalog.require(catalog.nonempty(entry.get(field)), f"Missing {field}")
    catalog.require("boundedPriceSuitability" not in entry, "A bounded sell feed cannot be approved")
    catalog.review_date(entry.get("reviewDate"))


def evidence_index(items, key):
    indexed = {}
    for item in items:
        item_key = key(item)
        catalog.require(item_key not in indexed, f"Duplicate evidence: {item_key}")
        indexed[item_key] = item
    return indexed


def stage_identities(inputs, output, rejections):
    identities = read("identities")
    overrides = read("metadata-overrides")
    manifest = read("metadata-sources")
    documents = metadata.fetch_sources(ROOT)
    resolved, _ = metadata.resolve_metadata(identities, manifest, overrides, documents)
    by_key = {metadata.token_key(token, "identity"): token for token in resolved["tokens"]}
    new_ids = evidence_index((token for file in inputs for token in file.get("newIdentities", [])), lambda token: metadata.token_key(token, "proposed identity"))
    new_overrides = evidence_index((token for file in inputs for token in file.get("metadataOverrides", [])), lambda token: metadata.token_key(token, "proposed override"))
    catalog.require(not (set(by_key) & set(new_ids)), "A new identity would replace existing evidence")
    catalog.require(set(new_overrides) <= set(new_ids), "New overrides may only describe new identities")
    candidate_documents = {
        source: {"tokens": [token for token in doc["tokens"] if isinstance(token.get("address"), str) and (token.get("chainId"), token["address"].lower()) in new_ids]}
        for source, doc in documents.items()
    }
    assets = load_script("catalog-assets")
    image_dir = output / "images"
    def prepare(item):
        key, identity = item
        catalog.require(identity.get("assetClass") == "volatile", "New sell identity is not classified as volatile")
        local_overrides = [new_overrides[key]] if key in new_overrides else []
        resolved, _ = metadata.resolve_metadata({"tokens": [identity]}, manifest, {"schemaVersion": 1, "tokens": local_overrides}, candidate_documents)
        image = assets.download(identity.get("logoSource"))
        extension = assets.image_extension(image)
        digest = hashlib.sha256(image).hexdigest()
        catalog.require(extension is not None, "Unrecognized token image type")
        assets.verify_content(image, digest, extension)
        logo = {"localLogo": f"/assets/tokens/{digest[:20]}.{extension}", "logoSha256": digest}
        return {**identity, **logo}, {**resolved["tokens"][0], **logo}, image

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        pending = {pool.submit(prepare, item): item[0] for item in new_ids.items()}
        for future in concurrent.futures.as_completed(pending):
            key = pending[future]
            try:
                identity, resolved, image = future.result()
                path = image_dir / identity["localLogo"].lstrip("/")
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(image)
                new_ids[key], by_key[key] = identity, resolved
            except (OSError, ValueError) as error:
                rejections[key] = str(error)
    return identities, overrides, by_key, new_ids, new_overrides


def stage(inventory, evidence, output):
    sources, directories = read_snapshot(inventory)
    inputs = [metadata.read_json(path) for path in evidence]
    output.mkdir(parents=True, exist_ok=False)
    rejections = {}
    identities, overrides, tokens, new_ids, new_overrides = stage_identities(inputs, output, rejections)
    sells = evidence_index((entry for file in inputs for entry in file["approvals"]), route_key)
    policy, pinned, provenance = read("policy"), read("feeds"), read("sources")
    verification = metadata.read_json(ROOT / catalog.verification_file(policy))
    batch_name = "bulk-" + datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    approvals = {route_key(entry): entry for entry in policy["approvals"] if entry["quote"] == "USD"}
    staged = {chain: list(rows) for chain, rows in pinned.items()}
    buy_approvals, candidates = {}, []
    source_rows = {}

    for key, proposal in sorted(sells.items()):
        chain, address, quote = key
        chain_id = str(chain)
        try:
            catalog.require(key not in approvals, "This route already has an approval")
            catalog.require(policy["chains"][chain_id]["status"] == "approved", "No chain execution approval")
            catalog.require(key[:2] in tokens, rejections.get(key[:2], "No resolved exact token identity"))
            fixed_buy = approvals[(chain, identities["usdTokens"][chain_id].lower(), quote)]
            check_sell(proposal, tokens[key[:2]], fixed_buy)
            current_buy = primary_row(directories[chain_id], fixed_buy, fixed_buy=True)
            catalog.require(current_buy in pinned[chain_id], "Current fixed buy row differs from its approval")
            row = primary_row(directories[chain_id], proposal)
            previous = next((item for item in staged[chain_id] if source_key(item) == source_key(row)), None)
            catalog.require(previous is None or previous == row, "Current source row differs from a pinned row")
            if previous is None:
                staged[chain_id].append(row)
            buy_approvals[chain] = fixed_buy
            source_rows[key] = row
            candidates.append({**proposal, "tokenAddress": address, "proxyAddress": source_key(row)[1]})
        except (KeyError, ValueError) as error:
            rejections[key] = str(error)

    live = load_script("catalog-live")
    passing = []
    if candidates:
        arguments = (candidates, list(buy_approvals.values()), list(tokens.values()), staged)
        report = live.verify_candidate_routes(*arguments)
        write(output / "live.json", report)
        passing, rejected = live.candidate_route_results(*arguments, report)
        rejections.update((route_key(entry), reason) for entry, reason in rejected)
        if passing:
            batches = verification.setdefault("observationBatches", {})
            catalog.require(batch_name not in batches, f"Verification batch already exists: {batch_name}")
            batches[batch_name] = live.candidate_observation_batch(*arguments, report)

    accepted_keys = {route_key(entry) for entry in passing}
    write(output / "results.json", {
        "added": [{"chainId": key[0], "address": key[1], "symbol": tokens[key[:2]]["symbol"], "path": source_rows[key]["path"]} for key in sorted(accepted_keys)],
        "skipped": [{"chainId": key[0], "address": key[1], "path": sells[key]["path"], "reason": reason} for key, reason in sorted(rejections.items()) if key in sells],
    })
    if not passing:
        print("No new routes passed. No catalog updates staged.")
        return

    selected = {key[:2] for key in accepted_keys} & set(new_ids)
    identities["tokens"].extend(new_ids[key] for key in sorted(selected))
    overrides["tokens"].extend(new_overrides[key] for key in sorted(selected & set(new_overrides)))
    paths = defaultdict(set)
    for entry in passing:
        key = route_key(entry)
        chain = str(key[0])
        row = source_rows[key]
        paths[chain].add(row["path"])
        if row not in pinned[chain]:
            pinned[chain].append(row)
        approval = {**entry, "verificationBatch": batch_name}
        approval["snapshotFingerprint"] = catalog.snapshot_fingerprint(tokens[key[:2]], row, verification, approval)
        policy["approvals"].append(approval)
    catalog.approved_feeds({**identities, "tokens": list(tokens.values())}, pinned, policy, verification)
    provenance.setdefault("bulkExpansion", {})[batch_name] = {
        "scope": "Full directory screening; only approved source rows are retained.",
        "sources": {chain: {**entry, "paths": sorted(paths[chain])} for chain, entry in sources.items()},
    }
    for name, document in (("identities", identities), ("metadata-overrides", overrides), ("feeds", pinned),
                           ("policy", policy), ("policy-verification", verification), ("sources", provenance)):
        write(output / f"scripts/catalog-{name}.json", document)
    for key in selected:
        relative = new_ids[key]["localLogo"].lstrip("/")
        path = output / "public" / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes((output / "images" / relative).read_bytes())
    print(f"Staged {len(passing)} new sell routes: {dict(sorted(Counter(key[0] for key in accepted_keys).items()))}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    scanning = commands.add_parser("scan", help="capture and screen the full directories")
    scanning.add_argument("--output", type=pathlib.Path, required=True)
    staging = commands.add_parser("stage", help="check exact evidence and stage passing catalog changes")
    staging.add_argument("--inventory", type=pathlib.Path, required=True)
    staging.add_argument("--evidence", type=pathlib.Path, action="append", required=True)
    staging.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    try:
        if args.command == "scan":
            scan(args.output)
        else:
            stage(args.inventory, args.evidence, args.output)
    except (ValueError, OSError) as error:
        parser.exit(1, f"Catalog expansion: {error}\n")


if __name__ == "__main__":
    main()
