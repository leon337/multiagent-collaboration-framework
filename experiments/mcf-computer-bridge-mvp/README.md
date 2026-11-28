# MCF Computer Bridge MVP 0.1.0

A small Python standard-library service that exposes a **local-only, authenticated and allowlisted** interface for an MCF agent to inspect the host and read text files from one configured root directory.

This is an adapter prototype. It does not replace MissionRuntime, the External Action Dispatcher, HDF/Permission Engine, Evidence Validator, Receipts or Event Ledger.

## Included operations

- \`system_info\`: basic host/platform metadata.
- \`list_directory\`: list up to 100 entries beneath the configured root.
- \`read_file\`: read UTF-8 text files up to 128 KiB beneath the configured root.

No arbitrary shell, file writes/deletes, credential access, public binding, GUI control or screenshot capture is included.

## Run locally

Python 3.10+; no pip dependencies.

\`\`\`bash
cd experiments/mcf-computer-bridge-mvp
export MCF_BRIDGE_TOKEN="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
export MCF_BRIDGE_ROOT="$HOME/Documentos"
python3 server.py
\`\`\`

The server refuses to start unless the token has at least 32 characters and the bind host is loopback. Defaults: \`127.0.0.1:8765\`, root \`$HOME\`.

Open \`http://127.0.0.1:8765/\` for the minimal status page. \`GET /health\` is unauthenticated and reveals only service health.

## HTTP contract

Create an operation:

\`\`\`bash
curl -sS -X POST http://127.0.0.1:8765/v1/jobs \\
  -H "Authorization: Bearer $MCF_BRIDGE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: mission-001-system-info" \\
  -d '{"operation":"system_info","args":{}}'
\`\`\`

Read a file (path is relative to \`MCF_BRIDGE_ROOT\`):

\`\`\`bash
curl -sS -X POST http://127.0.0.1:8765/v1/jobs \\
  -H "Authorization: Bearer $MCF_BRIDGE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: mission-001-readme" \\
  -d '{"operation":"read_file","args":{"path":"README.md"}}'
\`\`\`

Retrieve a job receipt:

\`\`\`bash
curl -sS http://127.0.0.1:8765/v1/jobs/JOB_UUID \\
  -H "Authorization: Bearer $MCF_BRIDGE_TOKEN"
\`\`\`

The same idempotency key and same request return the original job; reusing a key with a different request returns HTTP 409. Job receipts include request/result SHA-256 digests and timing metadata.

## Security boundaries

- Loopback-only bind in this MVP. Do not expose this port to the LAN or Internet.
- Bearer token is required for operations and job retrieval; never commit or log it.
- Only three fixed operations are accepted; no shell command is evaluated.
- Paths are resolved and constrained to the configured root; symlink escapes are rejected.
- Text reads are capped at 128 KiB; request bodies at 16 KiB.
- In-memory jobs/idempotency are lost on process restart. Durable receipt storage and HDF/dispatcher adapter wiring are follow-up work.
- This MVP is not yet a remote-access product. Tailscale Serve/private gateway integration requires separate validation and review.

## Tests

\`\`\`bash
python3 -m unittest -v
\`\`\`
