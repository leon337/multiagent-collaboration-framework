# MCF World Context Consumer v0.1 — Proof

Mission: MCF-WORLD-PROJECTION-001
Boundary: read-only / generated static consumer
Backend: none
Canonical mutation: none

## Purpose

Demonstrate that the same adapter bundle can feed:

1. a human orientation surface;
2. the machine-readable AgentContextPacket for MESTRE.

No view recalculates canonical truth independently.

## Input

The consumer is generated from the adapter v0.1 bundle:

    canonical mission state
      -> adapter v0.1
      -> ContextSlice + AgentContextPacket
      -> static consumer

## Human representation

The generated human view exposes:

- mission current state;
- active mission scope;
- objective;
- constraints;
- governing projected decisions;
- next points/actions;
- open questions;
- evidence/artifact references;
- provenance/source references on demand.

## Agent representation

The second view renders the exact AgentContextPacket generated from the same adapter bundle.

It includes:
- recipient;
- authorityRef reference;
- objective;
- constraints;
- current state;
- decisions;
- blockers;
- next actions;
- artifact/evidence refs;
- open questions;
- revision vector;
- source refs;
- diagnostics.

The packet does not grant authority.

## Static test

PASS:
- same mission canonicalRef is present in the human page;
- MESTRE recipient canonicalRef is present;
- authorityRef is present only as a reference;
- no fetch(), XMLHttpRequest, WebSocket or localStorage dependency;
- generated page is self-contained.

## Browser smoke

Headless Chrome loaded the generated static file.

PASS:
- human view rendered;
- current mission state rendered;
- MESTRE tab switched successfully;
- AgentContextPacket schema was visible in the machine-readable view.

## Boundary

The consumer has no:
- backend;
- server requirement;
- database;
- event store;
- write-back;
- MCF mutation;
- authority evaluation;
- Dual Browser actuation;
- 3D dependency.

Deleting the generated HTML loses only a view. It does not lose mission truth.
