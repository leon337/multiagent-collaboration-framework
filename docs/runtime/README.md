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
skills_executable: 14
skills_documental: 2
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
runtime_006_lot_4b: complete
runtime_006_lot_4b_merge: 741abdad70432b9232256b7204156d96770c9b4d
runtime_006_lot_4c: complete
runtime_006_lot_4c_merge: 08c3e19e1b6408a164628e1bfaa5968e2070ccf0
live_staging_adapter: disabled
production: blocked
social_auto_publish: false
```

O Gate D do `MCF-RUNTIME-006` foi integrado no merge `2dfeb0e23c5c2e19a2c21e6f2c50a1a4f466d06a`. O workflow pós-merge `31442205251` implantou o próprio merge SHA em staging e concluiu `PASS/DEPLOYED`, verificando `/health/version` e `/health/ready` pelo contrato do deploy. O live registry continua desativado e produção continua bloqueada.

A observabilidade de missões bloqueadas concluiu o Lote 3. O PR #89 integrou a capacidade inicial; um P2 tardio revelou uma corrida de snapshot e a recuperação no PR #92 passou Foundation `31453781013`, Container Smoke `31453781061`, 109 arquivos/447 testes e auditoria independente sem P0/P1/P2 ativos. O merge de recuperação `7418fff6e30f6107313a632284266caf04e8b33a` passou Documentation `31454187271` e staging `31454187273` com `PASS/DEPLOYED` no SHA exato. A persistência do alerta agora revalida `BLOCKED_RISK` e a versão da missão sob lock transacional antes do insert.

O Lot 4-A concluiu o primeiro incremento de cobertura total. O PR #95 integrou quatro skills internas de domínio com `READY_AGENT`, provider interno governado, evidência semântica obrigatória, fallback para `RECOVERING`, persistência pelo `MissionRuntime` e preservação do HDF. O HEAD técnico `e3e70fbbd2c940ee66a8de9c418e0e8d32a4c668` passou Foundation `31461319193` e Container Smoke `31461319181`, com 112 arquivos/459 testes; o merge squash `67d20e24fd136f6334bfd835cb775426f6514403` possui a mesma tree `def5edf77be8bdc32939d2b4bd5b1fcbcca649ec` do candidato validado. O runtime passa a 12 skills executáveis e 4 documentais.

O Lot 4-B integrou `MCF-EVALUATE-AGENTS` como capacidade `READY_AGENT` governada. O candidato `279a4b1e3b8e8b5b948d95481ec85e5223322278` preserva o contrato canônico Beatriz/Tiago → Emily, mantém `READ_ONLY` via `inspect-agent-evaluation`, exige `test_cases`, `scores` e `regressions` e persiste evidência pelo `MissionRuntime`. Foundation `31463802089`, Container Smoke `31463802100`, 115 arquivos/470 testes e auditoria independente passaram no HEAD exato; o merge `741abdad70432b9232256b7204156d96770c9b4d` compartilha a tree `a0e676152c7070381480b9c5422f103887987eab` do candidato. O runtime passa a 13 skills executáveis e 3 documentais.

O Lot 4-C integrou `MCF-SECURITY-REVIEW` como capacidade `READY_AGENT` Classe C governada. O candidato final `323b69af4616cda0e4f9b1e47516a9cde37a3f0d` preserva `SENSITIVE_CONTROLLED`, exige `sensitiveAuthorization=true`, restringe a execução a `internal / inspect-security-review / mcf-agent-runtime`, impede downgrade do risco e valida `threats`, `controls` e `residual_risk` estruturado antes do handoff para Emily. Foundation `31471615150`, Container Smoke `31471615302`, 118 arquivos/485 testes, Manifest Audit R3 `31471688783`, reviews especialistas e auditoria independente de Emily passaram no HEAD exato. O merge squash `08c3e19e1b6408a164628e1bfaa5968e2070ccf0` possui a mesma tree `70f07a2c936ce166555e52b36366c810919f5b8c` do candidato. O runtime passa a 14 skills executáveis e 2 documentais.

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

O Lote 3 e os Lots 4-A, 4-B e 4-C estão **integrados**. Permanecem duas skills documentais — `MCF-DEBUG-INCIDENT` e `MCF-CLOSE-PHASE` — separadas por seus próprios boundaries de risco. Pelo registry vigente, a próxima formalização técnica deve tratar `MCF-DEBUG-INCIDENT`; nenhuma Issue Lot 4-D existente é presumida por este documento. Depois da cobertura das 16 skills seguem testes multiagente em contextos separados, auditoria independente final, hardening e preparação da `MCF v1.0.0-RC1`. Gate C continua parcial, produção bloqueada e live staging adapter desabilitado.
