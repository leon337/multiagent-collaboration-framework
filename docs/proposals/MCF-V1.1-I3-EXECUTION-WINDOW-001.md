# MCF v1.1 — I3 Execution Window 001

**Mission:** `MCF-V1.1-CODEX-IMPLEMENTATION-001`  
**Window:** `I3`  
**Status:** `AUTHORIZED_BY_MESTRE_TECHNICAL_GATE`  
**Human authorization:** LEANDRO Option D remains in force.  
**Required starting implementation HEAD:** `6de580c48d8617a4bf0688af09325225bf583f95`

## 1. Objective

Implement the v1.1 activation/entry classification/Human Intent Discovery boundary by extending existing MCF skills and orchestration concepts, while producing incremental PIP revisions through the I2 repository-backed artifact layer.

I3 must not implement the I4 Intent Alignment boundary and must not integrate v1.1 enforcement into Mission Runtime; that remains I6.

## 2. Reuse-first requirements

Reuse/extend the semantics of existing skills where applicable:

- `MCF-START-MISSION` — existing mission start remains the later operational entry; I3 must not create a second mission engine.
- `MCF-RECOVER-CONTEXT` — reuse source discovery/provenance/recovery principles for resume/recover classification, without inventing missing context.
- `MCF-DEFINE-PRODUCT` — reuse product/problem discovery concepts, but v1.1 Human Intent Discovery must preserve the canonical 20 intent dimensions and PIP provenance model.

The skill registry is v1.0 today. If I3 changes skill contracts/registry entries, changes must be additive/versioned and must not silently invalidate v1.0 behavior.

## 3. Required state/entry model

Implement deterministic/testable behavior for:

```text
NOT_ACTIVE -> ACTIVATING -> ACTIVE
```

and project entry routing:

```text
NEW_PROJECT
ADOPT_EXISTING_PROJECT
RESUME_MCF_PROJECT
RECOVER_MCF_PROJECT
```

`RECOVER_MCF_PROJECT` is a recovery route, not a fourth normal entry mode.

Classification must be evidence-aware. Ambiguous or conflicting state must not be silently forced into RESUME or ADOPT.

## 4. Human Intent Discovery

I3 must support all 20 canonical intent dimensions:

1. PROBLEM
2. MOTIVATION
3. DESIRED_OUTCOME
4. TARGET_USERS
5. CRITICAL_USER_JOURNEYS
6. MUST_HAVE
7. SHOULD_HAVE
8. NON_GOALS
9. PRIORITIES_AND_TRADEOFFS
10. BUSINESS_RULES
11. DATA_AND_SENSITIVITY
12. ROLES_AND_PERMISSIONS
13. AUTOMATION_LEVEL
14. INTEGRATIONS
15. PLATFORM_AND_USAGE_CONTEXT
16. COST_AND_RESOURCE_CONSTRAINTS
17. QUALITY_EXPECTATIONS
18. FAILURE_TOLERANCE
19. DEFINITION_OF_DONE
20. FUTURE_VISION

Discovery behavior must preserve:

- explicit distinction between human statements, human-confirmed synthesis, prior human decisions, machine evidence, machine inference and technical delegation;
- machine inference cannot silently create or change a human decision;
- blocking unknowns prevent readiness for alignment;
- technical ambiguity inside the approved envelope remains `TEAM_FIRST`;
- ordinary technical details should not be escalated to LEANDRO as product-intent questions.

## 5. Adaptive questioning

Implement a deterministic/testable question-selection policy that is evidence-aware and approximates the approved information-gain rule.

At minimum it must:

- prioritize unresolved `BLOCKING` dimensions;
- avoid asking questions already resolved by valid authoritative evidence/human decisions;
- prefer one high-leverage question that can resolve multiple dependent unknowns when possible;
- preserve why a question was selected;
- never invent an answer when no evidence exists.

The algorithm may be technically simple in I3 if its behavior is explicit, deterministic and covered by tests. Do not add an LLM dependency solely to satisfy I3.

## 6. Progressive semantic read-back

Implement a testable representation/API for progressive read-back that reports current synthesized intent by dimension with provenance, unresolved conflicts/unknowns and readiness impact.

Read-back is a derived interaction view of the current PIP revision. It is not a second source of truth.

## 7. PIP revision lifecycle in I3

I3 may create/update PIP working revisions through the I2 artifact layer.

Allowed lifecycle in I3:

```text
DISCOVERY_IN_PROGRESS
READY_FOR_ALIGNMENT
```

I3 must NOT issue a PASS Intent Alignment Receipt or finalize `ALIGNED`; that is I4.

If a material intent change is captured during discovery, it must be represented with provenance and correct revision/supersession semantics rather than rewriting an already immutable aligned artifact.

## 8. Readiness

Implement readiness assessment with at least:

```text
NOT_READY
CONDITIONALLY_READY
READY_FOR_ALIGNMENT
```

Hard rule:

```text
BLOCKING_UNKNOWN_EXISTS -> NOT READY FOR ALIGNMENT
```

`READY_FOR_ALIGNMENT` means only that a final human alignment step can be presented. It is not implementation authority.

## 9. Entry-specific boundaries

### NEW_PROJECT
May begin Human Intent Discovery directly and persist incremental PIP revisions.

