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

## HISTORY_PIPELINE_V1 — 2026-09-18

- `ops/live_history.py` implementado no workspace local da bolha.
- `team/live-history.jsonl` é append-only e hash-chained.
- `team/live-history-projection.json` é a projeção auditável para superfícies live.
- `local_team_runner.py` registra início, resultado de cada worker, auditoria e conclusão.
- última execução: 8 eventos, 5/5 workers PASS, auditor PASS_WITH_GAPS.
- suíte total: 12/12 PASS.
- notebook_used=false; brainbase_used=false; cognitive_agents_claimed=false.

## HISTORY_PIPELINE_E2E_VALIDATED

- local append-only history: PASS
- LIVE-DASHBOARD projection: PASS
- Issue #234 projection: PASS
- mcf-cockpit-live /api/mcf validation: PASS
- checkpoint text, 12/12 PASS and chain head observed through the live Vercel API.

## R6_HISTORY_ID_RECONCILIATION

- During R6 checkpointing, the first R6 event was appended with the parent mission ID instead of the local runtime mission ID suffix `-LOCAL`.
- The append-only record was preserved; it was not deleted or rewritten.
- R6 was then appended to the canonical local chain with the correct mission ID.
- The live local projection remains scoped to `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001-LOCAL`.
- Canonical local chain after R6: 12 events.
- Canonical chain head after R6: `9a18b3c1482ca59f39ad34cf797e6f835c4bba0b2acd9c9a2345e2a01c565c6e`.

## R6_WORKSPACE_CAPABILITIES_PASS

- isolated task workspace: PASS
- conflict detection: PASS
- reconciliation human gate: PASS
- checkpoint/rollback: PASS
- expiring capability tokens: PASS
- narrowing/no widening: PASS
- revocation: PASS
- local unit/integration suite: 29/29 PASS
