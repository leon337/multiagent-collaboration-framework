# MCF v1.1 — I3 Technical Gate 001

**Mission:** `MCF-V1.1-CODEX-IMPLEMENTATION-001`  
**Window:** `I3`  
**Gate:** `RETURN_FOR_CORRECTION`  
**Orchestrator:** `MESTRE`  
**Human authority:** `LEANDRO`  
**Reviewed implementation HEAD:** `1fea1c863280c30758d89bbcc2e9d561a3b804b4`

## 1. GitHub state verified

```yaml
implementation_branch: feat/mcf-v1.1-project-intake-continuity
start_head: 6de580c48d8617a4bf0688af09325225bf583f95
reviewed_head: 1fea1c863280c30758d89bbcc2e9d561a3b804b4
compare_status: ahead
ahead_by: 2
behind_by: 0
changed_paths: 5
main_live: b91823a947715e09d69c72999e2278523f2259be
```

The remote implementation HEAD matches the Codex receipt. The I3 diff is limited to activation, project-entry classification and Human Intent Discovery code/tests.

## 2. Behaviors accepted in the candidate

Code/diff inspection supports the following I3 behaviors:

- `NOT_ACTIVE -> ACTIVATING -> ACTIVE` activation state machine;
- `NEW_PROJECT`, `ADOPT_EXISTING_PROJECT`, `RESUME_MCF_PROJECT` classification;
- `RECOVER_MCF_PROJECT` as a recovery route rather than a fourth normal entry mode;
- ambiguous/conflicting entry evidence remains unresolved;
- all 20 canonical intent dimensions are represented;
- deterministic evidence-aware question selection prioritizes unresolved blocking dimensions and excludes ordinary `TEAM_FIRST_TECHNICAL` questions from LEANDRO routing;
- progressive read-back is explicitly a derived view and grants no implementation authority;
- blocking unknowns prevent `READY_FOR_ALIGNMENT`;
- `READY_FOR_ALIGNMENT` does not grant implementation authority;
- machine-only provenance cannot create a CLEAR human preference;
- machine inference cannot directly create a human decision;
- incremental PIP successor revisions reuse the I2 repository-backed store;
- I3 rejects attempts to cross into `ALIGNED` / I4 behavior;
- no new DB state or parallel Mission Runtime appears in the I3 diff.

## 3. Blocking finding — material human-decision supersession is incomplete

The canonical Discovery contract requires historical preservation when a material human decision changes:

```text
OLD_HUMAN_DECISION -> SUPERSEDED
NEW_HUMAN_DECISION -> CURRENT
```

Q9 states that an explicit human-decision change preserves history by marking the prior decision `SUPERSEDED` and the new decision `CURRENT`. Q12 repeats this as a PIP invariant and forbids overwriting material human decisions.

The current `createIncrementalIntentRevision()` validates provenance for new `humanDecisions` and appends them to `successor.humanDecisions`, but it does not provide/enforce the required transition of the superseded prior decision from `CURRENT` to `SUPERSEDED`. Therefore a caller can append a replacement `CURRENT` decision while the previous material decision remains `CURRENT`, producing an authority/history state inconsistent with Q9/Q12.

This is an I3 concern because Human Intent Discovery owns incremental PIP working revisions and decision-history preservation before I4 alignment.

## 4. Required correction

Within I3 only:

1. implement deterministic human-decision supersession semantics for incremental PIP revisions;
2. when a new human decision declares it supersedes an existing current decision, preserve the old record but set it to `SUPERSEDED` and keep the new record `CURRENT`;
3. fail closed when `supersedesDecisionId` does not identify a valid existing decision or when the transition would create contradictory active material decisions;
4. prevent machine-only provenance from performing or fabricating the supersession;
5. preserve all decision provenance/history;
6. add positive and negative tests proving the transition;
7. preserve the existing I3 boundary: no I4 PASS receipt, no final `ALIGNED` transition, no I5–I8 implementation.

A technically equivalent API is acceptable under `TEAM_FIRST` if the observable contract above is preserved.

## 5. Required correction tests

At minimum add focused evidence for:

```yaml
prior_current_decision_becomes_superseded: PASS
replacement_human_decision_is_current: PASS
old_decision_history_and_provenance_preserved: PASS
unknown_supersedes_decision_id_rejected: PASS
machine_only_supersession_rejected: PASS
no_duplicate_current_material_decision_created: PASS
I3_existing_tests: PASS
I1_I2_regression: PASS
v1_0_regression: PASS
```

Run the focused I3 suite, contract/artifact regression, and relevant full server/workspace regression before reporting PASS.

## 6. Gate verdict

```yaml
I3: RETURN_FOR_CORRECTION
reviewed_head: 1fea1c863280c30758d89bbcc2e9d561a3b804b4
blocking_findings: 1
new_human_gate_required: false
I4_authorized: false
next_action: CODEX_EXECUTE_I3_CORRECTION_001_ONLY
```

The existing LEANDRO Option D implementation authorization remains valid. This finding is a technical correction inside the approved envelope. Merge, release and production remain unauthorized.
