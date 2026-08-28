# Decision Authority Provenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind reserved-human decisions to the authenticated LEANDRO account and remove caller-controlled authority provenance from the production authorization path.

**Architecture:** HTTP authentication remains in `SessionAuthGuard`. `MissionRuntimeController` converts the authenticated session into a server-side execution identity and passes it separately from the body; `MissionRuntimeService` canonicalizes terminal human-gate provenance before the executor or repository sees it. Production authorization parses only a typed canonical `HumanAuthorityProof` bound to the configured reserved account ID.

**Tech Stack:** TypeScript 6, NestJS 11, Zod 4, Vitest 4, pnpm 11.

**Spec:** `docs/superpowers/specs/2026-08-27-decision-authority-provenance.md`

## Global Constraints

- Base snapshot: `a98cc9140c8b001135a8ce9cc37abab69c7165a6`.
- Node: `>=24.18.0 <25`; pnpm: `11.17.0`.
- TDD: no production behavior change before an observed failing test.
- Fail closed for reserved-human terminal decisions without canonical account provenance.
- Do not merge, tag, release, or deploy from this plan.

---

### Task 1: Reserved human authority configuration

**Files:**
- Modify: `apps/rede-social-agentes/apps/server/src/config.ts`
- Test: `apps/rede-social-agentes/apps/server/src/config.test.ts`

**Interfaces:**
- Produces: `RuntimeConfig.RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID: string | undefined`.
- Production requires the value to be a valid UUID.
- [x] **Step 1:** Add a config test proving production rejects a missing reserved-human account ID.
- [x] **Step 2:** Run `corepack pnpm --filter @rsa/server exec vitest run src/config.test.ts` and observe the new test fail.
- [x] **Step 3:** Add `RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID` to the Zod config and production hardening checks.
- [x] **Step 4:** Re-run `src/config.test.ts` and confirm PASS.

### Task 2: Server-derived human authority proof

**Files:**
- Create: `apps/rede-social-agentes/apps/server/src/mcf-runtime/human-authority-proof.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime.controller.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime.service.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/mcf-runtime.module.ts`
- Test: `apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime.authority-provenance.test.ts`
- Test: `apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime.authority-provenance.http.test.ts`

**Interfaces:**
- Produces: `AuthenticatedHumanExecutionProof { accountId, sourceRef }` from server-side request state; `sourceRef` is a server-generated `human-authority:<UUID>` and does not persist session/correlation identifiers.
- Produces: canonical `humanGateDecision { status, decidedBy: 'LEANDRO', accountId, sourceRef }` for terminal decisions.
- Consumes: configured `RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID`.

- [x] **Step 1:** Write a failing test where a second authenticated account sends `status: 'APPROVED', decidedBy: 'leandro'` and controller execution rejects with HTTP 403 semantics.
- [x] **Step 2:** Run only the new authority-provenance test and verify it fails because current runtime trusts body provenance.
- [x] **Step 3:** Implement the execution-proof type and controller-to-runtime separate identity parameter.
- [x] **Step 4:** Canonicalize terminal decisions in `MissionRuntimeService` before executor/persistence; reject mismatched or missing reserved account configuration.
- [x] **Step 5:** Re-run the new test and confirm PASS.
### Task 3: Typed production authorization provenance

**Files:**
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/human-delegation-guard.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/production-authorization.service.ts`
- Test: `apps/rede-social-agentes/apps/server/src/mcf-runtime/human-delegation-guard-v1.1.test.ts`
- Test: `apps/rede-social-agentes/apps/server/src/mcf-runtime/production-authorization.service.test.ts`

**Interfaces:**
- Produces: `HumanAuthorityProof { accountId, authority: 'LEANDRO', sourceRef }`.
- `ProductionAuthorizationService` accepts only an approved proof bound to the configured reserved account ID.

- [x] **Step 1:** Add failing tests for missing/mismatched canonical `accountId` in approved human decisions.
- [x] **Step 2:** Run the two focused test files and verify the new assertions fail.
- [x] **Step 3:** Require account provenance in `HumanDelegationGuard` and parse approved decisions into typed `HumanAuthorityProof`.
- [x] **Step 4:** Update `ProductionAuthorizationService` to use the typed proof and configured account ID.
- [x] **Step 5:** Re-run focused tests and confirm PASS.

### Task 4: Verification and audit evidence

**Files:**
- Modify only test fixtures required by the new canonical provenance contract.

- [x] **Step 1:** Run the Finding B focused suite plus `src/config.test.ts`.
- [x] **Step 2:** Run `corepack pnpm --filter @rsa/server typecheck`.
- [x] **Step 3:** Run the complete `@rsa/server` test suite.
- [x] **Step 3 evidence:** Full `@rsa/server` suite executed against an ephemeral migrated PostgreSQL 16 instance: 166 test files, 902 passed, 0 failed, 3 skipped/pending.
- [x] **HTTP regression evidence:** The exact HTTP negative test fails on baseline `a98cc914` with 500/executor reached and passes on this patch with 403/executor not reached.
- [x] **Static verification evidence:** workspace format, lint, typecheck and build passed after implementation; manifests parsed successfully.

- [x] **Step 4:** Run `git diff --check`, inspect `git diff`, and confirm no Finding A or unrelated changes entered the branch.
- [x] **Step 5:** Create the local branch commit only after all verification evidence and staged-diff audit are green.
- [ ] **Step 6:** Push the branch and open a draft PR for review, without merge.