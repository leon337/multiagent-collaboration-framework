# MCF v1.1 — Continuous Execution Authorization I5→I10

**Mission:** `MCF-V1.1-CODEX-IMPLEMENTATION-001`  
**Authority:** explicit current instruction from **LEANDRO**  
**Orchestrator:** `MESTRE`  
**Status:** `AUTHORIZED_CONTINUOUS_EXECUTION`  
**Required starting implementation HEAD:** `162c25c4aff9c96b85ce16ebf1083c83ef906fab`

## 1. Current LEANDRO instruction

LEANDRO explicitly authorized MESTRE + MCF team to assume execution continuously from **I5 through I10** and return only after all implementation phases and v1.1.0 completion, except if a genuinely non-delegable HUMAN_GATE blocks progress.

This instruction supersedes the previous operational requirement to stop after I6.

## 2. Continuous sequencing

```text
I5
↓ internal technical gate
I6
↓ internal technical gate
I7
↓ internal technical gate
I8
↓ internal technical gate
I9
↓ internal technical gate
I10
↓ exact-head qualification + independent review
RETURN TO LEANDRO
```

`TEAM_FIRST` applies throughout. Ordinary technical decisions inside the approved envelope are delegated to MESTRE + MCF team.

## 3. Evidence discipline

Every phase preserves:

```text
CHANGE
↓
FOCUSED TESTS
↓
FULL RELEVANT REGRESSION
↓
EVIDENCE
↓
SMALL AUDITABLE COMMIT(S)
↓
REMOTE CHECKPOINT
↓
INTERNAL MESTRE GATE
```

Evidence must remain bound to exact tested HEADs. I10 remains blocking and the Q19 independent review requirement remains mandatory.

## 4. Existing phase specifications remain controlling

I5 remains governed by `MCF-V1.1-I5-EXECUTION-WINDOW-001.md`.

I6–I10 remain governed by `MCF-V1.1-IMPLEMENTATION-PLAN-001.md`, `MCF-V1.1-TECHNICAL-CONTRACTS-001.md`, `MCF-V1.1-QUALIFICATION-PLAN-001.md`, the Decision Ledger, and any later phase-specific technical gate/window persisted by MESTRE.

No intermediate human return is required merely because a phase ends.

## 5. Reserved boundaries remain reserved

This continuous authorization does **not** silently authorize:

- direct writes to `main`;
- merge to `main`;
- release/tag publication;
- production deployment;
- redefinition of Q1–Q20;
- a parallel Mission Runtime, permission system, or checkpoint engine;
- a new project-state database without conformance reassessment.

If v1.1.0 completion strictly requires one of those reserved actions and there is no existing explicit LEANDRO authorization covering it, that is a non-delegable HUMAN_GATE.

## 6. Return condition

MESTRE returns to LEANDRO only when one of these conditions is true:

1. I5–I10 are complete and the v1.1.0 implementation has passed its exact-head qualification and independent review within the authorized envelope; or
2. a genuinely non-delegable HUMAN_GATE prevents further progress.

Do not declare v1.1.0 complete merely because code exists. `IMPLEMENTED != TESTED != QUALIFIED` remains binding.
