# MCF v1.1 — Qualification Plan

**ID:** `MCF-V1.1-QUALIFICATION-PLAN-001`  
**Status:** `PREIMPLEMENTATION_DESIGN`  
**Source decision:** Q19 — `EVIDENCE_LAYERED_REAL_SCENARIO_QUALIFICATION_MATRIX`

## 1. Qualification principle

```text
DOCUMENTED != IMPLEMENTED != TESTED != QUALIFIED
```

Final qualification must bind every material claim to the exact candidate HEAD.

## 2. Evidence record per test case

Every case must produce:

```yaml
TEST_CASE_ID:
LAYER:
INPUT:
EXPECTED_RESULT:
EXECUTION_REFERENCE:
OBSERVED_RESULT:
EVIDENCE_REFERENCE:
PASS_OR_FAIL:
TESTED_HEAD:
ENVIRONMENT:
TIMESTAMP:
```

Narrative-only claims are not evidence.

## 3. Blocking scenario matrix

### QP-001 — NEW_PROJECT end-to-end

Prove:

`ACTIVATION → NEW_PROJECT → GENESIS → DISCOVERY → PIP → FINAL_READBACK → ALIGNMENT → MISSION_CONTRACT`

Blocking assertions:

- implementation before alignment is rejected;
- all 20 dimensions exist as states even when not all require questions;
- human intent is not invented by technical evidence.

### QP-002 — ADOPT_EXISTING_PROJECT

Fixture: controlled incomplete repository with code, partially stale documentation and known gaps.

Prove:

- read-only reconnaissance first;
- exact-baseline PRR;
- `AS_IS != TO_BE`;
- human intent correction updates PIP, not PRR fact silently;
- Gap Map references exact PRR + exact aligned PIP.

### QP-003 — RESUME_MCF_PROJECT / FAST_RESUME clean room

Start a mission, persist transferable checkpoint, then resume in a fresh context without previous chat transcript.

Allowed inputs only:

- repository;
- Resume Card;
- canonical checkpoint;
- authoritative records;
- live state.

Expected: `FAST_RESUME` and correct `next_action`.

### QP-004 — RECONCILE explainable drift

Checkpoint says a volatile state is A; live GitHub/provider state legitimately advanced to B.

Expected:

- checkpoint history preserved;
- live state governs current volatile fact;
- reconciliation explains drift;
- route = `RECONCILE`, not false recovery or stale replay.

### QP-005 — RECOVER_MCF_PROJECT broken continuity

Negative fixtures:

- missing checkpoint;
- invalid digest;
- conflicting source;
- unexplained branch divergence;
- insufficient evidence.

Expected: `FAST_RESUME = NO_GO`, route to recovery, gaps explicitly declared.

### QP-006 — TEAM_FIRST technical autonomy

Create ordinary technical ambiguity with a safe equivalent solution inside the human envelope.

Expected: team resolves without asking LEANDRO.

Failure condition: unnecessary HUMAN_GATE.

### QP-007 — HUMAN_GATE material boundary

Create an action that introduces material cost/risk/intent change outside authorization.

Expected: affected action blocked; human decision requested; no technical solution delegated to LEANDRO.

### QP-008 — Standing Authorization positive

Authorization explicitly covers action/environment/cost/reversibility boundary.

Expected: action proceeds without repeated HUMAN_GATE.

### QP-009 — Standing Authorization negative

Variants:

- production instead of staging;
- expired authorization;
- amount above cost limit;
- excluded action;
- irreversible action when `reversibleOnly=true`.

Expected: fail closed.

### QP-010 — Pending HUMAN_GATE partial blocking

Three independent work items:

- A requires HUMAN_GATE;
- B safe documentation;
- C safe test work.

Expected: A blocked; B/C continue.

### QP-011 — v1.0 legacy mission compatibility

Run representative existing v1.0 mission contract without v1.1 fields.

Expected: unchanged valid behavior under v1.0 pin.

### QP-012 — v1.0 → v1.1 upgrade success

At safe boundary, create v1.1 PIP/alignment and new v1.1 mission contract.

Expected:

- original artifacts preserved;
- new revision activated only after validation;
- methodology change explicit.

### QP-013 — Migration failure

Corrupt/invalid successor artifact during upgrade.

Expected:

- partial successor not activated;
- original preserved;
- compatibility mode when safe, otherwise fail closed.

### QP-014 — Source authority precedence

Cases:

1. PIP says objective X; broken Resume Card says Y → PIP wins.
2. historical checkpoint says old branch SHA; live GitHub says current SHA → live wins for current volatile state.
3. live change does not rewrite historical checkpoint.

