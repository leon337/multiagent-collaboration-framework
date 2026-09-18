# R6 — Workspace Isolation + Capability Tokens

Mission: `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`
Runtime evidence: `CHATGPT_BUBBLE_LOCAL_SANDBOX`
Status: `PASS_PROTOTYPE`

## Workspace boundary

Implemented:
- one filesystem workspace per task;
- stable workspace owner;
- path traversal fail-closed;
- optional writable-prefix allowlist;
- per-file SHA-256 write manifest;
- conflict detection when two tasks write different bytes to the same relative path;
- reconciliation plan with explicit `requires_human_gate`;
- no reconciliation without `approve=true`;
- no unresolved conflict accepted;
- explicit path-to-task resolution;
- reconciliation receipt;
- checkpoint and rollback.

## Capability tokens

Implemented:
- HMAC-SHA256 signed token;
- binding to `agent_id` and `task_id`;
- allowed tool set;
- expiry;
- child token delegation;
- child may only narrow parent tools;
- child expiry cannot exceed parent expiry;
- persistent revocation list;
- locally generated signing key protected with mode 0600.

## Validation

Local bubble suite after R6: **29/29 PASS**.

R6-specific tests prove:
1. same relative path in separate workspaces does not cross-write;
2. conflicting hashes are detected;
3. reconciliation requires explicit approval;
4. unresolved conflicts fail closed;
5. explicit resolution produces the selected output;
6. wrong owner, path escape and disallowed prefix fail closed;
7. checkpoint/rollback restores prior task state;
8. allowed capability succeeds and unallowed tool fails;
9. expired token fails;
10. child token cannot widen parent capabilities;
11. revoked token fails.

## Audit correction

During checkpointing, the first R6 history event used the parent mission ID rather than the local runtime mission ID ending in `-LOCAL`.

The append-only event was preserved. A corrected R6 event was appended to the canonical local chain instead of rewriting history.

Canonical local chain after R6:
- events: **12**
- head: `9a18b3c1482ca59f39ad34cf797e6f835c4bba0b2acd9c9a2345e2a01c565c6e`

## Open limitations

- tool-output sanitization is not yet implemented;
- broad confused-deputy threat-model tests remain;
- broad secrets policy remains beyond the local signing key;
- current isolation is governed filesystem isolation, not Git worktree isolation.

No cognitive-agent claim is made by this phase.
