# Mission-wide roster dispatch

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`
Coordinator: Mestre
State: `CONVOKED / EXECUTION PROVIDER GATED`
Canonical base: `5fd36516f22f847495906f710d27dfb8976980ad`

## Purpose

Leandro requires the full official roster of 29 MCF agents to contribute substantive work to this goal. This dispatch records the mission-wide work packets without pretending that queued work has already happened.

A row marked `CONVOKED_WAITING_EXECUTOR` is an assignment only. It is **not** execution evidence, not an agent artifact, not a handoff and not participation credit.

## Dispatch ledger

| # | Agent | Mission work packet | Required agent-owned artifact | State |
|---:|---|---|---|---|
| 1 | Léo | phase/release authority gates | evidence-based gate decision(s) | CONVOKED_WAITING_EXECUTOR |
| 2 | Mestre | contracts, orchestration, ESEV and handoffs | mission/phase contract + orchestration ledger | EXECUTING_COORDINATOR |
| 3 | Leonardo | product/release acceptance | product acceptance contract | CONVOKED_WAITING_EXECUTOR |
| 4 | Carlos | future evolution/risks | durable-memory opportunity/risk horizon | CONVOKED_WAITING_EXECUTOR |
| 5 | Evelyn | experience design coordination | experience decision record | CONVOKED_WAITING_EXECUTOR |
| 6 | Laura | capture/retrieval UX | memory UX flow | CONVOKED_WAITING_EXECUTOR |
| 7 | Isabela | visual/state model | cognitive-card visual/state spec | CONVOKED_WAITING_EXECUTOR |
| 8 | Marina | accessibility/readability | accessibility/readability review | CONVOKED_WAITING_EXECUTOR |
| 9 | Sofia | system architecture | architecture package + ADRs | CONVOKED_WAITING_EXECUTOR |
| 10 | Rafael | implementation/integration | implementation design + execution artifacts | CONVOKED_WAITING_EXECUTOR |
| 11 | Manoel | database/migration | backup/restore/schema/migration package | CONVOKED_WAITING_EXECUTOR |
| 12 | Renato | testing | validation strategy + executed evidence | CONVOKED_WAITING_EXECUTOR |
| 13 | Bruno | staging/SRE | deploy/rollback/observability evidence | CONVOKED_WAITING_EXECUTOR |
| 14 | Ricardo | security | threat model + security findings | CONVOKED_WAITING_EXECUTOR |
| 15 | Gabriel | Git/release provenance | PR/release provenance package | CONVOKED_WAITING_EXECUTOR |
| 16 | Carmem | technical documentation | PRF/docs consolidation | CONVOKED_WAITING_EXECUTOR |
| 17 | Emily | independent audit | evidence-based independent audit | CONVOKED_WAITING_EXECUTOR |
| 18 | Eduardo | backend/API | capability/API contract + integration evidence | CONVOKED_WAITING_EXECUTOR |
| 19 | Helena | web/client impact | frontend/host impact review or evidenced no-impact | CONVOKED_WAITING_EXECUTOR |
| 20 | André | mobile/client portability | mobile/client impact review or evidenced no-impact | CONVOKED_WAITING_EXECUTOR |
| 21 | Tiago | AI/RAG/embeddings | embedding/search policy + fallback evaluation | CONVOKED_WAITING_EXECUTOR |
| 22 | Daniela | data quality/lineage | lineage/reconciliation/quality package | CONVOKED_WAITING_EXECUTOR |
| 23 | Vinícius | code quality | review/refactoring findings + disposition | CONVOKED_WAITING_EXECUTOR |
| 24 | Patrícia | failure recovery | incident/failure/recovery drill artifact | CONVOKED_WAITING_EXECUTOR |
| 25 | Lucas | performance/sustainability | bounded performance/resource evidence | CONVOKED_WAITING_EXECUTOR |
| 26 | Augusto | multiagent observability | trace/handoff/loop observability report | CONVOKED_WAITING_EXECUTOR |
| 27 | Beatriz | agent behavior/memory | agent/memory/routing evaluation | CONVOKED_WAITING_EXECUTOR |
| 28 | Miriam | context/memory governance | recovery/provenance/conflict/reconciliation artifact | CONVOKED_WAITING_EXECUTOR |
| 29 | Júlia | Class C governance | privacy/autonomy/compliance review | CONVOKED_WAITING_EXECUTOR |

## Chronology rule

When an execution provider becomes available, the coordinator must update each row only after the runtime or provider returns a distinguishable execution identity and the resulting artifact/receipt exists. Handoffs must then be recorded in chronological order under the mission PRF.

## Anti-relabelling rule

No coordinator-authored artifact may be renamed or described as if it were produced by another agent. Tool output, model output or third-party output may be attributed to an agent only when the execution itself was created for that agent identity and the evidence chain binds that identity to the artifact.

## Current blocker

All non-Mestre rows remain waiting because the current MCF runtime validates `execution_evidence` but does not originate named cognitive-agent work, and the current ChatGPT execution surface does not expose a native subagent dispatcher or authenticated MCF agent executor.

This blocker is operational, not a request for Leandro to perform technical work.
