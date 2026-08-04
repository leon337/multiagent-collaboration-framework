# MCF-RUNTIME-002 — Staging E2E Validation

## Status

```yaml
mission: MCF-RUNTIME-002-STAGING-E2E
result: PASS
validated_at: 2026-08-04
runtime_environment: Render staging
workflow: MCF Runtime Integration
```

## Objective

Prove a complete external execution of the MCF runtime callback flow:

```text
hosted MissionRuntime
→ persistent PostgreSQL state
→ real MCF-RUN-TESTS phase
→ GitHub Actions validation
→ authenticated callback
→ trusted receipt
→ mission completion
→ duplicate callback idempotency
```

## Staging resources

```yaml
render_workspace_id: tea-d2u2msje5dus73eb6ehg
runtime_service:
  name: mcf-runtime-staging-api
  id: srv-d9p1r6vlk1mc73a7gtj0
  url: https://mcf-runtime-staging-api.onrender.com
postgres:
  name: mcf-runtime-staging-db
  id: dpg-d9p1ok3ncjis73et4mfg-a
  region: virginia
```

No secret values are recorded in this document.

## Mission identifiers

```yaml
mission_id: 32d9bf0e-fdc5-4485-8c8b-bfc278f98e29
phase_id: 6b6b58bf-6923-49de-b78e-8d5c3f05b206
skill: MCF-RUN-TESTS
validated_commit: d2998b47dfe92aeb9ede2a5001b89f7fcaaa2740
```

## Recovery history

### Attempt 1

```yaml
result: FAIL
cause: pnpm executable unavailable before setup-node cache resolution
callback_sent: false
recovery: prepare pnpm with Corepack before dependency installation
fix_pr: 48
fix_merge_sha: fb542c542e059d8b5607c5c7533a98bcac7e749b
```

### Attempt 2

```yaml
workflow_run_id: 30935766577
result: FAIL
passed:
  - formatting
  - lint
  - monorepo typecheck
  - unit tests not requiring PostgreSQL
cause: DATABASE_URL absent for PostgreSQL integration suites
callback:
  accepted: true
  duplicate: false
  evidence_status: INVALID
  mission_state: RECOVERING
recovery: provision PostgreSQL service container and apply migrations twice
fix_pr: 49
fix_merge_sha: 1c91be63ace4fccdf245d236086f84d31235e973
```

### Attempt 3 — successful E2E

```yaml
workflow_run_id: 30936657220
job_id: 92084404384
result: SUCCESS
duration: approximately_1m16s
callback_http_status: 202
callback:
  accepted: true
  duplicate: false
  evidence_status: VALID
  mission_state: COMPLETED
```

Verified workflow steps:

```yaml
postgres_service: PASS
callback_configuration: PASS
checkout_requested_commit: PASS
node_setup: PASS
pnpm_setup: PASS
dependency_installation: PASS
migrations_first_run: PASS
migrations_second_run: PASS
format: PASS
lint: PASS
typecheck_monorepo: PASS
operations_tests: 10_PASS
server_test_files: 39_PASS
server_tests: 95_PASS
web_tests: 5_PASS
build_contracts: PASS
build_database: PASS
build_server: PASS
build_web: PASS
build_worker: PASS
callback: PASS
```

## Idempotency proof

The successful job was re-run as another attempt of the same GitHub Actions run, preserving `workflowRunId = 30936657220`.

```yaml
rerun_job_id: 92086058356
validation_result: SUCCESS
callback_http_status: 202
callback:
  accepted: true
  duplicate: true
  evidence_status: VALID
  mission_state: COMPLETED
```

The second callback did not create a second logical completion. The runtime recognized the existing callback idempotency key and preserved the completed mission state.

## Acceptance criteria

| Criterion | Result |
|---|---|
| Runtime hosted in staging | PASS |
| PostgreSQL persistent state available | PASS |
| Real mission and phase created | PASS |
| GitHub workflow dispatched | PASS |
| `pnpm verify` executed | PASS |
| PostgreSQL migrations executed idempotently | PASS |
| Authenticated HTTP callback accepted | PASS |
| Trusted evidence receipt generated and processed | PASS |
| Mission recovered from failure to completion | PASS |
| Duplicate callback treated idempotently | PASS |
| IDs, SHAs, logs and final state recorded | PASS |

## Final disposition

```yaml
staging_end_to_end_confirmed: true
github_secrets_operationally_confirmed: true
runtime_hosting_confirmed: true
authenticated_callback_confirmed: true
trusted_evidence_confirmed: true
recovery_confirmed: true
idempotency_confirmed: true
production_end_to_end_confirmed: false
mission_state: DELIVERED
```

This validation closes the `LOW` staging E2E reservation from MCF-RUNTIME-001. It does not authorize production deployment and does not claim full Codex equivalence.

## Security follow-up

Because staging credentials were manually handled during setup, rotate the staging PostgreSQL credential and `MCF_RUNTIME_TOKEN` after preserving the evidence. Remove temporary seeder/inspector services that are no longer required. Do not commit any credential values.
