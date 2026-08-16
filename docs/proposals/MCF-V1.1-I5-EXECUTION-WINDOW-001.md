# MCF v1.1 — I5 Execution Window 001

**Mission:** `MCF-V1.1-CODEX-IMPLEMENTATION-001`  
**Window:** `I5`  
**Status:** `AUTHORIZED_BY_MESTRE_TECHNICAL_GATE`  
**Human authorization:** LEANDRO Option D remains in force.  
**Required starting implementation HEAD:** `162c25c4aff9c96b85ce16ebf1083c83ef906fab`

## 1. Objective

Implement the v1.1 **Existing Project Reconnaissance / Project Reality Report (PRR) pipeline** only.

I5 must preserve the canonical separation:

```text
AS_IS != TO_BE
PRR != PIP
PRR != PLAN
FACT != INFERENCE
HUMAN_INTENT != AUTOMATIC_TECHNICAL_EVIDENCE
```

I5 must not implement Mission Runtime enforcement (I6), HDF/Standing Authorization (I7) or the continuity engine (I8).

## 2. Entry boundary

The authoritative I5 path applies to `ADOPT_EXISTING_PROJECT` and to recovery situations that explicitly require a fresh reality reconstruction.

`RESUME_MCF_PROJECT` with verified continuity must not be forced through full reconstruction by default.

The pipeline must remain `READ_ONLY_FIRST`: reconnaissance observes evidence and builds reality; it does not modify the target project's product state merely to make analysis easier.

## 3. Exact baseline

Every authoritative PRR must be bound to an exact baseline:

```ts
{
  repository: string;
  commitSha: string;
  branch?: string;
  capturedAt: string;
}
```

Rules:

- `commitSha` must be explicit and non-empty;
- volatile branch names do not replace the exact SHA;
- evidence must identify the source used for each material observation;
- a baseline mismatch or ambiguous repository identity fails closed;
- I5 should accept already-resolved evidence inputs/readers rather than embedding unnecessary GitHub network coupling into the domain service.

## 4. Reality assertion model

Use the existing PRR contract:

```text
FACT
INFERENCE
UNKNOWN
CONFLICTING
```

Required semantics:

### FACT

- must contain one or more concrete `evidenceRefs`;
- provenance must be non-empty;
- machine-verifiable facts should use machine-evidence provenance where applicable;
- a human statement about a technical fact does NOT automatically become machine evidence or a confirmed FACT.

### INFERENCE

- must remain explicitly labeled inference;
- must preserve the source evidence/provenance supporting the inference;
- must never be promoted to human intent.

### UNKNOWN

- must identify what evidence is still needed where material.

### CONFLICTING

- must preserve the conflicting source references and remain unresolved until evidence reconciliation.

No assertion may silently change classification to make the pipeline pass.

## 5. Reconnaissance draft versus canonical PRR

The I2 artifact store makes a persisted PRR revision immutable. I5 must respect that.

Preferred implementation model:

```text
READ-ONLY EVIDENCE
      ↓
WORKING RECONNAISSANCE DRAFT
      ↓
REALITY READ-BACK / CONFIRMATION
      ↓
CANONICAL CONFIRMED PRR REVISION
      ↓
I2 writePrr()
```

A working reconnaissance draft/read-back is `WORKING_PROPOSED_ARTIFACT` or derived interaction state, not canonical runtime authority.

Do NOT persist a PRR revision as `PENDING` and later overwrite that same persisted revision to `CONFIRMED`.

If the existing contract genuinely requires a canonical persisted `PENDING` PRR before confirmation and cannot preserve successor history without changing the approved schema materially, STOP and return a conformance finding to MESTRE rather than weakening immutability.

## 6. Reality Read-Back / Confirmation

Implement a deterministic reality read-back bound to the exact draft baseline and observations.

It must expose:

