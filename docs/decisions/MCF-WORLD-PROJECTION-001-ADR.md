# ADR — MCF-WORLD-PROJECTION-001

## Decision

Adopt **World Projection Protocol (WPP)** as a candidate projection boundary and proceed only to a **read-only vertical prototype**.

Do not create a standalone authoritative World runtime at this stage.

## Context

Existing experiments — Archipelago, Grafo Explorável, MCF World, Cockpit and Dual Browser — demonstrate useful pieces of the broader idea, but they also create a risk of multiple local states and duplicated semantics.

The mission team converged on a stricter model:

- MCF Runtime remains canonical for execution/governance.
- Context Fabric remains canonical for its context/provenance responsibilities.
- World is reconstructible and disposable.
- Views project the same read model.
- Future actions cross MCF authority/gate boundaries; World itself does not grant authority.

## Decision details

### Accepted

- `WorldRef` for universal identity.
- Typed domain adapters rather than a universal “Entity + metadata” ontology.
- Source adapters that preserve original provenance.
- Disposable/reconstructible read model.
- Cockpit + Timeline as core read-only projections.
- Graph as an experimental projection.
- Explicit FRESH / STALE / UNKNOWN.
- Selection/deep-link identity preserved across views.
- Intent boundary specified now, but mutation deferred.
- External/browser content classified as untrusted observation by default.

### Rejected for v0.1

- World as system of record.
- World-owned mission/gate state machine.
- World retries/timeouts/scheduling.
- bidirectional synchronization;
- World event store as a new canonical ledger.
- graph database requirement.
- 3D as an MVP requirement.
- production deployment.
- active Dual Browser commands from the World surface.

## Rationale

The primary product question is whether structured projection reduces context-recovery cost and interpretation errors. Building a second runtime, graph database or 3D world before measuring that question would make the experiment incapable of falsifying the core hypothesis cheaply.

## Consequences

Positive:

- low architectural commitment;
- preserves MCF governance;
- makes the prototype reconstructible;
- supports multiple visual projections without creating multiple truths;
- permits an honest GO/HYBRID/NO-GO decision.

Negative:

- eventual consistency/freshness must be visible;
- adapters carry domain-specific complexity;
- the first prototype is less visually ambitious than the original 3D vision;
- some user value may only emerge after a later spatial experiment.

## Gate

Emily's final audit decision: **GO only for read-only prototype**.

This ADR does not authorize production, mutation, active Dual Browser effects, 3D or any bypass of canonical MCF authority.
