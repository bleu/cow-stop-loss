#!/usr/bin/env python3
"""Download only the reviewed, exact-contract logo sources into local assets."""
import concurrent.futures
import hashlib
import json
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
PATH = ROOT / "scripts/catalog-identities.json"


def image_extension(content):
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if content.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if b"<svg" in content[:1000]:
        return "svg"
    if content.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return "webp"
    return None


def download(url):
    with tempfile.NamedTemporaryFile() as target:
        result = subprocess.run(["curl", "-Lsf", "--retry", "2", "--max-time", "40", url, "-o", target.name], capture_output=True)
        if result.returncode:
            return url, None
        content = pathlib.Path(target.name).read_bytes()
        return url, content if image_extension(content) else None


def main():
    data = json.loads(PATH.read_text())
    urls = sorted({url for token in data["tokens"] for url in token["logoSources"]})
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        images = dict(pool.map(download, urls))
    failures = []
    for token in data["tokens"]:
        for url in token["logoSources"]:
            content = images[url]
            if content:
                filename = hashlib.sha256(content).hexdigest()[:20] + "." + image_extension(content)
                destination = ROOT / "public/assets/tokens" / filename
                destination.write_bytes(content)
                token["localLogo"] = "/assets/tokens/" + filename
                token["downloadedLogoSource"] = url
                break
        else:
            failures.append(f"{token['chainId']} {token['symbol']} {token['address']}")
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    if failures:
        raise SystemExit("Missing verified asset images:\n" + "\n".join(failures))
    print(f"Saved local images for {len(data['tokens'])} token contracts")


if __name__ == "__main__":
    main()
