# MCF WebAgent MCP

Current remote mission: `MCF-WEBAGENT-REMOTE-003` · Issue #348

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

For this mission, the public Render endpoint is a **protocol staging** surface with remote open-world networking disabled. Secure MCP Tunnel remains the path for exercising the fully capable local runtime before the DNS-rebinding boundary is closed.

Before connecting ChatGPT, verify with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector@latest
```

Then use `http://127.0.0.1:3000/mcp` locally or the HTTPS staging `/mcp` endpoint.

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

## Next boundary

1. exact-head remote-transport qualification;
2. dedicated free HTTPS protocol-staging service;
3. external readiness + MCP handshake/tool discovery;
4. ChatGPT Developer Mode connection attempt;
5. pinned-connect/outbound proxy before any production-public open-world claim;
6. screenshot/DOM evidence and replay;
7. action primitives, profiles/vault, parallel workers and MCF orchestration.
