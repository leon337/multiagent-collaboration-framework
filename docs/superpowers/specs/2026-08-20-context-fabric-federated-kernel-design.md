# Context Fabric — Federated Context Kernel Design

**Mission:** `MCF-ARCHITECTURE-CONVERGENCE-001`  
**Issue:** #147  
**Date:** 2026-08-20  
**Status:** `READY_FOR_LEANDRO_REVIEW`  
**Canonical:** `false`  
**Implementation authorized:** `false`  
**Production authorized:** `false`  
**Baseline:** `main@87c7f24d0d0240207bd694ae3ebbfe2642e6a774`

## 1. Purpose

Define the next MCF Context Fabric architecture after stabilization, with a first implementation boundary that can recover project identity and current context safely from a clean context without depending on chat memory, Mission Control, or a runtime database as canonical truth.

This design consolidates the architecture approved section-by-section during mission discovery. It is still a review artifact: implementation remains a separate authorization boundary.

## 2. Architectural decision

Selected approach: **Federated Context Kernel**.

The MCF keeps a small repository-native kernel for project identity and recovery semantics. Each registered project keeps a small machine-readable Project Capsule in its own repository. Operational facts that require current state remain owned by the live source/provider. Runtime databases and indexes may accelerate lookup, but they are derived and rebuildable.

Core invariants:

```text
CONTEXT_FABRIC != GLOBAL_DATABASE_OF_TRUTH
PROJECT_CAPSULE != LIVE_OPERATIONAL_STATE
PROJECT_ID != REPOSITORY_NAME
SNAPSHOT != LIVE_STATE
RECOVERY_RECEIPT != SOURCE_OF_TRUTH
RUNTIME_INDEX != CANONICAL_REGISTRY
CLAIM_WITHOUT_PROVENANCE != TRUSTED_FACT
READ MAY DEGRADE
MATERIAL ACTION MUST FAIL CLOSED
```

## 3. Goals

The first Context Fabric boundary must:

1. resolve a project deterministically from user intent and aliases;
2. recover stable project identity independently of repository renames;
3. load a compact Project Capsule from the owning project repository;
4. distinguish durable, snapshot, live-required and derived claims;
5. normalize material claims into common Truth Contract semantics;
6. revalidate live-required claims before material actions;
7. detect drift and conflicting authoritative sources;
8. emit an auditable Context Recovery Receipt;
9. operate without Mission Control and without a canonical runtime database;
10. fail closed when required current context cannot be verified.

## 4. Non-goals

This design does not authorize or define implementation of:

- Mission Control product UI;
- Governance v2 activation or merge;
- provider mutation or deployment flows;
- database migrations;
- capability graphs or knowledge graphs in the first boundary;
- a general-purpose global knowledge database;
- HUMAN_GATE semantics or methodology activation;
- production deployment or release publication.

## 5. Component model

```text
Context Fabric
├── Project Resolver
│   └── resolve intent / aliases -> project_id
│
├── Project Registry
│   └── stable identity, repository, capsule pointer,
│       lifecycle, recovery entrypoints and freshness rules
│
├── Project Capsule
│   └── compact repository-local operational snapshot
│
├── Truth Contract Layer
│   └── claim type, owner, provenance, freshness and conflict semantics
│
├── Context Recovery Engine
│   └── resolution -> validation -> live checks -> reconciliation
│
└── Context Recovery Receipt
    └── audit evidence for the recovery performed
```

### 5.1 Project Resolver

Responsibility: map user intent, repository references and approved aliases to a stable `project_id`.

It may use aliases and discovered repositories as evidence, but inference alone does not establish canonical project identity. Ambiguity that cannot be resolved safely returns `AMBIGUOUS_CONTEXT`.

### 5.2 Project Registry

Responsibility: MCF ecosystem catalog and durable project identity locator.

It stores only identity and recovery metadata, not full mutable project state. Logical centrality does not require one monolithic file; the registry is physically split into one versioned entry per project to reduce merge conflicts.

### 5.3 Project Capsule

Responsibility: compact continuity snapshot maintained by the owning project repository.

The Capsule is an operational entrypoint, not a substitute for README files, architecture decisions, runbooks, current-state documents, event ledgers or provider state. Operational fields in the Capsule are snapshots unless explicitly revalidated.

### 5.4 Truth Contract Layer

