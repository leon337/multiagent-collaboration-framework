# Leandro Workstation MCP — MCF Project Card

- Project ID: `leandro-workstation-mcp`
- Registry lifecycle: `CANDIDATE`
- Entry mode: `ADOPT_EXISTING_PROJECT`
- Human authority: `LEANDRO`
- Planned canonical repository: `leon337/leandro-workstation-mcp`
- Registry entry: `context/projects/leandro-workstation-mcp.yaml`

## Why CANDIDATE

The project exists locally and has a valid MCF Project Capsule/PIP/PRR/continuity package, but the planned GitHub repository does not yet exist and no remote checkpoint is available. `REGISTERED` must not be claimed until the canonical repository exists, an exact checkpoint is pushed, and the MCF alignment/registration conditions recorded in the project are satisfied.

## Recovery entrypoints

The registry resolves the repository-local `.mcf/project-capsule.yaml`, then `PROJECT-STATE.yaml`, `CONTINUITY.md`, `CHECKLIST.md`, `AGENT-HANDOFF.md`, and `docs/MCF-ADOPTION.md`. A new agent should use those files rather than ask LEANDRO to reconstruct prior project history.

## Current implementation boundary

Task 1 is accepted at `18d8c3b9be30a1bcdd7bc2743f95294e6d8be974`. The local
gateway and a dedicated Keycloak/PostgreSQL stack are running on loopback.
OAuth with client credentials and a real access token were verified on the
workstation. The formal task closure and remote checkpoint remain pending.

## MESTRE in ChatGPT

The [Capability Registry entry](../../../context/capabilities/workstation-mcp-status-read.yaml)
tracks `workstation.mcp.status.read`. Its only operation is
`workstation_status`, which returns CPU, available RAM, and root filesystem
capacity. The authenticated MCP tool listing and call passed locally, and an
unauthenticated call returned HTTP 401. The local evidence can be reproduced
with `python3 tests/e2e/local-oauth.py` in the provider worktree.

For ChatGPT, associate a Secure MCP Tunnel with the target Platform
organization and ChatGPT workspace. Keep the gateway on loopback. Configure a
separate OAuth client for authorization code with PKCE S256, with the exact
callback shown by ChatGPT and a token audience matching the protected resource.
The OAuth issuer must be reachable by the user during login and by the
components performing discovery and token exchange. The existing loopback
issuer and client-credentials flow only qualify local access.

In ChatGPT web, add and install the custom MCP plugin using the tunnel and
link the user account. Promote the capability after MESTRE calls
`workstation_status` from a chat and receives the actual workstation metrics.
Read live connection and authorization state before offering the tool in a new
session.

References: [Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)
and [OpenAI MCP authentication](https://developers.openai.com/plugins/build/auth).

## Promotion condition

Create/confirm `leon337/leandro-workstation-mcp`, configure/push an exact checkpoint, resolve the PIP alignment gate, then change registry lifecycle from `CANDIDATE` to `REGISTERED` in a reviewed MCF change.
