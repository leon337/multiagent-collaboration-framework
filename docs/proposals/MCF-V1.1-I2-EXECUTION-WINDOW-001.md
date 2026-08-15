# MCF v1.1 — I2 Execution Window 001

**Mission:** `MCF-V1.1-CODEX-IMPLEMENTATION-001`  
**Window:** `I2`  
**Status:** `AUTHORIZED_BY_MESTRE_TECHNICAL_GATE`  
**Authorization basis:** LEANDRO Option D + `MCF-V1.1-I1-TECHNICAL-GATE-002.md`  
**Required starting implementation HEAD:** `1d4bea35105b6014e036b4c8f1fd0a3a4312133e`

## 1. Objective

Implement the small repository-backed canonical project artifact layer approved by the v1.1 preparation. This is an adapter/service for durable project artifacts, **not another Mission Runtime and not a new database subsystem**.

## 2. Required capabilities

Implement behavior for:

1. canonical path construction for PIP, PRR and Intent Alignment Receipt artifacts;
2. JSON-schema validation before accepted write/load;
3. deterministic SHA-256 content digest calculation and verification;
4. immutable aligned-PIP revision protection;
5. immutable PRR revision semantics;
6. explicit distinction between `LOCAL_UNCHECKPOINTED` references (`commitSha: null`) and remote/checkpointed references;
7. exact revision load/verification by path + expected digest and, when a remote reference is claimed, exact commit metadata/reference;
8. atomic local writes where applicable;
9. focused tests proving positive and negative behavior.

Canonical path patterns remain:

```text
.mcf/intent/pip-<revisionId>.json
.mcf/reality/prr-<revisionId>.json
.mcf/receipts/intent-alignment-<receiptId>.json
```

## 3. Digest rule

Use a deterministic documented digest convention. Avoid circular self-hashing: the digest must be computed from a deterministic canonical representation of the artifact payload with the `contentDigest` field excluded or normalized by an equivalent explicitly documented repository convention. Reading must recompute and compare before accepting the artifact.

Do not silently invent a second incompatible digest convention if the repository already has a canonical hashing utility suitable for this boundary; reuse it when appropriate.

## 4. Immutability semantics

### PIP

- a PIP revision whose lifecycle is `ALIGNED` is immutable;
- a material change must become a successor revision, never overwrite the aligned revision;
- same revision/path with changed payload after alignment must fail closed.

### PRR

- a persisted PRR revision is baseline-bound and immutable as that revision;
- changed reality creates a successor PRR revision rather than mutating the previous baseline record;
- same revision/path with different content must be rejected.

### Alignment Receipt

- receipt is canonical evidence bound to exact PIP ref/digest;
- mutation/replacement of an existing receipt identity must fail closed.

## 5. Remote-checkpoint semantics

```text
commitSha: null
=> LOCAL_UNCHECKPOINTED
=> MUST_NOT_BE_REPORTED_AS_REMOTE_CHECKPOINTED
```

A non-null commit SHA in an artifact reference must not be accepted merely because a string looks like a SHA. The layer must preserve enough semantics/API separation for callers to distinguish a locally written artifact from a reference that has been resolved/verified against an exact repository commit. Actual GitHub orchestration may remain outside this low-level layer if repository architecture requires it; do not smuggle network/runtime behavior into the artifact adapter.

## 6. Scope constraints

- reuse I1 contracts/schemas;
- do not create new database tables/migrations;
- do not create parallel Mission Runtime, permission/HDF or checkpoint engines;
- do not implement I3 activation/intake behavior;
- do not implement Human Intent questioning/alignment workflow beyond artifact-layer mechanics needed to persist/verify the I1 contracts;
- do not modify `main`;
- preserve the unrelated untracked `MCF-PHASE-0-COMPLETE-REPORT.md` if it still exists locally;
- ordinary package/file placement decisions are `TEAM_FIRST`: inspect current repository conventions and choose the smallest coherent location.

## 7. Gate I2

I2 may report PASS only with evidence for:

```yaml
pip_round_trip: PASS
prr_round_trip: PASS
alignment_receipt_round_trip: PASS
aligned_revision_mutation_rejected: PASS
prr_revision_mutation_rejected: PASS
alignment_receipt_mutation_rejected: PASS
digest_mismatch_rejected: PASS
schema_invalid_write_rejected: PASS
local_uncheckpointed_not_remote: PASS
canonical_paths: PASS
atomic_local_write_behavior: PASS
legacy_I1_regression: PASS
new_database_state: NO
parallel_runtime_created: NO
```

Tests must include negative cases for mutation, digest mismatch, invalid schema and false remote-checkpoint claims/semantics.

## 8. Validation cadence

```text
IMPLEMENT I2
↓
focused artifact-layer tests
↓
contracts/schema regression
↓
full relevant workspace regression for changed boundary
↓
evidence
↓
small auditable commit(s)
↓
push implementation branch
↓
verify LOCAL_HEAD == REMOTE_HEAD
↓
return receipt to MESTRE
```

## 9. Stop conditions

Return `BLOCKED` instead of improvising if I2 appears to require:

- new DB persistent project-state tables;
- a second project/runtime state engine;
- changing I1 canonical schemas in a material way rather than a narrowly justified defect correction;
- weakening aligned PIP or PRR immutability;
- a GitHub/network dependency inside a layer that can remain repository/local adapter based;
- breaking v1.0 behavior;
- crossing a non-delegable HUMAN_GATE;
- merge, release or production action.

## 10. Required return receipt

```yaml
MISSION: MCF-V1.1-CODEX-IMPLEMENTATION-001
WINDOW: I2
RESULT: PASS | FAIL | BLOCKED

START_HEAD: 1d4bea35105b6014e036b4c8f1fd0a3a4312133e
FINAL_HEAD: <sha>
REMOTE_HEAD: <sha|null>

CHANGED_PATHS:
  - <path>

ARTIFACT_LAYER:
  location: <path/package>
  canonical_paths: PASS|FAIL
  schema_validation: PASS|FAIL
  deterministic_digest: PASS|FAIL
  atomic_write: PASS|FAIL
  local_remote_distinction: PASS|FAIL

IMMUTABILITY:
  aligned_pip_mutation_rejected: PASS|FAIL
  prr_revision_mutation_rejected: PASS|FAIL
  alignment_receipt_mutation_rejected: PASS|FAIL

ROUND_TRIP:
  pip: PASS|FAIL
  prr: PASS|FAIL
  alignment_receipt: PASS|FAIL

NEGATIVE_TESTS:
  digest_mismatch_rejected: PASS|FAIL
  invalid_schema_rejected: PASS|FAIL
  false_remote_semantics_rejected_or_unrepresentable: PASS|FAIL

TESTS:
  - command: <command>
    result: PASS|FAIL
    summary: <real result>

COMPATIBILITY:
  I1_regression: PASS|FAIL
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
NEXT_RECOMMENDED_WINDOW: I3 | STOP_FOR_REASSESSMENT
```

Stop after returning the I2 receipt. Do not execute I3 before MESTRE's technical gate.