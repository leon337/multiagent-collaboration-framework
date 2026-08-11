# PHASE-006-LOT-3-OBSERVABILITY — REPORT

## Estado

`RECOVERY_TECHNICAL_CANDIDATE_VALIDATED / FINAL_CLOSEOUT_HEAD_PENDING`

## Implementação integrada no PR #89

- contratos públicos de observabilidade em `@rsa/contracts`;
- `MissionObservabilityRepository` consulta `mcf_missions` e persiste alertas em `mcf_events`;
- `MissionObservabilityService` expõe fase/agente corrente, evento recente e contexto de bloqueio;
- lista bloqueada considera exclusivamente `BLOCKED_RISK`;
- `MISSION_BLOCKED_ALERT_RAISED` usa idempotência por missão+versão;
- endpoints autenticados por sessão;
- nenhum canal externo, migration, tabela de alerta ou credencial nova.

## Evidência histórica do PR #89

```yaml
closeout_head: 7a96b120b08a4bc91aa48c83b69e587cd4d3cf21
merge_commit: 16442d9a7baf2ecbc91fb4b297ba21efa4829b38
closeout_documentation_run: 31449263849
closeout_container_smoke_run: 31449263846
closeout_foundation_run: 31449263862
closeout_server_test_files: 109
closeout_server_tests: 444
post_merge_staging_run: 31449518300
post_merge_staging: PASS
```

Essa evidência permanece vinculada aos SHAs acima e não é promovida para o candidato de recuperação.

## P2 tardio e recuperação

Após o merge, o review assíncrono do PR #89 identificou uma condição de corrida válida: o snapshot de `BLOCKED_RISK` podia ficar obsoleto antes da persistência de `MISSION_BLOCKED_ALERT_RAISED`.

A issue #88 foi reaberta e o PR #92 criado sobre `16442d9a...`.

A recuperação altera o repositório para:

1. construir candidato de alerta com `expectedMissionVersion`;
2. iniciar transação;
3. bloquear a linha de `mcf_missions` com `SELECT ... FOR UPDATE`;
4. revalidar `state == BLOCKED_RISK` e `version == expectedMissionVersion`;
5. inserir somente quando o snapshot ainda é válido;
6. descartar candidato stale sem persistir evento;
7. manter `ON CONFLICT(idempotency_key) DO NOTHING` para duplicidade real.

## Prova do candidato de recuperação

```yaml
recovery_technical_candidate_head: 6f7c314df71f2a7f8a4efce94ece0051eabf7841
recovery_base: 16442d9a7baf2ecbc91fb4b297ba21efa4829b38
container_smoke_run: 31453432608
container_smoke: PASS
foundation_run: 31453432602
foundation: PASS
server_test_files: 109
server_tests: 447
observability_tests: 12
vitest_artifact_id: 9087159560
vitest_artifact_digest: sha256:e1f030d7f17704cdea71da6866e5c3a785dd0bacb41d2cec5c885d47a78398f8
stale_snapshot_postgres_regression: PASS
format: PASS
lint: PASS
typecheck: PASS
migrations_twice: PASS
build: PASS
```

## Boundary de evidência

A atualização do PRF altera o HEAD do PR #92. Portanto o HEAD final de closeout deve passar novamente por Documentation, Container Smoke e Foundation antes de qualquer autorização de integração. Nenhum PASS de `6f7c314...`, `7a96b120...` ou `16442d9a...` será promovido para o novo HEAD.

## Limites

```yaml
production: BLOCKED
live_staging_adapter: DISABLED
external_notification: false
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED
```
