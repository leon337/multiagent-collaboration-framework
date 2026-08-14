# PLAN

## Mission
`MCF-DOCUMENTATION-RECONCILIATION-001`

## Objective
Reconcile MCF documentation with the verified repository state while changing documentation only.

## Pre-integration planning baseline

`main@7f741e10d0e745a90c732e084400b11e3f5e6794`

This SHA is the planning/audit baseline for the documentation diff and the immutable RC3/stable identity. It is **not** a durable assertion about the future/current `main` head after integration. Current branch, GitHub metadata and provider state must be read live.

## Scope
Root docs, documentation index, runtime, governance, protocols, agents, releases, readiness, skills, audits, experiments, PRFs and discovery classification.

## Acceptance
1. Current state and runtime location are explicit.
2. Historical statements are not presented as current.
3. Immutable release identity is separated from mutable GitHub/provider state.
4. Discovery remains distinct from implementation.
5. Experiment limitations remain explicit.
6. Documentation validation, Foundation and Production Readiness pass on the exact final HEAD.
7. Stale/mutable-state scan covers branch/deploy SHA, `latest`, Issue/PR state and mutable Release metadata.
8. Independent review covers the exact final HEAD.
9. PR #134 remains DRAFT/OPEN/UNMERGED until later MESTRE governance decision.
