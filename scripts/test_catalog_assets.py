import copy
import hashlib
import importlib.util
import pathlib
import tempfile
import unittest
from unittest import mock

SPEC = importlib.util.spec_from_file_location("catalog_assets", pathlib.Path(__file__).with_name("catalog-assets.py"))
ASSETS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ASSETS)
IMAGE = b"<svg xmlns='http://www.w3.org/2000/svg'>" + b" " * 100 + b"</svg>"
SOURCE = "https://example.com/token.svg"


def identity(content=IMAGE, source=SOURCE, extension="svg"):
    digest = hashlib.sha256(content).hexdigest()
    return {"localLogo": f"/assets/tokens/{digest[:20]}.{extension}",
            "logoSource": source, "logoSha256": digest}


class PrepareAssetsTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.public = pathlib.Path(self.temporary.name) / "public"
        self.data = {"tokens": [identity()]}
        self.original = copy.deepcopy(self.data)
        self.destination = self.public / self.data["tokens"][0]["localLogo"].lstrip("/")
        patcher = mock.patch.object(ASSETS, "download", return_value=IMAGE)
        self.download = patcher.start()
        self.addCleanup(patcher.stop)

    def prepare(self, **kwargs):
        return ASSETS.prepare_assets(self.data, self.public, **kwargs)

    def install(self, content=IMAGE):
        self.destination.parent.mkdir(parents=True)
        self.destination.write_bytes(content)

    def test_cold_restore_and_warm_offline_reuse_do_not_change_identities(self):
        self.assertEqual(self.prepare(), 1)
        self.assertEqual(self.destination.read_bytes(), IMAGE)
        self.download.assert_called_once_with(SOURCE)
        self.download.reset_mock(side_effect=True)
        self.download.side_effect = AssertionError("network must not be used")
        self.assertEqual(self.prepare(), 1)
        self.assertEqual(self.prepare(download_missing=False), 1)
        self.download.assert_not_called()
        self.assertEqual(self.data, self.original)

    def test_shared_path_uses_unique_sources_in_sorted_order(self):
        first = "https://a.example.com/token.svg"
        last = "https://z.example.com/token.svg"
        self.data["tokens"] = [identity(source=last), identity(source=first), identity(source=last)]
        self.download.side_effect = [IMAGE.replace(b" ", b"!"), IMAGE]
        original = copy.deepcopy(self.data)
        self.assertEqual(self.prepare(), 1)
        self.assertEqual(self.download.call_args_list, [mock.call(first), mock.call(last)])
        self.assertEqual(self.destination.read_bytes(), IMAGE)
        self.assertEqual(self.data, original)

    def test_shared_path_conflicting_digest_is_rejected_without_download(self):
        other = copy.deepcopy(self.data["tokens"][0])
        digest = other["logoSha256"]
        other["logoSha256"] = digest[:20] + ("0" if digest[20] != "0" else "1") + digest[21:]
        self.data["tokens"].append(other)
        with self.assertRaisesRegex(ValueError, "conflicting SHA-256"):
            self.prepare()
        self.download.assert_not_called()

    def test_missing_check_is_offline_and_reports_every_path(self):
        self.data["tokens"].append(identity(IMAGE + b" "))
        with self.assertRaises(ValueError) as raised:
            self.prepare(download_missing=False)
        for token in self.data["tokens"]:
            self.assertIn(token["localLogo"], str(raised.exception))
        self.download.assert_not_called()
        self.assertFalse(self.public.exists())

    def test_existing_invalid_images_are_not_overwritten(self):
        for content in (b"broken", IMAGE.replace(b" ", b"!"), b"x" * 200):
            with self.subTest(content=content[:10]):
                self.destination.parent.mkdir(parents=True, exist_ok=True)
                self.destination.write_bytes(content)
                with self.assertRaises(ValueError):
                    self.prepare()
                self.assertEqual(self.destination.read_bytes(), content)
        self.download.assert_not_called()

    def test_download_wrong_digest_type_size_or_error_installs_nothing(self):
        for content in (IMAGE + b"changed", b"x" * 200, b"<svg/>", b"x" * (ASSETS.MAX_BYTES + 1)):
            with self.subTest(content=content[:10]):
                self.download.return_value = content
                with self.assertRaises(ValueError):
                    self.prepare()
                self.assertFalse(self.destination.exists())
        self.download.side_effect = OSError("interrupted download")
        with self.assertRaisesRegex(ValueError, "interrupted download"):
            self.prepare()
        self.assertFalse(self.destination.exists())
        self.assertEqual(self.data, self.original)

    def test_image_type_must_match_even_when_digest_matches(self):
        self.data["tokens"] = [identity(extension="png")]
        with self.assertRaisesRegex(ValueError, "type does not match"):
            self.prepare()
        self.assertFalse(self.public.exists())

    def test_invalid_paths_hashes_and_sources_are_rejected(self):
        cases = [("localLogo", path) for path in (
            "/assets/tokens/../outside.svg", "https://example.com/a.svg", "/tmp/a.svg",
            "/assets/tokens/" + "0" * 20 + ".svg", "/assets/tokens/a.svg", None)]
        cases += [("logoSource", source) for source in (
            "http://example.com/a", "https:///a", "https://user:password@example.com/a",
            "https://example.com/a#fragment", "https://example.com/a b", "file:///tmp/a",
            "https://example.com:bad/a", None)]
        cases += [("logoSha256", digest) for digest in (None, "abc", "0" * 64)]
        for key, value in cases:
            with self.subTest(key=key, value=value):
                self.data = copy.deepcopy(self.original)
                self.data["tokens"][0][key] = value
                with self.assertRaises(ValueError):
                    self.prepare()
        self.download.assert_not_called()

    def test_symlink_file_directory_or_root_is_rejected(self):
        outside = pathlib.Path(self.temporary.name) / "outside"
        outside.mkdir()
        for link in (self.public, self.public / "assets", self.destination.parent, self.destination):
            with self.subTest(link=link):
                link.parent.mkdir(parents=True, exist_ok=True)
                link.symlink_to(outside, target_is_directory=True)
                with self.assertRaisesRegex(ValueError, "symlink"):
                    self.prepare()
                link.unlink()
        self.assertEqual(list(outside.iterdir()), [])
        self.download.assert_not_called()

    def test_interrupted_atomic_install_removes_temporary_file(self):
        for operation in ("fsync", "replace"):
            with self.subTest(operation=operation):
                with mock.patch.object(ASSETS.os, operation, side_effect=OSError("interrupted write")):
                    with self.assertRaisesRegex(ValueError, "interrupted write"):
                        self.prepare()
                self.assertFalse(self.destination.exists())
                self.assertEqual(list(self.destination.parent.iterdir()), [])

    def test_failure_does_not_skip_other_assets(self):
        second = identity(IMAGE + b" ", "https://example.com/second.svg")
        self.data["tokens"].append(second)
        self.download.side_effect = lambda url: IMAGE if url == SOURCE else b"invalid"
        with self.assertRaisesRegex(ValueError, second["localLogo"]):
            self.prepare()
        self.assertEqual(self.destination.read_bytes(), IMAGE)
        self.assertEqual(self.download.call_count, 2)


