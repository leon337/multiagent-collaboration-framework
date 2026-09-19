import json
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from capability_tokens import CapabilityDenied, CapabilityIssuer
from cognitive_memory import (
    CognitiveMemoryCapability,
    ConfirmationRequired,
    LegacyHttpCognitiveLedgerProvider,
    MachineTokenCognitiveLedgerProvider,
    ProviderWriteError,
    ReadBackVerificationError,
    TOOL_NAME,
)
from runtime import MissionRuntime, MissionStore


class FakeProvider:
    name = "fake-ledger"

    def __init__(self):
        self.records = {}
        self.force_missing = False

    def write(self, *, event, sources, relations):
        existing = self.records.get(event["id"])
        if existing is None:
            self.records[event["id"]] = dict(event)
            return {"status": "criado", "id": event["id"]}
        if existing == event:
            return {"status": "existente", "id": event["id"]}
        raise ProviderWriteError("COLISAO_ID")

    def read_back(self, event_id):
        if self.force_missing:
            return None
        return self.records.get(event_id)


class MemoryCapabilityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.store = MissionStore(root / "mission.db")
        self.addCleanup(self.store.close)
        self.runtime = MissionRuntime(self.store, "M")
        self.runtime.create_task("t1", "memory write", [], "mestre")
        self.runtime.start_execution("e1", "agent-a", "t1", "bubble", "mestre")
        self.issuer = CapabilityIssuer(root / "cap.key")
        self.token = self.issuer.issue(
            "agent-a", "t1", [TOOL_NAME], 60, now=100
        )
        self.provider = FakeProvider()
        self.capability = CognitiveMemoryCapability(
            runtime=self.runtime,
            issuer=self.issuer,
            provider=self.provider,
        )
        self.event = {
            "id": "ec-test-001",
            "timestamp": "2026-09-18T21:00:00-03:00",
            "tipo": "checkpoint",
            "titulo": "Teste",
            "resumo": "Teste governado",
        }

    def write(self, **changes):
        args = dict(
            token=self.token,
            execution_id="e1",
            agent_id="agent-a",
            task_id="t1",
            event=self.event,
            confirmed=True,
            actor="mestre",
            now=101,
        )
        args.update(changes)
        return self.capability.write(**args)

    def test_write_requires_explicit_confirmation(self):
        with self.assertRaises(ConfirmationRequired):
            self.write(confirmed=False)
        self.assertEqual(self.runtime.projection().tool_calls, {})

    def test_write_requires_named_capability(self):
        bad = self.issuer.issue("agent-a", "t1", ["repo_read"], 60, now=100)
        with self.assertRaises(CapabilityDenied):
            self.write(token=bad)

    def test_write_requires_matching_agent_task_and_execution(self):
        with self.assertRaises(CapabilityDenied):
            self.write(agent_id="other")

    def test_success_requires_provider_write_and_read_back(self):
        receipt = self.write(
            sources=[{"id": "f1"}],
            relations=[{"tipo": "deriva_de"}],
        )
        self.assertTrue(receipt.read_back_verified)
        self.assertEqual(receipt.provider_status, "criado")
        self.assertEqual(receipt.source_count, 1)
        self.assertEqual(receipt.relation_count, 1)
        call = next(iter(self.runtime.projection().tool_calls.values()))
        self.assertEqual(call["status"], "completed")
        self.assertEqual(call["tool"], TOOL_NAME)
        self.assertEqual(call["result_sha256"], receipt.receipt_sha256)

    def test_idempotent_provider_status_existing_is_allowed(self):
        first = self.write()
        second = self.write(call_id="call-2")
        self.assertEqual(first.event_id, second.event_id)
        self.assertEqual(second.provider_status, "existente")

    def test_missing_read_back_fails_tool(self):
        self.provider.force_missing = True
        with self.assertRaises(ReadBackVerificationError):
            self.write()
        call = next(iter(self.runtime.projection().tool_calls.values()))
        self.assertEqual(call["status"], "failed")

    def test_receipt_does_not_contain_event_text_or_secret(self):
        receipt = self.write().as_dict()
        encoded = json.dumps(receipt, ensure_ascii=False)
        self.assertNotIn("Teste governado", encoded)
        self.assertNotIn("password", encoded.lower())


