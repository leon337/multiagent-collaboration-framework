# MCF World Contextual Evidence Source Preview v0.4 — Proof

Mission: MCF-WORLD-PROJECTION-001
Boundary: read-only source preview for already-selected Evidence
Findability R: untouched and still deferred

## Purpose

Extend operational evidence navigation by allowing inspection of a small source excerpt without turning World into a repository browser.

Path:

    Context
      -> Decision
      -> Evidence
      -> Source Preview
      -> Evidence
      -> Context

## Source selection boundary

A source preview is eligible only when:

- a Decision already has an existing supported_by relation;
- the target Evidence already exists in ProjectedObjects;
- Evidence freshness is not UNKNOWN;
- Evidence has exactly one repo-file sourceRef;
- the referenced path resolves inside the repository root;
- current source bytes have SHA-256 equal to the Evidence revision.

No arbitrary source path, repository search or directory listing is supported.

## Preview content

For matched sources v0.4 shows:

- sourceRef;
- observed/expected digest;
- line range;
- opening relevant markdown section;
- existing Evidence identity remains the navigation parent.

Preview content is not a new World object and is not operational truth. It is a read-only view of already-referenced bytes.

## Fail-closed cases

### Revision mismatch

If current bytes do not match Evidence.revision:

    status = REVISION_MISMATCH
    content = null

No source excerpt is exposed as if it matched the Evidence.

### Path traversal

A sourceRef resolving outside repository root is rejected with:

    PATH_OUTSIDE_REPO

No file content is read.

### Missing / UNKNOWN evidence

Missing evidence remains UNKNOWN and does not receive:
- supported_by;
- Evidence navigation;
- Source Preview.

## Executed tests

PASS:

- 5 supported gate-review Evidence objects generated 5 MATCHED previews;
- each preview digest equals its Evidence revision;
- each preview includes a bounded line range and content;
- revision mismatch exposes no content;
- repository path traversal is rejected;
- missing/UNKNOWN evidence receives no preview;
- generated consumer contains no fetch, XMLHttpRequest, WebSocket or localStorage.

## Browser smoke

Headless Chrome PASS:

1. Context -> Decision -> Evidence opened;
2. Evidence -> Source Preview opened;
3. breadcrumb displayed Context -> Decision -> Evidence -> Source;
4. revision and source location were visible;
5. URL hash contained source=1 only as presentation state;
6. Source -> Evidence removed source selection while preserving Evidence;
7. Evidence -> Context removed Evidence selection while preserving origin semantics.

## Boundary

No:
- repository browser;
- directory enumeration;
- global search;
- network fetch;
- mutation/write-back;
- database/event store;
- authority engine;
- production effect;
- Dual Browser actuation;
- 3D dependency.
