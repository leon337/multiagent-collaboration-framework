# Context Fabric CF-0 + Minimal CF-1 Implementation Plan

> **For OpenAI:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **HARD STOP:** `superpowers:executing-plans` MUST NOT be invoked until the mandatory pre-implementation compatibility audit has produced `PRE_IMPLEMENTATION_AUDIT_PASS` **and** LEANDRO has separately authorized implementation.

**Goal:** Introduce the smallest repository-native Context Fabric boundary that can deterministically recover the MCF project identity and a validated project snapshot from canonical Git-versioned sources, normalize context claims with provenance/freshness semantics, and emit a Context Recovery Receipt without changing existing MCF runtime, governance, provider, production, mission, or deployment behavior.

**Architecture:** Additive **Federated Context Kernel**. Canonical identity/configuration lives in Git (`context/projects/*` and project-local `.mcf/project-capsule.yaml`). Shared Context Fabric contract types live in `@rsa/contracts`. A new isolated server-side `mcf-context` module loads and validates repository-native sources, resolves one registered project, normalizes claims, and returns a recovery outcome/receipt. It is deliberately not wired into existing production routes, mission execution, provider mutation, deployment workflows, Mission Control, or database state in this boundary.

**Tech Stack:** TypeScript 6, Node.js 24.18, pnpm 11, Vitest 4, AJV 8, YAML 2.x, existing `@rsa/contracts` and `@rsa/server` packages, JSON Schema, GitHub Actions production-readiness CI.

**Planning status:** `PLAN_PROPOSED_PRE_AUDIT`  
**Implementation authorized:** `false`  
**Production authorized:** `false`  
**Design:** `docs/superpowers/specs/2026-08-20-context-fabric-federated-kernel-design.md`  
**Mission:** Issue #147  
**Design PR:** #148  
**Plan branch:** `planning/mcf-context-fabric-cf0-cf1`  
**Plan base:** `docs/mcf-architecture-convergence-001-context-fabric-design`

---

## 0. Non-negotiable execution gate

No code, schema, package, runtime, migration, workflow, provider, production, or deployment implementation task below is executable until all three conditions are true:

```text
PLAN_COMPLETE
    +
PRE_IMPLEMENTATION_AUDIT_PASS
    +
SEPARATE_IMPLEMENTATION_AUTHORIZATION
    =
IMPLEMENTATION_MAY_BEGIN
```

The audit is intentionally **before** implementation. It must compare this complete plan with the then-current MCF behavior and either certify compatibility or return the design/plan for correction.

### Gate 0A — Re-read live truth

Before auditing, re-read from the then-current trusted baseline:

