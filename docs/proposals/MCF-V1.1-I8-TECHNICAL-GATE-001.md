# MCF v1.1 — I8 Technical Gate 001

## Identity

- Mission: `MCF-V1.1-CODEX-IMPLEMENTATION-001`
- Phase: `I8`
- Human authority: **LEANDRO**
- Orchestrator / gate owner: **MESTRE**
- Technical executor: `CODEX_LOCAL`
- Implementation branch: `feat/mcf-v1.1-project-intake-continuity`

## Verdict

```yaml
I8: PASS
accepted_head: 77356ae21cbb44af2f3389f005665b19839644b5
blocking_findings: 0
scope: CONTINUITY_RECOVERY_AND_TRANSFERABLE_CHECKPOINT
next_phase: I9
```

## Accepted behavior

I8 extends the existing checkpoint/recovery concepts and preserves Q17:

- durable transferable checkpoint at material transfer boundaries;
- Resume Card is a derived rebuildable orientation view, not authority;
- verified resume evaluates canonical checkpoint + authoritative records + live state;
- `FAST_RESUME` only for exact compatible live state;
- `RECONCILE` for explainable live drift;
- `RECOVER_MCF_PROJECT` for missing, invalid or materially unexplained continuity;
- prior chat transcript/memory is not required for verified resume;
- uncheckpointed local-only work is never claimed as transferred;
- missing local state is declared lost/unverified rather than invented;
- canonical historical state is not silently rewritten by current live volatile state.

## Evidence status

The phase checkpoint is preserved at the exact commit above. Final exact-head I10 qualification re-executes these boundaries through QP-003, QP-004, QP-005, QP-014 and QP-019, including clean-room continuity.

## Structural boundaries

```yaml
parallel_checkpoint_engine_created: false
parallel_recovery_runtime_created: false
new_project_state_database: false
main_write: false
merge: false
release: false
production: false
```
