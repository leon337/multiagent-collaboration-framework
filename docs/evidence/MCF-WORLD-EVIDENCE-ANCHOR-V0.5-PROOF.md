# MCF World Evidence Relevance Anchor v0.5 — Architecture Proof

Mission: MCF-WORLD-PROJECTION-001
Boundary: non-human / read-only / architecture-only
Findability R: untouched and still deferred

## Purpose

Prove that a predeclared evidence location can be rendered without search, heuristic relevance detection or discovery.

Flow:

    existing Decision
      -> existing supported_by
      -> existing Evidence
      -> explicit anchor metadata
      -> digest-bound source bytes
      -> exact declared line range
      -> bounded mechanical context

The anchor is presentation/provenance metadata. It is not a new World object or truth claim.

## Representative fixture

Source:
- docs/examples/MCF-WORLD-ANCHOR-SOURCE-v0.1.md

Explicit metadata:
- docs/examples/MCF-WORLD-EVIDENCE-ANCHORS-v0.1.json

Declared anchor:
- anchorId: anchor:fixture-decision
- sourceRef: exact repo-file source of the Evidence
- lineStart: 9
- lineEnd: 11
- declaredBy: explicit fixture metadata ref

No line was discovered by examining source content.

## Invariants

Anchor application requires:

- existing Evidence;
- Evidence already targeted by supported_by;
- Evidence not UNKNOWN;
- exactly matching sourceRef;
- source inside repository root;
- source bytes SHA-256 equal Evidence.revision;
- exactly one anchor for that Evidence;
- positive ordered integer line range;
- range inside the verified source bytes.

No fallback is allowed.

## Fail-closed cases

PASS:
- no metadata -> no anchor;
- conflicting anchors -> ANCHOR_CONFLICT, content=null;
- sourceRef mismatch -> SOURCE_MISMATCH;
- invalid/out-of-range lines -> RANGE_INVALID, content=null;
- Evidence/source revision mismatch -> REVISION_MISMATCH, content=null.

No text search, regex search, fuzzy matching, embeddings, similarity, keyword matching, heading discovery, filename inference or repository discovery is used.

## Exact output

The declared range lines 9–11 rendered exactly:

    Verdict: PASS
    Scope: read-only projection
    Evidence: source bytes must match the Evidence revision

The bounded context is mechanical only (±2 lines).

## Browser smoke

PASS:

1. Decision -> Evidence;
2. Evidence -> Source Preview;
3. Source -> Explicit Anchor;
4. breadcrumb showed Context -> Decision -> Evidence -> Source -> Relevant Anchor;
5. declared-by metadata and source revision were visible;
6. exact range 9–11 rendered;
7. Anchor -> Source preserved source selection;
8. Source -> Evidence preserved Evidence;
9. Evidence -> Context returned to origin.

Hash state selects only a pre-materialized anchorId. Browser-supplied arbitrary line numbers are not accepted.

## Claims boundary

This proves technical/semantic implementation only.

It does not prove:
- human findability improvement;
- lower cognitive load;
- faster context recovery;
- better comprehension;
- Product GO.

Those remain human-validation questions.

## Boundary

No:
- search/discovery;
- new World object;
- mutation;
- authority change;
- repository browser;
- service/database/event store;
- production;
- 3D.
