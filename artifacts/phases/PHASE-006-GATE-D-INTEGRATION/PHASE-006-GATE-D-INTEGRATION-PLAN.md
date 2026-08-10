# PHASE-006-GATE-D-INTEGRATION — Plano

## Missão

`MCF-RUNTIME-006-GATE-D-INTEGRATION`

## Objetivo

Integrar o candidato fechado do Gate D à `main` sem promover evidência entre SHAs, validar o novo SHA pós-merge em staging e reconciliar as fontes canônicas antes de transferir o checkpoint para a próxima etapa do RUNTIME-006.

## Classe de risco

`C`

## Entrada canônica

```yaml
issue: 83
pull_request: 84
candidate_head: ea63828435589a78bafcab916b51b4fc5aea1102
main_before: 1c58b4ba280bd32f587c2f042e35a2dba1a123a9
functional_release_sha: c787179e126a93af96dd67604cb24f91235c4320
closeout_state: ENTREGUE
production: BLOCKED
live_staging_adapter: DISABLED
human_operator_actions_target: 0
```

## Sequência

1. reobservar PR, issue, `main`, CI e review exact-head;
2. executar controladores obrigatórios da Classe C;
3. obter decisão explícita de Léo;
4. marcar PR ready sem alterar HEAD;
5. executar squash merge com `expected_head_sha` exato;
6. comprovar o novo SHA da `main`;
7. observar workflows pós-merge;
8. comprovar deploy/health/version/readiness do SHA novo quando aplicável;
9. reconciliar plano, README, runtime README e PRF/checkpoint;
10. validar e auditar a reconciliação;
11. fechar a integração e transferir para a próxima etapa do RUNTIME-006.

## Critérios de aceite

```yaml
head_drift_before_merge: false
main_drift_before_merge: false
leo_integration_gate: APPROVED
expected_head_merge_protection: PASS
pr_84_merged: true
new_main_sha_proven: true
post_merge_documentation: PASS
post_merge_staging: PASS
exact_sha_readiness: PASS
canonical_docs_synced: PASS
production: BLOCKED
live_registry_activation: false
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED
```
