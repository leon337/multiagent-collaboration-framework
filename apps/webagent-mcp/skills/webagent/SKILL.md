---
name: webagent
description: Use the MCF WebAgent tools to search, fetch, and coordinate browser-style web tasks while preserving evidence and capability boundaries.
---

# MCF WebAgent

Use this skill when the user asks to research public web information, read a specific URL, or start/check/cancel a web-agent job through the bundled MCP server.

## Preferred tool order

1. Use `web_search` to discover candidate sources when a real search provider is configured.
2. Use `web_fetch` for direct HTTP/HTTPS retrieval when reading a known URL is sufficient.
3. Use `browser_run` only when the requested workflow requires the browser-job abstraction, then use `browser_wait` to inspect its state and `browser_cancel` when the user requests cancellation.

Prefer the least agentic operation that can satisfy the task. Preserve returned evidence, timing, budget, and error metadata instead of replacing it with unsupported claims.

## Current MVP capability boundary

- The default `web_search` provider is `local-empty`. It validates the search contract but does not perform a live external search until a real provider adapter is configured.
- `web_fetch` performs bounded HTTP/HTTPS retrieval when the runtime has outbound network access. It is not yet an article-cleaning or crawler engine.
- `browser_run` uses the `deterministic-mvp` runtime. Ele não executa um navegador real nesta versão e deve ser descrito como uma simulação determinística do ciclo assíncrono de jobs.
- Never claim that a page was clicked, logged into, visually inspected, or changed by `browser_run` in this MVP.
- Never expose secrets in tool input, output, logs, or plugin files.

When a requested operation is outside these boundaries, state the limitation clearly and return the strongest verified result that the available tools can support.
