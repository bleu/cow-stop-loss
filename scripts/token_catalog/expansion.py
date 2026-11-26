"""Screen official directories and stage verified sell routes for the pinned catalog."""
import concurrent.futures
import datetime
import hashlib
import json
import re
import time
import urllib.request
from collections import Counter, defaultdict

from . import ROOT, assets, instruments, live, metadata
from . import snapshot as catalog

CHAINS = sorted(catalog.PRODUCTION_CHAINS)
DIRECTORY_URL = re.compile(r"https://reference-data-directory\.vercel\.app/feeds-[a-z0-9-]+\.json")


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def read(name):
    return metadata.read_json(ROOT / f"scripts/catalog-{name}.json")


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def source_urls(*, robinhood=False):
    if robinhood:
        return {str(catalog.ROBINHOOD_CHAIN): instruments.ROBINHOOD_DIRECTORY}
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
            robinhood_stock = int(chain) == catalog.ROBINHOOD_CHAIN and docs.get("assetClass") == "Equity"
            reason = catalog.excluded_reason(row, robinhood_stock=robinhood_stock)
            if reason is None:
                if docs["quoteAsset"] != "USD":
                    reason = "no-fixed-buy-in-quote"
                elif row["decimals"] > catalog.MAX_ORACLE_DECIMALS:
                    reason = "unsupported-feed-decimals"
                elif robinhood_stock and (docs.get("blockchainName"), docs.get("deliveryChannelCode"),
                                           docs.get("productTypeCode"), docs.get("marketHours")) != (
                        "Robinhood", "DF", "primaryTokenizedPrice", catalog.ROBINHOOD_MARKET_HOURS):
                    reason = "unsupported-robinhood-stock-source"
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
        if str(chain) in directories and token["assetClass"] == "volatile" and (chain, address) not in approved
    ]
    return report, volatile


def scan(output, *, robinhood=False):
    urls = source_urls(robinhood=robinhood)
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(urls)) as pool:
        snapshots = list(pool.map(fetch_directory, urls.items()))
    directories = {chain: parse_directory(data, chain) for chain, data, _ in snapshots}
    report, volatile = screen_directories(directories, discovery_tokens(), read("policy")["approvals"])
    output.mkdir(parents=True, exist_ok=False)
    for chain, data, _ in snapshots:
        (output / f"{chain}.json").write_bytes(data)
    write(output / "sources.json", {chain: entry for chain, _, entry in snapshots})
    write(output / "screening.json", report)
    write(output / "unapproved-volatile.json", volatile)
    for chain, rows in report.items():
        print(f"{chain}: {len(rows)} directory rows, {sum(row['reason'] == 'needs-exact-evidence' for row in rows)} USD source rows for review")
    print(f"{len(volatile)} known volatile tokens without approved feeds")


def read_snapshot(directory, *, allow_pilot=False):
    sources = metadata.read_json(directory / "sources.json")
    robinhood = allow_pilot and set(sources) == {str(catalog.ROBINHOOD_CHAIN)}
    urls = source_urls(robinhood=robinhood)
    catalog.require(set(sources) == set(urls), "Snapshot must cover every production chain or only the Robinhood pilot")
    inventories = {}
    for chain, url in urls.items():
        entry = sources[chain]
        data = (directory / f"{chain}.json").read_bytes()
        catalog.require(entry["url"] == url and entry["sha256"] == hashlib.sha256(data).hexdigest(), f"Snapshot source changed: {chain}")
        inventories[chain] = parse_directory(data, chain)
    return sources, inventories


