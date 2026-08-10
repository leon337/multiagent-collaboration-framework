# PHASE-006-GATE-D-INTEGRATION — Decisões

## INT-D001 — preservar candidato exact-head

O candidato `ea63828435589a78bafcab916b51b4fc5aea1102` não recebeu alterações durante o gate de integração. A reconciliação documental foi adiada para depois do merge para não invalidar CI e review do HEAD fechado.

## INT-D002 — threads históricos não são findings ativos automaticamente

Threads de review antigos foram preservados como trilha de auditoria. O gate utilizou o review independente final no HEAD exato e o estado de closeout `active_p0/p1/p2 = 0/0/0`.

## INT-D003 — merge protegido

Léo autorizou explicitamente a integração por `squash`, vinculada ao `expected_head_sha` `ea63828435589a78bafcab916b51b4fc5aea1102` e à base observada `1c58b4ba280bd32f587c2f042e35a2dba1a123a9`.

## INT-D004 — MCF-DEC-061 não necessária para o merge

O conector GitHub disponível ofereceu a mutação protegida necessária. O fallback TEAM_FIRST one-shot permaneceu disponível, mas não foi usado nem ampliou autorização.

## INT-D005 — limites preservados

```yaml
production: BLOCKED
live_staging_adapter: DISABLED
personal_token_from_leandro: NOT_REQUIRED
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED
```

## INT-D006 — reconciliação pós-merge separada

A atualização do estado canônico ocorre em branch/PR documental separado, baseada no merge SHA real e nos workflows pós-merge do mesmo SHA.
