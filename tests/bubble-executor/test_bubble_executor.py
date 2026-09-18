import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "ops" / "bubble-executor"))
import bubble_executor as be

def use_tmp_state(tmp_path, monkeypatch):
    monkeypatch.setattr(be, "STATE", tmp_path)
    tmp_path.mkdir(exist_ok=True)

def test_default_contract_preserves_human_authority(tmp_path, monkeypatch):
    use_tmp_state(tmp_path, monkeypatch)
    c = be.load_contract("MCF-MEMORY-LIVE-NEXT-STABLE-001")
    assert c["human_authority"] == "LEANDRO"
    assert c["subagent_credit_requires_real_execution"] is True

def test_import_rejects_wrong_mission(tmp_path, monkeypatch):
    use_tmp_state(tmp_path, monkeypatch)
    p = tmp_path / "in.json"
    payload = dict(be.DEFAULT_MISSION)
    payload["mission_id"] = "OTHER"
    p.write_text(json.dumps(payload))
    try:
        be.import_contract("MCF-MEMORY-LIVE-NEXT-STABLE-001", str(p))
    except ValueError as e:
        assert "does not match" in str(e)
    else:
        raise AssertionError("wrong mission contract must fail closed")

def test_prepare_run_never_claims_local_model_when_unavailable(tmp_path, monkeypatch):
    use_tmp_state(tmp_path, monkeypatch)
    monkeypatch.setattr(
        be,
        "capabilities",
        lambda: {
            "model_executor_available": False,
            "local_model_executor_available": False,
            "remote_api_executor_possible": False,
        },
    )
    run = be.prepare_run("MCF-MEMORY-LIVE-NEXT-STABLE-001")
    assert run["status"] == "SANDBOX_READY_MODEL_EXECUTOR_UNAVAILABLE"
    assert "connected_agent_executor" in run["next_action"]
    assert run["anti_simulation"] == "ENFORCED"

def test_checkpoint_is_written_with_digest(tmp_path, monkeypatch):
    use_tmp_state(tmp_path, monkeypatch)
    monkeypatch.setattr(
        be,
        "capabilities",
        lambda: {
            "model_executor_available": False,
            "local_model_executor_available": False,
            "remote_api_executor_possible": False,
        },
    )
    be.prepare_run("MCF-MEMORY-LIVE-NEXT-STABLE-001")
    cp = be.emit_checkpoint("MCF-MEMORY-LIVE-NEXT-STABLE-001")
    assert len(cp["checkpoint_sha256"]) == 64
    assert Path(cp["path"]).exists()
