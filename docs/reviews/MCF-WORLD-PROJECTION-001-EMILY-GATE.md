# Emily Gate — MCF-WORLD-PROJECTION-001

**Decision:** GO — READ-ONLY PROTOTYPE ONLY  
**Production:** NOT AUTHORIZED

## Blocking conditions

The prototype is blocked if any of the following occurs:

- World becomes a competing source of truth for mission, agent, HUMAN_GATE, artifact, receipt or authority.
- World implements execution semantics such as retries, scheduling, completion, compensation or authorization.
- missing/conflicting evidence is converted into optimistic state instead of UNKNOWN/STALE/conflict.
- projected facts cannot be traced to source/revision/provenance.
- any World control produces external effects in the v0.1 experiment.
- graph layout creates semantic relations.
- HUMAN_GATE actor/authority/decision/evidence are collapsed.

## Mandatory invariants

- canonical references for all operational entities;
- reconstructible read model;
- disposable cache;
- explicit source revision/freshness;
- shared state across Cockpit/Timeline/Graph;
- evidence/receipt navigation;
- explicit UNKNOWN and STALE;
- zero silent conflict resolution;
- executor, author, approver and evidence identities remain distinguishable;
- negative tests prove zero external effect from World.

## Anti-patterns rejected

- `worldStatus` as independent truth;
- World database as system of record;
- bidirectional sync;
- new event store before demonstrated need;
- universal ontology for all MCF objects;
- correlation treated as causation;
- DONE/VERIFIED badges without supporting evidence;
- fake live animation/telemetry;
- hiding UNKNOWN/STALE to simplify UX;
- graph hairball;
- 3D;
- inline editing;
- active mutation controls;
- bulk duplication of canonical content solely for rendering convenience.

## Protocol acceptance

A known fixture/replay must prove:

1. canonical identity resolution;
2. source revision visibility;
3. deterministic rebuild;
4. convergence across views;
5. provenance to receipt/evidence;
6. correct UNKNOWN/STALE behavior;
7. no invented causal relation;
8. HUMAN_GATE authority separation;
9. zero World-side external effect;
10. safe degradation with missing, duplicate, out-of-order or conflicting input.

## Vertical acceptance

Using the same mission and evidence in both conditions, compare the linear baseline and World projection on:

- time to understand current state;
- time to locate blocker;
- time to locate evidence/receipt;
- actor/authority attribution errors;
- mission-state errors;
- context switches.

GO to a broader experiment only when World materially improves at least two metrics with no relevant precision regression and no false authority/evidence state.

A result in which Cockpit supplies nearly all the gain is valid; Timeline and Graph do not gain permanence automatically.

## Principle

> World may make canonical state understandable; it may not become owner of that state.
