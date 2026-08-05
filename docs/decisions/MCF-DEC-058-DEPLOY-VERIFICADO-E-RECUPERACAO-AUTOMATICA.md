# MCF-DEC-058 — Deploy verificado e recuperação automática

## Estado

```yaml
status: GATE_A_VALIDADO_EM_STAGING_GATE_B_AGUARDANDO_SECRET_ENTRY
mission: MCF-RUNTIME-005
owner: Leo
human_final_authority: Leandro
```

## Contexto

O serviço `mcf-runtime-staging-api` usa a branch `main`, possui health check em `/health/ready` e está com auto-deploy desativado. A implantação atual depende de uma chamada explícita ao Render.

Os gates de CI, migrations, health e E2E já existem, mas ainda não formam um pipeline único que:

1. identifique a versão atualmente saudável;
2. implante um SHA exato;
3. confirme que o novo SHA está atendendo tráfego;
4. execute smoke pós-deploy;
5. recupere a versão anterior em caso de falha.

## Decisão

O primeiro recorte de deploy controlado possui duas etapas.

### Gate A — implementação e prova manual

```yaml
version_endpoint: GET /health/version
deploy_trigger: Render deploy hook with ref=release_sha
pre_deploy_gates:
  - format
  - lint
  - typecheck
  - tests
  - build
  - migrations_twice
post_deploy_evidence:
  - exact_commit_sha
  - health_ready_200
failure_recovery: redeploy_previous_stable_sha
workflow_trigger: workflow_dispatch
status: VALIDADO_EM_STAGING
```

### Gate B — ativação automática

Após a prova real do Gate A:

```yaml
trigger: eligible_push_to_main
credential: repository_secret_RENDER_DEPLOY_HOOK_URL
overlapping_deploys: serialized
failed_release: workflow_failure_even_when_recovered
automatic_publication: false
status: BLOQUEADO_APENAS_POR_SECRET_ENTRY
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

O mecanismo inicial é **recuperação por redeploy do SHA anterior**. Ele não deve ser chamado de rollback nativo por artefato.

O Render possui uma API própria para rollback de um `deployId` anterior, mas essa operação não está disponível no conector operacional atual. A integração futura poderá substituir o redeploy por rollback nativo sem alterar os contratos de health e evidência.

## Segurança

- o deploy hook deve permanecer em `RENDER_DEPLOY_HOOK_URL` no GitHub Actions;
- o valor do hook nunca pode aparecer nos logs;
- somente HTTPS é aceito;
- o SHA deve possuir exatamente 40 caracteres hexadecimais;
- nenhum deploy começa se a versão atual não estiver saudável;
- o SHA anterior é observado diretamente no runtime antes da implantação;
- deploys concorrentes usam um grupo de concorrência serializado;
- a configuração inicial não dispara automaticamente em pushes;
- ativação automática exige prova real e decisão de gate.

## Human Delegation Firewall

O agente não consegue ler ou transferir a credencial privada do Render para o GitHub.

A única intervenção humana admissível é:

```yaml
trigger: SECRET_ENTRY
mode: TEAM_FIRST
action_count: 1
action: cadastrar o deploy hook restrito como RENDER_DEPLOY_HOOK_URL
```

Código, testes, documentação, deploy do endpoint de versão e sonda de staging já foram aprovados. Portanto, a entrada do secret é agora o único bloqueio material do Gate B.

## Critérios de aceite

```yaml
safe_version_endpoint: passed
orchestrator_unit_tests: passed
successful_deploy_test: passed
failed_smoke_recovery_test: passed
hook_secret_not_logged: passed
workflow_manual_gate: passed
format_lint_typecheck: passed
migrations_twice: passed
tests_build: passed
container_smoke: passed
staging_version_probe: passed
real_deploy_hook_proof: pending_secret_entry
automatic_trigger: forbidden_before_gate_B
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
  workflow: MCF Runtime 005 Staging Version Probe
  workflow_run_id: 30971073274
  job_id: 92195305148
  conclusion: success
  verified:
    - health_ready_http_200
    - health_ready_payload_ok
    - exact_deployed_commit
    - branch_main
    - runtime_render
quality_gates:
  documentation_validation: passed
  format: passed
  lint: passed
  typecheck: passed
  migrations_twice: passed
  tests: passed
  build: passed
  container_smoke: passed
```

A sonda efêmera foi removida após a coleta da evidência. O workflow permanente de deploy continua manual e não executa enquanto `RENDER_DEPLOY_HOOK_URL` não existir no repositório.

## Limites

- o pipeline inicial cobre somente staging;
- o banco não é revertido por um rollback de aplicação;
- migrations incompatíveis ou destrutivas exigem uma estratégia própria de compatibilidade e restore;
- o filesystem do serviço permanece efêmero;
- recovery por commit depende de o commit continuar acessível no repositório vinculado;
- o Gate B não é considerado concluído enquanto o secret restrito não estiver configurado e testado.
