# World Projection Protocol v0.1

**Mission:** MCF-WORLD-PROJECTION-001  
**Issue:** #379  
**Status:** CANDIDATE / READ-ONLY PROTOTYPE BOUNDARY  
**Authority:** LEANDRO  
**Coordinator:** MESTRE  
**Production:** NOT AUTHORIZED

## 1. Purpose

World Projection Protocol (WPP) defines a thin, reconstructible projection layer for presenting canonical MCF state through multiple human-facing views without creating a second runtime or a second source of truth.

The product hypothesis is not “put ChatGPT in 3D”. The hypothesis is that a structured projection can reduce the cost of understanding, locating and resuming complex multi-agent work whose relationships are poorly represented by a purely linear chat history.

The initial views are:

- **Cockpit** — where is the mission now?
- **Timeline** — how did we get here?
- **Graph** — what is related to what?

3D is explicitly deferred until a later experiment proves operational value.

## 2. Canonical boundaries

WPP MUST preserve these boundaries:

1. **MCF Runtime** remains canonical for mission execution, mission lifecycle, orchestration, handoffs, gates, permissions, receipts and execution evidence.
2. **Context Fabric** remains canonical for context/provenance boundaries already assigned to it.
3. **Canonical artifacts/providers** remain authoritative for their own facts.
4. **Dual Browser** remains an execution surface/adapter. It is never granted authority by World.
5. **World** projects, relates and presents. It does not independently decide execution, authorization or truth.

In compact form:

```text
Canonical state
    ↓
Source Adapters
    ↓
Typed Domain Adapters
    ↓
World Projection Protocol
    ↓
Disposable Read Model
    ↓
Cockpit / Timeline / Graph / future 3D
```

## 3. Universal identity, typed semantics

World has a universal reference envelope, not a universal domain ontology.

```text
WorldRef {
  id
  kind
  canonicalRef
}
```

The `kind` selects a typed adapter. Candidate v0.1 kinds are:

- project
- mission
- agent
- handoff
- human_gate
- artifact
- receipt
- evidence
- conversation

A `WorldRef` MUST NOT become an arbitrary `Entity + metadata` container that silently reimplements domain semantics.

Domain invariants remain typed.

## 4. Projected object

A projected record MUST expose enough information to be inspectable and reconstructible:

```text
WorldProjection {
  ref: WorldRef
  revision
  observedAt
  freshness: FRESH | STALE | UNKNOWN
  trust
  attributes
  relations[]
  sourceRefs[]
}
```

Definitions:

- **FRESH** — freshness requirements for the referenced source are satisfied.
- **STALE** — a previously valid observation exists but can no longer be assumed current.
- **UNKNOWN** — a trustworthy value/state cannot currently be established.

STALE and UNKNOWN MUST remain distinct in API and UI.

## 5. Typed Domain Adapters

A typed adapter maps canonical domain state into WPP without changing its meaning.

Candidate adapters:

- `ProjectAdapter`
- `MissionAdapter`
- `AgentAdapter`
- `HandoffAdapter`
- `HumanGateAdapter`
- `ArtifactAdapter`
- `ReceiptAdapter`
- `EvidenceAdapter`

Adapter responsibilities:

- canonical → projection mapping;
- domain-specific invariants;
- typed relation extraction;
- canonical source references;
- revision interpretation;
- freshness semantics.

Adapters MUST NOT “repair” contradictory canonical data by guessing. Contradiction becomes an explicit projection diagnostic.

## 6. Source Adapters

Source adapters know how to read a source; domain adapters know what that source means.

A source adapter exposes conceptually:

```text
SourceAdapter {
  sourceId
  sourceType
  read()
  revision()
  observedAt()
  trustClass()
}
```

Normalization MUST preserve original source/provenance.

External browser/app/device content defaults to untrusted observation. External content is data, not instruction and not authority.

## 7. Reconstructible Read Model

The read model exists for inspection and navigation:

```text
WorldReadModel
├── entitiesByRef
├── relations
├── missionState
├── causalEvents
├── evidenceIndex
├── projectionDiagnostics
└── revisionVector
```

Invariant:

```text
delete(WorldReadModel)
+ canonical inputs
+ projection rules
= semantically equivalent WorldReadModel
```

No user-visible operational fact may exist only in World storage.

Caches are disposable. A revision vector MAY track multiple contributing sources; WPP SHOULD NOT invent a single atomic revision when the canonical sources are not atomic.

