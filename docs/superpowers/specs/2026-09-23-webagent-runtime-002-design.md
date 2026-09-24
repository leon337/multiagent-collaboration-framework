# WebAgent Runtime 002 — Design

Mission: `MCF-WEBAGENT-RUNTIME-002` / Issue #346

## Intent
Replace the MVP's deliberate no-op search and simulated browser defaults with real, self-hostable adapters while introducing a shared public-egress boundary before any public HTTP deployment.

## Architecture

```text
MCP tools
  |-- web_search --> SearxngSearchProvider --> configured SearXNG
  |-- web_fetch  --> HttpFetchProvider ------> EgressPolicy --> HTTP(S)
  +-- browser_*  --> PlaywrightBrowserRuntime -> EgressPolicy -> Chromium
```

## Security boundary
Default outbound access is public HTTP(S) only. Localhost, loopback, private, link-local, unspecified and embedded-credential destinations are denied. DNS answers are checked before requests. Fetch redirects are validated hop-by-hop. Playwright request routing evaluates every HTTP(S) request.

This mission does not claim full DNS-rebinding immunity because transport connections are not yet pinned to the preflight-resolved address.

## Search
Use SearXNG's JSON API at `/search?q=...&format=json`. The adapter is enabled by `WEBAGENT_SEARXNG_URL`; otherwise the deterministic local-empty provider remains available.

## Browser
Use Playwright 1.63.0 with headless Chromium. The existing asynchronous run lifecycle stays stable. Result evidence adds title, final URL and a bounded text excerpt. Deterministic runtime remains injectable for unit/protocol tests.

## Qualification
CI installs Chromium, runs typecheck, Vitest and build. Browser integration tests use a loopback fixture only through an explicit test-only allow-all policy.
