# Governed Shared Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship MCF governed shared memory phases 1–6 with a single production path, scoped capabilities, append-only supersession, contradiction handling, policy-governed propagation, exact-SHA verification and live provider evidence.

**Architecture:** The Nest MCF runtime owns memory semantics and policy. `McfLedgerMemoryTransportService` is the only mutable provider transport and talks to an isolated Cognitive Ledger MCP boundary. Cognitive Ledger remains append-only; semantic changes are represented as new events/relations. Python runtime artifacts are qualification/reference only and do not become a second production control plane.

**Tech Stack:** TypeScript/NestJS/Vitest, MCP SDK, Zod, Deno/Supabase Edge Functions, PostgreSQL/Supabase, GitHub Actions, Render.

**Spec:** `docs/superpowers/specs/2026-09-22-governed-shared-memory-design.md`

## Global Constraints

- Classe C; fail closed on auth/provider/policy/currentness failure.
- LEANDRO supplied standing authorization for phases 1–6 and production promotion; no additional permission pauses are required unless a platform/tool itself blocks execution.
- No generic SQL capability to agents.
- No private memory in public fixtures/logs/receipts.
- No service-role/Postgres credentials in MCF runtime.
- Every mutable capability is distinct; `write` never grants `supersede` or `propagate`.
- Provider data model remains append-only except separately governed hard delete, which is out of scope.
- Production rollout uses synthetic data first; post-deploy negative tests must pass.

## Review Focus

1. Direct event-ID access with wrong scope must fail without returning event content.
2. A supersession fork must resolve as `CONFLICTED`, never select a winner silently.
3. A propagated derivative whose source is later superseded must become `STALE` under MARK_STALE.
4. A propagation deny must not invoke provider mutation and must still create auditable runtime evidence.
5. Provider/tool inventory drift, malformed receipts and timeout must fail closed without leaking credentials or payload.

---

### Task 1: Canonical provider transport and Phase 2 write

**Files:**
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-ledger-memory-transport.service.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-ledger-memory-transport.service.test.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-ledger-memory-token.guard.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-ledger-memory-token.guard.test.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-context.module.ts`

**Interfaces:**
- Produces: `McfLedgerMemoryTransportService.registerExplicit(input)` and `inspect(eventId, memoryScope)`.
- Provider MCP inventory: `registrar_memoria` (mutable) + `inspecionar_memoria` (read-only), exact annotations.

- [ ] Write failing Vitest tests that require explicit confirmation, separate credentials, exact `/mcp-write`, exact two-tool inventory, bounded payloads, read-back receipt and fail-closed bulkhead.
- [ ] Run targeted Vitest and observe failure because transport implementation does not exist.
- [ ] Port/harden the proven #250 transport behavior into the canonical two-tool transport.
- [ ] Add the module provider/guard wiring.
- [ ] Run targeted tests, then full `pnpm --filter @rsa/server test`.
- [ ] Commit `feat(memory): add canonical governed memory transport`.

### Task 2: Scoped Phase 1 read + current-state primitives

**Files:**
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-governed-memory.service.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-governed-memory.service.test.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-governed-memory.types.ts`

**Interfaces:**
- Consumes: `McfLedgerMemoryTransportService.inspect`.
- Produces: `readScoped`, `resolveState` and shared authorization helpers used by later tasks.

- [ ] Write failing tests for same-scope read, wrong-scope direct-ID deny, missing scope deny, receipt privacy and provider failure.
- [ ] Run tests and observe RED.
- [ ] Implement strict `memory_scope` normalization and scoped read.
- [ ] Implement deterministic relation graph helpers and resolver statuses `CURRENT|SUPERSEDED|CONFLICTED|STALE|HISTORICAL`.
- [ ] Run targeted tests and full server suite.
- [ ] Commit `feat(memory): enforce scoped reads and state resolution`.

### Task 3: Phase 3 supersession

**Files:**
- Modify: `mcf-governed-memory.service.ts`
- Modify: `mcf-governed-memory.service.test.ts`

**Interfaces:**
- Produces: `supersede(input)` with relation `SUPERSEDES` and supersession receipt.

- [ ] Write failing tests for append-only replacement, same-scope requirement, self/cycle denial, idempotent retry and conflicting successor fork.
- [ ] Run RED tests.
- [ ] Implement `supersede`: inspect source, verify scope/current graph, create replacement event with `SUPERSEDES` relation, require provider receipt.
- [ ] Run targeted + full suite.
- [ ] Commit `feat(memory): add append-only supersession`.

### Task 4: Phase 4 contradiction handling

**Files:**
- Modify: `mcf-governed-memory.service.ts`
- Modify: `mcf-governed-memory.service.test.ts`

**Interfaces:**
- Produces: `registerContradiction` and `resolveContradiction`.

- [ ] Write failing tests proving contradiction != supersession, pair normalization/idempotency, unresolved `CONFLICTED`, and dedup/contradiction ordering.
- [ ] Run RED tests.
- [ ] Implement explicit `CONFLICTS_WITH` relation/event registration and resolution events without overwrite.
- [ ] Ensure resolver retains both claims until explicit resolution.
- [ ] Run targeted + full suite.
- [ ] Commit `feat(memory): add contradiction lifecycle`.

