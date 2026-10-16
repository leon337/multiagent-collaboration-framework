#!/usr/bin/env python3
"""Zero-cost, tool-using, fan-out/fan-in agent harness for MCF Phase 2.

This mission-only harness executes role-bound local Ollama runs on a standard
GitHub-hosted runner. Authoring specialists run independently (fan-out), each
must make at least one successful read-only tool call against the checked-out
public repository, and no authoring specialist receives peer outputs.

Fan-in is explicit:
- Carmem and Emily consume the complete authoring evidence package in parallel;
- Léo consumes the complete package plus Carmem/Emily outputs for the gate.

The harness never mutates the Cognitive Ledger, never calls paid model APIs,
and never grants execution credit without machine-verifiable execution and
tool-call evidence.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import uuid
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

MISSION_ID = "MCF-MEMORY-LIVE-NEXT-STABLE-001"
ARTIFACT_ROOT = Path(os.environ.get("MCF_AGENT_ARTIFACT_DIR", "/tmp/mcf-agent-artifacts"))
REPO_ROOT = Path.cwd().resolve()

MISSION_CONTEXT = """
Mission objective: design the governed architecture for persistent cross-chat
memory in the next stable MCF release.

Current deterministic constraints:
- LEANDRO is final human authority; technical execution must not be delegated to him.
- This is a Class C mission. Implementation/live mutation remains blocked until design,
  security, audit and gate requirements pass.
- Cognitive Ledger already exists; Supabase/Postgres is the operational source of truth.
- Existing provider records must be preserved; no destructive reset/reseed.
- MCF write must use a dedicated least-privilege capability/OAuth boundary; never expose
  generic SQL or Supabase service_role to MCF.
- Success may only be claimed after persistence + read-back + auditable Receipt.
- Textual/structured retrieval must work without paid embeddings.
- New real memories must not enter public Git, CI logs, fixtures or public evidence.
- Synthetic proof comes first.
- Zero-new-cost invariant: no paid API, billable agent task, paid runner or paid embedding.
- Anti-simulation invariant: never claim a tool call, observation, provider state or action
  that this execution did not actually perform.
- Current execution requirement: authoring agents work independently in fan-out; no
  authoring agent may depend on another author's output.
- Every credited agent must perform at least one successful read-only tool call.
- Retrieval relevance is not authorization. Memory trust, provenance and action authority
  must remain distinct concerns.
