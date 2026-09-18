# PHASE-02 — Cognitive Memory Architecture / Contract

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`  
Risk class: `C`  
Status: `OPEN / PARALLEL_EXECUTION_PREPARED / IMPLEMENTATION_BLOCKED`  
Current recovery baseline: `main@b969df76544e69cb2ff7833a5b65bd231d4db7aa`  
Authority: LEANDRO (final human authority) / Léo (delegated operational gates)  
Coordinator: Mestre

## Objective

Produce an approvable architecture for an MCF Experience Intelligence / persistent-memory layer that can learn from validated operational experience without turning hypotheses, poisoned context or stale observations into institutional truth.

This phase is design/evidence only. Product implementation, provider mutation, production promotion and release publication remain blocked.

## Source precedence

1. current explicit instruction from LEANDRO;
2. live GitHub/provider evidence;
3. current applicable repository SHA and tests;
4. current MCF project instructions and unified operational protocol;
5. issue #164 decision history and current mission artifacts;
6. historical documents only when not contradicted above.

## Current human execution decision

LEANDRO requires discovery/design work to avoid serial specialist dependencies.

Required topology:

```text
MESTRE
   |
   +-- Stage A: independent authoring FAN-OUT
   |     Miriam
   |     Sofia
   |     Manoel
   |     Daniela
   |     Ricardo
   |     Júlia
   |     Tiago
   |     Rafael
   |     Eduardo
   |     Bruno
   |     Renato
   |     Beatriz
   |     Augusto
   |     Patrícia
   |     Lucas
   |
   +-- Stage B: FAN-IN review in parallel
   |     Carmem
   |     Emily
   |
   +-- Stage C
         Léo -> internal evidence gate -> Mestre
```

No Stage A author receives peer output. One failed author must not terminate peers.

## Official agent pool rule

The MCF retains its 29 official agents as the available pool.

Current rule:

```text
OFFICIAL_POOL=29
PARTICIPATION_CREDIT=ONLY_REAL_CONCRETE_DELIVERY
DECORATIVE_FULL_ROSTER_EXECUTION=FORBIDDEN
```

A phase selects only roles with a concrete deliverable. Other roles enter later when their competence has executable work.

## Zero-new-cost invariant

This mission must not require:

- paid model API;
- billable managed-agent task;
- paid embedding provider;
- paid/larger runner.

The Brainbase billable task path is not part of the active execution route.

The mission harness uses a standard public GitHub-hosted runner plus pinned local Ollama / `qwen2.5:1.5b`.

## Deterministic anti-simulation invariant

A named agent receives participation credit only when evidence proves:

1. distinguishable role-bound execution;
2. mission-scoped work packet;
3. at least one successful real tool call;
4. machine evidence linking tool name, call ID, argument digest and result digest;
5. non-empty role-owned artifact;
6. timestamps and artifact SHA-256;
7. no fabricated tool/action/provider claim.

If any item is missing, the role remains uncredited.

## Tool Capability Contract — mission harness

Allowed tools are read-only:

- `repo_search`;
- `repo_read`;
- `repo_list`;
- `git_history`.

The agent requests the tool. The harness validates and executes it. The agent receives the real observation before producing its final artifact.

The tool layer is restricted to the checked-out public repository and denies secret/credential-like paths. It does not expose tokens, private Ledger content or provider credentials.

## Product contract already closed

The architecture must preserve the issue #164 onboarding decisions, including:

- Supabase/Postgres remains the operational source of truth for Cognitive Ledger;
- existing records are preserved;
- memory capture is explicit or suggested-with-confirmation, never silent automatic capture;
- MCF write uses a dedicated least-privilege capability/OAuth boundary, never generic `service_role`/SQL access;
- original authorized wording is preserved as private provenance while structured meaning is represented separately;
- correction/supersession preserves history;
- success requires persistence + read-back + auditable Receipt;
- textual/structured retrieval works without external embeddings;
- external embeddings remain separate opt-in;
- synthetic proof precedes any real memory test;
- private memory must not be exported to public Git/CI evidence.

## Experience Intelligence design invariants

```text
CLAIM_WITHOUT_PROVENANCE != TRUSTED_FACT

