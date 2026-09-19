# Checkpoint — PHASE-02-MEMORY-ARCHITECTURE

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`  
Checkpoint state: `COGNITIVE_MEMORY_CAPABILITIES_IMPLEMENTED / CI_PENDING`
Objective met: false  
Human technical action required: false  
Checkpoint recipient: Mestre  
Recovery baseline: `main@3bd149ef159d46e82dbe2396f9e5991822f14327`

## Reconciled decisions

- LEANDRO authorized Brainbase billable task execution for this mission on 2026-09-18;
- Brainbase remains optional; current controlled tasks are blocked by `CREDITS_EXHAUSTED` before agent execution and receive no participation credit;
- the GitHub/Ollama path remains an active zero-cost contingency executor;
- the official 29-agent roster remains a pool, not a decorative mandatory full-roster run;
- explicit current LEANDRO instruction requires discovery/design fan-out so specialists do not depend on peer delivery;
- every credited specialist must have a real tool call plus attributable artifact evidence;
- governed Cognitive Memory read/write capabilities are implemented and locally tested; live provider mutation remains blocked.

## Historical zero-cost evidence recovered

PR #170 previously proved that a standard public GitHub-hosted runner could:

- install pinned Ollama;
- start the local service;
- pull `qwen2.5:1.5b`;
- start a real role-bound Miriam execution.

That run stopped because the artifact format contract was too strict. No specialist received false credit.

PR #170 is old and non-mergeable against the current main; its validated zero-cost findings are reused, not its stale serial topology.

## Current recovery branch

`feat/mcf-cognitive-memory-reconciled-20260918`

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

Remaining technical dependencies: exact-head CI for governed Cognitive Memory capabilities and the parallel tool-using harness; live provider mutation remains outside this candidate.

## Next action owner

Mestre / GitHub CI path.

LEANDRO is needed only when a reserved design/authority gate is actually reached.
