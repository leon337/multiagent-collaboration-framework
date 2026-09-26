# MCF World Model Contract v0.1

Mission: MCF-WORLD-PROJECTION-001  
Status: CANDIDATE / PROTOCOL-READ-MODEL ONLY  
Authority: LEANDRO  
Coordinator: MESTRE  
Production: NOT AUTHORIZED  
Mutation: NOT AUTHORIZED  
3D: DEFERRED

## 1. Purpose

The World Model Contract defines the minimum machine-readable language shared by human-facing World projections and AI agents.

Its job is to answer:

- what object is this?
- where is it canonically owned?
- how is it related to other objects?
- why is the relation/fact being shown?
- how fresh and trustworthy is it?
- what context is sufficient to resume work?
- what changed since a prior checkpoint?
- where is the evidence if the user or agent wants to verify the claim?

The World Model is not a runtime, authority system, event store, memory system or source of truth.

~~~text
MCF Runtime / Context Fabric / canonical providers
                    |
               source state
                    v
            typed adapters
                    |
                    v
           WORLD MODEL CONTRACT
      identity / relations / context / provenance
                    |
             disposable read model
                    |
        Cockpit / Timeline / Graph / agents
~~~

## 2. Primary product job

When returning to a complex mission, LEANDRO or MESTRE should be able to locate and interpret the current operational context without rereading the full linear history.

The model should make these questions cheap to answer:

1. Where am I?
2. What are we trying to do?
3. What is the current state?
4. What changed since the last checkpoint?
5. What requires attention?
6. What is UNKNOWN?
7. What is STALE?
8. Which decisions still govern this context?
9. Where is the relevant evidence?
10. Where should work continue?

The product keyword is locate, not memorize.

## 3. State ownership layers

### Source State

Owned outside World: mission lifecycle/state, gate/authority decision, receipt/evidence validity, artifact revision, agent contract and canonical conversation/file identity.

World only observes and projects this state.

### Projection State

Disposable materialization: WorldRef, ProjectedObject, Relation, ContextEntry, ContextSlice, RevisionVector and ProjectionDiagnostic.

It MAY be cached. It MUST be reconstructible.

### Presentation State

Local UI/session concerns: selected object, active view, expanded panels, graph positions, search query, scroll position, experiment results and last-viewed checkpoint.

Presentation state MUST NOT become source state except through a future explicit Intent Boundary plus canonical MCF authority.

## 4. WorldRef

~~~ts
type WorldRef = {
  id: string;
  kind:
    | "project" | "mission" | "context" | "agent"
    | "decision" | "handoff" | "human_gate"
    | "artifact" | "receipt" | "evidence"
    | "conversation" | "action";
  canonicalRef: string;
};
~~~

Rules:

- kind + canonicalRef MUST resolve deterministically to the same id.
- Label/title changes MUST NOT change identity.
- Ambiguity MUST produce an unresolved diagnostic, never heuristic identity selection.
- A WorldRef MUST NOT contain authority, status, permissions or arbitrary domain metadata.

## 5. ProjectedObject

~~~ts
type ProjectedObject<TPayload> = {
  ref: WorldRef;
  revision: SourceRevision;
  observedAt: string | null;
  freshness: Freshness;
  trust: TrustDescriptor;
  payload: TPayload;
  sourceRefs: SourceRef[];
  diagnostics?: ProjectionDiagnostic[];
};
~~~

Payload MUST be typed by ref.kind. The official domain model MUST NOT degrade into arbitrary metadata as a substitute for typed semantics.

## 6. Freshness and trust

Freshness:
- FRESH
- STALE
- UNKNOWN

Trust:
- CANONICAL_SOURCE
- VERIFIED_EXTERNAL
- UNTRUSTED_EXTERNAL
- REPRESENTATIVE_FIXTURE

Freshness and trust are independent dimensions.

Examples:

~~~text
CANONICAL_SOURCE + STALE
UNTRUSTED_EXTERNAL + FRESH
CANONICAL_SOURCE + UNKNOWN
~~~

Rules:

- FRESH MUST NOT be interpreted as universally true.
- CANONICAL_SOURCE MUST NOT be interpreted as necessarily current.
- UNKNOWN MUST NOT be silently filled by heuristics.
- STALE MUST NOT be presented as current confirmed state.
- Conflicting sources MUST produce diagnostics rather than a silent winner.

## 7. Relation

