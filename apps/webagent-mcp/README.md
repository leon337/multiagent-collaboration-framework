# MCF WebAgent MCP

Mission: `MCF-WEBAGENT-PLUGIN-MVP-001` · Issue #322

This application is the first tested vertical slice of the MCF WebAgent platform. It establishes stable MCP contracts for search, bounded fetch, and asynchronous browser-job lifecycle management without pretending that the unfinished capabilities already exist.

## What exists now

The MCP server exposes five tools:

| Tool | Current MVP behavior |
| --- | --- |
| `web_search` | Validates a provider-agnostic search contract. The default `local-empty` provider returns an empty result set and does **not** perform live search. |
| `web_fetch` | Performs bounded HTTP/HTTPS retrieval with a 10-second timeout, response metadata, UTF-8 text normalization, and a 1 MB hard cap. |
| `browser_run` | Starts an asynchronous `deterministic-mvp` job and returns a run ID. It does **not** launch Chromium or interact with a live page. |
| `browser_wait` | Reads the current snapshot of a browser job. |
| `browser_cancel` | Cancels a non-terminal browser job while preserving terminal states. |

Every operation returns an execution envelope containing timing, evidence, budget metadata, data or a stable error.

## Architecture

```text
MCP Client
    |
    v
McpServer
    |
    +-- web_search ----> SearchProvider
    |
    +-- web_fetch -----> FetchProvider
    |
    +-- browser_* -----> BrowserRuntime
                           |
                           v
                     ExecutionEnvelope
```

The main design rule is **deterministic first, agentic fallback later**. Provider and runtime interfaces are deliberately replaceable so live search, Playwright workers, policy, replay, profiles, vaults, and multi-agent orchestration can be added without changing the public tool names.

## Local qualification

Requirements:

- Node.js 22+
- npm

From this directory:

```bash
npm install
npm run typecheck
npm test
npm run build
```

The qualification suite requires no API key, paid service, proxy, browser binary, or external login.

The GitHub Actions mission workflow executes the same typecheck/test/build boundary on every application change. The final mission checkpoint records the exact qualified commit and run rather than treating a previous green commit as evidence for a later head.

## Plugin packaging in this mission

The current local/self-hosted package uses the supported OpenAI compatibility layout:

```text
.codex-plugin/plugin.json
.mcp.json
skills/webagent/SKILL.md
```

`.mcp.json` launches the built server over stdio with:

```text
node ./dist/src/server.js
```

Build the project before loading that local plugin package.

A root portable `plugin.json` + `mcp.json` package is intentionally **not** produced yet. Public plugin submission requires a real deployed HTTPS MCP endpoint; inventing a localhost or placeholder endpoint would make the package misleading. The portable/public package belongs to the deployment/integration mission after a real HTTP transport exists.

## Security and scope boundaries

- Only `http:` and `https:` URLs are accepted by fetch/browser inputs.
- URLs containing embedded username/password credentials are rejected.
- Fetch response bodies are read as a bounded stream rather than unbounded in-memory downloads.
- Errors returned through the execution envelope do not include stack traces.
- The baseline package contains no token, password, API key, or paid-provider requirement.
- No credential vault, persistent authenticated profile, proxy fleet, real browser control, production deployment, or destructive external action is implemented in this mission.
- The current fetch adapter is not yet hardened as a public hostile-URL gateway (for example, full SSRF/DNS-rebinding and redirect-policy defenses). Do not expose it as an unauthenticated public fetch service before that hardening boundary is implemented.

## MCP SDK track

The server is implemented against the current published MCP TypeScript v2 packages (`@modelcontextprotocol/server` and the test client package at `2.0.0`). Qualification includes a real in-memory MCP client/server handshake, `listTools()`, and tool invocation.

OpenAI plugin documentation and the upstream MCP SDK can evolve at different speeds. Therefore this mission proves the MCP v2 server contract and local package structure; it does **not** claim that a public ChatGPT plugin has already passed Developer Mode or submission review. That compatibility must be verified against the deployed HTTPS endpoint in the next integration boundary.

## Release hardening still required

Before treating this as a release candidate:

- generate and commit a deterministic dependency lockfile and switch CI from `npm install` to `npm ci`;
- harden `web_fetch` against public-service SSRF, redirects, DNS rebinding, MIME/content policy and egress abuse;
- add a real search adapter;
- add a real browser worker with isolation;
- expose a remote HTTPS MCP transport and qualify it in the current ChatGPT Developer Mode surface.

## Next architecture boundary

The next implementation stage should replace the deliberate MVP adapters in this order:

1. real search provider routing;
2. real Playwright/Chromium worker behind `BrowserRuntime`;
3. Streamable HTTP MCP deployment;
4. ChatGPT Developer Mode qualification;
5. screenshots/DOM evidence and replay;
6. persistent browser profiles and credential vault;
7. policy engine, budgets, parallel workers, and MCF multi-agent orchestration.

Until those stages are implemented and evidenced, the `local-empty` search provider and `deterministic-mvp` browser runtime must remain clearly labeled as such.
