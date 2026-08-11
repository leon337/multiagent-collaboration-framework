# PHASE-006-LOT-3-OBSERVABILITY — PLAN

## Missão

`MCF-RUNTIME-006-LOT-3-OBSERVABILITY`

## Issue / PR

- issue: #88
- pull request: #89
- base inicial: `807637a75115b067359b5282f888cee2e6b05683`
- classe de risco: B

## Objetivo

Concluir o item 11 do Lote 3 do MCF-RUNTIME-006 com observabilidade persistente e alertas internos auditáveis para missões em `BLOCKED_RISK`, sem criar fonte paralela de verdade e sem canal externo de notificação.

## Fonte de verdade técnica

- `mcf_missions` para estado materializado;
- `mcf_phases` para fase/agente corrente;
- `mcf_events` para timeline e alerta interno;
- `McfRuntimeRepository` para leitura ordenada de eventos.

## Entregas

1. endpoint read-only de observação de uma missão;
2. endpoint read-only de missões bloqueadas;
3. reconciliação explícita de alertas internos;
4. idempotência por `mission_id + mission_version`;
5. testes de detecção, ausência de falso positivo, consulta determinística e duplicidade;
6. documentação e PRF;
7. CI, auditoria independente, gate de Léo, merge protegido e validação pós-merge.

## Restrições

```yaml
external_notification: false
new_database_table: false
new_migration: false
new_credentials: false
production: BLOCKED
live_staging_adapter: DISABLED
human_operator_actions_target: 0
```

## Critérios de aceite

```yaml
persistent_source_of_truth: EXISTING_MCF_TABLES_AND_EVENT_LEDGER
blocked_mission_detection: PASS
blocked_mission_query: PASS
internal_alert_idempotency: PASS
current_phase_agent_visibility: PASS
latest_event_visibility: PASS
no_external_notification: true
team_first_preserved: true
unit_tests: PASS
integration_or_persistence_tests: PASS
foundation: PASS
container_smoke: PASS
documentation: PASS
independent_audit: PASS
```
