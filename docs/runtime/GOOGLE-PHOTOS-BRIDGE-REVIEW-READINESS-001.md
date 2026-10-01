# Google Photos Bridge — Review Readiness Checklist

Mission: `GOOGLE-PHOTOS-BRIDGE-MCP-APP-001`

## Engineering

- [x] Public HTTPS MCP endpoint
- [x] Streamable HTTP endpoint at `/mcp`
- [x] MCP App inline UI
- [x] Portable `plugin.json`
- [x] Portable `mcp.json`
- [x] Google Photos Bridge skill
- [x] Privacy page route
- [x] Terms page route
- [x] Runtime version + deploy SHA evidence
- [x] OAuth 2.1 resource-server adapter implemented
- [x] Google Photos connections bind to authenticated MCP identity when MCP auth is enabled
- [x] Sandbox package validation
- [x] Staging build validation

## Google gate

- [ ] Enable Google Photos Picker API in the Google Cloud project
- [ ] Configure Google Auth Platform consent/branding
- [ ] Create OAuth Web client
- [ ] Register redirect URI:
  `https://mcf-google-photos-bridge.onrender.com/oauth/google/callback`
- [ ] Store `GOOGLE_CLIENT_ID` in Render environment
- [ ] Store `GOOGLE_CLIENT_SECRET` in Render environment
- [ ] Run phone E2E: connect → Picker → select → return → list → get image → close → disconnect

## ChatGPT/OpenAI gate

- [ ] Configure a compatible OAuth 2.1 Authorization Server for the MCP
- [ ] Validate PKCE S256 / resource audience / protected resource metadata
- [ ] Enable `MCP_AUTH_ENABLED` only after authentication E2E passes
- [ ] Test custom MCP app in ChatGPT developer mode on web
- [ ] Verify tool discovery and MCP App UI behavior
- [ ] Complete publisher identity/organization verification as applicable
- [ ] Confirm account has `api.apps.read` / `api.apps.write` permissions for submission
- [ ] Add final icon/logo/screenshots if required by submission UI
- [ ] Submit for review only with explicit LEANDRO authorization
- [ ] Publish only after approval and explicit LEANDRO authorization

## Governance

- [x] PR is draft
- [x] No merge authorized
- [x] No public production publication authorized
- [x] Secrets must never be committed
- [x] ChatGPT sandbox is the default engineering runtime for this mission