class DownloadTests(unittest.TestCase):
    def setUp(self):
        self.opener = mock.MagicMock()
        self.response = self.opener.open.return_value.__enter__.return_value = mock.Mock()
        self.response.read.return_value = IMAGE
        patcher = mock.patch.object(ASSETS.urllib.request, "build_opener", return_value=self.opener)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_download_is_bounded_and_has_a_timeout(self):
        self.assertEqual(ASSETS.download(SOURCE), IMAGE)
        self.response.read.assert_called_once_with(ASSETS.MAX_BYTES + 1)
        self.assertEqual(self.opener.open.call_args.kwargs, {"timeout": 20})

    def test_oversize_response_is_rejected(self):
        self.response.read.return_value = b"x" * (ASSETS.MAX_BYTES + 1)
        with self.assertRaisesRegex(ValueError, "exceeds"):
            ASSETS.download(SOURCE)

    def test_network_failures_have_limited_retries(self):
        self.opener.open.side_effect = OSError("offline")
        with self.assertRaisesRegex(OSError, "offline"):
            ASSETS.download(SOURCE)
        self.assertEqual(self.opener.open.call_count, 2)

    def test_interrupted_response_is_reported_as_a_download_failure(self):
        self.response.read.side_effect = ASSETS.http.client.IncompleteRead(b"partial", 100)
        with self.assertRaisesRegex(OSError, "download failed"):
            ASSETS.download(SOURCE)
        self.assertEqual(self.opener.open.call_count, 2)

    def test_redirect_cannot_downgrade_to_http(self):
        handler = ASSETS.HTTPSRedirectHandler()
        with self.assertRaisesRegex(ValueError, "HTTPS"):
            handler.redirect_request(None, None, 302, "Found", {}, "http://example.com/a.svg")


if __name__ == "__main__":
    unittest.main()
