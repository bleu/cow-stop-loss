#!/usr/bin/env python3
"""Verify pinned token images and restore missing files from reviewed sources."""
import argparse
import concurrent.futures
import hashlib
import http.client
import json
import os
import pathlib
import re
import tempfile
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
PATH = ROOT / "scripts/catalog-identities.json"
MAX_BYTES = 4 * 1024 * 1024
LOGO_PATH = re.compile(r"/assets/tokens/([0-9a-f]{20})\.(png|jpg|jpeg|svg|gif|webp)")


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


def validate_source(url):
    if not isinstance(url, str) or any(character.isspace() for character in url):
        raise ValueError("source must be an HTTPS URL")
    parsed = urllib.parse.urlsplit(url)
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username is not None
            or parsed.password is not None or parsed.fragment):
        raise ValueError("source must be an HTTPS URL without credentials or fragments")
    parsed.port


class HTTPSRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        validate_source(newurl)
        return super().redirect_request(request, fp, code, msg, headers, newurl)


def download(url):
    validate_source(url)
    opener = urllib.request.build_opener(HTTPSRedirectHandler())
    for attempt in range(2):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "cow-token-assets/1"})
            with opener.open(request, timeout=20) as response:
                content = response.read(MAX_BYTES + 1)
            if len(content) > MAX_BYTES:
                raise ValueError("image exceeds 4 MiB")
            return content
        except (OSError, http.client.HTTPException) as error:
            if attempt == 1:
                raise OSError(f"download failed: {error}") from error


def verify_content(content, digest, extension):
    if not 100 < len(content) <= MAX_BYTES:
        raise ValueError("image must contain more than 100 bytes and at most 4 MiB")
    if image_extension(content) != ("jpg" if extension == "jpeg" else extension):
        raise ValueError("image type does not match its path")
    if hashlib.sha256(content).hexdigest() != digest:
        raise ValueError("image SHA-256 does not match the pinned digest")


def safe_destination(public_dir, local_path):
    destination = public_dir
    if public_dir.is_symlink():
        raise ValueError(f"symlink is not allowed: {public_dir}")
    for part in pathlib.PurePosixPath(local_path.lstrip("/")).parts:
        destination = destination / part
        if destination.is_symlink():
            raise ValueError(f"symlink is not allowed: {destination}")
    return destination


def prepare_image(public_dir, local_path, digest, sources, download_missing):
    destination = safe_destination(public_dir, local_path)
    extension = destination.suffix[1:]
    if destination.exists():
        with destination.open("rb") as image:
            verify_content(image.read(MAX_BYTES + 1), digest, extension)
        return
    if not download_missing:
        raise ValueError("image is missing (downloads disabled)")
    errors = []
    for source in sorted(sources):
        try:
            content = download(source)
            verify_content(content, digest, extension)
            break
        except (OSError, ValueError) as error:
            errors.append(f"{source}: {error}")
    else:
        raise ValueError("; ".join(errors))
    destination.parent.mkdir(parents=True, exist_ok=True)
    safe_destination(public_dir, local_path)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=destination.parent, delete=False) as image:
            temporary = pathlib.Path(image.name)
            image.write(content)
            image.flush()
            os.fsync(image.fileno())
        safe_destination(public_dir, local_path)
        if destination.exists():
            raise ValueError("image appeared during preparation; refusing to overwrite")
        os.replace(temporary, destination)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def prepare_assets(identities, public_dir, download_missing=True, workers=6):
    """Return the unique verified image count; report all failures together."""
    if workers < 1:
        raise ValueError("workers must be positive")
    public_dir = pathlib.Path(public_dir).absolute()
    groups, failures, invalid_paths = {}, [], set()
    for token in identities["tokens"]:
        local_path = token.get("localLogo")
        try:
            match = LOGO_PATH.fullmatch(local_path) if isinstance(local_path, str) else None
            if match is None:
                raise ValueError("invalid local logo path")
            digest = token.get("logoSha256")
            if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
                raise ValueError("full SHA-256 is required")
            if not digest.startswith(match[1]):
                raise ValueError("path does not match the SHA-256 prefix")
            source = token.get("logoSource")
            validate_source(source)
            previous_digest, sources = groups.setdefault(local_path, (digest, set()))
            if previous_digest != digest:
                raise ValueError("shared path has conflicting SHA-256 digests")
            sources.add(source)
        except (ValueError, TypeError) as error:
            failures.append(f"{local_path}: {error}")
            if isinstance(local_path, str):
                invalid_paths.add(local_path)

    def prepare(item):
        local_path, (digest, sources) = item
        try:
            prepare_image(public_dir, local_path, digest, sources, download_missing)
        except (OSError, ValueError) as error:
            return f"{local_path}: {error}"
        return None

    items = sorted((path, group) for path, group in groups.items() if path not in invalid_paths)
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        failures.extend(error for error in pool.map(prepare, items) if error)
    if failures:
        raise ValueError("Token image preparation failed:\n" + "\n".join(sorted(failures)))
    return len(items)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--public-dir", type=pathlib.Path, default=ROOT / "public")
    parser.add_argument("--check", action="store_true", help="verify files without downloading")
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()
    try:
        count = prepare_assets(json.loads(PATH.read_text()), args.public_dir,
                               download_missing=not args.check, workers=args.workers)
    except (OSError, ValueError) as error:
        parser.exit(1, f"{error}\n")
    print(f"Verified {count} unique token images")


if __name__ == "__main__":
    main()
