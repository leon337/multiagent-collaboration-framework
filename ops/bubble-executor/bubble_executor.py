#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import platform
import shutil
import socket
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
STATE = ROOT / "state"
STATE.mkdir(exist_ok=True)

DEFAULT_MISSION: dict[str, Any] = {
    "mission_id": "MCF-MEMORY-LIVE-NEXT-STABLE-001",
    "risk_class": "C",
    "coordinator": "MESTRE",
    "human_authority": "LEANDRO",
    "execution_topology": "PARALLEL_FAN_OUT_FAN_IN",
    "subagent_credit_requires_real_execution": True,
    "tool_call_evidence_required": True,
    "live_mutation_authorized": False,
    "persistent_source_of_truth": "GitHub/MCF",
    "sandbox_persistent": False,
}

def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def network_dns_ok(host: str = "github.com") -> bool:
    try:
        socket.getaddrinfo(host, 443)
        return True
    except Exception:
        return False

def capabilities() -> dict[str, Any]:
    data = {
        "timestamp_epoch": time.time(),
        "python": sys.version.split()[0],
        "platform": platform.platform(),
        "node": shutil.which("node"),
        "git": shutil.which("git"),
        "jq": shutil.which("jq"),
        "ollama": shutil.which("ollama"),
        "llama_cli": shutil.which("llama-cli"),
        "dsh": shutil.which("dsh"),
        "deepseek_harness_sdk": importlib.util.find_spec("deepseek_harness") is not None,
        "dsh_home_present": bool(os.getenv("DSH_HOME")),
        "dsh_agent_team_ready_flag": os.getenv("MCF_DSH_AGENT_TEAM_READY", "").strip().lower() in {"1", "true", "yes"},
        "network_dns_github": network_dns_ok(),
        "openai_api_key_present": bool(os.getenv("OPENAI_API_KEY")),
        "sandbox_persistent": False,
    }
    data["dsh_agent_team_executor_available"] = bool(
        data["deepseek_harness_sdk"]
        and data["dsh_home_present"]
        and data["dsh_agent_team_ready_flag"]
        and (bool(os.getenv("DEEPSEEK_API_KEY")) or bool(os.getenv("DEEPSEEK_BASE_URL")))
    )
    data["local_model_executor_available"] = bool(data["ollama"] or data["llama_cli"])
    data["remote_api_executor_possible"] = bool(
        data["network_dns_github"] and data["openai_api_key_present"]
    )
    data["model_executor_available"] = bool(
        data["dsh_agent_team_executor_available"]
        or data["local_model_executor_available"]
        or data["remote_api_executor_possible"]
    )
    return data

def print_json(data: Any) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False, sort_keys=True))

def mission_path(mission: str) -> Path:
    return STATE / f"{mission}.json"

def latest_run_path(mission: str) -> Path:
    return STATE / f"{mission}-latest-run.json"

def validate_contract(data: dict[str, Any]) -> None:
    required = {
        "mission_id",
        "coordinator",
        "human_authority",
        "execution_topology",
        "persistent_source_of_truth",
    }
    missing = sorted(required - set(data))
    if missing:
        raise ValueError(f"mission contract missing required fields: {missing}")
    if data.get("human_authority") != "LEANDRO":
        raise ValueError("human authority mismatch")
    if data.get("subagent_credit_requires_real_execution") is False:
        raise ValueError("anti-simulation invariant cannot be disabled")

def load_contract(mission: str) -> dict[str, Any]:
    path = mission_path(mission)
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        source = "sandbox_cache"
    else:
        data = dict(DEFAULT_MISSION)
        data["mission_id"] = mission
        source = "embedded_bootstrap_contract"
    validate_contract(data)
    data["recovery_source"] = source
    return data

