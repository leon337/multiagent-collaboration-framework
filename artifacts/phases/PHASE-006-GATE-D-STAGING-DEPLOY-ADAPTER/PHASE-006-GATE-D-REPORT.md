# PHASE-006-GATE-D — Relatório de Execução

## Estado desta materialização

`CLOSURE_MATERIALIZATION_PENDING_EXACT_HEAD_REVALIDATION`

A implementação funcional foi validada e a prova real controlada em staging foi concluída
com sucesso. O objetivo do Gate D está tecnicamente atendido; esta escrita materializa o
closeout e a decisão operacional descoberta durante a recuperação.

## Histórico preservado

- Cycle 1: execução técnica histórica preservada.
- Cycle 2: `PHASE-006-GATE-D-CYCLE-2-TRACE.yaml` permanece reconstrução retrospectiva e
  não substitui ESEV contemporânea.
- Cycle 3: evidência técnica preservada; Augusto C3-021 rejeitou seu fechamento HDF.
- Cycle 4: nova cadeia ESEV contemporânea, indexada em
  `PHASE-006-GATE-D-CYCLE-4-ESEV-RECEIPTS.md`.

## Candidate técnico validado

```yaml
technical_release_sha: c787179e126a93af96dd67604cb24f91235c4320
foundation_run: 31431820713
foundation: PASS
container_smoke_run: 31431820709
container_smoke: PASS
vitest_artifact: 9079437876
artifact_digest: sha256:3cf0373f66f71bc41681d3a1bfbe6fb4d1c448c0c97c694cda01de617b31dd71
codex_review_comment: 5246038796
codex_review: NO_MAJOR_ISSUES
active_p0: 0
active_p1: 0
active_p2: 0
```

## Prova real controlada

Após C4-013, o primeiro caminho de execução foi bloqueado pela superfície limitada do
conector. C4-014 registrou o bloqueio sem pedir operação humana.

A RC de C4-015 encontrou fallback TEAM_FIRST via GitHub Actions com token efêmero e
permissão mínima. O helper descartável em branch operacional isolada produziu exatamente
um dispatch correlacionado e foi removido depois da execução.

```yaml
helper_run: 31438190773
helper_result: SUCCESS
staging_run: 31438199266
staging_event: workflow_dispatch
staging_result: SUCCESS
deployment_outcome: DEPLOYED
release_sha: c787179e126a93af96dd67604cb24f91235c4320
previous_sha: 0a7909b71e1944d1062e8ea1ab13a4bee4abbf88
request_id: c4-gated-real-proof-c787-001
human_operator_actions: 0
```

O driver de staging só marca `DEPLOYED` depois que `/health/version` converge para o SHA
solicitado e `/health/ready` responde saudável.

## Controles pós-prova

```yaml
renato_c4_016: PASS
augusto_c4_017_mission_trace_hdf: PASS
julia_c4_018_class_c_governance: PASS
emily_c4_019_final_independent_audit: PASS
leo_c4_020:
  decision: APROVAR
  gate_d: PASS
  real_staging_proof: PASS
```

## Descoberta institucional

O fallback one-shot foi elevado a decisão formal em
`docs/decisions/MCF-DEC-061-GITHUB-ACTIONS-ONE-SHOT-TEAM-FIRST-FALLBACK.md`.

## Restrições preservadas

```yaml
live_registry: DISABLED
production: BLOCKED
merge: REQUIRES_SEPARATE_INTEGRATION_AUTHORIZATION
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED
```

## Boundary final de evidência

Este closeout documental muda o HEAD do PR #84. Portanto:

1. o delta desta materialização deve ser comprovado como documental;
2. Foundation e Container Smoke devem passar no novo HEAD exato;
3. revisão independente deve ser vinculada ao novo HEAD;
4. somente depois Mestre registra o estado terminal `ENTREGUE` e transfere o checkpoint.

A prova real não é reatribuída ao novo SHA documental; ela permanece corretamente vinculada
ao release funcional `c787179e...`.
