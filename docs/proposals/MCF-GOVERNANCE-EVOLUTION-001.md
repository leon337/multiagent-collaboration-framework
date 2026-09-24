# MCF-GOVERNANCE-EVOLUTION-001 — Governance Evolution, Versioning and Cold-Start v2

**Status:** `PROPOSED_V2 — REDESIGNED_AFTER_DUAL_AUDIT — NOT_CURRENT — NOT_IMPLEMENTATION_AUTHORIZED`  
**Repository:** `leon337/multiagent-collaboration-framework`  
**Baseline branch:** `main`  
**Original baseline SHA:** `5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`  
**Proposal PR:** `#142`  
**Risk class:** `C`  
**Human authority:** `LEANDRO`  
**Operational authority:** `LÉO`  
**Coordinator:** `MESTRE`  
**Independent audit synthesis:** `docs/proposals/MCF-GOVERNANCE-EVOLUTION-001-AUDIT-SYNTHESIS.md`

> This document is still a proposal. It is not current methodology, does not authorize implementation, does not authorize merge, release or production, and MUST NOT supersede current governance merely by existing in a branch or pull request.

---

## 1. Why v2 exists

The v1 proposal was independently audited twice against the same repository state.

- GPT verdict: `REDESIGN_REQUIRED`.
- Claude verdict: `APPROVE_WITH_CHANGES`.

The combined decision accepts the architectural direction but not the v1 contract as implementation-ready.

The v2 redesign incorporates the conservative union of both audits while preserving the original principle:

```text
REUSE_BEFORE_NEW_PRIMITIVE
EXTEND_BEFORE_REPLACE
VERSION_BEFORE_BREAK
FAIL_CLOSED_BEFORE_GUESSING
```

The complete consolidated finding matrix is maintained in the audit synthesis companion document.

---

## 2. Problem statement

The MCF already contains strong but distributed primitives for continuity and compatibility:

- `methodologyPin`;
- explicit `schemaVersion` on newer artifacts;
- transferable checkpoints;
- `MCF-RECOVER-CONTEXT`;
- `ContinuityRecoveryService` with `FAST_RESUME`, `RECONCILE` and `RECOVER_MCF_PROJECT`;
- Git SHA baselines;
- PRF, audit and HUMAN_GATE boundaries;
- migration/compatibility rules preserving legacy projects;
- live GitHub/provider precedence over stale volatile documentation.

The missing contract is how the **MCF itself evolves** without creating methodology ambiguity or allowing conversational memory, provider automation, concurrent missions or stale documentation to silently override governed state.

The redesign must answer:

1. what is versioned and why;
2. how an MCF change is proposed, validated, audited and activated;
3. how concurrent missions reconcile against exact baselines;
4. how `owner/repo` cold-start becomes deterministic;
5. how methodology identity is proved rather than merely named;
6. how legacy projects remain valid;
7. how runtime rollback remains compatible with pinned methodology/contracts/schemas;
8. how every reserved external effect is technically closed behind equivalent governance;
9. how release, `main`, methodology and production can differ without a misleading global `CURRENT`.

---

## 3. Explicit non-duplication boundary

This proposal MUST NOT create:

- a second checkpoint engine;
- a second continuity/recovery engine;
- a parallel methodology state database;
- a second event ledger;
- a competing project/mission registry;
- a second permission/HUMAN_GATE engine;
- a second reconciliation runtime.

Expected foundation:

```text
Git / provider live state
+ existing methodologyPin concept
+ existing checkpoints
+ MCF-RECOVER-CONTEXT
+ ContinuityRecoveryService.RECONCILE
+ PRF / decisions / audit
+ release/current-state documentation
```

New governance must be an extension and qualification of these primitives.

---

## 4. Currentity is axis-specific — no global `CURRENT`

The v1 proposal used one lifecycle state named `CURRENT`. Independent audit showed that this collapses identities that can legitimately diverge.

The redesign therefore defines separate currentity questions:

