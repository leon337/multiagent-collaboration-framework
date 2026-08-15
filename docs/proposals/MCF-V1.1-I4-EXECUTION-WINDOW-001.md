# MCF v1.1 — I4 Execution Window 001

**Mission:** `MCF-V1.1-CODEX-IMPLEMENTATION-001`  
**Window:** `I4`  
**Status:** `AUTHORIZED_BY_MESTRE_TECHNICAL_GATE`  
**Human authorization:** LEANDRO Option D remains in force.  
**Required starting implementation HEAD:** `1b78235524ff93a1b93c3f5b50e6c96d29d5bf29`

## 1. Objective

Implement the v1.1 **Intent Alignment boundary** only.

I4 converts a `READY_FOR_ALIGNMENT` working PIP into a human-confirmed, exact-revision `ALIGNED` PIP with a canonical Intent Alignment Receipt, while preserving fail-closed behavior and immutable history.

I4 must not implement the I5 PRR pipeline or I6 Mission Runtime enforcement.

## 2. Canonical authority boundary

Only LEANDRO can supply the human confirmation represented by the alignment input. Tests may use controlled fixtures representing LEANDRO confirmation, but implementation code must not fabricate it.

Alignment requires all of the following:

```text
PIP.lifecycle == READY_FOR_ALIGNMENT
PIP.readiness.state == READY_FOR_ALIGNMENT
PIP.alignment.status == NOT_ALIGNED
FINAL_INTENT_READBACK_PRESENT
CONFIRMATION_SOURCE_IDENTIFIES_LEANDRO
CONFIRMED_PIP_REF_MATCHES_EXACT_REVISION_AND_DIGEST
NO_BLOCKING_UNKNOWN
NO_BLOCKER
NO_UNRESOLVED_CONFLICT
```

`READY_FOR_ALIGNMENT != ALIGNED` and `ALIGNED != IMPLEMENTATION_AUTHORIZED`.

## 3. Final Intent Read-Back

Implement a deterministic derived final read-back bound to the exact PIP revision/digest.

It must include enough information to let the human authority confirm the current intent without becoming a second source of truth.

Required properties:

- derived-view marker;
- exact PIP revision and digest reference;
- 20 canonical dimensions;
- current material human decisions;
- relevant superseded decision history reference/visibility;
- unknowns, blockers and conflicts;
- readiness snapshot;
- explicit statement that confirmation binds the exact referenced PIP;
- implementation authority remains false.

A rejected/corrected read-back must not produce a PASS alignment.

## 4. Alignment input and exact-binding rule

The service/API must require an explicit alignment command/input containing at minimum:

```ts
{
  humanAuthority: 'LEANDRO';
  confirmationSourceRef: string;
  confirmedAt: string;
  finalReadbackRefOrDigest: string;
  expectedPipRef: McfArtifactRef;
  decision: 'PASS' | 'REJECTED_FOR_CORRECTION';
}
```

A technically equivalent representation is acceptable under `TEAM_FIRST`.

The `expectedPipRef` must match the exact project, revision, path and digest actually being aligned.

Any mismatch must fail closed.

## 5. PASS behavior

For `decision: PASS`:

1. verify the current PIP is exactly `READY_FOR_ALIGNMENT` and schema/digest valid;
2. verify final read-back binding to that exact PIP;
3. verify human authority is LEANDRO and confirmation source is non-empty;
4. construct the aligned form of the **same exact PIP revision**:
   - `lifecycle: ALIGNED`;
   - `alignment.status: ALIGNED`;
   - `alignment.receiptRef` set to the canonical alignment receipt path;
   - `alignment.alignedAt` set from the confirmed time;
5. persist the aligned PIP through the I2 store;
6. create/persist the Intent Alignment Receipt bound to the resulting exact aligned PIP reference/digest;
7. verify both artifacts can be loaded and mutually match;
8. return an alignment result with `implementationAuthorized: false`.

The aligned PIP revision becomes immutable under the existing I2 protection.

## 6. REJECTED_FOR_CORRECTION behavior

For `decision: REJECTED_FOR_CORRECTION`:

- do not transition the PIP to `ALIGNED`;
- preserve the current PIP revision/history;
- a canonical rejection receipt may be produced if consistent with the existing receipt contract;
- return an explicit correction/reopen outcome;
- implementation authority remains false.

A rejection must never be representable as PASS or ALIGNED.

## 7. Partial-write / fail-closed rule

Because PIP and receipt are separate repository artifacts, alignment validity MUST require the complete exact pair.

If a failure occurs after one artifact is written but before the pair is complete:

- do not report alignment success;
- subsequent verification must classify the state as incomplete/invalid alignment;
- never infer PASS from `PIP.lifecycle == ALIGNED` alone;
- recovery may clean/retry using deterministic exact identities, but must not silently rewrite an already valid aligned pair.