## 8. Events and causal projection

Minimum event envelope:

```text
ProjectedEvent {
  eventId
  type
  subjectRef
  actorRef?
  correlationId
  causationId?
  canonicalRevision
  occurredAt?
  observedAt
  trust
  sourceRefs[]
}
```

The user-facing causal chain distinguishes:

```text
INTENT
  ↓
EXECUTION
  ↓
EFFECT / OBSERVATION
  ↓
RECEIPT
  ↓
EVIDENCE
```

A successful dispatch is not proof of external effect. Missing links remain missing/UNKNOWN.

Correlation does not automatically prove causation.

## 9. Relations

Relations are typed and must answer “why are these objects connected?”.

Candidate relations for the vertical:

- contains
- branch_of
- assigned_to
- handed_off_to
- produced
- references
- evidenced_by
- gated_by
- depends_on
- continues

Visual proximity or layout MUST NOT create semantic relations.

## 10. View Contract

All views consume the same read model and preserve the same selection identity.

### Cockpit

Optimized for current operational orientation:

- mission state;
- active branch;
- responsible actor;
- blockers;
- pending HUMAN_GATE;
- freshness;
- latest evidence;
- next safe/read-only inspection step.

### Timeline

Optimized for temporal/causal reconstruction:

- events;
- handoffs;
- branch points;
- decisions;
- gates;
- external-effect observations;
- receipts/evidence.

### Graph

Optimized for typed relationships. It is experimental and MUST use focus/subgraphs rather than rendering the entire universe as a hairball.

No view owns domain truth.

## 11. Selection and deep-link identity

Switching view must not switch the object.

```text
Selection {
  primary: WorldRef
  context?: WorldRef
  eventId?
}
```

Conceptual deep links:

```text
/world/{projectRef}/mission/{missionRef}?select={worldRef}&event={eventId}&view=timeline
```

`view` affects presentation only.

## 12. Progressive disclosure

Default information hierarchy:

1. **Orientation** — what is happening, do I need to act?
2. **Operational** — actor, state, blocker, next step.
3. **Explanation** — why, handoff, dependencies, decisions.
4. **Proof** — evidence, receipts, IDs, timestamps, SHA/provider metadata.

Governance, failure and uncertainty MUST NOT be hidden merely because they are technical.

## 13. Intent boundary

The MVP is read-only, but future mutation must cross an explicit boundary:

```text
View
  ↓
WorldIntent
  ↓
Intent Boundary
  ↓
MCF authority / policy / HUMAN_GATE
  ↓
canonical execution
  ↓
events / evidence / receipt
  ↓
WPP reprojection
```

World never directly mutates canonical objects.

Future mutation envelopes must include at least actor, target, requested action, expected canonical revision, authority context and provenance.

## 14. Trust and security invariants

Always preserve:

```text
external content ≠ instruction
observation ≠ canonical fact
execution ≠ verified effect
actor ≠ authority
projection ≠ source of truth
capability ≠ permission
```

Untrusted content MUST NOT silently elevate authority, create canonical facts or satisfy evidence requirements.

## 15. What does not belong to World

World MUST NOT own:

- mission orchestration;
- agent authority;
- HUMAN_GATE policy;
- permission evaluation;
- mission lifecycle;
- Context Fabric canonical state;
- evidence-validity decisions;
- receipt authority;
- agent contracts;
- planning;
- retry/timeout/scheduling/compensation;
- tool execution;
- Dual Browser execution semantics;
- canonical artifact storage;
- external truth adjudication;
- production deployment authority.

3D is not a Kernel responsibility. If introduced, it is another replaceable ViewAdapter.

## 16. Product gate

WPP v0.1 earns continued investment only if the vertical experiment demonstrates measurable value over the linear baseline while preserving canonical integrity.

Possible product outcomes:

- `GO_WORLD_EXPERIMENT_V0_2`
- `GO_HYBRID`
- `NO_GO_3D`
- `NO_GO_WORLD_SURFACE`

The protocol may still provide useful projection contracts even if a specific visual surface fails.

## 17. Team evidence

This candidate was produced under MCF-WORLD-PROJECTION-001 with contributions from:

- Leonardo — Produto e requisitos;
- Laura — UX;
- Sofia — Arquitetura de Software;
- Emily — Auditoria Independente;
- MESTRE — orchestration and consolidation.

Emily's gate authorizes only the read-only prototype boundary, not production or mutation.
