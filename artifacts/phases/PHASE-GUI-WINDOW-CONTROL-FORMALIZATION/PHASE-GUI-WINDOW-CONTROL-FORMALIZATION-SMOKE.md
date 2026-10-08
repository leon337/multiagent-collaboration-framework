# PHASE GUI / WINDOW CONTROL FORMALIZATION — SMOKE

Date: 2026-08-27
Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`
Candidate branch: `ops/mcf-gui-window-control-clean-candidate`
Candidate HEAD: `3a2545237ca1449b4ac2ba44d781c3e4e01be339`
Candidate PR: `#179` (DRAFT)

## Purpose

Re-run the candidate qualification from an isolated temporary clone without mutating `main`, the candidate branch, or the audit branch checkout.

## Attempt 1 — harness failure

- candidate clone HEAD verified: `3a2545237ca1449b4ac2ba44d781c3e4e01be339`;
- qualifier invoked by absolute script path while `process.cwd()` remained outside the clone;
- result: `FAIL_HARNESS_CWD` because required relative artifacts were reported missing;
- candidate mutation: `NONE`;
- classification: harness invocation error, not candidate failure.

## Attempt 2 — corrected harness

Correction: execute the exact same qualifier after `cd` into the isolated clone.

Result:

```text
SMOKE_ATTEMPT_2=PASS
QUALIFIER_LOCAL_SMOKE=PASS
candidate_head=3a2545237ca1449b4ac2ba44d781c3e4e01be339
```

Observed PASS coverage included the valid fixture plus all 15 independent negative regressions: session identity, window identity, predecessor preservation, equivalence, explicit handoff, separate predecessor-close gate, explicit new window, explicit new chat, visual assertion, monitor-aware placement, monitor identities, input mechanism enum, X11 truthfulness, shortcut observability, and simultaneous copresence regression. The composite invalid fixture was rejected for its three expected findings.

## Scope limitation

This smoke re-executes the repository qualifier on the exact candidate HEAD. It does **not** claim that a new physical predecessor/successor desktop field run was performed in this phase. The historical GUI/window discovery remains explicitly classified as `GAP_NOT_TESTED` in the original run and consolidated as `MAINTAIN_WITH_GAP`.

## Gate

`SMOKE=PASS_WITH_DECLARED_SCOPE`

No merge, tag, release, or version authorization is implied.