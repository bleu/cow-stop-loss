#!/usr/bin/env python3
"""Fetch pinned token lists and resolve selected identities without network access."""
import argparse
import copy
import hashlib
import http.client
import json
import os
import pathlib
import re
import stat
import tempfile
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
PRODUCTION_CHAINS = {1, 100, 42161, 8453, 137, 43114, 56, 59144, 9745}
SUPPORTED_CHAINS = PRODUCTION_CHAINS | {11155111}
ADDRESS = re.compile(r"0x[0-9a-fA-F]{40}")
METADATA_FIELDS = {"symbol", "name", "decimals"}
MAX_BYTES = 16 * 1024 * 1024
TIMEOUT_SECONDS = 30
MANIFEST_PATH = "scripts/catalog-metadata-sources.json"
OVERRIDES_PATH = "scripts/catalog-metadata-overrides.json"
IDENTITIES_PATH = "scripts/catalog-identities.json"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def read_json(path):
    try:
        return json.loads(pathlib.Path(path).read_bytes())
    except (OSError, ValueError) as error:
        raise ValueError(f"Cannot read JSON {path}: {error}") from error


def validate_manifest(manifest):
    require(isinstance(manifest, dict), "Metadata manifest must be an object")
    require(set(manifest) == {"schemaVersion", "revision", "sources"}, "Invalid metadata manifest fields")
    require(type(manifest["schemaVersion"]) is int and manifest["schemaVersion"] == 1, "Unsupported metadata schemaVersion")
    revision = manifest["revision"]
    require(isinstance(revision, str) and re.fullmatch(r"[0-9a-f]{40}", revision), "Metadata revision must be a full commit hash")
    sources = manifest["sources"]
    require(isinstance(sources, list) and bool(sources), "Missing metadata sources")
    seen_ids, seen_urls = set(), set()
    last_priority = -1
    prefix = f"https://raw.githubusercontent.com/cowprotocol/token-lists/{revision}/src/public/"
    for source in sources:
        require(isinstance(source, dict), "Metadata source must be an object")
        require({"id", "url", "sha256"} <= set(source) <= {"id", "url", "sha256", "chainId"}, "Invalid metadata source fields")
        source_id = source["id"]
        require(isinstance(source_id, str), "Invalid metadata source id")
        match = re.fullmatch(r"(coingecko|uniswap)-([1-9][0-9]*)", source_id)
        require(source_id == "cow" or match is not None, f"Invalid metadata source id: {source_id}")
        priority = 0 if source_id == "cow" else (1 if match[1] == "coingecko" else 2)
        require(priority >= last_priority, "Metadata sources must use Cow, CoinGecko, Uniswap priority")
        last_priority = priority
        require(source_id not in seen_ids, f"Duplicate metadata source: {source_id}")
        seen_ids.add(source_id)
        if match:
            require(int(match[2]) in PRODUCTION_CHAINS, f"Unsupported metadata source chain: {source_id}")
        if "chainId" in source:
            chain = source["chainId"]
            require(type(chain) is int and chain in PRODUCTION_CHAINS, "Unsupported metadata source chainId")
            require(match is not None and chain == int(match[2]), "Metadata source chainId differs from id")
        url = source["url"]
        require(isinstance(url, str) and url.startswith(prefix), f"Metadata URL must use the pinned repository revision: {source_id}")
        filename = url[len(prefix):]
        require(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*\.json", filename) is not None, "Invalid metadata source filename")
        require(source_id != "cow" or filename == "CowSwap.json", "Cow metadata source must use CowSwap.json")
        require(url not in seen_urls, "Duplicate metadata source URL")
        seen_urls.add(url)
        require(isinstance(source["sha256"], str) and re.fullmatch(r"[0-9a-f]{64}", source["sha256"]), "Invalid metadata SHA-256")
    require(sources[0]["id"] == "cow", "Cow must be the first metadata source")
    return sources


def token_key(token, context):
    require(isinstance(token, dict), f"{context}: token must be an object")
    chain = token.get("chainId")
    require(type(chain) is int and chain in SUPPORTED_CHAINS, f"{context}: unsupported chainId")
    address = token.get("address")
    require(isinstance(address, str) and ADDRESS.fullmatch(address), f"{context}: invalid address")
    return chain, address.lower()


def validate_metadata(metadata, context, full=True):
    require(isinstance(metadata, dict), f"{context}: metadata must be an object")
    require(bool(metadata) and set(metadata) <= METADATA_FIELDS, f"{context}: invalid metadata fields")
    require(not full or set(metadata) == METADATA_FIELDS, f"{context}: missing metadata fields")
    for field, value in metadata.items():
        if field == "decimals":
            require(type(value) is int and 0 <= value <= 36, f"{context}: decimals must be an integer in 0..36")
        else:
            require(nonempty(value), f"{context}: empty {field}")


def index_document(document, source):
    context = source["id"]
    require(isinstance(document, dict) and isinstance(document.get("tokens"), list), f"{context}: missing tokens list")
    indexed = {}
    for token in document["tokens"]:
        require(isinstance(token, dict), f"{context}: token must be an object")
        chain = token.get("chainId")
        if isinstance(chain, str) and chain.lower() == "solana":
            continue
        require(type(chain) is int, f"{context}: chainId must be an integer")
        if chain not in SUPPORTED_CHAINS:
            continue
        require("chainId" not in source or chain == source["chainId"], f"{context}: token chainId differs from source")
        key = token_key(token, context)
        metadata = {field: token[field] for field in METADATA_FIELDS if field in token}
        validate_metadata(metadata, context)
        require(key not in indexed or indexed[key] == metadata, f"{context}: conflicting duplicate token {key}")
        indexed[key] = metadata
    return indexed


def resolve_metadata(identities, manifest, overrides, documents):
    """Resolve exact selected contracts; earlier sources have priority."""
    sources = validate_manifest(manifest)
    require(isinstance(identities, dict) and isinstance(identities.get("tokens"), list), "Missing identity tokens list")
    selected = {}
    for identity in identities["tokens"]:
        key = token_key(identity, "identity")
        require(key not in selected, f"Duplicate identity: {key}")
        require(not (METADATA_FIELDS & set(identity)), f"Identity contains display metadata: {key}")
        selected[key] = identity
    require(isinstance(documents, dict) and set(documents) == {source["id"] for source in sources}, "Metadata documents differ from manifest sources")
    external = {}
    for source in sources:
        for key, metadata in index_document(documents[source["id"]], source).items():
            external.setdefault(key, (metadata, source["id"]))
    require(isinstance(overrides, dict) and set(overrides) == {"schemaVersion", "tokens"}, "Invalid metadata overrides fields")
    require(type(overrides["schemaVersion"]) is int and overrides["schemaVersion"] == 1, "Unsupported overrides schemaVersion")
    require(isinstance(overrides["tokens"], list), "Missing metadata overrides tokens list")
    local = {}
    for entry in overrides["tokens"]:
        key = token_key(entry, "override")
        require({"chainId", "address", "metadata", "reason"} <= set(entry) <= {"chainId", "address", "metadata", "reason", "expected"}, "Invalid override fields")
        require(key in selected, f"Override has no selected identity: {key}")
        require(key not in local, f"Duplicate metadata override: {key}")
        require(nonempty(entry["reason"]), f"Override requires a reason: {key}")
        metadata = entry["metadata"]
        validate_metadata(metadata, f"override {key}", full=key not in external)
        if key in external:
            expected = entry.get("expected")
            validate_metadata(expected, f"override expected {key}", full=False)
            require(set(expected) == set(metadata), f"Override expected fields differ: {key}")
            upstream = external[key][0]
            for field, value in metadata.items():
                require(expected[field] == upstream[field], f"Override expected metadata drift: {key} {field}")
                require(value != upstream[field], f"Redundant metadata override: {key} {field}")
        else:
            require("expected" not in entry, f"Correction source disappeared or local override has expected fields: {key}")
        local[key] = entry
    resolved = copy.deepcopy(identities)
    report = {"tokens": [], "summary": {"tokens": len(selected), "external": 0, "local": 0, "corrected": 0, "sources": {}}}
    for identity in resolved["tokens"]:
        key = token_key(identity, "identity")
        entry = local.get(key)
        if key in external:
            metadata, source_id = external[key]
            metadata = dict(metadata)
            report["summary"]["external"] += 1
            if entry:
                metadata.update(entry["metadata"])
                report["summary"]["corrected"] += 1
        else:
            require(entry is not None, f"Missing metadata for selected identity: {key}; add a local override")
            metadata, source_id = entry["metadata"], "local"
            report["summary"]["local"] += 1
        identity.update(metadata)
        counts = report["summary"]["sources"]
        counts[source_id] = counts.get(source_id, 0) + 1
        report["tokens"].append({"chainId": key[0], "address": key[1], "source": source_id, "overriddenFields": sorted(entry["metadata"]) if entry else []})
    return resolved, report


def cache_directory(root, cache_dir):
    path = pathlib.Path(cache_dir) if cache_dir is not None else pathlib.Path(root) / ".cache/token-catalog"
    path = pathlib.Path(os.path.abspath(path))
    for parent in (*reversed(path.parents), path):
        require(not parent.is_symlink(), f"Metadata cache path must not contain symlinks: {parent}")
        require(not parent.exists() or parent.is_dir(), f"Metadata cache path is not a directory: {parent}")
    return path


def verified_document(data, source):
    require(len(data) <= MAX_BYTES, f"Metadata source exceeds byte limit: {source['id']}")
    require(hashlib.sha256(data).hexdigest() == source["sha256"], f"Metadata digest mismatch: {source['id']}")
    try:
        document = json.loads(data)
    except (ValueError, UnicodeError) as error:
        raise ValueError(f"Invalid metadata JSON: {source['id']}") from error
    index_document(document, source)
    return document


def cached_document(path, source):
    require(not path.is_symlink(), f"Metadata cache file must not be a symlink: {path}")
    try:
        require(stat.S_ISREG(path.stat().st_mode), f"Metadata cache entry is not a regular file: {path}")
        with path.open("rb") as stream:
            require(stat.S_ISREG(os.fstat(stream.fileno()).st_mode), f"Metadata cache entry is not a regular file: {path}")
            data = stream.read(MAX_BYTES + 1)
    except OSError as error:
        raise ValueError(f"Cannot read metadata cache {path}: {error}") from error
    return verified_document(data, source)


class PinnedRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError(f"Pinned metadata URL redirected: {req.full_url}")


def download(source):
    try:
        opener = urllib.request.build_opener(PinnedRedirectHandler())
        request = urllib.request.Request(source["url"], headers={"User-Agent": "cow-stop-loss-catalog/1", "Accept-Encoding": "identity"})
        with opener.open(request, timeout=TIMEOUT_SECONDS) as response:
            require(response.geturl() == source["url"], f"Pinned metadata URL redirected: {source['id']}")
            require(response.status == 200, f"Metadata HTTP status {response.status}: {source['id']}")
            data = response.read(MAX_BYTES + 1)
            length = response.headers.get("Content-Length")
            if length is not None:
                require(length.isascii() and length.isdecimal(), f"Invalid metadata Content-Length: {source['id']}")
                require(int(length) == len(data), f"Incomplete or oversized metadata response: {source['id']}")
        verified_document(data, source)
        return data
    except (OSError, urllib.error.URLError, http.client.HTTPException) as error:
        raise ValueError(f"Cannot fetch pinned metadata {source['id']}: {error}") from error


def fetch_sources(root=ROOT, cache_dir=None):
    """Cache missing pinned sources; reject corrupt existing cache files."""
    root = pathlib.Path(root)
    sources = validate_manifest(read_json(root / MANIFEST_PATH))
    directory = cache_directory(root, cache_dir)
    directory.mkdir(parents=True, exist_ok=True)
    documents = {}
    for source in sources:
        path = directory / f"{source['sha256']}.json"
        require(not path.is_symlink(), f"Metadata cache file must not be a symlink: {path}")
        if path.exists():
            documents[source["id"]] = cached_document(path, source)
            continue
        data = download(source)
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(dir=directory, prefix=".metadata-", suffix=".tmp", delete=False) as stream:
                temporary = pathlib.Path(stream.name)
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
            require(not path.is_symlink(), f"Metadata cache file must not be a symlink: {path}")
            os.replace(temporary, path)
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)
        documents[source["id"]] = verified_document(data, source)
    return documents


