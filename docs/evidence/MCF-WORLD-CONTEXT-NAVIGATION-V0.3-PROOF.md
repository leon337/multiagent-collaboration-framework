# MCF World Context Navigation v0.3 — Read-Only Proof

Mission: MCF-WORLD-PROJECTION-001
Boundary: read-only presentation/navigation
Findability R: untouched and still deferred

## Purpose

Provide operational evidence navigation on top of the already-gated Operational Context v0.1 without introducing new truth resolution.

Navigation path:

    Decision
      -> supported_by
      -> observed Evidence
      -> canonicalRef / freshness / trust / revision
      -> relation provenance / sourceRefs
      -> evidence sourceRefs
      -> return to originating ContextEntry

## Presentation state only

Selection is encoded only in the URL fragment:

    #entry=<ContextEntry.id>&evidence=<WorldRef.id>

The fragment:
- does not modify canonical state;
- does not modify ContextSlice;
- does not modify AgentContextPacket;
- does not persist operational truth;
- can be reconstructed or discarded freely.

## Implemented guardrails

- navigation buttons are created only from existing supported_by relations;
- the target Evidence must already exist in ProjectedObjects;
- UNKNOWN evidence does not receive an evidence-navigation button;
- no consumer-side inference creates a new supported_by;
- evidence details are pre-rendered from the existing bundle;
- return navigation preserves the originating ContextEntry selection.

## Evidence detail

The selected Evidence view shows:

- canonicalRef;
- freshness;
- trust class;
- trust reason;
- source revision;
- observedAt;
- evidence sourceRefs;
- supported_by relation type;
- relation trust;
- relation provenance;
- relation reason;
- relation sourceRefs.

## Executed tests

PASS:

- nominal Operational Context generated 5 observed supported_by evidence targets;
- all 5 have read-only evidence navigation controls;
- all 5 have pre-rendered detail blocks;
- all observed gate-review Evidence objects remain PROJECTION_DERIVED;
- all supported_by relations remain PROJECTION_DERIVED;
- missing/UNKNOWN gate evidence remains in relevantEvidence/unknownRefs but has no navigation button and no supported_by relation;
- generated page contains no fetch, XMLHttpRequest, WebSocket or localStorage;
- navigation uses URLSearchParams + history.replaceState only for presentation selection.

## Browser smoke

Headless Chrome PASS:

1. opened first Decision -> Evidence;
2. evidence pane became visible;
3. URL hash contained both originating entry and evidence id;
4. originating decision card remained selected;
5. evidence pane showed canonical ref, revision, relation trust and relation provenance;
6. Return to context hid the evidence pane but preserved the decision selection;
7. direct deep-link to a second evidence id restored the evidence panel correctly.

Nominal bundle used:

- 15 ContextEntries;
- 16 ProjectedObjects;
- 6 relations;
- 5 observed supported_by evidence paths.

## Boundary

No:
- service;
- database;
- event store;
- write-back;
- mutation;
- authority engine;
- gate approval;
- external effect;
- Dual Browser actuation;
- production;
- 3D dependency.

The feature is presentation-only navigation over an already-derived read model.
