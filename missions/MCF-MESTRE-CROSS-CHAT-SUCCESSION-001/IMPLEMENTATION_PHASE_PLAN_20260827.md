# Implementation Phase Plan — GUI / Window Control

Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`
Phase: GUI_WINDOW_CONTROL_FORMALIZATION
Class: B
Authority: LEANDRO
Coordinator: MESTRE

## Objective

Formalize and qualify the team-approved `MAINTAIN_WITH_GAP` GUI/window-control candidate behavior without mutating `main`, choosing a version, merging, tagging or releasing.

## Acceptance criteria

1. A dedicated cross-chat GUI/window-control protocol extension exists on a non-main branch.
2. The protocol explicitly separates successor session identity from OS-window/surface identity.
3. The predecessor surface must remain available through equivalence + explicit handoff.
4. Predecessor close/replacement is a separate governed action.
5. Trace evidence distinguishes X11 synthetic events from device-level input.
6. Window placement is monitor-aware and observable.
7. A machine-readable trace schema/fixture covers the required fields.
8. Qualification tests prove the required files/fields/invariants exist and reject an incomplete candidate.
9. The unified operational protocol references the extension.
10. No `main`, merge, tag, release or version-number mutation occurs.

## TDD sequence

```text
RED: add qualification that requires the new protocol/schema/fixture and observe failure
GREEN: add minimal protocol + schema + fixture + unified-protocol reference
VERIFY: run qualification and existing docs validation where applicable
AUDIT: Renato/Beatriz/Augusto/Emily review evidence
GATE: return checkpoint to LEANDRO
```

## Required phase traceability artifacts

- plan: this file;
- report;
- validation summary + full log reference;
- smoke result;
- checkpoint;
- decisions;
- manifest or explicit checksum receipt.
