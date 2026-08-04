# MCF Runtime

Esta pasta consolida a especificação executável do Multiagent Collaboration Framework.

## Documentos

- `MCF-RUNTIME-SPECIFICATION.md` — arquitetura, estados, ledger, evidência e critérios de expansão;
- `MCF-RUNTIME-API.md` — endpoints, autenticação, callbacks e respostas;
- `MCF-RUNTIME-RECOVERY.md` — implementação do Protocolo CAF;
- `MCF-FIVE-SPRINTS-EXECUTION.md` — rastreabilidade das cinco sprints executadas.

## Código

```text
apps/rede-social-agentes/apps/server/src/mcf-runtime/
apps/rede-social-agentes/packages/contracts/src/mcf-runtime.ts
apps/rede-social-agentes/packages/database/migrations/0013_mcf_runtime.sql
.github/workflows/mcf-runtime-integration.yml
```

## Fonte de skills

```text
skills/registry.yaml
```

O runtime não mantém uma cópia paralela do registro. A imagem do servidor inclui a pasta canônica `skills/`.

## Estado do MVP

```yaml
runtime: executable_vertical_slice
skills_registered: 16
skills_executable: 3
persistent_state: true
trusted_receipts: true
ci_callback: true
social_auto_publish: false
```

## Ativação da integração de CI

Configurar no GitHub:

```text
MCF_RUNTIME_URL
MCF_RUNTIME_TOKEN
```

Configurar no runtime:

```text
MCF_RECEIPT_SECRET
MCF_RUNTIME_TOKEN
```

O token do GitHub e o token do runtime devem ser o mesmo valor apenas para o canal de callback correspondente. O segredo de recibos deve ser diferente.

## Segurança

Nenhum segredo real é armazenado no repositório. Defaults de desenvolvimento são rejeitados quando `NODE_ENV=production`.
