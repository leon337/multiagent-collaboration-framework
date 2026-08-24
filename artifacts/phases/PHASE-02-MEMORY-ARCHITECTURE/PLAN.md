# PHASE-02 PLAN — Memory Architecture

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`
Risk class: `C`
Status: `EXECUTOR_READY / BILLABLE_RUN_GATE_PENDING`
Authority: Leandro (reserved human authority) / Léo (delegated operational gates)
Coordinator: Mestre

## Objective

Produce an approvable architecture for the next stable MCF release that integrates a governed Cognitive Ledger write capability, preserves the current live Ledger data, reconciles provider/code drift, and proves cross-chat durable memory without turning Leandro into a technical operator.

No implementation code is authorized by this phase artifact. Implementation remains blocked until architecture approval and all applicable Class C gates.

## Source of truth and precedence

1. Current platform/project instructions.
2. `project-instructions/MCF-PROJECT-OPERATING-INSTRUCTIONS.md`.
3. Current MCF decisions/protocol.
4. Live GitHub/provider state and tool receipts.
5. Mission roadmap and Mission Control #164.
6. Historical documentation only when not contradicted by a higher-precedence source.

## Product constraints already closed

- existing Supabase/Postgres remains the operational source and existing records are preserved;
- capture is explicit or suggested-with-confirmation, never silent automatic capture;
- MCF writes through a dedicated OAuth/capability boundary, never with generic `service_role` access;
- original authorized text is private provenance in `fontes`; structured meaning lives in the Evento Cognitivo;
- capture is minimized to the relevant excerpt plus minimum context;
- normal correction preserves history; explicit definitive deletion uses a separate hard-delete path;
- success is declared only after persistence + read-back + Receipt;
- textual/structured search always works; external embeddings are opt-in and disabled by default;
- proof uses synthetic data first and a user-authorized real memory only after gates;
- target is `v1.2.0` if additive/no breaking change, promoted to `latest` only after all release gates.

## Human Delegation Firewall

Leandro is not a technical executor. Do not ask him to run CLI, SQL, migrations, deploys, inspect logs, rotate credentials, build OAuth, debug services, or produce implementation artifacts. Escalation is reserved for authority, material purpose/cost/legal/public exposure/sensitive credential/irreversible-impact gates or an actual external dependency that cannot be resolved by the team.

## Anti-simulation invariant

A named agent is not considered to have participated because its name appears in a plan, prompt, comment, report or retrospective narrative.

Valid participation requires:

1. a real execution identity distinguishable from the coordinator;
2. a mission-scoped work packet tied to official competence;
3. an artifact/evidence created by that execution;
4. a task/receipt identifier linking agent, action, time and result;
5. a visible handoff before dependent downstream work.

Agent existence is not participation.

## Roster rule

The full official roster is maintained as an available pool. Phase selection follows the protocol: only agents with concrete delivery are executed and credited. Participation decorativa and artificial make-work are forbidden.

Any earlier mission wording that required all 29 agents to perform work regardless of need is superseded by the current project/governance precedence.

## Real executor

Brainbase MCP is connected and verified as the managed-agent execution harness for this phase.

Materialized state:

- 29/29 official MCF agent identities created;
- private Phase 2 orchestration ID `33296bb3-2020-43cf-8d62-e5c1d364f6b0`;
- no automatic trigger;
- no Brainbase task run executed at this checkpoint;
- no real memory payload, raw source content, `service_role`, token or secret sent to the executor.

`GATE-RUNTIME-REALITY = SATISFIED_FOR_EXECUTOR_IDENTITY_AND_CONFIGURATION`.

## Phase 2 selected roles

Selected for concrete delivery:

- Mestre — contract, sequence and handoffs;
- Miriam — source-of-truth, provenance and conflicts;
- Sofia — architecture;
- Manoel — persistence, migration and backup/restore;
- Ricardo — threat model, authN/authZ and secrets;
- Júlia — Class C data/autonomy governance;
- Rafael — integration design;
- Eduardo — backend/API/capability contract;
- Bruno — environment, rollback and reliability;
- Renato — test/E2E strategy;
- Beatriz — agent/memory behavior and regression evaluation;
- Augusto — trace/ESEV observability;
- Emily — independent evidence audit;
- Léo — phase gate.

Other agents remain available and enter only when a real domain need appears.

## Financial gate

Brainbase task runs are billable. New financial cost is a Human Delegation Firewall boundary.

`GATE-BRAINBASE-BILLABLE-RUN = PENDING_HUMAN_AUTHORIZATION`.

No `tasks_create(... auto_run=true)` or equivalent billable execution starts before approval.

## Privacy/prohibitions before specialist review

- synthetic/non-sensitive work packets only;
- no real memory payloads;
- no raw `fontes.conteudo_bruto`;
- no Supabase `service_role`;
- no provider secrets/tokens;
- no coordinator-authored specialist evidence;
- no implementation before architecture approval.

## ESEV sequence after cost authorization

Mestre → Miriam → Sofia → Manoel → Ricardo → Júlia → Rafael → Eduardo → Bruno → Renato → Beatriz → Augusto → Emily → Léo.

Each execution must produce a Brainbase task ID plus artifact/evidence. Handoffs are chronological and downstream work receives only prior verified outputs and minimum necessary technical context.

## Required architecture outputs

- current-state map MCF/Ledger/Supabase/Render/Context Fabric;
- provider/code drift reconciliation plan;
- dedicated write capability and least-privilege authorization model;
- write/read-back/Receipt/idempotency/collision behavior;
- correction/supersession and privileged definitive deletion model;
- provenance/source minimization and public-Git exclusion boundary;
- backup, restore, migration compatibility and rollback;
- cross-chat recovery flow and cognitive-card retrieval contract;
- embeddings opt-in/cost/privacy boundary;
- threat model, compliance controls and failure behavior;
- observability, audit and release evidence model;
- exact-SHA staging and post-release proof plan;
- compatibility/SemVer assessment.

## Gates

- `GATE-RUNTIME-REALITY`: satisfied for executor identity/configuration.
- `GATE-BRAINBASE-BILLABLE-RUN`: human cost authorization pending.
- `GATE-ARCH-DESIGN`: architecture must be presented for approval before implementation.
- `GATE-CLASS-C`: Júlia/Augusto and applicable Beatriz/Miriam controls complete.
- `GATE-SECURITY`: Ricardo threat model has no unaddressed critical risk.
- `GATE-AUDIT`: Emily independent evidence review completes.
- `GATE-LEO`: Léo issues the canonical internal phase decision.

## Current checkpoint

The prior real-agent executor gap is resolved at the identity/configuration layer. The mission now stops only at the financial authorization boundary for billable Brainbase task runs. No specialist credit has been granted yet and implementation remains blocked.
