# MCF NextGen — Reconciliação e disposition da rodada 1

- **ID:** `MCF-NEXTGEN-ROUND-2-DISPOSITION-001`
- **Status:** `CANDIDATE_FOR_LEANDRO_REVIEW`
- **Mission:** `MCF-NEXTGEN-RECONCILIATION-F14-001`
- **Issue:** [#165](https://github.com/leon337/multiagent-collaboration-framework/issues/165)
- **Baseline de abertura:** `main@21c667057617b9cd2090afaab42dc9c7806eef02`
- **Baseline reconciliado antes do PR:** `main@42d941b5bc299cb7121175db0367b780d381c93e`
- **Fonte histórica preservada:** `planning/mcf-nextgen-discovery@f9813afdef27cf51c1b4075aeeb61aa963a917ef`
- **Autoridade humana final:** LEANDRO
- **Implementação autorizada:** `false`

## 1. Objetivo

Reconciliar as decisões Q1–Q16 da primeira rodada NextGen com:

- o runtime e a governança v1/v1.1 que existem no `main`;
- o Context Fabric e a integração read-only dos quatro repositórios;
- as linhas paralelas de Mission Control, memória cognitiva e convergência arquitetural;
- a regra atual de LEANDRO de **zero gasto variável com APIs de IA**;
- o estado live do GitHub e as evidências vinculadas a SHAs exatos.

Este documento não reescreve os checkpoints da rodada 1. Ele cria o lineage de revisão previsto pela própria consolidação histórica.

```text
ROUND_1 = PRESERVE
ROUND_2 = REVIEW_WITH_LINEAGE
RECONCILIATION != SILENT_SUPERSESSION
PLANNING != IMPLEMENTATION_AUTHORIZATION
```

## 2. Vocabulário de disposition

| Disposition             | Significado                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| `CONFIRMED`             | A decisão permanece adequada sem mudança material.                   |
| `REFINED`               | A intenção permanece, mas precisa de regra ou boundary mais preciso. |
| `PARTIALLY_IMPLEMENTED` | Parte verificável já existe; não equivale à decisão inteira.         |
| `REOPENED`              | A pergunta precisa de nova decisão antes da arquitetura final.       |
| `SUPERSEDED`            | Uma decisão posterior explícita substituiu a anterior.               |

Nenhuma Q1–Q16 recebeu `SUPERSEDED`: evolução de código ou mudança de inventário não substitui uma
decisão sem lineage e aprovação explícitos.

## 3. Matriz Q1–Q16

| Q   | Decisão da rodada 1                                                                              | Evidência e delta no MCF atual                                                                                                                                                                                       | Disposition recomendada | Regra resultante candidata                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Sistema pessoal de trabalho com IA para LEANDRO; continuidade e prova antes de generalização.    | O escopo real agora inclui MCF, Cognitive Ledger, Cloud Infrastructure e TriView. LEANDRO também tornou custo zero com APIs de IA um requisito explícito.                                                            | `CONFIRMED`             | O MCF continua personal-first e proof-first e coordena formalmente o ecossistema de quatro repositórios com `ZERO_PAID_AI_API`. A continuidade completa ainda depende da missão #164.                                                                 |
| Q2  | `LAYERED_CONTINUITY_ARCHITECTURE`.                                                               | Registry, Capsules, Truth Contracts, freshness/provenance e recovery estrutural 4/4 foram implementados. Memória live, Continuity Builder completo e recovery operacional de providers continuam incompletos.        | `PARTIALLY_IMPLEMENTED` | Preservar a arquitetura em camadas; Git/Capsules recuperam identidade e contexto, MCF mantém estado operacional e Cognitive Ledger guarda memória cognitiva sem se tornar verdade global.                                                             |
| Q3  | `Agent Contract`; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY`.                                 | Existem 29 contratos normativos em prosa, seleção por competência e contratos de runtime, mas não há Agent Contract machine-readable completo nem backend cognitivo desacoplado em runtime.                          | `PARTIALLY_IMPLEMENTED` | O Core conhece um Agent Contract genérico; os 29 agentes formam o profile oficial `LEANDRO_DEFAULT_TEAM_PROFILE`. Trocar modelo não troca identidade nem concede autoridade.                                                                          |
| Q4  | Autonomia limitada por missão e risco.                                                           | HDF, PermissionEngine, Standing Authorization e dispatcher existem; Human Control v1.2 está vigente e a rota implementada vincula decisão humana terminal à conta autenticada. O envelope genérico ainda não existe. | `PARTIALLY_IMPLEMENTED` | Evoluir os controles atuais para um `AuthorityEnvelope` version-bound, preservando conta/`sourceRef` server-side e adicionando binding contratual; nenhuma permissão nova pode ser inferida de nome, modelo, prompt, UI ou placement.                 |
| Q5  | Router baseado em capabilities/policy; custo era preferência depois dos requisitos obrigatórios. | Não existe Model Router executável. Tratar custo apenas como preferência conflita com a regra atual de zero gasto em APIs de IA.                                                                                     | `REOPENED`              | `paid_ai_api_authorized=false`, `max_paid_ai_cost=0` e `paid_fallback=false` são hard requirements. Transporte, localidade e custo são eixos separados; só `HOST_ENTITLEMENT`, `LOCAL_COMPUTE` ou `FREE_VERIFIED_API` são classes de custo elegíveis. |
| Q6  | Independência demonstrável; `INDEPENDENCE != DIVERSITY`.                                         | O MCF exige revisão e evidência, mas o experimento telefone-sem-fio usou o mesmo ChatGPT e não prova independência cognitiva.                                                                                        | `PARTIALLY_IMPLEMENTED` | Preservar blind-first e evidência própria. Marcar assurance cognitiva como `UNKNOWN` quando não houver isolamento real; diversidade continua opcional conforme risco.                                                                                 |
| Q7  | Grafo hierárquico governado, joins, replanning e budgets.                                        | O runtime possui missões, fases, hierarquia pai/submissão, retries e completion policy, mas não um DAG geral com joins e paralelismo governado. A v1.1 proíbe criar um segundo runtime.                              | `PARTIALLY_IMPLEMENTED` | Implementar uma camada de Mission Graph sobre o MissionRuntime atual, inicialmente shadow e sequencial/read-only; nenhum runtime paralelo.                                                                                                            |
| Q8  | `LAYERED_CANONICAL_PERSISTENCE`.                                                                 | Git, PostgreSQL do MCF, providers, receipts e Cognitive Ledger já existem como stores distintos. O nome “Cognitive Ledger” pode ser confundido com o transition ledger lógico.                                       | `PARTIALLY_IMPLEMENTED` | Git guarda decisões/contratos; PostgreSQL do MCF guarda missões/transições; provider guarda estado live; Cognitive Ledger guarda memória. `MCF_OPERATIONAL_TRANSITION_LEDGER != COGNITIVE_LEDGER`.                                                    |
| Q9  | Observabilidade progressiva e Decision Inbox.                                                    | Mission observability e GUI autorizada existem; TriView é GET-only; Mission Control está em discovery. O PR #179 mergeou trace/schema/qualifier de sucessão GUI/window, sem runtime ou autoridade material.          | `PARTIALLY_IMPLEMENTED` | GUI é superfície operacional; TriView/Mission Control são read models. Futura Decision Inbox envia pedido tipado ao MCF e nunca escreve diretamente em provider ou estado canônico.                                                                   |
| Q10 | Core mínimo estável com extensões governadas.                                                    | O MCF atual é um modular monolith com runtime, adapters, skills e registries. Ainda há acoplamentos v1 e nenhuma extensão NextGen completa.                                                                          | `PARTIALLY_IMPLEMENTED` | Estender o monólito atual por ports/contracts; `LOGICAL_BOUNDARY != PHYSICAL_SERVICE`; plugin instalado não significa habilitado ou autorizado.                                                                                                       |
| Q11 | Placement híbrido portátil, baseado em policy.                                                   | O Cloud adapter local read-only passou em lab; G2-A remoto e G2-B permanecem fechados. A missão #164 escolheu Supabase privado para memória, mas auth/binding MCF e ativação live continuam abertos.                 | `REOPENED`              | Local-first e zero-cost são hard constraints. Cada placement remoto exige capability, currentness, data boundary, autorização e gate próprios; Cloud continua owner de infraestrutura.                                                                |
| Q12 | Zero trust com enforcement fora do modelo.                                                       | HDF, PermissionEngine, dispatcher, tokens pairwise e adapters fail-closed existem; PR #181 rejeita spoofing de decisão humana pelo caller na rota implementada. Identity/delegation chain genérica ainda não existe. | `PARTIALLY_IMPLEMENTED` | Reutilizar os controles atuais e formalizar principal/delegation chain, secrets boundary, policy version e effect admission; nome/payload/modelo nunca é prova ou enforcement.                                                                        |
| Q13 | Avaliação comparativa predeclarada com baselines e custo.                                        | Existem testes, qualification gates, skill de avaliação e evidências por SHA, mas não um Evaluation Contract NextGen nem baseline comparativo de valor da arquitetura completa.                                      | `PARTIALLY_IMPLEMENTED` | Avaliar continuidade, correção, esforço humano, latência, custo estrutural e custo variável. Hard gate econômico: zero chamadas/cobranças de APIs de IA pagas.                                                                                        |
| Q14 | Clean-room portability e utilidade externa.                                                      | Recovery estrutural 4/4, E2Es descartáveis e clean-room v1.1 fornecem evidência parcial. Não há prova de portabilidade integral do runtime, modelo, workers ou live providers.                                       | `PARTIALLY_IMPLEMENTED` | Tratar 4/4 como foundation evidence, não prova total. Exigir conformance por camada e ambientes limpos, com currentness e authority rebinding.                                                                                                        |
| Q15 | Preservar invariantes, reduzir implementação.                                                    | Capsule/Registry e as superfícies v1.2 Human Control, autoridade autenticada e trace GUI já existem parcialmente. Router, graph, binding, pausa persistente e avaliação continuam incompletos ou ausentes.           | `REFINED`               | Reexecutar a dependency matrix; preservar runtime v1.2.0, Context Fabric e controles vigentes, reutilizar traces/primitives sem duplicação, substituir acoplamentos gradualmente e proibir big-bang.                                                  |
| Q16 | `GOVERNED_PORTABLE_MULTIAGENT_RUNTIME`.                                                          | A direção foi aprovada na rodada 1, mas não havia F1.4 final. O ecossistema atual oferece fundações reais, inclusive deltas v1.2, sem ainda realizar a forma executável NextGen.                                     | `REOPENED`              | Preservar direção/nome e submeter a realização incremental sobre v1.2.0 + Context Fabric à aprovação de LEANDRO, com zero API de IA paga, autoridade autenticada e um writer por boundary.                                                            |

### 3.1 Delta posterior: canal MESTRE↔Ox do PR #171

O `main@2b8ce24b71c9f9095c801dafdd762a2cef202fa9` agora documenta como `CURRENT_IMPLEMENTED` um
canal externo MESTRE↔Ox via DSH, com E2E de transporte, continuidade de sessão e logs. O delta
reforça Q3/Q8/Q12/Q14 como `PARTIALLY_IMPLEMENTED`, mas não muda nenhuma disposition:

- DSH é execution-provider/adapter candidato, não backend desacoplado integrado ao runtime MCF;
- o E2E não materializa Agent Contract, Registry multissubject, Execution Binding ou Receipt NextGen;
- o modelo observado com sufixo `free` não prova custo/preço/quota/fallback contemporâneos;
- logs de sessão não substituem attestation, trust-root/channel admission ou PRF aceito desta missão;
- esta reconciliação não operou DSH, VPS, SSH nem provider e não atribui atuação retroativa à Ox.

### 3.2 Delta v1.2: Human Control, GUI/window e autoridade autenticada

O PR #175 publicou `v1.2.0@5c7f983` com Human Control/GUI e uma primitive interna testada de
checkpoint. A regra tem precedência normativa, mas não existe wiring persistente no MissionRuntime;
o recognizer atual por `actorId=leandro` é sintático e não autentica. Isso reforça Q4/Q9/Q12/Q15 sem
mudar suas dispositions.

O PR #179 mergeou protocolo, schema, fixtures e qualifier puro da sucessão cross-chat GUI/window. O
PR #180 reconciliou o texto de status pós-merge. Ambos estão em `main` e são trace/evidence
reutilizável, não producer/consumer, controle automático de janela ou authority.

O PR #181 exige a conta autenticada reservada e canonicaliza `sourceRef` server-side na rota de
decisão humana terminal e no consumidor de production authorization. Isso fecha spoofing nominal no
boundary implementado, mas ainda não cria Authority Envelope/Human Decision NextGen genéricos nem
um authority binding contratual. A F1.4 preserva esse piso e adiciona o binding versionado no target.

`HumanControlCheckpoint`, `HumanAuthorityProof` e o trace GUI/window não são três contratos públicos
NextGen adicionais. Publicá-los como boundaries independentes reabre o catálogo 17/22.

### 3.3 Grafo de dependências e disposition Q15 reexecutado

As setas significam “é pré-condição material de”. O grafo foi refeito contra o `main` reconciliado;
ele não autoriza substituição nem sunset.

```text
Project Registry + Capsule v1
  -> recovery/read APIs
  -> TriView e Mission Control como read models

Agent docs + matriz + Skill Registry
  -> Registry v2 + LEANDRO_DEFAULT_TEAM_PROFILE
  -> Task Requirements
  -> Execution Binding

Model Backend + Cognitive Executor capabilities
  -> Cognitive Execution Request bound to attempt/binding
  -> authenticated executor adapter
  -> artifact manifest + Cognitive Execution Receipt
  -> verified MissionRuntime transition

MissionRuntime + phases/submissions + MCF Operational Transition Ledger
  -> Mission Graph compiler/projection
  -> execução sequencial/read-only
  -> joins/paralelismo governados

HDF + Standing Authorization + PermissionEngine
  -> AuthorityEnvelope
  -> ExternalActionDispatcher + External Action Ledger
  -> provider adapter
  -> read-back + Receipt + reconciliation

Human Control v1.2 + authenticated reserved human account
  -> persistent pause/checkpoint + safe point
  -> zero new graph/cognitive/placement/effect admission
  -> explicit authenticated resume

Ledger read adapter + Cloud local adapter
  -> context envelopes tipados
  -> Task Requirements / Execution Binding elegível

MissionRuntime + accepted Receipts + Context read models
  -> derived operational read model
  -> TriView GET-only

Evaluation Contract congelado antes do run
  -> comparação Q13
  -> value evidence

Portability Claim/Matrix + compatibility envelope
  -> conformance/negative/migration suite Q14
  -> Portability Receipt
  -> cutover/sunset elegível
```

| Componente atual                                      | Disposition semântica / implementação          | Target incremental                                         | Dependências e consumidores atuais                                               | Pré-condição para replacement/sunset                                                                                    |
| ----------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| MissionRuntime, phases, submissions, state/events     | `PRESERVE / EVOLVE`                            | graph compiler/projection sobre o runtime atual            | contratos v1.1, observability, qualification e todos os effects                  | sem sunset planejado; graph deve passar conformance, restart e compatibility mantendo writer único                      |
| HDF, Standing Authorization e PermissionEngine        | `PRESERVE / EVOLVE`                            | `McfAuthorityEnvelopeV1` sobre enforcement atual           | MissionRuntime, dispatcher, gates e production authorization                     | novo envelope deve provar atenuação, HUMAN_GATE version-bound e fail-closed antes de qualquer desativação               |
| Human Control + primitive interna do PR #175          | `PRESERVE / EVOLVE_WITHOUT_PUBLIC_DUPLICATION` | pausa/retomada persistente no MissionRuntime               | HDF v1.2, GUI autorizada e future admission boundaries                           | conta autenticada, safe point, restart, zero nova admissão e in-flight reconciliation; promoção pública reabre 17/22    |
| Conta humana/provenance server-side do PR #181        | `PRESERVE / GENERALIZE`                        | principal/Receipt/binding versionados                      | execute-phase HTTP e production authorization                                    | nenhuma regressão para nome/caller payload; cadeia Envelope→Receipt→Request deve passar                                 |
| ExternalActionDispatcher e External Action Ledger     | `PRESERVE / EVOLVE`                            | Effect Request/Receipt v2 com adapter v1                   | adapters GitHub/Render, reconciliation, idempotency e observability              | mapping v1/v2, read-back, unknown-effect recovery e zero rota paralela devem passar; ledger atual não é aposentado      |
| Context Fabric: Registry, Capsule, Truth, recovery    | `PRESERVE / EVOLVE`                            | Registry v1 + Capsule v1 preservados; sidecar/pointer v2   | quatro repositórios, endpoints MCF, TriView e recuperação de agentes             | reader-first, pointer/digest, recovery v1+v2 fresh 4/4 e rollback v1; cutover/sunset exigem gate separado               |
| 29 contratos em prosa, matriz e Skill Registry        | `PRESERVE_AS_PROFILE / EVOLVE`                 | Agent Contract genérico + profile oficial                  | seleção por competência, `selectedAgents`, startup e documentação                | prova 29/29, IDs sem colisão e compatibilidade com consumidores v1 antes de trocar qualquer reader                      |
| Chat Mission Planner baseado em keywords              | `PRESERVE_DURING_MIGRATION / REPLACE`          | Task Requirements + Mission Graph compiler                 | chat bridge, criação de contratos, fases e `selectedAgents`                      | shadow determinístico, comparação v1, completion e rollback verdes; retirar somente após zero consumidor obrigatório    |
| Hierarquia pai/submissão e `selectedAgents`           | `PRESERVE / ADAPT`                             | backend de execução do graph aprovado                      | MissionRuntime, HDF, handoffs, qualification e observability                     | mapping bidirecional/versionado e regressão completa; NextGen não cria runtime concorrente                              |
| `execution_evidence` fornecida pelo chamador          | `PRESERVE_AS_V1_COMPAT / REPLACE_FOR_CREDIT`   | Cognitive Execution Request/Receipt + executor autenticado | MissionRuntime, SkillExecutor, handoff e crédito de agentes                      | conformance E2E, origin attestation, anti-replay e run zero-paid real escopado; sem isso GATE-RUNTIME-REALITY não passa |
| Canal MESTRE↔Ox via DSH do PR #171                    | `PRESERVE_AS_EXTERNAL_EVIDENCE / ADAPT_LATER`  | adapter candidato separado de transport/locality/cost      | continuidade externa e logs de sessão; não é dependência do runtime              | contrato/fixture NX-5 primeiro; deployment remoto exige gate próprio; sem Receipt/trust/cost proof não recebe crédito   |
| Ledger read e Cloud local read                        | `PRESERVE_BOUNDARY / EVOLVE`                   | context envelopes tipados com freshness                    | Context Recovery, Task Requirements e futuros bindings                           | conformance de allowlist/no-store/currentness; write/remote continuam em gates separados                                |
| TriView GET-only                                      | `PRESERVE_AS_DERIVED_CONSUMER / EVOLVE`        | operational read models tipados com freshness              | operadores; consome runtime/context/receipts aceitos, nunca alimenta eligibility | conformance de currentness/privacy; commands continuam em gate separado                                                 |
| Trace/schema/qualifier GUI/window dos PRs #179/#180   | `PRESERVE_AS_COMPATIBILITY_EVIDENCE`           | producer/consumer somente em boundary posterior            | sucessão cross-chat; status pós-merge reconciliado em `main`                     | sem runtime/authority inferidos; reutilização/equivalência antes de qualquer contrato ou wiring                         |
| Bindings provider-specific tratados como detalhe Core | `KEEP_AS_ADAPTER / REPLACE_AS_CORE_IDENTITY`   | Registry multissubject + Execution/Placement Binding       | dispatcher, config/env e workflows atuais                                        | capability/currentness/compatibility provadas e nenhum consumidor ativo dependente do binding antigo                    |
| Taxonomia de risco A/B/C                              | `PRESERVE_INTERPRETABILITY / EVOLVE`           | mapping versionado para policy/authority mais expressiva   | templates, HDF, documentação e histórico                                         | todo estado histórico continua interpretável; nenhuma troca silenciosa de semântica                                     |
| Status/receipts manuais duplicados                    | `PRESERVE_AUDITABILITY / SIMPLIFY`             | derived views e receipts automatizados                     | recovery, auditoria e handoffs                                                   | source canônica, lineage e evidence permanecem recuperáveis antes de remover duplicação manual                          |
| Evaluation Contract/scorecard Q13                     | `ADD_REQUIRED / IMPLEMENT_LATER`               | work package NX-8                                          | claims de valor e qualquer decisão de preservar/simplificar/remover complexidade | contrato/digest predeclarado antes do primeiro run; baseline crível, constraints, métricas e decision rule congelados   |
| Portability Matrix/conformance/receipt Q14            | `ADD_REQUIRED / IMPLEMENT_LATER`               | work package NX-9                                          | migration, compatibility, cutover e sunset                                       | suite por camada, negative tests, clean room, authority rebinding e receipt; recovery 4/4 isolado não basta             |

Resultado do gate Q15:

```yaml
dependency_graph_rerun_against_reconciled_main: complete_candidate
component_with_sunset_authorized: none
unmet_replacement_precondition: BLOCKS_REPLACEMENT_AND_SUNSET
graph_approval: PENDING_LEANDRO
```

### 3.4 Inputs concorrentes não canônicos após o baseline

O draft PR #174 propõe um contrato de continuidade de agente/sessão. Como está fora de `main`, ele
não altera esta disposition nem a contagem candidata. Se mergear antes de NX-0, exige rebase e matriz
de equivalência contra Project Capsule v1/v2, Agent Contract, Authority Envelope e Completion
Contract. Um contrato equivalente deve ser reutilizado/adaptado; um artifact específico pode ser
referenciado. Não é permitido criar segunda Project Capsule, fonte de estado/memória ou writer de
continuidade.

O branch Cloud não default `mcf/hermes-relay-bootstrap-20260823@23e4e6c` contém probes
bloqueados/falhos. Ele não é `main`, lineage seguro de recovery, backend gratuito qualificado,
executor admitido ou autorização de remoto/VPS/SSH. Sua evidência preserva tentativas e bloqueios,
sem mudar Q5, Q11 ou Q16.

Os drafts #176, #177 e #182 permanecem inputs concorrentes fora de `main`: audit ledger de
sucessão, proposta de qualificação AGDO v1.3 e runbook/evidência dual-VPS. Checks ou field evidence
nesses branches não os tornam runtime/capability canônicos, não autorizam merge por esta missão e
não abrem placement remoto/VPS. O PR #180 saiu dessa lista ao ser mergeado como reconciliação
documental; ele não materializa runtime ou authority.

## 4. Fontes de verdade e ownership

| Classe                                                         | Owner                           | Fonte canônica                                           | Consumidores                           | Confusão proibida                                                      |
| -------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| Constituição, autoridade humana, políticas e contratos globais | MCF / LEANDRO                   | Git do MCF, ADRs e schemas no SHA aplicável              | Todos os componentes                   | Prompt ou modelo não altera Constituição.                              |
| Código, decisões e documentação de um projeto                  | Repositório proprietário        | Git do próprio projeto no SHA exato                      | Context Fabric, agentes e auditoria    | Registry não substitui o repositório.                                  |
| Identidade cross-project                                       | MCF                             | Project Registry versionado                              | Recovery, Mission Control e agentes    | Nome do repositório não é o `project_id`.                              |
| Entrada de continuidade                                        | Cada projeto                    | `.mcf/project-capsule.yaml`                              | Context Recovery                       | Capsule é derived view, não estado live.                               |
| Intenção e realidade do projeto                                | Projeto / MCF methodology       | PIP/PRR e decisões versionadas                           | Planejamento e execução                | Intenção humana não é inferida de código.                              |
| Missões, fases, handoffs, tentativas e transições              | MCF                             | PostgreSQL/event ledger do runtime                       | Orquestração e observabilidade         | Não chamar isso de Cognitive Ledger.                                   |
| Memória cognitiva                                              | Cognitive Ledger                | Registros persistidos pelo Ledger no boundary autorizado | MCF read adapter e agentes autorizados | Memória não vira automaticamente evidência, decisão ou estado live.    |
| Infra declarativa e bridges                                    | Cloud Infrastructure            | Git do Cloud                                             | MCF, operadores e auditoria            | Código do bridge não prova instalação ou conexão.                      |
| Estado operacional de infraestrutura/efeito                    | Provider/Cloud live             | Read-back contemporâneo pela rota autorizada             | MCF e TriView                          | Snapshot local não prova VPS/currentness.                              |
| Capability intent/contrato                                     | MCF                             | Capability Registry versionado                           | Router, policy e UI                    | Existência não implica conexão, autorização, atividade ou verificação. |
| Apresentação e Decision Inbox                                  | TriView / Mission Control       | Read models derivados                                    | LEANDRO e agentes                      | UI não é fonte de verdade nem autoridade.                              |
| Segredos e credenciais                                         | Boundary de secrets do ambiente | Secret store/env/broker autorizado                       | Adapters estritamente necessários      | Nunca Git, Capsule, prompt, Receipt público ou memória.                |

## 5. Relação entre lineages

### NextGen rodada 1

- preservada em `planning/mcf-nextgen-discovery@f9813af`;
- Q1–Q16 e F1.3 completos no registro histórico;
- nenhuma tentativa de merge direto dessa branch;
- serve como evidência de intenção e decisões, não como implementação atual.

### v1.1

- lineage executado e publicado separadamente;
- seus contratos e runtime existentes são base de evolução;
- a regra `NO_PARALLEL_RUNTIME` permanece vinculante.

### v1.2.0 / PR #175

- release durável `v1.2.0@5c7f983` com Human Control e GUI autorizada;
- primitive/checkpoint interno testado, sem pause/resume persistente no MissionRuntime;
- precedência e testes HDF/GUI são compatibility surfaces obrigatórias.

### GUI/window / PRs #179 e #180

- protocolo/schema/fixtures/qualifier estão no `main` pós-release;
- não há producer/consumer/runtime wiring nem autoridade de UI;
- status pós-merge reconciliado pelo PR #180, sem producer/consumer/runtime wiring.

### Human authority / PR #181

- decisão terminal no fluxo implementado exige conta autenticada reservada e `sourceRef` gerado no servidor;
- Authority Envelope, Human Decision chain e authority binding versionado continuam target da F1.4.

### Context Fabric / Issue #147

- Federated Context Kernel forneceu a primeira materialização compatível com Q2/Q8/Q14;
- Registry/Capsules/recovery atuais serão reutilizados;
- o checkpoint arquitetural integral continua maior que o que foi implementado.

### Continuidade de agente / draft PR #174

- input concorrente não canônico no snapshot;
- se mergear, deve ser reconciliado como contrato/referência única antes de NX-0;
- não pode duplicar Project Capsule, memory/state ownership ou writer.

### Cloud Hermes / branch não default

- os probes em `mcf/hermes-relay-bootstrap-20260823@23e4e6c` permanecem evidência histórica do branch;
- não substituem Cloud `main`, recovery seguro, conformance de executor ou gates de placement/remoto.

### Outros drafts concorrentes #176/#177/#182

- preservam audit ledger, proposta de qualificação e runbook/evidência VPS em lineages próprios;
- não integram `main`, não autorizam implementação NextGen nem alteram o fechamento de VPS/provider.

### Mission Control / Issue #141

- corresponde principalmente a Q9;
- continua em discovery e não recebe autorização por este documento;
- deve consumir runtime/contexto, nunca duplicá-los.

### Memória live / Issue #164

- o Ledger já possui primitivas provider-side de escrita no lineage próprio, mas o MCF ainda não
  expõe uma capability governada de write;
- o PR #168 integrou artifacts da Fase 2 e o dispatch do roster sem atribuir crédito simulado;
- `GATE-RUNTIME-REALITY` foi satisfeito live somente para identidade/configuração dos 29 managed
  agents; nenhum task run Brainbase ocorreu, o PR #169 foi fechado sem merge e esse caminho billable
  está fora da política zero-cost desta proposta;
- o PR #170 tentou o caminho local Ollama/Qwen, mas o primeiro output de Miriam foi rejeitado por
  ausência do handoff obrigatório; um run intermediário foi cancelado por concurrency antes de
  executar agentes. A segunda tentativa efetiva, run `32710229432`, progrediu até 6/15 e falhou em
  Tiago por dois headings ausentes. Seus seis outputs anteriores possuem atribuição e validação
  estrutural no log, mas não foram publicados nem promovidos ao PRF; a prova subsequente de não
  mutação do repositório foi pulada. Não houve chain concluída, artifact de missão aceito, origin proof
  confiável ou crédito promovido por este pacote, e o PR ativo continua fora de `main` até checks e
  merge próprios;
- provider dedicado, captura, autoridade, formato, correção, confirmação e prova receberam decisões
  iniciais próprias; authN/authZ, integração, live, dados reais, semver e release continuam nos gates
  da missão;
- este documento não autoriza integração write, provider live ou release.

## 6. Disposition dos 29 agentes

```yaml
named_agent_catalog:
  historical_identity: PRESERVE
  current_official_installation_profile: LEANDRO_DEFAULT_TEAM_PROFILE
  count: 29
  core_schema: GENERIC_AGENT_CONTRACT
  core_requires_fixed_names: false
  automatic_simultaneous_execution: false
  cognitive_independence_claim: REQUIRES_EVIDENCE
```

Isso preserva contratos, papéis e seleção por competência sem transformar os nomes em requisito constitucional para qualquer instalação futura do Core.

## 7. Decisões reconciliadas que a F1.4 deve preservar

```text
AGENT != MODEL
CAPABILITY != AUTHORITY
MEMORY != EVIDENCE
CAPSULE != SOURCE_OF_TRUTH
MODEL_OUTPUT != MATERIAL_AUTHORIZATION
UI != AUTHORITY
HUMAN_NAME_IN_PAYLOAD != AUTHENTICATED_HUMAN_AUTHORITY
HUMAN_CONTROL -> ZERO_NEW_MATERIAL_ADMISSION_UNTIL_AUTHENTICATED_RESUME
AUTHORIZED_GUI != TRIVIEW != MISSION_CONTROL
LOGICAL_BOUNDARY != PHYSICAL_SERVICE
ONE_CANONICAL_MATERIAL_WRITER_PER_BOUNDARY
NO_PARALLEL_MCF_RUNTIME
NO_UNGOVERNED_DUAL_WRITE
STATE_TRANSITION_AND_LEDGER_APPEND_ATOMIC_OR_EQUIVALENT
NO_PAID_AI_API_FALLBACK
UNKNOWN_OR_STALE_COST -> BACKEND_INELIGIBLE
TARGET_ARCHITECTURE_DECISION != IMPLEMENTATION_AUTHORIZATION
```

## 8. Pontos ainda sujeitos à decisão de LEANDRO

Esta reconciliação recomenda, mas não consome, os seguintes gates:

1. aprovação da matriz Q1–Q16 desta revisão;
2. aprovação da arquitetura F1.4 vinculada ao SHA/digest exato;
3. autorização do primeiro boundary de implementação;
4. qualquer mudança em provider live, Cognitive Ledger write, TriView commands, Cloud remoto/VPS ou produção;
5. qualquer exceção futura à política de zero gasto em APIs de IA.

## 9. Resultado desta revisão

```yaml
round_1_preserved: true
round_2_reconciliation_candidate: complete
target_architecture_name: GOVERNED_PORTABLE_MULTIAGENT_RUNTIME
formal_architecture_candidate: ../architecture/MCF-NEXTGEN-FORMAL-TARGET-ARCHITECTURE-001.md
implementation_plan_candidate: ../superpowers/plans/2026-08-24-mcf-nextgen-reconciled-implementation-plan.md
implementation_authorized: false
next_gate: LEANDRO_REVIEWS_EXACT_PLANNING_REVISION
```