Tests must inject at least one failure between PIP/receipt persistence and prove no false PASS is returned.

## 8. Material change after alignment

Implement the I4 boundary for reopening aligned intent without mutating history.

A material human-intent change after alignment must:

- leave the aligned revision and PASS receipt unchanged;
- create a **new successor PIP revision**;
- set `supersedesRevisionId` to the aligned revision;
- use lifecycle `REOPENED_AFTER_MATERIAL_CHANGE` (or transition immediately into a valid working discovery lifecycle only if the explicit contract remains observable and history is preserved);
- set alignment to `REOPENED`/non-aligned working state according to the existing schema;
- require new provenance for the material change;
- require readiness + final read-back + a new future alignment receipt before that successor can become aligned.

No mutation of the old aligned revision is allowed.

## 9. Hard boundaries

```text
NO I5 FULL PRR/REALITY PIPELINE
NO I6 MISSION RUNTIME ENFORCEMENT
NO I7 HDF/STANDING AUTHORIZATION
NO I8 CONTINUITY ENGINE
NO NEW DATABASE STATE
NO PARALLEL RUNTIME
NO PARALLEL CHECKPOINT ENGINE
NO DIRECT MAIN WRITE
NO MERGE
NO RELEASE
NO PRODUCTION
NO FABRICATED LEANDRO CONFIRMATION
ALIGNED != IMPLEMENTATION_AUTHORIZED
```

## 10. Required I4 gate

I4 may report PASS only with evidence for:

```yaml
final_readback_exact_pip_binding: PASS
final_readback_is_derived_view: PASS
not_ready_pip_rejected: PASS
blocking_unknown_alignment_rejected: PASS
conflict_or_blocker_alignment_rejected: PASS
non_leandro_confirmation_rejected: PASS
pip_ref_revision_mismatch_rejected: PASS
pip_ref_digest_mismatch_rejected: PASS
rejected_readback_no_alignment: PASS
pass_alignment_exact_revision: PASS
alignment_receipt_exact_aligned_pip_digest: PASS
aligned_revision_immutable: PASS
incomplete_pair_never_reports_pass: PASS
material_change_preserves_old_aligned_revision: PASS
material_change_creates_successor_revision: PASS
successor_requires_future_realign: PASS
implementation_authority_stays_false: PASS
I1_I2_I3_regression: PASS
v1_0_regression: PASS
new_database_state: NO
parallel_runtime_created: NO
```

Negative tests are mandatory for readiness failure, non-LEANDRO confirmation, exact-ref/digest mismatch, rejection path, partial persistence failure and aligned-revision mutation.

## 11. Validation cadence

```text
CHANGE
↓
FOCUSED I4 TESTS
↓
I3 INTENT + I2 ARTIFACT + I1 CONTRACT REGRESSION
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

## 12. Stop conditions

Return `BLOCKED` rather than improvising if I4 requires:

- changing the canonical PIP/receipt contract materially;
- weakening exact revision/digest binding;
- treating non-LEANDRO evidence as human alignment authority;
- a new DB transaction subsystem;
- a second runtime/state engine;
- Mission Runtime enforcement to make alignment work;
- redefining Q1–Q20;
- merge/release/production.

## 13. Required receipt

```yaml
MISSION: MCF-V1.1-CODEX-IMPLEMENTATION-001
WINDOW: I4
RESULT: PASS | FAIL | BLOCKED
START_HEAD: 1b78235524ff93a1b93c3f5b50e6c96d29d5bf29
FINAL_HEAD: <sha>
REMOTE_HEAD: <sha|null>

CHANGED_PATHS:
  - <path>

FINAL_READBACK:
  exact_pip_binding: PASS|FAIL
  derived_view_only: PASS|FAIL

ALIGNMENT:
  ready_only: PASS|FAIL
  leandro_only: PASS|FAIL
  exact_revision: PASS|FAIL
  exact_digest: PASS|FAIL
  rejected_no_alignment: PASS|FAIL
  receipt_exact_binding: PASS|FAIL
  incomplete_pair_fail_closed: PASS|FAIL
  implementation_authority_false: PASS|FAIL

IMMUTABILITY_REOPEN:
  aligned_revision_immutable: PASS|FAIL
  old_aligned_history_preserved: PASS|FAIL
  successor_revision_created: PASS|FAIL
  successor_requires_realign: PASS|FAIL

TESTS:
  - command: <command>
    result: PASS|FAIL
    summary: <actual result>

COMPATIBILITY:
  I1_I2_I3_regression: PASS|FAIL
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
NEXT_RECOMMENDED_WINDOW: I5 | STOP_FOR_REASSESSMENT
```

Stop after the receipt. Do not execute I5 without MESTRE technical review.