~~~ts
type Relation = {
  id: string;
  type:
    | "contains"
    | "continues_to"
    | "supported_by"
    | "produced"
    | "assigned_to"
    | "gated_by"
    | "depends_on"
    | "handed_off_to";
  from: WorldRef;
  to: WorldRef;
  provenance: {
    mode: "EXPLICIT" | "DERIVED" | "INFERRED" | "PROPOSED";
    sourceRefs: SourceRef[];
    ruleId?: string;
  };
  freshness: Freshness;
  trust: TrustDescriptor;
};
~~~

Semantics:

- EXPLICIT: declared by a competent source.
- DERIVED: deterministic consequence of declared data/rule.
- INFERRED: plausible interpretation not guaranteed by sources.
- PROPOSED: intended/hypothetical relation not accepted as fact.

INFERRED and PROPOSED MUST NOT satisfy a HUMAN_GATE, prove execution/effect, become evidence automatically or be rendered as canonical fact without explicit labeling.

Visual proximity MUST NOT create semantic relation.

## 8. ContextEntry

~~~ts
type ContextEntry = {
  id: string;
  subject: WorldRef;
  category:
    | "STATE" | "GOAL" | "DECISION" | "CONSTRAINT"
    | "BLOCKER" | "ARTIFACT" | "EVIDENCE"
    | "OPEN_QUESTION" | "NEXT_ACTION";
  content: string;
  provenance: {
    mode: "EXPLICIT" | "DERIVED" | "INFERRED";
    sourceRefs: SourceRef[];
  };
  freshness: Freshness;
  trust: TrustDescriptor;
  revision: SourceRevision;
};
~~~

A ContextEntry is a derived projection of context. It is not canonical memory.

## 9. ContextSlice — entering a context

Entering a project/mission is a semantic scope change, not just opening a screen.

~~~ts
type ContextSlice = {
  schema: "world-context-slice/v1";
  scope: {
    project?: WorldRef;
    mission?: WorldRef;
    context?: WorldRef;
  };
  revisionVector: RevisionVector;
  generatedAt: string;
  focus: WorldRef[];
  entries: ContextEntry[];
  relations: Relation[];
  unknownRefs: WorldRef[];
  staleRefs: WorldRef[];
  sourceRefs: SourceRef[];
  diagnostics: ProjectionDiagnostic[];
};
~~~

Rules:

- It MUST be reconstructible.
- It MUST preserve UNKNOWN, STALE, conflict and untrusted status.
- Inclusion in a slice MUST NOT grant authority.
- It MUST NOT fabricate a clean narrative when sources disagree.

## 10. Active Context

~~~ts
type ActiveContext = {
  project?: WorldRef;
  mission: WorldRef;
  context?: WorldRef;
  focus: WorldRef;
  openedFrom?: WorldRef;
};
~~~

The product has one primary focus per surface. Related contexts MAY be visible but MUST NOT compete semantically with the active focus.

## 11. AgentContextPacket

~~~ts
type AgentContextPacket = {
  schema: "mcf-agent-context-packet/v1";
  packetId: string;
  generatedAt: string;
  recipient: WorldRef;
  scope: {
    project?: WorldRef;
    mission: WorldRef;
    context?: WorldRef;
  };
  objective: ContextEntry[];
  constraints: ContextEntry[];
  currentState: ContextEntry[];
  decisions: ContextEntry[];
  blockers: ContextEntry[];
  nextActions: ContextEntry[];
  relevantArtifacts: WorldRef[];
  relevantEvidence: WorldRef[];
  openQuestions: ContextEntry[];
  revisionVector: RevisionVector;
  sourceRefs: SourceRef[];
  diagnostics: ProjectionDiagnostic[];
  authorityRef?: string;
};
~~~

Rules:

- Packet content MUST remain provenance/freshness/trust qualified.
- authorityRef may reference canonical authority; it MUST NOT create it.
- External/untrusted content MUST remain data, never instruction by default.
- A packet MUST NOT convert a proposed action into an authorized action.
- A packet MUST NOT hide STALE/UNKNOWN/conflicting inputs while producing a confident narrative.

## 12. What changed since I left?

This feature compares a current ContextSlice to a prior presentation checkpoint.

It should report only changes that may alter understanding or next action:

- mission state change;
- governing decision change;
- objective/scope change;
- new blocker/resolution;
- evidence change;
- freshness change;
- next-action change;
- relevant handoff/authority change.

