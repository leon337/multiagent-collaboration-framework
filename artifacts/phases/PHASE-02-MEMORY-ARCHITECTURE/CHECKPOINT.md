# Checkpoint — PHASE-02-MEMORY-ARCHITECTURE

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`  
Checkpoint state: `PARALLEL_TOOLCALL_HARNESS_PREPARED`  
Objective met: false  
Human technical action required: false  
Checkpoint recipient: Mestre  
Recovery baseline: `main@b969df76544e69cb2ff7833a5b65bd231d4db7aa`

## Reconciled decisions

- LEANDRO authorized Brainbase billable task execution for this mission on 2026-09-18;
- Brainbase is preferred when available; current controlled pilots are blocked by provider-side `BILLING_UNAVAILABLE / HTTP 503` before model/tool execution;
- the GitHub/Ollama path remains an active zero-cost contingency executor;
- the official 29-agent roster remains a pool, not a decorative mandatory full-roster run;
- explicit current LEANDRO instruction requires discovery/design fan-out so specialists do not depend on peer delivery;
- every credited specialist must have a real tool call plus attributable artifact evidence;
- implementation and live mutation remain blocked.

## Historical zero-cost evidence recovered

PR #170 previously proved that a standard public GitHub-hosted runner could:

- install pinned Ollama;
- start the local service;
- pull `qwen2.5:1.5b`;
- start a real role-bound Miriam execution.

That run stopped because the artifact format contract was too strict. No specialist received false credit.

PR #170 is old and non-mergeable against the current main; its validated zero-cost findings are reused, not its stale serial topology.

## Current recovery branch

`mission/memory-parallel-toolcall-20260918`

Prepared artifacts:

- `.github/workflows/mcf-zero-cost-parallel-agent-harness.yml`;
- `ops/mission-agent-harness/zero_cost_phase2_fanout.py`;
- `artifacts/phases/PHASE-02-MEMORY-ARCHITECTURE/PARALLEL-FANOUT-TOOLCALL-DESIGN.md`;
- reconciled Phase 2 plan/checkpoint.

## Execution topology

Stage A:
- 15 competence-aligned specialists dispatched independently;
- no peer-output dependency;
- every credited role requires a successful read-only repository tool call;
- one failure does not stop other specialists.

Stage B:
- Carmem consolidation and Emily independent audit run in parallel from the complete available evidence package.

Stage C:
- Léo receives the package and emits an internal evidence gate only.

## Tool evidence contract

Each credited run must include:

- role;
- run UUID;
- tool-call UUID;
- tool name;
- tool argument SHA-256;
- tool result SHA-256;
- artifact SHA-256;
- timestamps/duration.

Artifacts are written outside the repository and uploaded as CI evidence. Harness repository mutation must remain false.

## Privacy / cost boundary

Allowed input: public technical repository content.

Forbidden regardless of executor:
- personal Cognitive Ledger memory in this discovery harness;
- raw private `fontes`;
- provider tokens/secrets;
- `service_role`;
- unapproved provider mutation or live implementation.

Brainbase billable agent tasks are permitted for this mission by explicit LEANDRO authorization, but only for competence-aligned executions with attributable evidence. Paid embeddings and paid/larger runners are not required by this phase.

## Current blockers

No human technical blocker is open.

Remaining technical dependency: obtain real CI execution evidence from the new parallel tool-using harness and apply CAF to any failed role.

## Next action owner

Mestre / GitHub CI path.

LEANDRO is needed only when a reserved design/authority gate is actually reached.
