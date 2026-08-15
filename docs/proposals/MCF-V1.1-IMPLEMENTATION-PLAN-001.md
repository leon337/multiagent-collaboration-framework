# MCF v1.1 — Incremental Implementation Plan

**ID:** `MCF-V1.1-IMPLEMENTATION-PLAN-001`  
**Status:** `READY_FOR_FUTURE_IMPLEMENTATION_GATE`  
**Execution host preference:** `CODEX_LOCAL` after explicit LEANDRO HUMAN_GATE.

This plan does not authorize implementation.

## 1. Future mission objective

Implement the approved v1.1 Project Intake, Human Intent, Existing Project Reality, Authority/Continuity and Compatibility contracts by extending the qualified v1.0 core without creating a parallel architecture.

## 2. Hard invariants for the future executor

```text
DO_NOT_WRITE_MAIN_DIRECTLY
DO_NOT_REWRITE_V1_0_RELEASE_HISTORY
DO_NOT_CREATE_PARALLEL_MISSION_RUNTIME
DO_NOT_CREATE_PARALLEL_PERMISSION_SYSTEM
DO_NOT_CREATE_PARALLEL_GENERIC_CHECKPOINT_ENGINE
DO_NOT_TREAT_DERIVED_VIEW_AS_AUTHORITY
DO_NOT_ALLOW_IMPLEMENTATION_BEFORE_ALIGNED_PIP
DO_NOT_SILENTLY_UPGRADE_LEGACY_PROJECTS
NO_NEW_DATABASE_STATE_WITHOUT_CONFORMANCE_FINDING
EDIT != COMMIT != PUSH != PR
LOCAL_UNCHECKPOINTED != REMOTE_CHECKPOINTED
```

## 3. Future branch model

After LEANDRO authorizes implementation, Codex should:

1. fetch live repository state;
2. verify the approved preparation branch and current `main`;
3. record exact implementation baseline;
4. create a dedicated implementation branch from the approved base according to current MCF governance;
5. work locally;
6. use small auditable commits;
7. push only remote checkpoints that satisfy the applicable phase boundary;
8. open PR only when the planned local validation gate passes.

Suggested branch name, subject to live-state collision check:

`feat/mcf-v1.1-project-intake-continuity`

## 4. Phase I1 — Contract and schema foundation

Scope:

- add PIP and PRR schemas/types;
- add Intent Alignment Receipt schema/type;
- add project entry/resume route types;
- add `McfArtifactRef`;
- add optional v1.1 fields to `McfMissionContract`;
- add `McfStandingAuthorization`;
- evolve checkpoint schema compatibly;
- add validation fixtures.

Likely files:

- `apps/rede-social-agentes/packages/contracts/src/mcf-runtime.ts`
- `schemas/` new PIP/PRR/alignment schemas
- `schemas/caf-flow-checkpoint.schema.json`
- contract/schema tests

Gate I1:

```yaml
legacy_contract_tests: PASS
new_schema_validation: PASS
legacy_checkpoint_validation: PASS
no_runtime_behavior_change_yet: VERIFIED
```

## 5. Phase I2 — Repository-backed canonical project artifact layer

Build a small project-artifact service/adapter, not another runtime.

Responsibilities:

- canonical path construction;
- JSON schema validation;
- SHA-256 digest calculation;
- immutable aligned-PIP write protection;
- immutable PRR revision semantics;
- local versus remotely checkpointed reference distinction;
- load exact revision by path/digest/commit;
- atomic local write behavior where applicable.

No DB table is planned for PIP/PRR in this phase.

Gate I2:

```yaml
pip_round_trip: PASS
prr_round_trip: PASS
alignment_receipt_round_trip: PASS
aligned_revision_mutation_rejected: PASS
digest_mismatch_rejected: PASS
local_uncheckpointed_not_remote: PASS
```

## 6. Phase I3 — Activation, entry classification and Human Intent Discovery

Extend orchestration around existing skills.

Reuse:

- `MCF-DEFINE-PRODUCT`
- `MCF-RECOVER-CONTEXT`
- `MCF-START-MISSION`

Add behavior for:

- `NOT_ACTIVE → ACTIVATING → ACTIVE` protocol at the MCF edge/bootstrap layer;
- `NEW_PROJECT`, `ADOPT_EXISTING_PROJECT`, `RESUME_MCF_PROJECT` classification;
- `RECOVER_MCF_PROJECT` routing;
- 20 canonical intent dimensions;
- adaptive question selection by information gain;
- progressive semantic read-back;
- readiness states and blocking unknowns;
- incremental PIP revisions.

Gate I3:

```yaml
new_project_entry: PASS
existing_project_classification: PASS
resume_vs_recover: PASS
20_dimensions_present: PASS
adaptive_questioning: PASS
blocking_unknown_prevents_alignment: PASS
machine_evidence_does_not_invent_human_preference: PASS
```

## 7. Phase I4 — Intent Alignment boundary

Implement:

- final read-back requirement;
- exact PIP revision confirmation;
- Intent Alignment Receipt;
- transition to `ALIGNED`;
- immutable aligned revision;
- reopen-on-material-change behavior.

Gate I4:

```yaml
alignment_exact_revision: PASS
rejected_readback_no_alignment: PASS
alignment_receipt_exact_digest: PASS
aligned_revision_immutable: PASS
material_change_creates_successor_revision: PASS
```