- `docs/MCF-CURRENT-STATE.md`
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`
- `.github/workflows/mcf-production-readiness.yml`
- `.github/workflows/mcf-runtime-production-deploy.yml`
- `apps/rede-social-agentes/packages/contracts/src/mcf-runtime.ts`
- `apps/rede-social-agentes/packages/contracts/src/index.ts`
- `apps/rede-social-agentes/apps/server/package.json`
- `apps/rede-social-agentes/package.json`
- all current server files/tests that implement cold-start, resume-route, authorization, evidence/event, and production-promotion behavior identified by the audit.

Do not rely on the design-time baseline if `main` has moved.

### Gate 0B — Produce compatibility audit artifact

**Create during the audit, not during implementation:**

- `docs/audits/2026-08-20-context-fabric-pre-implementation-compatibility-audit.md`

The audit document must contain a matrix with these columns:

```text
Current behavior | Current owner/source | Planned touchpoint | Classification | Evidence/test | Residual risk
```

Allowed classifications:

- `PRESERVE`
- `INTENTIONAL_CHANGE`
- `NOT_TOUCHED`
- `BLOCKED`

At minimum, matrix rows must cover:

1. current `McfResumeRoute` semantics;
2. current `McfColdStartRecoveryStatus` semantics;
3. current `McfArtifactClaimType` semantics;
4. mission/phase/gate status semantics;
5. HUMAN_GATE and LÉO/LEANDRO authority boundaries;
6. exact-SHA authorization contracts;
7. event/evidence persistence behavior;
8. current runtime database/migration behavior;
9. current staging behavior;
10. current production promotion behavior;
11. provider mutation boundaries;
12. current deployment workflows;
13. current release-readiness behavior;
14. current package export compatibility;
15. current server startup and route graph;
16. current production build/runtime dependency set;
17. current documentation/current-state recovery expectations.

Expected classification for the first implementation boundary is overwhelmingly `PRESERVE` or `NOT_TOUCHED`. Any `INTENTIONAL_CHANGE` must be explicitly justified and independently authorized. Any `BLOCKED` result blocks implementation.

### Gate 0C — Characterization-test map

The audit must identify the exact existing/new tests that will preserve current behavior. At minimum it must require:

- `apps/rede-social-agentes/packages/contracts/src/mcf-runtime.compatibility.test.ts` — compile-time/runtime characterization of existing public MCF runtime literal contracts;
- existing production/deploy contract tests identified from the live repository — unchanged and required green;
- existing server tests covering authorization, event/evidence, recovery/resume, and provider mutation identified from the live repository — unchanged and required green;
- new Context Fabric tests listed below — isolated from existing runtime behavior.

If the exact current server test paths cannot be proven from live repository evidence, the audit is incomplete and must not pass.

### Gate 0D — Audit decision

The audit may end only in one of:

- `PRE_IMPLEMENTATION_AUDIT_PASS`
- `PRE_IMPLEMENTATION_AUDIT_BLOCKED`

`PASS` requires:

- zero unresolved `BLOCKED` rows;
- no undocumented `INTENTIONAL_CHANGE`;
- all touched current behaviors mapped to characterization/regression coverage;
- planned dependency/schema changes confirmed additive or migration-safe;
- Mission Control/runtime cache/database confirmed non-canonical for this boundary;
- provider mutation/production/release semantics confirmed untouched;
- LEANDRO/LÉO authority and fail-closed semantics confirmed preserved.

If blocked, revise this plan and/or the design spec, re-review the changed design if material, and repeat Gate 0 before implementation.

---

# Implementation tasks — BLOCKED until Gate 0 PASS + separate authorization

## Task 1: Lock existing MCF contracts and add isolated Context Fabric contract types

**Files:**

- Create: `apps/rede-social-agentes/packages/contracts/src/mcf-runtime.compatibility.test.ts`
- Create: `apps/rede-social-agentes/packages/contracts/src/mcf-context.test.ts`
- Create: `apps/rede-social-agentes/packages/contracts/src/mcf-context.ts`
- Modify: `apps/rede-social-agentes/packages/contracts/src/index.ts`

### Step 1: Write the failing tests first

`mcf-runtime.compatibility.test.ts` must characterize the existing public type surface without modifying `mcf-runtime.ts`. Use compile-time equality helpers to lock at least:

```ts
McfResumeRoute === "NORMAL_FLOW" | "INVESTIGATION"
McfColdStartRecoveryStatus === "RECOVERED" | "AMBIGUOUS_CONTINUITY"
McfArtifactClaimType === "OBSERVED" | "DERIVED"
McfGateType === "HUMAN_GATE" | "AGENT_GATE"
McfGateStatus === "PENDING" | "APPROVED" | "REJECTED"
```

`mcf-context.test.ts` must import types that do not yet exist and assert the new Context Fabric literals are **distinct** from existing runtime/artifact contracts:

```ts
McfContextClaimType === "IDENTITY" | "NORMATIVE" | "OPERATIONAL" | "DERIVED"
McfContextFreshness === "DURABLE" | "SNAPSHOT" | "LIVE_REQUIRED" | "DERIVED"
McfContextRecoveryState ===
  | "RECOVERED"
  | "PARTIAL_RECOVERY"
  | "AMBIGUOUS_CONTEXT"
  | "SOURCE_UNAVAILABLE"
  | "INVALID_CONTEXT"
  | "DRIFT_DETECTED"
  | "RECONCILIATION_REQUIRED"