""".strip()

REQUIRED_HEADINGS = [
    "## Entrada recebida",
    "## Ação executada",
    "## Evidência observada",
    "## Resultado e análise",
    "## Decisão e entrega",
]

SAFE_TOP_LEVEL_FILES = {"README.md"}
SAFE_PREFIXES = (
    "docs/",
    "artifacts/",
    "context/",
    "schemas/",
    "project-instructions/",
    "src/",
    "apps/",
    "packages/",
    ".mcf/",
)
DENY_NAME_FRAGMENTS = (
    ".env",
    "credential",
    "credentials",
    "secret",
    "secrets",
    "private_key",
    "id_rsa",
    ".pem",
    ".p12",
    ".pfx",
    "token",
)

MAX_TOOL_RESULT_CHARS = 12000
MAX_FINAL_OUTPUT_CHARS = 22000


@dataclass(frozen=True)
class AgentPacket:
    agent_id: str
    role: str
    task: str
    handoff: str


@dataclass
class ToolEvidence:
    call_id: str
    tool: str
    args: dict[str, Any]
    args_sha256: str
    result_sha256: str
    result_chars: int
    selection_source: str


@dataclass
class AgentResult:
    agent_id: str
    role: str
    stage: str
    run_id: str
    model: str
    started_epoch: float
    ended_epoch: float
    artifact_sha256: str
    artifact_path: str
    handoff_to: str
    tool_evidence: ToolEvidence
    output: str

    @property
    def duration_seconds(self) -> float:
        return self.ended_epoch - self.started_epoch


AUTHORING_AGENTS = [
    AgentPacket("Miriam", "Memória e Gestão do Conhecimento",
                "Define provenance, source precedence, contradiction/supersession rules, memory lifecycle, retrieval admissibility and reconciliation constraints.", "Carmem+Emily"),
    AgentPacket("Sofia", "Arquitetura de Software",
                "Define the Experience Intelligence Layer and governed MCF -> Cognitive Ledger boundaries: capture, validation, persistence, retrieval, recommendation, feedback, rollback and failure isolation.", "Carmem+Emily"),
    AgentPacket("Manoel", "Banco de Dados",
                "Define append-only/idempotent persistence invariants, projections, compatibility/migration, retention, backup/restore and supersession without destructive overwrite.", "Carmem+Emily"),
    AgentPacket("Daniela", "Engenharia de Dados",
                "Define lineage, data-quality, provenance fields, source/currentness semantics and reconciliation evidence for institutional memory.", "Carmem+Emily"),
    AgentPacket("Ricardo", "Segurança",
                "Threat-model persistent memory: poisoning, prompt injection through memory/tool output, provenance tampering, replay, cross-tenant leakage, secret retention, privilege escalation and fail-closed controls.", "Carmem+Emily"),
    AgentPacket("Júlia", "Governança e Compliance de IA",
                "Define human approval gates, data minimization, confidence/sensitivity classes, correction/expiry/deletion governance, auditability and authority boundaries.", "Carmem+Emily"),
    AgentPacket("Tiago", "IA e Machine Learning",
                "Define zero-cost retrieval/RAG policy, textual fallback, optional local embeddings criteria, confidence handling, stale/conflicting memory risks and model independence.", "Carmem+Emily"),
    AgentPacket("Rafael", "Engenharia de Software",
                "Translate the design into implementation boundaries, contracts and sequencing without writing product code or crossing the implementation gate.", "Carmem+Emily"),
    AgentPacket("Eduardo", "Engenharia Backend",
                "Specify semantic API/capability contracts for register, read-back, Receipt, correction/supersession, retrieval and error behavior; no generic DB/SQL surface.", "Carmem+Emily"),
    AgentPacket("Bruno", "Plataforma, DevOps e SRE",
                "Define zero-cost lab/staging, exact-SHA promotion, health/readiness, backup/restore rehearsal, rollback, logs/metrics and secret-safe operational boundaries.", "Carmem+Emily"),
    AgentPacket("Renato", "Qualidade e Testes",
                "Define the validation matrix for capture, tool-use evidence, idempotency, read-back, cross-chat recovery, poisoning, stale/conflicting memory, regression, backup/restore and zero-private-data discipline.", "Carmem+Emily"),
    AgentPacket("Beatriz", "Avaliação de Agentes",
                "Define baselines and evals proving whether institutional memory improves task success without causing stale-memory regressions, unsafe influence, latency/cost drift or false positives.", "Carmem+Emily"),
    AgentPacket("Augusto", "Observabilidade Multiagente",
                "Define trace IDs, tool-call evidence, retrieval attribution, memory-to-decision links, handoff/loop metrics and anti-simulation observability.", "Carmem+Emily"),
    AgentPacket("Patrícia", "Debugging e Análise de Falhas",
                "Define failure modes, reproduction evidence and CAF recovery for poisoned/stale memory, tool failures, partial fan-out, provider drift and broken read-back.", "Carmem+Emily"),
    AgentPacket("Lucas", "Manutenibilidade e Performance",
                "Assess resource/latency sustainability of the zero-cost fan-out/tool loop and define bounded performance, concurrency and maintainability constraints.", "Carmem+Emily"),
]

FANIN_AGENTS = [
    AgentPacket("Carmem", "Documentação Técnica",
                "Consolidate the complete authoring package into a contradiction-aware architecture evidence map. Preserve disagreements; do not silently choose a winner.", "Léo"),
    AgentPacket("Emily", "Auditoria Independente",
                "Audit the complete authoring package for missing evidence, false-green risks, unresolved contradictions, security/privacy gaps and gate blockers.", "Léo"),
]

GATE_AGENT = AgentPacket(
    "Léo",
    "Autoridade Delegada de Continuidade e Gates Internos",
    "Using the complete authoring package plus Carmem consolidation and Emily audit, issue an evidence-based internal gate state. Never infer LEANDRO approval and never authorize implementation live.",
    "Mestre",
)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def run_command(argv: list[str], *, input_text: str | None = None, timeout: int = 60) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        argv,
        cwd=REPO_ROOT,
        input=input_text,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )


def ensure_safe_path(raw: str) -> str:
    raw = raw.strip().lstrip("./")
    if not raw:
        raise ValueError("empty path")
    if raw in SAFE_TOP_LEVEL_FILES:
        return raw
    if not any(raw.startswith(prefix) for prefix in SAFE_PREFIXES):
        raise ValueError(f"path outside read-only allowlist: {raw}")
    lowered = raw.lower()
    if any(fragment in lowered for fragment in DENY_NAME_FRAGMENTS):
        raise ValueError(f"path rejected by sensitive-name policy: {raw}")
    candidate = (REPO_ROOT / raw).resolve()
    if REPO_ROOT != candidate and REPO_ROOT not in candidate.parents:
        raise ValueError("path traversal rejected")
    tracked = run_command(["git", "ls-files", "--error-unmatch", raw], timeout=20)
    if tracked.returncode != 0:
        raise ValueError(f"path is not a tracked repository file: {raw}")
    return raw


def safe_prefix(raw: str) -> str:
    raw = raw.strip().lstrip("./")
    if not raw:
        return ""
    if raw in SAFE_TOP_LEVEL_FILES:
        return raw
    if not any(raw.startswith(prefix) or prefix.startswith(raw.rstrip("/") + "/") for prefix in SAFE_PREFIXES):
        raise ValueError(f"prefix outside allowlist: {raw}")
    lowered = raw.lower()
    if any(fragment in lowered for fragment in DENY_NAME_FRAGMENTS):
        raise ValueError("sensitive prefix rejected")
    return raw


def tool_repo_search(args: dict[str, Any]) -> str:
    query = str(args.get("query", "")).strip()
    if not query or len(query) > 160:
        raise ValueError("repo_search query must be 1..160 chars")
    pathspecs = [p.rstrip("/") for p in SAFE_PREFIXES if (REPO_ROOT / p.rstrip("/")).exists()]
    if (REPO_ROOT / "README.md").exists():
        pathspecs.append("README.md")
    proc = run_command(["git", "grep", "-n", "-I", "-e", query, "--", *pathspecs], timeout=30)
    if proc.returncode not in (0, 1):
        raise RuntimeError(proc.stderr[-1000:])
    lines = (proc.stdout or "NO_MATCHES").splitlines()[:80]
    return "\n".join(lines)[:MAX_TOOL_RESULT_CHARS]


def tool_repo_read(args: dict[str, Any]) -> str:
    path = ensure_safe_path(str(args.get("path", "")))
    start = int(args.get("start_line", 1))
    end = int(args.get("end_line", start + 119))
    start = max(1, start)
    end = min(max(start, end), start + 199)
    text = (REPO_ROOT / path).read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    selected = lines[start - 1:end]
    numbered = [f"{i}: {line}" for i, line in enumerate(selected, start=start)]
    return "\n".join(numbered)[:MAX_TOOL_RESULT_CHARS]


def tool_repo_list(args: dict[str, Any]) -> str:
    prefix = safe_prefix(str(args.get("prefix", "")))
    argv = ["git", "ls-files"]
    if prefix:
        argv += ["--", prefix]
    proc = run_command(argv, timeout=30)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr[-1000:])
    filtered: list[str] = []
    for path in proc.stdout.splitlines():
        lowered = path.lower()
        if any(fragment in lowered for fragment in DENY_NAME_FRAGMENTS):
            continue
        if path in SAFE_TOP_LEVEL_FILES or any(path.startswith(p) for p in SAFE_PREFIXES):
            filtered.append(path)
        if len(filtered) >= 120:
            break
    return "\n".join(filtered)[:MAX_TOOL_RESULT_CHARS]


def tool_git_history(args: dict[str, Any]) -> str:
    path = ensure_safe_path(str(args.get("path", "")))
    proc = run_command(
        ["git", "log", "-n", "12", "--pretty=format:%H%x09%ad%x09%s", "--date=iso-strict", "--", path],
        timeout=30,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr[-1000:])
    return (proc.stdout or "NO_HISTORY")[:MAX_TOOL_RESULT_CHARS]


TOOLS = {
    "repo_search": tool_repo_search,
    "repo_read": tool_repo_read,
    "repo_list": tool_repo_list,
    "git_history": tool_git_history,
}


def run_model(model: str, prompt: str, timeout: int) -> str:
    proc = run_command(["ollama", "run", model], input_text=prompt, timeout=timeout)
    if proc.returncode != 0:
        raise RuntimeError(f"ollama exit={proc.returncode}; stderr={(proc.stderr or '')[-1200:]}")
    out = (proc.stdout or "").strip()
    if not out:
        raise RuntimeError("empty model output")
    return out


def extract_json_object(text: str) -> dict[str, Any]:
    text = text.strip()
    try:
        obj = json.loads(text, strict=False)
        if isinstance(obj, dict):
            return obj
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        raise ValueError("no JSON object found")
    obj = json.loads(match.group(0), strict=False)
    if not isinstance(obj, dict):
        raise ValueError("tool request is not a JSON object")
    return obj


def fallback_tool_request(packet: AgentPacket) -> dict[str, Any]:
    return {
        "tool": "repo_search",
        "args": {"query": MISSION_ID},
        "_selection_source": "HARNESS_FALLBACK",
        "_fallback_reason": f"safe deterministic fallback for {packet.agent_id}",
    }


def validate_requested_tool(request: dict[str, Any]) -> None:
    tool = str(request.get("tool", "")).strip()
    args = request.get("args")
    if tool not in TOOLS:
        raise ValueError(f"unsupported tool requested: {tool}")
    if not isinstance(args, dict):
        raise ValueError("tool args must be an object")
    if tool in ("repo_read", "git_history"):
        ensure_safe_path(str(args.get("path", "")))
    elif tool == "repo_list":
        safe_prefix(str(args.get("prefix", "")))
    elif tool == "repo_search":
        query = str(args.get("query", "")).strip()
        if not query or len(query) > 160:
            raise ValueError("repo_search query must be 1..160 chars")


def request_tool_call(model: str, packet: AgentPacket, stage_context: str, timeout: int) -> dict[str, Any]:
    prompt = f"""Você é {packet.agent_id}, agente oficial do MCF: {packet.role}.
