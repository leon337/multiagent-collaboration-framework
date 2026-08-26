# PHASE-NEXTGEN-RECONCILIATION-F14-001 — Plano

## Identificação

```yaml
mission_id: MCF-NEXTGEN-RECONCILIATION-F14-001
parent_mission_id: null
phase_id: PHASE-NEXTGEN-RECONCILIATION-F14-001
issue: https://github.com/leon337/multiagent-collaboration-framework/issues/165
project: multiagent-collaboration-framework
base_commit: 42d941b5bc299cb7121175db0367b780d381c93e
branch: docs/mcf-nextgen-reconciliation-f14-plan-20260824
risk_class: C
state: PUBLICATION_CANDIDATE_LOCAL_VALIDATION_PASS_WITH_DISCLOSED_BASELINE_FLAKE
```

## Objetivo verificável

Reconciliar Q1–Q16 contra o MCF atual no lineage v1.2.0 e os quatro repositórios, publicar como candidato o roadmap,
a arquitetura formal F1.4 e o plano de implementação/migração/checklist, integrar o pacote em `main`
por PR regular e parar no gate separado de disposition, arquitetura e autorização de implementação de
LEANDRO.

`v1.2.0@5c7f983` é a release durável preexistente; o baseline `main@42d941b` contém também os deltas
pós-release dos PRs #179 e #181. Esta missão não cria tag, release ou deploy.

## Escopo

- documentação, metadados de continuidade e testes de fixtures/recovery diretamente afetados;
- leitura do MCF atual, da branch histórica NextGen e dos lineages paralelos;
- reconciliação de decisões, ownership, contracts, migração, segurança, custo zero e gates;
- revisão independente, validação local, branch, commit, push, PR, checks e merge regulares;
- PRF desta fase.

## Fora do escopo

- implementar contracts/runtime/Registry v2/graph/router/executor NextGen;
- migration de banco ou mutação no Cognitive Ledger;
- provider/model/API call de IA paga ou fallback pago;
- Cloud remoto, G2-A/G2-B, SSH, VPS ou NODE-01;
- TriView command, release, deploy ou produção;
- aprovar a F1.4 ou escolher em nome de LEANDRO o primeiro boundary de código.

## Autorizações

- ler os quatro repositórios, seus branches e estado público GitHub;
- editar somente documentação, metadados de continuidade e characterization tests afetados no MCF;
- executar validações locais read-only ou em banco local descartável;
- criar branch, commit, push, PR e merge GitHub regulares para este pacote documental;
- corrigir findings de revisão dentro do mesmo escopo.

## Proibições

- implementar ou ativar runtime/contracts/providers NextGen;
- executar Brainbase ou qualquer rota de IA billable, trial ou com fallback pago;
- mutar Cognitive Ledger/Supabase live, Cloud remoto, VPS, NODE-01 ou TriView;
- fazer deploy/release/produção ou usar memória real/dado privado;
- atribuir autoria, auditoria, gate ou contribuição a agente sem task run/origin Receipt verificável;
- persistir segredo, token, credencial ou log sensível.

## Critérios de aceite

- [x] lineage histórico Q1–Q16 preservado e disposition candidata produzida;
- [x] arquitetura F1.4 candidata, ownership e boundaries definidos;
- [x] roadmap e plano/checklist de implementação/migração/rollback produzidos;
- [x] custo variável de API de IA fixado em zero, sem paid fallback;
- [x] lacuna de origem da execução cognitiva modelada sem crédito simulado;
- [x] PRF mínimo da Classe C criado com evidência factual;
- [ ] revisão independente terminal sem achado material aberto;
- [x] validação final executada sobre a árvore candidata exata, com flake canônico do baseline divulgado;
- [ ] PR regular com checks obrigatórios verdes e merge em `main`;
- [ ] retorno a LEANDRO sem iniciar implementação NextGen.

## Riscos e restrições

