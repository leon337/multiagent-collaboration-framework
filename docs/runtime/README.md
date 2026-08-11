# MCF Runtime

Esta pasta consolida a especificação executável do Multiagent Collaboration Framework.

## Documentos

- `MCF-RUNTIME-SPECIFICATION.md` — arquitetura, estados, ledger, evidência e critérios de expansão;
- `MCF-RUNTIME-API.md` — endpoints, autenticação, callbacks e respostas;
- `MCF-RUNTIME-RECOVERY.md` — implementação do Protocolo CAF;
- `MCF-RUNTIME-006-PLAN.md` — plano e estado canônico dos adapters externos confiáveis;
- `MCF-FIVE-SPRINTS-EXECUTION.md` — rastreabilidade das cinco sprints executadas.

## Código

```text
apps/rede-social-agentes/apps/server/src/mcf-runtime/
apps/rede-social-agentes/packages/contracts/src/mcf-runtime.ts
apps/rede-social-agentes/packages/database/migrations/
.github/workflows/mcf-runtime-integration.yml
.github/workflows/mcf-runtime-staging-deploy.yml
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
skills_executable: 12
skills_documental: 4
persistent_state: true
trusted_receipts: true
ci_callback: true
external_action_dispatcher: true
permission_engine: true
adapter_registry: true
github_code_review_read_only: integrated
github_ci_query_read_only: integrated
github_branch_pr_write: integrated_implementation
github_pr_collaboration_write: integrated_implementation
github_staging_deploy_adapter: integrated
staging_exact_sha_health_version: pass
staging_readiness: pass
staging_recovery_strategy: redeploy_previous_healthy_sha
blocked_mission_observability: integrated
blocked_alert_atomic_state_version_recheck: pass
runtime_006_lot_3: complete
runtime_006_lot_4a: complete
runtime_006_lot_4a_merge: 67d20e24fd136f6334bfd835cb775426f6514403
live_staging_adapter: disabled
production: blocked
social_auto_publish: false
```

O Gate D do `MCF-RUNTIME-006` foi integrado no merge `2dfeb0e23c5c2e19a2c21e6f2c50a1a4f466d06a`. O workflow pós-merge `31442205251` implantou o próprio merge SHA em staging e concluiu `PASS/DEPLOYED`, verificando `/health/version` e `/health/ready` pelo contrato do deploy. O live registry continua desativado e produção continua bloqueada.

A observabilidade de missões bloqueadas concluiu o Lote 3. O PR #89 integrou a capacidade inicial; um P2 tardio revelou uma corrida de snapshot e a recuperação no PR #92 passou Foundation `31453781013`, Container Smoke `31453781061`, 109 arquivos/447 testes e auditoria independente sem P0/P1/P2 ativos. O merge de recuperação `7418fff6e30f6107313a632284266caf04e8b33a` passou Documentation `31454187271` e staging `31454187273` com `PASS/DEPLOYED` no SHA exato. A persistência do alerta agora revalida `BLOCKED_RISK` e a versão da missão sob lock transacional antes do insert.

O Lot 4-A concluiu o primeiro incremento de cobertura total. O PR #95 integrou quatro skills internas de domínio com `READY_AGENT`, provider interno governado, evidência semântica obrigatória, fallback para `RECOVERING`, persistência pelo `MissionRuntime` e preservação do HDF. O HEAD técnico `e3e70fbbd2c940ee66a8de9c418e0e8d32a4c668` passou Foundation `31461319193` e Container Smoke `31461319181`, com 112 arquivos/459 testes; o merge squash `67d20e24fd136f6334bfd835cb775426f6514403` possui a mesma tree `def5edf77be8bdc32939d2b4bd5b1fcbcca649ec` do candidato validado. O runtime passa a 12 skills executáveis e 4 documentais.

A decisão `MCF-DEC-061-GITHUB-ACTIONS-ONE-SHOT-TEAM-FIRST-FALLBACK.md` formaliza o fallback temporário TEAM_FIRST via GitHub Actions com `GITHUB_TOKEN` efêmero, menor privilégio, binding ao SHA, single dispatch e cleanup. Ela não autoriza merge, produção ou ativação live por si só e não usa token pessoal de Leandro por padrão.

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

Leandro não é executor técnico do runtime. `human_operator_actions=0` permanece alvo operacional e produção só pode ser liberada por gate próprio.

## Próxima etapa do RUNTIME-006

O Lote 3 está **concluído** e o Lot 4-A está **integrado**. A próxima etapa é `MCF-RUNTIME-006-LOT-4-B-EVALUATE-AGENTS`. Restam quatro skills documentais — `MCF-EVALUATE-AGENTS`, `MCF-SECURITY-REVIEW`, `MCF-DEBUG-INCIDENT` e `MCF-CLOSE-PHASE` — que continuam separadas por risco. Depois seguem testes multiagente em contextos separados, auditoria independente final e preparação da RC.