### Task 5: Phase 5 policy-governed propagation

**Files:**
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-memory-policy.service.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-memory-policy.service.test.ts`
- Modify: `mcf-governed-memory.service.ts`
- Modify: `mcf-governed-memory.service.test.ts`

**Interfaces:**
- Produces: explicit `(source_scope,target_scope,operation)` policy evaluation and `propagate(input)`.

- [ ] Write failing policy tests: default DENY, exact allow, no wildcard widening, policy version receipt.
- [ ] Write failing propagation tests: deny causes zero provider mutation, allow creates `PROPAGATED_FROM`, retry idempotent, raw source not copied implicitly.
- [ ] Write failing stale test: source supersession marks target derivative `STALE` under MARK_STALE.
- [ ] Run RED tests.
- [ ] Implement policy service and propagation logic.
- [ ] Run targeted + full suite.
- [ ] Commit `feat(memory): add governed propagation policy`.

### Task 6: Phase 6 unified governed shared-memory API

**Files:**
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-governed-memory.controller.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-governed-memory.controller.test.ts`
- Modify: `mcf-context.module.ts`
- Create/Modify capability contracts under `context/capabilities/`.
- Create: `context/missions/mcf-governed-shared-memory-001.json`

**Interfaces:**
- HTTP boundary exposes operation-specific routes/actions under one guarded controller; transport credentials remain internal.

- [ ] Write failing controller tests for auth, validation, route separation and no payload in receipts.
- [ ] Run RED tests.
- [ ] Implement controller and module wiring.
- [ ] Add capability Registry entries for read/write/supersede/contradiction-resolve/propagate.
- [ ] Add mission contract with standing authorization and production gates.
- [ ] Run server tests, schema/document validation and `pnpm verify`.
- [ ] Commit `feat(memory): expose governed shared memory capabilities`.

### Task 7: Cognitive Ledger provider control-plane support

**Repository:** `leon337/cognitive-ledger`

**Files:**
- Modify: `mcp/src/cliente-ledger.mjs`
- Modify: `mcp/src/ferramentas.mjs`
- Modify: `mcp/src/servidor.mjs`
- Modify: `mcp/testes/cliente-ledger.test.mjs`
- Modify: `mcp/testes/ferramentas.test.mjs`
- Modify: `mcp/testes/servidor.e2e.test.mjs`
- Modify/Create: `supabase/functions/cognitive-ledger-api/lib/api-write.ts`
- Create: `supabase/functions/cognitive-ledger-api/lib/api-memory-inspect.ts`
- Modify: `supabase/functions/cognitive-ledger-api/index.ts`
- Create tests for inspect endpoint/tool.

**Interfaces:**
- `/mcp-write` exposes exactly `registrar_memoria` + `inspecionar_memoria`.
- `inspecionar_memoria` returns event metadata + relations, never raw source body.

- [ ] Add failing Node/Deno tests for inspect-by-ID + scope enforcement, relation retrieval, wrong-scope deny and exact MCP inventory.
- [ ] Run RED in provider CI/available test harness.
- [ ] Implement API inspect route and MCP tool.
- [ ] Preserve existing transactional `registrar_evento_cognitivo` and read-back.
- [ ] Run Deno/Node/MCP E2E tests.
- [ ] Commit and open provider PR.

### Task 8: Cross-repo exact-SHA qualification

- [ ] Open MCF PR from `feat/governed-shared-memory-20260922` to `main`.
- [ ] Observe PR-triggered `MCF Production Readiness` and relevant runtime workflows on exact head SHA.
- [ ] Inspect failed job logs; fix by TDD if any failures are code-related.
- [ ] Confirm full server suite, format, lint, typecheck, build, migrations, backup/restore and release-readiness PASS.
- [ ] Qualify Cognitive Ledger provider PR with its Deno/Node/MCP/E2E gates.
- [ ] Record exact SHAs/run IDs in Issue #316 and Phase artifacts.

### Task 9: Live provider deployment and synthetic production proof

- [ ] Snapshot/inventory current Cognitive Ledger production schema and record counts.
- [ ] Deploy the qualified Edge Function version to Supabase project only after provider tests are green.
- [ ] Verify no reset/reseed occurred and existing records remain.
- [ ] Configure the dedicated authorized MCP client/capabilities for the MCF memory boundary without exposing secrets.
- [ ] Run synthetic live sequence: write → read → supersede → contradiction → propagation allow → propagation deny → stale-after-supersede.
- [ ] Verify receipts are hash-only and raw private source is absent.
- [ ] Record provider version/currentness and rollback point.

### Task 10: MCF production promotion

- [ ] Merge provider PR, then MCF PR only after exact-head gates pass.
- [ ] Verify main exact SHA and post-merge qualification.
- [ ] Update Render environment only with the new memory endpoint/tokens/policy configuration; never echo secret values.
- [ ] Deploy/allow auto-deploy of the exact qualified main SHA.
- [ ] Verify production health and run post-deploy synthetic negative tests.
- [ ] Confirm read regression, direct-ID wrong-scope deny, provider failure fail-closed and no public payload leakage.
- [ ] Publish/reconcile release/current-state documentation and close #164 only if its terminal gates are met.
- [ ] Update #316 phase states; close only after all Phase 6 production criteria pass.