| Risco                                                     | Impacto                                  | Controle                                                                                                |
| --------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| GitHub/lineage ficar stale                                | roadmap contradiz estado live            | fetch, Issues/PRs live e rebase antes do freeze                                                         |
| sobrepor trabalho paralelo ou branch histórico do PR #169 | perda/conflito de trabalho               | diff audit, worktree isolada e rebase sem descartar mudanças                                            |
| PR #170 avançar ou mergear durante o freeze               | baseline/state ficar stale               | reler GitHub, fetch/rebase se `main` avançar e atualizar evidence antes do commit                       |
| draft PR #174 avançar/mergear                             | contrato ou writer de continuidade duplo | rebase + equivalence/disposition antes de NX-0; um owner/writer por estado                              |
| PRs #175/#179/#181 serem promovidos além da evidência     | capability NextGen fictícia              | separar primitive/trace/rota atual de pause/runtime/Authority Envelope futuros                          |
| drafts #176/#177/#180/#182 serem tratados como canônicos  | baseline ou autorização falsos           | registrar como inputs fora de `main`; checks/field evidence não autorizam merge/runtime/VPS             |
| Human Control confiar em nome ou sumir no restart         | autoridade spoofada ou ação após pausa   | conta reservada autenticada, provenance server-side, estado atômico/safe-point e negative tests         |
| GUI autorizada ou trace virar autoridade/23º contrato     | boundary e catálogo duplicados           | UI != authority; reutilizar trace; promoção pública reabre F1.4 e contagem 17/22                        |
| branch Cloud Hermes ser tratado como canônico             | executor/remoto falso ou gate contornado | preservar como input não default; nenhum uso/provider/VPS/SSH                                           |
| atribuir execução a agentes sem prova                     | falsa realidade operacional              | identidade managed não recebe crédito sem task run/origin Receipt; registrar `NOT_EXECUTED_NO_TASK_RUN` |
| documentação autorizar código por inferência              | runtime/provider ativado sem gate        | status `PROPOSED/NOT_AUTHORIZED` e gate humano separado                                                 |
| API gratuita virar cobrança                               | violar custo zero                        | unknown/stale/paid bloqueados, sem fallback e sem provider congelado nesta fase                         |

## Executores realmente selecionados e justificativa

| Executor/função                                    | Por que foi selecionado                         | Entrega                                      | Estado factual                                     |
| -------------------------------------------------- | ----------------------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| contexto raiz ChatGPT/Codex                        | coordenar a missão autorizada e manter o escopo | edições, validação e publicação              | `HOST_MEDIATED_UNVERIFIED / NO_MCF_IDENTITY_CLAIM` |
| `/root/review_cognitive_boundary`                  | revisar boundary de execução cognitiva          | finding/contrato de Request, Receipt e gates | `EXECUTED_PLATFORM_TASK / NO_NAMED_AGENT_CREDIT`   |
| `/root/review_capsule_state`                       | revisar migração Capsule e estados              | finding de sidecar/pointer/enum              | `EXECUTED_PLATFORM_TASK / NO_NAMED_AGENT_CREDIT`   |
| `/root/review_contract_audits`                     | revisar inventário de schemas e audits          | finding de cobertura 1:1 e segurança         | `EXECUTED_PLATFORM_TASK / NO_NAMED_AGENT_CREDIT`   |
| `/root/nx0_task_plan`                              | decompor NX-0 em TDD executável                 | plano de sete tasks                          | `EXECUTED_PLATFORM_TASK / NO_NAMED_AGENT_CREDIT`   |
| `/root/prf_gap_review`, `/root/postfix_prf_review` | verificar requisitos PRF/DEC-050/051            | findings de rastreabilidade e variance       | `EXECUTED_PLATFORM_TASK / NO_NAMED_AGENT_CREDIT`   |
| `/root/postfix_arch_review`                        | revisar coerência da arquitetura e do plano     | findings pós-correção                        | `EXECUTED_PLATFORM_TASK / NO_NAMED_AGENT_CREDIT`   |
| `/root/terminal_arch_recheck`                      | rever o fechamento dos findings arquiteturais   | veredicto terminal temático                  | `EXECUTED_PLATFORM_TASK / NO_NAMED_AGENT_CREDIT`   |
| `/root/terminal_prf_recheck`                       | rever PRF, autoria, variance e estado live      | veredicto terminal temático                  | `EXECUTED_PLATFORM_TASK / NO_NAMED_AGENT_CREDIT`   |
| `/root/terminal_consistency_review`                | rever consistência cruzada da árvore            | veredicto terminal temático                  | `EXECUTED_PLATFORM_TASK / NO_NAMED_AGENT_CREDIT`   |
| `/root/review_pr175`                               | auditar delta v1.2 Human Control/GUI            | fatos e gaps do PR #175                      | `EXECUTED_PLATFORM_TASK / NO_NAMED_AGENT_CREDIT`   |
| `/root/review_pr179`, `/root/review_pr181`         | auditar deltas pós-release                      | mensagens parciais + inspeção raiz posterior | `ERRORED_USAGE_LIMIT / NO_VERDICT_CLAIMED`         |
| `/root/audit_contracts`                            | rever consistência formal 17/22                 | findings resolvíveis de refs/trust/pause     | `EXECUTED_PLATFORM_TASK / FINDINGS_CORRECTED`      |
| `/root/audit_prf`                                  | rever rastreabilidade após rebase               | gaps PRF por arquivo                         | `EXECUTED_PLATFORM_TASK / FINDINGS_CORRECTED`      |
| `/root/audit_nextgen_docs`                         | rever deltas v1.2 em cinco documentos           | findings parciais úteis antes do limite      | `PARTIAL_THEN_USAGE_LIMIT / NO_TERMINAL_VERDICT`   |
| `codex review --uncommitted` read-only             | revisão independente do diff completo           | inspeção ampla sem veredicto terminal        | `INTERRUPTED_USAGE_LIMIT / NO_VERDICT_CLAIMED`     |
| três tasks terminais de contratos/docs/PRF         | tentar revisão temática final em paralelo       | nenhuma entrega por limite da plataforma     | `ERRORED_USAGE_LIMIT / NO_VERDICT_CLAIMED`         |

