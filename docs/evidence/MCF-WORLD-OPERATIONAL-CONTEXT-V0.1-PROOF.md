# MCF World Operational Context v0.1 — Proof

Mission: MCF-WORLD-PROJECTION-001
Boundary: architecture/product-supporting read-only projection
Findability R: untouched and deferred

## Purpose

Build a richer ContextSlice for a real mission without turning the World into a catalog of repository objects.

The adapter enriches the already-gated real-source bundle with only information needed for operational orientation and evidence reachability.

## Inputs

- real-source bundle generated from:
  - mission record;
  - project registry;
  - captured GitHub Issue/PR observation;
  - captured local Git observation;
- current canonical mission metadata;
- selected local gate evidence files referenced by the mission record.

No network call occurs inside the operational adapter.

## Inclusion scope

Deep operational materialization remains narrow:

- active Context projected from current_phase;
- Findability R experiment boundary as a Constraint;
- architecture next action;
- five architecture gate decisions:
  - World Model Contract;
  - World Model Adapter;
  - Context Consumer v0.2;
  - Full Pipeline v0.1;
  - Real-Source Integration v0.1;
- the exact evidence files supporting those gate decisions.

The adapter does not enumerate all chats/files/commits/messages in the repository.

## Generated result

Nominal execution:

- 15 ContextEntries;
- 16 ProjectedObjects;
- 6 typed relations;
- 8 relevant evidence refs in AgentContextPacket;
- 8 independent revision-vector entries;
- 0 diagnostics.

Active context:

    mcf://mission/MCF-WORLD-PROJECTION-001#phase/PRODUCT_VALUE_EVIDENCE

Human Findability R remains:

    NOT_STARTED_DEFERRED

## Evidence reachability

Every selected architecture gate decision has:

    Decision
      -> supported_by
      -> Evidence

Evidence objects carry:

- repo-file canonicalRef;
- byte-level SHA-256 revision;
- freshness/trust;
- sourceRef;
- audited SHA summary where recorded.

The human consumer now renders supported_by evidence directly on the decision card, including evidence canonicalRef, revision and relation/source provenance.

MESTRE receives the same evidence objects as relevantEvidence refs.

## Missing-evidence negative case

A copied mission input was changed to reference a non-existent real-source gate document.

Observed:

- no fallback to another gate document;
- missing evidence becomes UNKNOWN;
- MISSING_CANONICAL_VALUE diagnostic is emitted;
- evidence ref enters ContextSlice unknownRefs;
- the same ref enters AgentContextPacket attention.unknownRefs.

## Mixed revisions

Gate evidence files retain their independent content digests.

The test requires multiple distinct repo-file revisions in the same ContextSlice and does not collapse them into one fake canonical revision.

## Determinism

Two operational builds from identical:

- base bundle;
- mission record;
- repository evidence files

are structurally equal.

## Regression

PASS:

- Context Consumer v0.2 semantic consistency;
- Full Pipeline v0.1;
- Real-Source Adapter v0.1;
- Operational Context v0.1.

## Schema

Ajv validates:

- ContextSlice;
- AgentContextPacket;
- all 16 ProjectedObjects.

## Browser smoke

PASS:

- active context visibly rendered;
- PRODUCT_VALUE_EVIDENCE rendered as active context;
- architecture-state purpose rendered;
- Findability R boundary rendered;
- five selected PASS gates rendered;
- supported_by evidence paths rendered for gates;
- no nominal diagnostics;
- MESTRE packet contains decisions, nextActions, relevantEvidence, attention and active context.

## Boundary

No:

- service;
- database;
- event store;
- write-back;
- mutation;
- authority engine;
- polling;
- background sync;
- production effect;
- 3D dependency.

The operational output is disposable and reconstructible.

## Gate remediation after SHA 659135a2

Sofia and Emily identified two semantic issues in the first gate pass:

1. a missing/UNKNOWN gate evidence target still received a supported_by relation;
2. an observed/digested gate-review file was classified as CANONICAL_SOURCE.

Remediation:

- gate-review Evidence objects are now PROJECTION_DERIVED, with an explicit reason that file existence/digest proves observed bytes and reachability, not independent canonical truth;
- supported_by relations are created only when the evidence target is materially observed (freshness != UNKNOWN);
- supported_by relation trust is PROJECTION_DERIVED;
- missing evidence remains:
  - Evidence UNKNOWN;
  - MISSING_CANONICAL_VALUE;
  - ContextSlice.unknownRefs;
  - AgentContextPacket.attention.unknownRefs;
  - AgentContextPacket.relevantEvidence;
  - no supported_by assertion.

Regression results after remediation:

    OPERATIONAL_CONTEXT_V01 PASS
    CONTEXT_CONSUMER_V02_CONSISTENCY PASS
    FULL_PIPELINE_V01 PASS
    REAL_SOURCE_ADAPTER_V01 PASS
    ADAPTER SCHEMA PASS for ContextSlice, AgentContextPacket and all 16 ProjectedObjects

Nominal current output:

- 15 ContextEntries;
- 16 ProjectedObjects;
- 6 relations;
- 8 relevant evidence refs;
- 8 revision-vector entries;
- 0 diagnostics;
- all repo-file gate-review objects: PROJECTION_DERIVED;
- all supported_by relations: PROJECTION_DERIVED.