```

Also assert candidate interfaces for:

- `McfProjectRegistryEntry`
- `McfProjectCapsule`
- `McfTruthClaim`
- `McfContextRecoveryReceipt`

The new test should fail because `./mcf-context.js` and its exports do not exist yet.

### Step 2: Run RED

Run:

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/contracts test -- mcf-context.test.ts mcf-runtime.compatibility.test.ts
pnpm --filter @rsa/contracts typecheck
```

Expected:

- new Context Fabric test/typecheck fails on missing `mcf-context` exports;
- compatibility assertions against existing `mcf-runtime.ts` compile/pass.

If an existing compatibility assertion fails, stop: the plan assumptions are stale and Gate 0 must be revisited.

### Step 3: Implement minimal contract types

Create `mcf-context.ts` with only data contracts and literal unions. Do not import from or rewrite `mcf-runtime.ts` unless a stable primitive type is intentionally reused and the audit explicitly permits it.

Use distinct names so the new architecture does not silently reinterpret old contracts:

```ts
export type McfContextClaimType =
  | "IDENTITY"
  | "NORMATIVE"
  | "OPERATIONAL"
  | "DERIVED";

export type McfContextFreshness =
  | "DURABLE"
  | "SNAPSHOT"
  | "LIVE_REQUIRED"
  | "DERIVED";
```

Define the approved recovery-state union and minimal interfaces matching the approved design.

Modify `src/index.ts` only to add:

```ts
export * from "./mcf-context.js";
```

Do not remove, rename, or reorder semantics of existing `mcf-runtime` exports.

### Step 4: Run GREEN

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/contracts test -- mcf-context.test.ts mcf-runtime.compatibility.test.ts
pnpm --filter @rsa/contracts typecheck
pnpm --filter @rsa/contracts build
```

Expected: all pass.

### Step 5: Commit

```bash
git add apps/rede-social-agentes/packages/contracts/src/mcf-context.ts \
        apps/rede-social-agentes/packages/contracts/src/mcf-context.test.ts \
        apps/rede-social-agentes/packages/contracts/src/mcf-runtime.compatibility.test.ts \
        apps/rede-social-agentes/packages/contracts/src/index.ts
git commit -m "feat(context): add isolated context fabric contracts"
```

---

## Task 2: Add canonical JSON Schemas with contract validation

**Files:**

- Create: `schemas/context/project-registry-entry.schema.json`
- Create: `schemas/context/project-capsule.schema.json`
- Create: `schemas/context/truth-contract.schema.json`
- Create: `schemas/context/context-recovery-receipt.schema.json`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/context-schema.validator.test.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/context-schema.validator.ts`

### Step 1: Write failing schema tests

The tests must load the four schemas from the repository root and validate them with the server's existing direct `ajv@8.20.0` dependency.

Test at least:

1. minimal valid Registry entry;
2. Registry rejects missing stable `project.id`;
3. Capsule rejects project-id mismatch/missing `observed_at` for snapshot state;
4. Truth Contract accepts each approved claim/freshness literal;
5. Truth Contract rejects an existing artifact claim literal such as `OBSERVED` as a Context Fabric claim type;
6. Receipt accepts evidence references and recovery outcome;
7. Receipt does not define itself as a truth source field/owner.

Tests should initially fail because the schema files and validator do not exist.

### Step 2: Run RED

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server test -- context-schema.validator.test.ts
```

Expected: fail on missing validator/schema files.

### Step 3: Implement minimal schemas and validator

Use JSON Schema 2020-12-compatible AJV configuration already compatible with repository dependencies. Keep schemas additive and under the approved root paths.

`context-schema.validator.ts` responsibilities:

- load/compile a supplied schema;
- validate plain parsed objects;
- return deterministic validation errors without mutating data;
- contain no provider/network/database access.

Do not add schema migrations or modify `schemas/mcf-current-state.schema.json`.

### Step 4: Run GREEN

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server test -- context-schema.validator.test.ts
pnpm --filter @rsa/server typecheck
```

