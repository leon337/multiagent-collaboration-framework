# MCF World Evidence Anchor v0.5.2 — Schema / Runtime Alignment

Mission: MCF-WORLD-PROJECTION-001
Scope: technical hardening only
Functional expansion: HOLD_PENDING_HUMAN_VALIDATION
Findability R: untouched and deferred

## Purpose

Remove the remaining tolerance gap between the Evidence Anchor metadata JSON Schema and the Python runtime builder.

No product capability changed.

## Runtime now enforces the same structural boundary as the schema

Top-level metadata must contain exactly:

- schema
- metadataRevision
- anchors

schema must equal:

    world-evidence-anchor-metadata/v1

Each anchor must contain exactly:

- anchorId
- evidenceCanonicalRef
- sourceRef
- lineStart
- lineEnd
- declaredBy

sourceRef must contain exactly:

- source = repo-file
- ref

declaredBy must contain exactly:

- source
- ref

All required strings must be non-empty after trimming.

lineStart and lineEnd must be actual Python integers, not booleans.

## Fail-closed additions

The runtime now rejects:

- wrong schema identifier;
- unexpected top-level properties;
- unexpected anchor properties;
- sourceRef.source other than repo-file;
- unexpected declaredBy properties.

These cases produce ANCHOR_METADATA_INVALID and no anchor materialization.

## Diagnostic precision

Validation order preserves specific diagnostics for:

- schema;
- metadataRevision;
- anchors;

before the generic documentShape error for additional/unknown top-level fields.

## Executed tests

PASS:

- original valid v0.5 anchor;
- v0.5.1 malformed metadata cases;
- wrong schema;
- extra top-level property;
- extra anchor property;
- wrong source type;
- extra declaredBy property;
- duplicate anchorId across Evidence;
- bool line range rejection;
- source mismatch;
- range invalid;
- revision mismatch.

## Regression checkpoint

The complete read-only stack verifier also passed:

    READONLY_STACK_V051 PASS

No regression in:

- World Model contract/schema;
- core adapter/rebuild;
- Context Consumers;
- Full Pipeline;
- Real-Source Adapter;
- Operational Context;
- Context Navigation;
- Source Preview;
- Anchor metadata verifier.

## Boundary

No new:

- World object;
- relation;
- navigation;
- search/discovery;
- inference;
- source type;
- authority;
- persistence;
- mutation;
- production effect;
- 3D behavior.

This delta only makes runtime acceptance consistent with the already-gated metadata contract.
