# MCF NextGen — Roadmap de reconciliação, arquitetura e implementação

- **Mission ID:** `MCF-NEXTGEN-RECONCILIATION-F14-001`
- **Issue:** [#165](https://github.com/leon337/multiagent-collaboration-framework/issues/165)
- **Autoridade humana final:** LEANDRO
- **Papel MCF previsto:** MESTRE — não executado nem creditado nesta sessão
- **Executor factual deste pacote:** contexto raiz ChatGPT/Codex `HOST_MEDIATED_UNVERIFIED`
- **Baseline de abertura:** `main@21c667057617b9cd2090afaab42dc9c7806eef02`
- **Baseline reconciliado antes do PR:** `main@42d941b5bc299cb7121175db0367b780d381c93e`
- **NextGen histórico:** `planning/mcf-nextgen-discovery@f9813afdef27cf51c1b4075aeeb61aa963a917ef`
- **Estado do pacote:** `PLANNING_COMPLETE_CANDIDATE_FOR_MAIN`
- **Estado quando lido no `main`:** `AWAITING_LEANDRO_DISPOSITION_F14_AND_IMPLEMENTATION_BOUNDARY_DECISIONS`
- **Implementação autorizada:** `false`

## 1. Resumo para agentes

O NextGen não é um segundo MCF e não é uma implementação ativa. A rodada histórica Q1–Q16 definiu uma boa direção, mas ficou numa branch documental baseada na v1.0. Desde então, o `main` recebeu v1.1, Context Fabric, Registry/Capsules, recuperação 4/4, adapters read-only para Cognitive Ledger e Cloud e o canal externo MESTRE↔Ox via DeepSeek Harness (DSH) documentado pelo PR #171; TriView também ganhou cockpit read-only em seu lineage seguro.

O baseline atual também contém a release v1.2.0 de Human Control/GUI, o protocolo mergeado de
sucessão cross-chat por GUI/window e a vinculação da decisão humana terminal à conta autenticada
reservada. Esses deltas são superfícies atuais que a F1.4 deve preservar; eles ainda não constituem
pausa persistente do MissionRuntime, controle automático de janela, Authority Envelope genérico ou
Decision Inbox NextGen.

Esta missão reconciliou esses fatos e produziu:

1. [disposition Q1–Q16](proposals/MCF-NEXTGEN-ROUND-2-DISPOSITION-001.md);
2. [arquitetura-alvo formal candidata F1.4](architecture/MCF-NEXTGEN-FORMAL-TARGET-ARCHITECTURE-001.md);
3. [plano de implementação, migração, testes e rollback](superpowers/plans/2026-08-24-mcf-nextgen-reconciled-implementation-plan.md);
4. [PRF Classe C da missão](../artifacts/phases/PHASE-NEXTGEN-RECONCILIATION-F14-001/README.md);
5. este roadmap e checklist candidatos à publicação no `main` pelo PR desta missão.

O pacote para no gate humano. Nenhum contrato, schema, runtime, provider ou deployment NextGen é implementado por estes documentos.

## 2. Resultado arquitetural em uma frase

> Evoluir o runtime atual no lineage v1.2.0 e o Context Fabric para um `GOVERNED_PORTABLE_MULTIAGENT_RUNTIME`, sem duplicar runtime/ledger/permissões, com um writer material por boundary, zero uso de API de IA paga e zero fallback pago.

```yaml
architecture: GOVERNED_PORTABLE_MULTIAGENT_RUNTIME
strategy: INCREMENTAL_COMPATIBILITY_FIRST
current_runtime: PRESERVE_AND_EXTEND
context_fabric: PRESERVE_AND_EXTEND
paid_ai_api: FORBIDDEN
first_recommended_boundary: NX-0_CONTRACTS_AND_CONFORMANCE
implementation_authorized: false
```

## 3. O que existe e o que ainda não existe

| Capacidade                                               | Estado comprovado                                             | Próximo boundary                                       |
| -------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| MissionRuntime, fases, hierarquia, events, receipts      | `CURRENT_IMPLEMENTED`                                         | preservar/regredir                                     |
| HDF, PermissionEngine, external action ledger/dispatcher | `CURRENT_IMPLEMENTED`                                         | formalizar AuthorityEnvelope/Effect v2 posteriormente  |
| Context Fabric, Registry, Capsules e Truth Contracts     | `CURRENT_IMPLEMENTED_MINIMUM`                                 | reader v2 + sidecar/pointer; v1 permanece intacto      |
| Recovery estrutural cross-repo                           | `PASS_4_OF_4_AT_RECORDED_SHA`                                 | repetir fresh em cada candidato                        |
| Cognitive Ledger read no MCF                             | `LAB_E2E_PASS / DISCONNECTED_INACTIVE_AFTER_TEARDOWN`         | preservar read-only; live pertence #164                |
| Cognitive Ledger write provider-side                     | `EXISTS_IN_LEDGER_LINEAGE / NOT_AN_MCF_CAPABILITY`            | integração governada, auth e live pertencem #164       |
| Cloud local read                                         | `LAB_E2E_PASS / DISCONNECTED_INACTIVE_AFTER_TEARDOWN`         | placement local somente após gate                      |
| TriView cockpit                                          | `READ_ONLY_EVIDENCE_ONLY_IN_SAFE_LINEAGE`                     | read models; nenhum command material                   |
| Human Control v1.2                                       | `GOVERNANCE_ACTIVE / INTERNAL_CHECKPOINT_PRIMITIVE_TESTED`    | preservar; pausa/retomada persistente ainda ausente    |
| Decisão humana terminal na rota implementada             | `ACCOUNT_BOUND_SERVER_CANONICALIZED / CALLER_SPOOF_REJECTED`  | generalizar no AuthorityEnvelope sem regressão         |
| Sucessão cross-chat GUI/window                           | `MERGED_SCHEMA_FIXTURES_QUALIFIER / NOT_RUNTIME_WIRED`        | reutilizar trace; reconciliar status via PR próprio    |
| Agent Contract machine-readable                          | `NOT_IMPLEMENTED`                                             | NX-0/NX-1                                              |
| Registry de agents/models/workers/tools                  | `NOT_IMPLEMENTED`                                             | NX-1                                                   |
| Mission Graph geral                                      | `PARTIAL_HIERARCHY_ONLY`                                      | NX-2 shadow, depois NX-4                               |
| Model/Policy Router                                      | `NOT_IMPLEMENTED`                                             | NX-2 shadow e NX-5 lab                                 |
| Canal externo MESTRE↔Ox via DSH                          | `CURRENT_IMPLEMENTED_E2E / EXTERNAL_ADAPTER_CANDIDATE`        | NX-5 exige binding, trust, cost e conformance próprios |
| Origem de execução cognitiva / artifact attestation      | `PARTIAL_EVIDENCE_EXISTS / NO_TRUSTED_NEXTGEN_ORIGIN_RECEIPT` | contracts NX-0; executor zero-cost governado NX-5      |
| Backend automático no runtime NextGen                    | `NOT_CONNECTED_TO_NEXTGEN_REGISTRY_OR_BINDING`                | transporte/localidade/custo validados separadamente    |
| Cloud remoto/VPS/G2-B                                    | `NOT_AUTHORIZED / BLOCKED`                                    | missão separada                                        |
| Runtime NextGen em produção                              | `NOT_IMPLEMENTED / NOT_AUTHORIZED`                            | missão futura após todos os gates                      |

## 4. Mapa do ecossistema

```text
LEANDRO
   |
   v
MCF — governança, Registry, missões, policy, estado e effects
   |---------------- Context Fabric ---------------- Git/Capsules dos 4 repos
   |---------------- Memory READ -------------------- Cognitive Ledger
   |---------------- Infra READ/local lab ----------- Cloud Infrastructure
   +---------------- Derived cockpit ---------------- TriView
```

Ownership essencial:

- MCF: coordenação, autoridade operacional delegada, contratos, missão e transition ledger;
- Cognitive Ledger: memória cognitiva persistida no boundary autorizado, não verdade global;
- Cloud Infrastructure: infraestrutura declarativa, bridges e estado live consultado por rota autorizada;
- TriView: apresentação/read model, nunca autoridade;
- Git de cada projeto: código, decisões e Capsule versionada;
- provider live: verdade contemporânea do efeito/estado que possui.

## 5. Roadmap da missão de planejamento

### R0 — Baseline e auditoria live

**Estado:** `COMPLETE`

- [x] abertura em `main@21c6670` e delta até `main@42d941b` reconciliados;
- [x] branch histórica NextGen identificada e preservada;
- [x] divergência atual na auditoria: branch NextGen `+81`; `main` `+313`;
- [x] Issues #141, #147, #164/#165, PRs #163/#166/#168/#171/#175/#179/#180/#181, PR #169 fechado sem merge, PR #170 ativo e drafts #174/#176/#177/#182 analisados;
- [x] branch Cloud Hermes não default `mcf/hermes-relay-bootstrap-20260823@23e4e6c` tratada somente como input concorrente não canônico;
- [x] branch/worktree isolada criada a partir do `main` atual;
- [x] boundary sem runtime/provider/produção mantido.

### R1 — Reconciliation Round 2

**Estado:** `COMPLETE_CANDIDATE`

```yaml
disposition_summary:
  confirmed: [Q1]
  partially_implemented: [Q2, Q3, Q4, Q6, Q7, Q8, Q9, Q10, Q12, Q13, Q14]
  refined: [Q15]
  reopened_for_leandro: [Q5, Q11, Q16]
  superseded: []
```

- [x] Q1–Q16 classificadas;
- [x] fatos implementados separados de intenção histórica;
- [x] sources of truth e ownership dos quatro repos definidos;
- [x] 29 agentes reconciliados como `LEANDRO_DEFAULT_TEAM_PROFILE`;
- [x] `MCF Operational Transition Ledger` separado de Cognitive Ledger;
- [x] custo zero elevado a hard requirement;
- [x] lineages paralelos preservados.

### R2 — F1.4 arquitetura formal

**Estado:** `COMPLETE_CANDIDATE / NOT_APPROVED`

- [x] planos e boundaries lógicos;
- [x] fluxo de contexto, missão, binding e effects;
- [x] 17 famílias de contratos candidatos;
- [x] Cognitive Execution Request/Receipt e origin-attestation boundary definidos;
- [x] Human Control v1.2, autoridade humana autenticada e trace GUI/window preservados sem duplicação;
- [x] grafo de dependências/dispositions Q15 reexecutado;
- [x] Evaluation Contract e predeclaration gate Q13 definidos;
- [x] Portability Matrix/Receipt e conformance negativa Q14 definidos;
- [x] security/data/secrets model;
- [x] deployment inicial local-first;
- [x] failure states;
- [x] migração incremental e rollback;
- [x] Architecture Readiness checklist;
- [ ] aprovação de LEANDRO no SHA/digest exato.

### R3 — F1.5/F1.6 plano de migração e implementação

**Estado:** `COMPLETE_CANDIDATE / NOT_AUTHORIZED`

- [x] primeiro boundary NX-0 recomendado;
- [x] work packages NX-0 a NX-9 definidos;
- [x] arquivos candidatos e testes mínimos;
- [x] cobertura 1:1 de tipo formal → schema → fixtures positiva/negativa exigida;
- [x] gates, rollbacks e risk register;
- [x] matriz de compatibilidade/regressão;
- [x] tarefas cross-repo separadas;
- [x] template de autorização explícita;
- [ ] escopo inicial escolhido/autorizado por LEANDRO.

### R4 — Validação, PR e publicação no `main`

**Estado:** `READ_GITHUB_LIVE`

A presença deste arquivo no `main` comprova publicação do pacote. Para qualquer branch/PR, verificar live:

- diff limitado ao planejamento e metadados de continuidade aplicáveis;
- links internos válidos;
- Prettier/documentation validation;
- regressão proporcional ao diff;
- revisão independente no HEAD exato;
- zero achado material aberto;
- PRF Classe C íntegro e sem crédito simulado;
- checks obrigatórios verdes;
- merge por PR regular, sem bypass.

### H1 — Gate humano de arquitetura e implementação

**Estado:** `PENDING_LEANDRO`

LEANDRO decide separadamente:

1. se aprova/corrige a disposition Q1–Q16;
2. se aprova/corrige a F1.4;
3. qual boundary, revisão e caminhos podem ser implementados;
4. quais efeitos permanecem proibidos.

Sem essa decisão, todos os work packages NX permanecem `NO_GO`.

## 6. Roadmap futuro de implementação

Hoje, o efeito autorizado de todos os rows é `NONE`. A última coluna limita o efeito máximo somente
se aquele boundary receber autorização separada no futuro.

| Ordem  | Boundary                                                        | Entrega                                    | Efeito máximo quando autorizado          |
| ------ | --------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| 1      | NX-0                                                            | contracts, schemas, fixtures e conformance | `CONTRACTS_ONLY / ZERO_RUNTIME_EFFECT`   |
| 2      | NX-1                                                            | Registry v2 + profile dos 29 agentes       | `REGISTRY_METADATA_ONLY`                 |
| 3      | NX-2                                                            | requirements/graph/router/binding shadow   | `ZERO_MATERIAL_EFFECTS`                  |
| 4      | NX-3                                                            | Context/Ledger/Cloud/TriView read paths    | `READ_ONLY_LAB`                          |
| 5      | NX-4                                                            | graph sobre MissionRuntime atual           | `SEQUENTIAL_READ_ONLY_FIRST`             |
| 6      | NX-5                                                            | backend + cognitive execution lab          | `ZERO_PAID_AI_API / SCOPED_REALITY_GATE` |
| 7      | NX-6                                                            | placement Cloud local descartável          | `LOCAL_LAB_ONLY`                         |
| 8      | NX-7                                                            | Effect Request/Receipt v2                  | `SEPARATE_REVERSIBLE_EFFECT_GATE`        |
| 9      | NX-8                                                            | Evaluation Contract + value evidence Q13   | `PREDECLARE_BEFORE_ANY_RUN`              |
| 10     | NX-9                                                            | Portability Matrix/conformance/receipt Q14 | `CLEAN_ROOM_NO_LIVE_PROVIDER`            |
| futuro | integração MCF → Ledger write / TriView commands / Cloud remoto | missões #164 e posteriores                 | `NOT_AUTHORIZED_HERE`                    |
| futuro | release/produção                                                | qualificação e gate próprios               | `NOT_AUTHORIZED_HERE`                    |

## 7. Checklist consolidado

### Conhecimento e reconciliação

- [x] grafia canônica `NextGen` usada;
- [x] rodada 1 preservada, sem reescrita;
- [x] target architecture decision separada de final spec/implementation;
- [x] v1.1, Context Fabric e quatro repos mapeados;
- [x] claims live separados de evidência histórica;
- [x] gaps antigos Capsule/Registry atualizados;
- [x] workstreams paralelos declarados.

### Arquitetura

- [x] não existe segundo runtime, ledger operacional ou permission system;
- [x] owners e fontes canônicas definidos;
- [x] model/agent/cognitive-executor/capability/authority/placement separados;
- [x] graph, binding, cognitive execution, completion e effect boundaries definidos;
- [x] caller-supplied evidence não equivale a autoria/origin proof;
- [x] Capsule v1/v2 possui sidecar, pointer, cutover e rollback sem sobrescrever v1;
- [x] dependency/disposition graph impede replacement/sunset isolado;
- [x] Q13 exige contrato/digest congelado antes da avaliação;
- [x] Q14 separa recovery de portabilidade por camada comprovada;
- [x] 29 agentes preservados sem constitucionalizar nomes no Core;
- [x] Ledger memory separada de evidence/live state;
- [x] TriView permanece derived/read-only;
- [x] GUI autorizada permanece superfície operacional, não autoridade nem sinônimo de TriView;
- [x] `HumanControlCheckpoint` interno não é contado silenciosamente como 23º contrato público;
- [x] decisão humana por nome/campos do caller é rejeitada; conta e `sourceRef` server-side são preservados, e authority binding versionado permanece target;
- [x] local-first e modular-monolith-first;

### Custo zero

- [x] `paid_ai_api_authorized=false`;
- [x] `max_paid_ai_cost=0`;
- [x] `paid_fallback=false`;
- [x] paid embeddings bloqueados;
- [x] unknown/stale price ou quota bloqueia seleção;
- [x] ChatGPT atual classificado honestamente como `HOST_MEDIATED`;
- [x] `HOST_MEDIATED` sem attestation permanece `UNVERIFIED` para crédito de agente;
- [x] nenhum provider gratuito específico congelado sem verificação live.
- [x] DSH/`x-preview-f-free` classificado como adapter candidato, não `FREE_VERIFIED_API` por inferência.

### Segurança e governança

- [x] modelo/prompt/UI não concedem autoridade;
- [x] actions materiais passam por HDF/policy/dispatcher/read-back;
- [x] secrets excluídos de Git/Capsule/prompt/memory/evidence público;
- [x] approval version-bound;
- [x] `HUMANO NO CONTROLE` tem precedência e bloqueia novas ações; wiring persistente continua gap explícito;
- [x] unknown external effect exige reconciliation;
- [x] Cloud remoto/VPS/G2-B/produção fora de escopo;
- [ ] threat/compatibility audit repetida antes do primeiro código.
- [ ] dependency audit e secret scan zero-cost/reprodutível exigidos no SHA de implementação.

### Publicação e gate

- [ ] confirmar live que o pacote está no `main` por PR regular;
- [ ] confirmar checks e revisão terminal do SHA publicado;
- [ ] LEANDRO aprova a F1.4 exata;
- [ ] LEANDRO autoriza um boundary de implementação exato;
- [ ] somente então iniciar nova missão de código.

## 8. Relação com as missões paralelas

### #141 — Mission Control

Consome read models de contexto/runtime. Não será implementado nem transformado em authority por este roadmap.

### #147 — Architecture Convergence

O Federated Context Kernel é fundação real da reconciliação. Registry/Capsule/recovery não serão duplicados.

### PR #171 — canal externo MESTRE↔Ox

O canal DSH está documentado no `main` como capacidade externa E2E atual e permanece um
executor-adapter candidato. Ele não materializa Registry/Binding/Receipt NextGen, não recebe crédito
retroativo de agente e não autoriza operar provider, túnel, VPS ou credenciais nesta missão.

### v1.2.0 / PR #175 — Human Control e GUI autorizada

Human Control é governança vigente e possui recognizer/checkpoint interno testado. A GUI autorizada é
uma superfície operacional governada, não autoridade própria. Não existe wiring de pausa/retomada
persistente no MissionRuntime, integração TriView, Decision Inbox ou contrato público de checkpoint;
promover essa primitive a contrato reabre o catálogo 17/22. O recognizer ainda compara
`actorId=leandro` por texto e não autentica; wiring futuro deve usar a conta reservada da sessão.

### PRs #179 e #180 — sucessão GUI/window

O `main` contém protocolo, schema, fixtures e qualifier puro da sucessão cross-chat. O PR #180
reconciliou o texto de status pós-merge, mas não adicionou producer/consumer, controle de janela
conectado ao runtime ou autoridade de UI. Os artefatos selados da missão preservam corretamente o
estado anterior ao merge; este roadmap é a visão corrente que os sucede.

### PR #181 — autoridade humana vinculada à conta

A rota HTTP implementada deriva a conta da sessão autenticada, exige o UUID reservado do servidor,
canonicaliza a provenance de decisões terminais e rejeita outra conta. A F1.4 preserva esse boundary
como piso de segurança; ele não prova que o Authority Envelope genérico ou a Decision Inbox já
existem.

### Drafts #176/#177/#182 — lineages concorrentes

Os PRs #176 (audit ledger da missão de sucessão), #177 (proposta de qualificação AGDO v1.3) e #182
(runbook/evidência de workspace dual-VPS) permanecem drafts fora de `main`. São inputs de preflight,
não capacidades NextGen canônicas, autorização de runtime, placement remoto ou mutação de VPS.

### PR #174 — Agent Continuity Capsule concorrente

No snapshot desta missão, o PR #174 está `OPEN`/`DRAFT`, fora de `main`, e propõe um schema de
continuidade de agente/sessão. Ele é input de design não canônico, não uma segunda Project Capsule,
fonte de estado live, memória ou writer. Se avançar ou mergear antes de NX-0, o preflight deve
rebasear e produzir uma matriz de equivalência por campo, owner, writer, fonte e consumidor contra
Project Capsule v1/v2, Agent Contract, Authority Envelope e Completion Contract. Semântica
equivalente deve reutilizar/adaptar um único contrato; continuidade específica de agente/sessão pode
ser artifact subtype ou referência. Divergência material reabre a F1.4 e o catálogo antes de código.

```yaml
pr_174_continuity_capsule: OPEN_DRAFT_NON_CANONICAL_EQUIVALENCE_REVIEW_REQUIRED
second_continuity_state_or_memory_writer: FORBIDDEN
```

### Cloud Hermes — branch não default

O branch Cloud `mcf/hermes-relay-bootstrap-20260823@23e4e6c` não é o `main`, não integra o lineage
seguro de recovery e não é capacidade canônica do ecossistema. Seus receipts preservados registram
quota Codex bloqueada, probe computer-use falho, probe local Qwen falho e rota Qwen `:free` bloqueada
por ausência de chave. Isso não prova backend gratuito elegível nem admission de executor NextGen e
não altera o fechamento de remoto/VPS/SSH.

```yaml
cloud_hermes_23e4e6c: NONDEFAULT_BRANCH_NOT_CANONICAL_NOT_ELIGIBLE_EXECUTOR
remote_vps_effect: NONE
```

### #164 — Cognitive memory / próxima stable

O Ledger já possui primitivas provider-side de escrita. A missão #164 já recebeu decisões humanas
iniciais para provider, captura, autoridade, formato, correção, confirmação e prova; ainda governa a
capability write do MCF, authN/authZ, preservação dos registros existentes, live, dados reais,
semver e release. Após o PR #168, a Issue registrou live 29 identidades managed do Brainbase e
`GATE-RUNTIME-REALITY = SATISFIED_FOR_EXECUTOR_IDENTITY_AND_CONFIGURATION`, mas nenhum task run e
nenhum crédito de contribuição. Os task runs Brainbase são declarados billable e por isso não são
opção desta arquitetura zero-cost. O PR #169 foi fechado sem merge em 2026-08-24T09:01:30Z como
exploração de caminho pago substituída por recuperação zero-cost. Seu último head foi
`ee3bfb960e155bb7641bb52030da3119d97f0b03`; o branch é histórico de auditoria, não estado de
`main`. Este roadmap preserva o boundary e não consome seus gates.

Às 2026-08-24T09:08:04Z, a Issue registrou a recuperação zero-cost pelo PR #170 com harness local
Ollama/Qwen. O check `phase2-local-agent-chain` executou a primeira etapa, mas rejeitou a saída de
Miriam por ausência do heading obrigatório de handoff e terminou com exit 1 no head histórico
`3374bb6a67adde948f64bdac428ab7a348228971`. O run intermediário `32710207078`, no head
`497af9e28301ea151ddc46870389a0799161f00a`, foi cancelado por concurrency antes de executar agentes.
No freeze de 2026-08-24T09:29:37Z, a segunda tentativa efetiva de execução dos agentes, o run
`32710229432` no head `1da1a13bd8ca47bed2f4a4e560e64691788582f8`, progrediu até 6/15 e falhou
em Tiago por ausência de dois headings obrigatórios; o job `97379873672` completou `FAILURE` às
2026-08-24T09:23:42Z e o PR permaneceu `OPEN`/`UNSTABLE`. O log contém seis outputs e handoffs
estruturalmente validados, atribuíveis ao harness, mas nenhum artifact foi publicado, não houve
sucesso terminal nem promoção ao PRF da missão; a prova subsequente de não mutação do repositório
foi pulada. Nenhuma das tentativas é promovida por este roadmap
a chain concluída, artifact de missão aceito, crédito de contribuição ou prova de origem confiável;
elas não satisfazem auditoria, design ou implementação.

## 9. Critérios antes de voltar para LEANDRO

O pacote de planejamento está pronto para o gate humano quando:

- [ ] estiver no `main`;
- [ ] todos os links/checks aplicáveis passarem;
- [ ] revisão independente não encontrar achado material;
- [ ] a documentação de estado/continuidade apontar para este roadmap;
- [ ] nenhuma implementação ou mutação de provider/runtime/VPS/produção tiver ocorrido; branch,
      push, PR e merge GitHub permanecem as únicas mutações externas autorizadas para publicar o
      pacote.

## 10. Próxima decisão recomendada

Após revisar o pacote no `main`, LEANDRO pode:

1. aprovar/corrigir a arquitetura;
2. autorizar somente `NX-0_CONTRACTS_AND_CONFORMANCE` como primeiro boundary;
3. manter explicitamente fechados runtime wiring, banco, providers, APIs, integração MCF → Ledger write, TriView commands, Cloud remoto, VPS, release e produção.

O template exato está no [plano de implementação](superpowers/plans/2026-08-24-mcf-nextgen-reconciled-implementation-plan.md#12-template-recomendado-de-autorização).

## 11. Fontes

- [Estado atual do MCF](MCF-CURRENT-STATE.md)
- [Roadmap da memória cognitiva / #164](MCF-NEXT-STABLE-COGNITIVE-MEMORY-ROADMAP.md)
- [Context Fabric design](superpowers/specs/2026-08-20-context-fabric-federated-kernel-design.md)
- [v1.1 conformance](proposals/MCF-V1.1-PREIMPLEMENTATION-CONFORMANCE-001.md)
- [Evidência recovery 4/4](integrations/evidence/MCF-ECOSYSTEM-RECOVERY-4OF4-20260824.md)
- [NextGen histórico](https://github.com/leon337/multiagent-collaboration-framework/tree/planning/mcf-nextgen-discovery/docs/proposals)
- [Issue da missão #165](https://github.com/leon337/multiagent-collaboration-framework/issues/165)

## 12. Estado terminal do planejamento

```yaml
reconciliation: complete_candidate
formal_architecture: complete_candidate_not_approved
implementation_plan: complete_candidate_not_authorized
runtime_changes: none
provider_changes: none
paid_api_calls: 0
vps_or_production_changes: none
next_action: PUBLISH_VALIDATE_REVIEW_THEN_RETURN_TO_LEANDRO
```