def discover_instruments(inventory, output, *, robinhood_registry=None):
    sources, directories = read_snapshot(inventory)
    output.mkdir(parents=True, exist_ok=False)
    known = {metadata.token_key(token, "identity") for token in read("identities")["tokens"]}
    approved = {route_key(entry)[:2] for entry in read("policy")["approvals"] if entry["quote"] == "USD"}
    evidence = {"approvals": [], "newIdentities": [], "metadataOverrides": []}
    gold, stocks, issuer_sources, issues = [], [], {}, {}

    def issuer_snapshot(name, *, snapshot=None):
        raw, source = instruments.fetch_issuer(name, snapshot=snapshot)
        issuer_sources[name] = source
        (output / f"issuer-{name}.snapshot").write_bytes(raw)
        return raw

    for chain, selection in instruments.GOLD_FEEDS.items():
        try:
            snapshots = {name: issuer_snapshot(name) for name in instruments.GOLD_ISSUERS[chain]}
            address, identity = instruments.gold_identity(chain, snapshots)
            if (chain, address) in approved:
                gold.append({"chainId": chain, "address": address, "status": "already-approved"})
                continue
            row = instruments.primary_gold_feed(directories[str(chain)], *selection)
            window = instruments.read_publication_window(chain, row, live.rpc, lambda: int(time.time()))
            if (chain, address) not in known:
                catalog.require(identity is not None, "Missing catalog identity for the exact gold token")
                override = instruments.metadata_override(chain, address, discovery_tokens().get((chain, address)))
                evidence["newIdentities"].append(identity)
                if override:
                    evidence["metadataOverrides"].append(override)
            evidence["approvals"].append(instruments.gold_evidence(chain, address, row, issuer_sources, sources[str(chain)], window))
            gold.append({"chainId": chain, "address": address, "status": "ready-to-stage", "publicationWindow": window})
        except (OSError, ValueError, RuntimeError, KeyError) as error:
            gold.append({"chainId": chain, "status": "blocked", "reason": str(error)})

    try:
        ondo = instruments.ondo_addresses(issuer_snapshot("ondo"))
    except (OSError, ValueError, KeyError) as error:
        issues["ondoRegistry"] = str(error)
        ondo = {}
    for chain, rows in directories.items():
        stocks.extend(instruments.stock_report(int(chain), rows, ondo, "ondo"))
    try:
        robinhood = instruments.robinhood_addresses(issuer_snapshot("robinhood", snapshot=robinhood_registry))
    except (OSError, ValueError, KeyError) as error:
        issues["robinhoodRegistry"] = str(error)
        robinhood = {}
    try:
        chain, raw, source = fetch_directory(("4663", instruments.ROBINHOOD_DIRECTORY))
        rows = parse_directory(raw, chain)
        (output / "4663.json").write_bytes(raw)
        sources[chain] = source
        stocks.extend(instruments.stock_report(int(chain), rows, robinhood, "robinhood"))
    except (OSError, ValueError) as error:
        issues["robinhoodDirectory"] = str(error)
    write(output / "evidence.json", evidence)
    write(output / "instruments.json", {"directorySources": sources, "issuerSources": issuer_sources,
                                        "gold": gold, "stocks": stocks, "issues": issues})
    print(f"{len(evidence['approvals'])} gold routes ready to stage; {len(stocks)} stock or ETF feed rows in discovery only.")


def route_key(entry):
    chain, address = metadata.token_key({"chainId": entry.get("chainId"), "address": entry.get("tokenAddress")}, "sell evidence")
    catalog.require(chain in CHAINS or chain == catalog.ROBINHOOD_CHAIN, "Expected a catalog chain")
    catalog.require(entry.get("quote") == "USD", "Expected a USD route mapping")
    return chain, address, entry["quote"]


def source_key(entry):
    return entry.get("path"), (entry.get("proxyAddress") or "").lower()


def primary_row(rows, entry, *, fixed_buy=False, identity=None):
    eligible = [row for row in rows if row.get("path") == entry.get("path")
                and catalog.approval_source_reason(row, entry, identity, bounded_price_approved=fixed_buy and "boundedPriceSuitability" in entry) is None]
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


