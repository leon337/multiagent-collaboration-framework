#!/usr/bin/env python3
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import shutil
import sys
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

MISSION_ID = "MCF-MEMORY-LIVE-NEXT-STABLE-001"

@dataclass(frozen=True)
class TeamMember:
    name: str
    role: str
    task: str
    stage: str

MEMORY_TEAM = [
    TeamMember("miriam", "Memória e proveniência",
               "Definir provenance, precedência, supersession, currentness e lifecycle da memória.", "A"),
    TeamMember("sofia", "Arquitetura",
               "Definir limites e contratos da arquitetura MCF -> Cognitive Ledger.", "A"),
    TeamMember("manoel", "Persistência",
               "Definir invariantes de persistência, idempotência, migração, backup e restore.", "A"),
    TeamMember("ricardo", "Segurança",
               "Modelar ameaças, poisoning, replay, escalada de privilégio e controles fail-closed.", "A"),
    TeamMember("julia", "Governança",
               "Definir gates humanos, minimização, correção, expiração e auditabilidade.", "A"),
    TeamMember("beatriz", "Avaliação",
               "Definir evals e regressões para memória útil sem influência obsoleta ou insegura.", "A"),
    TeamMember("augusto", "Observabilidade",
               "Definir traces, tool evidence, attribution e ligações memória->decisão.", "A"),
    TeamMember("emily", "Auditoria independente",
               "Auditar evidências, falso verde, riscos residuais e lacunas de governança.", "B"),
]

def detect() -> dict[str, Any]:
    sdk_present = importlib.util.find_spec("deepseek_harness") is not None
    dsh_bin = shutil.which("dsh")
    ready_flag = os.getenv("MCF_DSH_AGENT_TEAM_READY", "").strip().lower() in {"1","true","yes"}
    dsh_home = os.getenv("DSH_HOME")
    api_key_present = bool(os.getenv("DEEPSEEK_API_KEY"))
    base_url_present = bool(os.getenv("DEEPSEEK_BASE_URL"))
    return {
        "sdk_present": sdk_present,
        "dsh_bin": dsh_bin,
        "dsh_home_present": bool(dsh_home),
        "api_key_present": api_key_present,
        "base_url_present": base_url_present,
        "agent_team_ready_flag": ready_flag,
        "available_for_execution": bool(
            sdk_present and dsh_home and ready_flag and (api_key_present or base_url_present)
        ),
        "experimental_backend": True,
    }

def build_plan(mission_id: str = MISSION_ID) -> dict[str, Any]:
    stage_a = [m for m in MEMORY_TEAM if m.stage == "A"]
    stage_b = [m for m in MEMORY_TEAM if m.stage == "B"]
    tasks = []
    for index, member in enumerate(stage_a, start=1):
        tasks.append({
            "local_id": f"a-{index}",
            "owner": member.name,
            "subject": f"{member.role} — discovery/design",
            "description": member.task,
            "blocked_by": [],
        })
    stage_a_ids = [t["local_id"] for t in tasks]
    for index, member in enumerate(stage_b, start=1):
        tasks.append({
            "local_id": f"b-{index}",
            "owner": member.name,
            "subject": f"{member.role} — fan-in",
            "description": member.task,
            "blocked_by": stage_a_ids,
        })
    return {
        "mission_id": mission_id,
        "runtime": "deepseek-harness",
        "composition": "native-experimental-agent-teams",
        "lead": "mestre",
        "members": [asdict(m) for m in MEMORY_TEAM],
        "tasks": tasks,
        "topology": "PARALLEL_FAN_OUT_FAN_IN",
        "human_authority": "LEANDRO",
        "implementation_authorized": False,
        "live_mutation_authorized": False,
    }

