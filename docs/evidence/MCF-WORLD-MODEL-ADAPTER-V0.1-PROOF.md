# MCF World Model Adapter v0.1 — Execution Proof

Mission: MCF-WORLD-PROJECTION-001  
Boundary: ephemeral / read-only  
Persistent World service: none  
World database: none  
Mutation: none

## Real canonical input

Input source:

- context/missions/mcf-world-projection-001.json
- Git source revision used by proof: 3dd2bc1c25f70612c4dc3963dcd4480d84b3389e

The adapter reads the mission source and Git revision. It does not update either source.

## Generated projection

The proof generated:

- 2 ProjectedObjects:
  - mission
  - context
- 9 ContextEntries
- 2 typed relations
- 1 ContextSlice
- 1 AgentContextPacket for MESTRE
- 2 relevant artifact refs
- 3 relevant evidence refs

The AgentContextPacket references LEANDRO authority through authorityRef. It does not create or grant authority.

## Deterministic rebuild

Two independent temporary output directories were generated with identical:

- mission input;
- source revision;
- adapter code;
- fixed generatedAt value.

Result:

    REBUILD_V01 PASS

Semantic SHA-256 digest:

    b69d1f6406e3dbabad8a0b56e7ccb973aa41c17f2d3c737d73b4744b10f238c9

The two normalized bundles were byte-equivalent after deterministic JSON serialization.

## Executed negative cases

PASS:

- missing current_state -> mission projection and STATE ContextEntry remain UNKNOWN;
- no guessed current state is inserted;
- STALE input remains STALE;
- UNTRUSTED_EXTERNAL input remains untrusted and gains no authority;
- conflicting source facts -> value unresolved + SOURCE_CONFLICT diagnostic;
- INFERRED relation + CANONICAL_SOURCE trust -> rejected;
- repeated canonical identity -> same WorldRef;
- no sqlite/db storage created by the adapter.

## Schema enforcement

Ajv 8 validated the actual generated:

- ContextSlice;
- AgentContextPacket;
- mission ProjectedObject;
- context ProjectedObject.

Result:

    ADAPTER SCHEMA PASS

## Architectural boundary

The implementation is a command-line/pure-function adapter.

It has:

- no daemon;
- no listening socket;
- no database;
- no event store;
- no background synchronization;
- no MCF mutation;
- no authority engine;
- no Dual Browser actuation;
- no 3D dependency.

Deleting every adapter output leaves canonical mission truth unchanged.
