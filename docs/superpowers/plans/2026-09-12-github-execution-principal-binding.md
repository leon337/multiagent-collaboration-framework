# GitHub Execution Principal Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate logical MCF agent authorization from verified GitHub execution identity without regressing existing skill ownership.

**Architecture:** Add a non-secret execution-principal descriptor to external action requests. A GitHub identity registry binds authorized GitHub writes to a direct or bootstrap-delegated principal, verifies the configured token against GitHub `/user`, and gives tokens only to write adapters. Ledger fingerprints/events and receipts carry the non-secret attribution fields.

**Tech Stack:** TypeScript, NestJS DI, Vitest, pnpm, GitHub REST API.

**Spec:** `docs/superpowers/specs/2026-09-12-github-execution-principal-binding.md`

## Global Constraints
- Node.js `>=24.18.0 <25` and pnpm `11.17.0`.
- PermissionEngine remains the authority for logical skill ownership.
- LEANDRO is not exposed as an automated runtime credential.
- GitHub tokens never appear in request/receipt/ledger/log payloads.
- Bootstrap delegation is disabled unless explicitly enabled.
- No direct write or merge to `main`.

---

### Task 1: Execution principal contracts and resolver

**Files:**
- Create: `apps/rede-social-agentes/apps/server/src/mcf-runtime/github-execution-identity.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-runtime/github-execution-identity.test.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action.contracts.ts`

**Interfaces:**
- Produces `ExternalExecutionPrincipal` with provider, principalId, externalActor and attributionMode.
- Produces `GitHubExecutionIdentityRegistry.bindWritePrincipal(request)` and `tokenFor(principal)`.

- [ ] Write tests that direct-bind MESTRE and LÉO, bootstrap-delegate an authorized unbound agent to MESTRE, fail closed when delegation is disabled, reject missing credentials, and reject a token whose `/user` login does not match.
- [ ] Run only the new test and verify RED because the registry/contracts do not exist.
- [ ] Implement the minimal registry and contract types with no token serialization.
- [ ] Run the new test and verify GREEN.
- [ ] Commit Task 1.

### Task 2: Bind principal before durable reservation

**Files:**
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-dispatcher.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-ledger.ts`
- Test: `apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-dispatcher.postwrite-persistence.test.ts`
- Create/Test: `apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-ledger.execution-principal.test.ts`

**Interfaces:**
- Consumes `GitHubExecutionIdentityRegistry.bindWritePrincipal`.
- Produces requests with non-secret `executionPrincipal` before ledger reservation.

- [ ] Add failing dispatcher test proving a GitHub write is bound before `ledger.reserve`, while a read-only/non-GitHub action is unchanged.
- [ ] Add failing ledger test proving execution principal changes the idempotency fingerprint and appears in requested/allowed event metadata without a token.
- [ ] Implement minimal dispatcher binding and ledger attribution/fingerprint changes.
- [ ] Run targeted tests and verify GREEN.
- [ ] Commit Task 2.

### Task 3: Route write adapters through the verified principal token

**Files:**
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/github-branch-pr.adapter.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/github-pr-collaboration.adapter.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/github-staging-deploy.adapter.ts`
- Test existing adapter suites plus focused identity-binding tests.

**Interfaces:**
- Consumes `request.executionPrincipal` and `GitHubExecutionIdentityRegistry.tokenFor`.
- Receipts add logical and external attribution metadata.

- [ ] Add failing tests that each write adapter refuses a missing principal and sends the verified principal token instead of the legacy generic write token.
- [ ] Add failing receipt assertions for `logicalAgentId`, `executionPrincipalId`, `externalActor`, `attributionMode`, and `identityBindingVerified`.
- [ ] Implement the smallest changes to pass, keeping read adapters untouched.
- [ ] Run all relevant GitHub adapter tests and verify GREEN.
- [ ] Commit Task 3.

### Task 4: Runtime composition and operational configuration

**Files:**
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/mcf-runtime.module.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/mcf-runtime.module.adapter-registry.test.ts`
- Modify: `apps/rede-social-agentes/.env.example`

**Interfaces:**
- One `GitHubExecutionIdentityRegistry` instance is injected into dispatcher and all GitHub write adapters.

- [ ] Add failing module-composition test for registry injection.
- [ ] Wire one shared registry through Nest providers.
- [ ] Document only variable names, never credential values.
- [ ] Run module and config-related tests and verify GREEN.
- [ ] Commit Task 4.

### Task 5: Full verification and PR

**Files:** no new production files.

- [ ] Run format check/lint/typecheck for touched server scope.
- [ ] Run the complete relevant GitHub runtime suite and verify zero failures.
- [ ] Run `git diff --check`, inspect status and secret scan for `gho_`, `github_pat_`, `MCF_GITHUB_*_TOKEN=` values.
- [ ] Push branch with MESTRE identity and open a PR without merge.
- [ ] Record the implementation as MESTRE execution and request independent technical review before integration.
