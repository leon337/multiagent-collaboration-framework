# MCF World Context Consumer v0.2 — Semantic Consistency Proof

Mission: MCF-WORLD-PROJECTION-001
Track: architecture-only / read-only
Human Findability R: untouched and still deferred
Fixture: MCF-WORLD-CONSISTENCY-FIXTURE-v0.1.json

## Purpose

Prove that human and MESTRE representations preserve the same uncertainty, trust and diagnostics from one shared bundle.

The test deliberately uses a separate architecture fixture containing:

- one FRESH mission state;
- one UNKNOWN evidence item;
- one STALE evidence item;
- one UNTRUSTED_EXTERNAL claim;
- one SOURCE_CONFLICT diagnostic;
- one UNTRUSTED_INPUT diagnostic;
- one PROJECTION_DERIVED next action.

This fixture is not Findability R and contains none of its tasks or answer keys.

## Consumer v0.2 changes

The human representation now exposes per-entry:

- ContextEntry identity;
- subject canonicalRef;
- freshness;
- trust class;
- trust reason when present;
- provenance mode;
- derivation ruleId when present;
- source revision;
- sourceRefs.

It also exposes:

- UNKNOWN refs;
- STALE refs;
- projection diagnostics;
- global ContextSlice sources.

The MESTRE representation continues to show the exact AgentContextPacket from the same bundle.

## Executed semantic consistency tests

PASS:

- every packet entry is byte/structure-equal to the corresponding ContextSlice entry by ID;
- packet diagnostics equal ContextSlice diagnostics;
- UNKNOWN evidence remains reachable from AgentContextPacket relevantEvidence;
- STALE evidence remains reachable from AgentContextPacket relevantEvidence;
- human view does not omit projected STATE/GOAL/CONSTRAINT/DECISION/BLOCKER/EVIDENCE/NEXT_ACTION/OPEN_QUESTION entries;
- every human ContextEntry exposes freshness and trust;
- every human ContextEntry exposes sourceRefs via provenance;
- SOURCE_CONFLICT is visible in the human representation;
- UNTRUSTED_EXTERNAL is visible in the human representation;
- UNKNOWN and STALE refs are visible explicitly;
- AgentContextPacket still contains SOURCE_CONFLICT and UNTRUSTED_EXTERNAL.

## Contract/schema validation

The architecture consistency fixture's:

- ContextSlice;
- AgentContextPacket;
- ProjectedObject

all pass the World Model Contract JSON Schema through Ajv.

## Browser smoke

Headless Chrome PASS:

- BLOCKED state rendered;
- UNKNOWN rendered;
- STALE rendered;
- UNTRUSTED_EXTERNAL rendered;
- SOURCE_CONFLICT rendered;
- per-entry “Por que estou vendo isso?” affordance rendered;
- at least six entry identities rendered;
- both diagnostics rendered;
- reference identities rendered;
- switching to MESTRE view preserves UNTRUSTED_EXTERNAL and SOURCE_CONFLICT.

## Boundary

No backend, database, write-back, mutation, authority engine, Dual Browser action or 3D dependency was introduced.

The fixture and consumer belong to the architecture track only.
