# MCF-WORLD-PROJECTION-001 — Prototype Smoke Evidence

**Boundary:** read-only vertical prototype
**Production:** not authorized
**Execution host:** authorized local notebook
**Date:** 2026-09-25

## Static invariant verifier

Command: python3 apps/mcf-world-projection/verify.py

Observed result:

    PASS unique entity ids
    PASS all entities have canonicalRef
    PASS freshness enum
    PASS fixture covers UNKNOWN
    PASS fixture covers STALE
    PASS relations resolve
    PASS events resolve
    PASS deterministic fixture serialization round-trip
    PASS bounded static check: no enumerated write fetch
    PASS bounded static check: no enumerated Dual Browser mutation route
    PASS no 3D dependency
    entities=12 relations=11 events=6

## HTTP smoke

Local server used port 4173 bound to 127.0.0.1.

Observed:

- HTML title resolved as MCF World Projection v0.1;
- fixture resolved as MCF-WORLD-PROJECTION-001;
- 12 entities;
- 11 typed relations;
- 6 temporally ordered fixture events; no causality claim.

## Real browser smoke

A clean headless Google Chrome target loaded the prototype and exercised the UI.

Observed:

    title MCF World Projection v0.1
    tabs ['Baseline', 'Cockpit', 'Timeline', 'Grafo']
    initial_selected mission:world
    view timeline current Timeline selected mission:world
    view graph current Grafo selected mission:world
    view baseline current Baseline selected mission:world
    view cockpit current Cockpit selected mission:world
    selection_persists agent:sofia
    BROWSER_SMOKE PASS

This validates cross-view selection persistence within one browser session. It does not prove deep-link/reload restoration or semantic convergence of every field.

## Responsive smoke

Chromium device metrics were tested at 390×844 and 1365×768.

Observed:

    390 {'w': 390, 'sw': 390, 'h': 844, 'sh': 1896}
    1365 {'w': 1365, 'sw': 1350, 'h': 768, 'sh': 1165}
    RESPONSIVE_SMOKE PASS

No horizontal overflow was observed in either tested viewport.

## Claims boundary

The fixture is explicitly marked REPRESENTATIVE_FIXTURE. It does not claim live runtime telemetry.

The prototype contains:

- the audited source exposes fixture loading and local UI interaction only; the static verifier detects the currently enumerated mutation patterns but is not a general proof of absence of all possible external effects;
- no active Dual Browser command;
- no production action;
- no 3D dependency;
- no graph database;
- no second event store;
- no bidirectional synchronization.

## Remaining gate

This evidence proves implementation mechanics for the representative read-only fixture boundary. The JSON round-trip is not a WPP rebuild proof; canonical-source-to-read-model reconstruction remains UNKNOWN/PENDING. It does not yet prove product value versus the linear baseline. The A/B context-recovery experiment in docs/experiments/MCF-WORLD-PROJECTION-001-VERTICAL.md remains required before expanding World scope.

## Semantic corrections after independent review

- Timeline is temporal reconstruction only; fixture seq does not prove causality.
- Every relation is marked REPRESENTATIVE_FIXTURE with explicit fixture provenance.
- The Draft PR entity is an observed artifact, not a canonical receipt.
- fixture.json is a materialized projection fixture, not an implemented adapter layer or persistence/API schema.
- The global observedAt is labeled as fixture snapshot time, not per-entity or live observation.

## Browser network audit

A clean headless Chrome target enabled CDP Network observation before loading the prototype, then exercised Timeline, Graph, Baseline, Cockpit and entity selection.

Observed:

    methods [GET]
    http://127.0.0.1:4173/
    http://127.0.0.1:4173/favicon.ico
    http://127.0.0.1:4173/fixture.json
    NETWORK_AUDIT PASS requests=3

Within this audited interaction sequence, only local GET requests were observed. This is execution evidence for this smoke path, not a universal proof about arbitrary future code.
