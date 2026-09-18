# EVIDENCE — MCF Harness Graph Engine 2.2 MVP

## Technical candidate

SHA: `6d961e6e1572c75aea4abe95a0bdf221439fa228`

### Harness validation
- Run: `35393552144`
- Result: **SUCCESS**
- Tests: **83**
- Failures: **0**

### Production Readiness
- Run: `35393552168`
- Result: **SUCCESS**
- Formatting: PASS
- Lint: PASS
- Typecheck: PASS
- Migrations twice: PASS
- Initial-human bootstrap: PASS
- Bubblewrap preparation: PASS
- Test: PASS
- Build: PASS
- PostgreSQL client: PASS
- Backup + isolated restore: PASS
- Release-readiness contracts: PASS

## Graph MVP

Fan-out graph:
```text
        ┌→ TEST_A ─┐
START ──┼→ TEST_B ─┼→ AUDIT → END
        └→ TEST_C ─┘
```

Observed:
- runtime cells: 3;
- unique PIDs: 3;
- peak concurrency: 3;
- AUDIT blocked until all three test nodes completed;
- injected TEST_B failure prevents successful fan-in and fails graph.

## Bounded loops

- max_iterations enforced;
- timeout enforced;
- budget enforced;
- validation failure requires evidence;
- repair requires evidence;
- PASS requires evidence;
- third failure at max_iterations exhausts immediately;
- replay survives reopen.

## Runtime Pool

- adaptive policy reuses `runtime_metrics.policy()`;
- 4 concurrent processes against 2 slots → 2 acquire / 2 backpressure;
- run_id cannot be rebound to another task/worker;
- pool cannot shrink below active slot count;
- all pool events declare `cognitive=false`.

## Crash/recovery

- graph creation/materialization is idempotent;
- lease created before graph/node_started can be reconciled;
- node receipt is persisted before task promotion;
- completed task + persisted receipt can be reconciled to graph/node_completed;
- completed task without receipt is blocked and never auto-promoted to PASS;
- receipt actor must match lease owner.

## Boundary

This MVP does not implement Graph-of-Graphs, speculative execution or shadow runtime. It does not claim independent cognitive agents.

Final promotion remains HUMAN_GATE.