```yaml
currentity_axes:
  methodology_for_new_work:
    meaning: default methodology boundary for newly started eligible work

  main_implementation:
    meaning: exact implementation currently at repository main

  stable_release:
    meaning: exact published stable release identity

  production_deployment:
    meaning: exact implementation SHA currently deployed in production

  protocol_contract_identity:
    meaning: explicit protocol/contract versions applicable to an artifact or mission

  artifact_schema_identity:
    meaning: explicit schema version applicable to each serialized artifact family
```

These values may differ without contradiction.

Example:

```text
methodology_for_new_work = 1.2.0
main_implementation      = SHA-B
stable_release           = v1.2.1@SHA-C
production_deployment    = v1.1.4@SHA-D
```

No single field named `CURRENT` may be used to collapse those states.

Projects already pinned to an older methodology remain governed by their valid pins until an explicit upgrade boundary is completed.

---

## 5. Version taxonomy and bump matrix

Version dimensions are independent:

```text
A. FRAMEWORK RELEASE VERSION
B. METHODOLOGY VERSION
C. PROTOCOL / CONTRACT VERSION
D. ARTIFACT SCHEMA VERSION
E. IMMUTABLE IMPLEMENTATION REF (Git SHA)
```

### 5.1 Framework release

Framework releases use semantic versioning:

```text
PATCH
→ implementation/documentation fix with no new externally governed behavior or contract break

MINOR
→ backward-compatible framework capability

MAJOR
→ breaking framework behavior or public contract compatibility break
```

### 5.2 Methodology version

Methodology version is independent of release version:

```text
PATCH
→ clarification/correction that does not change governed decisions, permissions, required evidence or lifecycle semantics

MINOR
→ additive backward-compatible governed rule/capability for new work

MAJOR
→ breaking change to authority, gates, required evidence, lifecycle semantics or compatibility expectations
```

A framework release does not automatically repin methodology.

### 5.3 Protocol/contract and artifact schema versions

Protocol/contract and artifact schema versions advance only when their own serialized or behavioral contracts change.

Existing values such as `1.0` and `1.1` remain historically valid. The v2 proposal does not rewrite legacy artifacts to add missing patch components.

### 5.4 Change-impact matrix

Every MCF evolution must classify its impact before integration:

| Change type | Framework release | Methodology | Protocol/contract | Schema | Project repin |
|---|---|---|---|---|---|
| Docs typo / non-semantic clarification | PATCH if released | unchanged | unchanged | unchanged | no |
| Backward-compatible runtime capability | MINOR | unchanged unless governance behavior changes | maybe | maybe | no by default |
| Additive governance rule for new work | at least MINOR | MINOR | maybe | maybe | new work uses new default; old pins preserved |
| Breaking governance/authority rule | MAJOR | MAJOR | as required | as required | explicit upgrade boundary |
| Additive optional serialized field | at least MINOR if public capability | unchanged unless semantics change | MINOR where applicable | MINOR | no silent migration |
| Breaking serialized contract | MAJOR | maybe | MAJOR | MAJOR | explicit migration/upgrade boundary |

When uncertain, the change is not classified downwards automatically. It routes to reconciliation/audit.

No new schema evolution should be qualified before this matrix is accepted as governance.

---

## 6. Methodology identity must be resolvable

`methodologyPin` remains the existing primitive, but v2 requires semantic verification before the pin is treated as authoritative.

Target identity contract:

```yaml
methodology_identity:
  version: <methodology semantic version>
  repository:
    stable_identity: <repository id or equivalent verified identity>
    full_name: <owner/repo at capture time>
  immutable_git_object:
    commit_sha: <exact immutable commit>
  canonical_methodology_artifact:
    path: <canonical methodology manifest/document path>
    content_digest: <sha256 or equivalent>
```

This is a design requirement, not an authorization to change schemas now.

Validation invariant:

```text
STRING_EQUALITY_ONLY != VERIFIED_METHODOLOGY_IDENTITY
```

A pin is not authoritative unless its repository identity, immutable Git object and methodology artifact/digest are resolvable and mutually consistent.

Unresolvable or conflicting pin state must fail closed to `RECONCILE` or `RECOVER_MCF_PROJECT` according to existing recovery semantics.

---

## 7. Legacy discriminator — prevent silent v1.1 downgrade

Legacy compatibility remains required:

