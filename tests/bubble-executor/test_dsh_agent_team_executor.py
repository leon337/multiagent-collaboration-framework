import importlib.util
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[2] / "ops" / "bubble-executor" / "dsh_agent_team_executor.py"
SPEC = importlib.util.spec_from_file_location("dsh_adapter", MODULE_PATH)
d = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(d)

def test_stage_a_is_dependency_free():
    plan = d.build_plan()
    a = [t for t in plan["tasks"] if t["local_id"].startswith("a-")]
    assert a
    assert all(t["blocked_by"] == [] for t in a)

def test_fanin_depends_on_all_stage_a():
    plan = d.build_plan()
    a_ids = [t["local_id"] for t in plan["tasks"] if t["local_id"].startswith("a-")]
    b = [t for t in plan["tasks"] if t["local_id"].startswith("b-")]
    assert b
    assert all(t["blocked_by"] == a_ids for t in b)

def test_prompt_names_native_agent_team_tools():
    prompt = d.build_lead_prompt(d.build_plan())
    for tool in ("spawn_teammate", "team_task_create", "team_task_update", "wait_agent", "list_agents"):
        assert tool in prompt
    assert "AGENT_TEAM_UNAVAILABLE" in prompt

def test_unavailable_backend_never_claims_execution(monkeypatch):
    monkeypatch.delenv("MCF_DSH_AGENT_TEAM_READY", raising=False)
    out = d.run(d.build_plan())
    assert out["status"] == "DSH_AGENT_TEAM_UNAVAILABLE"
    assert out["execution_claimed"] is False