Missão: {MISSION_ID}

Sua primeira ação obrigatória é escolher UMA ferramenta read-only para obter evidência real do repositório público atual.
Não produza análise final ainda. Não invente ferramenta.

Ferramentas disponíveis:
- repo_search: {{"tool":"repo_search","args":{{"query":"texto"}}}}
- repo_read: {{"tool":"repo_read","args":{{"path":"docs/arquivo.md","start_line":1,"end_line":120}}}}
- repo_list: {{"tool":"repo_list","args":{{"prefix":"docs/"}}}}
- git_history: {{"tool":"git_history","args":{{"path":"docs/arquivo.md"}}}}

Contexto da missão:
{MISSION_CONTEXT}

Contexto específico desta etapa:
{stage_context[:18000]}

Tarefa:
{packet.task}

Responda SOMENTE com um objeto JSON válido contendo "tool" e "args".
"""
    try:
        raw = run_model(model, prompt, timeout)
        obj = extract_json_object(raw)
        request = {
            "tool": str(obj.get("tool", "")).strip(),
            "args": obj.get("args"),
            "_selection_source": "MODEL_REQUEST",
        }
        validate_requested_tool(request)
        return request
    except Exception as exc:
        fallback = fallback_tool_request(packet)
        print(
            f"MCF_TOOL_SELECTION_FALLBACK mission_id={MISSION_ID} "
            f"agent_id={packet.agent_id} reason={type(exc).__name__}",
            flush=True,
        )
        return fallback


def execute_tool(agent_id: str, run_id: str, request: dict[str, Any]) -> tuple[str, ToolEvidence]:
    tool_name = request["tool"]
    args = request["args"]
    call_id = str(uuid.uuid4())
    selection_source = str(request.get("_selection_source", "MODEL_REQUEST"))
    args_json = json.dumps(args, sort_keys=True, ensure_ascii=False)
    args_sha = sha256_text(args_json)
    print(
        f"MCF_TOOL_CALL_BEGIN mission_id={MISSION_ID} agent_id={agent_id} "
        f"run_id={run_id} call_id={call_id} tool={tool_name} "
        f"selection_source={selection_source} args_sha256={args_sha}",
        flush=True,
    )
    result = TOOLS[tool_name](args)
    result_sha = sha256_text(result)
    print(
        f"MCF_TOOL_CALL_END mission_id={MISSION_ID} agent_id={agent_id} "
        f"run_id={run_id} call_id={call_id} tool={tool_name} status=SUCCESS "
        f"result_sha256={result_sha} result_chars={len(result)}",
        flush=True,
    )
    evidence = ToolEvidence(
        call_id=call_id,
        tool=tool_name,
        args=args,
        args_sha256=args_sha,
        result_sha256=result_sha,
        result_chars=len(result),
        selection_source=selection_source,
    )
    return result, evidence


def build_final_prompt(packet: AgentPacket, stage_context: str, tool_request: dict[str, Any],
                       tool_result: str, tool_evidence: ToolEvidence) -> str:
    return f"""Você é {packet.agent_id}, agente oficial do MCF na competência: {packet.role}.
