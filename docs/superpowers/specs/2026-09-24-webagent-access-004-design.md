# WebAgent Access 004 — transport-unblock proof

Issue: #354  
Baseline: `main@8b5fff7e04f5c0a0f8493ca752b78c04cda44dbd`

## Goal

Prove a zero-cost, reversible HTTPS route to the integrated WebAgent MCP without consuming another Render service and without exposing anonymous open-world fetch/browser networking.

## Candidate classification

- OpenAI Secure MCP Tunnel: **BLOCKED_BY_ACCOUNT_SURFACE** until a Platform `tunnel_id` and runtime tunnel credential are available.
- Cloudflare Quick Tunnel: **UNDER_TEST** as an ephemeral Developer Mode/protocol qualification route.
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
