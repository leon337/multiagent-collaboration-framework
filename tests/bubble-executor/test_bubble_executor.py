import importlib.util
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

MODULE_PATH = Path(__file__).resolve().parents[2] / "ops" / "bubble-executor" / "bubble_executor.py"
SPEC = importlib.util.spec_from_file_location("bubble_executor", MODULE_PATH)
be = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = be
SPEC.loader.exec_module(be)


class BubbleExecutorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.state = Path(self.tmp.name)
        self.state.mkdir(exist_ok=True)
        self.state_patch = mock.patch.object(be, "STATE", self.state)
        self.state_patch.start()
        self.addCleanup(self.state_patch.stop)

    def test_default_contract_preserves_human_authority(self):
        contract = be.load_contract("MCF-MEMORY-LIVE-NEXT-STABLE-001")
        self.assertEqual(contract["human_authority"], "LEANDRO")
        self.assertTrue(contract["subagent_credit_requires_real_execution"])

    def test_import_rejects_wrong_mission(self):
        p = self.state / "in.json"
        payload = dict(be.DEFAULT_MISSION)
        payload["mission_id"] = "OTHER"
        p.write_text(json.dumps(payload), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "does not match"):
            be.import_contract("MCF-MEMORY-LIVE-NEXT-STABLE-001", str(p))

    def test_prepare_run_never_claims_local_model_when_unavailable(self):
        caps = {
            "model_executor_available": False,
            "dsh_agent_team_executor_available": False,
            "local_model_executor_available": False,
            "remote_api_executor_possible": False,
        }
        with mock.patch.object(be, "capabilities", return_value=caps):
            run = be.prepare_run("MCF-MEMORY-LIVE-NEXT-STABLE-001")
        self.assertEqual(run["status"], "SANDBOX_READY_MODEL_EXECUTOR_UNAVAILABLE")
        self.assertIn("connected_agent_executor", run["next_action"])
        self.assertEqual(run["anti_simulation"], "ENFORCED")

    def test_dsh_agent_team_has_executor_priority(self):
        caps = {
            "model_executor_available": True,
            "dsh_agent_team_executor_available": True,
            "local_model_executor_available": True,
            "remote_api_executor_possible": True,
        }
        with mock.patch.object(be, "capabilities", return_value=caps):
            run = be.prepare_run("MCF-MEMORY-LIVE-NEXT-STABLE-001")
        self.assertEqual(run["status"], "READY_FOR_DSH_AGENT_TEAM_EXECUTION")
        self.assertEqual(run["next_action"], "execute_deepseek_harness_agent_team")

    def test_checkpoint_is_written_with_digest(self):
        caps = {
            "model_executor_available": False,
            "dsh_agent_team_executor_available": False,
            "local_model_executor_available": False,
            "remote_api_executor_possible": False,
        }
        with mock.patch.object(be, "capabilities", return_value=caps):
            be.prepare_run("MCF-MEMORY-LIVE-NEXT-STABLE-001")
        cp = be.emit_checkpoint("MCF-MEMORY-LIVE-NEXT-STABLE-001")
        self.assertEqual(len(cp["checkpoint_sha256"]), 64)
        self.assertTrue(Path(cp["path"]).exists())


if __name__ == "__main__":
    unittest.main()
