# PRF — PHASE GUI / WINDOW CONTROL FORMALIZATION

Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`
Date: 2026-08-27
PRF class: **B**
Storage boundary: audit branch `ops/mcf-mestre-cross-chat-succession-001`
Candidate boundary: PR `#179`, branch `ops/mcf-gui-window-control-clean-candidate`

## Purpose

This directory is the Phase Traceability Package for the GUI/window-control formalization. It is intentionally stored outside the clean candidate PR so audit/ledger artifacts do not contaminate the 7-file product/test payload.

## Expected package

1. `PHASE-GUI-WINDOW-CONTROL-FORMALIZATION-PLAN.md`
2. `PHASE-GUI-WINDOW-CONTROL-FORMALIZATION-REPORT.md`
3. `PHASE-GUI-WINDOW-CONTROL-FORMALIZATION-VALIDATION.txt`
4. `PHASE-GUI-WINDOW-CONTROL-FORMALIZATION-VALIDATION-FULL.txt`
5. `PHASE-GUI-WINDOW-CONTROL-FORMALIZATION-SMOKE.md`
6. `PHASE-GUI-WINDOW-CONTROL-FORMALIZATION-CHECKPOINT.yaml`
7. `PHASE-GUI-WINDOW-CONTROL-FORMALIZATION-DECISIONS.md`
8. `PHASE-GUI-WINDOW-CONTROL-FORMALIZATION-MISSION-TRACE.md`
9. `README.md`
10. `ARTIFACT-MANIFEST.sha256`

## Candidate truth

```text
historical CROSS_CHAT_SUCCESSION=PASS
original GUI/window invariant coverage=GAP_NOT_TESTED
consolidated classification=MAINTAIN_WITH_GAP
candidate PR=179 DRAFT
candidate HEAD=3a2545237ca1449b4ac2ba44d781c3e4e01be339
candidate qualification=PASS
main mutation=NONE
merge/tag/release/version authorization=NONE
```

## Human-visible collaboration

During PRF completion, MESTRE used the user's isolated ChatGPT project contexts for LÉO and EMILY and opened a visible terminal titled `MCF — MESTRE | LÉO | EMILY` tailing `/home/leo/mcf-visible-collaboration.log`. This is operational observability; it is not part of the 7-file candidate payload.

## Closure rule

The package is not considered closed merely because all filenames exist. Integrity must be represented by `ARTIFACT-MANIFEST.sha256`, the checkpoint must accurately reflect the final state, and the isolated EMILY context must re-audit the completed PRF before MESTRE opens the next HUMAN_GATE to LEANDRO.