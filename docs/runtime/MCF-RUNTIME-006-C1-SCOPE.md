# MCF-RUNTIME-006-C1 — Controlled GitHub branch/PR write

Issue: #75

This increment implements the first Gate C reversible external write capability.

## Allowed

- verify canonical repository, base branch/base SHA, and exact head SHA;
- create a new non-protected branch at the exact head SHA;
- reconcile an already-created compatible branch;
- create a pull request from the controlled branch to the expected base;
- reconcile an already-created compatible pull request using the signed MCF idempotency marker;
- re-read provider state before emitting trusted evidence.

## Forbidden

- merge;
- force push;
- direct write to `main`/`master`;
- delete human branches;
- modify branch protections;
- comments/reviews/PR metadata mutations outside initial PR creation;
- deploy or production operations.

## Test boundary

No real GitHub write is authorized by this implementation PR. Adapter mutation paths are exercised only with mocked/local provider responses until a later explicit controlled-write gate.