class _LedgerHandler(BaseHTTPRequestHandler):
    records = {}
    auth = None

    def log_message(self, format, *args):
        return

    def _authorized(self):
        return self.headers.get("Authorization") == self.auth

    def do_POST(self):
        if not self._authorized():
            self.send_response(401)
            self.end_headers()
            return
        size = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(size) or b"{}")
        event = body["evento"]
        status = "existente" if event["id"] in self.records else "criado"
        self.records[event["id"]] = dict(event)
        payload = json.dumps(
            {"status": status, "id": event["id"]}
        ).encode()
        self.send_response(201 if status == "criado" else 200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if not self._authorized():
            self.send_response(401)
            self.end_headers()
            return
        payload = json.dumps(
            {"registros": list(self.records.values())}
        ).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


class LegacyHttpProviderTests(unittest.TestCase):
    def setUp(self):
        _LedgerHandler.records = {}
        user, password = "mcf", "secret"
        _LedgerHandler.auth = "Basic " + __import__("base64").b64encode(
            f"{user}:{password}".encode()
        ).decode()
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), _LedgerHandler)
        self.thread = threading.Thread(
            target=self.server.serve_forever,
            daemon=True,
        )
        self.thread.start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        self.provider = LegacyHttpCognitiveLedgerProvider(
            f"http://127.0.0.1:{self.server.server_port}",
            user,
            password,
            timeout_seconds=2,
        )

    def test_http_provider_write_and_read_back(self):
        event = {
            "id": "ec-http-001",
            "timestamp": "2026-09-18T21:00:00-03:00",
            "tipo": "checkpoint",
            "titulo": "HTTP",
            "resumo": "provider",
        }
        out = self.provider.write(event=event, sources=[], relations=[])
        self.assertEqual(out["status"], "criado")
        self.assertEqual(self.provider.read_back(event["id"]), event)

    def test_bad_credentials_fail_closed(self):
        bad = LegacyHttpCognitiveLedgerProvider(
            f"http://127.0.0.1:{self.server.server_port}",
            "bad",
            "bad",
            timeout_seconds=2,
        )
        with self.assertRaises(ProviderWriteError):
            bad.write(
                event={
                    "id": "e",
                    "timestamp": "x",
                    "tipo": "x",
                    "titulo": "x",
                    "resumo": "x",
                },
                sources=[],
                relations=[],
            )

class MachineTokenProviderTests(unittest.TestCase):
    def setUp(self):
        _LedgerHandler.records = {}
        _LedgerHandler.auth = "Bearer machine-token"
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), _LedgerHandler)
        self.thread = threading.Thread(
            target=self.server.serve_forever,
            daemon=True,
        )
        self.thread.start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def test_machine_provider_write_and_read_back(self):
        provider = MachineTokenCognitiveLedgerProvider(
            self.base,
            "machine-token",
            timeout_seconds=2,
        )
        event = {
            "id": "ec-machine-001",
            "timestamp": "2026-09-18T21:00:00-03:00",
            "tipo": "checkpoint",
            "titulo": "Machine",
            "resumo": "provider",
        }
        out = provider.write(event=event, sources=[], relations=[])
        self.assertEqual(out["status"], "criado")
        self.assertEqual(provider.read_back(event["id"]), event)

    def test_machine_provider_bad_token_fails_closed(self):
        provider = MachineTokenCognitiveLedgerProvider(
            self.base,
            "wrong-token",
            timeout_seconds=2,
        )
        with self.assertRaises(ProviderWriteError):
            provider.write(
                event={
                    "id": "ec-machine-002",
                    "timestamp": "2026-09-18T21:00:00-03:00",
                    "tipo": "checkpoint",
                    "titulo": "Machine",
                    "resumo": "bad token",
                },
                sources=[],
                relations=[],
            )


if __name__ == "__main__":
    unittest.main()
