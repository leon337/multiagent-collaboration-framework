# MCF v1.1.0 — Production Governance Finding 001

## Severity

`P1`

## Finding

Production Render services `rsa-api-free` and `rsa-web-free` are configured to auto-deploy from `main` after checks pass. The merge of PR #139 therefore deployed `main@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef` automatically before LEANDRO issued the separate production HUMAN_GATE.

## Security / governance property violated

```text
MERGE_OR_MAIN_UPDATE != PRODUCTION_AUTHORIZATION
NO_PRODUCTION_WITHOUT_LEANDRO_HUMAN_GATE
```

The stable release itself remains qualified. The defect is the deployment-control boundary.

## Required remediation

- production must not move merely because `main` moves;
- production promotion must require an exact release SHA and explicit production authorization owned by LEANDRO;
- negative test: main update without the production gate leaves production unchanged;
- positive test: authorized exact release SHA deploys and health/rollback checks are recorded.

## Current containment

LEANDRO subsequently authorized production. The live Render API and web services are already on the exact stable `v1.1.0` SHA, so no redundant redeploy was performed.

This finding remains open conceptually until the platform configuration is changed and the negative path is qualified.
