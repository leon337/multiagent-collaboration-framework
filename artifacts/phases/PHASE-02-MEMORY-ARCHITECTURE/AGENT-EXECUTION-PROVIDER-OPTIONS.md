# Agent Execution Provider — Phase 2

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`
Owner: Mestre
Status: `EXECUTOR_SELECTED_AND_CONNECTED / BILLABLE_RUN_GATE_PENDING`

## Constraint

Named specialist credit requires a real distinguishable execution identity, task/work packet, resulting artifact/evidence and traceable handoff. Coordinator-authored prose cannot be relabeled as another agent's work.

## Options evaluated

### Option A — Native MCF agent executor

Architecturally preferable for long-term product ownership, but implementing it before the architecture phase would create a circular dependency: the product executor would be built before the specialist architecture that should govern it.

Verdict: `PRODUCT_DIRECTION_CANDIDATE_AFTER_ARCHITECTURE`.

### Option B — External managed-agent harness

Brainbase MCP provides managed agent identities, orchestrations and task runs.

It was connected and verified in this mission. The harness is mission tooling, not a production dependency of Cognitive Ledger.

Verdict: `SELECTED_IMMEDIATE_EXECUTION_HARNESS`.

### Option C — Agents-SDK/Codex-style executor

Strong future implementation candidate behind an MCF-owned provider boundary, but not the immediate execution path for this phase.

Verdict: `FUTURE_IMPLEMENTATION_CANDIDATE`.

## Materialized state

- Brainbase organization/team resolved;
- 29/29 official MCF agents created as managed agents with roles aligned to the current competency matrix;
- private Phase 2 orchestration created: `33296bb3-2020-43cf-8d62-e5c1d364f6b0`;
- selected Phase 2 chain prepared;
- no automatic trigger configured;
- no task run executed yet;
- no personal memory, raw `fontes.conteudo_bruto`, Supabase `service_role`, token or secret sent to Brainbase.

## Governance consequence

`GATE-RUNTIME-REALITY = SATISFIED_FOR_EXECUTOR_IDENTITY_AND_CONFIGURATION`.

Brainbase task execution is billable. New financial cost remains a Human Delegation Firewall boundary:

`GATE-BRAINBASE-BILLABLE-RUN = PENDING_HUMAN_AUTHORIZATION`.

The gate is a decision only; no technical setup is delegated to Leandro.

## Privacy boundary

Until specialist security/compliance review closes:

- technical/public mission context and synthetic examples only;
- no real memory contents;
- no raw source payloads;
- no provider secrets;
- no production OAuth tokens;
- external-agent outputs must be captured with task ID/origin metadata before they count as evidence.

## Selection rule

The executor contains the full official pool, but only agents selected for a concrete phase are run. Agent existence is not participation, and the mission does not manufacture work merely to involve every role.

## Next action after cost authorization

Execute the selected Phase 2 chain chronologically with synthetic/non-sensitive work packets, persist each task ID and artifact in the PRF, run Emily's independent audit, obtain Léo's gate, then surface the architecture for design approval before implementation.
