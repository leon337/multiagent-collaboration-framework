# VALIDATION — MCF-CLINIC-SCHEDULING-001

## Automated

- `node --check src/api.mjs` — PASS
- `node --check src/auth.mjs` — PASS
- `node --check src/server.mjs` — PASS
- `node --check src/demo-auth.mjs` — PASS
- `node --check src/demo-seed.mjs` — PASS
- `node --check public/app.js` — PASS
- `npm test` — 11/11 PASS

## Live HTTP/PostgreSQL

- `GET /health` — PASS
- `GET /` — PASS, HTML served
- `GET /api/v1/context` — PASS
- schedule query — PASS
- appointment create at 10:00 America/Recife — PASS, persisted UTC 13:00Z
- overlapping create at 10:15 — PASS rejection, HTTP 409 SCHEDULE_CONFLICT
- reschedule to 11:00 — PASS, persisted UTC 14:00Z
- cancellation — PASS, status CANCELLED preserved
- audit events — PASS for create/reschedule/cancel

Test data is synthetic.
