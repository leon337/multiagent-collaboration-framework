# MCF World Projection v0.1

Read-only prototype for `MCF-WORLD-PROJECTION-001`.

## Run

```bash
python3 -m http.server 4173 --directory apps/mcf-world-projection
```

Open `http://127.0.0.1:4173/`.

## Verify

```bash
python3 apps/mcf-world-projection/verify.py
```

The prototype deliberately contains no write path, Dual Browser command, 3D dependency, graph database or new event store.

Views:

- Baseline — linear list/search using the same dataset;
- Cockpit — current operational orientation;
- Timeline — causal/temporal reconstruction;
- Graph — typed relations only;
- Inspector — canonical ref, trust, freshness and relations.

The fixture is explicitly representative and does not claim live telemetry.

## Semantic limits

fixture.json is a MATERIALIZED_PROJECTION_FIXTURE for the UX experiment. It is not a WPP persistence schema, source adapter, domain adapter, canonical event stream, or live telemetry contract. Timeline order follows fixture seq only and does not claim causation.

The verifier performs bounded static checks; it is not a general proof that arbitrary future code can never cause an external effect.

## Context-recovery experiment harness

experiment.html runs the A/B task harness over the same local representative fixture.

- Condition A: linear presentation.
- Condition B: structured Cockpit + Timeline + focused relations.
- Eight identical objective questions.
- Per-task elapsed time and accuracy remain only in page memory.
- The result JSON is displayed for evidence capture; it is not persisted or submitted automatically.
- This harness is read-only and is not itself a human-study result.

### Single-participant carryover control

For the initial LEANDRO pilot, the harness now uses two isomorphic but factually distinct representative fixtures:

- Condition A uses experiment-fixture-x.json.
- Condition B uses experiment-fixture-y.json.

The question sets are parallel but require different factual answers. This reduces direct answer memorization between rounds. The pilot remains exploratory and cannot establish population-level superiority.

## Structured UX v0.2

The v0.2 iteration responds directly to the human pilot evidence.

Changes:

- Cockpit is now the default Agora surface.
- Current mission state is the primary visual object.
- Current gate / next decision is separated from mission history.
- UNKNOWN is phrased as O que ainda nao sabemos.
- STALE is phrased as O que pode ter mudado.
- UNKNOWN and STALE have distinct visual semantics and plain-language explanations.
- Timeline is explicitly historical.
- Graph is explicitly relational, not a source for current state.
- Linear list is demoted to search/reference.
- Detail/provenance remains available in the inspector on demand.

A focused comprehension harness is available at comprehension-test.html. It tests only current state, UNKNOWN and STALE and persists the latest result in browser localStorage so a completed run is not lost on page refresh.