```text
NO_MASS_MIGRATION
NO_SILENT_UPGRADE
NO_HISTORICAL_REWRITE
EXPLICIT_UPGRADE_BOUNDARY
LEGACY_SUPPORT_REQUIRED
```

However, absence of an explicit v1.1 discriminator must not automatically mean “pure legacy” when v1.1-only fields are present.

Required rule:

```text
PURE_V1_0_ARTIFACT
→ legacy path allowed

ANY_V1_1_ONLY_METADATA_PRESENT
AND discriminator absent/incompatible
→ RECONCILE or REJECT FAIL-CLOSED
```

This prevents a partially serialized/corrupted v1.1 contract from silently bypassing v1.1 guards.

---

## 8. Governance lifecycle is derived, not a second state engine

The v2 lifecycle remains useful as a human-readable classification, but it MUST be derived from existing PRF, GitHub/provider facts, validation evidence, independent audit and explicit authority decisions.

```text
PROPOSED
→ DESIGNED
→ VALIDATED
→ AUDITED
→ APPROVED_FOR_INTEGRATION
→ MERGED
→ QUALIFIED
→ ACTIVATED_FOR_APPLICABLE_AXIS
```

`ACTIVATED_FOR_APPLICABLE_AXIS` replaces global `CURRENT`.

### 8.1 Transition authority

| Derived state | Minimum evidence/authority |
|---|---|
| `PROPOSED` | proposal artifact + exact baseline; no activation authority |
| `DESIGNED` | design contract complete; no unresolved design blocker; MESTRE records status |
| `VALIDATED` | required unit/contract/integration evidence by Renato or applicable validator |
| `AUDITED` | independent Emily-equivalent audit against exact proposal SHA |
| `APPROVED_FOR_INTEGRATION` | LÉO gate within delegated scope; LEANDRO required for material MCF methodology/authority change or other reserved trigger |
| `MERGED` | GitHub fact only; never implies qualification or activation |
| `QUALIFIED` | exact merged SHA passes required qualification and evidence reconciliation |
| `ACTIVATED_FOR_APPLICABLE_AXIS` | explicit authority for the specific axis; methodology activation for new work requires LEANDRO when materially changing governance |

Provider signals such as `mergeable=true`, `mergeable_state=clean`, green CI or branch naming never substitute these governance decisions.

---

## 9. Exact baseline and real concurrent mission relationship

Every MCF-evolution mission must bind to an exact baseline:

```yaml
baseline:
  repository: leon337/multiagent-collaboration-framework
  branch: main
  sha: <EXACT_SHA>
```

The live repository already contains a real concurrent mission:

```text
Issue #141
MCF Mission Control — discovery
branch: planning/mcf-mission-control-discovery
baseline: main@5d79f488...
```

Relationship adopted by v2:

```yaml
issue_141_vs_pr_142:
  relationship: PARALLEL_DISCOVERY_WITH_SHARED_BASELINE
  issue_141_blocks_governance_design: false
  pr_142_blocks_mission_control_discovery: false
  competing_source_of_truth_or_governance_primitive: forbidden
  main_or_shared_contract_change: RECONCILIATION_REQUIRED
  integration_priority_by_recency_or_branch_name: forbidden
```

Issue #141 may continue discovery under its own authorization boundary, but neither mission may silently redefine shared methodology, checkpoint, recovery, event-ledger or authority primitives.

---

## 10. Drift classification extends existing `RECONCILE`

The v2 proposal does not create a second reconciliation engine.

When baseline `A != live main B`, the route is `RECONCILIATION_REQUIRED`.

Drift classification is evidence-driven:

```text
IRRELEVANT
→ changed surfaces do not affect touched paths, dependencies, contracts, authority, security or acceptance assumptions

COMPATIBLE
→ additive upstream change; no semantic conflict; required targeted regression passes

OVERLAPPING
→ shared paths/contracts/semantics changed; compatibility cannot be inferred automatically

CONFLICTING
→ new live state contradicts proposal semantics, invariant, authority or acceptance criteria

INVALIDATING
→ original safety, identity, production, compatibility or source-of-truth assumptions no longer hold
```

### 10.1 Authority

