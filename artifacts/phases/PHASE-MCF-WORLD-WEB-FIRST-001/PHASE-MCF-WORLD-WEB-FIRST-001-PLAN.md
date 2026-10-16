# PHASE-MCF-WORLD-WEB-FIRST-001 — Plan

## Mission
MCF-WORLD-WEB-FIRST-2026-09-23 / Issue #324

## Objective
Materialize a provider-neutral hosted MCF World MVP that runs in modern browsers on Windows 10 and Linux, without overwriting or fabricating the offline Electron Task 6 workspace.

## Scope
- standalone app at `apps/mcf-world-web/`;
- pure World domain functions;
- Three.js browser scene;
- Browser Surface for HTTP(S) Locals;
- dependency-free local HTTP server;
- Ubuntu + Windows CI;
- documentation, validation and PR preparation.

## Out of scope
- production deployment;
- provider lock-in;
- multiplayer/accounts;
- backend persistence;
- destructive rewrite of legacy Electron work;
- Electron reconciliation while host is offline.

## Acceptance criteria
1. HTTP(S)-only URL normalization and safe external navigation.
2. PET movement does not gain diagonal speed.
3. Local creation rejects zero-length forward vectors.
4. 3D world remains instantiated while Browser Surface opens/closes.
5. WebGL initialization exposes a readable failure state.
6. Portable static server passes HTTP and path traversal tests.
7. Same test suite passes on Ubuntu and Windows.
8. PR is reviewable and no production deploy occurs.
9. Offline Electron lineage remains explicitly blocked, not guessed.

## Authority
LEANDRO authorized continuous reversible execution for planning, code, tests, branch and PR preparation. Production deployment and unrelated irreversible external actions remain excluded.

## Selected roles
- MESTRE: orchestration
- Leonardo: product boundary
- Sofia: architecture
- Helena: frontend/web implementation
- Renato: tests and validation
- Ricardo: security review
- Bruno: CI/hosting boundary
- Carmem: PRF consistency
- Augusto: execution trace
- Miriam: continuity/lineage
- Gabriel: Git/PR traceability
- Emily: audit role
- Leo: internal gate

## Risk class
B

## Source of truth
1. Current LEANDRO instruction.
2. Live GitHub state.
3. Current MCF protocol/docs on main.
4. This phase evidence.
5. Historical/offline context only as a deferred evidence source.
