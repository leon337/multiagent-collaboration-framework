# MCF Runtime — staging deploy and recovery

## Objetivo

Executar deploy de um commit exato no serviço de staging, confirmar a versão realmente ativa e recuperar o SHA saudável anterior quando a nova versão não passar no smoke.

## Componentes

```yaml
workflow: .github/workflows/mcf-runtime-staging-deploy.yml
orchestrator: apps/rede-social-agentes/ops/render-staging-deploy.mjs
health_version: GET /health/version
health_ready: GET /health/ready
service: mcf-runtime-staging-api
```

## Configuração protegida

O workflow usa os seguintes repository secrets:

```text
MCF_RUNTIME_URL
RENDER_DEPLOY_HOOK_URL
```

`RENDER_DEPLOY_HOOK_URL` é um hook restrito ao serviço de staging. O valor não deve ser escrito em arquivo, comentário, issue, log ou documentação.

## Execução inicial

O Gate A usa `workflow_dispatch`.

Entrada opcional:

```yaml
release_sha: commit hexadecimal de 40 caracteres
```

Sem entrada, o workflow usa o SHA da revisão selecionada no acionamento.

## Gates anteriores ao deploy

```text
validar secrets e SHA
→ checkout do SHA exato
→ instalar dependências pelo lockfile
→ format check
→ lint
→ typecheck
→ testes
→ build
→ migrations duas vezes no banco efêmero de CI
```

Nenhuma chamada ao Render ocorre se qualquer gate falhar.

## Evidência anterior ao deploy

O orquestrador consulta:

```http
GET /health/version
GET /health/ready
```

O deploy é bloqueado quando:

- o runtime atual não está pronto;
- o SHA atual não pode ser validado;
- o URL público não usa HTTPS;
- o deploy hook não usa HTTPS;
- o SHA solicitado é inválido.

O SHA observado antes da implantação torna-se o candidato de recuperação.

## Deploy verificado

O deploy hook recebe o parâmetro `ref` com o SHA solicitado.

O pipeline só produz `DEPLOYED` quando:

```yaml
health_version_commit: equals_release_sha
health_ready_status: 200
```

Um HTTP 200 de readiness sem correspondência de versão não é suficiente.

## Recuperação

Qualquer falha após os gates inicia:

```text
redeploy previous_sha
→ aguardar exact previous_sha
→ exigir readiness 200
```

Resultados:

```yaml
DEPLOYED:
  workflow: success
NOOP:
  workflow: success
RECOVERED:
  application: restored
  workflow: failure
DEPLOYMENT_AND_RECOVERY_FAILED:
  application: unknown_or_degraded
  workflow: failure
  escalation: required
```

## Banco de dados

O recovery de aplicação não reverte migrations nem dados.

Mudanças de banco para uma release automatizada devem ser:

- retrocompatíveis com a versão anterior;
- idempotentes;
- aplicáveis duas vezes sem erro;
- acompanhadas de backup e restore quando houver risco material.

Migrations destrutivas não pertencem ao Gate A.

## Ativação automática

O gatilho por push na `main` só pode ser adicionado depois de:

1. configurar `RENDER_DEPLOY_HOOK_URL`;
2. executar um deploy real bem-sucedido;
3. executar uma prova controlada de recuperação;
4. registrar os IDs e resultados na MCF-DEC-058;
5. obter gate de Léo.

Até esses critérios serem atendidos, o workflow permanece manual.
