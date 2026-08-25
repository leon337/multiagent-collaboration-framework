# PHASE-01-CODEX-WORK-RECOVERY

Mission: `MCF-20260825-CODEX-WORK-RECOVERY`

Last updated: `2026-08-25 02:15 BRT (America/Recife)`

## Purpose

Preserve, recover, remotely checkpoint and validate the unpublished NextGen work produced by the interrupted Codex session, without reconstructing missing content by inference.

This phase also plans two permanent MCF skills:

1. failure autopsy for agent errors;
2. mission checkpoint/status presentation for cross-chat continuity.

## Canonical current roadmap

- `docs/roadmaps/2026-08-25-codex-work-recovery-auditable-roadmap-v2.md` — **único roadmap operacional canônico**, com status mutável, checklist cronológico, timestamps, audit log e próxima ação.

O roadmap inicial incorreto foi retirado de `docs/roadmaps/`. Sua existência e causa da supersessão estão preservadas em:

- `history/INITIAL-ROADMAP-SUPERSEDED.md` — **SUPERSEDED / não usar para continuidade**;
- histórico Git no commit `346419a745bd60f13f36f5edbb22294c98f65df0` e blob `5023279fc8e4d5103bcf7774c3a07d6565f8e5f7`.

## Current verified state

- Direct host access to `leo-N43SM`: `VERIFIED`.
- Worktree path accessible directly through SentinelX.
- Local worktree branch: `docs/mcf-nextgen-reconciliation-f14-plan-20260824`.
- Local worktree HEAD: `85ccf418740e78b5e1e3eeb7742baf6f869978c1`.
- Current tracked diff observed: `12 files / +1261 / -213` plus untracked `artifacts/phases/PHASE-NEXTGEN-RECONCILIATION-F14-001/`.
- Historical screenshot snapshot `19 files / +1759 / -318` remains evidence to reconcile, not current measured truth.
- The false blocker `LOCAL_WORKTREE_NOT_EXPOSED` is superseded.
- Governance failure `TWO_APPARENT_ACTIVE_ROADMAPS` was identified by Leandro, approved for correction at `2026-08-25 02:12 BRT` and corrected at `2026-08-25 02:15 BRT`.
- Current phase state: `AGUARDANDO_GATE_HUMANO`.
- Current stage: `R2 — Leandro reviews the auditable checklist`.

## Current artifacts

- `PHASE-01-PLAN.md` — initial execution plan.
- `PHASE-01-CHECKPOINT.yaml` — current recoverable state.
- `PHASE-01-DECISIONS.md` — recovery decisions and boundaries.
- canonical roadmap v2 above — authoritative chronology/current position.
- `history/INITIAL-ROADMAP-SUPERSEDED.md` — historical failure evidence only.

## Required before phase close

The following MCF Phase B traceability artifacts remain pending until real recovery/validation work exists:

- `PHASE-01-REPORT.md`
- `PHASE-01-VALIDATION.txt`
- `PHASE-01-VALIDATION-FULL.txt`
- `PHASE-01-SMOKE.txt`
- `PHASE-01-ARTIFACT-MANIFEST.sha256`

They must not be fabricated as PASS placeholders.

## Current gate

`LEANDRO-REVIEW-AUDITABLE-ROADMAP-V2`: Leandro must approve or correct the chronological checklist before skill implementation or material recovery work begins.
