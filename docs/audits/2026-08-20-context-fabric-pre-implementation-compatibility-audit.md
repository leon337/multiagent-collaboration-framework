# Context Fabric — Pre-Implementation Compatibility / Regression Audit

**Mission:** `MCF-ARCHITECTURE-CONVERGENCE-001` — Issue #147  
**Plan PR:** #150  
**Audit date:** 2026-08-20  
**Trusted live baseline:** `main@87c7f24d0d0240207bd694ae3ebbfe2642e6a774`  
**Audit scope:** CF-0 + minimal CF-1 planning boundary only  
**Implementation authorized:** `false`  
**Production authorized:** `false`  
**Matrix state:** `CLOSED`  
**Audit decision:** `PRE_IMPLEMENTATION_AUDIT_BLOCKED`

---

## 1. Decision

The current-behavior matrix is complete against the live trusted baseline above. The proposed first Context Fabric boundary is architecturally capable of remaining additive and isolated, but the implementation plan cannot receive `PRE_IMPLEMENTATION_AUDIT_PASS` yet because Task 1 contains stale assertions about the current public MCF contract surface.

The blocking drift is documentary/planning drift, not a discovered regression in current `main`:

1. current `McfResumeRoute` is `FAST_RESUME | RECONCILE | RECOVER_MCF_PROJECT`, while the plan incorrectly proposes characterizing `NORMAL_FLOW | INVESTIGATION`;
2. `McfColdStartRecoveryStatus` is not present in the current `@rsa/contracts` public MCF runtime surface;
3. `McfArtifactClaimType` is not present in the current `@rsa/contracts` public MCF runtime surface;
4. `McfGateType` and `McfGateStatus` are not present as public runtime contract types; current gate semantics are represented by `McfPermissionProfile` (`HUMAN_GATE`), gate event types (`GATE_REQUIRED`, `GATE_APPROVED`, `GATE_REJECTED`) and the v1.1 authorization-context / production-authorization implementation.

Therefore the compatibility test described by Task 1 would fail against the real baseline before any Context Fabric code existed. This must be corrected in the plan before implementation authorization can be considered.

---

## 2. Current-behavior compatibility matrix

