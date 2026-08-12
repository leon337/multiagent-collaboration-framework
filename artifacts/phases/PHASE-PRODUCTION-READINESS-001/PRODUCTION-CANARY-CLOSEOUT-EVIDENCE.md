# Production Canary + Closeout Evidence — MCF-PRODUCTION-READINESS-001

## Scope

This evidence closes the production-readiness boundary without promoting the stable `v1.0.0` milestone.

## Immutable release identities

- RC1: `v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8` — preserved and never retargeted.
- RC2: `v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719` — prerelease boundary used before the public rollout sequence.
- Final qualified production head for this closeout: `cf6cf42bdff923e44ccc7603058edc66f079f369`.

## Two post-rollout failures and convergence

The post-rollout cycle found two real failures:

1. `MCF Production Readiness` run `31597139401` failed in `Verify formatting` for `apps/server/src/config.ts`.
2. staging deploy run `31597139353` failed in `Run container smoke` because production-mode boot now required `REGISTRATION_ALLOWLIST`, but the smoke environment did not provide a controlled synthetic invitation.

PR #126 corrected both findings. Pre-merge evidence on head `21691d7edc387aa0caee8c5f47195ce1e0207967` passed Production Readiness, Foundation and Container Smoke. PR #126 was squash-merged to `main` as `cf6cf42bdff923e44ccc7603058edc66f079f369`.

Post-merge evidence on the exact `main`:

- Production Readiness run `31602905916`: PASS;
- staging deploy run `31602905900`: PASS;
- container smoke: PASS;
- format/lint/typecheck: PASS;
- migrations twice: PASS;
- full tests/build: PASS;
- backup + isolated restore: PASS;
- release-readiness contract tests: PASS;
- staging exact-SHA deploy: PASS (`dep-d9u7o3m417fc73fudeqg`).

## Controlled production canary

The registration-control implementation became live in production on commit `cce371417308b92409131c5b40bb4968d0d5ba85`, deploy `dep-d9u6f3jncjis7385cdvg`.

Observed live interval:

- start/live boundary: `2026-08-12T12:32:33Z`;
- deactivated by the later qualified deployment: `2026-08-12T14:02:38Z`;
- continuous observation: approximately 90 minutes, exceeding the canonical minimum of 60 minutes.

Provider log query for that interval returned zero `error`-level application logs. The registration enforcement itself was not changed between `cce371...` and `cf6cf42...`; the six later commits only added boot-time validation/tests, Render configuration, smoke configuration and formatting. The Git compare from `cce371...` to `cf6cf42...` contains no change to `registration-policy.ts` or the account-creation controller implementation.

## Final exact-main production deployment

Production API `rsa-api-free`:

- service: `srv-d9u5vnijobas73ecvlo0`;
- exact Git SHA: `cf6cf42bdff923e44ccc7603058edc66f079f369`;
- current deploy: `dep-d9u7ponmnsvc73a75atg`;
- status: LIVE;
- finished: `2026-08-12T14:03:24.946097Z`;
- `/health/ready`: repeated HTTP 200 in structured Render logs;
- application start: `environment=production`, `allowedOriginCount=1`;
- error-level log query after final deployment through the closeout verification interval: zero application errors.

Production web `rsa-web-free`:

- service: `srv-d9og08142hec739btoi0`;
- exact Git SHA: `cf6cf42bdff923e44ccc7603058edc66f079f369`;
- deploy: `dep-d9u7p7oae00c73bukn4g`;
- status: LIVE.

A controlled synthetic invitation was configured for the canary. No secret value or database credential is recorded in this evidence.

## Observability and incident path

- Render structured logs are active and contain correlation IDs and readiness responses.
- Render CPU/memory metrics were available during the observation interval.
- `.github/workflows/mcf-production-health-monitor.yml` probes `/health/ready` every five minutes and reconciles a GitHub Issue on failure/recovery.
- `ops/production-monitoring.json` is enabled as part of the closeout change now that the public API exists.
- Incident response and rollback runbooks remain the operational response boundary.

A Node/PostgreSQL client warning about future `sslmode` semantics was observed. Current runtime behavior remains the library's current verify-full-equivalent behavior; the warning is recorded as non-blocking dependency-upgrade debt, not as a present production outage or blocker.

## Recovery / rollback evidence

- pre-rollout Neon safety branch/snapshot exists;
- backup + checksum + isolated PostgreSQL restore passed in readiness CI;
- staging recovery-by-exact-SHA is already validated by the MCF runtime evidence;
- previous Render deployments remain identifiable for recovery analysis;
- no destructive restore was performed against production.

## Governance closeout

Evidence review by the Class C closeout roles produced no remaining material blocker:

- Augusto: mission trace complete across Issue #124, PR #125, PR #126, workflow runs and provider deploy IDs;
- Júlia: Class C production boundary satisfied without inventing a new gate;
- Carmem: PRF/readiness artifacts reconciled to the actual post-rollout state;
- Emily: independent-audit role criterion satisfied by frozen-SHA evidence review; no unresolved critical/high finding remains in the evidence set;
- LÉO: internal production-readiness decision = PASS.

LEANDRO remains the final human authority. Existing MCF-DEC-031 production authorization was the governing human authorization for this rollout.

## Result

```yaml
mission: MCF-PRODUCTION-READINESS-001
production: COMPLETE
canary_60_min: PASS
post_deploy_smoke: PASS
material_blockers: 0
critical_findings: 0
high_findings: 0
stable_v1_0_0: NOT_PROMOTED
next_milestone: evaluate_stable_v1_0_0_separately
```
