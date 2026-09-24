# WebAgent Remote 003 — Design

Mission: `MCF-WEBAGENT-REMOTE-003` / Issue #348

## Intent
Expose the existing WebAgent MCP v2 server through stateless Streamable HTTP without changing its five public tool names. Keep stdio for local/plugin packaging and add a dedicated HTTP process for staging.

## Transport
- MCP v2 `createMcpHandler(factory)`.
- Node adapter `toNodeHandler` from `@modelcontextprotocol/node@2.0.0`.
- MCP endpoint: `/mcp`.
- readiness endpoint: `/health/ready`.
- all other paths: 404.

## Network boundary
The HTTP process binds `WEBAGENT_HOST` / `PORT`. Requests are checked against `WEBAGENT_ALLOWED_HOSTS` before the MCP handler. Requests with an Origin header are checked against `WEBAGENT_ALLOWED_ORIGINS`; origin-less MCP clients are allowed. Staging must explicitly configure its Render hostname.

This protects the HTTP control plane from obvious Host/Origin confusion. It is separate from the outbound egress/DNS-rebinding boundary documented in mission 002.

## OpenAI metadata
Every tool declares the current required hints:
- `web_search`: readOnly=true, openWorld=true, destructive=false.
- `web_fetch`: readOnly=true, openWorld=true, destructive=false.
- `browser_run`: readOnly=false because it starts a job; openWorld=true; destructive=false.
- `browser_wait`: readOnly=true, openWorld=false, destructive=false.
- `browser_cancel`: readOnly=false, openWorld=false, destructive=false.

## Deployment
A new dedicated Render web service on the free plan is allowed after branch qualification. Existing Render services must not be repurposed.

## Acceptance
- HTTP integration test performs real MCP initialize/listTools/callTool through `StreamableHTTPClientTransport`.
- readiness returns HTTP 200.
- unapproved Host returns 403.
- all five tools expose required annotations.
- exact-head WebAgent CI passes before staging creation.
- staging HTTPS `/health/ready` and MCP initialize/listTools are verified externally.
- Developer Mode qualification is attempted against the real HTTPS endpoint.
