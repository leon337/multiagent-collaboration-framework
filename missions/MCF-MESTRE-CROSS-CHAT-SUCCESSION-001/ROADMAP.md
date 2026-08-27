# MCF-MESTRE-CROSS-CHAT-SUCCESSION-001 — Roadmap

Status: IN_PROGRESS
Date: 2026-08-27
Authority: LEANDRO (human final authority)
Coordinator: MESTRE

## Goal

Prove that a successor MESTRE context can reconstruct and continue a material MCF mission without operational dependence on the predecessor chat.

Real payload: complete MCF v1.2.0 publication from qualified PR #175.

## State model

- `NOT_STARTED`
- `READY`
- `IN_PROGRESS`
- `HUMAN_GATE`
- `BLOCKED`
- `PASS`
- `FAIL`
- `SUPERSEDED`

Rule: **NO EVIDENCE = NO PASS**.

## Timeline / checklist

- [x] `S00 FREEZE_DESIGN` — succession protocol agreed with LEANDRO.
- [x] `S01 REMOTE_BRANCH` — persistent mission branch created on GitHub.
- [x] `S02 INITIAL_CHECKPOINT` — persistent roadmap/checkpoint/expected-state artifacts created and read back.
- [x] `S03 CAPSULE_FREEZE` — predecessor state frozen; live main/PR checked; `SUCCESSION_CAPSULE.yaml`, `SOURCE_MANIFEST.md`, `RECOVERY_CHALLENGE.md` and final reviewer evidence persisted.
- [ ] `S04 SPAWN_SUCCESSOR` — open a new ChatGPT conversation/surface for successor MESTRE.
- [ ] `S05 COLD_RECOVERY` — successor reconstructs state from persistent sources, not from copied prose alone.
- [ ] `S06 CHALLENGE` — compare recovered state against expected state.
- [ ] `S07 SUCCESSION_EQUIVALENCE` — require identity/mission/authority/PR/HEAD/tree/gates/pending-tasks match.
- [ ] `S08 HANDOFF` — predecessor becomes standby; successor becomes active after PASS.
- [x] `S09 PERSIST_FINAL_REVIEWS` — final LÉO/RENATO/EMILY release-gate opinions persisted as `FINAL_REVIEW_GATE.md`.
- [ ] `S10 MAIN_DRIFT_CHECK` — successor verifies current main immediately before merge and reconciles if needed. Pre-spawn check found no drift at `2b8ce24b71c9f9095c801dafdd762a2cef202fa9`.
- [ ] `S11 MERGE_PR_175` — merge exact qualified PR #175 HEAD with head-change protection.
- [ ] `S12 POST_MERGE_QUALIFICATION` — verify resulting main SHA/tree and canonical CI.
- [ ] `S13 TAG_V1_2_0` — create v1.2.0 tag at qualified SHA.
- [ ] `S14 GITHUB_RELEASE_V1_2_0` — publish MCF v1.2.0.
- [ ] `S15 RELEASE_RECEIPT` — verify tag → SHA → release and persist final receipt.
- [ ] `S16 CROSS_CHAT_PROOF` — successor proves it completed the mission without predecessor-chat dependence.

## Recovery rule

If the computer powers off or the current chat becomes unavailable, resume from this branch first.

Cold-recovery read order:

1. `HANDOFF.md`
2. `ROADMAP.md`
3. `CHECKPOINT.yaml`
4. `SUCCESSION_CAPSULE.yaml`
5. `SOURCE_MANIFEST.md`
6. reconcile live GitHub
7. read `FINAL_REVIEW_GATE.md`
8. produce `RECOVERED_STATE.yaml`
9. only then open/compare `EXPECTED_STATE.yaml`

Never silently replace live-state drift with frozen values.
