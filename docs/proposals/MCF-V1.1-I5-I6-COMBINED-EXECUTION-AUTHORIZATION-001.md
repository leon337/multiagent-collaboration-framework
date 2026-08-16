# MCF v1.1 — I5 + I6 Combined Execution Authorization 001

**Mission:** `MCF-V1.1-CODEX-IMPLEMENTATION-001`  
**Authority:** explicit current instruction from **LEANDRO**  
**Orchestrator:** `MESTRE`  
**Executor:** `CODEX_LOCAL`  
**Status:** `AUTHORIZED`  
**Required starting implementation HEAD:** `162c25c4aff9c96b85ce16ebf1083c83ef906fab`

## 1. Clarification

The canonical implementation plan contains **10 phases (I1–I10)**. I1–I4 are complete. Therefore I5 and I6 are the **next two phases**, not the final two phases of v1.1. I7–I10 remain after this combined window.

LEANDRO explicitly instructed MESTRE to send Codex to execute these two next phases together. This instruction supersedes the previous operational sequencing that required a MESTRE return between I5 and I6.

## 2. Combined sequencing

```text
I5
↓
I5 SELF-GATE
↓ only if PASS
COMMIT + PUSH + REMOTE HEAD VERIFICATION
↓
I6
↓
I6 SELF-GATE
↓
COMMIT + PUSH + REMOTE HEAD VERIFICATION
↓
STOP
↓
RETURN COMBINED RECEIPT TO MESTRE
```

Codex MUST NOT start I6 if I5 is `FAIL` or `BLOCKED`, or if any I5 stop condition/conformance finding is triggered.

No MESTRE technical review is required between I5 and I6 for this combined window. A MESTRE gate is required after I6 before I7.

## 3. I5 controlling specification

I5 remains governed in full by:

`docs/proposals/MCF-V1.1-I5-EXECUTION-WINDOW-001.md`

All I5 boundaries, tests, stop conditions and evidence requirements remain mandatory.

I5 MUST preserve:

```text
READ_ONLY_FIRST
AS_IS != TO_BE
PRR != PIP
PRR != PLAN
FACT != INFERENCE
HUMAN_TECHNICAL_ASSERTION != AUTOMATIC_MACHINE_EVIDENCE
PERSISTED_PRR_REVISION = IMMUTABLE
GAP_MAP = DERIVED_REBUILDABLE_VIEW
PLAN_EXISTS != IMPLEMENTATION_AUTHORIZED
```

Before I6, Codex must have an I5 checkpoint commit pushed to the same implementation branch with `LOCAL_HEAD == REMOTE_HEAD` and all I5 gate criteria PASS.

## 4. I6 objective — Mission Runtime integration

Extend the **existing** Mission Runtime and Mission Contract path for v1.1. Do not replace or parallelize the v1.0 runtime.

Implement only the I6 scope from `MCF-V1.1-IMPLEMENTATION-PLAN-001.md`:

- validate the applicable `alignedPipRef` for v1.1 implementation missions;
- require an exact valid alignment pair, not merely `PIP.lifecycle == ALIGNED`;
- validate methodology pin consistency;
- propagate project-entry metadata through the existing Mission Contract/runtime path;
- expose/reference applicable PIP/PRR project artifacts through the existing event ledger and trace/recovery visibility;
- reuse existing receipts, handoffs and mission/event persistence;
- keep the legacy v1.0 mission path unchanged.

Use the existing `mcf_missions.contract` JSONB and existing runtime/event structures where sufficient. No new database state is authorized merely for I6.

## 5. I6 required behavior

For a v1.1 implementation mission:

```text
contractSchemaVersion == 1.1
→ alignedPipRef required
→ exact referenced PIP must resolve and verify
→ complete Intent Alignment PIP + receipt pair must be valid
→ methodology pin must be compatible with the exact project context
→ invalid/missing/stale/mismatched reference fails closed
```

If project-entry mode is `ADOPT_EXISTING_PROJECT` and a PRR reference is supplied/required by the applicable context, preserve exact PRR reference/baseline semantics from I5. Do not invent a PRR requirement for contexts where the approved contracts do not require one.

Mission Contract MUST reference project artifacts; it MUST NOT inline, duplicate or redefine the full PIP/PRR authority.

`ALIGNED != IMPLEMENTATION_AUTHORIZED` remains true outside an actually authorized Mission Contract/runtime path.

## 6. Legacy compatibility

A legacy v1.0 mission contract without v1.1 fields MUST continue to create/execute under the existing v1.0 behavior.

Do not silently upgrade legacy contracts.

## 7. Event / trace rule

Reuse the existing event ledger and trace/recovery mechanisms.

When a mission exists, expose authoritative project references using additive existing-ledger events/metadata as appropriate, such as:

- project entry mode;
- methodology pin;
- exact aligned PIP ref;
- exact PRR ref/baseline when relevant.

Do not create a second project event ledger.

## 8. I6 mandatory gate

I6 may report PASS only with evidence for:

```yaml
legacy_v1_0_mission_create: PASS
legacy_v1_0_runtime_regression: PASS
v1_1_aligned_pip_required: PASS
aligned_pip_complete_pair_required: PASS
missing_aligned_pip_rejected: PASS
invalid_pip_ref_fail_closed: PASS
stale_or_mismatched_pip_ref_rejected: PASS
methodology_pin_validation: PASS
project_entry_metadata_propagated: PASS
prr_reference_preserved_when_applicable: PASS
mission_contract_does_not_inline_pip_or_prr: PASS
existing_event_ledger_reused: PASS
trace_recovery_visibility: PASS
existing_receipts_handoffs_reused: PASS
no_parallel_runtime: PASS
new_database_state: NO
I1_I2_I3_I4_I5_regression: PASS
```

Focused negative tests are mandatory for missing/invalid/incomplete aligned-PIP authority and methodology mismatch.

## 9. Hard boundaries

```text
NO I7 STANDING AUTHORIZATION/HDF IMPLEMENTATION
NO I8 CONTINUITY ENGINE
NO I9 OBSERVABILITY PHASE BEYOND MINIMUM I6 TRACE VISIBILITY
NO I10 QUALIFICATION CLAIM
NO PARALLEL MISSION RUNTIME
NO PARALLEL PERMISSION SYSTEM
NO PARALLEL CHECKPOINT ENGINE
NO NEW PROJECT-STATE DATABASE WITHOUT CONFORMANCE FINDING
NO DIRECT MAIN WRITE
NO MERGE
NO RELEASE
NO PRODUCTION
```

## 10. Stop conditions

Codex must stop and return `BLOCKED` rather than improvising if either I5 or I6 requires:

- a breaking change to the v1.0 core;
- a second runtime/event/permission/checkpoint subsystem;
- new persistent DB project-state not previously justified;
- material change to Q1–Q20 contracts;
- weakening exact PIP/PRR/alignment binding;
- a non-delegable HUMAN_GATE;
- merge, release or production authority.

## 11. Validation cadence

For both phases independently:

```text
CHANGE
↓
FOCUSED TESTS
↓
FULL RELEVANT REGRESSION
↓
DIFF INSPECTION
↓
SMALL AUDITABLE COMMIT(S)
↓
PUSH SAME IMPLEMENTATION BRANCH
↓
LOCAL_HEAD == REMOTE_HEAD
```

I5 must have its own checkpoint before I6 begins.

## 12. Required combined receipt

```yaml
MISSION: MCF-V1.1-CODEX-IMPLEMENTATION-001
WINDOW: I5-I6-COMBINED
RESULT: PASS | FAIL | BLOCKED
START_HEAD: 162c25c4aff9c96b85ce16ebf1083c83ef906fab
FINAL_HEAD: <sha>
REMOTE_HEAD: <sha|null>

I5:
  result: PASS|FAIL|BLOCKED
  checkpoint_head: <sha|null>
  receipt:
    <all fields required by MCF-V1.1-I5-EXECUTION-WINDOW-001.md>

I6:
  started: YES|NO
  result: PASS|FAIL|BLOCKED|NOT_RUN
  start_head: <sha|null>
  final_head: <sha|null>
  runtime_integration:
    legacy_v1_0_mission_create: PASS|FAIL|N/A
    v1_1_aligned_pip_required: PASS|FAIL|N/A
    aligned_pip_complete_pair_required: PASS|FAIL|N/A
    invalid_pip_ref_fail_closed: PASS|FAIL|N/A
    methodology_pin_validation: PASS|FAIL|N/A
    project_entry_metadata_propagated: PASS|FAIL|N/A
    prr_reference_preserved_when_applicable: PASS|FAIL|N/A
    existing_event_ledger_reused: PASS|FAIL|N/A
    trace_recovery_visibility: PASS|FAIL|N/A
    existing_receipts_handoffs_reused: PASS|FAIL|N/A
    no_parallel_runtime: PASS|FAIL|N/A
    new_database_state: NO|YES|N/A

TESTS:
  - phase: I5|I6
    command: <command>
    result: PASS|FAIL
    summary: <actual result>

COMMITS:
  - phase: I5|I6
    sha: <sha>
    message: <message>

PUSH:
  performed: YES|NO
  local_remote_equal: YES|NO|N/A

FINDINGS:
  blocking: []
  non_blocking: []

FINAL_GIT_STATUS: <result>
NEXT_RECOMMENDED_WINDOW: I7 | STOP_FOR_REASSESSMENT
```

Stop after I6 and return this combined receipt. Do not execute I7.