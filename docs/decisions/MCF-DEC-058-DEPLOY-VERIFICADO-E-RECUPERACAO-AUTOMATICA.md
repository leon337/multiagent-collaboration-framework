# MCF-DEC-058 — Deploy verificado e recuperação automática

## Estado

```yaml
status: APROVADA_E_VALIDADA_EM_STAGING
mission: MCF-RUNTIME-005
owner: Leo
human_final_authority: Leandro
```

## Contexto

O serviço `mcf-runtime-staging-api` usa a branch `main`, possui health check em `/health/ready` e mantém o auto-deploy nativo do Render desativado. A implantação é coordenada pelo GitHub Actions por meio de um deploy hook restrito.

O pipeline precisava:

1. identificar a versão atualmente saudável;
2. implantar um SHA exato;
3. confirmar que o novo SHA atende tráfego;
4. executar smoke antes e depois do deploy;
5. recuperar o SHA saudável anterior em caso de falha.

## Decisão

### Gate A — implementação e prova manual

```yaml
version_endpoint: GET /health/version
deploy_trigger: Render deploy hook with ref=release_sha
pre_deploy_gates:
  - container_smoke
  - format
  - lint
  - typecheck
  - migrations_twice
  - tests
  - build
post_deploy_evidence:
  - exact_commit_sha
  - health_ready_200
failure_recovery: redeploy_previous_stable_sha
workflow_trigger: workflow_dispatch
status: VALIDADO_EM_STAGING
```

### Gate B — ativação automática

```yaml
trigger: eligible_push_to_main
eligible_paths:
  - apps/rede-social-agentes/**
  - skills/**
  - .github/workflows/mcf-runtime-staging-deploy.yml
credential: repository_secret_RENDER_DEPLOY_HOOK_URL
overlapping_deploys: serialized
failed_release: workflow_failure_even_when_recovered
automatic_publication: false
status: VALIDADO_EM_STAGING
```

## Endpoint de versão

`GET /health/version` expõe somente:

```yaml
service: rede-social-agentes
component: server
commitSha: validated_40_character_sha_or_null
branch: validated_branch_or_null
runtime: render_or_local
```

A resposta não inclui banco, tokens, deploy hook, variáveis arbitrárias ou outros dados de configuração.

## Orquestração

```text
consultar /health/version e /health/ready
→ preservar SHA saudável anterior
→ executar container smoke e gates de código/banco
→ acionar deploy hook com ref=release_sha
→ aguardar /health/version == release_sha
→ exigir /health/ready HTTP 200
→ registrar DEPLOYED
```

Se qualquer etapa pós-gate falhar:

```text
acionar o mesmo deploy hook com ref=previous_sha
→ aguardar /health/version == previous_sha
→ exigir /health/ready HTTP 200
→ registrar RECOVERED
→ manter workflow com falha
```

Manter o workflow vermelho após uma recuperação evita tratar uma versão rejeitada como release bem-sucedida.

## Terminologia

O mecanismo implementado é **recuperação por redeploy do SHA saudável anterior**. Ele não é rollback nativo por artefato ou por `deployId`.

Uma futura integração poderá usar o rollback nativo do Render sem alterar os contratos de health, versão e evidência.

## Segurança

- o deploy hook permanece em `RENDER_DEPLOY_HOOK_URL` no GitHub Actions;
- o valor do hook nunca aparece nos logs;
- somente HTTPS é aceito;
- o SHA deve possuir exatamente 40 caracteres hexadecimais;
- nenhum deploy começa se a versão atual não estiver saudável;
- o SHA anterior é observado diretamente no runtime;
- deploys concorrentes usam um grupo de concorrência serializado;
- alterações apenas em documentação não disparam deploy;
- alterações no runtime, no registro de skills ou no próprio workflow disparam o pipeline completo.

## Human Delegation Firewall

A única intervenção humana usada foi o cadastro protegido do deploy hook como `RENDER_DEPLOY_HOOK_URL`. O valor não foi exibido à equipe nem registrado em logs.

```yaml
trigger: SECRET_ENTRY
mode: TEAM_FIRST
action_count: 1
result: COMPLETED
```

## Critérios de aceite

```yaml
safe_version_endpoint: passed
orchestrator_unit_tests: passed
successful_deploy_test: passed
failed_smoke_recovery_test: passed
hook_secret_not_logged: passed
workflow_manual_gate: passed
workflow_automatic_gate: passed
format_lint_typecheck: passed
migrations_twice: passed
tests_build: passed
container_smoke: passed
staging_version_probe: passed
real_deploy_hook_proof: passed
controlled_recovery_proof: passed
skills_registry_trigger: passed
```

## Evidências do Gate A

```yaml
integration:
  pull_request: 63
  merge_sha: dbc3ab1ceebc9426fada530f5d91d59b440f3029
render_deploy:
  service: mcf-runtime-staging-api
  deploy_id: dep-d9padonlk1mc73dm2j90
  commit: dbc3ab1ceebc9426fada530f5d91d59b440f3029
  status: live
staging_probe:
  workflow_run_id: 30971073274
  job_id: 92195305148
  conclusion: success
  verified:
    - health_ready_http_200
    - exact_deployed_commit
    - branch_main
    - runtime_render
```

## Evidências do Gate B

### Primeira execução automática

```yaml
integration:
  pull_request: 65
  merge_sha: 33393e38b081c61e346550de3a5efc1fdb3b902a
workflow:
  workflow_run_id: 31018375874
  job_id: 92348364078
  conclusion: success
render_deploy:
  deploy_id: dep-d9pl2re417fc73e5jk5g
  commit: 33393e38b081c61e346550de3a5efc1fdb3b902a
  status: live
```

### Cobertura do registro de skills

```yaml
integration:
  pull_request: 66
  merge_sha: 73bf566bd71211e071fc20d3380c7e4c088e694c
workflow:
  workflow_run_id: 31019039045
  job_id: 92350650534
  conclusion: success
render_deploy:
  deploy_id: dep-d9pl691t0dsc73dth65g
  commit: 73bf566bd71211e071fc20d3380c7e4c088e694c
  status: live
```

### Prova controlada de recuperação

```yaml
workflow:
  workflow_run_id: 31019457962
  job_id: 92352078914
  conclusion: success
failure_target: ffffffffffffffffffffffffffffffffffffffff
orchestrator_status: RECOVERED
healthy_sha_before: 73bf566bd71211e071fc20d3380c7e4c088e694c
healthy_sha_after: 73bf566bd71211e071fc20d3380c7e4c088e694c
recovery_deploy_id: dep-d9pl98nukhjdid0ivm1g
readiness_after_recovery: passed
database_change: none
secret_exposure: none
```

A sonda efêmera de recuperação foi removida após a coleta das evidências.

## Limites

- o pipeline cobre somente staging;
- o banco não é revertido por uma recuperação da aplicação;
- migrations incompatíveis ou destrutivas exigem compatibilidade ou restore próprio;
- o filesystem do serviço permanece efêmero;
- recovery por commit depende de o commit continuar acessível no repositório;
- rollback nativo por artefato do Render permanece fora do escopo desta decisão.
