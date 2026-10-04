# MCF-CONTENT-FACTORY-V1-NOTEBOOK-INDEPENDENCE-001 — P5/P6 CHECKPOINT

## Current state

- P0: PASS — notebook dependency inventory
- P1: PASS — cloud architecture
- P2: PASS — cloud Data Plane
- P3: PASS — cloud web surface proven with local Flask stopped
- P4: PASS/READY — durable worker + pg_cron
- P5: PASS/READY — Meta OAuth cloud
- P6: IN PROGRESS — final cloud generation/publishing cutover

## Cloud infrastructure

### Supabase
- Project: `ypocndnfbujvxwglrnzc`
- Region: `sa-east-1`
- Status: ACTIVE_HEALTHY
- Postgres: active
- RLS: enabled
- Security advisors: 0 lints
- Storage bucket: `content-factory-media` private
- Vault contains only secret names/managed values; no secret committed to Git.

### API
- Edge Function: `content-factory-api`
- Current version: 10
- Active endpoints:
  - health
  - workspaces
  - content
  - media assets
  - library
  - publications
  - jobs
  - Meta connections/OAuth
  - migration claim
  - publication queue

### Worker
- Edge Function: `content-factory-worker`
- Current version: 4
- Durable scheduler: `content-factory-worker-every-minute`
- Cron job id: 1
- Scheduler active.
- Worker executes with Vault-backed token.
- Meta publish path exists for Instagram and Facebook.
- Ambiguous provider results are NOT auto-retried.

## Migration

- Batch: `648f735d-4be6-4c97-97c6-ad72044bcb2f`
- Staged files: 13
- Staged bytes: 5,567,224
- Library records: 7
- Publication records: 6
- Existing social publications are preserved by external IDs/status and are never re-published by migration.
- Claim endpoint: `POST /bootstrap/claim-migration`
- Claim is deterministic/idempotent.

## Notebook independence proof

- Local Flask PID 967190 was stopped.
- Port 8765 remained free.
- Cloud web opened successfully with Flask stopped.
- Browser request capture: 0 requests to localhost/127.0.0.1.
- Temporary migration scripts removed.

## Web

- Cloud preview deployment: `dpl_HsGuPr5zxLmQvmM55dafjsb6qfHF`
- URL: `https://content-factory-v1-f5fvtcl8e-predix-ai-br.vercel.app`
- State: READY.
- GitHub -> Vercel deployment integration is present.
- Canonical production alias was not changed because Vercel alias/promotion calls returned provider permission errors.

## Open gates

1. Real user Supabase login required before claiming the migrated workspace.
2. Production alias permission remains unresolved.
3. Gemini WebView/local Playwright generation still needs a cloud provider adapter.
4. Final Meta publish E2E must be executed only with a NEW test publication; never reuse pub-000006/pub-000007.
5. Final mission requires restart/recovery proof with notebook entirely out of functional path.

## Next action

Complete cloud generation provider adapter, then execute first authenticated claim and a new end-to-end cloud-only publication through the durable Meta worker.
