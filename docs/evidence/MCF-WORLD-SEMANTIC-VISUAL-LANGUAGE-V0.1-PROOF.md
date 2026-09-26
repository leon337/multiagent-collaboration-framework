# MCF World Semantic Visual Language v0.1 — Proof

Mission: MCF-WORLD-PROJECTION-001
Source of hypothesis: Human Findability R + immediate qualitative feedback

## Independent fixture

A new representative Fixture S is used:

    apps/mcf-world-projection/semantic-visual-fixture-s.json

It is distinct from the frozen/completed Findability R fixture.

Fixture S:

- mission: NOVA-AUDIT-031;
- project: Project Nova;
- agents: Bruna, Diego, Helena, Rafael;
- artifact: Control Matrix v3;
- gate: Approval Gate;
- observed provider artifact: Build #1142;
- UNKNOWN evidence: Signature receipt;
- STALE object: Runtime snapshot.

## Prototype

    apps/mcf-world-projection/semantic-visual-world.html

The prototype introduces only semantic visual encoding and minimal onboarding/legend.

It preserves the four existing surfaces, existing entity/relation/event model shape, read-only behavior and explicit representative-fixture boundary.

## Static verification

    SEMANTIC_VISUAL_V01_STATIC PASS

Verified:

- Fixture S identity is distinct from Findability R;
- original Fixture R remains R / ORION-TRACE-021;
- five semantic token families exist: FRESH, STALE, UNKNOWN, BLOCKED and CURRENT/FOCUS;
- object-type icons/labels exist;
- Cockpit, Timeline and Graph use the shared semantic helper;
- text/icon redundancy exists;
- no localStorage, WebSocket, XMLHttpRequest, POST, PUT or PATCH;
- only one fetch exists, for the local static Fixture S.

## Browser smoke

    SEMANTIC_VISUAL_V01_BROWSER_SMOKE PASS

Observed computed border/outline colors:

- FRESH: rgb(88, 204, 123)
- UNKNOWN: rgb(184, 146, 255)
- STALE: rgb(242, 184, 79)
- SELECTED/FOCUS: rgb(95, 202, 255)

All four were distinct.

Browser checks passed:

- Cockpit rendered FRESH, UNKNOWN, STALE and BLOCKED semantics;
- object-type tags rendered;
- Timeline retained explicit type + freshness semantics;
- Graph retained the same freshness classes;
- exactly one UNKNOWN node and one STALE node matched Fixture S;
- Graph rendered all 12 entity type tags;
- selected node had separate focus treatment;
- semantic color did not replace explicit text/icon labels.

## Findability R isolation

A Git diff from the audited Findability R SHA to current HEAD showed no changes to findability-test.html, findability-world.html or findability-fixture-r.json.

The prior human evidence remains frozen.

## Claims boundary

This proves implementation consistency of the visual language.

It does not prove improved human performance, reduced completion time, reduced cognitive load, accessibility for all users, superiority over the prior UI or Product GO.

Those require later human evaluation.
