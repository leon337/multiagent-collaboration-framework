# Governed Shared Memory Design

**Mission:** `MCF-GOVERNED-SHARED-MEMORY-001` / Issue #316  
**Parent operational mission:** `MCF-MEMORY-LIVE-NEXT-STABLE-001` / Issue #164  
**Risk:** Classe C  
**Human authority:** LEANDRO  
**Standing authorization:** execute phases 1–6 through production without pausing for additional permission; technical/security gates remain fail-closed.

## 1. Intent and success

Evolve MCF cognitive memory from governed read/write into governed shared memory while preserving immutable history, provenance, scope isolation, explicit authority and auditable receipts.

Terminal success requires all of the following:

1. `memory.read` remains qualified and scoped;
2. `memory.write` is production-capable with explicit confirmation, read-back and receipt;
3. `memory.supersede` preserves history and resolves current state deterministically;
4. contradiction handling preserves both claims and never silently converts conflict into supersession;
5. `memory.propagate` is a first-class information-flow operation with explicit source/target scopes and policy version;
6. the combined service blocks cross-scope leakage, direct-ID bypass, stale propagation and unauthorized mutation;
7. exact-SHA CI, live provider proof, rollback/backup and post-deploy evidence exist.

## 2. Canonical architecture

```text
Authorized Agent / MESTRE
        |
        | execution-scoped capability
        v
GovernedMemoryService (MCF runtime)
  - read
  - write
  - supersede
  - detect/resolve contradiction
  - propagate
  - resolve current state
        |
        | MemoryProvider protocol
        v
Transport adapter (MCP/HTTP)
        |
        v
Cognitive Ledger provider
  append-only events + sources + relations
        |
        v
Supabase/Postgres
```

### Boundary ruling

The MCF runtime owns **semantic authorization and policy**. The Cognitive Ledger provider owns **durable append-only persistence and retrieval**. Nest/MCP/HTTP adapters are transport boundaries only and must not become a second semantic memory engine.

This reconciles the overlapping candidates:

- PR #246 contributes the execution-scoped runtime capability model, receipts and provider abstraction;
- PR #250 contributes a hardened `/mcp-write` transport boundary and strict provider inventory validation;
- `cognitive-ledger` PR #5 contributes the isolated provider tool `registrar_memoria` and transactional read-back.

No two independent write semantics may be promoted. Existing candidates are source material, not parallel production paths.

## 3. Domain model

### Events

The Ledger remains append-only. Mutations that change meaning create new events or relations rather than rewriting prior cognitive events.

Conceptual audit events:

- `MemoryWritten`
- `MemorySuperseded`
- `MemoryContradictionDetected`
- `MemoryContradictionResolved`
- `MemoryPropagated`
- `MemoryPropagationDenied`

These are runtime/audit concepts; provider storage may represent them through existing Cognitive Event + relation primitives.

### Relations

Canonical semantic relation names:

- `SUPERSEDES`
- `CONFLICTS_WITH`
- `DERIVED_FROM`
- `PROPAGATED_FROM`

A relation must identify source/target event IDs and carry enough metadata to recover provenance and policy context without copying private payload into receipts.

## 4. Capabilities

Distinct operation names are mandatory:

- `cognitive-ledger.memory.read`
- `cognitive-ledger.memory.write`
- `cognitive-ledger.memory.supersede`
- `cognitive-ledger.memory.contradiction.resolve`
- `cognitive-ledger.memory.propagate`

`write` never implicitly grants `supersede` or `propagate`.

Every operation validates:

1. signed execution-scoped capability;
2. agent/task/execution identity match;
3. operation-specific arguments;
4. scope/policy requirements;
5. provider success + required read-back;
6. receipt generation;
7. runtime tool-call completion/failure evidence.

## 5. Scope model

Every governed memory event can carry a normalized `memory_scope` in metadata. The initial form is a non-empty opaque string (for example `project:mcf`, `mission:MCF-GOVERNED-SHARED-MEMORY-001`, or `personal:leandro`) rather than a hierarchy inferred by code.

Rules:

- missing scope on new governed writes is rejected once the shared-memory contract is active;
- reads require the requested scope to match the caller-authorized scope;
- direct event-ID lookup is still scope-checked after retrieval;
- propagation requires explicit `source_scope` and `target_scope`;
- a target scope never inherits access to raw sources automatically.

## 6. Write semantics

`memory.write`:

- requires explicit confirmation for real persistence;
- requires an event ID, timestamp, type, title, summary and `memory_scope`;
- accepts sources and relations within bounded limits;
- is idempotent for compatible repeated IDs;
- rejects incompatible ID collisions;
- succeeds only after provider read-back verifies identity and selected semantic fields;
- emits a hash-only receipt.

## 7. Supersession semantics

`memory.supersede` creates a **new event** and a `SUPERSEDES` relation pointing to the prior event.

