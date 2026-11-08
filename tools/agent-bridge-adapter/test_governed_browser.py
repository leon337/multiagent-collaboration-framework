"""Contract, fail-closed, checkpoint and recovery tests for governed browser missions."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("governed_browser",
                                              Path(__file__).with_name("governed_browser.py"))
governed = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(governed)

ROOT = "https://github.com/leon337/multiagent-collaboration-framework"
DOCS = ROOT + "/tree/main/docs"
DOC = ROOT + "/blob/main/docs/MCF-CURRENT-STATE.md"
ORIGINAL = "https://www.nvidia.com/en-eu/gtc/keynote/"


def mission(mission_id="browser-governed-test"):
    return {
        "missionId": mission_id, "instanceId": "notebook-team2",
        "objective": "Inspecionar a documentação oficial do MCF",
        "startUrl": ROOT, "allowedHosts": ["github.com"],
        "waypoints": ["docs", "MCF-CURRENT-STATE.md"],
        "maxSteps": 4, "authorizedScope": True, "restoreWorkspace": True,
    }


class FakeClient:
    def __init__(self, instance):
        self.instance = instance
        self.home = None
        self.url = ORIGINAL
        self.calls = []

    def discovery(self):
        return {"discovery": {"instance": {
            "instanceId": self.instance, "paused": False, "busy": False, "queueDepth": 0
        }}}

    def read(self, key):
        if key == "text":
            return {"page": {"url": self.url, "text": "Example public documentation content"}}
        if key == "interactive":
            labels = {ROOT: [{"tag": "a", "text": "docs", "href": DOCS}],
                      DOCS: [{"tag": "a", "text": "MCF-CURRENT-STATE.md", "href": DOC}]}
            return {"page": {"url": self.url, "nodes": labels.get(self.url, [])}}
        raise AssertionError(key)


class GovernedMissionTests(unittest.TestCase):
    def test_urls_reject_private_scheme_query_and_sensitive_paths(self):
        for url in (
            "http://github.com/owner/repo", "https://localhost/a",
            "https://github.com/login", "https://github.com/a?token=abc",
            "https://127.0.0.1/private", "https://github.com/account/settings",
            "https://evil.example/repo", "https://github.com/a#fragment",
        ):
            with self.subTest(url=url), self.assertRaises(governed.MissionBlocked):
                governed.validate_url(url, ["github.com"])

    def test_cannot_overstate_scope(self):
        for key, value in [
            ("authorizedScope", False),
            ("waypoints", ["Delete repository"]),
            ("maxSteps", 1),
            ("allowedHosts", ["localhost"]),
            ("restoreWorkspace", False),
            ("unsafeKey", "anything"),
        ]:
            c = mission()
            c[key] = value
            with self.subTest(key=key), self.assertRaises(governed.MissionBlocked):
                governed.validated_config(c)

    def test_ambiguous_links_fail_closed(self):
        client = FakeClient("notebook-team2")
        client.url = ROOT
        client.read = lambda key: {
            "page": {"url": ROOT, "nodes": [
                {"tag": "a", "text": "docs", "href": DOCS},
                {"tag": "a", "text": "docs", "href": DOC},
            ]},
        }
        with self.assertRaisesRegex(governed.MissionBlocked, "ambiguous"):
            governed.select_link(client, "docs", ["github.com"], ROOT)

    def test_duplicate_semantic_links_same_url_are_safe(self):
        client = FakeClient("notebook-team2")
        client.url = DOCS
        client.read = lambda key: {
            "page": {"url": DOCS, "nodes": [
                {"tag": "a", "text": "MCF-CURRENT-STATE.md", "href": DOC},
                {"tag": "a", "text": "MCF-CURRENT-STATE.md", "href": DOC},
            ]},
        }
        self.assertEqual(governed.select_link(client, "MCF-CURRENT-STATE.md", ["github.com"], DOCS), DOC)

    def build_route(self, client):
        def fake_route(_client, method, path, body=None):
            client.calls.append((method, path, body))
            if path.startswith("/v1/recovery-checkpoint"):
                return {"ok": True, "mutationAllowed": True, "recoveryRequired": False}
            if path.startswith("/v1/state"):
                return {"state": {"instanceId": "notebook-team2", "pane": "workspace",
                                  "url": client.url, "title": client.url, "loading": False}}
            if path == "/v1/navigate":
                client.url = body["url"]
                return {"ok": True, "url": client.url}
            raise AssertionError(path)
        return fake_route

    def test_plan_verify_journal_restore_idempotently(self):
        client = FakeClient("notebook-team2")
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(governed, "BridgeClient", return_value=client), \
                 patch.object(governed, "route", side_effect=self.build_route(client)), \
                 patch.object(governed, "receipt"):
                result = governed.run(mission(), base=Path(directory))
                self.assertTrue(result["verified"])
                self.assertEqual(result["completedSteps"], 3)
                self.assertTrue(result["restored"])
                self.assertEqual(client.url, ORIGINAL)
                self.assertEqual([x["kind"] for x in result["events"]].count("NAVIGATION_VERIFIED"), 3)
                cp = Path(directory) / "browser-governed-test.json"
                self.assertEqual(cp.stat().st_mode & 0o777, 0o600)
                self.assertNotIn("Example public documentation content", cp.read_text())
                before = len(client.calls)
                rerun = governed.run(mission(), base=Path(directory))
                self.assertEqual(rerun["evidenceDigest"], result["evidenceDigest"])
                self.assertEqual(len(client.calls), before)

    def test_missing_semantic_link_is_recovering_not_green(self):
        client = FakeClient("notebook-team2")
        client.read = lambda key: (
            {"page": {"url": client.url, "text": "Public informational content"}}
            if key == "text" else {"page": {"url": client.url, "nodes": []}}
        )
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(governed, "BridgeClient", return_value=client), \
                 patch.object(governed, "route", side_effect=self.build_route(client)), \
                 patch.object(governed, "receipt"):
                result = governed.run(mission(), base=Path(directory))
                self.assertEqual(result["status"], "RECOVERING")
                self.assertFalse(result["verified"])
                self.assertTrue(result["restored"])
                self.assertIn("ambiguous_or_missing", result["failureCode"])

    def test_single_workspace_lock_blocks_a_second_mission(self):
        with tempfile.TemporaryDirectory() as directory:
            with governed.exclusive_mission(Path(directory), "m-one", "notebook-team2"):
                with self.assertRaisesRegex(governed.MissionBlocked, "already_running"):
                    with governed.exclusive_mission(Path(directory), "m-two", "notebook-team2"):
                        pass

    def test_crash_after_navigation_resumes_only_verified_effects(self):
        client = FakeClient("notebook-team2")
        client.url = ROOT
        cfg = governed.validated_config(mission())
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "browser-governed-test.json"
            prior = {
                "schema": governed.SCHEMA, "missionId": cfg["missionId"],
                "instanceId": cfg["instanceId"], "configDigest": governed.digest(cfg),
                "status": "RUNNING", "completedSteps": 0,
                "inFlight": {"step": 0, "url": ROOT},
                "events": [], "restored": False, "originalUrl": ORIGINAL,
            }
            path.write_text(json.dumps(prior))
            path.chmod(0o600)
            with patch.object(governed, "BridgeClient", return_value=client), \
                 patch.object(governed, "route", side_effect=self.build_route(client)), \
                 patch.object(governed, "receipt"):
                result = governed.run(cfg, base=Path(directory))
            self.assertTrue(result["verified"])
            self.assertEqual(result["completedSteps"], 3)
            self.assertEqual(client.url, ORIGINAL)
            self.assertTrue(any(event.get("recovered") for event in result["events"]))

    def test_crash_checkpoint_not_blindly_replayed(self):
        client = FakeClient("notebook-team2")
        cfg = governed.validated_config(mission())
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "browser-governed-test.json"
            prior = {
                "schema": governed.SCHEMA, "missionId": cfg["missionId"],
                "instanceId": cfg["instanceId"], "configDigest": governed.digest(cfg),
                "status": "RECOVERING", "completedSteps": 0,
                "inFlight": {"step": 0, "url": ROOT},
                "events": [], "restored": False, "originalUrl": ORIGINAL,
            }
            path.write_text(json.dumps(prior))
            path.chmod(0o600)
            with patch.object(governed, "BridgeClient", return_value=client), \
                 patch.object(governed, "route", side_effect=self.build_route(client)), \
                 patch.object(governed, "receipt"):
                result = governed.run(cfg, base=Path(directory))
            self.assertFalse(result["verified"])
            self.assertIn("uncertain_inflight", result["failureCode"])
            self.assertEqual(client.url, ORIGINAL)


if __name__ == "__main__":
    unittest.main()
