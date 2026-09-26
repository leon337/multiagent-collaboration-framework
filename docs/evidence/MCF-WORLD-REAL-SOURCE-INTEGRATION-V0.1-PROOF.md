# MCF World Real-Source Integration v0.1 — Proof

Mission: MCF-WORLD-PROJECTION-001
Boundary: read-only / snapshot-based provider integration
Findability R: untouched and deferred

## Real sources used

1. Mission record
   - context/missions/mcf-world-projection-001.json
   - owner of mission current_state, product_value_gate and architecture-class facts.

2. Project registry
   - context/projects/multiagent-collaboration-framework.yaml
   - owner of canonical project repository identity.

3. Local Git
   - branch mission/mcf-world-projection-001
   - observed HEAD 075cd9b234eb70c2be8a8aeedbb7b4f44709dfa5
   - owner of local checkout branch/HEAD facts only.

4. GitHub provider snapshot
   - observed 2026-09-26T09:40:30Z
   - Issue #379 state = open
   - PR #380 state = open
   - PR #380 draft = true
   - PR #380 merged = false
   - PR #380 head_sha = 075cd9b234eb70c2be8a8aeedbb7b4f44709dfa5
   - GitHub owns Issue/PR provider facts only.

## Ownership

Ownership is declared prospectively in:

docs/contracts/MCF-WORLD-REAL-SOURCE-OWNERSHIP-v0.1.json

The real-source adapter rejects missing/mismatched policy declarations.

No trust/freshness/ranking heuristic chooses fact ownership.

## Nominal execution

Result:

    REAL_SOURCE_ADAPTER_V01 PASS

Generated:

- 8 ContextEntries
- 4 ProjectedObjects
- 0 diagnostics

Observed consistent facts:

- mission state came from mission record;
- canonical repository came from project registry;
- Issue #379 state came from GitHub issue provider snapshot;
- PR #380 metadata came from GitHub PR provider snapshot;
- local branch/HEAD came from local Git;
- local HEAD matched PR head_sha at snapshot time.

## Negative cases

### PR owner unavailable

GitHub PR data was removed from a copied provider snapshot.

Expected and observed:

- PR evidence becomes UNKNOWN;
- MISSING_CANONICAL_VALUE diagnostic is emitted;
- local Git does not substitute for GitHub PR state.

### Local vs PR head divergence

The copied PR snapshot head_sha was changed.

Expected and observed:

- local Git retains its own HEAD fact;
- GitHub PR retains its own head_sha fact;
- SOURCE_CONFLICT diagnostic records divergence;
- neither source overwrites the other.

### Repository identity divergence

The copied provider snapshot repository was changed.

Expected and observed:

- project registry canonical repository remains authoritative;
- SOURCE_CONFLICT diagnostic records the provider mismatch.

## Schema

Ajv validated:

- ContextSlice;
- AgentContextPacket;
- all 4 ProjectedObjects.

## Browser smoke

The same disposable bundle rendered through Context Consumer v0.2.

PASS:

- mission state visible;
- Issue #379 state visible;
- PR #380 state/draft/merged visible;
- project canonical repository visible;
- nominal run shows zero diagnostics;
- MESTRE packet contains canonical refs for Issue #379, PR #380 and local Git evidence.

The packet references relevant evidence rather than duplicating all ContextSlice evidence detail.

## Boundary

The provider snapshot is evidence captured from a read-only GitHub connector call. The adapter itself performs no network call.

There is no:

- persistent World service;
- database;
- event store;
- write-back;
- mutation;
- authority engine;
- background synchronization;
- production action;
- 3D dependency.

Provider snapshots and generated views are disposable observations/read models, not canonical mission truth.