def load_metadata(root=ROOT, cache_dir=None):
    """Load verified cache bytes only. Use fetch_sources to prepare a cold cache."""
    root = pathlib.Path(root)
    manifest = read_json(root / MANIFEST_PATH)
    sources = validate_manifest(manifest)
    directory = cache_directory(root, cache_dir)
    documents = {}
    for source in sources:
        path = directory / f"{source['sha256']}.json"
        require(path.exists() or path.is_symlink(), f"Missing pinned metadata cache: {path}; run prepare:catalog")
        documents[source["id"]] = cached_document(path, source)
    return resolve_metadata(read_json(root / IDENTITIES_PATH), manifest, read_json(root / OVERRIDES_PATH), documents)


def load_identities(root=ROOT, cache_dir=None):
    return load_metadata(root=root, cache_dir=cache_dir)[0]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache-dir", type=pathlib.Path, help="Use a separate content-addressed cache directory")
    parser.add_argument("--check", action="store_true", help="Validate and resolve existing cache without network access")
    args = parser.parse_args()
    try:
        if not args.check:
            fetch_sources(cache_dir=args.cache_dir)
        _, report = load_metadata(cache_dir=args.cache_dir)
        print(json.dumps(report["summary"], sort_keys=True))
    except (ValueError, OSError) as error:
        parser.exit(1, f"Metadata error: {error}\n")


if __name__ == "__main__":
    main()
