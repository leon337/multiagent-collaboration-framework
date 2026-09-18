# Rollback Runbook — MCF Harness V2

- Task workspace rollback uses checkpoint + restore and is integration-tested.
- Mission Journal is append-only: rollback never deletes or rewrites events.
- Incorrect state is corrected with compensating/recovery events.
- File reconciliation requires explicit approval and produces a receipt.
- Release rollback selects the prior tested commit/branch while preserving mission history.