Esta é uma execução local real e distinguível. Uma ferramenta read-only foi executada pelo harness em seu nome.

Missão: {MISSION_ID}

Regras:
1. Use somente o contexto fornecido e a observação real da ferramenta.
2. Não invente outras consultas, commits, deploys, testes, provider states ou evidências.
3. Diferencie FACT, DESIGN_ASSUMPTION e UNKNOWN.
4. Não inclua segredos, credenciais ou memória pessoal real.
5. Custo novo deve permanecer zero.
6. Sua entrega deve ser técnica e específica à sua competência.
7. Cite no texto o tool call real: ferramenta={tool_evidence.tool}, call_id={tool_evidence.call_id}.
8. Use exatamente os cinco títulos obrigatórios abaixo.

Contexto canônico:
{MISSION_CONTEXT}

Contexto desta etapa:
{stage_context[:28000]}

Tool request executado:
{json.dumps(tool_request, ensure_ascii=False, sort_keys=True)}

Observação real da ferramenta:
--- TOOL_OBSERVATION_BEGIN ---
{tool_result[:MAX_TOOL_RESULT_CHARS]}
--- TOOL_OBSERVATION_END ---

Sua tarefa:
{packet.task}

Handoff esperado: {packet.agent_id} -> {packet.handoff}

Formato:
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


