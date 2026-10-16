# Evidence — MCF Harness V2.1 Hardening

## Local bubble

New hardening unit/integration tests: **19/19 PASS**.

Additional multiprocess integration:
- two dispatchers / same target / 20 messages → ordered 20/20, duplicates 0;
- five concurrent producers / queue limit 3 → queued 3, backpressure 2;
- two concurrent schedulers / max_active 1 → leases 1, backpressure 1.

Full technical fan-out:
- core;
- history;
- executor;
- security;
- coordination;
- recovery.

Result after load-timeout hardening: **6/6 shards PASS**.

## Important correction

The first full parallel run exposed a checkpoint timeout in the executor shard. Isolated execution passed, proving load sensitivity rather than a state-machine regression. The timeout was hardened from 3s to 10s, then all six shards passed concurrently.

## Remote gates

Harness CI: pending.  
Production Readiness: pending.  
PR: #239 draft.


## Final bubble fan-out — pass 3

Execution boundary: `CHATGPT_BUBBLE_LOCAL_SANDBOX`.

Six technical workers ran in parallel over the preserved local hardening workspace:

| Shard | Tests | Result | PID | Duration |
|---|---:|---|---:|---:|
| schema | 9 | PASS | 2804 | 1.89s |
| security | 29 | PASS | 2805 | 4.47s |
| anchor/history | 12 | PASS | 2806 | 5.71s |
| coordination | 15 | PASS | 2807 | 7.35s |
| executor | 10 | PASS | 2808 | 11.20s |
| recovery/core | 18 | PASS | 2809 | 11.19s |

Total: **93 tests / 6 shards / 6 PASS**.

Summary receipt SHA-256:
`1e1bc92d9067b37d6fad6e37393776c82aa9665d479ba46617368b928dd38a1c`.

## Exact-head remote gates

Head `145594c3d47d2a1ede12cd0051ceac47dbc7c9fa`:
- MCF Harness V2 Prototype Validation — run `35389797242` — **SUCCESS**;
- MCF Production Readiness — run `35389797116` — **SUCCESS**.

The PR remains draft; no merge authorization is inferred from these results.
