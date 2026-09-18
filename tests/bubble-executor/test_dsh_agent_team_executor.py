import importlib.util
import os
import sys
import unittest
from pathlib import Path
from unittest import mock

MODULE_PATH = Path(__file__).resolve().parents[2] / "ops" / "bubble-executor" / "dsh_agent_team_executor.py"
SPEC = importlib.util.spec_from_file_location("dsh_adapter", MODULE_PATH)
d = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = d
SPEC.loader.exec_module(d)


class DshAgentTeamAdapterTests(unittest.TestCase):
    def test_stage_a_is_dependency_free(self):
        plan = d.build_plan()
        stage_a = [t for t in plan["tasks"] if t["local_id"].startswith("a-")]
        self.assertTrue(stage_a)
        self.assertTrue(all(t["blocked_by"] == [] for t in stage_a))

    def test_fanin_depends_on_all_stage_a(self):
        plan = d.build_plan()
        a_ids = [t["local_id"] for t in plan["tasks"] if t["local_id"].startswith("a-")]
        fanin = [t for t in plan["tasks"] if t["local_id"].startswith("b-")]
        self.assertTrue(fanin)
        self.assertTrue(all(t["blocked_by"] == a_ids for t in fanin))

    def test_prompt_names_native_agent_team_tools(self):
        prompt = d.build_lead_prompt(d.build_plan())
        for tool in ("spawn_teammate", "team_task_create", "team_task_update", "wait_agent", "list_agents"):
            self.assertIn(tool, prompt)
        self.assertIn("AGENT_TEAM_UNAVAILABLE", prompt)

    def test_unavailable_backend_never_claims_execution(self):
        env = {
            "MCF_DSH_AGENT_TEAM_READY": "",
            "DSH_HOME": "",
            "DEEPSEEK_API_KEY": "",
            "DEEPSEEK_BASE_URL": "",
        }
        with mock.patch.dict(os.environ, env, clear=False):
            out = d.run(d.build_plan())
        self.assertEqual(out["status"], "DSH_AGENT_TEAM_UNAVAILABLE")
        self.assertFalse(out["execution_claimed"])


if __name__ == "__main__":
    unittest.main()