```text
IRRELEVANT / COMPATIBLE
→ LÉO may accept only with explicit evidence + required retest

OVERLAPPING
→ independent review + LÉO decision; escalate if material methodology/authority change

CONFLICTING / INVALIDATING
→ integration blocked; LEANDRO escalation when reserved/material

UNKNOWN
→ conservative default = OVERLAPPING / RECONCILE, never silent integration
```

### 10.2 TOCTOU protection

`main` must be re-read live:

- before reconciliation decision;
- immediately before integration gate;
- immediately before merge/integration action.

If the head moves again, reconciliation is repeated.

---

## 11. Cold-start is an extension of `MCF-RECOVER-CONTEXT`

The v2 proposal removes the idea of a separate `COLD_START_DISCOVERY` subsystem.

Instead, `MCF-RECOVER-CONTEXT` must eventually support a repository-only bootstrap input:

```yaml
repository_only_bootstrap:
  repository: owner/repo
```

No runtime/schema/skill change is authorized yet; this is the target contract.

### 11.1 Deterministic resolution algorithm

```text
owner/repo
  ↓
verify repository identity + default branch live
  ↓
read main live SHA
  ↓
read current-state map as guidance, never as replacement for live state
  ↓
enumerate relevant open PRs/issues/mission checkpoints/contracts
  ↓
classify each candidate by explicit status/evidence/baseline/gates
  ↓
exclude historical/superseded/closed work from active continuity
  ↓
keep Draft/PROPOSED work visible as active work but NEVER as current methodology
  ↓
resolve authoritative continuity candidate(s)
```

Forbidden selectors:

```text
branch name alone
latest modified branch alone
most recent chat memory
PR mergeability alone
self-declared CURRENT inside proposal content
```

### 11.2 Ambiguous continuity

If more than one candidate remains equally authoritative:

```text
AMBIGUOUS_CONTINUITY
→ return candidate set + evidence
→ do not guess
→ hand off precedence decision through existing authority path
```

Cold-start success therefore means deterministic recovery or explicit ambiguity, not “the model made a good guess”.

---

## 12. Blocking evidence references must be recoverable

A blocker, checkpoint or canonical finding used for continuity must be either:

1. self-contained enough to preserve the blocking fact; or
2. linked through an immutable repository ref + path + digest/identity sufficient for later resolution.

```text
BROKEN_BLOCKING_EVIDENCE_REF
→ NOT silently ignored
→ gap declared
→ fail closed / reconciliation
```

Historical branch deletion or movement must not erase the institutional meaning of a blocker.

---

## 13. External Effect Closure

Issue #140 exposed a broader architectural class: a provider-native automation can cause a reserved effect without crossing the MCF skill/gate that supposedly governs that effect.

New invariant:

> **Every path capable of causing a reserved external effect must be enumerated and either pass through equivalent governance enforcement or be technically disabled.**

This reuses existing permission/HUMAN_GATE/evidence concepts; it does not authorize a new permission engine.

Examples of reserved effects to evaluate where applicable:

```text
production deployment/promotion
public release/publication
credential-sensitive mutation
irreversible external write
provider-side destructive operation
```

A policy enforced only inside the MCF runtime is insufficient when GitHub/provider hooks can bypass it.

---

## 14. GOV-P0 — Issue #140 is independent urgent remediation

**Issue:** `#140 — [P1][GOV] Prevent production auto-deploy before LEANDRO HUMAN_GATE`

The audit confirmed that the production risk is not merely theoretical.

V2 therefore separates:

```text
A. GOVERNANCE DESIGN INVARIANT
MERGE_OR_MAIN_UPDATE != PRODUCTION_AUTHORIZATION

B. INDEPENDENT TECHNICAL REMEDIATION
Issue #140 must close the real provider path
```

Issue #140 may be remediated under a separate explicit authorization without waiting for this entire governance proposal to become active.

Required qualification of the production boundary:

```text
main update without matching LEANDRO production HUMAN_GATE
→ production MUST NOT move

exact stable release SHA + matching LEANDRO HUMAN_GATE
→ promotion MAY proceed

HUMAN_GATE for SHA A + target SHA B
→ DENY
```