def build_lead_prompt(plan: dict[str, Any]) -> str:
    roster = "\n".join(
        f"- {m['name']}: {m['role']} — {m['task']}" for m in plan["members"]
    )
    tasks = "\n".join(
        f"- {t['local_id']} owner={t['owner']} blocked_by={','.join(t['blocked_by']) or 'none'}: "
        f"{t['subject']} — {t['description']}"
        for t in plan["tasks"]
    )
    return f"""Você é MESTRE, Team Lead da missão {plan['mission_id']}.

Use EXCLUSIVAMENTE os Agent Teams tools realmente disponíveis no DeepSeek Harness.
Ferramentas esperadas quando o profile estiver habilitado:
list_agents, spawn_teammate, send_message, team_task_create, team_task_get,
team_task_list, team_task_update, wait_agent e interrupt_agent.

Regras MCF:
- LEANDRO é autoridade humana final.
- Não alegue execução de teammate sem evento/tool evidence real.
- Stage A deve ser independente: não aguarde outro autor para começar.
- Stage B só começa depois das tarefas Stage A necessárias estarem completas.
- Nenhuma mutation do Cognitive Ledger ou produção está autorizada.
- Não exponha segredos, service_role ou memória pessoal real.
- Preserve task ids, member names e evidências de tool calls no resumo final.
- Se Agent Teams não estiver disponível/saudável, pare com AGENT_TEAM_UNAVAILABLE.

Roster:
{roster}

Task DAG:
{tasks}

Procedimento:
1. liste o roster atual;
2. crie teammates ausentes com spawn_teammate(context="fresh");
3. crie o task board com team_task_create respeitando blocked_by;
4. envie a cada teammate somente sua tarefa e o contexto mínimo;
5. permita execução concorrente das tarefas Stage A;
6. use wait_agent/list_agents/team_task_list para observar progresso;
7. execute o fan-in da auditoria somente após os blockers;
8. devolva um resumo factual com team members, task states, falhas e evidências.
"""

def run(plan: dict[str, Any]) -> dict[str, Any]:
    caps = detect()
    if not caps["available_for_execution"]:
        return {
            "status": "DSH_AGENT_TEAM_UNAVAILABLE",
            "capabilities": caps,
            "plan": plan,
            "execution_claimed": False,
        }

    from deepseek_harness import DeepSeekHarness

    dsh_home = str(Path(os.environ["DSH_HOME"]).resolve())
    workspace = str(Path(os.getenv("MCF_DSH_WORKSPACE", os.getcwd())).resolve())
    profile = os.getenv("MCF_DSH_PROFILE", "sdk")
    provider = os.getenv("MCF_DSH_PROVIDER", "deepseek-official")
    model = os.getenv("MCF_DSH_MODEL", "deepseek-v4-flash")
    session_id = os.getenv("MCF_DSH_SESSION_ID", f"mcf-{plan['mission_id'].lower()}")

    started = time.time()
    with DeepSeekHarness(
        dsh_home=dsh_home,
        cwd=workspace,
        profile=profile,
        provider=provider,
        model=model,
        base_url=os.getenv("DEEPSEEK_BASE_URL"),
        api_key=os.getenv("DEEPSEEK_API_KEY"),
    ) as harness:
        result = harness.run(build_lead_prompt(plan), session_id=session_id)

    return {
        "status": "DSH_AGENT_TEAM_TURN_COMPLETE",
        "session_id": result.session_id,
        "finish_reason": result.finish_reason,
        "final_response": result.final_response,
        "events": result.events,
        "notifications": result.notifications,
        "duration_seconds": time.time() - started,
        "execution_claimed": True,
        "capabilities": caps,
    }

def main() -> int:
    parser = argparse.ArgumentParser(description="MCF -> DeepSeek Harness Agent Teams adapter")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("doctor")
    sub.add_parser("plan")
    sub.add_parser("prompt")
    sub.add_parser("run")
    args = parser.parse_args()
    if args.cmd == "doctor":
        out = detect()
    elif args.cmd == "plan":
        out = build_plan()
    elif args.cmd == "prompt":
        print(build_lead_prompt(build_plan()))
        return 0
    else:
        out = run(build_plan())
    print(json.dumps(out, indent=2, ensure_ascii=False, default=str))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
