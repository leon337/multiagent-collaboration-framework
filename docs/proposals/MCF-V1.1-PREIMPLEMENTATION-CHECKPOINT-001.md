# MCF v1.1 — Pre-Implementation Checkpoint 001

**ID:** `MCF-V1.1-PREIMPLEMENTATION-CHECKPOINT-001`  
**Status:** `PREIMPLEMENTATION_PREPARATION_COMPLETE`  
**Branch:** `planning/mcf-v1.1-preimplementation-conformance`  
**Human authority:** LEANDRO  
**Orchestrator:** MESTRE

## 1. Boundary

This checkpoint closes the technical-preparation/conformance stage authorized after Q20. It does **not** authorize implementation.

```yaml
discovery: COMPLETE
preimplementation_preparation: COMPLETE
implementation_human_gate: PENDING
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

## 2. Verified source baselines

```yaml
v1_0_main_baseline_used_for_conformance: b91823a947715e09d69c72999e2278523f2259be
discovery_terminal_head: aef074f87b7356fe277f4cc92266605bf1dc410b
preimplementation_branch_started_from: aef074f87b7356fe277f4cc92266605bf1dc410b
```

Any later implementation mission MUST re-read live GitHub state and declare a fresh exact implementation baseline before editing code.

## 3. Required Q20 outputs

```yaml
V1_0_IMPACT_AND_CONFORMANCE_ANALYSIS: COMPLETE
NO_EQUIVALENT_TEST_FOR_PIP: PASS_NEW_CONTRACT_JUSTIFIED
NO_EQUIVALENT_TEST_FOR_PRR: PASS_NEW_CONTRACT_JUSTIFIED
EXACT_SCHEMA_AND_CONTRACT_DESIGN: COMPLETE
RUNTIME_AND_SKILL_MAPPING: COMPLETE
MIGRATION_AND_COMPATIBILITY_PLAN: COMPLETE
IMPLEMENTATION_PLAN: COMPLETE
QUALIFICATION_PLAN_FROM_Q19: COMPLETE
TEAM_REVIEW: COMPLETE_AS_MESTRE_REVIEW_LENSES
SEPARATE_IMPLEMENTATION_HUMAN_GATE: PENDING_LEANDRO
```

## 4. Artifacts

1. `MCF-V1.1-PREIMPLEMENTATION-CONFORMANCE-001.md`
2. `MCF-V1.1-TECHNICAL-CONTRACTS-001.md`
3. `MCF-V1.1-MIGRATION-COMPATIBILITY-PLAN-001.md`
4. `MCF-V1.1-IMPLEMENTATION-PLAN-001.md`
5. `MCF-V1.1-QUALIFICATION-PLAN-001.md`
6. this checkpoint
7. `MCF-V1.1-PREIMPLEMENTATION-RESUME-CARD.md` (created after this checkpoint)

## 5. Architectural conclusions

### Reuse/extend — mandatory

- Mission Runtime;
- Mission Contract;
- `MCF-START-MISSION`;
- `MCF-RECOVER-CONTEXT`;
- `MCF-DEFINE-PRODUCT`;
- CAF checkpoint primitive;
- permission profiles and Human Delegation Guard;
- event ledger;
- receipts;
- handoffs;
- hierarchy/reconciliation/observability.

### New durable contracts justified

- `PROJECT_INTENT_PACKAGE`;
- `PROJECT_REALITY_REPORT`.

### New small artifact format

- `INTENT_ALIGNMENT_RECEIPT`.

This is not a new runtime subsystem.

### Derived / non-authoritative

- Resume Card;
- Product Brief;
- Gap Map;
- Completion/Recovery Plan draft;
- dashboards/status views.

## 6. Persistence decision

First compatible implementation uses repository-backed versioned PIP/PRR/alignment artifacts and passes exact references/digests into the existing runtime.

```yaml
new_parallel_database: NO_GO
new_project_state_tables: NOT_JUSTIFIED_BY_CURRENT_CONFORMANCE
repository_backed_canonical_project_artifacts: APPROVED_DESIGN
```

If implementation discovers a blocking need for new persistent DB state, the executor must stop that design path and return a conformance finding before adding it.

## 7. Review record

The following are MESTRE-applied review lenses, not independent external-agent executions.

### Sofia lens — architecture

```yaml
verdict: PASS
findings:
  - v1.1 can extend v1.0 without parallel runtime
  - project-level PIP/PRR should remain outside mission-state duplication
  - derived views must not acquire authority
```

### Rafael lens — runtime/persistence

```yaml
verdict: PASS_WITH_CONDITIONS
conditions:
  - preserve current mission tables and service boundary
  - use optional additive Mission Contract fields
  - avoid DB project-state tables unless a new conformance finding proves necessity
```

### Emily lens — evidence/audit

```yaml
verdict: PASS_WITH_CONDITIONS
conditions:
  - every PIP/PRR material assertion has provenance/evidence classification
  - alignment binds exact PIP digest/revision
  - exact-head qualification required
  - failures and negative paths remain visible
```

### Security lens

```yaml
verdict: PASS_WITH_CONDITIONS
conditions:
  - standing authorization cannot broaden by omission/wildcard
  - non-delegable HUMAN_GATE remains LEANDRO-only
  - TEAM_FIRST remains enforced
  - no response never means approval
```

## 8. Non-blocking implementation questions delegated to the technical team

These do not require LEANDRO before implementation because they are engineering choices inside the approved envelope:

- exact class/file naming for project-artifact service;
- choice of JSON-schema validation library already compatible with repository dependencies;
- internal function decomposition;
- exact test fixture organization;
- exact derived Resume Card rendering implementation.

They remain subject to the contracts and gates above.

## 9. Blocking changes that would require reassessment

- new architecture that duplicates Mission Runtime;
- replacement of existing permission/HDF system;
- new DB project-state subsystem;
- incompatible change to v1.0 authority/gates/core flow;
- inability to keep legacy v1.0 contracts valid;
- change to human authority/intention contracts Q1–Q20;
- production/release authorization.

## 10. Readiness verdict

```yaml
technical_preparation_complete: true
blocking_preimplementation_gap: false
ready_to_present_implementation_human_gate_to_leandro: true
implementation_authorized: false
next_human_decision: AUTHORIZE_OR_REJECT_CODEX_IMPLEMENTATION_MISSION
```

## 11. Next permitted action

MESTRE may present a separate HUMAN_GATE to LEANDRO containing the implementation mission boundary and recommendation.

No implementation begins until LEANDRO explicitly authorizes that gate.
