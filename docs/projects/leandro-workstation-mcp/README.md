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
tracks `workstation.mcp.status.read`. It reads CPU, available RAM, and root
filesystem capacity through the authenticated MCP tool `workstation_status`.

### Invoke through the workstation bridge

1. Discover Remote Desktop Commander in the current chat and confirm the
   authorized device `leo-N43SM` is online.
2. On that device, use the connector to run the fixed local client:

   ```sh
   python3 /home/leo/leandro-workstation-mcp/.worktrees/remote-workstation-mcp/scripts/workstation-status.py
   ```

3. Use the returned JSON as the current observation. If the bridge, device or
   gateway is unavailable, report the failure and check live access before retrying.

The client obtains a short-lived Keycloak token on the workstation, calls
the loopback MCP endpoint, and returns only the metrics to the chat. OAuth
credentials and the bearer token stay on the workstation. This capability
is limited to the fixed read operation above. Shell execution as a general
MCF capability, file writes and privilege elevation are outside its scope.

Verified from a MESTRE chat using the bridge on 2026-11-12 (Recife).
The capability depends on the authorized connector being available in the
current chat. It uses the bridge as transport and is separate from a native
ChatGPT MCP plugin. The gateway and OAuth issuer remain on loopback.

## Promotion condition

Create/confirm `leon337/leandro-workstation-mcp`, configure/push an exact checkpoint, resolve the PIP alignment gate, then change registry lifecycle from `CANDIDATE` to `REGISTERED` in a reviewed MCF change.
