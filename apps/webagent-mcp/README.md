# MCF WebAgent MCP

Current access mission: `MCF-WEBAGENT-ACCESS-004` · Issue #354 · unblocks #348

The WebAgent now has two MCP transports over the same five governed tools:

- local stdio for local/plugin development;
- Streamable HTTP at `/mcp` for remote/tunnel qualification.

## Current behavior

| Tool | Behavior |
| --- | --- |
| `web_search` | Uses live SearXNG JSON search when `WEBAGENT_SEARXNG_URL` is configured; otherwise preserves the explicit `local-empty` fallback. |
| `web_fetch` | Bounded HTTP/HTTPS retrieval with timeout, 1 MB hard cap, public-egress checks and hop-by-hop redirect validation. |
| `browser_run` | Starts a real asynchronous Playwright/headless-Chromium job by default. |
| `browser_wait` | Reads job state and, on completion, title, final URL and bounded text excerpt. |
| `browser_cancel` | Cancels a non-terminal browser job and closes its active browser when possible. |

All five tools advertise explicit OpenAI/MCP `readOnlyHint`, `openWorldHint`, and `destructiveHint` values.

## Runtime configuration

```bash
# Optional live search. Point this at a SearXNG instance with JSON enabled.
export WEBAGENT_SEARXNG_URL="https://search.example/"

# Optional fallback for debugging/tests. Default is playwright.
export WEBAGENT_BROWSER_RUNTIME="deterministic"

# Remote MCP process. Defaults to loopback-only.
export WEBAGENT_HOST="127.0.0.1"
export PORT="3000"

# Required for non-loopback binds unless the platform provides
# RENDER_EXTERNAL_HOSTNAME, which is recognized automatically.
export WEBAGENT_ALLOWED_HOSTS="webagent-staging.example.com"

# Optional. Requests without Origin are allowed; present origins must match.
export WEBAGENT_ALLOWED_ORIGINS="chatgpt.com"

# Remote non-loopback endpoints keep user-directed open-world fetch/browser
# networking disabled by default. Do not enable this on an anonymous public
# endpoint until transport-level egress pinning or an outbound proxy is qualified.
export WEBAGENT_REMOTE_OPEN_WORLD="enabled"
```

## Local setup

Requirements: Node.js 22+, npm, and Chromium installed by Playwright.

```bash
npm install
npx playwright install chromium
npm run typecheck
npm test
npm run build

# Streamable HTTP
npm start

# stdio
npm run start:stdio
```

Readiness is served at `GET /health/ready`; MCP is served at `/mcp`. Unknown paths return 404.

The HTTP server binds loopback by default. A non-loopback bind is rejected unless an allowed hostname is configured or Render provides `RENDER_EXTERNAL_HOSTNAME`. Present `Origin` headers are checked against `WEBAGENT_ALLOWED_ORIGINS`; origin-less MCP clients remain supported.

For non-loopback HTTP binds, user-directed `web_fetch` and live browser networking are **disabled by default**. The staging endpoint can therefore prove HTTPS, MCP initialization, tool discovery and safe non-network job semantics without becoming an anonymous public fetch proxy. Loopback development remains open-world by default. Explicitly enabling `WEBAGENT_REMOTE_OPEN_WORLD=enabled` is reserved for a later pinned-connect/outbound-proxy boundary.

## Developer Mode path

Current OpenAI Developer Mode accepts either:

1. a public HTTPS Streamable HTTP endpoint, usually ending in `/mcp`; or
2. Secure MCP Tunnel to a private stdio/HTTP server.

A zero-cost HTTPS protocol path is now reproducible through the repository workflow **WebAgent Access 004 Cloudflare Proof**. It creates an ephemeral Cloudflare Quick Tunnel, forces `WEBAGENT_REMOTE_OPEN_WORLD=disabled`, verifies readiness through public HTTPS, performs MCP initialize/tool discovery/tool invocation with the real SDK client, and publishes the temporary URL to Issue #354.

Quick Tunnels are development-only: the hostname changes every run, there is no SLA, and Cloudflare documents that Quick Tunnels do not support SSE. The current WebAgent request/response tool surface has been proven through this path, but it is not a production endpoint or Plugin Directory endpoint.

For an interactive Developer Mode window, manually dispatch the workflow and use its `hold_seconds` input (default 600 seconds, capped at 1800). The workflow comments the live `/mcp` URL on Issue #354 while it is reachable.

OpenAI Secure MCP Tunnel remains the preferred private long-running route when Platform tunnel permissions, a `tunnel_id`, and a runtime tunnel credential are available.

Before connecting ChatGPT, verify with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector@latest
```

Then use `http://127.0.0.1:3000/mcp` locally, the ephemeral Quick Tunnel `/mcp` URL for development qualification, or an OpenAI Secure MCP Tunnel when account-side tunnel access is available.

## Security boundaries

### MCP control plane

- `/mcp` uses MCP v2 `createMcpHandler` with the Node adapter.
- Host is allowlisted before MCP handling.
- A present Origin is allowlisted before MCP handling.
- `/health/ready` is non-cached and contains no secret state.
- shared provider/runtime dependencies preserve browser job state across stateless MCP HTTP requests.
- non-loopback servers disable anonymous open-world fetch/browser networking unless explicitly enabled.

### Outbound web plane

The existing `PublicEgressPolicy` rejects embedded credentials, localhost names, loopback/private/link-local IP ranges and hostnames whose preflight DNS answers are blocked. Fetch redirects are validated hop-by-hop and browser HTTP(S) requests pass through the same policy.

This does **not** claim complete DNS-rebinding resistance because the transport still resolves independently after preflight. A pinned-connect or controlled outbound proxy remains required before calling an unauthenticated public deployment production-safe.

## Packaging

Local/self-hosted compatibility remains:

```text
.codex-plugin/plugin.json
.mcp.json
skills/webagent/SKILL.md
```

The stdio entrypoint remains `node ./dist/src/server.js`. The remote process is `node ./dist/src/http-server.js`.

## Access-004 result

- Cloudflare Quick Tunnel: **PROVEN** for zero-cost, ephemeral public HTTPS protocol qualification.
- External health verification: **PROVEN** with HTTP 200 and `openWorldEnabled: false`.
- Real MCP client through the tunnel: **PROVEN** for initialize, five-tool discovery, annotations, `web_search`, and blocked `web_fetch`.
- OpenAI Secure MCP Tunnel: **BLOCKED_BY_ACCOUNT_SURFACE** until a Platform `tunnel_id` and runtime credential are available.
- New Render free staging: **BLOCKED_BY_QUOTA** at the Hobby 25-service limit.
- Named Cloudflare Tunnel: **VIABLE_FUTURE** for a stable URL; requires Cloudflare account/zone credentials.

## Next boundary

1. use the proven ephemeral workflow for ChatGPT Developer Mode qualification when the product-side app creation UI is available;
2. move to OpenAI Secure MCP Tunnel or a named Cloudflare Tunnel for a stable long-running development path;
3. pinned-connect/outbound proxy before any production-public open-world claim;
4. screenshot/DOM evidence and replay;
5. action primitives, profiles/vault, parallel workers and MCF orchestration.
