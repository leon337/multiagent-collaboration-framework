# Context Fabric CF-0 + Minimal CF-1 — Plan Amendment 001

**Mission:** `MCF-ARCHITECTURE-CONVERGENCE-001` — Issue #147  
**Plan PR:** #150  
**Amends:** `docs/superpowers/plans/2026-08-20-context-fabric-cf0-cf1-implementation-plan.md`  
**Reason:** close the stale-current-behavior blockers identified by the pre-implementation compatibility matrix  
**Live baseline rechecked:** `main@87c7f24d0d0240207bd694ae3ebbfe2642e6a774`  
**Implementation authorized:** `false`  
**Production authorized:** `false`

---

## 1. Authority of this amendment

This document is an authoritative correction to the planning package in PR #150. It supersedes only the stale current-behavior assertions identified below. Every other task, scope boundary, TDD sequence, forbidden surface and hard implementation gate in the original plan remains unchanged.

If this amendment conflicts with the original plan on any item named here, this amendment wins. It does not authorize implementation.

---

## 2. Gate 0B matrix corrections

The original Gate 0B rows 1–4 must be interpreted as follows:

1. **Current `McfResumeRoute` semantics** — characterize the live public union and the implemented `ContinuityRecoveryService` behavior.
2. **Current cold-start / continuity semantics** — verify checkpoint transferability, live repository comparison, fail-closed recovery and absence of any public legacy `McfColdStartRecoveryStatus` contract. Do not invent or import that name as an existing type.
3. **Current truth/evidence vocabulary** — characterize existing public provenance/evidence contracts and verify that there is no public legacy `McfArtifactClaimType` contract. New Context Fabric claim types must be additive and distinctly named.
4. **Mission/phase/gate semantics** — characterize existing mission/phase state unions, `McfPermissionProfile`, gate event literals and current authorization behavior. Do not invent or import public `McfGateType` or `McfGateStatus` contracts.

Rows 5–17 remain unchanged.

---

## 3. Corrected Task 1 — current compatibility baseline

### 3.1 Existing runtime contracts to lock

`mcf-runtime.compatibility.test.ts` must characterize the current public surface without modifying `mcf-runtime.ts`.

At minimum, it must lock:

```ts
McfResumeRoute ===
  | "FAST_RESUME"
  | "RECONCILE"
  | "RECOVER_MCF_PROJECT"

McfMissionState ===
  | "PLANNED"
  | "EXECUTING"
  | "RECOVERING"
  | "WAITING_EXTERNAL"
  | "BLOCKED_RISK"
  | "COMPLETED"
  | "CANCELLED"

McfPhaseState ===
  | "PLANNED"
  | "EXECUTING"
  | "WAITING_EVIDENCE"
  | "RECOVERING"
  | "FAILED"
  | "COMPLETED"

McfPermissionProfile ===
  | "READ_ONLY"
  | "READ_AND_PROPOSE"
  | "SCOPED_WRITE"
  | "SENSITIVE_CONTROLLED"
  | "HUMAN_GATE"
```

The compatibility test must also prove that `McfEventType` continues to contain these gate events without reinterpreting the rest of the event union:

```ts
"GATE_REQUIRED"
"GATE_APPROVED"
"GATE_REJECTED"
```

The test must not import or assert the existence of these names as existing public contracts:

```text
McfColdStartRecoveryStatus
McfArtifactClaimType
McfGateType
McfGateStatus
```

Their absence on the live baseline is part of the characterization result, not a missing implementation requirement.

### 3.2 Existing behavioral controls that remain mandatory

The new compatibility test does not replace the current behavioral tests. The following existing tests remain required unchanged:

```text
apps/rede-social-agentes/apps/server/src/mcf-runtime/continuity-recovery.service.test.ts
apps/rede-social-agentes/apps/server/src/mcf-runtime/human-delegation-guard.test.ts
apps/rede-social-agentes/apps/server/src/mcf-runtime/production-authorization.service.test.ts
apps/rede-social-agentes/apps/server/src/mcf-runtime/canonical-external-action-ledger.integration.test.ts
apps/rede-social-agentes/apps/server/src/mcf-runtime/bound-staging-deploy-reconciliation.service.test.ts
apps/rede-social-agentes/ops/production-authorization-resolver.test.mjs
apps/rede-social-agentes/ops/production-promotion-policy.test.mjs
```

