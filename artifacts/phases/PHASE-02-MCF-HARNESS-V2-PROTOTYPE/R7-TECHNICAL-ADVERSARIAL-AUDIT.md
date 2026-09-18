# R7 — Technical Adversarial Audit

Mission: `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`
Status: `PASS_TECHNICAL / COGNITIVE_PENDING`

## Purpose

Reject false green and unauditable results before a mission gate. This implementation is deterministic and declares `cognitive=false`.

## Adversarial coverage

The suite proves rejection of:
1. PASS claim with a failed observed check;
2. missing execution receipt;
3. evidence hash mismatch/forgery;
4. mailbox target poisoning;
5. child capability widening;
6. stale/expired task lease;
7. non-terminal executor state without recovery checkpoint;
8. result without complete provenance/evidence references;
9. invalid/cyclic DAG.

A valid packet is accepted.

## Real audit receipt

A separate local audit of the current prototype returned:
- verdict: `PASS`;
- failed findings: 0;
- receipt SHA-256: `2ea745dbc4e36b3c16a83996487db8cab30c3c38891ee5d798a2b97b4c491286`.

Local suite after R7: **39/39 PASS**.

## History

Canonical local event chain after the R7 receipt:
- events: **13**
- head: `505b7519a37306d2fa61d875957cd02e7e220fe2c4273436c99dc6e4d88d3950`

## Boundary

This does not satisfy L02. A cognitive independent auditor remains blocked on G08 because no independent bubble-native cognitive LLM backend is verified.
