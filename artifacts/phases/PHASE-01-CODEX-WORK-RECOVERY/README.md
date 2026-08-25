# PHASE-01-CODEX-WORK-RECOVERY

Mission: `MCF-20260825-CODEX-WORK-RECOVERY`

## Purpose

Preserve, recover, remotely checkpoint and validate the unpublished NextGen work produced by the interrupted Codex session, without reconstructing missing content by inference.

## Current artifacts

- `PHASE-01-PLAN.md` — execution plan and immediate checklist.
- `PHASE-01-CHECKPOINT.yaml` — current recoverable state.
- `PHASE-01-DECISIONS.md` — recovery decisions and boundaries.
- `docs/roadmaps/2026-08-25-codex-work-recovery-roadmap.md` — canonical roadmap, chronology and master checklist.

## Required before phase close

The following MCF Phase B traceability artifacts remain pending until real recovery/validation work exists:

- `PHASE-01-REPORT.md`
- `PHASE-01-VALIDATION.txt`
- `PHASE-01-VALIDATION-FULL.txt`
- `PHASE-01-SMOKE.txt`
- `PHASE-01-ARTIFACT-MANIFEST.sha256`

They must not be fabricated as PASS placeholders.

## Current blocker

`LOCAL_WORKTREE_NOT_EXPOSED`: the GitHub-connected session cannot currently read the filesystem containing the observed local worktree. Exact bytes or a lossless export are required before the forensic recovery commit can be produced.