The continuity characterization must preserve these current properties:

```text
exact compatible live state -> FAST_RESUME
explainable live drift -> RECONCILE
missing/invalid authoritative state -> RECOVER_MCF_PROJECT
repository identity mismatch -> RECOVER_MCF_PROJECT
unexplained material divergence -> RECOVER_MCF_PROJECT
prior chat transcript/memory is not required for verified resume
```

### 3.3 New Context Fabric contracts remain isolated

The original new Context Fabric literals remain planned, with distinct names:

```ts
McfContextClaimType ===
  | "IDENTITY"
  | "NORMATIVE"
  | "OPERATIONAL"
  | "DERIVED"

McfContextFreshness ===
  | "DURABLE"
  | "SNAPSHOT"
  | "LIVE_REQUIRED"
  | "DERIVED"

McfContextRecoveryState ===
  | "RECOVERED"
  | "PARTIAL_RECOVERY"
  | "AMBIGUOUS_CONTEXT"
  | "SOURCE_UNAVAILABLE"
  | "INVALID_CONTEXT"
  | "DRIFT_DETECTED"
  | "RECONCILIATION_REQUIRED"
```

The candidate interfaces remain:

```text
McfProjectRegistryEntry
McfProjectCapsule
McfTruthClaim
McfContextRecoveryReceipt
```

These are new additive Context Fabric contracts. They must not reinterpret existing runtime mission, continuity, gate, authorization, artifact or evidence semantics.

---

## 4. Corrected RED expectation for Task 1

The original Task 1 RED sequence remains, but its expected result is corrected:

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/contracts test -- mcf-context.test.ts mcf-runtime.compatibility.test.ts
pnpm --filter @rsa/contracts typecheck
```

Expected before implementing `mcf-context.ts`:

- current-runtime compatibility assertions compile/pass against the actual live public surface;
- the new Context Fabric test/typecheck fails only because `./mcf-context.js` and its new exports do not yet exist;
- any failure in current-runtime compatibility means the baseline moved and Gate 0 must be rerun before coding.

No RED expectation may depend on a nonexistent legacy public type.

---

## 5. Dependency delta remains gated

Task 4 remains additive and must not be silently widened. The planned direct YAML parser dependency remains behind the existing Production Readiness controls.

Before execution, the exact dependency version must be revalidated against the then-current lockfile/package state. The planned command remains non-executable until the full pre-implementation gate is satisfied:

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server add yaml@2.8.1 --save-exact
```

A different selected version requires a plan correction before implementation. The dependency change must still pass frozen install, `pnpm audit --prod`, typecheck, tests and build.

---

## 6. Forbidden surfaces remain forbidden

This correction does not add any current runtime surface to the first implementation boundary. The following remain untouched by CF-0 + minimal CF-1 implementation unless separately re-reviewed and authorized:

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

Mission Control, Governance v2 activation, database/cache canonicalization, provider mutation, release publication and production changes remain out of scope.

---

## 7. Gate state after this correction

This amendment only removes the identified planning-baseline mismatch. It does not itself produce an audit PASS.

```text
PLAN_COMPLETE                         = true
PLAN_BASELINE_CORRECTED               = true
CURRENT_BEHAVIOR_MATRIX_CLOSED        = true
PRE_IMPLEMENTATION_AUDIT_PASS         = pending rerun
SEPARATE_IMPLEMENTATION_AUTHORIZATION = false
IMPLEMENTATION_MAY_BEGIN              = false
```

The next permitted action is to rerun Gate 0 against the then-current trusted `main`. Only a fresh `PRE_IMPLEMENTATION_AUDIT_PASS` with zero unresolved `BLOCKED` rows can make the planning package eligible for a separate implementation-authorization decision.