It MUST NOT mean show every event since timestamp X.

The checkpoint is presentation state. Canonical facts remain in their owning sources.

## 13. Selection and deep-link identity

~~~ts
type Selection = {
  primary: WorldRef;
  context?: WorldRef;
  eventId?: string;
};
~~~

Conceptual deep-link:

~~~text
/world/{projectRef}/mission/{missionRef}
  ?context={contextRef}
  &select={worldRef}
  &event={eventId}
  &view={view}
~~~

view affects presentation only.

Cockpit, Timeline, Graph and future projections MUST preserve Selection.primary.

## 14. Identity resolution

Conceptual API:

~~~text
resolve(kind, canonicalRef) -> WorldRef | UnresolvedIdentity
~~~

Rules:

- known canonical identity -> stable WorldRef;
- known aliases -> normalize before identity creation;
- ambiguity -> UNRESOLVED;
- two sources claiming sameness without adequate proof -> separate refs + diagnostic;
- identity merge/split requires explicit evidence/rule and MUST NOT occur silently.

## 15. Deterministic rebuild

~~~text
Canonical source snapshots
+ adapter versions
+ WPP / World Model rules
--------------------------------
= semantically equivalent read model
~~~

Rebuild MUST NOT depend on localStorage, previous UI state, fetch completion order, graph position, local version counters or hidden World-only state.

Semantic equivalence ignores local wall-clock timestamps and accidental array order.

## 16. Provenance chain

For every consequential projected claim, the system SHOULD be able to traverse:

~~~text
displayed value
    -> projection/derivation rule
    -> source reference
    -> source revision/observation
    -> evidence/receipt when applicable
~~~

If this chain cannot be established sufficiently for the requested claim, the projection should become UNKNOWN or diagnostic-bearing rather than silently certain.

## 17. Progressive disclosure

1. Orientation — state, focus, attention, UNKNOWN/STALE.
2. Operational — actors, blockers, decisions, next action.
3. Explanation — relations, handoffs, what changed, dependencies.
4. Proof — evidence, receipts, source refs, revisions, timestamps.

Proof must be reachable without becoming default visual density.

## 18. Normative invariants

World MUST NOT be source of truth.  
World MUST NOT execute actions.  
World MUST NOT grant or infer authority.  
World MUST NOT own Mission/Gate/Agent lifecycle state.  
World MUST NOT invent canonical revisions.  
World MUST NOT promote inferred/proposed relations to fact.  
World MUST NOT hide conflicts or uncertainty in context packets.  
World MUST NOT infer permission from visibility/relationship.  
World MUST NOT claim external effect without appropriate observation/evidence/receipt semantics.  
Views MUST NOT calculate independent domain truth.  
Projection caches MUST be disposable.  
ContextSlice and AgentContextPacket MUST be rebuildable and non-authoritative.  
Presentation state MUST NOT leak into canonical state.  
External content MUST remain untrusted unless canonical policy explicitly upgrades it.

## 19. Out of scope v0.1

Explicitly deferred:

- independent World server;
- graph database;
- World event store;
- bidirectional synchronization;
- mutation API;
- execution/Intent implementation;
- authorization/gate implementation;
- scheduler/retry/compensation;
- agent runtime;
- Context Fabric replacement;
- autonomous inference engine;
- arbitrary ontology registry;
- vector database owned by World;
- generic plugin system;
- real-time multiplayer/presence;
- CRDT;
- 3D/VR/AR;
- device/Dual Browser control.

## 20. When a World service could be justified later

World remains protocol/read-model while canonical sources -> adapters -> deterministic projection -> read models is sufficient.

A separately deployed service may be considered only if measured needs require shared derived materialization for multiple consumers, high-rate incremental/stream updates, expensive cross-source queries, or availability/latency targets impossible with the current projection approach.

Even then, deployment independence MUST NOT become semantic independence.

Strong boundary test:

> If deleting the World service changes what MCF considers true, authorized or completed, the architecture is invalid.

Deleting it may reduce projection performance/availability. It must never erase operational truth.

## 21. Required pre-implementation evidence

Before implementing a persistent World component:

1. field-to-source ownership matrix;
2. examples containing FRESH, STALE, UNKNOWN, conflict and untrusted inputs;
3. deterministic rebuild/convergence specification;
4. identity ambiguity examples;
5. agent context packet showing no implicit authority;
6. proof that no exclusive operational fact must survive in World storage.