Until this boundary is technically qualified:

```yaml
merge_pr_142_to_main: BLOCKED
release_from_pr_142: BLOCKED
production_from_pr_142: BLOCKED
```

This proposal itself does not authorize modifying `render.yaml`, branch protection, provider settings or production.

---

## 15. Runtime ↔ methodology compatibility and rollback

A runtime implementation SHA must eventually have an evidence-backed compatibility declaration:

```yaml
implementation_compatibility:
  implementation_sha: <exact sha>
  supports:
    methodology: <version/range>
    protocol_contracts: <version/ranges>
    artifact_schemas: <version/ranges>
```

A rollback target is acceptable only if it can correctly interpret the project’s still-active methodology/contracts/schemas.

```text
ROLLBACK_SHA incompatible with pinned semantics
→ DENY
→ RECONCILE
```

### 15.1 Methodology rollback

Methodology history is immutable.

A previously activated methodology is never rewritten to pretend it was not active.

If governance must return to prior semantics, create a new forward decision/version that supersedes the problematic methodology for applicable future work:

```text
methodology 1.2 activated
↓
problem discovered
↓
new methodology decision 1.2.1 or 1.3/2.0 as impact requires
↓
explicitly supersedes prior default
```

Historical project pins remain truthful and require explicit reconciliation/upgrade rules.

---

## 16. Current-state documentation reconciliation

Audit evidence shows that CURRENT-facing documentation can lag live `main`/release state.

V2 therefore defines GOV-5 as reconciliation of **current maps/indexes**, not historical rewriting.

```text
UPDATE
→ CURRENT-state maps, active version pointers, changelog/release indexes as applicable

PRESERVE
→ historical decisions, old proposals, old checkpoints, publication evidence
```

A historical document whose header says `PREIMPLEMENTATION_DESIGN` remains a historical record of that stage. A separate current map may classify it as `HISTORICAL` or `SUPERSEDED` after implementation, but its historical body is not rewritten to fabricate chronology.

Live GitHub/provider facts remain higher precedence for volatile state.

---

## 17. Revised mission phases

```text
GOV-0 — Baseline, Audit Synthesis & Concurrency Reality
  exact baseline
  dual-audit findings
  explicit #141 relationship
  authoritative source map

GOV-1 — Version Taxonomy & Axis-Specific Currentity
  release × methodology × protocol × schema × SHA
  bump matrix
  remove global CURRENT ambiguity

GOV-2 — Identity & Governance Change Contract
  verified methodologyPin target contract
  v1.1 discriminator fail-closed
  derived lifecycle
  state→authority mapping
  immutable evidence-reference requirements

GOV-3 — Drift, Concurrency & Reconciliation
  objective drift criteria
  #141 and future concurrent missions
  TOCTOU rechecks
  extend existing RECONCILE only

GOV-4 — Repository-Only Cold Start
  extend MCF-RECOVER-CONTEXT contract
  deterministic candidate resolution
  AMBIGUOUS_CONTINUITY fail-closed

GOV-5 — Current-State Reconciliation
  reconcile current indexes/docs
  preserve historical truth

GOV-6 — Compatibility, External Effects & Qualification
  runtime↔methodology compatibility
  methodology rollback semantics
  External Effect Closure
  unit/integration/compatibility/clean-room/negative tests

GOV-P0 — Production Governance Remediation
  Issue #140 independent urgent technical boundary
  mandatory before PR #142 integration to main
```

GOV-P0 may proceed in parallel only under its own explicit authorization. It is a hard blocker for integration of this proposal.

---

## 18. Qualification contract

Documentation alone is insufficient.

### 18.1 Unit/contract tests

Required future tests include:

- methodology identity resolves repository + exact SHA + artifact/digest;
- repository mismatch pin rejected;
- unresolved immutable ref rejected/reconciled;
- v1.1-only metadata + missing discriminator fails closed;
- pure v1.0 remains valid;
- version bump matrix classifications;
- branch/PR/provider metadata cannot self-promote to active methodology;
- unknown future schema/version does not silently downgrade.

### 18.2 Integration/concurrency tests