def stage_identities(inputs, output, rejections, *, new_fixed_buy=None):
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
    image_dir = output / "images"
    def prepare(item):
        key, identity = item
        asset_class = "usd-pegged" if key == new_fixed_buy else "volatile"
        catalog.require(identity.get("assetClass") == asset_class, f"New identity must be classified as {asset_class}")
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
    sources, directories = read_snapshot(inventory, allow_pilot=True)
    inputs = [metadata.read_json(path) for path in evidence]
    pilot_chain = str(catalog.ROBINHOOD_CHAIN)
    pilot_entries = [file["pilot"] for file in inputs if "pilot" in file]
    policy, pinned, provenance = read("policy"), read("feeds"), read("sources")
    catalog.require(not pilot_entries or (len(pilot_entries) == 1 and pilot_chain in sources and pilot_chain not in policy["chains"]),
                    "Only a new Robinhood pilot can bootstrap a fixed buy")
    bootstrap = pilot_entries[0]["fixedBuy"] if pilot_entries else None
    fixed_key = route_key(bootstrap) if bootstrap is not None else None
    if fixed_key is not None:
        catalog.require(fixed_key == (catalog.ROBINHOOD_CHAIN, catalog.ROBINHOOD_FIXED_BUY, "USD")
                        and source_key(bootstrap) == catalog.ROBINHOOD_FIXED_FEED
                        and bootstrap.get("maxAgeSeconds") == catalog.ROBINHOOD_MAX_AGE
                        and "boundedPriceSuitability" not in bootstrap, "Invalid Robinhood fixed buy approval")
        policy["chains"][pilot_chain] = pilot_entries[0]["chain"]
        catalog.validate_policy(policy)
    output.mkdir(parents=True, exist_ok=False)
    rejections = {}
    identities, overrides, tokens, new_ids, new_overrides = stage_identities(inputs, output, rejections, new_fixed_buy=fixed_key[:2] if fixed_key else None)
    sells = evidence_index((entry for file in inputs for entry in file["approvals"]), route_key)
    verification = metadata.read_json(ROOT / catalog.verification_file(policy))
    batch_name = "bulk-" + datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    approvals = {route_key(entry): entry for entry in policy["approvals"] if entry["quote"] == "USD"}
    staged = {chain: list(rows) for chain, rows in pinned.items()}
    if bootstrap is not None:
        staged[pilot_chain] = [primary_row(directories[pilot_chain], bootstrap, fixed_buy=True)]
    buy_approvals, candidates = {}, []
    source_rows = {}

    for key, proposal in sorted(sells.items()):
        chain, address, quote = key
        chain_id = str(chain)
        try:
            catalog.require(key not in approvals, "This route already has an approval")
            catalog.require(chain_id in directories, "Route is outside the staged snapshot")
            catalog.require(policy["chains"].get(chain_id, {}).get("status") in {"approved", "pilot-only"}, "No chain execution approval")
            catalog.require(key[:2] in tokens, rejections.get(key[:2], "No resolved exact token identity"))
            if bootstrap is not None:
                catalog.require(fixed_key[:2] in tokens, rejections.get(fixed_key[:2], "No resolved fixed buy identity"))
                fixed_buy = bootstrap
            else:
                fixed_buy = approvals[(chain, identities["usdTokens"][chain_id].lower(), quote)]
            check_sell(proposal, tokens[key[:2]], fixed_buy)
            current_buy = primary_row(directories[chain_id], fixed_buy, fixed_buy=True)
            catalog.require(current_buy in (staged if bootstrap is not None else pinned)[chain_id], "Current fixed buy row differs from its approval")
            row = primary_row(directories[chain_id], proposal, identity=tokens[key[:2]])
            previous = next((item for item in staged[chain_id] if source_key(item) == source_key(row)), None)
            catalog.require(previous is None or previous == row, "Current source row differs from a pinned row")
            if previous is None:
                staged[chain_id].append(row)
            buy_approvals[chain] = fixed_buy
            source_rows[key] = row
            candidates.append({**proposal, "tokenAddress": address, "proxyAddress": source_key(row)[1]})
        except (KeyError, ValueError) as error:
            rejections[key] = str(error)

    passing, batch = [], None
    if candidates:
        arguments = (candidates, list(buy_approvals.values()), list(tokens.values()), staged)
        report = live.verify_candidate_routes(*arguments)
        write(output / "live.json", report)
        passing, rejected = live.candidate_route_results(*arguments, report)
        rejections.update((route_key(entry), reason) for entry, reason in rejected)
        if passing:
            batches = verification.setdefault("observationBatches", {})
            catalog.require(batch_name not in batches, f"Verification batch already exists: {batch_name}")
            batch = live.candidate_observation_batch(*arguments, report)
            batches[batch_name] = batch

    accepted_keys = {route_key(entry) for entry in passing}
    write(output / "results.json", {
        "added": [{"chainId": key[0], "address": key[1], "symbol": tokens[key[:2]]["symbol"], "path": source_rows[key]["path"]} for key in sorted(accepted_keys)],
        "skipped": [{"chainId": key[0], "address": key[1], "path": sells[key]["path"], "reason": reason} for key, reason in sorted(rejections.items()) if key in sells],
    })
    if not passing:
        print("No new routes passed. No catalog updates staged.")
        return

    paths = defaultdict(set)
    selected = {key[:2] for key in accepted_keys} & set(new_ids)
    if bootstrap is not None:
        buy_row = staged[pilot_chain][0]
        pinned[pilot_chain] = [buy_row]
        paths[pilot_chain].add(buy_row["path"])
        provenance["feedSources"][pilot_chain] = sources[pilot_chain]
        identities["usdTokens"][pilot_chain] = fixed_key[1]
        verification["chains"][pilot_chain] = batch["routes"][0]["buy"]["observation"]
        fingerprint = catalog.snapshot_fingerprint(tokens[fixed_key[:2]], buy_row, verification)
        policy["approvals"].append({**bootstrap, "snapshotFingerprint": fingerprint})
        for route in batch["routes"]:
            route["buy"]["approval"]["snapshotFingerprint"] = fingerprint
        selected.update({fixed_key[:2]} & set(new_ids))
    identities["tokens"].extend(new_ids[key] for key in sorted(selected))
    overrides["tokens"].extend(new_overrides[key] for key in sorted(selected & set(new_overrides)))
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