def normalize_output(packet: AgentPacket, output: str, tool_evidence: ToolEvidence) -> str:
    if all(heading in output for heading in REQUIRED_HEADINGS) and len(output) <= MAX_FINAL_OUTPUT_CHARS:
        return output

    body = output.strip()
    max_body = max(2000, MAX_FINAL_OUTPUT_CHARS - 2200)
    if len(body) > max_body:
        body = body[:max_body] + "\n...[TRUNCATED_BY_HARNESS]"

    return f"""## Entrada recebida
Missão {MISSION_ID}; agente {packet.agent_id}; competência {packet.role}.

## Ação executada
Tool call real executado pelo harness: ferramenta={tool_evidence.tool}, call_id={tool_evidence.call_id}, selection_source={tool_evidence.selection_source}.

## Evidência observada
args_sha256={tool_evidence.args_sha256}; result_sha256={tool_evidence.result_sha256}; result_chars={tool_evidence.result_chars}.

## Resultado e análise
{body}

## Decisão e entrega
Entrega preservada como saída cognitiva do agente. Handoff esperado: {packet.agent_id} -> {packet.handoff}.
"""


def validate_output(packet: AgentPacket, output: str) -> None:
    if len(output) > MAX_FINAL_OUTPUT_CHARS:
        raise RuntimeError(f"{packet.agent_id}: output too large")
    missing = [heading for heading in REQUIRED_HEADINGS if heading not in output]
    if missing:
        raise RuntimeError(f"{packet.agent_id}: missing required headings after normalization: {missing}")


