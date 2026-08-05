# MCF-DEC-058 — Deploy verificado e recuperação automática

## Estado

```yaml
status: CANDIDATA_PARA_GATE
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

O primeiro recorte de deploy controlado terá duas etapas.

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
```

### Gate B — ativação automática

Após a prova real do Gate A:

```yaml
trigger: eligible_push_to_main
credential: repository_secret_RENDER_DEPLOY_HOOK_URL
overlapping_deploys: serialized
failed_release: workflow_failure_even_when_recovered
automatic_publication: false
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

Essa ação só será solicitada depois que código, testes, documentação e deploy do endpoint de versão estiverem aprovados.

## Critérios de aceite

```yaml
safe_version_endpoint: required
orchestrator_unit_tests: required
successful_deploy_test: required
failed_smoke_recovery_test: required
hook_secret_not_logged: required
workflow_manual_gate: required
format_lint_typecheck: required
migrations_twice: required
tests_build: required
container_smoke: required
staging_version_probe: required
real_deploy_hook_proof: required_before_gate_B
automatic_trigger: forbidden_before_gate_B
```

## Limites

- o pipeline inicial cobre somente staging;
- o banco não é revertido por um rollback de aplicação;
- migrations incompatíveis ou destrutivas exigem uma estratégia própria de compatibilidade e restore;
- o filesystem do serviço permanece efêmero;
- recovery por commit depende de o commit continuar acessível no repositório vinculado;
- o Gate B não é considerado concluído enquanto o secret restrito não estiver configurado e testado.
