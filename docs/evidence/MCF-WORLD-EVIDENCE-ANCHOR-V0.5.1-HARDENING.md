# MCF World Evidence Anchor v0.5.1 — Hardening Proof

Mission: MCF-WORLD-PROJECTION-001
Scope: technical hardening only
Functional expansion: HOLD
Findability R: untouched and deferred

## Purpose

Strengthen the already-gated Evidence Relevance Anchor v0.5 without adding product capability.

No new navigation, object, relation, source type, search, discovery or inference was introduced.

## Runtime hardening

The anchor builder now rejects malformed metadata before materialization.

Required:

- non-empty metadataRevision;
- anchors must be an array;
- each anchor must be an object;
- non-empty anchorId;
- non-empty evidenceCanonicalRef;
- sourceRef.source/ref;
- declaredBy.source/ref;
- lineStart and lineEnd must be true integers.

Important language-level edge case:

    bool is a subclass of int in Python

Therefore lineStart=true / lineEnd=true are now explicitly rejected with type(x) is int.

## Global anchor identity hardening

anchorId is a presentation/provenance handle, not a WorldRef, but it still must not ambiguously identify two Evidence targets.

If the same anchorId is declared for different evidenceCanonicalRef values:

    ANCHOR_ID_CONFLICT

No affected anchor is materialized.

No “first wins” behavior exists.

## Metadata schema

Added:

    docs/contracts/MCF-WORLD-EVIDENCE-ANCHOR-METADATA-v0.1.schema.json

The schema requires:

- world-evidence-anchor-metadata/v1;
- metadataRevision;
- all anchor identity/provenance fields;
- repo-file sourceRef;
- positive integer ranges;
- declaredBy provenance.

A verifier adds semantic checks not expressible cleanly in JSON Schema:

- lineEnd >= lineStart;
- anchorId cannot map to different Evidence identities.

## Executed negatives

PASS:

- missing metadataRevision -> fail closed;
- missing declaredBy -> fail closed;
- boolean lineStart/lineEnd -> fail closed;
- duplicate anchorId across different Evidence -> fail closed;
- existing v0.5 conflict/source mismatch/range/revision negatives remain PASS.

## Full regression suite

PASS:

- Evidence Anchor v0.5 + hardening;
- Source Preview v0.4;
- Context Navigation v0.3;
- Operational Context v0.1;
- Context Consumer v0.2;
- Full Pipeline v0.1;
- Real-Source Adapter v0.1;
- Adapter v0.1;
- World Model Contract verifier;
- World Model JSON Schema verifier.

## Boundary

No change to:

- human UX flow;
- Product GO;
- Findability R;
- persistent service;
- mutation;
- authority;
- production;
- 3D;
- discovery/search;
- object universe.

This is defensive validation only.
