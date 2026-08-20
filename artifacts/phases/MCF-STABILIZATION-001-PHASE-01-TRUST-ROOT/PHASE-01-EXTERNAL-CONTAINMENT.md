# PHASE-01 — External Containment Runbook

## Purpose
Stop uncontrolled production movement and establish a protected GitHub trust root before PR #143 is reconciled or merged.

## A. Immediate Render containment

Apply to both production services:

- `rsa-api-free` (`srv-d9u5vnijobas73ecvlo0`)
- `rsa-web-free` (`srv-d9og08142hec739btoi0`)

For each service in Render Dashboard:

1. Open the service.
2. Open **Settings**.
3. Find **Auto-Deploy**.
4. Change **After CI Checks Pass** to **Off**.
5. Save if the UI requires an explicit save action.
6. Do **not** trigger a manual deploy.

Expected postcondition:

```yaml
autoDeploy: no
autoDeployTrigger: off
branch: main
```

MESTRE must re-read provider state after the change before continuing.

## B. GitHub main trust root

Repository: `leon337/multiagent-collaboration-framework`

Create an **Active branch ruleset** targeting the default branch / `main`.

Required protections:

- require changes through a pull request before merging;
- require status checks before merging;
- require the branch to be up to date before merging;
- block force pushes;
- restrict deletion of the protected branch;
- avoid routine bypass actors.

Required checks observed on PR #143:

- `smoke`
- `foundation`
- `qualification`
- `production-candidate-readiness`

Do not enable signed-commit requirements in this containment step because the current repository lineage contains unsigned commits and that unrelated migration has not been designed/qualified.

Expected postcondition:

```yaml
main_protected: true
required_checks:
  - smoke
  - foundation
  - qualification
  - production-candidate-readiness
strict_up_to_date: true
force_push: blocked
deletion: blocked
```

MESTRE must re-read GitHub live state after the ruleset is active.

## C. Production environment boundary

Create a GitHub Actions environment named `production`.

Configure deployment branches/tags so only `main` can deploy to this environment. Do not require routine human review for every deployment; canonical MCF authorization remains the governing authorization mechanism.

PR #143 must then be amended so job `governed-production-promotion` references:

```yaml
environment: production
```

Production secrets to scope to the environment when their values are available for migration:

- `MCF_CONTROL_PLANE_URL`
- `MCF_RUNTIME_TOKEN`
- `MCF_PRODUCTION_RUNTIME_URL`
- `RENDER_PRODUCTION_DEPLOY_HOOK_URL`

Repository-level copies should be removed only after environment-scoped secrets are verified on a non-production qualification path or an otherwise safe validation boundary.

## D. Prohibited actions during containment

- do not merge PR #143;
- do not dispatch `MCF Runtime Production Deploy`;
- do not trigger manual Render deploys;
- do not roll production back solely to change the reported SHA, because the 9 commits between stable v1.1.0 and current live SHA changed only documentation plus `schemas/capability.schema.yaml` and no application/runtime path.

## E. Resume condition

MESTRE resumes Phase 01 only after live evidence confirms:

1. both Render production services have auto-deploy disabled;
2. `main` is effectively protected by the active ruleset;
3. GitHub `production` environment exists with branch restriction;
4. no new uncontrolled provider deployment occurred during containment.
