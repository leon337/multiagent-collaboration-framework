# MCF Harness V2 — Local Bubble Team Checkpoint

Mission: `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`  
Runtime: `chatgpt-bubble-local-sandbox`  
Authority: LEANDRO  
Coordinator: MESTRE  
Execution boundary: **local sandbox only**

## Canonical execution rule

Brainbase is not an executor for this mission. The notebook is not used.

```text
ChatGPT bubble sandbox
  -> local workspace /mnt/data/mcf-harness-v2-local
  -> SQLite/WAL Mission Journal
  -> local parallel engineering workers
  -> local audit fan-in
  -> receipt/checkpoint
  -> GitHub/MCF only for persistent continuity
```

## Local team cycle 2

Fan-out workers:
- journal
- recovery
- observability
- tests
- security

Fan-in:
- auditor-local

Observed result:
- 5/5 fan-out workers PASS
- local audit completed
- `PROTOTYPE_TECHNICAL_FANOUT_PASS_WITH_GAPS`
- `notebook_used=false`
- `brainbase_used=false`
- `cognitive_agents_claimed=false`

## Runtime validation

`7/7` tests PASS:
- transactional CAS across two SQLite connections;
- durable mailbox across process reopen;
- lease renewal heartbeat + expiry recovery;
- execution/tool receipt correlation;
- task-scoped tool capability fail-closed;
- DAG readiness enforcement;
- tamper-evident hash-chain detection.

## Implemented after local audit

- task DAG readiness;
- task-scoped allowed tools;
- `AuthorizationError` for capability violations;
- per-event authority context;
- SHA-256 event chain (`prev_event_sha256 -> event_sha256`);
- lease heartbeat renewal;
- local process fan-out + audit fan-in;
- per-worker evidence JSON and receipts.

## Remaining gaps

- no local LLM executor is installed, therefore current workers are deterministic engineering workers, not independent cognitive agents;
- authority context is not cryptographically authenticated;
- hash-chain is not externally anchored/signed;
- executor swap/reconciliation is incomplete;
- distributed multi-node coordination is not solved; current proof is single-host SQLite/WAL.

## Recovery instruction for a new chat

Do not recreate or redirect this team to Brainbase. Recover this checkpoint, continue the local sandbox workspace, inspect `team/manifest.json`, `team/evidence/`, `team/receipts/`, and run the local unit/integration suite before making new runtime claims.
