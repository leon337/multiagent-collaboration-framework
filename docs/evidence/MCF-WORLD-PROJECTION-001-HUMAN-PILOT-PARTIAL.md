# MCF-WORLD-PROJECTION-001 — Human Pilot Partial Evidence

Status: PARTIAL_VERIFIED
Sequence under analysis: B(Y) -> A(Z) salvage
Product GO: not authorized

## Verified human run B(Y)

Evidence file: docs/evidence/MCF-WORLD-PROJECTION-001-HUMAN-PILOT-B-Y.json

Observed:

- condition: structured
- fixture: Y
- correct: 5 / 8
- accuracy: 0.625
- total task time: 296717 ms
- startedAt: 2026-09-26T07:21:43.444Z
- finishedAt: 2026-09-26T07:26:40.168Z
- wrong tasks: 1, 6, 7

Wrong answers observed:

- task 1 current state: answered WORKING; expected BLOCKED;
- task 6 UNKNOWN evidence: answered Recovery Map v0.2; expected Provider confirmation;
- task 7 STALE item: answered Review Gate; expected Dependency snapshot.

## Missing earlier A(X)

Any earlier A(X) run is MISSING / UNVERIFIABLE because the original harness retained only the latest run in page memory.

No A(X) result is reconstructed or inferred.

## Independent audit

Emily returned SALVAGE_PASS:

- preserve B(Y);
- create a fresh, isomorphic, factually new Fixture Z;
- execute only baseline A(Z);
- freeze Z before execution;
- do not calibrate Z using the B(Y) errors or time;
- analyze B(Y) vs A(Z) only descriptively/exploratorily;
- retain residual fixture/order/practice confounds;
- do not claim interface causality or Product GO.
