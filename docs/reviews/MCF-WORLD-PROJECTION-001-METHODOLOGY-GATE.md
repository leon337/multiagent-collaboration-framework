# MCF-WORLD-PROJECTION-001 — Methodology Gate

Draft PR: #380
Audited SHA: 56e20cb38951213814b8ca804a89c9e176d732a1
Gate: METHODOLOGY_PASS
Boundary: exploratory single-participant read-only pilot

## Prior blocker

The prior design used the same participant, same fixture and same factual answers in both conditions. That created a direct carryover/practice effect and was methodologically blocked.

## Remediation

The audited SHA now uses:

- Condition A → Experiment Fixture X.
- Condition B → isomorphic Experiment Fixture Y.
- 12 entities in each fixture.
- 11 typed relations in each fixture.
- 6 temporal fixture events in each fixture.
- equivalent gate / observed-artifact / UNKNOWN / STALE structure.
- factually distinct labels, states and expected answers.
- parallel question sets with different factual answers.
- fixtureId captured in the experiment result.
- per-task elapsedMs and correctness.
- frozen fixtures and answer keys before human execution.

## Emily re-gate

Critical: none.
High: none.
Medium blockers: none.

Emily confirmed that direct answer memorization between conditions has been removed for the initial pilot and that the implementation supports an exploratory A(X) versus B(Y) run with LEANDRO.

## Remaining methodological limitation

A(X) versus B(Y) does not isolate interface effect from fixture effect or A→B order effect.

Therefore the permitted result language is observational:

- LEANDRO observed time/accuracy in A(X).
- LEANDRO observed time/accuracy in B(Y).

The pilot must not claim that B is generally faster or better.

A confirmatory study requires counterbalancing across participants or fresh matched fixture pairs.

## Authority boundary

METHODOLOGY_PASS authorizes only execution and limited analysis of the read-only human pilot.

It does not authorize:

- Product GO.
- merge;
- production;
- mutation;
- active World-driven Dual Browser effects;
- 3D;
- generalized performance claims.