MEMORY_RELEVANT
!= MEMORY_TRUSTED
!= MEMORY_AUTHORIZED_FOR_ACTION

RETRIEVAL
!= AUTHORIZATION
```

Target conceptual flow:

```text
CAPTURE
  -> EVIDENCE + PROVENANCE
  -> VALIDATION
  -> DURABLE EVENT
  -> RETRIEVAL
  -> TRUST / ACTION GATE
  -> RECOMMENDATION
  -> OUTCOME
  -> FEEDBACK
```

Persistent-memory writes are privileged operations. External/tool content must not become durable behavioral instruction solely because it is relevant.

## Stage A specialist outputs

- Miriam — provenance, source precedence, contradictions, lifecycle and memory governance;
- Sofia — component/boundary architecture and failure isolation;
- Manoel — append-only/idempotent persistence, migration and backup/restore;
- Daniela — lineage/data quality/currentness;
- Ricardo — threat model, poisoning, auth, secrets and fail-closed controls;
- Júlia — governance, human gates, minimization, confidence and sensitivity;
- Tiago — zero-cost retrieval/RAG/embedding policy;
- Rafael — implementation decomposition without implementation;
- Eduardo — semantic API/capability/Receipt contracts;
- Bruno — zero-cost staging/SRE/rollback/logging;
- Renato — validation/E2E/regression matrix;
- Beatriz — behavioral memory/agent evaluation;
- Augusto — trace/tool/retrieval attribution and anti-simulation observability;
- Patrícia — failure reproduction and CAF recovery;
- Lucas — concurrency/performance/resource sustainability.

## Stage B fan-in

Carmem and Emily consume the same complete available Stage A package and execute in parallel.

Carmem consolidates without hiding contradictions.

Emily independently audits false-green risk, missing evidence, security/privacy gaps and blockers.

## Stage C gate

Léo consumes the authoring package plus Carmem/Emily outputs.

Léo may issue only an internal evidence state such as:

- `APPROVE_FOR_HUMAN_DESIGN_REVIEW`;
- `APPROVE_WITH_RESERVATIONS`;
- `RETURN_FOR_CORRECTION`;
- `BLOCK`.

Léo cannot infer LEANDRO approval and cannot authorize live implementation.

## Human Delegation Firewall

LEANDRO is not the technical operator. Do not ask him to run CLI, SQL, migrations, deployments, log inspection or provider configuration.

Human escalation is reserved for material authority/purpose/risk/cost/public-exposure decisions and gates defined by protocol.

## Required architecture coverage

The combined package must cover:

- Experience Intelligence Layer boundaries;
- Cognitive Ledger governed write/read separation;
- provider/code drift reconciliation;
- provenance and source minimization;
- contradiction/supersession semantics;
- memory poisoning and indirect prompt injection;
- least-privilege authorization;
- idempotency and collision behavior;
- retrieval trust and action authorization;
- backup/restore/migration compatibility;
- cross-chat recovery;
- observability/tool/retrieval attribution;
- evaluation and regressions;
- zero-cost operational sustainability;
- exact-SHA validation and rollback;
- audit/gate evidence.

## Gates

- `GATE-RUNTIME-REALITY`: named roles need real attributable execution;
- `GATE-TOOL-EVIDENCE`: credited roles need successful tool-call evidence;
- `GATE-CLASS-C`: governance/observability/evaluation/memory controls complete;
- `GATE-SECURITY`: no unresolved critical security blocker;
- `GATE-AUDIT`: Emily audit complete;
- `GATE-LEO`: Léo internal evidence decision complete;
- `GATE-ARCH-DESIGN`: architecture surfaced to LEANDRO at decision level;
- implementation remains separately authorized.

## Current next action

Run the zero-cost parallel tool-using harness from the current PR candidate, collect per-agent artifacts/log evidence, apply CAF to failures without stopping healthy peers, then perform the Stage B fan-in and Stage C internal gate.

No live Cognitive Ledger write or product implementation is authorized by this plan.
