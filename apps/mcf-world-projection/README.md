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
