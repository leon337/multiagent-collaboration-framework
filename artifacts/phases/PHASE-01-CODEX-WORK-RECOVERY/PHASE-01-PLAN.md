# PHASE-01 — Codex Work Recovery

Mission: `MCF-20260825-CODEX-WORK-RECOVERY`  
Risk class: `B`  
Coordinator: Mestre  
State: `EM_EXECUCAO / T0_COMPLETO / T1_PENDENTE`

## Objective

Recuperar o payload exato da worktree NextGen não publicada, preservá-lo em checkpoint remoto e validar continuidade sem reconstrução por inferência.

## Canonical roadmap

`docs/roadmaps/2026-08-25-codex-work-recovery-roadmap.md`

## Current baseline

- `main`: `85ccf418740e78b5e1e3eeb7742baf6f869978c1`
- stable release: `v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`
- concurrent PR: `#170`, OPEN, head `1da1a13bd8ca47bed2f4a4e560e64691788582f8`
- observed local worktree: `/home/leo/Documentos/GitHub/multiagent-collaboration-framework-nextgen-reconciliation-20260824`
- observed local diff: `19 files / +1759 -318` — screenshot evidence only

## Execution order

1. Mestre — freeze mission/baseline and maintain checkpoints.
2. Miriam — recover source/provenance map from exact payload.
3. Gabriel — acquire/inventory payload and create forensic remote checkpoint.
4. Sofia — reconcile architecture and semantic drift.
5. Ricardo — validate recovery/security/secret boundary.
6. Beatriz — execute acceptance/regression validation.
7. Emily — independent audit.
8. Léo — operational gate.
9. Mestre — handoff to original NextGen mission.

Agents are selected for concrete deliverables. No role receives execution credit before evidence exists.

## Immediate checklist

- [x] Read live `main`.
- [x] Read live latest release.
- [x] Read live PR #170.
- [x] Create `mission/codex-work-recovery-20260825` from exact main SHA.
- [x] Publish recovery roadmap.
- [x] Open Phase 01 plan.
- [ ] Acquire exact local payload.
- [ ] Preserve binary diff/untracked files/hashes before transformation.
- [ ] Publish forensic checkpoint commit.
- [ ] Reconcile with live baseline.
- [ ] Validate.
- [ ] Audit.
- [ ] Gate.
- [ ] Handoff to NextGen.

## Hard prohibitions

- no screenshot-based file reconstruction;
- no reset/clean of the original worktree;
- no force-push;
- no direct write to `main`;
- no runtime/VPS/production/release changes;
- no NX-0 implementation in this recovery phase;
- no fabricated agent participation or review.

## Acceptance

Phase 01 is deliverable only when the recovered bytes are remotely checkpointed, provenance is preserved, validation is tied to an exact SHA, audit is complete, and the original NextGen mission can resume from an explicit checkpoint.