# MCF Runtime — Observabilidade de missões bloqueadas

## Escopo

Este documento descreve a capacidade do `MCF-RUNTIME-006` para observar missões persistidas e registrar alertas internos auditáveis quando o estado canônico é `BLOCKED_RISK`.

A capacidade é Classe B. Não envia notificações externas, não ativa produção e não transforma bloqueio técnico em `HUMAN_GATE`.

## Fonte de verdade

```text
mcf_missions  → estado materializado da missão
mcf_phases    → fase/agente corrente
mcf_events    → timeline, causa observada e alerta interno
```

Não existe tabela paralela de alertas.

## Endpoints

Todos os endpoints abaixo usam a sessão autenticada existente (`SessionAuthGuard`).

### Observar uma missão

```http
GET /v1/mcf/observability/missions/{missionId}
```

Retorna:
- missão materializada;
- fase/agente corrente, quando disponíveis;
- evento mais recente;
- `blocked: true` somente quando `state=BLOCKED_RISK`;
- contexto de bloqueio derivado do ledger.

Se o ledger não possuir uma causa suficiente, o runtime retorna `MISSION_STATE_BLOCKED_RISK` em vez de fabricar uma explicação.

### Listar missões bloqueadas

```http
GET /v1/mcf/observability/blocked
```

A lista é derivada exclusivamente de `mcf_missions.state=BLOCKED_RISK` e ordenada de forma determinística por `updated_at`, depois `id`.

`WAITING_EXTERNAL` e `RECOVERING` não são convertidos em bloqueio por heurística.

### Reconciliar alertas internos

```http
POST /v1/mcf/observability/blocked/reconcile
```

Para cada missão bloqueada, o runtime tenta registrar:

```text
MISSION_BLOCKED_ALERT_RAISED
```

A idempotency key é:

```text
mission:{mission_id}:blocked-alert:v{mission_version}
```

O ledger existente possui unicidade de `idempotency_key`; a inserção usa `ON CONFLICT DO NOTHING`. Assim, repetir a reconciliação para a mesma versão não cria um segundo alerta.

O resultado explicita:

```yaml
externalNotification: false
humanActionRequired: false
```

## Eventos usados como contexto

O runtime pode usar como contexto o evento relevante mais recente entre:

- `MISSION_STATE_CHANGED`;
- `PERMISSION_DENIED`;
- `EVIDENCE_REJECTED`;
- `EXTERNAL_ACTION_FAILED`;
- `EXTERNAL_ACTION_ABANDONED`;
- `GATE_REQUIRED`;
- `GATE_REJECTED`;
- `RECOVERY_STARTED`.

O evento de alerta não é reutilizado como causa do próprio alerta.

## TEAM_FIRST e HUMAN_GATE

`MISSION_BLOCKED_ALERT_RAISED` é um sinal operacional/auditável. Ele não autoriza escalada humana.

A decisão de `HUMAN_GATE` continua obedecendo somente aos gatilhos canônicos do protocolo vigente e deve ser dirigida exclusivamente a LEANDRO quando realmente necessária.

## Limites do lote

```yaml
external_notification: false
new_database_table: false
new_migration: false
new_credentials: false
production: BLOCKED
live_staging_adapter: DISABLED
human_operator_actions_target: 0
```