Invariants:

- old event remains retrievable as history;
- source and replacement must be in the same scope unless an explicit future cross-scope policy exists;
- self-supersession and cycles are denied;
- repeated equivalent supersession is idempotent;
- current-state resolution follows the directed supersession chain;
- a fork with two live replacements is `CONFLICTED`, not arbitrarily resolved.

## 8. Contradiction handling

Contradiction is represented independently from supersession.

The deterministic first production version does **not** ask an LLM to decide truth. It exposes explicit detection/registration and resolution primitives:

- `register_contradiction(a, b)` records `CONFLICTS_WITH` bidirectionally or as a normalized pair;
- `resolve_contradiction(...)` records an explicit resolution event/relation and can supersede a claim only when that operation is separately authorized;
- unresolved contradiction makes current state `CONFLICTED`.

Pipeline rule: deduplication/near-duplicate checks must not discard a candidate before contradiction evaluation can see it. Tests pin this ordering.

## 9. Propagation semantics

`memory.propagate` is information-flow control, not copying by side effect.

Input:

- source event ID;
- `source_scope`;
- `target_scope`;
- policy identifier/version;
- reason/context;
- optional target event ID for deterministic idempotency.

The initial policy engine is an explicit allowlist of `(source_scope, target_scope, operation)` rules supplied to the service. No inferred wildcard access.

On ALLOW:

- create a derived target event with `PROPAGATED_FROM` relation;
- preserve transitive provenance metadata;
- record policy version in receipt;
- do not copy raw source content unless the caller explicitly supplies/authorizes it under provider limits.

On DENY:

- provider is not mutated;
- runtime records a failed/denied tool call;
- a deny receipt/audit result contains hashes/identifiers, not private payload.

### Supersession after propagation

Initial production policy: **MARK_STALE**.

If source `A1` propagated to target `B1`, and `A2 SUPERSEDES A1`, the target derivation is not silently replaced. Current-state resolution marks `B1` as `STALE` until an authorized propagation of `A2` occurs. This avoids automatic trust-boundary mutation.

## 10. Current-state resolver

For an event within a scope, resolver output status is one of:

- `CURRENT`
- `SUPERSEDED`
- `CONFLICTED`
- `STALE`
- `HISTORICAL`

The resolver operates on provider-supplied event/relation data and is deterministic. Ambiguity is represented, never hidden.

## 11. Receipts

Receipt families:

- `mcf_cognitive_memory_read_receipt/v2`
- `mcf_cognitive_memory_write_receipt/v2`
- `mcf_cognitive_memory_supersede_receipt/v1`
- `mcf_cognitive_memory_contradiction_receipt/v1`
- `mcf_cognitive_memory_propagation_receipt/v1`

Receipts may contain IDs, scope hashes, provider, policy version, operation status, event hashes, relation hashes, read-back hashes and timestamps. They must not contain raw memory bodies, credentials or raw private source text.

## 12. Provider contract

The canonical provider protocol remains intentionally small:

```python
write(event, sources, relations) -> provider result
read_back(event_id) -> event or None
relations(event_id) -> list[relation]
```

A provider may implement `relations` by a dedicated endpoint/tool or by returning relations with read-back. Runtime semantics must not depend on SQL access.

For production transport, prefer the isolated MCP write boundary from `cognitive-ledger` PR #5 (`/mcp-write`, exact tool `registrar_memoria`) and the existing read boundary. The MCF server transport validates exact tool inventory, credentials separation, bounded payloads, timeout and fail-closed behavior.

## 13. Security and privacy

Mandatory negative qualifications:

- cross-scope read blocked;
- direct-ID bypass blocked;
- supersede outside scope blocked;
- propagation without explicit rule blocked;
- provider/auth failure produces no success receipt;
- stale propagation is observable;
- conflicting successors are not silently selected;
- retries do not duplicate events/relations;
- receipts/logs contain no raw private memory;
- no service-role/Postgres credential crosses into MCF runtime.

## 14. Rollout

1. merge the canonical runtime capability behind production-disabled configuration;
2. qualify exact SHA in CI/staging;
3. deploy provider `/mcp-write` and verify currentness;
4. synthetic live write/read/supersede/conflict/propagate tests using non-personal fixtures;
5. deploy MCF runtime with scoped production configuration;
6. run post-deploy negative tests;
7. use real personal memory only under the standing human authorization and existing privacy contract;
8. publish/reconcile release/current-state docs.

Rollback is configuration-first: disable mutable capabilities, retain read, and leave append-only Ledger history intact. Code rollback must never require deleting cognitive history.

## 15. Non-goals

- no generic SQL/database capability for agents;
- no automatic LLM truth arbitration;
- no unrestricted propagation;
- no silent capture of memories;
- no destructive overwrite as correction semantics;
- no implicit external embeddings or paid calls;
- no automatic hard delete.