Os paths acima são identificadores de tarefas da plataforma nesta missão; seus achados sanitizados
foram consolidados no REPORT/DECISIONS e nos documentos de domínio. Eles não são identidades do
runtime MCF nem recebem crédito como Sofia, Emily, Léo ou qualquer outro agente oficial.

## Controles oficiais não executados e variance

Os gatilhos da Classe C tornariam Léo, Emily, Augusto e Júlia obrigatórios; a retomada/múltiplas fontes,
memória/roteamento e segurança também acionariam Miriam, Beatriz e Ricardo. Nenhum deles foi
selecionado como participante porque não existe nesta sessão um executor cognitivo zero-cost com
task run/origin Receipt que permita creditá-los sem simulação.

```yaml
process_variance: MCF_PROCESS_VARIANCE_NAMED_CONTROLS_AND_ESEV_HANDOFFS_NOT_EXECUTED
waiver_accepted: false
named_agents_credited: []
effect:
  - DO_NOT_CLAIM_DEC_050_051_PROCEDURAL_CONFORMANCE
  - DO_NOT_CLAIM_ESEV_OR_DEC_050_HANDOFF_CHAIN
  - DO_NOT_CLAIM_EMILY_AUDIT_OR_LEO_GATE
  - DO_NOT_MARK_PHASE_ENTREGUE
allowed_progress:
  - PUBLISH_AUTHORIZED_PLANNING_CANDIDATE_BY_REGULAR_GITHUB_FLOW
  - RETURN_EXACT_MAIN_REVISION_AND_VARIANCE_TO_LEANDRO
```

As identidades managed registradas na Issue #164 não executaram task runs desta fase e não recebem
crédito retrospectivo. A autorização direta de LEANDRO cobre a missão documental, push e merge; não
aprova a F1.4, implementação, run billable nem converte controles não executados em gates satisfeitos.

## Ordem inicial e sequência efetiva

```text
CONTEXTO RAIZ ABRE CONTRATO
-> baseline Git/GitHub e quatro repositórios
-> disposition Q1-Q16
-> arquitetura F1.4 candidata
-> plano NX-0..NX-9
-> revisões temáticas por tasks da plataforma
-> codex review read-only
-> correções e PRF
-> validação terminal da árvore exata
-> branch/PR/checks/merge regulares
-> retorno a LEANDRO com variance e gates ainda abertos
```

## Estratégia de execução e validação

```text
RECUPERAR BASELINE
-> RECONCILIAR Q1-Q16
-> ESPECIFICAR F1.4
-> PLANEJAR BOUNDARIES
-> REVISAR
-> CORRIGIR
-> VALIDAR ÁRVORE EXATA
-> PUBLICAR POR PR REGULAR
-> RETORNAR AO GATE DE LEANDRO
```

## Próximo gate

Após merge e evidência terminal, LEANDRO decide separadamente disposition Q1–Q16, F1.4 e boundary de
implementação. Até lá, todo NX permanece `NO_GO`.
