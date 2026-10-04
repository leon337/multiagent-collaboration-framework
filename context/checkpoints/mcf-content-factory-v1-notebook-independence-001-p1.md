# MCF-CONTENT-FACTORY-V1-NOTEBOOK-INDEPENDENCE-001 — P1 CHECKPOINT

## State
- Phase: P1 — ARCHITECTURE
- Result: PASS
- Next: P2 — DATA PLANE

## Architecture decision
`WEB (Vercel) -> CLOUD PYTHON API -> SUPABASE POSTGRES + STORAGE -> DURABLE JOBS/WORKER -> PROVIDER ADAPTERS`

## Principles
- Preserve the existing Flask core where useful.
- Move persistence out of local filesystem.
- Move jobs out of process memory.
- Move OAuth callback to HTTPS.
- Remove Electron and local Gemini WebView from production path.
- Keep Meta official API transport and idempotent publication.
- Keep local desktop as rollback/fallback until final proof.

## Evidence
- Content Factory architecture: `docs/migration/NOTEBOOK-INDEPENDENCE-P1-ARCHITECTURE.md`
- Architecture commit: `23b5b4a564e935ac4bf64cdfaa43c1a48f01d11a`
- Mission JSON updated: `6b7ef0f97ca538880e513b9e8c7fe8d83d1b2728`
- P0 inventory: `docs/migration/NOTEBOOK-INDEPENDENCE-P0-INVENTORY.md`

## Infrastructure gate
Available connected Supabase projects are currently inactive. No project has been selected for Content Factory production data. Provisioning a new project requires an explicit organization/cost flow; an unrelated existing project must not be repurposed without evidence.

## Next action
Select/provision the dedicated cloud data plane through the authorized provider flow, then execute P2 without deleting or changing the local fallback.