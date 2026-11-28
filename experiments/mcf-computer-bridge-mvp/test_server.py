import json
import os
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

os.environ["MCF_BRIDGE_TOKEN"] = "test-token-that-is-at-least-32-characters-long"
TEST_TMP = tempfile.TemporaryDirectory()
ROOT = Path(TEST_TMP.name)
(ROOT / "hello.txt").write_text("hello MCF", encoding="utf-8")
os.environ["MCF_BRIDGE_ROOT"] = str(ROOT)
try:
    (ROOT / "escape-link").symlink_to("/etc/passwd")
except OSError:
    pass
import server


class BridgeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.httpd.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        TEST_TMP.cleanup()

    def request(self, method, path, payload=None, token=True, key="test-idem-001"):
        data = None if payload is None else json.dumps(payload).encode()
        req = urllib.request.Request(self.base + path, data=data, method=method)
        if token:
            req.add_header("Authorization", f"Bearer {server.TOKEN}")
        if method == "POST":
            req.add_header("Content-Type", "application/json")
            req.add_header("Idempotency-Key", key)
        try:
            with urllib.request.urlopen(req) as response:
                return response.status, json.loads(response.read())
        except urllib.error.HTTPError as exc:
            return exc.code, json.loads(exc.read())

    def test_health_is_public(self):
        status, body = self.request("GET", "/health", token=False)
        self.assertEqual(status, 200)
        self.assertTrue(body["ok"])

    def test_operations_require_token(self):
        status, body = self.request("POST", "/v1/jobs", {"operation": "system_info"}, token=False)
        self.assertEqual(status, 401)

    def test_system_info(self):
        status, body = self.request("POST", "/v1/jobs", {"operation": "system_info"}, key="sys-1")
        self.assertEqual(status, 200)
        self.assertEqual(body["job"]["status"], "completed")

    def test_read_file_and_digest(self):
        status, body = self.request("POST", "/v1/jobs", {"operation": "read_file", "args": {"path": "hello.txt"}}, key="read-1")
        self.assertEqual(status, 200)
        self.assertEqual(body["job"]["result"]["content"], "hello MCF")
        self.assertEqual(len(body["job"]["result_sha256"]), 64)

    def test_directory_listing(self):
        status, body = self.request("POST", "/v1/jobs", {"operation": "list_directory", "args": {"path": "."}}, key="list-1")
        self.assertEqual(status, 200)
        self.assertIn("hello.txt", [x["name"] for x in body["job"]["result"]["entries"]])

    def test_path_traversal_rejected(self):
        _, body = self.request("POST", "/v1/jobs", {"operation": "read_file", "args": {"path": "../etc/passwd"}}, key="escape-1")
        self.assertEqual(body["job"]["status"], "failed")

    def test_symlink_escape_rejected(self):
        if not (ROOT / "escape-link").is_symlink():
            self.skipTest("symlinks unavailable")
        _, body = self.request("POST", "/v1/jobs", {"operation": "read_file", "args": {"path": "escape-link"}}, key="symlink-1")
        self.assertEqual(body["job"]["status"], "failed")

    def test_idempotent_replay(self):
        payload = {"operation": "system_info"}
        _, first = self.request("POST", "/v1/jobs", payload, key="same-key")
        _, second = self.request("POST", "/v1/jobs", payload, key="same-key")
        self.assertEqual(first["job"]["id"], second["job"]["id"])
        self.assertTrue(second["replayed"])

    def test_idempotency_conflict(self):
        self.request("POST", "/v1/jobs", {"operation": "system_info"}, key="conflict-key")
        status, _ = self.request("POST", "/v1/jobs", {"operation": "list_directory"}, key="conflict-key")
        self.assertEqual(status, 409)

    def test_arbitrary_operation_rejected(self):
        _, body = self.request("POST", "/v1/jobs", {"operation": "shell", "args": {"cmd": "id"}}, key="shell-1")
        self.assertEqual(body["job"]["status"], "failed")


if __name__ == "__main__":
    unittest.main()