Truth Contracts are a shared architectural contract, not an internal implementation detail owned exclusively by Context Fabric.

Context Fabric is the first major producer/consumer, but Capability Registry, runtime validation and Mission Control may reuse the same semantics without depending internally on Context Fabric.

Claim types:

- `IDENTITY`
- `NORMATIVE`
- `OPERATIONAL`
- `DERIVED`

Freshness classes:

- `DURABLE`
- `SNAPSHOT`
- `LIVE_REQUIRED`
- `DERIVED`

### 5.5 Context Recovery Engine

Responsibility: deterministic orchestration of project resolution, Registry and Capsule loading, schema validation, claim normalization, freshness checks, live verification, conflict handling and receipt production.

### 5.6 Context Recovery Receipt

Responsibility: evidence of what sources and claims were actually used during a specific recovery.

A Receipt is evidence only. It must never become a new source of truth.

## 6. Ownership boundaries

```text
Context Fabric
    owns -> project identity + recovery semantics

Project repository
    owns -> Project Capsule + detailed project truth

Live provider/source
    owns -> operational state classified LIVE_REQUIRED

Truth Contract Layer
    owns -> shared claim/freshness/provenance/conflict semantics

Capability Registry
    owns -> capability definition, authorization,
            runtime availability and verification
    consumes -> project identity/context

Mission Control
    owns -> visualization and interaction
    consumes -> Context Fabric + runtime/event evidence
    is not -> recovery or execution-plane dependency

Governance
    owns -> methodology, authority and gates
    is consulted by -> Context Fabric
    is not owned by -> Context Fabric

Artifact System
    consumes -> validated context
    generated artifact -> does not automatically become truth
```

## 7. Persistence design

Canonical project identity and recovery configuration are Git-versioned.

Proposed paths in the MCF repository:

```text
context/
  projects/
    <project-id>.yaml

schemas/
  context/
    project-registry-entry.schema.json
    project-capsule.schema.json
    context-recovery-receipt.schema.json
    truth-contract.schema.json
```

Each registered project repository stores:

```text
.mcf/
  project-capsule.yaml
```

A runtime store may hold derived indexes, recent receipts or search acceleration, but loss of that store must not destroy canonical truth.

Required property:

```text
DELETE_RUNTIME_INDEX
      ↓
REBUILD_FROM_CANONICAL_SOURCES
      ↓
NO LOSS OF CANONICAL TRUTH
```

## 8. Candidate Project Registry Entry

```yaml
schema_version: 1

project:
  id: multiagent-collaboration-framework
  lifecycle: REGISTERED

identity:
  canonical_repository: leon337/multiagent-collaboration-framework
  aliases:
    - MCF
    - multiagent framework

ownership:
  project_owner: LEANDRO

context:
  capsule_path: .mcf/project-capsule.yaml
  canonical_entrypoints:
    - README.md
    - docs/MCF-CURRENT-STATE.md

freshness:
  operational_state: LIVE_REQUIRED
  project_identity: DURABLE
```

`project.id` is stable and must not change when a repository is renamed or transferred.

## 9. Candidate Project Capsule

```yaml
schema_version: 1
project_id: multiagent-collaboration-framework

purpose: >
  Multi-agent collaboration framework.

lifecycle: ACTIVE

snapshot:
  current_workstream: architecture-convergence
  current_status: DISCOVERY
  next_action: architecture-design-review
  blockers: []

sources:
  current_state: docs/MCF-CURRENT-STATE.md

observed_at: 2026-08-20T10:00:00Z
```

The Capsule is intentionally small. Mutable operational facts are snapshots unless the recovery process obtains a fresh value from the owning source.

## 10. Truth Contract model

Material claims must be normalizable to:

```yaml
claim:
  type: IDENTITY | NORMATIVE | OPERATIONAL | DERIVED
  value: ...
  owner: ...
  source_ref: ...
  freshness: DURABLE | SNAPSHOT | LIVE_REQUIRED | DERIVED
  observed_at: ...
  provenance: ...
```

Storage may use compact forms and schema defaults. The normalized form is required at the recovery boundary.

### 10.1 Conflict precedence

There is no single global "latest wins" order.

Resolution follows claim type and owner:

- `IDENTITY` -> canonical Registry/Capsule identity contract;
- `NORMATIVE` -> currently valid decision/protocol/methodology source;
- `OPERATIONAL` -> live owning source when current state is required;
- `DERIVED` -> computed result with explicit provenance;
- an applicable explicit current LEANDRO instruction supersedes lower-authority material within its authorized scope.

Unresolved authoritative conflict returns `RECONCILIATION_REQUIRED`. Silent merging is forbidden.

## 11. Project registration lifecycle

```text
DISCOVERABLE
    ↓
CANDIDATE
    ↓ LÉO operational gate
REGISTERED
    ↓
SUSPENDED / ARCHIVED
```

Agents may discover repositories and collect evidence automatically. Registration requires sufficient evidence for identity, owner and source of truth. LÉO holds the routine operational gate. LEANDRO is escalated only for a reserved material ambiguity or strategic conflict.

## 12. Deterministic cold-start recovery

```text
user intent
   ↓
resolve candidate project / aliases
   ↓
Project Registry
   ↓
Project Capsule
   ↓
schema validation
   ↓
Truth Contract normalization
   ↓
freshness evaluation
   ↓
LIVE_REQUIRED checks
   ↓
conflict / drift reconciliation
   ↓
recovery outcome
   ↓
Context Recovery Receipt
```

A clean-context recovery must not require prior conversation memory, a runtime cache or Mission Control.

## 13. Recovery outcome states

- `RECOVERED` — sufficient context and required checks completed;
- `PARTIAL_RECOVERY` — sufficient for read-only reasoning while a non-critical source is unavailable;
- `AMBIGUOUS_CONTEXT` — project identity cannot be resolved safely;
- `SOURCE_UNAVAILABLE` — a required live source cannot be verified;
- `INVALID_CONTEXT` — Registry/Capsule/Truth Contract violates schema or contract;
- `DRIFT_DETECTED` — snapshot differs from live state but the divergence is classifiable;
- `RECONCILIATION_REQUIRED` — authoritative sources conflict without a safe automatic resolution.

For a material action:

```text
MATERIAL_ACTION
   +
required claim = LIVE_REQUIRED
   +
live verification failed
   =
ACTION_BLOCKED
```

Read-only reasoning may degrade when safe. Material actions fail closed.

## 14. Freshness and live verification

A claim's freshness class determines whether it may be reused:

- `DURABLE`: stable identity or long-lived decision; reuse while its normative source remains valid;
- `SNAPSHOT`: valid only as an observation at a recorded time;
- `LIVE_REQUIRED`: must be revalidated against the owning source before a current-state material claim/action;
- `DERIVED`: may be recomputed and must preserve provenance to its inputs.

The Recovery Receipt records which claims were reused, which were checked live, which were derived, and when verification occurred.

## 15. Drift and reconciliation

Material changes update the Capsule through normal versioned change flow. CI validates schema and basic documentation parity.

During recovery, `LIVE_REQUIRED` claims are compared against current source state. Divergence produces `DRIFT_DETECTED`.

If drift is operational, safe and inside delegated scope, agents may prepare reconciliation automatically. A material normative conflict produces `RECONCILIATION_REQUIRED` and cannot be silently overwritten.

A periodic job must not blindly rewrite canonical Capsules from provider state.

## 16. Runtime integration

The runtime may persist:

- alias/search indexes;
- recent recovery cache;
- drift signals;
- receipt/event projections;
- query acceleration.

Each derived index entry must retain at least:

```yaml
project_id:
source_ref:
source_revision:
indexed_at:
freshness:
```

If a canonical source revision changes, the corresponding index entry becomes invalid until rebuilt.

The runtime is a projection plane, not a canonical truth plane.

## 17. Evidence and event ledger

The Context Recovery Receipt belongs to the evidence/event plane.

```text
Canonical sources
     ↓
Context Recovery
     ↓
Receipt
     ↓
event/evidence ledger
     ↓
Mission Control / audit
```

If the event ledger is unavailable, read-only recovery may still return a Receipt when policy permits. A governed external action that requires persisted evidence must fail before the external effect if evidence persistence cannot be guaranteed.

## 18. Validation strategy

The primary architectural test is a repository-only cold start:

```text
NEW ISOLATED CONTEXT
        ↓
no conversation memory
no runtime cache
no Mission Control
        ↓
resolve project
        ↓
Registry -> Capsule -> Truth Contracts
        ↓
required live verification
        ↓
Context Recovery Receipt
        ↓
same material understanding
```

