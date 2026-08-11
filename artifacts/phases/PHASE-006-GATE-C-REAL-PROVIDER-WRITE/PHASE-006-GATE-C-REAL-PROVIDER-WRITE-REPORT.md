# PHASE-006-GATE-C-REAL-PROVIDER-WRITE — Report

## Result before audit

The controlled real-provider acceptance proof is technically complete. Gate C is not promoted to `COMPLETE` in this document until the independent audit and Léo gate are recorded.

## Execution chronology

1. The phase opened from Issue #111 with production and public release blocked.
2. Runtime composition review found C2 implemented but not wired into the live `AdapterRegistry`. C2 was wired and a registry regression test was added.
3. The first real C1 attempt proved branch creation but GitHub Actions could not create a PR. The runtime returned the correct authorization failure; no false success was recorded.
4. A HUMAN_GATE was directed to Leandro. Leandro enabled `Allow GitHub Actions to create and approve pull requests`.
5. C2 was isolated on PR #112 and proven successfully by a real `github-actions[bot]` comment, including read-back, ledger and duplicate protection.
6. Historical tests that intentionally required C2 to remain disconnected were reconciled with the new approved boundary while preserving the Gate D staging boundary.
7. The full proof harness was moved from direct `SkillExecutor` calls to the canonical `MissionRuntimeService` lifecycle so phase persistence/versioning matched real runtime operation.
8. A bounded Vitest timeout was added only for the external proof; normal runtime behavior was unchanged.
9. A live C1 run exposed a real transient post-write read-back weakness: the branch existed in GitHub while the adapter returned `PARTIAL/UNKNOWN CREATE_BRANCH`. The runtime correctly entered recovery and did not create a PR.
10. The C1 adapter was hardened to retry only bounded GET read-back operations. Mutation POSTs remain single-shot. New tests prove transient branch/PR read-back recovery without duplicate POSTs and preserve `UNKNOWN` when proof cannot be obtained.
11. Normal Foundation and Container Smoke passed on the corrected candidate.
12. Cycle 11 executed the complete real-provider proof successfully.

## Final technical evidence

```yaml
proof_run: 31535822880
proof_head: 10f56d5a61f4e5c2d94d99bc42971b965eea3c6a
base_main: 9c6bd49173af31b36200208c009d6952403b4d71
proof_artifact_id: 9118718153
proof_artifact_digest: sha256:648875d2c18bf2bc974943ec9e9a5861ec6306968a0386a2df122b18e3c819a8
proof_stage: COMPLETE
proof_pr: 116
proof_branch: mcf/gate-c-proof-10f56d5a61f4
proof_comment_id: 5258813162
production: BLOCKED
```

## C1 result

- Adapter: `github-branch-pr-write-v1`.
- First execution receipt: `SUCCEEDED`.
- Read-back: verified.
- Proof PR count: exactly 1.
- Compatible replay external ID: `116`, identical to original PR.
- Compatible replay read-back: verified.
- No duplicate PR produced.

## C2 result

- Adapter: `github-pr-collaboration-write-v1`.
- Real comment ID: `5258813162`.
- Read-back: verified.
- Proof comment count: exactly 1.
- Duplicate replay: `FAILED / RESERVATION_CONFLICT`.
- Duplicate replay attempt ID: `null`; no second external mutation was reserved.

## Ledger result

Three canonical attempts are recorded for the proof mission:
- C1 original — `EVIDENCE_VALIDATED`.
- C1 compatible replay — `EVIDENCE_VALIDATED`.
- C2 original — `EVIDENCE_VALIDATED`.

Three trusted receipts are recorded.

## CI and smoke

- Foundation run `31535827252`: SUCCESS on proof head.
- Container Smoke run `31535827335`: SUCCESS on proof head.
- Dedicated Gate C proof run `31535822880`: SUCCESS.
- Additional `action_required` checks belong to bot-created proof PR #116 and are not failed technical checks on PR #112.

## Open items before closeout

- Emily independent audit: PENDING.
- Léo gate: PENDING.
- Canonical Gate C state promotion: PENDING audit/gate.
- Gate E start: BLOCKED until this phase is formally closed.