```text
mission A baseline X
mission B baseline X
mission A integrates → main Y
mission B integration attempt
→ RECONCILIATION_REQUIRED
```

Also test:

- shared semantic contract with non-overlapping files;
- `main` moving after reconciliation but before gate;
- `main` moving after gate but before merge;
- deleted branch while immutable commit remains;
- broken canonical evidence reference;
- rollback target with incompatible supported-version declaration.

### 18.3 Clean-room / cold-start tests

Input only:

```text
leon337/multiagent-collaboration-framework
```

Fixture must deliberately contain:

- many historical branches;
- divergent planning branch;
- active Draft proposal;
- multiple open issues/missions;
- stale current-state documentation;
- valid checkpoint(s);
- active blocker(s).

Expected behavior:

```text
one authoritative continuity
→ deterministic result

multiple equally authoritative continuities
→ AMBIGUOUS_CONTINUITY + evidence
```

Specific negative test:

```text
Draft PR #142 exists and is technically mergeable
→ agent MUST classify it as proposal / NOT_CURRENT
```

### 18.4 Merge / release / production tests

Required before production-governance qualification:

```text
main update without HUMAN_GATE
→ production does not move
```

```text
docs-only merge
→ production does not move
```

```text
stable release published without production authorization
→ production does not move
```

```text
exact authorized SHA
→ promotion may occur and health/rollback evidence is preserved
```

---

## 19. Completion criteria

This governance cannot be qualified while any of these remain ambiguous:

- What is the current methodology default for new eligible work?
- What exact immutable identity proves that methodology?
- What is the current `main` implementation SHA?
- What is the current stable release identity?
- What exact SHA is currently deployed in production?
- Which protocol/schema versions apply to each artifact?
- Which change type advances which version axis?
- How does an MCF evolution proposal begin and who may transition each derived state?
- How are concurrent missions classified and reconciled?
- What happens when `main` moves after reconciliation?
- How does cold-start resolve or explicitly refuse ambiguous continuity?
- How do legacy v1.0 artifacts remain valid without permitting partial-v1.1 downgrade?
- How is a methodology pin externally verified?
- How is runtime rollback prevented from violating pinned semantics?
- How is methodology supersession performed without historical rewrite?
- Are all paths that can cause reserved external effects closed behind equivalent governance?
- How is `main update != production authorization` technically proven?

---

## 20. Explicit non-authorizations

```yaml
runtime_implementation_authorized: false
schema_change_authorized: false
skill_contract_change_authorized: false
methodology_pin_schema_change_authorized: false
render_change_authorized: false
branch_protection_change_authorized: false
production_change_authorized: false
merge_pr_142_authorized: false
release_authorized: false
issue_140_bypass_authorized: false
issue_141_implementation_authorized_by_this_doc: false
```

---

## 21. v2 proposal state

```text
MCF-GOVERNANCE-EVOLUTION-001 v2

ORIGINAL BASELINE
main@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef

DUAL INDEPENDENT AUDIT............. COMPLETE
AUDIT SYNTHESIS.................... RECORDED
ARCHITECTURAL DIRECTION............ ACCEPTED FOR REDESIGN
V2 DESIGN.......................... PROPOSED

ISSUE #141 RELATIONSHIP............ EXPLICITLY MODELED
GOV-P0 / ISSUE #140................ OPEN HARD INTEGRATION BLOCKER

RUNTIME IMPLEMENTATION............. NOT AUTHORIZED
SCHEMA CHANGES...................... NOT AUTHORIZED
MERGE TO MAIN....................... BLOCKED
RELEASE............................. BLOCKED
PRODUCTION.......................... BLOCKED
```

## 22. Next governed gate

The next allowed step is **review/audit of this v2 redesign** and, if accepted, authorization of bounded GOV-0/GOV-1 design work.

No implementation boundary is created by v2 itself.

---

## 23. Audit provenance

This v2 redesign was produced from the conservative union of two independent audits supplied by LEANDRO against the same v1 proposal target. The canonical consolidated mapping is preserved in `MCF-GOVERNANCE-EVOLUTION-001-AUDIT-SYNTHESIS.md`; individual auditor verdicts remain evidence inputs and are not rewritten into a false single-auditor history.