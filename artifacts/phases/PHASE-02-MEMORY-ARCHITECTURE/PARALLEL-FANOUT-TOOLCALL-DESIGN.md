# Phase 2 — Parallel Fan-Out + Tool-Call Design

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`  
Date: 2026-09-18  
Authority: LEANDRO  
Coordinator: MESTRE  
Risk class: C  
Status: DESIGN / EXECUTION HARNESS CANDIDATE

## Decision

The discovery and architecture work for institutional experience/memory must not be modeled as a serial specialist chain.

The execution topology is:

```text
                         ┌─ Miriam
                         ├─ Sofia
                         ├─ Manoel
                         ├─ Daniela
                         ├─ Ricardo
                         ├─ Júlia
                         ├─ Tiago
MESTRE ── FAN-OUT ───────┼─ Rafael
                         ├─ Eduardo
                         ├─ Bruno
                         ├─ Renato
                         ├─ Beatriz
                         ├─ Augusto
                         ├─ Patrícia
                         └─ Lucas
                              │
                              ▼
                      COMPLETE EVIDENCE PACK
                         ┌───────────────┐
                         │               │
                      Carmem          Emily
                   consolidation      audit
                         │               │
                         └──────┬────────┘
                                ▼
                               Léo
                         internal gate only
                                │
                                ▼
                              MESTRE
```

Authoring specialists are independent. No authoring specialist receives another author's output.

## Tool capability contract

A named specialist only receives execution credit when all of the following are evidenced:

1. distinguishable role-bound execution;
2. mission-scoped task packet;
3. at least one successful real tool call;
4. tool name, call ID, argument digest and result digest in machine logs;
5. non-empty role-owned Markdown artifact;
6. artifact SHA-256 and timestamps;
7. no fabricated tool/action/provider claims.

The mission harness exposes only read-only repository tools:

- `repo_search`
- `repo_read`
- `repo_list`
- `git_history`

The model requests a tool. The harness validates and executes it. The model receives the real observation and only then writes its final analysis.

## Security boundary

The tool layer:

- is read-only;
- operates only on the checked-out public MCF repository;
- restricts file access to approved technical/documentation prefixes;
- rejects secret/credential-like filenames;
- does not expose GitHub tokens, Supabase credentials, service-role keys or private Cognitive Ledger payloads;
- performs no provider mutation.

This is a mission harness, not the permanent MCF production executor.

## Executor policy

Two executors are allowed under one evidence contract:

1. **Brainbase managed agents — preferred when available**
   - explicitly authorized by LEANDRO for billable task runs on 2026-09-18;
   - each credited run must still provide attributable execution, real tool evidence and artifact provenance;
   - current provider observation: `CREDITS_EXHAUSTED` before agent execution; blocked tasks receive no participation credit.

2. **Public GitHub-hosted runner + local Ollama — zero-cost contingency**
   - pinned local Ollama with `qwen2.5:1.5b`;
   - no paid model API, paid embeddings or paid/larger runner requirement;
   - used so the mission does not stall when Brainbase is unavailable.

Executor choice does not change privacy, anti-simulation, fan-out/fan-in, Class C or human-authority boundaries.

## Concurrency semantics

All Stage A specialist tasks are submitted together. They do not have data dependencies on each other.

The shared Ollama service may bound physical inference concurrency for resource safety. This does not create a logical handoff dependency between specialists.

One Stage A failure must not stop peers. The harness records the failure and continues collecting other outputs.

## Fan-in semantics

Carmem and Emily receive the same complete Stage A package and run in parallel:

- Carmem maps the package and preserves contradictions;
- Emily independently audits evidence and false-green risk.

Léo runs only after that evidence package exists. Léo's output is an internal evidence gate; it cannot infer LEANDRO approval or authorize live implementation.

## Experience Intelligence Layer design invariants

The specialist work must preserve these distinctions:

```text
MEMORY_RELEVANT
!= MEMORY_TRUSTED
!= MEMORY_AUTHORIZED_FOR_ACTION
```

and:

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

Persistent memory writes are privileged operations. External content must not become durable instruction or institutional fact merely because it is semantically relevant.

## Failure behavior

The harness fails closed for execution credit when:

- tool request is invalid;
- tool execution fails;
- final artifact is empty or violates the required ESEV structure;
- role execution times out;
- artifact/tool evidence cannot be linked;
- repository mutation is detected.

A failed specialist remains uncredited. Peers remain valid if their own evidence passes.

## Non-goals

This design does not:

- perform live Cognitive Ledger provider mutation in this candidate;
- mutate Supabase directly;
- authorize production;
- authorize a release;
- activate automatic memory capture;
- make Ollama/GitHub Actions a permanent production dependency;
- replace the human authority boundary.

## Acceptance for this harness

The execution experiment is valid only if CI proves:

- Stage A fan-out ran without peer-output dependency;
- each credited agent has at least one successful tool call;
- per-agent artifacts and metadata were uploaded;
- Carmem and Emily consumed the complete available evidence package;
- Léo received the consolidated/audited package;
- repository mutation remained false;
- paid API use remained false;
- private memory exposure remained false.
