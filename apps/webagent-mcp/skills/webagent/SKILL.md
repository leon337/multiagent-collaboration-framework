---
name: webagent
description: Use the MCF WebAgent tools for governed public-web search, bounded fetch, and real headless-browser tasks while preserving evidence and egress boundaries.
---

# MCF WebAgent

Use this skill when the user asks to research public web information, read a URL, or run/check/cancel a browser job through the bundled MCP server.

## Preferred tool order

1. Use `web_search` to discover candidate sources. Configure `WEBAGENT_SEARXNG_URL` to enable the live self-hostable SearXNG provider; without it, search remains `local-empty`.
2. Use `web_fetch` for direct HTTP/HTTPS retrieval when browser execution is unnecessary.
3. Use `browser_run` for workflows that need a real page render. The default runtime uses Playwright with headless Chromium; use `browser_wait` for state/result and `browser_cancel` to stop a non-terminal job.

Prefer the least agentic operation that satisfies the task. Preserve evidence, timing, budget, runtime, final URL and error metadata.

## Security and capability boundary

- Default fetch/browser egress allows public HTTP(S) only and blocks localhost, loopback, private, link-local and embedded-credential destinations.
- Browser request routing applies the egress policy to page requests and subresources.
- `web_fetch` validates redirects hop-by-hop and caps the redirect chain.
- The SearXNG backend URL is operator configuration, not user-controlled navigation, and may point to a self-hosted service.
- This stage performs real page navigation and text/title capture, but it does not yet implement arbitrary form filling, login, credential vaults, persistent browser profiles or destructive actions.
- Preflight DNS validation reduces SSRF exposure but does **not** claim complete DNS rebinding protection until the network transport pins connections to validated addresses.
- Never expose secrets in tool input, output, logs, plugin files or evidence.

When an operation falls outside these boundaries, state the limitation and return the strongest verified result supported by the tools.
