# PHASE-006-LOT-3-OBSERVABILITY — DECISIONS

## OBS-DEC-001 — Classe B

A fase permanece Classe B porque adiciona leitura interna e persistência idempotente de evento no ledger já existente, sem efeito externo material.

Qualquer webhook, e-mail, mensageria ou outro canal externo exige reclassificação antes da implementação.

## OBS-DEC-002 — Sem fonte paralela

A observabilidade deriva exclusivamente de `mcf_missions`, `mcf_phases` e `mcf_events`. Não existe tabela independente de alertas.

## OBS-DEC-003 — Bloqueio canônico

Somente `McfMissionState=BLOCKED_RISK` entra na lista de missões bloqueadas desta fase. `WAITING_EXTERNAL` e `RECOVERING` permanecem estados distintos e não são promovidos a bloqueio por heurística.

## OBS-DEC-004 — Causa sem fabricação

O contexto procura o evento de bloqueio/restrição mais recente. Quando não existe evidência suficiente, a razão exposta é `MISSION_STATE_BLOCKED_RISK`, sem inferir uma causa não registrada.

## OBS-DEC-005 — Alerta interno idempotente

O evento `MISSION_BLOCKED_ALERT_RAISED` usa idempotency key:

`mission:{mission_id}:blocked-alert:v{mission_version}`

O conflito é tratado por `ON CONFLICT (idempotency_key) DO NOTHING`.

## OBS-DEC-006 — TEAM_FIRST

Um alerta de missão bloqueada não equivale a `HUMAN_GATE`. O payload registra `humanActionRequired=false`; escalada humana continua restrita aos gatilhos canônicos do protocolo.

## OBS-DEC-007 — Limites preservados

```yaml
production: BLOCKED
live_staging_adapter: DISABLED
external_notification: false
new_credentials: false
human_operator_actions: 0
```
