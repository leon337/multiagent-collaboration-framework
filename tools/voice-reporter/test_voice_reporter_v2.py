#!/usr/bin/env python3
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent
REPORTER_PATH = ROOT / "reporter.py"
CTL_PATH = ROOT / "mcf-voice-status.py"

spec = importlib.util.spec_from_file_location("mcf_voice_reporter", REPORTER_PATH)
reporter = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(reporter)


class VoiceReporterV3Tests(unittest.TestCase):
    def active_status(self):
        return {
            "enabled": True,
            "mission_active": True,
            "mission_state": "ACTIVE",
            "project": "MCF",
            "mission": "MCF-TEST-001",
            "phase": "qualification",
            "message": "Teste em andamento.",
            "agent": "MESTRE",
            "voice_profile": "clear",
            "rendered_audio_path": None,
            "allow_tts_fallback": True,
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

    def test_fingerprint_tracks_mestre_identity_and_voice_profile(self):
        status = self.active_status()
        first = reporter.fingerprint(status)
        self.assertEqual(first, reporter.fingerprint(dict(status)))
        self.assertNotEqual(first, reporter.fingerprint(dict(status, phase="audit")))
        self.assertNotEqual(first, reporter.fingerprint(dict(status, message="Novo progresso.")))
        self.assertNotEqual(first, reporter.fingerprint(dict(status, mission="MCF-TEST-002")))
        self.assertNotEqual(first, reporter.fingerprint(dict(status, agent="AUGUSTO")))
        self.assertNotEqual(first, reporter.fingerprint(dict(status, voice_profile="fallback")))

    def test_rendered_audio_is_preferred(self):
        status = dict(
            self.active_status(),
            rendered_audio_path="/home/test/.cache/voicehub-linux/generated/checkpoint.mp3",
        )
        rendered_result = {
            "ok": True,
            "job": {
                "id": "audio-job",
                "status": "DONE",
                "kind": "rendered_audio",
                "voice_profile": "clear",
            },
        }
        with patch.object(reporter, "queue_is_busy", return_value=False), patch.object(
            reporter, "_post_json", return_value=rendered_result
        ) as post:
            result = reporter.speak(status)

        self.assertEqual(result["delivery"], "rendered_audio")
        self.assertFalse(result["fallback_used"])
        self.assertEqual(post.call_count, 1)
        self.assertEqual(post.call_args.args[0], reporter.AUDIO_ENQUEUE_URL)
        self.assertEqual(post.call_args.args[1]["agent"], "MESTRE")

    def test_rendered_audio_failure_falls_back_to_tts(self):
        status = dict(
            self.active_status(),
            rendered_audio_path="/home/test/.cache/voicehub-linux/generated/checkpoint.mp3",
        )
        speech_result = {
            "ok": True,
            "job": {
                "id": "speech-job",
                "status": "DONE",
                "kind": "speech",
            },
        }
        with patch.object(reporter, "queue_is_busy", return_value=False), patch.object(
            reporter,
            "_post_json",
            side_effect=[RuntimeError("audio endpoint unavailable"), speech_result],
        ) as post:
            result = reporter.speak(status)

        self.assertEqual(result["delivery"], "speech_tts")
        self.assertTrue(result["fallback_used"])
        self.assertEqual(post.call_count, 2)
        self.assertEqual(post.call_args_list[1].args[0], reporter.ENQUEUE_URL)

    def test_last_spoken_state_persists_fingerprint_and_delivery(self):
        status = self.active_status()
        fp = reporter.fingerprint(status)
        with tempfile.TemporaryDirectory() as tmp:
            previous = reporter.LAST
            try:
                reporter.LAST = Path(tmp) / "last-spoken.json"
                reporter.save_last(fp, status, {"delivery": "rendered_audio"})
                stored = json.loads(reporter.LAST.read_text(encoding="utf-8"))
            finally:
                reporter.LAST = previous
        self.assertEqual(stored["fingerprint"], fp)
        self.assertEqual(stored["agent"], "MESTRE")
        self.assertEqual(stored["mission"], status["mission"])
        self.assertEqual(stored["phase"], status["phase"])
        self.assertEqual(stored["delivery"]["delivery"], "rendered_audio")

    def test_controller_transitions_active_to_completed_and_defaults_to_mestre(self):
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
            self.assertEqual(state["agent"], "MESTRE")
            self.assertEqual(state["voice_profile"], "clear")
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
