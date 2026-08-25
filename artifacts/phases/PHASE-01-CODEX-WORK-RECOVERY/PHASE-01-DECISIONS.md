# PHASE-01 — Decisions

Mission: `MCF-20260825-CODEX-WORK-RECOVERY`

## D-001 — Recovery branch isolation

**Decision:** execute recovery on `mission/codex-work-recovery-20260825`, created from exact `main@85ccf418740e78b5e1e3eeb7742baf6f869978c1` observed at mission opening.

**Reason:** preserve `main`, isolate recovery lineage and allow exact before/after comparison.

## D-002 — Exact payload over reconstruction

**Decision:** the unpublished worktree is the primary source for the 19-file package. Screenshots and summaries may corroborate but may not be used to recreate missing file contents.

**Reason:** avoid invented or silently altered recovery.

## D-003 — Forensic checkpoint before improvement

**Decision:** the first commit that receives the recovered payload must preserve the recovered state before semantic fixes, rebase-driven edits or cleanup.

**Reason:** separate `what Codex produced` from `what recovery later changed`.

## D-004 — Reconcile live state only after preservation

**Decision:** preserve recovered bytes first, then compare against current `main`, PR #170 and other relevant current work.

**Reason:** drift reconciliation must not erase provenance of the original local work.

## D-005 — Recovery does not authorize NextGen implementation

**Decision:** NX-0/runtime/VPS/production/release remain out of scope. The recovery phase ends with a verified continuity checkpoint and handoff.

## D-006 — No simulated agent credit

**Decision:** selected agents describe required competencies/deliverables. Participation is recorded only after a real, attributable action/evidence exists.

## D-007 — Known unresolved architectural item remains explicit

**Decision:** `state ↔ ledger` consistency/atomicity remains an explicit validation item until direct evidence closes it.

**Reason:** prior review history raised the concern; absence from later screenshots is not evidence of resolution.