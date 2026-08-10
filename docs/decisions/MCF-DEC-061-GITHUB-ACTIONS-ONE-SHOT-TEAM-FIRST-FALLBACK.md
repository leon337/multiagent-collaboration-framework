# MCF-DEC-061 — Fallback TEAM_FIRST one-shot por GitHub Actions

**Estado:** APROVADA PARA FALLBACK OPERACIONAL CONTROLADO  
**Missão de origem:** MCF-RUNTIME-006-GATE-D  
**Tracking:** issue #83 / PR #84  
**Evidência primária:** PR #84, Cycle 4, receipts C4-013 a C4-020

## 1. Problema

Durante a prova real controlada do Gate D, Léo autorizou exatamente um deploy em staging
do release `c787179e126a93af96dd67604cb24f91235c4320`. O conector GitHub disponível ao
Mestre não expunha criação de `workflow_dispatch` e o ambiente local não possuía uma
credencial GitHub reutilizável.

A ausência desse botão/capacidade no conector não justificava transferir a operação para
Leandro, porque o Human Delegation Firewall mantém `TEAM_FIRST` e
`human_operator_actions=0` para rotinas técnicas executáveis pela equipe.

## 2. Descoberta

GitHub Actions pode atuar como executor autenticado temporário usando o `GITHUB_TOKEN`
efêmero da própria execução. Para o fallback do Gate D, um workflow one-shot em branch
operacional isolada recebeu somente:

```yaml
permissions:
  contents: read
  actions: write
```

Esse executor:

1. comprovou que um ref operacional imutável apontava para o SHA autorizado;
2. recusou execução se já existisse dispatch correlacionado;
3. emitiu exatamente um `workflow_dispatch` para o workflow oficial de staging;
4. passou `release_sha`, `request_id`, `mission_id` e `phase_id`;
5. confirmou a criação do run correlacionado;
6. foi removido após a execução.

Nenhum token pessoal de Leandro foi solicitado ou criado.

## 3. Evidência real

```yaml
authorized_release_sha: c787179e126a93af96dd67604cb24f91235c4320
request_id: c4-gated-real-proof-c787-001
helper_run: 31438190773
helper_result: SUCCESS
staging_run: 31438199266
staging_event: workflow_dispatch
staging_result: SUCCESS
deployment_outcome: DEPLOYED
previous_staging_sha: 0a7909b71e1944d1062e8ea1ab13a4bee4abbf88
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED
```

O workflow oficial confirmou o release exato e readiness antes de marcar `DEPLOYED`.
`NOOP` e `RECOVERED` ficaram inativos nessa prova.

## 4. Regra aprovada

O padrão one-shot é um **fallback operacional**, não um novo adapter live.

Pode ser usado somente quando todas as condições abaixo forem verdadeiras:

```yaml
explicit_operational_authorization: REQUIRED
normal_team_execution_route: UNAVAILABLE
target_effect: WITHIN_AUTHORIZED_SCOPE
ephemeral_github_token: REQUIRED
minimum_permissions: REQUIRED
isolated_operational_ref: REQUIRED
exact_target_sha_binding: REQUIRED
duplicate_dispatch_guard: REQUIRED
single_dispatch: REQUIRED
correlation_keys: REQUIRED
post_execution_cleanup: REQUIRED
human_operator_actions_target: 0
```

## 5. Proibições

Esta decisão não autoriza:

- ativar adapter fora do gate correspondente;
- adicionar credencial pessoal de Leandro;
- reutilizar o helper como backdoor permanente;
- ampliar o efeito para produção;
- efetuar merge sem gate de integração;
- ignorar idempotência, correlação ou verificação do SHA;
- repetir uma mutação quando o efeito anterior estiver `UNKNOWN`.

## 6. Relação com o HDF

A ausência de uma operação específica no conector é uma limitação de ferramenta, não um
gatilho automático de HUMAN_GATE. Antes de envolver Leandro, Mestre deve procurar uma
rota TEAM_FIRST segura, autorizada, auditável e reversível.

## 7. Estado normativo

```yaml
TEAM_FIRST_ONE_SHOT_ACTIONS_FALLBACK: APPROVED_WITH_GUARDRAILS
PERSONAL_TOKEN_FROM_LEANDRO: NOT_REQUIRED_BY_DEFAULT
PRODUCTION: BLOCKED
AUTOMATIC_MERGE: NOT_AUTHORIZED
LIVE_STAGING_ADAPTER: NOT_AUTHORIZED_BY_THIS_DECISION
```