Expected: pass.

### Step 5: Commit

```bash
git add schemas/context \
        apps/rede-social-agentes/apps/server/src/mcf-context/context-schema.validator.ts \
        apps/rede-social-agentes/apps/server/src/mcf-context/context-schema.validator.test.ts
git commit -m "feat(context): add context fabric schemas"
```

---

## Task 3: Add the MCF Registry entry and project-local Capsule as canonical fixtures

**Files:**

- Create: `context/projects/multiagent-collaboration-framework.yaml`
- Create: `.mcf/project-capsule.yaml`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-context-fixtures.test.ts`

### Step 1: Write failing fixture tests

Tests must assert:

- Registry `project.id` is `multiagent-collaboration-framework`;
- Registry canonical repository points to `leon337/multiagent-collaboration-framework`;
- aliases include `MCF`;
- Capsule `project_id` matches Registry `project.id`;
- Capsule points to `docs/MCF-CURRENT-STATE.md` as a recovery source;
- operational fields are represented as snapshot data, not implicit live truth;
- both files validate against Task 2 schemas;
- no fixture claims current provider health/deployment state without `LIVE_REQUIRED` verification.

The test should fail because the two YAML files do not exist.

### Step 2: Run RED

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server test -- mcf-context-fixtures.test.ts
```

Expected: missing canonical fixture files.

### Step 3: Create minimal canonical data

Create the Registry and Capsule using the then-current state confirmed by Gate 0. Do **not** copy stale illustrative values from the design spec.

The Capsule must stay compact. It may include current workstream/status only as a timestamped snapshot with explicit sources. Do not encode provider state as durable truth.

### Step 4: Run GREEN

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server test -- mcf-context-fixtures.test.ts context-schema.validator.test.ts
```

Expected: pass.

### Step 5: Commit

```bash
git add context/projects/multiagent-collaboration-framework.yaml \
        .mcf/project-capsule.yaml \
        apps/rede-social-agentes/apps/server/src/mcf-context/mcf-context-fixtures.test.ts
git commit -m "feat(context): register the MCF project capsule"
```

---

## Task 4: Add repository-native YAML loading without changing server startup

**Files:**

- Modify: `apps/rede-social-agentes/apps/server/package.json`
- Modify: `apps/rede-social-agentes/pnpm-lock.yaml`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/repository-context-source.test.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/repository-context-source.ts`

### Dependency constraint

Use a **direct** `yaml` dependency for `@rsa/server`; do not rely on an undeclared transitive package.

Before executing this task, Gate 0 must confirm the dependency change is `PRESERVE`/additive and record the exact selected version. The implementation command is then:

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server add yaml@2.8.1 --save-exact
```

If the audited/approved dependency version differs, update this plan before executing; do not silently substitute versions.

### Step 1: Write failing loader tests

Test pure filesystem-backed behavior using temporary fixture directories; do not require network/database/provider access.

Cases:

- load Registry YAML by explicit path;
- load Capsule YAML by Registry `capsule_path`;
- return structured `INVALID_CONTEXT`-class error data for malformed YAML;
- reject path traversal outside the supplied repository root;
- preserve raw source reference/path and source revision input for provenance;
- no writes to canonical files.

### Step 2: Run RED

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server test -- repository-context-source.test.ts
```

Expected: fail because source loader does not exist.

### Step 3: Add direct parser dependency

Run the audited exact command above, then verify only `apps/server` importer/package metadata and lockfile dependency graph changed.

### Step 4: Implement minimal read-only loader

`repository-context-source.ts` must:

- accept an explicit repository root;
- normalize/contain paths under that root;
- read UTF-8 only;
- parse YAML;
- return parsed object plus source metadata;
- perform no database/network/provider access;
- perform no file writes;
- expose no Nest route/controller/module wiring in this boundary.

### Step 5: Run GREEN

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server test -- repository-context-source.test.ts
pnpm --filter @rsa/server typecheck
```

Expected: pass.

### Step 6: Commit

```bash
git add apps/rede-social-agentes/apps/server/package.json \
        apps/rede-social-agentes/pnpm-lock.yaml \
        apps/rede-social-agentes/apps/server/src/mcf-context/repository-context-source.ts \
        apps/rede-social-agentes/apps/server/src/mcf-context/repository-context-source.test.ts
git commit -m "feat(context): add read-only repository context loader"
```

---

## Task 5: Implement deterministic single-project resolution

**Files:**

- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/project-resolver.test.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/project-resolver.ts`

### Step 1: Write failing resolver tests

Cases:

- exact `project_id` resolves;
- canonical repository name resolves;
- alias `MCF` resolves case-insensitively under documented normalization;
- one alias maps to one project -> resolved;
- duplicate/equally strong alias candidates -> `AMBIGUOUS_CONTEXT`;
- unknown input -> no inferred canonical identity;
- repository rename does not change `project_id` when Registry identity remains stable.

No chat-history, model-memory, Mission Control, database, or network dependency is allowed in the resolver.

### Step 2: Run RED

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server test -- project-resolver.test.ts
```

Expected: fail because resolver does not exist.

### Step 3: Implement minimal resolver

Inputs:

- parsed Registry entries;
- explicit user/project hint string.

Output:

- resolved stable `project_id` + matched evidence; or
- deterministic ambiguity/not-found outcome.

Do not auto-register repositories. `DISCOVERABLE -> CANDIDATE -> REGISTERED` registration and LÉO gate behavior are outside this first runtime implementation boundary.

### Step 4: Run GREEN

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server test -- project-resolver.test.ts
pnpm --filter @rsa/server typecheck
```

Expected: pass.

### Step 5: Commit

```bash
git add apps/rede-social-agentes/apps/server/src/mcf-context/project-resolver.ts \
        apps/rede-social-agentes/apps/server/src/mcf-context/project-resolver.test.ts
git commit -m "feat(context): add deterministic project resolver"
```

---

## Task 6: Implement minimal Truth Contract normalization and freshness policy

**Files:**

- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/truth-contract.test.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/truth-contract.ts`

### Step 1: Write failing tests

Cases:

- Registry identity normalizes to `IDENTITY + DURABLE` with provenance;
- Capsule operational snapshot normalizes to `OPERATIONAL + SNAPSHOT` with `observed_at`;
- explicitly derived values require input provenance;
- `LIVE_REQUIRED` is marked as requiring verifier input and is not silently accepted as current;
- latest timestamp does not override a higher-authority normative/identity owner;
- unresolved authoritative conflict returns `RECONCILIATION_REQUIRED` metadata;
- existing `McfArtifactClaimType = "OBSERVED" | "DERIVED"` is not reinterpreted as Context Fabric truth-claim semantics.

### Step 2: Run RED

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server test -- truth-contract.test.ts
```

Expected: fail because normalizer/policy does not exist.

### Step 3: Implement minimal pure functions

No provider adapter yet. Implement only:

- normalization from trusted Registry/Capsule fields;
- freshness classification;
- provenance preservation;
- conflict-classification rules required for local inputs;
- explicit `requiresLiveVerification` marker for `LIVE_REQUIRED`.

Do not fetch GitHub/Render/Supabase/Redis/Postgres here.

### Step 4: Run GREEN

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server test -- truth-contract.test.ts
pnpm --filter @rsa/server typecheck
```

Expected: pass.

### Step 5: Commit

```bash
git add apps/rede-social-agentes/apps/server/src/mcf-context/truth-contract.ts \
        apps/rede-social-agentes/apps/server/src/mcf-context/truth-contract.test.ts
