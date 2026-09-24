# WebAgent Access 004 — transport-unblock proof

Issue: #354  
Baseline: `main@8b5fff7e04f5c0a0f8493ca752b78c04cda44dbd`

## Goal

Prove a zero-cost, reversible HTTPS route to the integrated WebAgent MCP without consuming another Render service and without exposing anonymous open-world fetch/browser networking.

## Candidate classification

- OpenAI Secure MCP Tunnel: **BLOCKED_BY_ACCOUNT_SURFACE** until a Platform `tunnel_id` and runtime tunnel credential are available.
- Cloudflare Quick Tunnel: **PROVEN** as an ephemeral HTTPS protocol qualification route. A real MCP v2 client completed initialize, discovered all five tools, invoked `web_search`, and confirmed `web_fetch` remained blocked.
- Named Cloudflare Tunnel: **VIABLE_FUTURE** for a stable hostname; requires Cloudflare account/zone credentials.
- Render new free service: **BLOCKED_BY_QUOTA** (Hobby Tier 25-service limit).
- Render capacity recovery: analysis only; no existing service mutation authorized.

## Security rule

A tunnel to loopback must be able to force `WEBAGENT_REMOTE_OPEN_WORLD=disabled`. The public proof must demonstrate:

1. HTTPS readiness;
2. MCP initialize;
3. discovery of all five tools and annotations;
4. one non-destructive `web_search` call;
5. `web_fetch` denied with `REMOTE_OPEN_WORLD_DISABLED`.

Quick Tunnels are development-only and do not support SSE. They are accepted only if the MCP v2 client proof succeeds end-to-end through the public URL.


## Proof evidence

- WebAgent qualification on implementation SHA `e2c9dcebc697ef4d5d8a07d7250ec39aa4cced0d`: SUCCESS.
- Cloudflare proof run `35971549166`: public readiness and MCP protocol steps succeeded.
- Independent external fetch through Firecrawl returned HTTP 200 from the live `trycloudflare.com/health/ready` endpoint with:
  - `status: ok`
  - `transport: streamable-http`
  - `openWorldEnabled: false`
- A second workflow run publishes the temporary URL to Issue #354 while the tunnel remains alive for independent verification.

## Limitations

This proof does not turn Quick Tunnel into production hosting. Quick Tunnel hostnames are ephemeral and Cloudflare documents no SLA and no SSE support. The proof is sufficient for the current request/response MCP tool surface and development qualification, not for public plugin submission.
