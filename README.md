# MCF — Multiagent Collaboration Framework

O **MCF** coordena agentes de IA por contratos de missão, competências, permissões, evidências, handoffs e recuperação. Possui metodologia de governança e implementações executáveis com limites distintos.

**Comece por este mapa.** Persistência, pausa e retomada estão distribuídas entre continuidade de projeto via GitHub, runtime PostgreSQL, Bubble Executor e Harness V2. Nenhum desses mecanismos deve ser deduzido somente do resumo histórico de outro.

## Primeira leitura de um novo chat

1. Ler as [instruções canônicas de inicialização](project-instructions/MCF-PROJECT-OPERATING-INSTRUCTIONS.md) e o [protocolo operacional](docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md). **LEANDRO** é a autoridade humana; **LÉO**, o agente com autoridade operacional delegada; **MESTRE**, o orquestrador.
2. Identificar a missão existente por Issue/PR/contrato/checkpoint e consultar seu estado live no [GitHub](https://github.com/leon337/multiagent-collaboration-framework). Novo chat não implica nova missão. Sem identidade suficiente, fazer descoberta antes de executar.
3. Escolher o mecanismo na tabela abaixo e ler **contrato + código + testes** correspondentes. Consultar também [skills](skills/registry.yaml), [agentes](docs/agentes/README.md) e [ferramentas/permissões](docs/tools/MCF-AGENT-TOOL-MATRIX.md).
4. Validar checkpoint, fontes autoritativas, metodologia, gates pendentes e estado live. Selecionar `FAST_RESUME`, `RECONCILE` ou `RECOVER_MCF_PROJECT` conforme a política de continuidade.
5. Verificar as capacidades reais do executor e continuar da próxima ação autorizada. Registrar evidências e persistir o próximo checkpoint na fonte durável; arquivo apenas no sandbox não comprova transferência.

O [mapa de estado](docs/MCF-CURRENT-STATE.md) e o [índice documental completo](docs/README.md) fornecem contexto, mas seus snapshots não substituem código nem GitHub/provider live. Ausência de resultados em busca textual não prova ausência de capacidade: procurar também em `project-instructions/`, `apps/`, `ops/`, `tests/`, `context/` e `.github/workflows/`.

## Persistência, pausa e retomada: escolha o mecanismo

| Necessidade / gatilho | Fonte direta | Implementação e evidência | Limite a preservar |
| --- | --- | --- | --- |
| Pausa planejada, troca de chat/ambiente, decisão ou mudança material | [Decisão Q17 de continuidade](docs/proposals/MCF-V1.1-DECISION-LEDGER-001.md) e [checkpoint CAF](templates/CAF-FLOW-CHECKPOINT.yaml) | [ContinuityRecoveryService](apps/rede-social-agentes/apps/server/src/mcf-runtime/continuity-recovery.service.ts), [testes](apps/rede-social-agentes/apps/server/src/mcf-runtime/continuity-recovery.service.test.ts), [qualificação Q19](apps/rede-social-agentes/apps/server/src/qualification/mcf-v11-q19.e2e.test.ts) | Policy implementada constrói/classifica checkpoints; recebe SHA e verificações do chamador. Não faz fetch/push GitHub nem suspende worker por si só. Q17 preserva o estado histórico da decisão, não a ausência atual de código. |
| Recuperar a missão em outro chat/sandbox | [Contrato Bubble Executor](docs/runtime/MCF-BUBBLE-EXECUTOR-CONTRACT.md), [contrato versionado de exemplo](context/missions/mcf-memory-live-next-stable.json) | [CLI](ops/bubble-executor/bubble_executor.py), [teste com dois diretórios novos](tests/bubble-executor/test_bubble_executor_cli_integration.py), [workflow](.github/workflows/mcf-bubble-executor-validation.yml) | Importa contrato e emite checkpoint local com digest. O orquestrador precisa obter/persistir a fonte GitHub/MCF. O teste usa o contrato do checkout, não prova transporte GitHub live nem restauração de toda execução. |
| Ordem humana de interrupção e retomada explícita | [Instruções §15.1](project-instructions/MCF-PROJECT-OPERATING-INSTRUCTIONS.md), [Human Delegation Firewall](project-instructions/MCF-HUMAN-DELEGATION-FIREWALL.md), [testes operacionais de GUI](project-instructions/MCF-VISIBLE-EXECUTION-GUI-TESTS.md) | [Gate de entrada do chat](apps/rede-social-agentes/apps/server/src/mcf-runtime/chat-runtime-bridge.service.ts), [testes](apps/rede-social-agentes/apps/server/src/mcf-runtime/chat-runtime-bridge.service.test.ts) | `HUMANO NO CONTROLE` impede novas ações e exige checkpoint/retomada humana. O gate pré-bootstrap não é um endpoint geral de suspensão persistente de missão em curso. |
| Criar missão, executar fase, registrar evidência e consultar estado durável | [Especificação](docs/runtime/MCF-RUNTIME-SPECIFICATION.md), [API](docs/runtime/MCF-RUNTIME-API.md) | [MissionRuntimeService](apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime.service.ts), [repositório PostgreSQL](apps/rede-social-agentes/apps/server/src/mcf-runtime/postgres-mcf-runtime.repository.ts), [integração](apps/rede-social-agentes/apps/server/src/mcf-runtime/postgres-mcf-runtime.repository.integration.test.ts) | Estado/ledger PostgreSQL são diferentes dos arquivos GitHub. Ler uma Issue não instancia uma missão nesse runtime. |
| Fase aguarda resultado externo; GitHub Actions entrega resultado | [Recuperação CAF](docs/runtime/MCF-RUNTIME-RECOVERY.md), [API de callback](docs/runtime/MCF-RUNTIME-API.md) | [Workflow de integração](.github/workflows/mcf-runtime-integration.yml), método `acceptCiCallback` no [runtime](apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime.service.ts) | `workflow_dispatch` / `repository_dispatch: mcf-run-tests` levam IDs da missão/fase e SHA; callback autenticado registra resultado. Sucesso retoma estado de execução; falha vai a recuperação. Requer configuração e runtime acessível; não é retomada automática de qualquer pausa humana. |
| Submissão termina e devolve controle à missão-pai | [DEC-059](docs/decisions/MCF-DEC-059-HIERARQUIA-PERSISTENTE-E-RETORNO-A-MISSAO-PAI.md) | [Testes da hierarquia](apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-hierarchy.integration.test.ts) e [pilha](apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-hierarchy-stack.integration.test.ts) | Filho pendente suspende avanço normal do pai; checkpoint capturado sob lock é restaurado somente quando seguro. Ver [migrations de hierarquia](apps/rede-social-agentes/packages/database/migrations/0016_mcf_hierarchy_gate_hardening.sql). |
| Interromper/retomar sessão de agente e recuperar journal em outro armazenamento | [PRF do protótipo Harness V2](artifacts/phases/PHASE-02-MCF-HARNESS-V2-PROTOTYPE/) | [Runtime SQLite/eventos](ops/multiagent-runtime-v2/runtime.py), [export/import e plano de retomada](ops/multiagent-runtime-v2/recovery_bundle.py), [testes de sessão](tests/multiagent-runtime-v2/test_sessions.py), [testes de recovery](tests/multiagent-runtime-v2/test_recovery_bundle.py) | `checkpoint_session`, `interrupt_session`, `resume_session` preservam estado de sessão e mailbox. É implementação do protótipo local; não confundir com ativação no servidor PostgreSQL ou em produção. |

### Gatilhos de checkpoint implementados

A lista exata de `ContinuityRecoveryService.shouldCreateCheckpoint` é:

- `MATERIAL_HUMAN_DECISION` — decisão humana material;
- `PHASE_OR_MISSION_BOUNDARY` — mudança de fase ou limite de missão;
- `MATERIAL_MISSION_CONTRACT_CHANGE` — mudança material do contrato;
- `MATERIAL_STATE_CHANGE` — mudança material de estado;
- `IMPORTANT_HANDOFF` — passagem de bastão relevante;
- `HUMAN_GATE_MATERIAL_CHANGE` — mudança material de gate humano;
- `PLANNED_PAUSE` — pausa planejada;
- `PLANNED_CHAT_TRANSFER` — transferência planejada de chat;
- `PLANNED_EXECUTION_ENVIRONMENT_TRANSFER` — transferência de ambiente;
- `MATERIAL_CONTEXT_LOSS_RISK` — risco material de perda de contexto.

Esses eventos são reconhecidos pela policy; a existência da lista não comprova que toda interface os emita automaticamente. O checkpoint é orientado a eventos materiais, não a cada mensagem ou principalmente a um temporizador.

### Quando persistir no GitHub

A [decisão Q2 — LOCAL_FIRST_REMOTE_CHECKPOINTED](docs/proposals/MCF-V1.1-DISCOVERY-CHECKPOINT-002.md) registra estes limites para checkpoint remoto: `PHASE_OR_SUBMISSION_COMPLETED`, `LONG_PAUSE_OR_SESSION_END`, `BEFORE_HUMAN_GATE`, `BEFORE_INDEPENDENT_REVIEW`, `MATERIAL_VALIDATION_PASS`, `BEFORE_HIGH_RISK_BOUNDARY`, `AGENT_HANDOFF` e `INTEGRATION_CANDIDATE`.

São critérios operacionais documentados, distintos dos eventos reconhecidos pela policy acima. **Editar ≠ commit ≠ push ≠ PR**: commit local não prova persistência remota; push confirmado estabelece checkpoint remoto; PR serve à revisão/integração. Q2 registra trabalho local reversível de baixo risco com dívida de checkpoint quando o remoto está indisponível, mas bloqueio em limite material/governado. Isso não autoriza ignorar gates nem comprova um publicador automático implementado.

### Como a continuidade via GitHub é verificada

O checkpoint reúne projeto/missão, fase, objetivo/estado, referência de metodologia, contrato, repositório/branch/SHA, decisões, evidências, achados, gates, autorizações vigentes, próxima ação, responsável e instruções de retomada. O **Resume Card** é uma visão derivada; o checkpoint canônico prevalece.

| Condição na policy | Resultado |
| --- | --- |
| SHA remoto declarado disponível e nenhum estado local sem checkpoint | `TRANSFERABLE` ao construir o checkpoint; a existência remota precisa ser verificada pelo chamador. |
| Trabalho apenas local ou sem SHA de checkpoint | `BLOCKED_LOCAL_ONLY_STATE`; não declarar transferido. |
| Checkpoint transferível e íntegro, fontes resolvidas, metodologia válida e repositório/branch/SHA iguais ao live | `FAST_RESUME`. |
| Mesmo repositório, pré-condições válidas e divergência de branch/SHA explicável | `RECONCILE`. |
| Checkpoint/live ausente, integridade/metodologia/fonte inválida, outro repositório ou divergência inexplicável | `RECOVER_MCF_PROJECT`. |

Uma rota de retomada não aprova gates pendentes. A sequência operacional é recuperar os registros, verificar estado live, reconciliar e só então continuar a ação autorizada. Sem confirmação de gravação remota, um checkpoint local não é prova de persistência no GitHub.

### Comandos humanos e esperas não são equivalentes

- `PAUSAR PROJETO MCF` e `RETOMAR PROJETO MCF` aparecem nos [comandos auxiliares da DEC-007](docs/decisions/MCF-DEC-007-PROTOCOLO-DE-INICIALIZACAO-DE-NOVO-CHAT-E-PROJETO.md). Esse documento é histórico: sua composição antiga e identidade não substituem as instruções atuais; os comandos não provam um parser universal no runtime.
- `HUMANO NO CONTROLE`, como instrução independente de LEANDRO, suspende novas ações, preserva efeitos concluídos e interrompe uma operação em curso no próximo ponto seguro. Registrar checkpoint e aguardar retomada explícita de LEANDRO; menção da frase em documentação não dispara o gate.
- `WAITING_EXTERNAL` / `WAITING_EVIDENCE` expressam espera por evidência; `RECOVERING` expressa recuperação. O [CAF](docs/runtime/MCF-RUNTIME-RECOVERY.md) explica callbacks idempotentes, concorrência e preservação da identidade da missão.
- `PAUSED_TRANSFERABLE` é uma classificação do contrato conceitual Q17; não presumir que seja um valor do enum de estados do servidor. Interrupção de sessão do Harness V2, pausa do reporter de voz e gate humano têm escopos diferentes.

## Mapa dos demais componentes do runtime

| Componente | Contrato / fonte de verdade | Código, teste ou operação |
| --- | --- | --- |
| Anatomia, seleção e handoff da missão | [Protocolo](docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md), [template](templates/MCF-UNIFIED-MISSION.yaml) | [Runtime](apps/rede-social-agentes/apps/server/src/mcf-runtime/), [PRFs](artifacts/phases/) |
| Contexto de projeto e admissão v1.1 | [Schemas](schemas/), [artefatos de projeto](apps/rede-social-agentes/apps/server/src/project-artifacts/) | [Context guard](apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-v11-context.guard.ts), [testes](apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-v11-context.guard.test.ts) |
| Skills e permissionamento | [Registry](skills/registry.yaml), [permissões](docs/tools/MCF-PLUGIN-PERMISSIONS.yaml), [HDF](project-instructions/MCF-HUMAN-DELEGATION-FIREWALL.md) | [PermissionEngine](apps/rede-social-agentes/apps/server/src/mcf-runtime/permission-engine.ts), [SkillExecutor](apps/rede-social-agentes/apps/server/src/mcf-runtime/skill-executor.ts) |
| Ações externas, idempotência e evidências | [Recuperação](docs/runtime/MCF-RUNTIME-RECOVERY.md) | [Dispatcher](apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-dispatcher.ts), [EvidenceValidator](apps/rede-social-agentes/apps/server/src/mcf-runtime/evidence-validator.ts) |
| Observabilidade e fechamento | [Observabilidade](docs/runtime/MCF-RUNTIME-OBSERVABILITY.md), [PRF](templates/phase-traceability/) | [Completion policy](apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-completion-policy.ts) |
| Controle de missão via GPT Action | [Contrato staging](docs/integrations/MCF-MISSION-CONTROL-GPT-ACTION.md), [OpenAPI](docs/integrations/MCF-MISSION-CONTROL-GPT-ACTION.openapi.yaml) | [MissionControlService](apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-control.service.ts); não confundir com todo o produto Mission Control proposto. |
| Bubble, DSH e executores | [Bubble](docs/runtime/MCF-BUBBLE-EXECUTOR-CONTRACT.md), [DSH Agent Teams](docs/runtime/MCF-DEEPSEEK-HARNESS-AGENT-TEAMS-EXECUTOR.md), [canal MESTRE–Ox](docs/integrations/MCF-HARNESS-MESTRE-OX-CHANNEL.md) | [Executores](ops/bubble-executor/), [evidência DSH de 2026-10-09](docs/integrations/evidence/MCF-HARNESS-MESTRE-OX-PARALLEL-20261009.md) |
| Dual Browser, Agent Bridge e sucessão visual | [Discovery obrigatório](docs/protocols/MCF-PROTOCOLO-DUAL-BROWSER-RUNTIME-DISCOVERY.md), [manual UI](docs/operations/MCF-UI-OPERATING-MANUAL.md), [sucessão cross-chat](docs/protocols/MCF-PROTOCOLO-SUCESSAO-CROSS-CHAT-E-CONTROLE-DE-JANELAS.md) | [Contrato semântico UI](docs/contracts/MCF-UI-SEMANTIC-CONTRACT.json); discovery live antes de operar. |
| Context Fabric, Ledger e Cloud | [Roadmap de integração](docs/MCF-ECOSYSTEM-INTEGRATION-ROADMAP.html), [gates de promoção](docs/integrations/MCF-ECOSYSTEM-PROMOTION-GATES-20260828.md) | [Evidências](docs/integrations/evidence/); recuperar contexto não ativa provider nem concede escrita. |
| CI, staging e produção | [Workflows](.github/workflows/), [autorização de produção](apps/rede-social-agentes/apps/server/src/mcf-runtime/production-authorization.service.ts) | [Staging](.github/workflows/mcf-runtime-staging-deploy.yml), [promoção governada](.github/workflows/mcf-runtime-production-deploy.yml); autorização + gate + SHA exato. |
| Evolução, releases e histórico | [NextGen](docs/MCF-NEXTGEN-RECONCILIATION-ROADMAP.md), [decisões](docs/decisions/), [releases](docs/releases/), [changelog](CHANGELOG.md) | [GitHub live](https://github.com/leon337/multiagent-collaboration-framework); proposta, merge, release e produção são estados distintos. |

Existem **29 agentes nomeados**, selecionados por competência. Isso descreve contratos/papéis, não prova 29 modelos independentes executados. LEANDRO não entra nessa contagem. Crédito de agente exige execução atribuível; o [experimento telefone-sem-fio](experimentos/telefone-sem-fio-001/RESULTADO_FINAL.md) preserva seus limites metodológicos.

## Regras de leitura e verificação

- `CURRENT_IMPLEMENTED`, `EXPERIMENTAL`, `PLANNED`, `UNDER_STUDY`, `HISTORICAL` e `SUPERSEDED` devem ser usados conforme a evidência do componente, não por associação com o nome MCF.
- Código/teste presente não prova configuração, execução recente, conexão externa ou deploy. Resultados de testes abaixo, quando citados em documentos, pertencem ao SHA e ambiente registrados.
- Antes de afirmar estado atual de branch, PR, Issue, workflow, release, `latest` ou produção, consultar GitHub/provider live. Nunca inferir produção a partir de `main` nem autorização de produção a partir de CI verde.
- O [README do servidor](docs/runtime/README.md) contém snapshots do RUNTIME-006; suas contagens e descrições históricas não inventariam todos os executores posteriores. Para skills, consultar o [registry](skills/registry.yaml) e o código do executor pertinente.

## Diagnóstico da navegação corrigida

A consulta anterior seguiu README → resumo do runtime → mapa de estado e generalizou a ressalva do gate pré-bootstrap para pausa/retomada em geral. Não leu a policy de continuidade, Q17/Q19, Bubble Executor nem Harness V2. Buscas sem resultados também não foram complementadas por uma busca na árvore completa.

O README não oferecia links diretos para esses mecanismos, e documentos de snapshots distintos misturavam capacidades implementadas, propostas e estados históricos. O mapa acima corrige esse caminho: cada mecanismo tem entrada direta, implementação, evidência e limite. A limitação do gate pré-bootstrap continua verdadeira no seu escopo; ela não invalida os demais mecanismos de continuidade.

<details>
<summary>Referências e snapshots do README anterior — contexto histórico, não estado live</summary>

Os trechos abaixo preservam o histórico documental. Em divergência, consultar as fontes diretas do mapa acima e o estado live. Contagens, status de PR/Issue e versões de transporte citados aqui podem ter sido superados.

## O que existe hoje

### `CURRENT_IMPLEMENTED`

O MCF possui runtime executável, não apenas metodologia documental.

Código principal:

```text
apps/rede-social-agentes/apps/server/src/mcf-runtime/
```

A aplicação hospedeira está em [`apps/rede-social-agentes/`](apps/rede-social-agentes/) e usa Node.js/pnpm, API, web, worker, PostgreSQL e workflows de validação/deploy.

Fluxo técnico simplificado:

```text
objetivo / missão
      ↓
MissionRuntime + persistência
      ↓
Skill registry + planner
      ↓
Human Delegation Firewall / Permission Engine
      ↓
Skill Executor / External Action Dispatcher
      ↓
adapter interno ou externo
      ↓
Evidence Validator + receipts + event ledger
      ↓
handoff / CAF / gate / checkpoint
```

Capacidades comprovadas incluem:

- missões, fases, eventos, receipts e handoffs persistentes;
- hierarquia missão-pai/submissão;
- Human Delegation Firewall e perfis de permissão;
- dispatcher de ações externas e adapters com evidência verificável;
- **18 skills executáveis no servidor atual**; esta branch candidata adiciona **7 Skills web EXPERIMENTAL/orchestration-ready** (25 registradas no total), sem alegar adapter web no runtime;
- leitura de revisão de código e CI;
- escrita GitHub reversível e gates operacionais governados;
- staging com verificação de SHA, readiness/version e recovery por redeploy;
- observabilidade de missões bloqueadas;
- Production Readiness automatizado;
- produção pública materializada;
- promoção de produção governada por autorização persistida + gate operacional + SHA exato;
- `main` protegida e produção desacoplada de alterações comuns no branch.

Fontes: [`docs/runtime/`](docs/runtime/), [`skills/registry.yaml`](skills/registry.yaml), [`artifacts/phases/`](artifacts/phases/) e [workflows](.github/workflows/).

## Estado reconciliado

Snapshot documental reconciliado em 2026-08-20:

```yaml
current_reconciliation:
  main: 1a1e57208991db87bb3bac9267e29706caae7243
  main_protected: true

durable_release_identity:
  stable_v1_0_0: v1.0.0@7f741e10d0e745a90c732e084400b11e3f5e6794
  stable_v1_1_0: v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
  latest_release_metadata: READ_GITHUB_LIVE

production_snapshot:
  rsa_api_free:
    auto_deploy: off
    reported_commit: 439da7b6479718f6545144954937b8c4358d7c46
  rsa_web_free:
    auto_deploy: off
    reported_commit: 439da7b6479718f6545144954937b8c4358d7c46
  promotion_model: GOVERNED_EXACT_SHA
```

Esse snapshot é evidência datada, não uma promessa de valores futuros. Sempre releia o estado live para decisões operacionais.

O tag `v1.1.0` resolve para o SHA exato `5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`. A identidade de release não deve ser confundida com o HEAD atual de `main` nem com o commit atualmente executado pelo provider.

## Governança de produção

Produção **não acompanha mais `main` automaticamente**.

Fluxo atual:

```text
branch
  ↓
PR + CI + gates aplicáveis
  ↓
merge em main
  ↓
nenhum deploy automático

necessidade de produção
  ↓
autorização canônica de LEANDRO para boundary/SHA
  +
gate operacional persistido de LÉO
  +
SHA exato
  ↓
workflow governado
  ↓
provider + health/readiness + evidência
```

Invariantes centrais:

- `HUMAN_AUTHORITY != HUMAN_OPERATION`;
- LEANDRO não é executor técnico padrão;
- `MERGE_OR_MAIN_UPDATE != PRODUCTION_AUTHORIZATION`;
- `MAIN_UPDATE != PRODUCTION_DEPLOY`;
- `CI_GREEN != PRODUCTION_AUTHORIZATION`;
- `DISPATCH_INPUT != AUTHORIZATION_PROOF`;
- `EXACT_SHA_BINDING = REQUIRED`.

A remediação foi integrada pelo PR #145 e resolveu a Issue #140. O PR #143 foi encerrado sem merge por ter sido substituído pela implementação limpa baseada no `main` atual.

Arquivos principais:

- [`.github/workflows/mcf-runtime-production-deploy.yml`](.github/workflows/mcf-runtime-production-deploy.yml)
- [`render.yaml`](render.yaml)
- [`production-authorization.service.ts`](apps/rede-social-agentes/apps/server/src/mcf-runtime/production-authorization.service.ts)
- [`render-production-promotion.adapter.ts`](apps/rede-social-agentes/apps/server/src/mcf-runtime/render-production-promotion.adapter.ts)

## Governança e agentes

- **LEANDRO** — autoridade humana final; não é agente do MCF.
- **LÉO** — agente com autoridade operacional delegada para continuidade e gates internos dentro do boundary vigente.
- **MESTRE** — orquestrador responsável pela condução da missão e exposição do fluxo.
- agentes especialistas — ativados conforme competência, risco e boundary.

Existem **29 agentes nomeados**, selecionados por competência. Essa composição descreve papéis/contratos do MCF; não prova 29 modelos cognitivos independentes em execução simultânea. LEANDRO não entra nessa contagem.

Protocolo operacional vigente:
[`docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`](docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md)

Princípios centrais:

- evidência antes de declaração de sucesso;
- ESEV para execução visível e verificável;
- CAF para falhas recuperáveis;
- PRF para fases Classe B/C;
- gates/reviews vinculados ao estado e SHA aplicável;
- LEANDRO não é operador técnico rotineiro;
- ação externa irreversível ou publicação relevante exige autoridade compatível com o boundary.

## Skills

O registro canônico está em [`skills/registry.yaml`](skills/registry.yaml).

```yaml
registered_in_candidate_branch: 25
server_runtime_executable: 18
experimental_web_orchestration_ready: 7
runtime_adapter_pending: 7
```

Skills atuais:

`MCF-START-MISSION`, `MCF-SELECT-AGENTS`, `MCF-RECOVER-CONTEXT`, `MCF-DEFINE-PRODUCT`, `MCF-DESIGN-EXPERIENCE`, `MCF-DESIGN-ARCHITECTURE`, `MCF-IMPLEMENT-CHANGE`, `MCF-REVIEW-CODE`, `MCF-RUN-TESTS`, `MCF-GIT-PR-RELEASE`, `MCF-DEPLOY-VALIDATE`, `MCF-TRACE-MISSION`, `MCF-EVALUATE-AGENTS`, `MCF-SECURITY-REVIEW`, `MCF-DEBUG-INCIDENT`, `MCF-CLOSE-PHASE`, `MCF-AUDIT-VISUAL-DESKTOP` e `MCF-EXECUTE-LOCAL-TEAM` são executáveis no servidor atual. A branch candidata acrescenta `MCF-WEB-SEARCH`, `MCF-WEB-FETCH`, `MCF-WEB-MAP`, `MCF-WEB-COLLECT`, `MCF-WEB-RESEARCH`, `MCF-WEB-INTERACT` e `MCF-WEB-MONITOR` como contratos EXPERIMENTAL/orchestration-ready; o adapter server-side permanece pendente.

## Releases e marcos

| Marco                                | Classificação                        | Estado                  |
| ------------------------------------ | ------------------------------------ | ----------------------- |
| Runtime persistente / evidence model | `CURRENT_IMPLEMENTED`                | integrado               |
| Gate C — provider write              | `HISTORICAL` + capacidade preservada | concluído               |
| Gate D — staging/deploy              | `HISTORICAL` + capacidade preservada | concluído               |
| Gate E                               | `HISTORICAL`                         | concluído               |
| `v1.0.0-RC1`                         | `HISTORICAL`                         | prerelease preservada   |
| `v1.0.0-RC2`                         | `HISTORICAL`                         | prerelease preservada   |
| `v1.0.0-RC3`                         | `HISTORICAL` + identidade preservada | `7f741e10…`             |
| `v1.0.0`                             | identidade durável                   | `7f741e10…`             |
| `v1.1.0`                             | identidade durável                   | `5d79f488…`             |
| governança de produção pós-v1.1      | `CURRENT_IMPLEMENTED`                | #140 resolvida via #145 |

`latest` e metadados mutáveis da página de Release devem ser lidos live.

Detalhes históricos: [`CHANGELOG.md`](CHANGELOG.md), [`docs/releases/`](docs/releases/) e [`docs/decisions/`](docs/decisions/).

## Arquitetura em evolução

O roadmap canônico da missão de reconciliação NextGen está em
[`docs/MCF-NEXTGEN-RECONCILIATION-ROADMAP.md`](docs/MCF-NEXTGEN-RECONCILIATION-ROADMAP.md).
Ele preserva a rodada histórica Q1–Q16, reconcilia o lineage v1.2.0, os contratos/runtime v1/v1.1,
Context Fabric, Cognitive Ledger, Cloud e TriView e entrega uma arquitetura F1.4 e um plano de
implementação **candidatos**. Human Control, autoridade autenticada e o trace GUI/window atuais são
preservados sem serem confundidos com pausa persistente, Decision Inbox ou runtime NextGen. A direção
`GOVERNED_PORTABLE_MULTIAGENT_RUNTIME` permanece a decisão-alvo histórica; a especificação formal
reconciliada ainda exige revisão de LEANDRO, e protótipo/implementação/produção continuam não
autorizados. A política candidata proíbe API de IA paga e qualquer fallback pago.

Documentos do pacote:

- [disposition Q1–Q16](docs/proposals/MCF-NEXTGEN-ROUND-2-DISPOSITION-001.md);
- [arquitetura formal candidata F1.4](docs/architecture/MCF-NEXTGEN-FORMAL-TARGET-ARCHITECTURE-001.md);
- [plano de implementação e checklist](docs/superpowers/plans/2026-08-24-mcf-nextgen-reconciled-implementation-plan.md);
- [PRF Classe C da missão](artifacts/phases/PHASE-NEXTGEN-RECONCILIATION-F14-001/README.md).

O checkpoint [`docs/architecture/ARCHITECTURAL_CHECKPOINT_004.md`](docs/architecture/ARCHITECTURAL_CHECKPOINT_004.md) continua uma arquitetura draft, não canônica e sem autorização de implementação.

ZRCL, Context Fabric, Truth Contracts, Capability Registry, Artifact System e Validation Suite devem ser classificados conforme evidência real do componente; a existência de documentos/propostas não transforma automaticamente esse conjunto em arquitetura canônica implementada.

### Integração do ecossistema — closeout pós-main

O CF-0/CF-1 mínimo foi mergeado no `main` pelo PR #153. O PR #160 integrou Registry/Capsules dos
quatro projetos, recuperação read-only, freshness Git local, Capability Registry e as duas pontes
read-only. O PR #161 concluiu a reconciliação do MCF no
`main@2dc4584c4be186b5cdf131105b810610a9cf620a`, com **7/7 checks** aprovados. O checkpoint de
código testado `e646527f` é ancestral desse estado final.

No checkpoint `e646527f`, o adapter MCF → Cognitive Ledger expõe somente três operações, usa
ingresso próprio e passou pelo `AppModule` real até MCP → Edge/Auth → PostgREST → PostgreSQL, sem
persistir memória, embeddings ou chamadas pagas. A ponte MCF → Cloud também passou pelo cliente
real e pelo processo stdio governado: 3/3 testes E2E, 16 arquivos verificados e cleanup completo.

No mesmo checkpoint, migrations 2x passaram com 30 registros e `pnpm verify` encerrou com exit 0:
38 testes ops + 16 contracts + 5 web + 884 server = **943 aprovados**, 0 falhas e 3 testes
real-Cloud pulados por design. Format, lint, typecheck e build passaram; `pnpm audit` de produção
em nível high reportou 0 vulnerabilidades conhecidas.

O staging marcou o SHA exato do PR #161 como `DEPLOYED` no run `32688775406`; Production Readiness
e Documentation Validation pós-merge passaram. O artefato público da Vercel correspondeu ao
roadmap de `main@2dc4584` pelo SHA-256
`0ac09ccd2ead8fb592a51e9407def07d5edafc6e43dbaee892915a4497728d47`. Essa publicação estática é
uma classe de deployment `Production` da própria Vercel, mas não contém runtime nem API do MCF. O
runtime de produção permaneceu em `439da7b6479718f6545144954937b8c4358d7c46`; o workflow de
produção teve zero runs, não houve acesso VPS/NODE-01 nem SSH, e os workflows RC2/RC3 terminaram
como NOOP preservando suas identidades imutáveis. O PR #151 foi marcado automaticamente como
`MERGED` pela ancestralidade do PR #160.

A sincronização semântica dos providers também terminou em seus targets seguros: Cognitive Ledger
PR #3, merge `a64cfc05f83567f624bbda70288310f56a7264e8`, com CI verde; TriView PR #78, merge
`09a361d761adf1e2e614d23718b84776c365cacc`, com CI verde; e Cloud PR #27, merge
`38cd22e0a814bdf4957edcf5bb30506a4810bda0`. Os jobs remotos Cloud continuam classificados como
`NOT_EXECUTED_EXTERNAL_BILLING_GATE`, com zero steps; os gates locais passaram em 21/21 focados e
396/396 na regressão. Ledger e o provider Cloud local permanecem `DISCONNECTED/INACTIVE` fora do
laboratório descartável; o G2-A remoto permanece
`NOT_AUTHORIZED/DISCONNECTED/UNKNOWN/LIVE_REQUIRED`, e o G2-B,
`NOT_AUTHORIZED/DISCONNECTED/BLOCKED/LIVE_REQUIRED`. Tasks 9/10, VPS/SSH, runtime de produção,
escrita externa, API paga e R7 ampla continuam fechados.

O recovery estrutural final pós-sync passou entre `2026-08-24T04:14:24.044Z` e
`2026-08-24T04:14:24.195Z`: **4/4 projetos `RECOVERED`**, cada um com 17 claims, 6 sources e 0
warnings. Todos preservaram `read_only: true`, `evidence_only: true` e `material_action: false`, com HEAD,
worktree limpa e revisão live exata: Cloud `38cd22e`, Ledger `a64cfc`, TriView `09a361` e MCF
`2dc4584`. A evidência está no
[relatório final 4/4](docs/integrations/evidence/MCF-ECOSYSTEM-RECOVERY-4OF4-20260824.md).

Veja o [roadmap visual](docs/MCF-ECOSYSTEM-INTEGRATION-ROADMAP.html) e o
[handoff factual](docs/integrations/MCF-ECOSYSTEM-PARALLEL-HANDOFF-20260823.md). A auditoria de
2026-08-28, as decisões de não promover diretamente e o checklist atual estão no
[roadmap de promoção](docs/integrations/MCF-ECOSYSTEM-PROMOTION-GATES-20260828.md). Depois dessa
auditoria, Cloud PR #38 sincronizou Capsule/evidência na linha de integração em `420ee7d2`, e
TriView PRs #79/#80 sincronizaram Capsule/documentação na linha de release em `7b2440a6`; ambos
passaram CI, sem promoção para `main`, VPS ou release. Cognitive Ledger PR #4 passou 2/2 checks em
`a3fc0d61`, mas permanece draft/aberta porque seu target possui auto-deploy Render documentado. O
PR #186 publicou esse checkpoint no MCF `main@b2be8eeb`; o recovery final dos quatro SHAs exatos
passou 4/4, read-only, sem warnings ou ação material no próprio recovery. Os Receipts e o resultado controlado
`RECOVERED` da tentativa automática de staging pós-merge via hook Render estão na
[evidência de recovery 2026-08-28](docs/integrations/evidence/MCF-ECOSYSTEM-RECOVERY-4OF4-20260828.md).
Os gates G2-B/VPS, Ledger external-deploy, TriView R7/release e NextGen NX-0 permanecem separados e
não autorizados.

## Mission Control

A Issue #141 permanece em `DISCOVERY_IN_PROGRESS` com `implementation_authorized: false`.

O Mission Control deve permanecer separado do Execution Plane e não pode se tornar segunda fonte de verdade. Discovery/alinhamento não autoriza implementação por si só.

## Governance Evolution v2

O PR #142 permanece `OPEN / DRAFT / NOT_CURRENT / NOT_IMPLEMENTATION_AUTHORIZED`.

Design autorizado de GOV-0/GOV-1 não equivale a autorização de merge, runtime, schema, metodologia, release ou produção.

## Experimentos

### `telefone-sem-fio-001` — `EXPERIMENTAL`

O experimento encontrou evidência positiva de preservação/handoff no protocolo testado. A ressalva metodológica é obrigatória: **os papéis foram executados no mesmo ChatGPT**, portanto o resultado não comprova independência cognitiva real entre agentes.

Fonte: [`experimentos/telefone-sem-fio-001/RESULTADO_FINAL.md`](experimentos/telefone-sem-fio-001/RESULTADO_FINAL.md).

## Mapa rápido

| Pergunta                        | Fonte                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Qual é o estado atual?          | [`docs/MCF-CURRENT-STATE.md`](docs/MCF-CURRENT-STATE.md) + GitHub/provider live                                  |
| Qual é o roadmap NextGen?       | [`docs/MCF-NEXTGEN-RECONCILIATION-ROADMAP.md`](docs/MCF-NEXTGEN-RECONCILIATION-ROADMAP.md)                       |
| Onde está o runtime?            | [`apps/rede-social-agentes/apps/server/src/mcf-runtime/`](apps/rede-social-agentes/apps/server/src/mcf-runtime/) |
| Como o runtime é documentado?   | [`docs/runtime/README.md`](docs/runtime/README.md)                                                               |
| Quais skills existem?           | [`skills/registry.yaml`](skills/registry.yaml)                                                                   |
| Quem são os agentes?            | [`docs/agentes/README.md`](docs/agentes/README.md)                                                               |
| Qual é o protocolo operacional? | [`docs/protocols/`](docs/protocols/)                                                                             |
| Onde estão as decisões?         | [`docs/decisions/`](docs/decisions/)                                                                             |
| Onde está a governança?         | [`docs/governanca/`](docs/governanca/)                                                                           |
| Onde estão PRFs/evidências?     | [`artifacts/phases/`](artifacts/phases/) e [`docs/evidence/`](docs/evidence/)                                    |
| Qual é o histórico de releases? | [`CHANGELOG.md`](CHANGELOG.md) e [`docs/releases/`](docs/releases/)                                              |
| Onde estão experimentos?        | [`experimentos/`](experimentos/)                                                                                 |
| Onde estão propostas?           | [`docs/proposals/`](docs/proposals/) e branches de planning                                                      |
| Qual é o índice completo?       | [`docs/README.md`](docs/README.md)                                                                               |

## Regra de continuidade

Antes de afirmar estado atual de branch, SHA, PR, Issue, workflow, produção, `latest`, Release ou deploy:

1. leia a instrução atual de LEANDRO;
2. consulte GitHub/provider live;
3. use [`docs/MCF-CURRENT-STATE.md`](docs/MCF-CURRENT-STATE.md) como mapa;
4. confira código/testes/workflows/evidências do boundary ativo;
5. nunca inferir produção a partir do HEAD de `main`.

</details>