Minimum scenarios:

1. clean recovery of a registered project;
2. repository rename while `project_id` remains stable;
3. stale Capsule versus live source;
4. unavailable `LIVE_REQUIRED` provider;
5. ambiguous aliases;
6. `NORMATIVE` versus `OPERATIONAL` conflict;
7. invalid Registry/Capsule schema;
8. complete runtime-index deletion followed by successful rebuild;
9. old Receipt presented as if it were current truth;
10. attempted material action under partial recovery.

Critical expected properties:

```text
CACHE LOSS           -> recoverable
CHAT MEMORY LOSS     -> recoverable
MISSION CONTROL DOWN -> recoverable
CANONICAL DATA LOSS  -> not recoverable
```

## 19. Governance v2 compatibility

Governance v2 remains a separate proposal and is not activated by this design.

The Context Fabric provides compatible foundations for future governance work:

```text
Context Fabric                  Future governance concern
────────────────────────────────────────────────────────
stable project identity      -> identity/currentity model
Truth Contracts              -> explicit material truth
repository cold start        -> GOV-4-compatible foundation
drift + reconciliation      -> GOV-5-compatible foundation
provenance + freshness       -> supports future GOV-2/GOV-6
Recovery Receipt             -> evidence foundation
```

Context Fabric does not own HUMAN_GATE semantics, methodology activation, external-effect authorization, rollback policy or governance-version selection.

Invariant:

```text
CONTEXT_FABRIC_COMPATIBLE_WITH_GOV_V2
        !=
GOV_V2_ACTIVATED
```

## 20. Implementation sequence after separate authorization

```text
CF-0 — Contracts
 schemas
 Project Registry entry
 Project Capsule
 Truth Contract
 Recovery Receipt
 validation fixtures
        ↓
CF-1 — Repository-native Recovery Kernel
 Project Resolver
 Registry loader
 Capsule loader
 schema validation
 truth normalization
 deterministic recovery
        ↓
CF-2 — Freshness adapters
 read-only GitHub/provider verification
 drift detection
 receipts
 event/evidence integration
        ↓
CF-3 — Derived runtime projection
 alias index
 recovery cache
 search acceleration
 rebuild/invalidation
        ↓
later missions
 Capability Registry
 graphs
 Mission Control
```

## 21. First candidate implementation boundary

The first implementation mission, if separately authorized, should include only:

- CF-0 schemas and fixtures;
- repository-native Project Registry structure;
- one MCF Registry entry;
- one `.mcf/project-capsule.yaml` for MCF;
- schema validation;
- minimum Project Resolver/Registry/Capsule loading;
- deterministic recovery for one project;
- Context Recovery Receipt generation;
- tests proving cold-start recovery and fail-closed behavior for missing required context.

Explicitly excluded from the first boundary:

- database/migrations;
- Mission Control;
- provider mutation;
- deployment;
- Governance v2 activation;
- Capability Registry implementation;
- graph materialization.

## 22. Reversibility

The first boundary must be structurally reversible:

- removing the recovery kernel does not mutate provider state;
- removing runtime projections loses no canonical truth;
- Registry and Capsule are versioned artifacts and can be reverted by ordinary Git history;
- no production service depends on Context Fabric during the first boundary;
- Mission Control remains optional and downstream.

## 23. Acceptance criteria for the design

The design is ready for implementation planning only when:

1. subsystem ownership is unambiguous;
2. Truth Contracts have a shared architectural home;
3. Git-versioned Registry/Capsule persistence is accepted as canonical for identity/recovery metadata;
4. live providers remain canonical for `LIVE_REQUIRED` operational truth;
5. cold-start recovery is deterministic and auditable;
6. material actions fail closed on missing required current context;
7. runtime indexes are rebuildable projections;
8. Governance v2 compatibility does not imply activation;
9. the first implementation boundary is small, reversible and does not include Mission Control, DB migrations or provider mutation;
10. LEANDRO explicitly approves this written specification.

## 24. Authorization boundary

Approval of this specification means **design approval only**.

It does not authorize:

- implementation;
- schema/runtime changes;
- merge to `main`;
- Governance v2 activation;
- release;
- production deployment;
- external provider effects.

A separate implementation mission/authorization is required before any code or runtime/schema change begins.