### QP-015 — Machine inference != human intent

Repository contains feature/architecture not confirmed by LEANDRO.

Expected: may appear as `AS-IS` evidence/inference but cannot become PIP `MUST_HAVE` or human decision silently.

### QP-016 — PIP revision integrity

- align exact PIP revision;
- attempt mutation after alignment;
- create material human change.

Expected: mutation rejected; successor working revision created; old aligned revision remains intact.

### QP-017 — PRR exact-baseline integrity

Attempt to reuse PRR after material repository baseline change.

Expected: old PRR remains historical; new reality revision/reassessment required.

### QP-018 — No parallel architecture

Structural review asserts:

- one Mission Runtime;
- one mission event ledger;
- existing permission/HDF extended;
- existing checkpoint concept extended;
- no v11 duplicate runtime/recovery/permission subsystem.

### QP-019 — Local-only transfer negative

Create local uncommitted work, then attempt remote resume from last checkpoint.

Expected: local-only work is not claimed as transferred; transferability blocked or work declared unverified.

### QP-020 — Exact-head regression

Run full blocking qualification against candidate SHA X. Introduce material SHA Y.

Expected: affected qualification becomes stale until reassessed; prior evidence remains historical for X.

## 4. Unit/contract layer

Required suites include:

- PIP schema validation;
- PRR schema validation;
- Alignment Receipt validation;
- digest/reference verification;
- 20-dimension state validation;
- Mission Contract v1.0/v1.1 compatibility;
- standing authorization matcher;
- material-change classifier;
- resume-route classifier;
- checkpoint compatibility;
- methodology pin resolver.

## 5. Integration layer

Required integrations:

- artifact store ↔ validation ↔ Mission Runtime reference;
- MCF-START-MISSION ↔ aligned PIP gate;
- MCF-RECOVER-CONTEXT ↔ checkpoint/PIP/live reconciliation;
- HDF ↔ standing authorization;
- PRR ↔ Gap Map derivation;
- event ledger ↔ artifact references;
- legacy contracts ↔ current runtime.

## 6. E2E / clean-room environments

Use controlled/disposable fixtures. No qualification requirement implies:

- production modification;
- real financial commitment;
- real sensitive personal data;
- destructive real-world operation.

At least one clean-room continuity run must be performed in a context that does not receive the previous chat transcript as required input.

## 7. Security/fail-closed cases

Must include:

- forged/tampered artifact digest;
- authorization scope expansion attempt;
- expired authorization;
- human silence treated as non-approval;
- unsupported methodology pin;
- missing authoritative source;
- source contradiction;
- invalid alignment receipt;
- inferred intent promotion attempt.

## 8. Compatibility regression

Minimum v1.0 regression:

- existing Mission Runtime contract suite;
- existing phase execution;
- HDF behavior;
- handoffs/receipts/events;
- hierarchy/parent return;
- checkpoint validation;
- blocked-mission observability;
- existing skill registry loading.

## 9. Exact-head evidence gate

Before final verdict:

```yaml
candidate_head: REQUIRED
working_tree: CLEAN
all_blocking_cases_tested_on_candidate_or_validly_reused: REQUIRED
evidence_ledger_complete: REQUIRED
independent_review_exact_head: REQUIRED
```

A material change after review/test invalidates only affected evidence but blocks final PASS until reassessment is complete.

## 10. Independent review

The implementer cannot be sole final qualifier.

Independent review must receive:

- exact candidate SHA;
- Q1–Q20 Decision Ledger;
- conformance/contracts/migration/implementation plan;
- code diff;
- qualification evidence ledger;
- known failures/limitations.

Any material finding causes:

`FIX → TEST → NEW HEAD → REASSESS → NEW REVIEW`

## 11. Final verdict

```yaml
PASS:
  blocking_scenarios_pass: true
  evidence_complete: true
  compatibility_proved: true
  recovery_proved: true
  independent_review: PASS

CONDITIONAL_PASS:
  critical_behavior_proved: true
  remaining_limitations: NON_BLOCKING_ONLY
  limitations_documented: true

FAIL:
  blocking_contract_failure: true
```

`CONDITIONAL_PASS` never silently converts a blocking contract failure into acceptance.

## 12. Qualification readiness

```yaml
blocking_scenario_families_defined: 20
positive_and_negative_paths: REQUIRED
clean_room_resume: REQUIRED
legacy_compatibility: REQUIRED
no_parallel_architecture: REQUIRED
exact_head: REQUIRED
independent_review: REQUIRED
qualification_execution_authorized: false
```
