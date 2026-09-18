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
