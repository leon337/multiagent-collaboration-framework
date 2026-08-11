# PHASE-006-LOT-3-OBSERVABILITY — REPORT

## Estado

`TECHNICAL_OBJECTIVE_COMPLETE / CANONICAL_SYNC_COMPLETE_ON_BRANCH / READY_FOR_DOC_SYNC_GATE`

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

Essa evidência permanece vinculada aos SHAs acima e não foi promovida para a recuperação.

## P2 tardio e recuperação

Após o merge, o review assíncrono do PR #89 identificou uma condição de corrida válida: o snapshot de `BLOCKED_RISK` podia ficar obsoleto antes da persistência de `MISSION_BLOCKED_ALERT_RAISED`.

A issue #88 foi reaberta e o PR #92 corrigiu o problema com:

1. candidato de alerta com `expectedMissionVersion`;
2. transação única;
3. `SELECT ... FOR UPDATE` na linha da missão;
4. revalidação de `state == BLOCKED_RISK` e `version == expectedMissionVersion`;
5. insert somente quando o snapshot ainda é válido;
6. descarte de candidato stale sem evento;
7. `ON CONFLICT(idempotency_key) DO NOTHING` restrito à duplicidade real.

## Closeout exato da recuperação

```yaml
recovery_pull_request: 92
recovery_base: 16442d9a7baf2ecbc91fb4b297ba21efa4829b38
recovery_closeout_head: e2aace417295ee33c84826a1b782c7a6fc42f62f
foundation_run: 31453781013
foundation: PASS
container_smoke_run: 31453781061
container_smoke: PASS
server_test_files: 109
server_tests: 447
observability_tests: 12
vitest_artifact_id: 9087290657
vitest_artifact_digest: sha256:bd80a83aad455fbbfa907a7a8208be41f5970c8bbc64e42ee983f032c81555ce
stale_snapshot_postgres_regression: PASS
independent_audit: PASS
active_p0: 0
active_p1: 0
active_p2: 0
leo_gate: APROVAR
```

## Merge e validação pós-merge

```yaml
recovery_merge_commit: 7418fff6e30f6107313a632284266caf04e8b33a
post_merge_documentation_run: 31454187271
post_merge_documentation: PASS
post_merge_staging_run: 31454187273
post_merge_staging_job: 93664514760
post_merge_staging: PASS
post_merge_outcome: DEPLOYED
exact_sha_health_version: PASS
readiness: PASS
```

O workflow de staging fez checkout da revisão exata, executou smoke, format, lint, typecheck, migrations duas vezes, testes e build, e concluiu `DEPLOYED` somente após o contrato de deploy verificar o SHA solicitado e readiness.

## Canonical sync

Esta branch documental parte exatamente do merge técnico `7418fff6...` e atualiza o roadmap e os READMEs para declarar o Lote 3 concluído e transferir o checkpoint para `MCF-RUNTIME-006-LOT-4-SKILLS`. O merge desta branch ainda exige gate próprio e proteção de HEAD.

## Limites

```yaml
production: BLOCKED
live_staging_adapter: DISABLED
external_notification: false
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED
```
