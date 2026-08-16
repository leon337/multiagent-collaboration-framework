# MCF v1.1.0 — Production Authorization / Reconciliation 001

## Human authority

**LEANDRO** explicitly authorized production after stable `v1.1.0` publication.

```yaml
human_gate_owner: LEANDRO
decision: AUTHORIZE_PRODUCTION
orchestrator: MESTRE
release: v1.1.0
stable_release_sha: 5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
```

## Reconciliation finding

At the moment this HUMAN_GATE was processed, MESTRE reconciled the real Render state and found that the two production services were already configured with Render auto-deploy from `main` after checks pass.

Consequently, the merge of PR #139 had already caused an automatic production rollout **before** this production HUMAN_GATE was granted.

This is a governance-control failure. It does not invalidate the qualified release contents, but it proves that the reserved production boundary was not technically enforced by the deployment platform configuration.

## Actual production deploys

```yaml
api:
  service: rsa-api-free
  service_id: srv-d9u5vnijobas73ecvlo0
  deploy_id: dep-da0kelm1egvs739i7h20
  sha: 5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
  trigger: new_commit
  started_at: 2026-08-16T05:15:02.719670Z
  finished_at: 2026-08-16T05:16:27.393452Z
  status: live

web:
  service: rsa-web-free
  service_id: srv-d9og08142hec739btoi0
  deploy_id: dep-da0kelm1egvs739i7ha0
  sha: 5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
  trigger: new_commit
  started_at: 2026-08-16T05:15:02.787942Z
  finished_at: 2026-08-16T05:15:35.652514Z
  status: live
```

Both services therefore run the same SHA bound to stable tag/release `v1.1.0`.

## Production acceptance under current HUMAN_GATE

Because LEANDRO has now explicitly authorized production and the already-live services match the exact stable release SHA, MESTRE treats the existing rollout as the production state to accept rather than triggering a redundant deployment.

```yaml
production_authorized: true
production_release: v1.1.0
production_sha: 5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
api_state: LIVE
web_state: LIVE
redundant_redeploy: NOT_PERFORMED
```

## Health evidence

The canonical production monitor remains enabled for `https://rsa-api-free.onrender.com` on a five-minute schedule. The most recent completed monitor run observed during reconciliation was successful on `main@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`.

Render also reports the exact API and web deploys above as `live`.

## Governance incident

A P1 governance issue must remain open until production deployment is technically prevented from occurring solely because `main` moved, unless a valid production authorization is present.

Preferred remediation:

1. disable production auto-deploy on `rsa-api-free` and `rsa-web-free`, or replace it with a gate-aware deploy mechanism;
2. require exact stable release SHA + explicit LEANDRO production authorization before production rollout;
3. retain post-deploy readiness monitor and rollback/recovery evidence;
4. test the negative case: merge to `main` without production HUMAN_GATE must NOT alter production.

## Verdict

```yaml
release_v1_1_0: STABLE_PUBLISHED
production_authorization: APPROVED_BY_LEANDRO
production_current_sha: 5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
production_api: LIVE
production_web: LIVE
production_acceptance: PASS_WITH_GOVERNANCE_FINDING
blocking_runtime_finding: none
governance_finding: P1_AUTO_DEPLOY_BYPASSED_RESERVED_HUMAN_GATE
```