## 8. Phase I5 — Existing project reconnaissance / PRR pipeline

Implement `READ_ONLY_FIRST` existing-project analysis using current GitHub/recovery/evidence capabilities.

Produce:

- PRR bound to exact baseline;
- fact/inference/unknown/conflict separation;
- Reality Confirmation;
- derived AS-IS/TO-BE Gap Map;
- Completion/Recovery Plan when material gaps exist.

Gate I5:

```yaml
prr_exact_baseline: PASS
fact_requires_evidence: PASS
as_is_not_human_intent: PASS
prr_not_plan: PASS
gap_binds_exact_prr_and_pip: PASS
plan_does_not_authorize_implementation: PASS
```

## 9. Phase I6 — Mission Runtime integration

Extend existing Mission Contract/runtime rather than replacing it.

Implement:

- validation of `alignedPipRef` for v1.1 implementation missions;
- methodology pin validation;
- project-entry metadata propagation;
- artifact references in existing event ledger;
- trace/recovery visibility;
- legacy v1.0 mission path unchanged.

Likely files:

- `packages/contracts/src/mcf-runtime.ts`
- `mission-runtime.service.ts`
- runtime repository/adapters only where references/events require it
- `MCF-START-MISSION` skill definition/loader tests

Gate I6:

```yaml
legacy_v1_0_mission_create: PASS
v1_1_aligned_pip_required: PASS
invalid_pip_ref_fail_closed: PASS
no_parallel_runtime: PASS
existing_events_receipts_handoffs_reused: PASS
```

## 10. Phase I7 — Standing Authorization + impact-based HUMAN_GATE

Extend existing permission profiles and `HumanDelegationGuard`.

Implement:

- bounded authorization matching;
- action/environment/cost/reversibility/expiry/exclusion checks;
- non-delegable material-impact gate detection;
- `TEAM_FIRST` before ordinary technical escalation;
- dependent-action-only blocking;
- explicit denial evidence.

Do not replace the existing HDF.

Gate I7:

```yaml
inside_boundary_allowed: PASS
outside_boundary_denied: PASS
expired_authorization_denied: PASS
non_delegable_gate_denied_without_leandro: PASS
no_response_not_approval: PASS
pending_gate_does_not_block_independent_safe_work: PASS
```

## 11. Phase I8 — Transferable continuity and recovery

Extend current checkpoint/recovery primitives.

Implement:

- event-driven checkpoint trigger API/contract;
- project/PIP/methodology/live-state references;
- transferability flag;
- Resume Card generation as derived view;
- `FAST_RESUME`, `RECONCILE`, `RECOVER_MCF_PROJECT` decision logic;
- local-only-state protection.

Gate I8:

```yaml
fast_resume_consistent_state: PASS
reconcile_explainable_drift: PASS
recover_broken_continuity: PASS
previous_chat_not_required: PASS
local_only_state_not_declared_transferred: PASS
```

## 12. Phase I9 — Observability and audit exposure

Reuse existing runtime observation/event mechanisms.

Expose enough state to show:

- project entry mode;
- methodology pin;
- aligned PIP revision;
- PRR baseline when relevant;
- pending HUMAN_GATE;
- active standing authorization references;
- continuity/resume route;
- source authority/reconciliation outcome.

Resume Card/dashboard remains derived.

Gate I9:

```yaml
authoritative_refs_visible: PASS
derived_view_not_authority: PASS
volatile_state_labeled_live: PASS
no_secret_material_exposed: PASS
```

## 13. Phase I10 — Full qualification

Execute `MCF-V1.1-QUALIFICATION-PLAN-001` on an exact candidate HEAD.

No qualification claim is valid without evidence tied to the exact SHA.

## 14. Required local validation cadence

For every phase:

```text
CHANGE
↓
FOCUSED TEST
↓
FULL RELEVANT SUITE
↓
EVIDENCE
↓
COMMIT
↓
NEXT PHASE
```

Before first push/PR:

- lint/typecheck applicable packages;
- unit/contract tests;
- runtime integration tests;
- schema validation tests;
- compatibility regression.

## 15. Stop conditions for Codex

Codex must stop the affected path and report to MESTRE if it discovers:

- a required breaking change to v1.0 core authority/gates;
- need for a second runtime/permission/checkpoint subsystem;
- need for new DB persistent project state not justified here;
- inability to preserve legacy behavior;
- material ambiguity in an approved human-intent contract;
- required action crossing HUMAN_GATE;
- baseline drift that invalidates the approved implementation plan.

Technical alternatives within the approved envelope remain `TEAM_FIRST`; they do not automatically require LEANDRO.

## 16. Expected implementation deliverables

- code + schemas;
- migration/compatibility evidence;
- tests;
- qualification fixtures;
- updated skill registry/docs where behavior changed;
- exact-head evidence ledger;
- PR with clear mapping from Q1–Q20 to implementation changes;
- independent review after candidate HEAD is frozen.

## 17. Implementation-plan verdict

```yaml
incremental_phases_defined: 10
local_first_codex_compatible: true
parallel_architecture_forbidden: true
legacy_regression_required: true
qualification_required: true
implementation_authorized: false
human_gate_required_before_execution: true
```
