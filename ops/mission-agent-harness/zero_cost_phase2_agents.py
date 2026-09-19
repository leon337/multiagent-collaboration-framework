#!/usr/bin/env python3
"""Zero-cost, role-bound local agent runner for MCF Phase 2.

This harness executes separate Ollama subprocesses for selected MCF agents.
It is mission tooling only: it does not modify Cognitive Ledger, call paid APIs,
or grant execution credit unless the run produces non-empty, attributable output.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import subprocess
import sys
import time
import uuid
from dataclasses import dataclass

MISSION_ID = "MCF-MEMORY-LIVE-NEXT-STABLE-001"

MISSION_CONTEXT = """
Mission objective: design the governed architecture for persistent cross-chat memory in the next stable MCF release.

Confirmed technical/product constraints:
- Cognitive Ledger already exists; Supabase/Postgres is the operational source of truth.
- Existing provider data must be preserved; no destructive reset/reseed.
- Existing provider write is transactional; MCF still lacks a governed memory-write capability.
- MCF write must use a dedicated least-privilege capability/OAuth boundary; never expose generic SQL or Supabase service_role to MCF.
- Success may only be claimed after persistence + read-back + auditable Receipt.
- Original authorized wording belongs in private source/provenance; structured meaning belongs in the cognitive event.
- Persist only the relevant excerpt plus minimum context; never whole-chat capture by default.
- Generate 3-8 concise keywords for readability.
- Normal correction preserves history; explicit definitive deletion uses a separate privileged hard-delete path.
- Textual/structured search must work without embeddings. External embeddings are disabled by default and require separate opt-in.
- New real memories must not be exported automatically to public Git, CI, logs, or public evidence.
- Synthetic proof comes first. Real memory is only used after gates and explicit authorization.
- Target release is v1.2.0 if the change remains additive/non-breaking.
- Zero-new-cost invariant: no paid API, billable agent run, paid model, paid runner, or paid embedding provider.
- Anti-simulation invariant: do not claim tools, observations, evidence, or actions that this execution did not actually perform.
- If a fact is absent from this packet, mark it UNKNOWN or as a design assumption; do not invent live state.
""".strip()


@dataclass(frozen=True)
class AgentPacket:
    agent_id: str
    role: str
    task: str
    handoff: str


AGENTS = [
    AgentPacket("Miriam", "Memória e Gestão do Conhecimento", "Define provenance, source-of-truth precedence, reconciliation rules, context recovery semantics, contradiction handling, and memory governance constraints for this architecture.", "Sofia"),
    AgentPacket("Sofia", "Arquitetura de Software", "Produce the architecture boundary and ADR-level design for MCF -> Cognitive Ledger governed write, including component responsibilities, failure boundaries, read/write separation, and live/repository drift reconciliation strategy.", "Manoel"),
    AgentPacket("Manoel", "Banco de Dados", "Define database invariants, compatibility/migration plan, backup/restore preconditions, idempotency/collision behavior, supersession relations, and definitive-delete data semantics while preserving existing records.", "Daniela"),
    AgentPacket("Daniela", "Engenharia de Dados", "Define lineage, data-quality checks, provenance fields, reconciliation evidence, and how to prevent public-Git/private-provider divergence from becoming operational truth confusion.", "Ricardo"),
    AgentPacket("Ricardo", "Segurança", "Create a threat model for OAuth/capability write, legacy admin route isolation, secrets, replay/idempotency, authorization scope, data exfiltration, logging, hard delete, and fail-closed behavior.", "Júlia"),
    AgentPacket("Júlia", "Governança e Compliance de IA", "Review privacy, autonomy, data minimization, consent/confirmation, deletion governance, external-provider prohibition under zero-cost policy, and human authority boundaries for this Class C mission.", "Tiago"),
    AgentPacket("Tiago", "IA e Machine Learning", "Define zero-cost search/RAG/embedding policy, textual fallback, optional local embeddings criteria, model-independence, and quality risks without activating any paid provider.", "Rafael"),
    AgentPacket("Rafael", "Engenharia de Software", "Translate the approved architecture constraints into an implementation decomposition across MCF runtime, adapter/capability registry, Ledger API boundary, tests, and migration sequencing. Do not write product code in this phase.", "Eduardo"),
    AgentPacket("Eduardo", "Engenharia Backend", "Specify semantic API/capability contracts for register-memory, read-back, Receipt, correction/supersession, definitive deletion, and error behavior. No generic DB/SQL surface.", "Bruno"),
    AgentPacket("Bruno", "Plataforma, DevOps e SRE", "Define zero-cost lab/staging execution, exact-SHA promotion, health/readiness, backup/restore rehearsal, rollback, observability, and secret-safe logging using existing/free infrastructure only.", "Renato"),
    AgentPacket("Renato", "Qualidade e Testes", "Design the validation matrix: auth, idempotency, collision, read-back, cross-chat A->B, deletion, regression read-only, provider drift, backup/restore, exact-SHA staging, and zero-private-data test discipline.", "Beatriz"),
    AgentPacket("Beatriz", "Avaliação de Agentes", "Define behavioral evals for Mestre/Miriam memory capture, suggestion/confirmation, keyword generation, cognitive-card retrieval, fail-closed claims, and cross-chat recovery regressions.", "Augusto"),
    AgentPacket("Augusto", "Observabilidade Multiagente", "Define ESEV trace requirements, per-agent artifact/receipt linkage, handoff observability, loop-progress metrics, and anti-simulation checks for the mission.", "Emily"),
    AgentPacket("Emily", "Auditoria Independente", "Audit the architecture package criteria and list evidence that must exist before approval. Do not approve anything not actually evidenced by the packet/run logs.", "Léo"),
    AgentPacket("Léo", "Autoridade Delegada de Continuidade e Gates Internos", "Using only the prior agent artifacts in this run as advisory input, define the evidence-based gate conditions for APPROVE, APPROVE_WITH_RESERVATIONS, RETURN_FOR_CORRECTION, or BLOCK. Do not claim the gate is passed unless evidence actually supports it.", "Mestre"),
]

# Artifact structure is validated independently from handoff transport. The
# handoff itself is emitted by the harness as machine-bound evidence so a small
# local model cannot invalidate an otherwise attributable artifact merely by
# omitting one narrative heading.
REQUIRED_HEADINGS = [
    "## Entrada recebida",
    "## Ação executada",
    "## Evidência observada",
    "## Resultado e análise",
    "## Decisão e entrega",
]


def build_prompt(packet: AgentPacket, prior_summary: str) -> str:
    return f"""Você é {packet.agent_id}, agente oficial do MCF na competência: {packet.role}.