### ADOPT_EXISTING_PROJECT
I3 classifies/routes the project, but must not implement the full PRR/reality reconnaissance pipeline; that is I5. It may return that PRR/reconnaissance is required before authoritative AS-IS gap planning.

### RESUME_MCF_PROJECT
I3 may classify a project as resumable based on valid continuity indicators, but must not implement the full FAST_RESUME/RECONCILE/RECOVER continuity engine; that is I8.

### RECOVER_MCF_PROJECT
I3 may route to recovery when checkpoint/source state is missing/conflicting, but full recovery execution is I8.

## 10. Hard boundaries

```text
NO I4 ALIGNMENT PASS
NO FINAL ALIGNED PIP TRANSITION
NO I5 FULL PRR PIPELINE
NO I6 MISSION RUNTIME ENFORCEMENT
NO I7 HDF/STANDING-AUTHORIZATION IMPLEMENTATION
NO I8 FULL RESUME/RECOVERY ENGINE
NO NEW DATABASE STATE
NO PARALLEL RUNTIME
NO PARALLEL CHECKPOINT ENGINE
NO DIRECT MAIN WRITE
NO MERGE
NO RELEASE
NO PRODUCTION
```

## 11. Required I3 gate

I3 may report PASS only if evidence covers:

```yaml
activation_state_machine: PASS
new_project_entry: PASS
adopt_existing_project_classification: PASS
resume_mcf_project_classification: PASS
recover_mcf_project_routing: PASS
ambiguous_entry_fail_closed_or_explicitly_unresolved: PASS
20_dimensions_present: PASS
adaptive_questioning_prioritizes_blocking_information_gain: PASS
resolved_dimension_not_reasked_without_material_reason: PASS
progressive_readback: PASS
blocking_unknown_prevents_alignment_readiness: PASS
ready_for_alignment_not_implementation_authority: PASS
machine_evidence_does_not_invent_human_preference: PASS
machine_inference_does_not_create_human_decision: PASS
incremental_pip_revision_round_trip: PASS
I2_artifact_layer_reused: PASS
no_alignment_receipt_pass_created: VERIFIED
legacy_I1_I2_regression: PASS
v1_0_regression: PASS
new_database_state: NO
parallel_runtime_created: NO
```

Negative tests are required for ambiguous classification, blocking unknown readiness, machine-inference/human-decision boundary and attempts to cross into I4 alignment.

## 12. Validation cadence

```text
CHANGE
↓
FOCUSED I3 TESTS
↓
CONTRACT + ARTIFACT-LAYER REGRESSION
↓
FULL RELEVANT SERVER/WORKSPACE REGRESSION
↓
DIFF INSPECTION
↓
SMALL AUDITABLE COMMIT(S)
↓
PUSH SAME IMPLEMENTATION BRANCH
↓
LOCAL_HEAD == REMOTE_HEAD
↓
RECEIPT TO MESTRE
```

## 13. Stop conditions

Return `BLOCKED` rather than improvising if I3 requires:

- material redefinition of Q1–Q20;
- a second mission/runtime engine;
- new persistent DB project-state tables;
- full alignment implementation to make discovery work;
- full PRR/recovery implementation outside this window;
- changing final human authority away from LEANDRO;
- silently promoting machine inference into human intent;
- non-delegable HUMAN_GATE;
- merge/release/production.

## 14. Required receipt

```yaml
MISSION: MCF-V1.1-CODEX-IMPLEMENTATION-001
WINDOW: I3
RESULT: PASS | FAIL | BLOCKED
START_HEAD: 6de580c48d8617a4bf0688af09325225bf583f95
FINAL_HEAD: <sha>
REMOTE_HEAD: <sha|null>

CHANGED_PATHS:
  - <path>

ACTIVATION:
  state_machine: PASS|FAIL

ENTRY_CLASSIFICATION:
  new_project: PASS|FAIL
  adopt_existing: PASS|FAIL
  resume_mcf: PASS|FAIL
  recover_route: PASS|FAIL
  ambiguity_fail_closed: PASS|FAIL

INTENT_DISCOVERY:
  canonical_20_dimensions: PASS|FAIL
  adaptive_questioning: PASS|FAIL
  progressive_readback: PASS|FAIL
  readiness_gate: PASS|FAIL
  provenance_preserved: PASS|FAIL
  machine_inference_not_human_decision: PASS|FAIL

PIP:
  incremental_revision_round_trip: PASS|FAIL
  I2_store_reused: PASS|FAIL
  aligned_transition_created: NO|YES
  alignment_pass_receipt_created: NO|YES

TESTS:
  - command: <command>
    result: PASS|FAIL
    summary: <actual result>

COMPATIBILITY:
  I1_I2_regression: PASS|FAIL
  v1_0_regression: PASS|FAIL
  new_database_state: NO|YES
  parallel_runtime_created: NO|YES

FINDINGS:
  blocking: []
  non_blocking: []

COMMITS:
  - <sha> <message>

PUSH:
  performed: YES|NO
  local_remote_equal: YES|NO|N/A

FINAL_GIT_STATUS: <result>
NEXT_RECOMMENDED_WINDOW: I4 | STOP_FOR_REASSESSMENT
```

Stop after the receipt. Do not execute I4 without MESTRE technical review.