| # | Current behavior | Current owner/source | Planned touchpoint | Classification | Evidence / characterization control | Residual risk |
|---|---|---|---|---|---|---|
| 1 | Resume routing is fail-closed and uses `FAST_RESUME`, `RECONCILE`, `RECOVER_MCF_PROJECT`; exact live match is required for `FAST_RESUME`; unexplained divergence routes to recovery. | `packages/contracts/src/mcf-runtime.ts`; `apps/server/src/mcf-runtime/continuity-recovery.service.ts` | Task 1 compatibility test; new isolated recovery kernel must not replace current service. | `BLOCKED` | Existing `continuity-recovery.service.test.ts` proves exact-match, explainable-drift and fail-closed recovery behavior. Plan currently asserts the wrong literal union. | Plan must be corrected to lock the actual union and existing service semantics. |
| 2 | There is no current public `McfColdStartRecoveryStatus` contract in `@rsa/contracts`. Cold/resume continuity is currently expressed through checkpoint transferability + `McfResumeRoute` and `ContinuityRecoveryService`. | `packages/contracts/src/mcf-runtime.ts`; `packages/contracts/src/index.ts`; `continuity-recovery.service.ts` | Task 1 attempts to characterize a non-existent public type. | `BLOCKED` | Live public contract/index re-read at baseline; `continuity-recovery.service.test.ts` is the current behavioral characterization. | Plan must remove the imaginary compatibility assertion or explicitly define a new Context Fabric type under a distinct name. |
| 3 | There is no current public `McfArtifactClaimType`. Existing truth/evidence vocabulary includes `ProvenanceType`, `RealityAssertionKind`, `McfArtifactRef`, event/evidence types. | `packages/contracts/src/mcf-runtime.ts`; `packages/contracts/src/index.ts` | Task 1 attempts to characterize `McfArtifactClaimType = OBSERVED | DERIVED`; new Context Fabric plans a distinct claim type. | `BLOCKED` | Live public contract/index re-read. | Plan must not reinterpret an absent legacy type; new `McfContextClaimType` must remain explicitly new/additive. |
| 4 | Mission states, phase states and gate events are existing public runtime literals. No public `McfGateType`/`McfGateStatus` exists. `HUMAN_GATE` is a permission profile; gate transitions are event types. | `packages/contracts/src/mcf-runtime.ts`; runtime services | Task 1 compatibility test; Context Fabric must not redefine mission/phase/gate semantics. | `BLOCKED` | Current unions: `McfMissionState`, `McfPhaseState`, `McfPermissionProfile`; `McfEventType` includes gate events. | Plan must replace stale `McfGateType/McfGateStatus` assertions with actual current public literals/behavior. |
| 5 | Human authority is final but not routine technical operation; LÉO owns operational gates inside scope; reserved human actions fail closed and require TEAM_FIRST / evidence. | protocol v1.1; `human-delegation-guard.ts`; `production-authorization.service.ts` | No runtime wiring in CF-0/CF-1; Truth/Context contracts must preserve authority semantics. | `PRESERVE` | `human-delegation-guard.test.ts`; `production-authorization.service.test.ts`. | Any future Context Fabric consumer must treat authority data as evidence/context, not as a new authorization engine. |
| 6 | Production authorization is bound to exact SHA and canonical persisted LEANDRO authorization + persisted LÉO operational gate; stale/missing/mismatched evidence fails closed. | `production-authorization.service.ts`; `ops/production-authorization-resolver.mjs`; production workflow | No touch in first boundary. | `NOT_TOUCHED` | `production-authorization.service.test.ts`; `ops/production-authorization-resolver.test.mjs`; `ops/production-promotion-policy.test.mjs`. | Regression would be critical; workflow and authorization files must remain untouched. |
| 7 | Mission events/evidence/receipts are persisted by the current runtime; external-action reservation writes canonical durable records/events with idempotency semantics. | current MCF runtime repository/event ledger; `canonical-external-action-ledger.ts` | First Context Recovery Receipt is explicitly evidence-only and not persisted to current event ledger in this boundary. | `PRESERVE` | `canonical-external-action-ledger.integration.test.ts`; full workspace tests. | Receipt must not become a competing canonical event/evidence store. |
| 8 | Current runtime database/migrations are canonical for implemented runtime state; Production Readiness applies migrations twice and backup/restore validation. | `packages/database/migrations/`; `.github/workflows/mcf-production-readiness.yml` | Plan explicitly adds no DB table/migration/cache. | `NOT_TOUCHED` | Diff guard: no changes under `packages/database/`; Production Readiness migration + backup/restore steps remain green. | None in this boundary if forbidden-path guard is respected. |
| 9 | Staging mutation is governed, records durable origin binding before mutable reconciliation, and rejects callback-supplied origin mismatch. | `canonical-external-action-ledger.ts`; staging reconciliation services/adapters | No staging integration in CF-0/CF-1. | `NOT_TOUCHED` | `canonical-external-action-ledger.integration.test.ts`; `bound-staging-deploy-reconciliation.service.test.ts`. | New context code must not enter staging adapter/ledger path. |
| 10 | Production is decoupled from ordinary `main` updates; promotion is a separate exact-SHA governed action with readiness verification and recovery to previous healthy SHA on failure. | `docs/MCF-CURRENT-STATE.md`; production workflow; production promotion policy | No production integration or deployment change. | `NOT_TOUCHED` | `ops/production-promotion-policy.test.mjs`; production workflow unchanged. | Production/provider live state must continue to be treated as `LIVE_REQUIRED`, never inferred from Capsule snapshot. |
| 11 | Provider mutation occurs only after permission/authorization and durable action reservation; staging origin is bound before adapter execution. | `ExternalActionDispatcher`/ledger/adapter path; `canonical-external-action-ledger.ts` | New Context Fabric source loader is filesystem/read-only; no provider adapter in CF-0/CF-1. | `NOT_TOUCHED` | Existing external-action/staging tests + forbidden-path diff. | Future CF-2 live adapters require a separate audit because provider reads/writes change the threat boundary. |
| 12 | Deployment workflows are existing execution boundaries; production workflow dispatch requires `release_sha`, `mission_id`, `phase_id`, runs from `main`, resolves canonical authorization, and emits BLOCKED/DEPLOYED/NOOP/RECOVERED. | `.github/workflows/mcf-runtime-production-deploy.yml` | Explicitly forbidden from change in first implementation boundary. | `NOT_TOUCHED` | Workflow file hash/path re-read; ops production tests. | No workflow edit may be introduced merely to accommodate Context Fabric. |
| 13 | Production Readiness runs frozen install, prod dependency audit, format, lint, typecheck, migrations twice, full tests, build, backup/isolated restore and ops contract tests. | `.github/workflows/mcf-production-readiness.yml` | New files/dependency must pass existing gate; workflow itself remains unchanged. | `PRESERVE` | Existing workflow; workspace `verify`; `test:ops`. | New direct `yaml` production dependency changes dependency graph and must pass `pnpm audit --prod`, frozen lockfile and build. |
| 14 | `@rsa/contracts` exposes current MCF runtime types explicitly from `src/index.ts`. Existing names must not be removed/reinterpreted. | `packages/contracts/src/index.ts`; `mcf-runtime.ts` | Add one new isolated `mcf-context.ts` export. | `PRESERVE` | Corrected compatibility test must lock current actual public unions plus existing full typecheck/build. | Additive export can still cause naming collisions; unique `McfContext*` names are required. |
| 15 | Server startup imports `McfRuntimeModule`; existing runtime module registers mission, observability, CI/staging callback, chat, social timeline and production-authorization controllers/providers. | `apps/server/src/app.module.ts`; `apps/server/src/mcf-runtime/mcf-runtime.module.ts` | New `mcf-context` code is planned as an isolated callable library/service and is not registered in `AppModule` in first boundary. | `NOT_TOUCHED` | Diff guard for `app.module.ts` and current runtime module; full server tests/build. | Accidental Nest module/controller registration would expand runtime behavior and must block merge. |
| 16 | Server production dependency set currently includes Nest, contracts, database, AJV, Fastify, reflect-metadata, rxjs and zod; no direct `yaml` dependency. | `apps/server/package.json`; workspace lockfile | Task 4 adds exact direct `yaml` dependency for repository-native parsing. | `PRESERVE` | Before merge: frozen install, prod audit, typecheck/test/build. | Additive dependency is a real production dependency delta; acceptable only if exact version is revalidated and no startup wiring is introduced. |
| 17 | Canonical recovery starts with current LEANDRO instruction, live GitHub/provider, current-state map, active boundary, then applicable code/tests/workflows/evidence; proposals remain non-current. | `docs/MCF-CURRENT-STATE.md`; protocol v1.1 | Registry/Capsule become additional repository-native recovery inputs but may not supersede live owner sources or promote proposed architecture to current. | `PRESERVE` | Fixture/schema tests must encode snapshot/live distinction; current-state document remains canonical orientation map until an implemented-state update is justified. | Capsule freshness/provenance rules are mandatory to avoid stale operational state masquerading as current. |