- exact repository + SHA baseline;
- FACT / INFERENCE / UNKNOWN / CONFLICTING separation;
- evidenceRefs and provenance;
- unresolved facts/evidence needed;
- explicit statement that reality confirmation validates the AS-IS representation and does not redefine TO-BE human intent;
- `implementationAuthorized: false`.

Controlled tests may use LEANDRO confirmation fixtures. Production/domain code must not fabricate human confirmation.

Reality confirmation outcomes supported by the existing PRR contract:

```text
CONFIRMED
CONFIRMED_WITH_CORRECTIONS
```

Corrections must be traceable through `correctionRefs` and must not silently turn human technical assertions into machine evidence.

## 7. Canonical PRR persistence

The canonical persisted PRR must:

- use `.mcf/reality/prr-<revisionId>.json` through the I2 store;
- bind to the exact baseline;
- carry a non-PENDING confirmed reality state for the authoritative pipeline output;
- be immutable once persisted;
- round-trip through schema/digest validation;
- preserve fact/inference/unknown/conflict semantics.

A changed reality baseline or materially corrected reality after canonical persistence requires a new PRR revision; never overwrite the old persisted revision.

If successor linkage requires a material schema change not already approved, STOP and report the need rather than inventing it silently.

## 8. Gap Map — derived, not authority

Implement a deterministic derived AS-IS / TO-BE Gap Map only when an exact canonical PRR and exact valid aligned PIP are available.

The aligned PIP must be validated through the I4 complete alignment-pair semantics; `PIP.lifecycle == ALIGNED` alone is insufficient.

Gap Map identity must derive from:

```text
EXACT_PRR_REF
+
EXACT_ALIGNED_PIP_REF
+
ANALYSIS_VERSION
```

The result must expose:

- exact PRR ref/digest/baseline;
- exact aligned PIP ref/digest;
- material gaps grouped deterministically;
- supporting AS-IS observation refs;
- supporting TO-BE intent dimension/decision refs;
- unresolved comparisons separately;
- `authorityClass: DERIVED_REBUILDABLE_VIEW`;
- `implementationAuthorized: false`.

Before PIP alignment, only preliminary non-authoritative comparison may exist; I5 must not present it as a canonical Gap Map for execution planning.

## 9. Completion / Recovery Plan — working proposal only

When material validated gaps exist, implement a deterministic working Completion/Recovery Plan representation referencing the exact Gap Map.

It must be explicitly:

```text
WORKING_PROPOSED_ARTIFACT
PLAN_EXISTS != IMPLEMENTATION_AUTHORIZED
```

It may contain candidate steps, dependencies, risks, evidence requirements and suggested mission boundaries, but it must not create Mission Contract authority or start implementation by itself.

No material gap => no requirement to fabricate a plan.

## 10. Reassessment rules

Any material change to an authoritative input requires dependent reassessment:

```text
NEW_PRR_REVISION -> GAP_MAP_STALE
NEW_ALIGNED_PIP_REVISION -> GAP_MAP_STALE
GAP_MAP_CHANGED -> COMPLETION_PLAN_STALE
BASELINE_CHANGED -> PRR_REASSESSMENT_REQUIRED
```

Do not silently reuse a derived artifact against different exact inputs.

## 11. Required I5 gate

I5 may report PASS only with evidence for:

```yaml
read_only_first_boundary: PASS
exact_repository_sha_baseline_required: PASS
fact_requires_evidence: PASS
human_technical_assertion_not_auto_machine_fact: PASS
inference_remains_inference: PASS
unknown_and_conflict_preserved: PASS
reality_readback_exact_baseline_binding: PASS
reality_readback_is_non_authoritative: PASS
canonical_prr_confirmed_before_persistence: PASS
canonical_prr_round_trip: PASS
persisted_prr_revision_immutable: PASS
changed_reality_requires_new_revision: PASS
gap_map_requires_exact_confirmed_prr: PASS
gap_map_requires_verified_aligned_pip_pair: PASS
gap_map_exact_prr_pip_binding: PASS
gap_map_is_derived_view: PASS
completion_plan_requires_valid_gap_map_when_material_gap_exists: PASS
completion_plan_not_implementation_authority: PASS
dependent_artifact_staleness_detected: PASS
I1_I2_I3_I4_regression: PASS
v1_0_regression: PASS
new_database_state: NO
parallel_runtime_created: NO
```