git commit -m "feat(context): normalize context truth contracts"
```

---

## Task 7: Implement the minimal repository-only recovery engine and Receipt

**Files:**

- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/context-recovery.service.test.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-context/context-recovery.service.ts`

### Step 1: Write failing recovery tests

The primary acceptance scenario is a clean recovery with:

```text
no chat memory
no runtime cache
no Mission Control
no database requirement
no provider mutation
```

Test cases:

1. `MCF` resolves Registry → Capsule → normalized claims → `RECOVERED` receipt for durable/snapshot-only read context;
2. receipt records Registry/Capsule source refs and source revision inputs;
3. receipt is evidence only and is never read as an input source by the service;
4. ambiguous project -> `AMBIGUOUS_CONTEXT`;
5. schema failure -> `INVALID_CONTEXT`;
6. required live claim with no verifier -> `SOURCE_UNAVAILABLE` for a material-current request;
7. same unavailable live claim may yield `PARTIAL_RECOVERY` for explicitly read-only reasoning when enough durable context remains;
8. authoritative conflict -> `RECONCILIATION_REQUIRED`;
9. recovery works after deleting any test-local cache because no cache is required;
10. project identity remains stable when canonical repository locator changes in fixture input.

### Step 2: Run RED

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server test -- context-recovery.service.test.ts
```

Expected: fail because recovery service does not exist.

### Step 3: Implement the smallest orchestration service

The service composes only the new isolated Context Fabric helpers:

```text
project hint
  -> Registry load
  -> resolve project_id
  -> Capsule load
  -> schema validation
  -> truth normalization
  -> freshness assessment
  -> local conflict classification
  -> recovery outcome
  -> Context Recovery Receipt
```

Constraints:

- no route/controller registration;
- no change to existing Nest application module graph;
- no DB migration/table;
- no Redis/cache dependency;
- no event-ledger write yet;
- no provider live adapter yet;
- no production/deploy integration;
- no Mission Control dependency;
- no replacement of current MCF cold-start/resume logic.

The first kernel is a callable isolated service/library only.

### Step 4: Run GREEN

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server test -- \
  context-recovery.service.test.ts \
  project-resolver.test.ts \
  repository-context-source.test.ts \
  truth-contract.test.ts \
  context-schema.validator.test.ts \
  mcf-context-fixtures.test.ts
pnpm --filter @rsa/server typecheck
```

Expected: pass.

### Step 5: Commit

```bash
git add apps/rede-social-agentes/apps/server/src/mcf-context/context-recovery.service.ts \
        apps/rede-social-agentes/apps/server/src/mcf-context/context-recovery.service.test.ts
git commit -m "feat(context): add repository-only recovery kernel"
```

---

## Task 8: Full regression verification — prove no current MCF behavior was broken

**Files:**

- Modify only if evidence requires documentation updates: `docs/MCF-CURRENT-STATE.md`
- Update audit evidence only after tests: `docs/audits/2026-08-20-context-fabric-pre-implementation-compatibility-audit.md`

Do not change workflows merely to make CI pass. A workflow change is outside this first boundary unless separately reviewed/authorized.

### Step 1: Run targeted old/new contract regression

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/contracts test -- mcf-runtime.compatibility.test.ts mcf-context.test.ts
pnpm --filter @rsa/server test -- mcf-context
```

If Vitest filename filtering does not accept `mcf-context`, run the six explicit test filenames from Tasks 2–7.

Expected: all pass.

### Step 2: Run complete workspace verification

```bash
cd apps/rede-social-agentes
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: all pass.

### Step 3: Confirm forbidden surfaces are untouched

From repository root:

```bash
git diff --name-only <implementation-base>...HEAD
```

Expected **no implementation changes** under:

```text
.github/workflows/mcf-runtime-production-deploy.yml
apps/rede-social-agentes/packages/database/
apps/rede-social-agentes/apps/server/src/mcf-runtime/   # except a separately audited characterization test if Gate 0 explicitly required it
provider/deploy mutation adapters
Mission Control implementation paths
```

