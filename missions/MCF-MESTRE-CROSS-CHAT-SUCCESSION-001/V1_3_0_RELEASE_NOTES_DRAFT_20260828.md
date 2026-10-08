# MCF v1.3.0 — Authenticated Human Control + Governed Succession

**Status:** OFFICIAL RELEASE CANDIDATE — PREPARED, NOT PUBLISHED  
**Preparation date:** 2026-08-28  
**Authority:** LEANDRO  
**Candidate SHA:** `2a264b283d976bd1b392052fa928d076debfc7fb`  
**Candidate tree:** `3e52ad4e39486c76743d39310de2afcacfc7c6d5`  
**Previous stable:** `v1.2.0@5c7f9832f037f374ec3fe2d4160342a5f2cf8a06`

## Release intent

v1.3.0 consolidates backward-compatible additions and security hardening landed after v1.2.0. The release candidate focuses on authenticated human authority, governed cross-chat/window succession, machine-verifiable GUI/window evidence, and wiring the standalone `HUMANO NO CONTROLE` command into the authenticated chat-to-runtime dispatch boundary.

This candidate does **not** claim universal persistent pause/resume for already-running missions and does **not** claim that NextGen planning documents represent implemented NextGen runtime capability.

## Implemented changes included

### 1. Governed cross-chat succession and window control

- normative cross-chat succession protocol merged into `main`;
- predecessor surface preservation and explicit successor-window identity are formalized;
- `SUCCESSOR_SESSION_CREATED != SUCCESSOR_WINDOW_CREATED` is preserved as an explicit invariant;
- monitor-aware placement and truthful input-mechanism reporting are required;
- machine-readable `mcf_gui_window_succession_trace/v1` schema, fixtures and qualification checks were added;
- post-merge consistency checks protect the protocol wording and evidence contract.

### 2. Authenticated human authority provenance

- reserved human authority is bound to the configured authenticated account ID;
- caller-shaped `decidedBy`, account IDs and source references are not trusted as authority proof;
- terminal human-gate provenance is canonicalized from the authenticated session;
- production authorization consumes a typed `HumanAuthorityProof` bound to the configured reserved account;
- missing or mismatched reserved-account provenance fails closed.

### 3. `HUMANO NO CONTROLE` runtime/chat wiring

- the guarded chat controller forwards `request.authenticatedHuman.accountId` separately from caller body provenance;
- `ChatRuntimeBridgeService` receives the configured reserved-human account ID;
- the standalone control command is intercepted **before** planner/bootstrap, `createMission` or `executePhase`;
- for the reserved authenticated account, the result is a `HUMAN_CONTROL` gate with `executionPaused=true`, `nextAction=HUMAN_GATE` and explicit-human-resume required;
- a different authenticated account sending the same phrase does not acquire the reserved human-control gate.

Boundary statement: this remediation is verified for the authenticated chat-to-runtime dispatch boundary. It is not a universal persistent pause/resume API for already-running missions.

### 4. Documentation and current-state reconciliation

- current-state/protocol documentation was reconciled with the released v1.2.0 lineage and subsequent runtime/security changes;
- NextGen roadmap, architecture and implementation planning artifacts are included as **planning** only;
- those planning artifacts do not activate providers, VPS execution, NextGen runtime, production mutation or paid AI fallback.

## Qualification evidence for the exact candidate SHA

Fresh post-merge workflows were dispatched against exactly `2a264b283d976bd1b392052fa928d076debfc7fb`:

- MCF v1.1 Qualification — run `33192330234` — SUCCESS;
- MCF Production Readiness — run `33192332452` — SUCCESS;
- Rede Social Foundation — run `33192334548` — SUCCESS;
- Rede Social Container Smoke — run `33192336957` — SUCCESS.

Exact-main evidence includes:

- server suite: **904 passed / 3 skipped / 0 failed**;
- `chat-runtime-bridge.service.test.ts`: **5/5 PASS**;
- `human-control-policy.test.ts`: **10 PASS**;
- authority provenance unit regression: **4 PASS**;
- authority provenance HTTP regression: **1 PASS**;
- Human Delegation Guard v1.1: **14 PASS**;
- Human Delegation Guard: **11 PASS**;
- ProductionAuthorizationService: **10 PASS**;
- ProductionAuthorizationController: **3 PASS**;
- format, lint, typecheck, migrations, build: PASS;
- dependency vulnerability gate: PASS;
- backup and isolated restore: PASS;
- release-readiness contract tests: PASS.

Qualification artifact: `mcf-v11-qualification-2a264b283d976bd1b392052fa928d076debfc7fb`, artifact ID `9694307473`, SHA-256 `60c3d7fe82ee045ed04fdc644a14042ca860b9d72030efea68dae6181ba1b05a`.

Automated exact-head qualifier verdict: `AUTOMATED_EVIDENCE_PASS_PENDING_INDEPENDENT_REVIEW`.

## SemVer rationale

`v1.3.0` is a minor release candidate because the post-v1.2.0 lineage adds backward-compatible framework capability plus security hardening. The verified delta is materially larger than a patch, and no breaking change requiring a major version has been established.

## Known limits / non-claims

- no universal persistent pause/resume API for already-running missions is claimed;
- universal absence of every alternate legacy textual-helper usage remains `NOT_VERIFIED` because prior repository code-search was incomplete;
- NextGen roadmap/architecture/plans are not runtime implementation claims;
- production is not authorized by this release preparation;
- PR #176 remains outside this authorization.

## Publication boundary

`VERSION_CANDIDATE = v1.3.0`  
`VERSION_CANDIDATE_OFFICIALLY_DEFINED = YES`  
`TAG_CREATED = NO`  
`RELEASE_PUBLISHED = NO`  
`PRODUCTION_DEPLOY_AUTHORIZED = NO`  
`PR_176_MERGE_AUTHORIZED = NO`

A separate explicit LEANDRO HUMAN_GATE is required before creating the `v1.3.0` tag or publishing the GitHub Release. Deployment remains a separate governed action even after release publication.
