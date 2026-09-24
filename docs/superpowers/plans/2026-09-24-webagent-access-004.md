# MCF-WEBAGENT-ACCESS-004 — completion record

Issue: #354  
Unblocks: #348  
Baseline: `main@8b5fff7e04f5c0a0f8493ca752b78c04cda44dbd`

## Route matrix

| Route | Result | Evidence / reason |
| --- | --- | --- |
| OpenAI Secure MCP Tunnel | BLOCKED_BY_ACCOUNT_SURFACE | Requires Platform tunnel settings, `tunnel_id`, runtime credential, and product-side Developer Mode access not exposed by current connectors. |
| Cloudflare Quick Tunnel | PROVEN | Public HTTPS readiness + real MCP initialize/listTools/callTool completed in GitHub Actions. |
| Cloudflare named tunnel | VIABLE_FUTURE | Stable hostname and SSE support, but requires Cloudflare account/zone credentials. |
| New Render free service | BLOCKED_BY_QUOTA | Render rejected provisioning because Hobby workspace already reached 25 services. |
| Render capacity recovery | NOT_EXECUTED | Existing services were not mutated; requires separate explicit authority. |

## Security changes

- `WEBAGENT_REMOTE_OPEN_WORLD=disabled` now overrides loopback defaults.
- Tunnel proof keeps user-directed open-world networking disabled.
- Public proof calls `web_search` only as the non-destructive success case.
- `web_fetch` must return `REMOTE_OPEN_WORLD_DISABLED`.

## Reproducible proof

Run the GitHub Actions workflow **WebAgent Access 004 Cloudflare Proof**.

For push events it holds the endpoint for 120 seconds. For `workflow_dispatch`, `hold_seconds` defaults to 600 and is capped at 1800.

The run:
1. builds the WebAgent;
2. creates a zero-account Quick Tunnel;
3. publishes the live URL to Issue #354;
4. starts the WebAgent with explicit open-world disable;
5. proves public `/health/ready`;
6. proves MCP initialize, five-tool discovery, annotations, and `web_search`;
7. proves `web_fetch` remains blocked;
8. uploads JSON proof artifacts.

## Completion rule

Mission #354 is complete when the final branch HEAD has:
- WebAgent MCP Qualification GREEN;
- Cloudflare proof workflow GREEN;
- documentation validation / production-readiness GREEN in PR context;
- merged result in `main`;
- Issue #348 checkpointed with the proven route.
