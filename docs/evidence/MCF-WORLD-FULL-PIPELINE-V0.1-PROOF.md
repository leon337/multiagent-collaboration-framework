# MCF World Full Pipeline v0.1 — Architecture Proof

Mission: MCF-WORLD-PROJECTION-001
Boundary: architecture-only / read-only
Human Findability R: untouched and still deferred

## Purpose

Prove the full read-only pipeline with architecture-specific inputs:

    architectural canonical-like source bundle
      -> ephemeral typed source adapter
      -> disposable World bundle
      -> human representation + AgentContextPacket

The goal is not product usability. It is semantic preservation across the complete projection chain.

## Source fixture

docs/examples/MCF-WORLD-ARCH-SOURCE-BUNDLE-v0.1.json

Contains:

- FRESH canonical mission state = BLOCKED;
- missing canonical signature receipt;
- STALE verified external runtime snapshot;
- FRESH UNTRUSTED_EXTERNAL browser claim;
- two competent conflicting deployment-region values.

The fixture is independent of Findability R.

## Source adapter

tools/world-model/architecture_source_adapter_v01.py

Behavior demonstrated:

- stable WorldRef resolution;
- canonical state preserved;
- missing competent value -> UNKNOWN + MISSING_CANONICAL_VALUE;
- conflicting competent values -> UNKNOWN + SOURCE_CONFLICT;
- STALE evidence remains STALE;
- untrusted observation remains UNTRUSTED_EXTERNAL;
- STALE evidence derives a read-only inspection action with provenance DERIVED, trust PROJECTION_DERIVED and ruleId stale-evidence-next-action/v1;
- no source mutation;
- no authority creation.

## Generated bundle

Observed in execution:

- 5 ProjectedObjects;
- 7 ContextEntries;
- 1 typed relation;
- diagnostics:
  - MISSING_CANONICAL_VALUE;
  - SOURCE_CONFLICT.

The same bundle feeds human and MESTRE representations.

## Determinism

Two builds from the same source fixture and fixed generatedAt are structurally equal.

Result:

    FULL_PIPELINE_V01 PASS

## Contract validation

Ajv validated the generated ContextSlice, AgentContextPacket and all 5 ProjectedObjects.

## Human ↔ MESTRE semantic consistency

PASS:

- packet entries equal corresponding ContextSlice entries by ID;
- packet diagnostics equal ContextSlice diagnostics;
- human rendering preserves BLOCKED, UNKNOWN, STALE, UNTRUSTED_EXTERNAL, SOURCE_CONFLICT, MISSING_CANONICAL_VALUE and PROJECTION_DERIVED;
- MESTRE rendering preserves the same signals.

## Browser smoke

Headless Chrome PASS:

- at least seven ContextEntry identities rendered;
- at least two diagnostics rendered;
- switching to AgentContextPacket preserved all uncertainty/trust/diagnostic signals.

## Boundary

No World service, database, event store, network sync, write-back, MCF mutation, local authority engine, Dual Browser action, production effect or 3D dependency.

All generated outputs are disposable and reconstructible.
