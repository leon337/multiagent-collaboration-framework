#!/usr/bin/env python3
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPORTER_PATH = ROOT / "reporter.py"
CTL_PATH = ROOT / "mcf-voice-status.py"

spec = importlib.util.spec_from_file_location("mcf_voice_reporter", REPORTER_PATH)
reporter = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(reporter)


class VoiceReporterV2Tests(unittest.TestCase):
    def active_status(self):
        return {
            "enabled": True,
            "mission_active": True,
            "mission_state": "ACTIVE",
            "mission": "MCF-TEST-001",
            "phase": "qualification",
            "message": "Teste em andamento.",
        }

    def test_gate_requires_enabled_active_mission(self):
        status = self.active_status()
        self.assertTrue(reporter.should_speak(status))
        for key, value in [
            ("enabled", False),
            ("mission_active", False),
            ("mission_state", "COMPLETED"),
            ("mission_state", "FAILED"),
            ("mission_state", "CANCELLED"),
            ("mission_state", "IDLE"),
        ]:
            candidate = dict(status)
            candidate[key] = value
            self.assertFalse(reporter.should_speak(candidate), (key, value))

    def test_fingerprint_is_stable_and_changes_with_reportable_content(self):
        status = self.active_status()
        first = reporter.fingerprint(status)
        self.assertEqual(first, reporter.fingerprint(dict(status)))
        self.assertNotEqual(first, reporter.fingerprint(dict(status, phase="audit")))
        self.assertNotEqual(first, reporter.fingerprint(dict(status, message="Novo progresso.")))
        self.assertNotEqual(first, reporter.fingerprint(dict(status, mission="MCF-TEST-002")))

    def test_last_spoken_state_persists_fingerprint(self):
        status = self.active_status()
        fp = reporter.fingerprint(status)
        with tempfile.TemporaryDirectory() as tmp:
            previous = reporter.LAST
            try:
                reporter.LAST = Path(tmp) / "last-spoken.json"
                reporter.save_last(fp, status)
                stored = json.loads(reporter.LAST.read_text(encoding="utf-8"))
            finally:
                reporter.LAST = previous
        self.assertEqual(stored["fingerprint"], fp)
        self.assertEqual(stored["mission"], status["mission"])
        self.assertEqual(stored["phase"], status["phase"])

    def test_controller_transitions_active_to_completed(self):
        with tempfile.TemporaryDirectory() as tmp:
            env = dict(os.environ, HOME=tmp)
            subprocess.run(
                [
                    sys.executable,
                    str(CTL_PATH),
                    "--resume",
                    "--active",
                    "--mission",
                    "MCF-TEST-001",
                    "--phase",
                    "build",
                    "Build em andamento.",
                ],
                check=True,
                text=True,
                capture_output=True,
                env=env,
            )
            state_path = Path(tmp) / ".local/state/mcf-voice-reporter/status.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            self.assertTrue(state["enabled"])
            self.assertTrue(state["mission_active"])
            self.assertEqual(state["mission_state"], "ACTIVE")
            subprocess.run(
                [sys.executable, str(CTL_PATH), "--complete"],
                check=True,
                text=True,
                capture_output=True,
                env=env,
            )
            state = json.loads(state_path.read_text(encoding="utf-8"))
            self.assertFalse(state["mission_active"])
            self.assertEqual(state["mission_state"], "COMPLETED")


if __name__ == "__main__":
    unittest.main()