Also verify there are no migration files and no production/provider credentials or configuration changes.

### Step 4: Require existing production-readiness CI green

The PR must pass the existing `MCF Production Readiness` workflow, including:

- frozen dependency install;
- production dependency audit;
- format;
- lint;
- typecheck;
- migrations twice;
- full tests;
- build;
- backup/isolated restore;
- release-readiness contract tests.

The Context Fabric implementation does not weaken or bypass that workflow.

### Step 5: Reconcile the compatibility matrix

Append implementation evidence to the audit artifact without changing the original pre-implementation decision. Every planned `PRESERVE` item must have passing evidence. Any unexpected behavioral delta becomes a new blocker and must be corrected before merge consideration.

### Step 6: Independent architectural/regression audit

Emily performs an independent audit of:

- implementation vs approved design;
- implementation vs pre-implementation matrix;
- no silent canonical-truth duplication;
- no authority/gate regression;
- no runtime/provider/production coupling outside scope;
- no stale Receipt treated as truth;
- no current `mcf-runtime` contract reinterpretation.

Implementation cannot be declared complete on self-review alone.

### Step 7: Commit evidence/docs only if needed

```bash
git add docs/audits/2026-08-20-context-fabric-pre-implementation-compatibility-audit.md docs/MCF-CURRENT-STATE.md
git commit -m "docs: record context fabric regression evidence"
```

Only include `docs/MCF-CURRENT-STATE.md` if the implemented boundary materially changes current implemented state and the audit confirms the update is necessary.

---

## Explicitly deferred work

The following must **not** be pulled into this implementation PR:

- CF-2 live provider adapters;
- Render/Supabase/Redis/Postgres current-state fetchers;
- automated Capsule mutation/reconciliation PR creation;
- event-ledger persistence of receipts;
- CF-3 runtime cache/index/materialized projection;
- Capability Registry;
- Project/Capability/Knowledge graphs;
- Mission Control UI or command plane;
- Governance v2 activation/merge;
- methodology selection/repin changes;
- HUMAN_GATE redesign;
- production promotion changes;
- release publication;
- database migrations.

Each requires its own later mission/boundary and applicable gates.

---

## Final acceptance checklist for this plan

Before implementation may even start:

- [ ] this plan is complete and reviewed;
- [ ] live baseline has been re-read;
- [ ] pre-implementation audit artifact exists;
- [ ] compatibility matrix covers all material current behavior;
- [ ] audit result is `PRE_IMPLEMENTATION_AUDIT_PASS`;
- [ ] zero unresolved `BLOCKED` rows;
- [ ] separate LEANDRO implementation authorization exists.

Before implementation may be considered complete:

- [ ] existing MCF public runtime contracts remain compatible;
- [ ] Context Fabric contract names are isolated from old artifact/runtime semantics;
- [ ] schemas validate canonical Registry/Capsule/Truth/Receipt shapes;
- [ ] MCF Registry/Capsule recover from repository only;
- [ ] ambiguous context fails closed;
- [ ] unverified `LIVE_REQUIRED` material state fails closed;
- [ ] read-only partial recovery is explicit, not silent;
- [ ] Receipt is evidence, never truth;
- [ ] no database/cache/Mission Control canonical dependency exists;
- [ ] no provider/production/deployment semantics changed;
- [ ] full workspace verification is green;
- [ ] existing Production Readiness CI is green;
- [ ] independent Emily audit passes;
- [ ] current-state documentation is reconciled only if actually required.

## Execution handoff

Once — and only once — the pre-implementation audit has passed and LEANDRO separately authorizes implementation, use `superpowers:executing-plans` to execute Tasks 1–8 in order, preserving the RED → minimal GREEN → regression → commit sequence for each implementation task.

Until those gates exist, the correct next action is **the pre-implementation compatibility/regression audit**, not coding.
