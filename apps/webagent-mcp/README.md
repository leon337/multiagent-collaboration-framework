# MCF WebAgent MCP

Current runtime mission: `MCF-WEBAGENT-RUNTIME-002` · Issue #346

This application exposes five stable MCP tools while moving the original MVP from simulation toward real, self-hostable web execution.

## Current behavior

| Tool | Behavior |
| --- | --- |
| `web_search` | Uses live SearXNG JSON search when `WEBAGENT_SEARXNG_URL` is configured; otherwise preserves the explicit `local-empty` fallback. |
| `web_fetch` | Bounded HTTP/HTTPS retrieval with timeout, 1 MB hard cap, public-egress checks and hop-by-hop redirect validation. |
| `browser_run` | Starts a real asynchronous Playwright/headless-Chromium job by default. |
| `browser_wait` | Reads job state and, on completion, title, final URL and bounded text excerpt. |
| `browser_cancel` | Cancels a non-terminal browser job and closes its active browser when possible. |

## Runtime configuration

```bash
# Optional live search. Point this at a SearXNG instance with JSON format enabled.
export WEBAGENT_SEARXNG_URL="https://search.example/"

# Optional fallback for debugging/tests. Default is playwright.
export WEBAGENT_BROWSER_RUNTIME="deterministic"
```

SearXNG must enable the `json` result format. The provider calls `/search?q=...&format=json`.

## Local setup

Requirements: Node.js 22+, npm, and a Chromium binary installed by Playwright.

```bash
npm install
npx playwright install chromium
npm run typecheck
npm test
npm run build
```

CI additionally uses `npx playwright install --with-deps chromium`.

## Egress boundary

The default `PublicEgressPolicy` rejects embedded credentials, localhost names, loopback/private/link-local IP ranges and hostnames that DNS resolves to blocked addresses. `web_fetch` validates every redirect target before following it. Playwright routes HTTP(S) requests through the same policy so a public page cannot freely pivot into obvious internal destinations.

This is a meaningful SSRF hardening step, but it is not the final public-gateway boundary. DNS is validated before the request, while the underlying transport still performs its own connection-time resolution. Full DNS-rebinding resistance requires a later pinned-connect/proxy boundary.

## Browser evidence

A completed Playwright run returns:

- `runtime: "playwright"`
- `title`
- `finalUrl`
- bounded `textExcerpt`
- timing/budget metadata through the existing execution envelope.

This stage does not yet implement arbitrary clicking/form filling, authenticated profiles, credential vaults, screenshots/replay, proxy routing, or destructive external actions.

## Packaging

Local/self-hosted compatibility remains:

```text
.codex-plugin/plugin.json
.mcp.json
skills/webagent/SKILL.md
```

The stdio entrypoint remains `node ./dist/src/server.js`.

A public ChatGPT plugin package is still intentionally deferred until a real HTTPS Streamable HTTP MCP endpoint exists and is qualified against the current Developer Mode requirements.

## Next boundary

1. deterministic lockfile and reproducible `npm ci`;
2. transport-level DNS pinning / outbound proxy boundary;
3. screenshot + DOM evidence and replay;
4. action primitives (click/fill/select) behind policy gates;
5. remote Streamable HTTP MCP deployment over HTTPS;
6. ChatGPT Developer Mode qualification;
7. profiles/vault, parallel workers and MCF multi-agent orchestration.