Negative tests are mandatory for:

- missing/ambiguous exact baseline;
- FACT without evidence;
- human-only technical claim being promoted to machine FACT;
- canonical persisted PRR overwrite;
- Gap Map from unverified/un-aligned PIP;
- Gap Map with mismatched PRR/PIP refs;
- plan presented as implementation authority;
- stale Gap Map/plan reused after material input change.

## 12. Validation cadence

```text
CHANGE
↓
FOCUSED I5 TESTS
↓
I4 ALIGNMENT + I3 INTENT + I2 ARTIFACT + I1 CONTRACT REGRESSION
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

## 13. Hard boundaries

```text
NO I6 MISSION RUNTIME ENFORCEMENT
NO I7 HDF/STANDING AUTHORIZATION
NO I8 CONTINUITY ENGINE
NO NEW PROJECT-STATE DATABASE
NO PARALLEL RUNTIME
NO PARALLEL CHECKPOINT ENGINE
NO DIRECT MAIN WRITE
NO MERGE
NO RELEASE
NO PRODUCTION
PRR != PIP
PRR != PLAN
GAP_MAP != AUTHORITY
PLAN_EXISTS != IMPLEMENTATION_AUTHORIZED
```

## 14. Stop conditions

Return `BLOCKED` rather than improvising if I5 requires:

- material change to the approved PRR schema/contract;
- weakening immutable PRR revision semantics;
- treating human technical assertion as sufficient machine evidence;
- using unverified aligned PIP state as TO-BE authority;
- new DB persistent project state;
- Mission Runtime enforcement to make the PRR pipeline work;
- redefining Q1–Q20;
- merge/release/production.

## 15. Required receipt

```yaml
MISSION: MCF-V1.1-CODEX-IMPLEMENTATION-001
WINDOW: I5
RESULT: PASS | FAIL | BLOCKED
START_HEAD: 162c25c4aff9c96b85ce16ebf1083c83ef906fab
FINAL_HEAD: <sha>
REMOTE_HEAD: <sha|null>

CHANGED_PATHS:
  - <path>

RECONNAISSANCE:
  read_only_first: PASS|FAIL
  exact_baseline: PASS|FAIL
  fact_evidence_boundary: PASS|FAIL
  human_fact_not_auto_evidence: PASS|FAIL
  inference_unknown_conflict_preserved: PASS|FAIL

REALITY_CONFIRMATION:
  readback_exact_binding: PASS|FAIL
  confirmed_canonical_prr: PASS|FAIL
  pending_same_revision_not_overwritten: PASS|FAIL
  prr_round_trip: PASS|FAIL
  prr_immutable: PASS|FAIL

GAP_MAP:
  verified_aligned_pip_required: PASS|FAIL
  exact_prr_pip_binding: PASS|FAIL
  derived_view_only: PASS|FAIL
  stale_input_detection: PASS|FAIL

COMPLETION_PLAN:
  created_only_when_applicable: PASS|FAIL
  exact_gap_map_binding: PASS|FAIL
  working_proposed_only: PASS|FAIL
  implementation_authority_false: PASS|FAIL

TESTS:
  - command: <command>
    result: PASS|FAIL
    summary: <actual result>

COMPATIBILITY:
  I1_I2_I3_I4_regression: PASS|FAIL
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
NEXT_RECOMMENDED_WINDOW: I6 | STOP_FOR_REASSESSMENT
```

Stop after the receipt. Do not execute I6 without MESTRE technical review.