def import_contract(mission: str, file_path: str) -> dict[str, Any]:
    src = Path(file_path)
    data = json.loads(src.read_text(encoding="utf-8"))
    if data.get("mission_id") != mission:
        raise ValueError("mission_id in imported contract does not match --mission")
    validate_contract(data)
    target = mission_path(mission)
    target.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return {
        "mission_id": mission,
        "imported_from": str(src),
        "saved_to": str(target),
        "contract_sha256": sha256_text(
            json.dumps(data, sort_keys=True, ensure_ascii=False)
        ),
    }

def prepare_run(mission: str) -> dict[str, Any]:
    caps = capabilities()
    contract = load_contract(mission)
    if caps["dsh_agent_team_executor_available"]:
        status = "READY_FOR_DSH_AGENT_TEAM_EXECUTION"
        next_action = "execute_deepseek_harness_agent_team"
    elif caps["local_model_executor_available"]:
        status = "READY_FOR_SANDBOX_MODEL_EXECUTION"
        next_action = "execute_role_bound_agents"
    elif caps["remote_api_executor_possible"]:
        status = "READY_FOR_REMOTE_API_EXECUTION"
        next_action = "execute_role_bound_agents_via_remote_api"
    else:
        status = "SANDBOX_READY_MODEL_EXECUTOR_UNAVAILABLE"
        next_action = "use_connected_agent_executor_without_claiming_local_model_execution"
    run = {
        "mission_id": mission,
        "run_id": f"bubble-{int(time.time())}",
        "created_epoch": time.time(),
        "runtime": "chatgpt_sandbox",
        "capabilities": caps,
        "contract": contract,
        "status": status,
        "next_action": next_action,
        "anti_simulation": "ENFORCED",
        "live_mutation_performed": False,
    }
    latest_run_path(mission).write_text(
        json.dumps(run, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    if not mission_path(mission).exists():
        persisted = dict(contract)
        persisted.pop("recovery_source", None)
        mission_path(mission).write_text(
            json.dumps(persisted, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    return run

def emit_checkpoint(mission: str) -> dict[str, Any]:
    run_path = latest_run_path(mission)
    if not run_path.exists():
        raise FileNotFoundError("no prepared run exists; run prepare-run first")
    run = json.loads(run_path.read_text(encoding="utf-8"))
    checkpoint = {
        "mission_id": mission,
        "runtime": "chatgpt_sandbox",
        "run_id": run["run_id"],
        "state": run["status"],
        "persistent_source_of_truth": run["contract"]["persistent_source_of_truth"],
        "sandbox_persistent": False,
        "anti_simulation": run["anti_simulation"],
        "model_executor_available": run["capabilities"]["model_executor_available"],
        "dsh_agent_team_executor_available": run["capabilities"].get("dsh_agent_team_executor_available", False),
        "next_action": run["next_action"],
        "checkpoint_sha256": "",
    }
    unsigned = json.dumps(checkpoint, sort_keys=True, ensure_ascii=False)
    checkpoint["checkpoint_sha256"] = sha256_text(unsigned)
    out = STATE / f"{mission}-checkpoint.json"
    out.write_text(
        json.dumps(checkpoint, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    checkpoint["path"] = str(out)
    return checkpoint

def main() -> int:
    parser = argparse.ArgumentParser(
        description="MCF persistent ChatGPT bubble/sandbox executor"
    )
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("doctor")

    for name in ("recover", "prepare-run", "checkpoint"):
        p = sub.add_parser(name)
        p.add_argument("--mission", required=True)

    imp = sub.add_parser("import-contract")
    imp.add_argument("--mission", required=True)
    imp.add_argument("--file", required=True)

    args = parser.parse_args()
    if args.cmd == "doctor":
        print_json(capabilities())
    elif args.cmd == "recover":
        print_json(load_contract(args.mission))
    elif args.cmd == "import-contract":
        print_json(import_contract(args.mission, args.file))
    elif args.cmd == "prepare-run":
        print_json(prepare_run(args.mission))
    elif args.cmd == "checkpoint":
        print_json(emit_checkpoint(args.mission))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