Esta é uma execução local real e isolada do modelo; sua saída será registrada como artefato desta execução específica.

Regras obrigatórias:
1. Trabalhe SOMENTE com o contexto fornecido abaixo e com os artefatos resumidos de execuções anteriores deste mesmo run.
2. Não invente ferramenta, consulta, commit, deploy, teste, provider state ou evidência externa.
3. Quando faltar uma informação, use UNKNOWN ou DESIGN_ASSUMPTION.
4. Não inclua segredos, credenciais, memória pessoal real ou dados privados.
5. Não proponha API paga como requisito. O design deve operar a custo novo zero.
6. Sua entrega deve ser substantiva, técnica e específica à sua competência.
7. Use exatamente os cinco títulos Markdown obrigatórios abaixo. O handoff formal será registrado separadamente pelo harness como evidência de máquina; você pode mencionar o destinatário na análise, mas não precisa criar um sexto título.

Missão: {MISSION_ID}

Contexto canônico fornecido pelo Mestre:
{MISSION_CONTEXT}

Resumo dos artefatos anteriores neste run (pode estar vazio):
{prior_summary or 'NENHUM — primeira execução da cadeia.'}

Sua tarefa específica:
{packet.task}

Handoff esperado: {packet.agent_id} -> {packet.handoff}

Formato obrigatório:
## Entrada recebida
...
## Ação executada
...
## Evidência observada
...
## Resultado e análise
...
## Decisão e entrega
...
"""


def execute_agent(model: str, packet: AgentPacket, prior_summary: str, timeout: int) -> tuple[str, dict[str, str]]:
    run_id = str(uuid.uuid4())
    started = time.time()
    prompt = build_prompt(packet, prior_summary)
    proc = subprocess.run(
        ["ollama", "run", model],
        input=prompt,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )
    ended = time.time()
    stdout = (proc.stdout or "").strip()
    stderr = (proc.stderr or "").strip()
    if proc.returncode != 0:
        raise RuntimeError(f"{packet.agent_id}: ollama exit={proc.returncode}; stderr={stderr[-1000:]}")
    if not stdout:
        raise RuntimeError(f"{packet.agent_id}: empty output")
    missing = [heading for heading in REQUIRED_HEADINGS if heading not in stdout]
    if missing:
        raise RuntimeError(f"{packet.agent_id}: missing required headings: {missing}")
    digest = hashlib.sha256(stdout.encode("utf-8")).hexdigest()
    meta = {
        "agent_id": packet.agent_id,
        "role": packet.role,
        "run_id": run_id,
        "model": model,
        "started_epoch": f"{started:.3f}",
        "ended_epoch": f"{ended:.3f}",
        "duration_seconds": f"{ended - started:.3f}",
        "sha256": digest,
        "handoff_to": packet.handoff,
    }
    return stdout, meta


def summarize_for_next(agent_id: str, output: str, limit: int = 3500) -> str:
    compact = " ".join(output.split())
    if len(compact) > limit:
        compact = compact[:limit] + " ...[TRUNCATED_FOR_NEXT_PACKET]"
    return f"{agent_id}: {compact}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default=os.environ.get("OLLAMA_MODEL", "qwen2.5:1.5b"))
    parser.add_argument("--timeout", type=int, default=420)
    args = parser.parse_args()

    prior: list[str] = []
    print(f"MCF_ZERO_COST_HARNESS_BEGIN mission_id={MISSION_ID} model={args.model}", flush=True)

    for index, packet in enumerate(AGENTS, start=1):
        prior_summary = "\n".join(prior[-3:])
        output, meta = execute_agent(args.model, packet, prior_summary, args.timeout)
        print(
            "MCF_AGENT_EXECUTION_BEGIN "
            + " ".join(f"{key}={value}" for key, value in meta.items()),
            flush=True,
        )
        print(output, flush=True)
        print(
            f"MCF_AGENT_EXECUTION_END agent_id={packet.agent_id} run_id={meta['run_id']} sha256={meta['sha256']}",
            flush=True,
        )
        print(
            f"MCF_HANDOFF mission_id={MISSION_ID} from={packet.agent_id} to={packet.handoff} run_id={meta['run_id']} artifact_sha256={meta['sha256']}",
            flush=True,
        )
        prior.append(summarize_for_next(packet.agent_id, output))
        print(f"MCF_CHAIN_PROGRESS={index}/{len(AGENTS)}", flush=True)

    print(f"MCF_ZERO_COST_HARNESS_END mission_id={MISSION_ID} agents={len(AGENTS)} status=SUCCESS", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
