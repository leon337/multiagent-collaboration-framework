# MCF Multi-Agent Harness V2 — Verification Plan

Mission: `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`  
Status: TEST_PLAN_CANDIDATE  
Date: 2026-09-18

## Unit-test matrix

| Area | Required proof |
|---|---|
| Journal | monotonic seq, idempotency dedup, schema rejection |
| Projection | deterministic replay, invalid transition fails closed |
| Roster | immutable identity, provisioning -> active/failed |
| Task CAS | stale revision rejected |
| Task DAG | missing/self/cycle rejected |
| Lease | expiry enters recovery state |
| Mailbox | queue before delivery, duplicate receipt dedup |
| Tool evidence | no tool credit without correlated completion |
| Permissions | task narrowing cannot widen baseline |
| Budget | all worker usage included in mission total |
| Lifecycle | admission cutoff + bounded settlement |

## Integration tests

```text
A crash after agent/provisioning -> restart -> reconcile without duplicate
B crash after message/queued -> restart -> deliver logically once
C target receipt persisted before delivered ack -> restart -> ack without duplicate model delivery
D two workers update same task revision -> one success, one explicit conflict
E worker dies holding lease -> expiry -> recovery_required -> governed reassignment
F concurrent code tasks overlap -> isolation prevents direct overwrite
G executor swap A -> checkpoint -> executor B without changing mission truth
H fan-out/fan-in -> fan-in blocked until required dependencies complete
I resource accounting -> root + all workers included
```

## Failure injection

Inject SIGKILL, storage failure, executor timeout, malformed/duplicate event, stale revision, duplicate receipt, unavailable tool, partial artifact upload, expired lease and cancellation during disposal.

Every injected failure must yield a deterministic checkpoint or visible blocked state. False green is forbidden.

## Prototype acceptance

```text
journal_replay=PASS
task_cas=PASS
task_dag=PASS
mailbox_crash_recovery=PASS
lease_recovery=PASS
tool_evidence_correlation=PASS
executor_swap=PASS
resource_accounting=PASS
false_green=0
```

No production or Cognitive Ledger mutation is authorized by these tests.