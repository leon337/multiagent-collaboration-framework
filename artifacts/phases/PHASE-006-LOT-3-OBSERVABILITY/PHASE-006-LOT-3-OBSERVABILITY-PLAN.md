# PHASE-006-LOT-3-OBSERVABILITY — PLAN

## Missão

`MCF-RUNTIME-006-LOT-3-OBSERVABILITY`

## Issue / PR

- issue: #88
- implementação original: PR #89
- recuperação pós-merge: PR #92
- base inicial: `807637a75115b067359b5282f888cee2e6b05683`
- base da recuperação: `16442d9a7baf2ecbc91fb4b297ba21efa4829b38`
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
5. rechecagem atômica de `BLOCKED_RISK + mission_version` imediatamente antes da persistência do alerta;
6. testes de detecção, ausência de falso positivo, consulta determinística, duplicidade e snapshot obsoleto;
7. documentação e PRF;
8. CI, auditoria independente, gate de Léo, merge protegido e validação pós-merge.

## Recuperação pós-merge

Após o merge do PR #89, um review assíncrono identificou um P2: uma missão poderia deixar `BLOCKED_RISK` ou avançar de versão entre a listagem e o insert do alerta. O PR #92 corrige a condição de corrida com lock da linha da missão (`SELECT ... FOR UPDATE`) e rechecagem de estado+versão na mesma transação do insert. Candidatos obsoletos são descartados sem evento.

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
stale_blocked_snapshot_rejection: PASS
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
