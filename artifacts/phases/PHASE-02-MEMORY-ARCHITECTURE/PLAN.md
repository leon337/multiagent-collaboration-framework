# PHASE-02 — Cognitive Memory Architecture / Contract

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`
Risk class: `C`
Status: `OPEN / EXECUTION-GATED`
Base SHA: `08fef949c49496050596e9681aaf011259e51f77`
Authority: Leandro (reserved human authority) / Léo (delegated operational gates)
Coordinator: Mestre

## Objective

Produce an approvable architecture for the next stable MCF release that integrates a governed Cognitive Ledger write capability, preserves the current live Ledger data, reconciles provider/code drift, and proves cross-chat durable memory without turning Leandro into a technical operator.

No implementation code is authorized by this phase artifact. Implementation remains blocked until architecture approval and the applicable Class C gates.

## Source of truth and precedence

1. Current explicit instruction from Leandro.
2. Live GitHub/provider state and tool receipts.
3. Current applicable SHA/branch code and tests.
4. `project-instructions/*` and the unified MCF operational protocol.
5. Current mission roadmap and issue #164 decision history.
6. Historical documentation only when not contradicted by a higher-precedence source.

## Product contract already closed

The architecture must preserve the onboarding decisions already recorded in issue #164, including:

- existing Supabase/Postgres project is the operational source and existing records are preserved;
- write is explicit or suggested-with-confirmation, never silent automatic capture;
- MCF writes through a dedicated OAuth/capability boundary, never with generic `service_role` access;
- original authorized text is private provenance in `fontes`; structured meaning lives in the Evento Cognitivo;
- capture is minimized to the relevant excerpt plus minimum context;
- 3–8 concise keywords are generated for readability;
- default retrieval is a compact cognitive card, with original/provenance on demand;
- normal correction preserves history; explicit definitive deletion uses a separate hard-delete path;
- success is only declared after persistence plus read-back and an auditable Receipt;
- textual/structured search always works; external embeddings are opt-in and disabled by default;
- proof uses synthetic data first and a user-authorized real memory only after gates;
- target is `v1.2.0` if additive/no breaking change, promoted to `latest` only after all release gates.

## Human Delegation Firewall

Leandro is not a technical executor. Do not ask him to run CLI, SQL, migrations, deploys, inspect logs, rotate credentials, build OAuth, debug services, or produce implementation artifacts. Technical work must be performed through governed agents/tools/workflows. Escalation is reserved for authority, material purpose/cost/legal/public exposure/sensitive credential/irreversible-impact gates or an actual external dependency that cannot be resolved by the team.

## Deterministic anti-simulation invariant

A named agent is not considered to have participated because its name appears in a plan, prompt, comment, report, or retrospective narrative.

For every participating agent, valid participation requires all of the following:

1. a real invocation/execution identity that can be distinguished from the coordinator;
2. a mission-scoped work packet tied to that agent's official competence;
3. an artifact created by that execution, not authored by another actor and relabeled;
4. evidence/receipt linking agent, action, artifact, time, source and result;
5. a visible handoff before the next dependent step.

If any item is missing, the agent remains `PLANNED_NOT_EXECUTED`.

## Entire-team mission requirement

Leandro explicitly requires the full official roster of 29 agents to contribute to this goal. This does not waive the MCF invariant against decorative participation. Therefore every agent must have a substantive, competence-aligned deliverable somewhere in the mission before terminal delivery. Phase-specific `selected_agents` remains limited to agents whose work is actually executable in that phase.

Mission-wide required artifact ownership:

| Agent | Required substantive artifact/work product |
|---|---|
| Léo | gate decision(s) with evidence-based justification |
| Mestre | mission/phase contracts, orchestration ledger and handoff map |
| Leonardo | product/release requirements and acceptance contract |
| Carlos | future-risk/opportunity analysis for durable memory evolution |
| Evelyn | experience design coordination decision record |
| Laura | memory capture/retrieval UX flow |
| Isabela | cognitive-card visual/state specification |
| Marina | accessibility/readability review of retrieval experience |
| Sofia | architecture package and ADR set |
| Rafael | implementation design/work breakdown and integration execution artifacts |
| Manoel | database compatibility, backup/restore and migration package |
| Renato | test strategy plus executed validation evidence |
| Bruno | staging/live deployment, rollback, observability and SRE evidence |
| Ricardo | threat model and security review |
| Gabriel | branch/PR/release provenance and release evidence |
| Carmem | technical documentation/PRF consolidation |
| Emily | independent audit artifact based on evidence, not retrospective prose |
| Eduardo | backend API/capability contract and service integration evidence |
| Helena | frontend/host integration impact review where applicable, including explicit no-impact evidence if validated by her own execution |
| André | mobile/client portability impact review where applicable, including explicit no-impact evidence if validated by his own execution |
| Tiago | AI/RAG/embedding technical policy and fallback evaluation |
| Daniela | data lineage/quality/reconciliation package |
| Vinícius | code-review/refactoring findings and disposition |
| Patrícia | failure-mode/debug/recovery drill artifact |
| Lucas | performance/resource sustainability benchmark or bounded no-regression evidence |
| Augusto | multiagent trace, handoff and loop observability report |
| Beatriz | agent behavior/memory/routing evaluation and regressions |
| Miriam | context recovery, provenance, conflict/reconciliation and memory-governance artifact |
| Júlia | AI/data/autonomy/compliance governance review |

An explicit `no-impact` conclusion can count only when produced by that agent after real inspection and supported by evidence; it cannot be pre-filled by Mestre.

## Phase 2 selected roles

The first architecture chain requires real execution by at least: Mestre, Leonardo, Carlos, Evelyn, Laura, Isabela, Marina, Sofia, Rafael, Manoel, Ricardo, Eduardo, Tiago, Daniela, Augusto, Beatriz, Miriam and Júlia. Carmem consolidates the phase pack after those artifacts exist. Emily performs the independent audit after authoring work is complete. Léo gates the phase from evidence.

Renato, Bruno, Gabriel, Helena, André, Vinícius, Patrícia and Lucas have mission-wide mandatory deliverables but enter dependent validation/implementation/release workstreams when their real work becomes executable. They are not credited with Phase 2 work merely because they are named here.

## Required architecture outputs

The phase cannot advance without real, agent-owned artifacts covering:

- current-state map: MCF runtime, Cognitive Ledger API, Supabase/Postgres, MCP/OAuth boundary, Render and Context Fabric;
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

- `GATE-RUNTIME-REALITY`: no named-agent execution until the invocation path is proven real and non-simulated.
- `GATE-ARCH-DESIGN`: architecture must be presented to Leandro at the level of product/authority decisions, not as technical operator work.
- `GATE-CLASS-C`: Júlia/Augusto and applicable Beatriz/Miriam controls complete.
- `GATE-SECURITY`: Ricardo threat model has no unaddressed critical risk.
- `GATE-AUDIT`: Emily independent evidence review completes.
- `GATE-LEO`: Léo issues a canonical internal gate decision.

## Current checkpoint

The coordinator has recovered the live MCF runtime implementation and found that its governed internal skills validate `execution_evidence` supplied by the selected agent; the runtime itself does not originate that agent's cognitive artifact. The Chat bridge auto-executes only bootstrap planning steps and leaves governed agent steps as `READY_AGENT`. Therefore runtime receipts must not be treated as proof that Sofia/Miriam/etc. actually authored work unless an external real agent execution supplied the evidence.

The next operational action is to prove or establish an invocable, non-simulated agent execution boundary. Until then, named-agent architecture outputs remain unexecuted and implementation remains blocked.
