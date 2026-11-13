#!/usr/bin/env python3
"""Contract and security tests for the local MCF Agent Bridge adapter."""
import contextlib
import importlib.util
import json
import os
from pathlib import Path
import stat
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MODULE = Path(__file__).with_name("bridge_adapter.py")
spec = importlib.util.spec_from_file_location("bridge_adapter", MODULE)
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)


class LocalBridgeFixture(BaseHTTPRequestHandler):
    token = "fixture-local-token"
    def log_message(self, *_):
        return

    def do_GET(self):
        if self.headers.get("Authorization") != "Bearer " + self.token:
            self.send_response(401)
            self.end_headers()
            return
        if self.headers.get("X-MCF-Instance") != "test-instance":
            self.send_response(409)
            self.end_headers()
            return
        obj = {
            "/v1/discovery": {
                "ok": True,
                "discovery": {
                    "schema": bridge.SCHEMA,
                    "instance": {
                        "instanceId": "test-instance", "agentProfile": "test",
                        "paused": False, "busy": False, "queueDepth": 0
                    },
                    "correctness": {"falseGreenAllowed": False},
                    "warnings": []
                }
            },
            "/v1/state": {"ok": True, "state": {
                "instanceId": "test-instance", "title": "Test",
                "loading": False
            }},
            "/v1/agents": {"ok": True, "agents": [{"agentId": "Rafael"}]}
        }.get(self.path, {"ok": True})
        payload = json.dumps(obj).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("X-MCF-Instance", "test-instance")
        self.end_headers()
        self.wfile.write(payload)


class BridgeContractTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.home = Path(self.tmp.name)
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), LocalBridgeFixture)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        self.path = bridge.descriptor_path("test-instance", self.home)
        self.path.parent.mkdir(parents=True)
        self.descriptor = {
            "enabled": True, "instanceId": "test-instance",
            "host": "127.0.0.1", "port": self.server.server_port,
            "token": LocalBridgeFixture.token
        }
        self.write_descriptor()
        self.client = bridge.BridgeClient("test-instance", home=self.home)

    def write_descriptor(self):
        self.path.write_text(json.dumps(self.descriptor))
        self.path.chmod(0o600)

    def test_discovery_state_and_receipts(self):
        self.assertTrue(bridge.doctor(self.client)["ok"])
        state = bridge.execute_read(self.client, "state")
        self.assertEqual(state["state"]["title"], "Test")
        log = self.home / ".local/state/mcf-agent-bridge/receipts.jsonl"
        events = [json.loads(line) for line in log.read_text().splitlines()]
        self.assertGreaterEqual(len(events), 3)
        self.assertEqual(stat.S_IMODE(log.stat().st_mode), 0o600)
        self.assertNotIn(LocalBridgeFixture.token, log.read_text())
        self.assertTrue(all(entry["effects"] == "none" for entry in events))

    def test_secret_permissions_fail_closed(self):
        self.path.chmod(0o644)
        with self.assertRaisesRegex(bridge.BridgeError, "permissions"):
            self.client.discovery()

    def test_loopback_only(self):
        self.descriptor["host"] = "0.0.0.0"
        self.write_descriptor()
        with self.assertRaisesRegex(bridge.BridgeError, "non_loopback"):
            self.client.discovery()

    def test_bad_token_and_dynamic_rotation(self):
        self.descriptor["token"] = "wrong-token"
        self.write_descriptor()
        with self.assertRaisesRegex(bridge.BridgeError, "auth_failed"):
            self.client.discovery()
        self.descriptor["token"] = LocalBridgeFixture.token
        self.write_descriptor()
        self.assertTrue(self.client.discovery()["ok"])

    def test_wrong_instance_in_discovery(self):
        original = bridge.SCHEMA
        with self.assertRaisesRegex(bridge.BridgeError, "invalid_instance"):
            bridge.BridgeClient("../notebook")
        self.assertEqual(bridge.SCHEMA, original)

    def test_read_only_surface(self):
        self.assertNotIn("bridge_navigate", [x["name"] for x in bridge.tools_catalog()])
        self.assertNotIn("bridge_click", [x["name"] for x in bridge.tools_catalog()])
        self.assertTrue(all(x["annotations"]["readOnlyHint"] for x in bridge.tools_catalog()))
        with self.assertRaisesRegex(bridge.BridgeError, "route_not_allowlisted"):
            self.client._get("navigate")


if __name__ == "__main__":
    unittest.main()
