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

Task 1 is accepted at `18d8c3b9be30a1bcdd7bc2743f95294e6d8be974`. Task 2 OAuth is locally GREEN (26/26 tests, typecheck and diff-check PASS) but still requires independent specification and quality/security review before its planned commit. Tasks 3-15 have not started.

## Promotion condition

Create/confirm `leon337/leandro-workstation-mcp`, configure/push an exact checkpoint, resolve the PIP alignment gate, then change registry lifecycle from `CANDIDATE` to `REGISTERED` in a reviewed MCF change.