def artifact_slug(stage: str, agent_id: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", agent_id.lower(), flags=re.IGNORECASE).strip("-")
    return f"{stage.lower()}-{base or 'agent'}"


def write_artifact(result: AgentResult) -> tuple[Path, Path]:
    ARTIFACT_ROOT.mkdir(parents=True, exist_ok=True)
    slug = artifact_slug(result.stage, result.agent_id)
    md_path = ARTIFACT_ROOT / f"{slug}.md"
    meta_path = ARTIFACT_ROOT / f"{slug}.json"
    md_path.write_text(result.output + "\n", encoding="utf-8")
    payload = {
        "mission_id": MISSION_ID,
        "agent_id": result.agent_id,
        "role": result.role,
        "stage": result.stage,
        "run_id": result.run_id,
        "model": result.model,
        "started_epoch": result.started_epoch,
        "ended_epoch": result.ended_epoch,
        "duration_seconds": result.duration_seconds,
        "artifact_sha256": result.artifact_sha256,
        "artifact_path": str(md_path),
        "handoff_to": result.handoff_to,
        "tool_evidence": asdict(result.tool_evidence),
    }
    meta_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return md_path, meta_path


def execute_agent(model: str, packet: AgentPacket, stage: str, stage_context: str,
                  timeout: int) -> AgentResult:
    run_id = str(uuid.uuid4())
    started = time.time()
    tool_request = request_tool_call(model, packet, stage_context, timeout)
    tool_result, tool_evidence = execute_tool(packet.agent_id, run_id, tool_request)
    final_prompt = build_final_prompt(packet, stage_context, tool_request, tool_result, tool_evidence)
    raw_output = run_model(model, final_prompt, timeout)
    output = normalize_output(packet, raw_output, tool_evidence)
    validate_output(packet, output)
    ended = time.time()
    digest = sha256_text(output)
    artifact_path = str(ARTIFACT_ROOT / f"{artifact_slug(stage, packet.agent_id)}.md")
    result = AgentResult(
        agent_id=packet.agent_id,
        role=packet.role,
        stage=stage,
        run_id=run_id,
        model=model,
        started_epoch=started,
        ended_epoch=ended,
        artifact_sha256=digest,
        artifact_path=artifact_path,
        handoff_to=packet.handoff,
        tool_evidence=tool_evidence,
        output=output,
    )
    write_artifact(result)
    print(
        f"MCF_AGENT_EXECUTION_END mission_id={MISSION_ID} stage={stage} "
        f"agent_id={packet.agent_id} run_id={run_id} artifact_sha256={digest} "
        f"tool_call_id={tool_evidence.call_id} tool={tool_evidence.tool} "
        f"duration_seconds={result.duration_seconds:.3f}",
        flush=True,
    )
    return result


def compact_result(result: AgentResult, limit: int = 1800) -> str:
    compact = " ".join(result.output.split())
    if len(compact) > limit:
        compact = compact[:limit] + " ...[TRUNCATED]"
    return (
        f"AGENT={result.agent_id} ROLE={result.role} "
        f"ARTIFACT_SHA256={result.artifact_sha256} TOOL={result.tool_evidence.tool} "
        f"TOOL_RESULT_SHA256={result.tool_evidence.result_sha256}\n{compact}"
    )


def build_package(results: list[AgentResult], failures: dict[str, str], per_agent_limit: int = 1800) -> str:
    chunks = ["AUTHORING_EVIDENCE_PACKAGE"]
    for result in sorted(results, key=lambda r: r.agent_id):
        chunks.append(compact_result(result, per_agent_limit))
    if failures:
        chunks.append("FAILURES")
        for agent_id, error in sorted(failures.items()):
            chunks.append(f"{agent_id}: {error[:1000]}")
    return "\n\n".join(chunks)


def run_parallel(model: str, packets: list[AgentPacket], stage: str, stage_context: str,
                 timeout: int) -> tuple[list[AgentResult], dict[str, str]]:
    results: list[AgentResult] = []
    failures: dict[str, str] = {}
    configured_workers = int(os.environ.get("MCF_MAX_WORKERS", "4"))
    max_workers = max(1, min(len(packets), configured_workers))
    print(
        f"MCF_FANOUT_CONCURRENCY stage={stage} logical_tasks={len(packets)} "
        f"physical_workers={max_workers}",
        flush=True,
    )
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as pool:
        future_map = {
            pool.submit(execute_agent, model, packet, stage, stage_context, timeout): packet
            for packet in packets
        }
        for future in concurrent.futures.as_completed(future_map):
            packet = future_map[future]
            try:
                result = future.result()
                results.append(result)
                print(
                    f"MCF_FANOUT_PROGRESS stage={stage} completed={len(results)+len(failures)}/{len(packets)} "
                    f"agent_id={packet.agent_id} status=SUCCESS",
                    flush=True,
                )
            except Exception as exc:
                failures[packet.agent_id] = f"{type(exc).__name__}: {exc}"
                print(
                    f"MCF_FANOUT_PROGRESS stage={stage} completed={len(results)+len(failures)}/{len(packets)} "
                    f"agent_id={packet.agent_id} status=FAIL error={type(exc).__name__}",
                    flush=True,
                )
    return results, failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default=os.environ.get("OLLAMA_MODEL", "qwen2.5:1.5b"))
    parser.add_argument("--timeout", type=int, default=600)
    args = parser.parse_args()

    ARTIFACT_ROOT.mkdir(parents=True, exist_ok=True)
    print(
        f"MCF_ZERO_COST_HARNESS_BEGIN mission_id={MISSION_ID} model={args.model} "
        f"execution=PARALLEL_FAN_OUT_FAN_IN tool_calls=REQUIRED",
        flush=True,
    )

    author_context = (
        "STAGE=A_AUTHORING_FAN_OUT. Work independently. No peer artifacts are available by design. "
        "Use your tool call to inspect the current checked-out public repository and produce your own evidence."
    )
    author_results, author_failures = run_parallel(
        args.model, AUTHORING_AGENTS, "A", author_context, args.timeout
    )

    author_package = build_package(author_results, author_failures, per_agent_limit=1700)

    fanin_results, fanin_failures = run_parallel(
        args.model, FANIN_AGENTS, "B", author_package, args.timeout
    )

    gate_context = build_package(author_results + fanin_results,
                                 {**author_failures, **fanin_failures},
                                 per_agent_limit=1500)

    gate_results, gate_failures = run_parallel(
        args.model, [GATE_AGENT], "C", gate_context, args.timeout
    )

    failures = {**author_failures, **fanin_failures, **gate_failures}
    total_success = len(author_results) + len(fanin_results) + len(gate_results)
    total_expected = len(AUTHORING_AGENTS) + len(FANIN_AGENTS) + 1

    manifest = {
        "mission_id": MISSION_ID,
        "model": args.model,
        "execution": "PARALLEL_FAN_OUT_FAN_IN",
        "tool_calls_required": True,
        "authoring_agents": [p.agent_id for p in AUTHORING_AGENTS],
        "fanin_agents": [p.agent_id for p in FANIN_AGENTS],
        "gate_agent": GATE_AGENT.agent_id,
        "success_count": total_success,
        "expected_count": total_expected,
        "failures": failures,
        "implementation_authorized": False,
        "live_mutation_performed": False,
        "paid_api_used": False,
    }
    (ARTIFACT_ROOT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    if failures:
        print(
            f"MCF_ZERO_COST_HARNESS_END mission_id={MISSION_ID} "
            f"status=BLOCKED success={total_success}/{total_expected} failures={len(failures)}",
            flush=True,
        )
        return 1

    print(
        f"MCF_ZERO_COST_HARNESS_END mission_id={MISSION_ID} "
        f"status=EXECUTION_COMPLETE success={total_success}/{total_expected} "
        "architecture_approval=NOT_INFERRED implementation_authorized=false",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