---

## 3. Characterization / regression test map

The implementation plan may proceed to implementation authorization review only after its Task 1 baseline is corrected. The corrected test map must preserve these existing controls unchanged:

- `apps/rede-social-agentes/apps/server/src/mcf-runtime/continuity-recovery.service.test.ts`
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/human-delegation-guard.test.ts`
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/production-authorization.service.test.ts`
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/canonical-external-action-ledger.integration.test.ts`
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/bound-staging-deploy-reconciliation.service.test.ts`
- `apps/rede-social-agentes/ops/production-authorization-resolver.test.mjs`
- `apps/rede-social-agentes/ops/production-promotion-policy.test.mjs`
- existing `pnpm test`, `pnpm typecheck`, `pnpm build`, and Production Readiness controls.

A new `mcf-runtime.compatibility.test.ts` is acceptable only if it locks the **actual live baseline**, at minimum:

```text
McfResumeRoute = FAST_RESUME | RECONCILE | RECOVER_MCF_PROJECT
McfPermissionProfile includes HUMAN_GATE without changing the other current literals
McfEventType continues to include GATE_REQUIRED | GATE_APPROVED | GATE_REJECTED
McfMissionState current literals remain unchanged
McfPhaseState current literals remain unchanged
```

It must not assert the existence of `McfColdStartRecoveryStatus`, `McfArtifactClaimType`, `McfGateType`, or `McfGateStatus` unless those names are introduced later as explicitly new contracts under separately reviewed scope.

---

## 4. Forbidden regression surfaces for CF-0 + minimal CF-1

The first implementation boundary must not modify or reinterpret:

```text
.github/workflows/mcf-runtime-production-deploy.yml
.github/workflows/mcf-production-readiness.yml
apps/rede-social-agentes/packages/database/
apps/rede-social-agentes/apps/server/src/mcf-runtime/continuity-recovery.service.ts
apps/rede-social-agentes/apps/server/src/mcf-runtime/human-delegation-guard.ts
apps/rede-social-agentes/apps/server/src/mcf-runtime/production-authorization.service.ts
apps/rede-social-agentes/apps/server/src/mcf-runtime/canonical-external-action-ledger.ts
apps/rede-social-agentes/apps/server/src/mcf-runtime/mcf-runtime.module.ts
apps/rede-social-agentes/apps/server/src/app.module.ts
provider/deployment mutation semantics
```

If implementation later requires one of these surfaces, the change leaves the currently approved first boundary and requires explicit re-review before execution.

---

## 5. Required correction before PASS

`PRE_IMPLEMENTATION_AUDIT_BLOCKED` is caused by plan-baseline mismatch, not by a requirement to abandon the approved Context Fabric architecture.

To become eligible for a repeat audit and possible `PASS`, PR #150 must be corrected so that:

- Task 1 characterizes the current `McfResumeRoute` union and current continuity behavior;
- non-existent legacy type assertions are removed;
- actual gate semantics are characterized through current public types/events and current authorization tests;
- the new Context Fabric contracts remain distinct/additive (`McfContext*`);
- dependency delta (`yaml`) is explicitly kept behind existing Production Readiness gates;
- no current runtime/module/workflow/database/provider surface is added to first-boundary implementation scope.

After the corrected plan is re-read against the then-current `main`, Gate 0 must be rerun. Only `PRE_IMPLEMENTATION_AUDIT_PASS` with zero `BLOCKED` rows can satisfy the pre-implementation gate.

---

## 6. Gate state

```text
PLAN_COMPLETE                         = true
CURRENT_BEHAVIOR_MATRIX_CLOSED        = true
PRE_IMPLEMENTATION_AUDIT_PASS         = false
PRE_IMPLEMENTATION_AUDIT_BLOCKED      = true
SEPARATE_IMPLEMENTATION_AUTHORIZATION = false
IMPLEMENTATION_MAY_BEGIN              = false
```

No code, schema, runtime, database, provider, workflow, production or deployment implementation is authorized by this audit.