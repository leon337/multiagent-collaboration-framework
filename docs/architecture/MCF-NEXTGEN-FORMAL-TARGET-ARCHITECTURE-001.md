# MCF NextGen — Arquitetura-alvo formal reconciliada

- **ID:** `MCF-NEXTGEN-FORMAL-TARGET-ARCHITECTURE-001`
- **Fase:** `F1.4 — Arquitetura alvo formal`
- **Status:** `PROPOSED_FOR_LEANDRO_REVIEW`
- **Mission:** `MCF-NEXTGEN-RECONCILIATION-F14-001`
- **Issue:** [#165](https://github.com/leon337/multiagent-collaboration-framework/issues/165)
- **Baseline de abertura:** `main@21c667057617b9cd2090afaab42dc9c7806eef02`
- **Baseline reconciliado antes do PR:** `main@42d941b5bc299cb7121175db0367b780d381c93e`
- **Disposition:** [`MCF-NEXTGEN-ROUND-2-DISPOSITION-001.md`](../proposals/MCF-NEXTGEN-ROUND-2-DISPOSITION-001.md)
- **Arquitetura:** `GOVERNED_PORTABLE_MULTIAGENT_RUNTIME`
- **Migração:** `INCREMENTAL_COMPATIBILITY_FIRST`
- **Protótipo autorizado:** `false`
- **Implementação autorizada:** `false`
- **Produção autorizada:** `false`

## 1. Decisão arquitetural candidata

O MCF NextGen deve realizar a direção histórica `GOVERNED_PORTABLE_MULTIAGENT_RUNTIME` por evolução incremental do runtime atual no lineage v1.2.0 e do Context Fabric.

Não será criado um “MCF 2” paralelo. MissionRuntime, PostgreSQL, event ledger, Human Delegation Firewall, PermissionEngine, ExternalActionDispatcher, contratos v1.1 e Context Fabric permanecem as fundações executáveis.

```yaml
target_architecture: GOVERNED_PORTABLE_MULTIAGENT_RUNTIME
realization_strategy: INCREMENTAL_COMPATIBILITY_FIRST
core_shape: MODULAR_MONOLITH_FIRST
logical_boundaries_may_be_colocated: true
second_runtime: forbidden
second_operational_transition_ledger: forbidden
second_permission_system: forbidden
paid_ai_api: forbidden
```

Esta especificação é uma candidata formal. Ela só se torna arquitetura aprovada após LEANDRO vincular a decisão à revisão exata que estiver no `main`.

## 2. Objetivos

1. permitir que agentes recuperem e compreendam o ecossistema sem depender do chat anterior;
2. separar identidade de agente, backend cognitivo, capability, autoridade e placement;
3. transformar missões em planos governados, persistentes e verificáveis;
4. preservar um único escritor material por boundary;
5. permitir execução local, gratuita e portátil antes de qualquer placement remoto;
6. manter LEANDRO como autoridade humana final sem torná-lo operador técnico padrão;
7. oferecer observabilidade e Decision Inbox sem converter a UI em autoridade;
8. provar continuidade, segurança, custo zero e compatibilidade por testes e evidência.

## 3. Restrições constitucionais

```text
LEANDRO = FINAL_HUMAN_AUTHORITY
AGENT != MODEL
AGENT != COGNITIVE_EXECUTOR
CAPABILITY != AUTHORITY
PLACEMENT != AUTHORITY
MEMORY != EVIDENCE
MEMORY != LIVE_STATE
PROJECT_CAPSULE != SOURCE_OF_TRUTH
RECOVERY_RECEIPT != SOURCE_OF_TRUTH
UI != AUTHORITY
MODEL_OUTPUT != SAFE_MATERIAL_COMMAND
COGNITIVE_OUTPUT != GOVERNED_EXECUTION_RECEIPT
AGENT_ID_SUPPLIED != PROVEN_EXECUTION_IDENTITY
MCF_ACCEPTANCE_RECEIPT != ARTIFACT_ORIGIN_PROOF
ORIGIN_PROOF != QUALITY_PROOF != INDEPENDENCE_PROOF
POLICY_ENFORCEMENT != PROMPT
LOGICAL_BOUNDARY != PHYSICAL_SERVICE
ONE_CANONICAL_MATERIAL_WRITER_PER_EXECUTION_BOUNDARY
NO_UNGOVERNED_DUAL_WRITE
STATE_TRANSITION_AND_LEDGER_APPEND_ATOMIC_OR_EQUIVALENT
UNKNOWN != PASS
STALE != CURRENT
PAID_AI_API = FORBIDDEN
PAID_AI_API_FALLBACK = FORBIDDEN
MERGE != RELEASE != PRODUCTION_DEPLOY
```

## 4. Visão lógica

```text
 ChatGPT / CLI / Web / Host/DSH adapters             TriView / Mission Control
       HOST_MEDIATED proposals                           derived read models
                  |                                             ^
                  v                                             |
          MCF API + Host Boundary -------------------------------+
                  |
        Constitutional Kernel + Governance
                  |
      Identity / Policy Decision / HDF / Enforcement
                  |
        Context Fabric + Project Registry
                  |
      Multi-subject Capability Registry
                  |
   Task Requirements -> Mission Graph -> Execution Binding
                  |              |                |
                  |              |          agent/model/tool/worker
                  v              v
        MissionRuntime + PostgreSQL event/state/receipt ledger
                  |             ONE OPERATIONAL WRITER
                  +---- Cognitive Execution Admission
                  |       -> authenticated executor adapter
                  |       -> transport HOST_MEDIATED / PROGRAMMATIC
                  |       -> locality HOST_BOUNDARY / IN_PROCESS_LOCAL / REMOTE
                  |       -> cost HOST_ENTITLEMENT / LOCAL_COMPUTE / FREE_VERIFIED_API
                  |       <- validated artifact + execution Receipt
                  |
                  v
  Effect Admission -> durable reservation -> governed adapter/bridge
          |                                      |
          v                                      v
 MCF -> Ledger READ boundary           Cloud local workers/bridges
 memory with provenance                infra/effect enforcement
          |                                      |
          +-------------- read-back/evidence ----+
                                 |
                         state/events/receipts

 Git dos quatro repositórios -> Registry + Capsules -> recovery/provenance
```

Os blocos são boundaries lógicos. O deployment inicial pode continuar no modular monolith NestJS/PostgreSQL existente.

O PR #171 adicionou ao `main` evidência E2E do canal externo MESTRE↔Ox via DeepSeek Harness
(DSH). Essa capacidade prova transporte máquina-a-máquina, continuidade por sessão e logs do provider
na topologia observada; ela é um **executor-adapter candidato**, não uma dependência do MCF nem uma
implementação antecipada deste diagrama. O canal ainda não possui Agent/Backend Registry, Execution
Binding, Request/Receipt assinado, trust-root admission ou replay protection NextGen.

O lineage v1.2.0 também adicionou três deltas que esta arquitetura deve preservar sem promovê-los a
uma implementação NextGen completa:

- o PR #175 tornou vigente a governança Human Control e a GUI autorizada, além de uma primitive
  interna testada de reconhecimento/checkpoint; não conectou pausa/retomada persistente ao
  MissionRuntime;
- o PR #179 mergeou protocolo, schema, fixtures e qualifier puro da sucessão cross-chat por
  GUI/window; não conectou producer, consumer nem controle de janela ao runtime, e o status textual
  pós-merge ainda possui correção concorrente no draft PR #180;
- o PR #181 vinculou a decisão humana terminal, na rota implementada, à conta autenticada reservada e
  a um `sourceRef` gerado no servidor; ele fecha spoofing pelo caller nesse boundary, mas não
  materializa o Authority Envelope genérico, Decision Inbox ou suspensão persistente NextGen.

## 5. Planos e responsabilidades

### 5.1 Constitutional Kernel

Responsável por invariantes que configuração comum não pode enfraquecer:

- identidade e autoridade;
- delegação atenuante;
- semântica de HUMAN_GATE;
- precedência de `HUMANO NO CONTROLE` sobre TEAM_FIRST, standing authorization e novas ações;
- isolamento por projeto e security domain;
- default deny;
- validação da raiz de policy e extensões;
- proibição de API de IA paga e de fallback pago nesta arquitetura.

Policy decide dentro dessas regras; policy comum não redefine a própria Constituição.

O bootstrap trust é explícito e version-bound:

```yaml
bootstrap_trust:
  instance_id:
  core_contract_version:
  trusted_authority_binding:
  trusted_policy_root:
  canonical_state_locator:
  trusted_extension_policy:
```

Alterar qualquer binding acima é efeito privilegiado; nem policy comum, modelo, agente, UI nem LÉO
podem redefinir a autoridade humana final de LEANDRO.

O comportamento vigente pós-PR #181 deriva `accountId` da sessão autenticada, exige o UUID reservado
configurado no servidor e canonicaliza a provenance/`sourceRef` de decisões humanas terminais antes
da execução e persistência. Ainda não existe um `authorityBindingRef` contratual nessa rota. A
evolução para `McfAuthorityEnvelopeV1` e `McfHumanDecisionReceiptV1` deve preservar o piso fail-closed
atual e adicionar o binding versionado: nome, `decidedBy`, `accountId` ou `sourceRef` fornecidos no
corpo nunca são prova de autoridade.

`HumanControlCheckpoint`, introduzido como primitive interna no PR #175, representa suspensão e
estado preservado; `McfHumanDecisionReceiptV1` representa uma decisão humana tipada e vinculada a
objeto/estado/spec. Um não substitui o outro. O checkpoint não integra o catálogo público desta
F1.4; promovê-lo a contrato público ou criar um novo envelope de suspensão exige reabrir catálogo,
contagem e schemas antes de código.

O recognizer interno atual de Human Control compara `actorId` textual com `leandro`; o PR #181 não o
conectou à autenticação. Qualquer wiring persistente deve substituir essa confiança nominal pela
conta humana reservada autenticada e por provenance server-side antes de admitir o comando.

### 5.2 Context and Continuity Plane

Reutiliza o Context Fabric atual:

- Project Registry no MCF;
- Capsule versionada em cada repositório;
- Truth Contracts;
- provenance, freshness e drift;
- recovery determinístico e fail-closed;
- Receipt como evidência.

O Context Fabric não replica todo estado live, não guarda payload de memória do Ledger e não se torna um banco global de verdade.

O draft PR #174 propõe uma Agent Continuity Capsule de agente/sessão, mas não integra este baseline.
Se ela ou contrato equivalente entrar em `main` antes de NX-0, uma disposition de equivalência deve
mapear campo, owner, writer, fonte e consumidor contra Project Capsule v1/v2, Agent Contract,
Authority Envelope e Completion Contract. Ela pode ser reutilizada/adaptada ou permanecer artifact
subtype/referência quando sua semântica for específica; nunca cria segunda Project Capsule, fonte de
estado/memória ou writer de continuidade. Divergência material reabre a F1.4 e o catálogo.

### 5.3 Capability Plane

Evolui o Registry atual sem criar um segundo Registry. Sujeitos candidatos:

```text
PROJECT
AGENT
MODEL_BACKEND
COGNITIVE_EXECUTOR
WORKER
TOOL
EXTENSION
```

Cada capability separa:

- definição/contrato;
- implementação;
- conexão;
- autorização;
- runtime availability;
- verificação;
- provenance e freshness.

Self-claim, preço desconhecido ou evidência expirada não torna um backend elegível.

### 5.4 Control and Mission Graph Plane

Adiciona uma projeção de grafo sobre o MissionRuntime existente:

- nós e dependências;
- joins explícitos;
- read/write sets;
- attempts, retries e stop conditions;
- budgets de profundidade, fanout, tempo e custo;
- replanning versionado;
- Completion Contract.

O primeiro estágio é shadow e sem efeitos. Depois, graphs aprovados compilam para fases/submissões atuais. Grafo esgotado não significa missão concluída sem critérios de aceite.

### 5.5 Execution Binding Plane

Um binding elegível une, na mesma decisão verificável:

- requisitos da tarefa;
- Agent Contract;
- backend cognitivo;
- executor cognitivo e capability revision/digest;
- tools;
- worker;
- placement;
- classificação/locality dos dados;
- autoridade e policy aplicáveis;
- custo máximo, expiração e digest.

O resolver pode materializar primeiro um binding candidato em shadow, contendo requisitos de
placement mas sem worker/Receipt. Um binding só se torna `FINALIZED_ELIGIBLE` e executável quando um resolver
autorizado adiciona worker e Placement Receipt compatíveis; os dois estados são condicionais no mesmo
schema e no union discriminado TypeScript, possuem digests/revisions distintos e nunca são promovidos
por preenchimento implícito. Candidate proíbe worker/Receipt no type e schema; finalized exige ambos e
uma referência de supersessão não nula. Todo Binding usa a identidade comum
`contractId/revisionId/contentDigest`; um `McfContractRefV1` aponta exatamente para esses campos, sem
aliases de identidade. Candidate e finalized preservam o `contractId`, e finalized aponta para a
revisão/digest candidata anterior.

Os wire values são exatamente `CANDIDATE_ELIGIBLE` e `FINALIZED_ELIGIBLE`. A transição preserva
mission/phase/task/attempt, Mission Graph revision/node, Task Requirement, Agent, Backend, Cognitive
Executor, tools, Placement Request, transporte/localidade/custo, data boundary, Authority Envelope,
policies, output schema e custo máximo; preserva `contractId`, não amplia `expiresAt` e muda somente
revision/digest, resolution, supersession, worker e Placement Receipt. Divergência bloqueia a
finalização.

Finalização também é uma relação, não só formato: o Placement Receipt deve estar `PLACED`, referir o
mesmo Placement Request e selecionar exatamente o worker do Binding. Receipt `BLOCKED`, worker
divergente, lineage incorreto ou mudança dos campos imutáveis do candidate bloqueiam a finalização.
NX-5 limita essa finalização a host boundary ou processo local; placement Cloud local é extensão
posterior de NX-6, e remoto/VPS continua bloqueado.

Se qualquer hard requirement falhar, o estado é `BLOCKED_NO_ELIGIBLE_BINDING`, nunca fallback degradado silencioso.

### 5.6 Cognitive Execution Plane

O runtime atual alcança `READY_AGENT`, mas ainda depende de `execution_evidence` fornecida externamente.
Isso é um boundary de compatibilidade, não prova de que um agente ou backend executou trabalho cognitivo.
O NextGen só fecha essa lacuna pelo fluxo governado:

```text
READY_AGENT
  -> McfCognitiveExecutionRequestV1
  -> binding/auth/policy/data/cost/backend freshness validation
  -> durable attempt reservation
  -> authenticated executor adapter
  -> execution transport: HOST_MEDIATED | PROGRAMMATIC
  -> executor locality: HOST_BOUNDARY | IN_PROCESS_LOCAL | REMOTE
  -> AI cost class: HOST_ENTITLEMENT | LOCAL_COMPUTE | FREE_VERIFIED_API
  -> output-schema and artifact-integrity validation
  -> McfCognitiveExecutionReceiptV1
  -> canonical runtime transition
```

O request vincula mission/phase/task/attempt, Agent Contract, binding e backend revisions/digests,
referências de input, classificação de dados, output schema, timeout e orçamento. O Receipt vincula o
request exato, Agent Contract realmente executado, identidades de backend/executor, transporte,
localidade e classe de custo reais, timestamps, status, uso/custo, validação e manifests de artefatos com digest, provenance e
retention, media type, tamanho e locator; não registra chain-of-thought nem segredo. A attestation assinada vincula trust root,
signer/key, canal autenticado, request, binding, attempt, agent/backend/executor,
transporte/localidade/classe de custo e digest do
manifest de artifacts. O próprio emissor nunca decide que a origem foi verificada.

O objeto completo de claims inclui receipt contract/revision id, scheme, trust root, signer/key,
channel binding, refs completos de request/binding/agent/backend/executor, attempt, os três eixos, timestamps, status, usage, validation
e artifact-manifest digest. Todo campo top-level repetido deve ser deep-equal ao claim assinado. Os
claims são serializados por JSON Canonicalization Scheme (RFC 8785). Os bytes assinados são
`UTF8("MCF_COGNITIVE_EXECUTION_ATTESTATION_V1\n") || UTF8(JCS(claims))`; o SHA-256 desses bytes é o
`signedPayloadDigest`. O scheme v1 é Ed25519, a assinatura usa base64url sem padding e todos os
digests usam SHA-256 lowercase-hex. Request, Binding e artifact manifest possuem domain separators e
JCS próprios definidos no contrato; formato alternativo, identidade ou campo crítico mutável fora da
assinatura são inválidos.

O content digest do próprio Receipt é calculado depois da assinatura; por isso os claims incluem seu
`contractId/revisionId`, mas não um digest autorreferente. O checker recalcula os digests dos refs e o
manifest a partir dos objetos exatos. Retorno sem attestation não é Receipt cognitivo conforme: fica
como evidence/admission state `UNVERIFIED`, sem transição ou crédito, até Receipt válido.

Binding, Request, Backend, Receipt e claims devem concordar em transporte, localidade e classe de
custo. Uma referência/digest correto não permite ao Request escolher outra combinação. O checker
relacional NX-0 prova consistência estrutural/canônica; somente o verifier/admission stateful NX-5
prova assinatura, trust, channel binding, replay e origem.

O verifier do NX-5 resolve a trust root e a chave fora do Receipt, valida assinatura e channel
binding, confere todos os claims, rejeita replay e produz um resultado interno confiável ligado à
policy revision. Só a admissão do runtime que recebe esse resultado pode promover a origem a
`VERIFIED`; schema ou conformance pura de NX-0 validam apenas forma/relações e jamais concedem
crédito de origem.

Um transporte `HOST_MEDIATED` produz uma solicitação explícita e aguarda retorno autenticado pelo
Host Boundary; ele nunca é anunciado como invocação automática. Transporte `PROGRAMMATIC`,
localidade e classe de custo são avaliados separadamente: remoto não significa pago, local não
significa gratuito e o rótulo free não define placement. Adapters programáticos originam execução
somente quando habilitados, autenticados e contemporaneamente elegíveis. Evidence
arbitrária, ausente, repetida, de attempt diferente ou sem Receipt verificável não conclui uma fase
NextGen. Texto ou artifact `HOST_MEDIATED` sem origin attestation permanece `UNVERIFIED` e não concede
crédito a agente nomeado. Nenhum output cognitivo pode contornar o Governed Effect Plane para causar
efeito material.

Identidade/configuração de executor comprovada em sistema externo é precondition útil, mas não prova
task run, artifact origin, qualidade nem independência. Executor que declara runs billable é
inelegível sob `max_paid_ai_cost=0`, mesmo que outro lineage possua gate financeiro pendente ou
futuramente aprovado.

O canal DSH documentado no PR #171 melhora a evidência de viabilidade de um adapter externo, mas não
passa automaticamente o gate acima. O nome observado `x-preview-f-free` não é prova suficiente de
preço, quota, data policy, ausência de billing account ou fallback pago. Para ser candidato
`FREE_VERIFIED_API`, uma missão NX-5 separada deve revalidar esses fatos contemporaneamente, registrar o
adapter/canal/trust root, produzir Receipt vinculada ao request/binding exatos e passar conformance
sem acessar VPS/provider fora da autorização aplicável.

O branch Cloud não default `mcf/hermes-relay-bootstrap-20260823@23e4e6c` também não satisfaz esse
gate. Seus probes preservados são resultados bloqueados/falhos, não deployment, placement, custo
zero, conformance ou executor admission; o branch não substitui `main`, o lineage seguro de recovery
nem a proibição de remoto/VPS/SSH desta missão.

### 5.7 Operational State and Evidence Plane

O PostgreSQL do MCF continua owner de:

- missões e fases;
- eventos e transições;
- handoffs;
- attempts e reservas de efeitos;
- receipts e evidência operacional;
- estado de completion/recovery.

O nome canônico será `MCF Operational Transition Ledger`. Ele não é o produto Cognitive Ledger.

Uma transição canônica e o append correspondente no transition ledger devem ocorrer na mesma
transação ou sob garantia equivalente comprovada. Falha parcial nunca pode publicar estado novo sem
seu evento/lineage, nem evento canônico sem estado reconciliável.

### 5.8 Governed Effect Plane

Toda ação material segue:

```text
typed proposal
  -> task requirements
  -> exact execution binding
  -> authenticated principal
  -> HDF / Standing Authorization / HUMAN_GATE
  -> PermissionEngine
  -> durable effect reservation + idempotency
  -> adapter or Cloud bridge
  -> provider-side enforcement
  -> read-back
  -> Receipt/evidence
  -> event/state reconciliation
```

Não há caminho alternativo por plugin, prompt, UI, SQL genérico, SSH direto ou chamada ao provider fora desse boundary.

Quando HUMAN_GATE for exigido, o Authority Envelope aponta para um Human Decision Receipt terminal,
que aponta para o Request exato. A cadeia deve concordar em mission/task/attempt, action/resource,
objeto, estado, spec/digests, validade, opção e supersession; conta autenticada reservada, provenance
server-side e bootstrap authority binding versionado são validados separadamente. Approval de estado
antigo, nome no payload ou Receipt expirado/superseded falha fechado.

`HUMANO NO CONTROLE` preempta novas admissões de graph, cognitive execution, placement e effect. O
target persiste pausa/checkpoint e transition event atomicamente, preserva o estado no restart, leva
operações já em voo a safe point/reconciliation sem retry cego e só retoma por instrução explícita da
conta humana reservada autenticada. O recognizer nominal interno atual não satisfaz esse gate.

### 5.9 Memory Plane

O Cognitive Ledger é owner dos registros de memória que persistir dentro de capability autorizada. No primeiro boundary NextGen:

- apenas leitura allowlisted é reutilizada;
- payload retornado não é persistido no MCF;
- memória preserva provenance e classificação;
- memória não vira decisão, evidência ou estado atual automaticamente;
- leitura bruta continua bloqueada por default;
- o lineage próprio do Ledger já possui primitivas provider-side de escrita;
- a capability governada de write no MCF, authN/authZ e ativação live permanecem missão separada na
  Issue #164 e não são autorizadas por esta F1.4.

### 5.10 Presentation Plane

TriView e Mission Control são projeções:

- apresentam missão, fase, agentes, blockers, gates, capabilities e evidence;
- usam freshness e explicitam `UNKNOWN`/stale;
- não possuem credenciais de provider material por default;
- não alteram estado canônico diretamente;
- futura Decision Inbox envia pedido tipado ao MCF e recebe Receipt.

A GUI autorizada pela v1.2.0 é uma superfície operacional governada; ela não recebe autoridade
própria e não equivale a TriView ou Mission Control. O protocolo de sucessão GUI/window já mergeado
pelo PR #179 é trace/evidence existente a ser referenciado ou evoluído, nunca duplicado por um novo
contrato implícito. Até producer/consumer/runtime wiring e qualification pós-merge próprios, ele não
prova controle automático de janela nem abre command path.

### 5.11 Assurance, Evaluation and Portability Plane

Assurance consome contratos e evidências do runtime; não cria uma segunda fonte de verdade nem recebe
autoridade operacional por avaliar o sistema.

Toda alegação material de valor Q13 exige `McfEvaluationContractV1` com digest congelado **antes** do
primeiro run comparativo:

```yaml
evaluation_contract:
  hypothesis:
  evaluation_question:
  candidate:
  baseline:
  baseline_mode:
  scenario_pack_version:
  controlled_factors:
  intentionally_different_factors:
  hard_constraints:
  metrics:
  grader_contract:
  repetition_plan:
  cost_accounting:
  decision_rule:
  generalization_scope:
```

Mudança após observar resultado cria nova revisão/lineage; não reescreve o contrato anterior. Ground
truth determinístico é preferido, self-grading não basta e nenhuma avaliação pode consumir API de IA
paga.

Toda alegação Q14 declara uma matriz de portabilidade por `RUNTIME`, `PROVIDER`, `DATA`,
`OPERATIONAL`, `PROJECT_DOMAIN`, `CONTEXT` e `EXIT`, além do compatibility envelope, artefato exato,
condições clean-room, migration checkpoint, authority rebinding e negative tests. O resultado é um
`McfPortabilityReceiptV1` classificado como `DECLARED`, `CONFORMANCE_TESTED`, `MIGRATION_PROVED` ou
`FIELD_PROVED`. Recovery estrutural 4/4 é evidência de Context, não prova portabilidade integral.

## 6. Ownership resumido

O mapa normativo completo está na [reconciliação Q1–Q16](../proposals/MCF-NEXTGEN-ROUND-2-DISPOSITION-001.md#4-fontes-de-verdade-e-ownership).

| Boundary                                     | Owner                                     |
| -------------------------------------------- | ----------------------------------------- |
| Constituição, contracts, policies e Registry | MCF Git                                   |
| Código/decisões de cada projeto              | Git do projeto proprietário               |
| Capsule                                      | Repositório do projeto, como derived view |
| Missão/transições/evidence operacional       | MCF PostgreSQL                            |
| Memória cognitiva                            | Cognitive Ledger                          |
| Infra declarativa/bridges                    | Cloud Infrastructure                      |
| Estado real de provider/infra                | Provider live pela rota autorizada        |
| Cockpit/read models                          | TriView/Mission Control                   |
| Segredos                                     | Secret boundary do ambiente               |

## 7. Contratos candidatos

Todos os contratos serão aditivos, versionados, schema-validatable e acompanhados de exemplos válidos/negativos.

| Contrato                                       | Responsabilidade mínima                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `McfAgentContractV1`                           | identidade, profile/version, papel, objetivos, capabilities, I/O, requisitos/ceiling de authority, lifecycle, provenance e backend requirements  |
| `McfTaskRequirementContractV1`                 | hard requirements, soft preferences, data/locality, tools, quality floor, risco, prazo e `max_paid_ai_cost=0`                                    |
| `McfSubjectCapabilityV2`                       | capability para project/agent/model/cognitive-executor/worker/tool/extension com estados e freshness separados                                   |
| `McfModelBackendContractV1`                    | capacidades, transport/locality suportados, data policy, cost class/billing, free quota, health, evidence e expiry                               |
| `McfMissionGraphPlanV1`                        | versão/digest, nodes, deps, joins, read/write sets, budgets, attempts, idempotency e acceptance                                                  |
| `McfExecutionBindingV1`                        | task, agent, backend, executor capability, tools, candidate/finalized placement, data boundary, authority/policy, output contract, expiry/digest |
| `McfCognitiveExecutionRequestV1` / `ReceiptV1` | attempt/binding/backend exatos, executor autenticado, transport/locality/cost, input/output schema, uso e artifacts com digest/provenance        |
| `McfPlacementRequestV1` / `ReceiptV1`          | requisitos, candidatos recusados, worker selecionado, revisão, artifact/config digest e fencing quando aplicável                                 |
| `McfAuthorityEnvelopeV1`                       | principal/delegation chain, mission/task/attempt, action/resource/env, policy, custo, expiry e HUMAN_GATE version-bound                          |
| `McfEffectRequestV2` / `ReceiptV2`             | binding digest, preconditions, idempotency, before/after/read-back e reconciliation sobre dispatcher atual                                       |
| `McfProjectCapsuleV2`                          | sources/SHAs, generated/observed timestamps, freshness, phase/mission, next action e blockers, sempre derived                                    |
| `McfCapsuleVersionPointerV1`                   | project, paths/digests v1+v2, versão preferida, provenance, geração e cutover revision sem mudar o Registry v1                                   |
| `McfMemoryReadEnvelopeV1`                      | operação allowlisted, purpose/scope, provenance, freshness, resposta limitada e `persist_payload=false`                                          |
| `McfHumanDecisionRequestV1` / `ReceiptV1`      | objeto/estado/spec version, motivo, opções, recomendação, risco, evidence, expiry e supersession                                                 |
| `McfCompletionContractV1`                      | outputs, evidence, reviews, gates e blockers permitidos                                                                                          |
| `McfEvaluationContractV1`                      | hipótese, candidato/baseline, cenários, hard constraints, métricas, grader, repetição, custo, decision rule e generalização                      |
| `McfPortabilityClaimV1` / `ReceiptV1`          | matriz/camada, envelope, artifact, clean room, migration, conformance/negative tests, rebinding, integridade e resultado                         |

A tabela contém 17 famílias e 22 contratos concretos: cada membro de um par Request/Receipt ou
Claim/Receipt é um contrato próprio no catálogo e possui type/export, schema e fixtures positiva e
negativa 1:1.

Todos os 22 contratos expõem identidade versionada resolvível (`contractId`, `revisionId`,
`contentDigest`), inclusive Capsule v2, version pointer e Memory Read. O Completion Contract mantém
somente critérios imutáveis; `PENDING | PROVEN` pertence ao estado/receipt de completion do runtime.
Um Completion Receipt público novo exigiria reabrir formalmente a F1.4 e a contagem.

Essa contagem cobre somente os contratos públicos **novos** candidatos da F1.4. O trace GUI/window
existente, o `HumanControlCheckpoint` interno e o `HumanAuthorityProof` vigente são superfícies de
compatibilidade, não contratos públicos adicionais implícitos. Promover qualquer um deles ou criar
um envelope público separado reabre formalmente o catálogo e a contagem.

## 8. Modelo dos 29 agentes

```yaml
core:
  understands: McfAgentContractV1
  requires_fixed_named_catalog: false

official_leandro_installation:
  profile_id: LEANDRO_DEFAULT_TEAM_PROFILE
  named_agents: 29
  selection: capability_and_risk_based
  simultaneous_execution_required: false
  cognitive_independence: evidence_required
```

Os contratos atuais permanecem válidos durante a migração. O profile machine-readable será derivado e comparado com a matriz oficial antes de qualquer substituição.

## 9. Política constitucional de custo zero para IA

A regra é zero gasto variável com APIs de IA. Ela não afirma que notebook, VPS ou infraestrutura existente não tenham custo próprio.

```yaml
ai_cost_policy:
  paid_ai_api_authorized: false
  max_paid_ai_cost: 0
  paid_fallback: false
  requires_billing_account: false
  recognized_execution_transports:
    - HOST_MEDIATED
    - PROGRAMMATIC
  recognized_executor_localities:
    - HOST_BOUNDARY
    - IN_PROCESS_LOCAL
    - REMOTE
  eligible_ai_cost_classes:
    - HOST_ENTITLEMENT
    - LOCAL_COMPUTE
    - FREE_VERIFIED_API
  remote_requires_separate_placement_gate: true
  unknown_price_or_quota: BLOCKED
  stale_price_or_quota: BLOCKED
  paid_embedding: BLOCKED
```

### Transportes de execução

`HOST_MEDIATED` significa que a superfície do usuário transporta conscientemente input/output;
`PROGRAMMATIC` significa que um adapter invoca o executor por contrato. Nenhum deles define
localidade ou custo.

### Localidade do executor

`HOST_BOUNDARY`, `IN_PROCESS_LOCAL` e `REMOTE` descrevem onde o executor roda. Localidade nunca
concede autoridade; `REMOTE` exige placement/data/authorization gates próprios.

### Classes elegíveis de custo de IA

`HOST_ENTITLEMENT` usa uma superfície já autorizada pelo usuário sem chave/cobrança variável de API
acionada pelo runtime. `LOCAL_COMPUTE` executa em recurso já autorizado sem chamada paga de API.
`FREE_VERIFIED_API` exige preço zero, quota, data policy, billing/fallback e validade verificados.

Uma mesma execução combina exatamente um valor de cada eixo. Exemplo: o DSH observado seria
`PROGRAMMATIC + REMOTE`; sua classe de custo continua inelegível/unknown até prova contemporânea,
independentemente do sufixo `free` no nome do modelo.

Nenhum trial, crédito promocional, cartão cadastrado ou fallback com cobrança será tratado como gratuito por inferência.

## 10. Segurança e trust boundaries

### 10.1 Identidade e autoridade

- autenticação não equivale a autorização;
- authority envelope é atenuante e não pode ampliar o delegador;
- HUMAN_GATE é vinculado a objeto, ação, estado, spec/revision, prazo e digest;
- decisão humana terminal exige conta autenticada reservada e provenance server-side; o target
  adiciona authority binding versionado e nome no payload nunca satisfaz autoridade;
- `HUMANO NO CONTROLE` suspende novas ações por precedência constitucional; a primitive atual ainda
  não prova pausa/retomada persistente do MissionRuntime;
- mudança de policy, credential, authority binding ou trust root é efeito privilegiado;
- LEANDRO não é convertido em operador técnico padrão.

### 10.2 Dados

Todo dado material carrega, conforme aplicável:

```yaml
security_context:
  project_id:
  security_domain:
  classification:
  trust_origin:
  derived_from:
  retention_policy:
```

Resumo, tradução ou inferência não reduz classificação nem aumenta trust automaticamente.

### 10.3 Segredos

- credenciais pairwise e de menor privilégio;
- secrets nunca em prompt, Capsule, Git, Ledger memory, logs ou evidence público;
- modelos recebem capability, não o valor do secret, quando possível;
- ausência/expiração/revogação falha fechada;
- leitura de secret e mutation de binding exigem trilha própria.

### 10.4 Conteúdo não confiável

Prompt, output de modelo, memória recuperada, página externa, issue, PR e comentário são dados não confiáveis até validação. Nenhum deles altera policy ou cria comando material sozinho.

## 11. Deployment lógico inicial

| Plano                    | Deployment inicial permitido                                                        |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Control / Policy / State | MCF NestJS + PostgreSQL atual em local/staging qualificado                          |
| Context                  | Git/Capsules dos quatro repos + endpoints MCF read-only                             |
| Cognitive                | Host Boundary tipado; adapters local/gratuito autenticados e desligados por default |
| Memory                   | Cognitive Ledger separado, read-only/lab no boundary inicial                        |
| Integration / Execution  | Cloud bridge local e descartável                                                    |
| Presentation             | TriView desktop GET-only e documentação Vercel estática                             |
| VPS / produção           | Fora desta arquitetura de ativação; exigem missões/gates próprios                   |

Nenhum novo serviço always-on, cluster ou Kubernetes é requisito inicial.

## 12. Estados de falha

| Estado                        | Significado e resposta                                                           |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `AMBIGUOUS_CONTEXT`           | identidade do projeto não resolvida; bloquear efeito                             |
| `STALE_CAPABILITY`            | evidência de capability/preço/quota expirada; backend inelegível                 |
| `BLOCKED_NO_ELIGIBLE_BINDING` | nenhum conjunto agent/backend/tool/worker atende os hard requirements            |
| `AUTHORITY_MISSING`           | autorização ausente ou incompatível; default deny                                |
| `SOURCE_UNAVAILABLE`          | fonte necessária indisponível; leitura pode degradar, efeito dependente bloqueia |
| `DRIFT_DETECTED`              | fonte versionada e estado observado divergem; reconciliar antes de claim current |
| `EFFECT_UNKNOWN`              | resultado externo indeterminado; read-back/reconciliation antes de retry         |
| `BUDGET_EXHAUSTED`            | limite de retries/tempo/fanout/quota atingido; parar e preservar evidence        |
| `COMPLETION_UNPROVEN`         | grafo terminou sem cumprir Completion Contract; missão não conclui               |

`BLOCKED_NO_ELIGIBLE_BINDING` é o outcome canônico do resolver NextGen, não uma alteração já
implementada no enum `McfMissionState` v1.1. O boundary NX-2 deve definir e testar o mapping versionado
para o estado v1.1 preservado; consumidor algum pode inventar `BLOCKED` ou `NO_ELIGIBLE_BINDING` como
wire value alternativo.

## 13. Estratégia de migração

Antes do primeiro contrato, o preflight relê `main` e lineages concorrentes. Se o PR #174 ou outro
contrato de continuidade tiver mergeado, a equipe deve rebasear, executar a matriz de equivalência e
atualizar explicitamente disposition, catálogo e contagem de contratos antes de criar
`project-capsule-v2.schema.json`. Dois namespaces não podem esconder dois owners ou writers para o
mesmo estado.

O mesmo preflight caracteriza e congela como compatibility surfaces a governança Human Control
v1.2, a primitive interna de checkpoint, a decisão humana vinculada à conta autenticada do PR #181 e
o trace GUI/window do PR #179. A implementação não pode regredir esses comportamentos, duplicá-los
silenciosamente nem inferir que eles já oferecem pausa persistente, Authority Envelope genérico ou
controle de janela em runtime.

1. preservar os checkpoints históricos e aprovar a disposition Q1–Q16;
2. aprovar esta F1.4 no SHA/digest exato;
3. publicar todos os contratos/schemas e fixtures 1:1 sem runtime wiring;
4. manter `context/projects/*.yaml` e `.mcf/project-capsule.yaml` estritamente v1; publicar primeiro
   apenas o schema de `McfCapsuleVersionPointerV1` e o reader v2 disabled, provando fallback v1 sem
   criar pointer para artifact inexistente;
5. gerar `.mcf/project-capsule.v2.yaml` como sidecar derived em branch/PR próprio de cada repo, sem
   sobrescrever a Capsule v1 nem criar self-reference ao futuro commit; validar e mergear cada
   sidecar com source revisions já conhecidas;
6. depois dos quatro merges, publicar no MCF as entradas aditivas
   `context/capsule-version-pointers/<project_id>.yaml` com paths, digests e SHAs observáveis de v1+v2,
   sem alterar o Registry v1 nem redefinir identidade;
7. habilitar o reader v2 atrás de feature flag com resolução determinística
   `Registry v1 -> version pointer -> sidecar v2`; pointer ausente mantém v1, pointer/digest inválido
   bloqueia somente a claim v2 sem mascarar a falha, e recovery v1/v2 fresh deve passar 4/4;
8. manter um único pipeline lógico de escrita: v1 continua a representação compatível/canônica e v2
   é projeção derivada; nenhum writer v2 independente é permitido durante a coexistência;
9. autorizar cutover v2 somente em boundary separado, depois de inventariar todos os leitores v1 e
   provar uma projeção v1 compatível ou a retirada de todos eles; rollback restaura preferência v1,
   desliga o reader v2 e continua lendo o arquivo v1 nunca sobrescrito;
10. mapear os 29 contratos para Agent Contract/profile sem quebrar `selectedAgents`;
11. executar requirements/graph/router/binding em shadow, zero efeitos e zero API paga;
12. compilar plano aprovado para fases atuais, primeiro sequencial/read-only;
13. validar transporte `HOST_MEDIATED` e um executor fixture real; depois combinações
    `PROGRAMMATIC` + `IN_PROCESS_LOCAL`/`FREE_VERIFIED_API` somente em lab,
    exigindo Request/Receipt cognitivo autenticado e artifact provenance; o canal DSH do PR #171 pode
    entrar como adapter candidato, nunca como bypass dos gates de trust/custo/conformance;
14. validar placement Cloud local; manter remoto/VPS/G2-B fechados;
15. ativar capability por capability, preservando um writer material;
16. congelar Evaluation Contract antes de cada comparação Q13 e produzir value evidence sem avaliação post hoc;
17. executar a matriz/suíte Q14 por camada antes de qualquer claim de portabilidade, cutover ou sunset;
18. tratar provider live, release e produção em missões separadas.

Rollback em cada fase remove o novo reader/projection/feature flag e retorna ao fluxo vigente
compatível com v1.2.0, preservando contratos/runtime v1/v1.1.
Nenhuma etapa apaga ou reinterpreta a Capsule v1. Nenhum sunset ocorre antes de replacement,
conformance, migração e ausência de dependência ativa.

## 14. Architecture Candidate Readiness e Implementation Start Gate

Antes de apresentar o candidato para a decisão de LEANDRO, devem existir:

- [x] lineage e disposition Q1–Q16 preservados nesta proposta;
- [x] mapa de ownership e fontes de verdade;
- [x] boundaries de execução cognitiva e de efeitos definidos;
- [x] política zero-paid-AI-API definida;
- [x] contratos candidatos enumerados;
- [x] dependency/disposition graph Q15 reexecutado contra o baseline reconciliado;
- [x] Evaluation Contract Q13 e gate predeclarado definidos;
- [x] Portability Matrix/Receipt Q14 e conformance negativa definidos;
- [x] estratégia de migração incremental e rollback definida;
- [x] coexistência Capsule v1/v2 com sidecar, pointer, cutover e rollback definida;
- [x] relação com os quatro repositórios definida;
- [ ] revisão independente no HEAD exato do PR;
- [ ] checks documentais e de regressão aplicáveis no HEAD exato;
- [ ] zero achados materiais abertos;

Mesmo depois de o candidato estar pronto para decisão, nenhuma implementação começa antes de:

- [ ] aprovação explícita de LEANDRO vinculada ao SHA/digest final.

## 15. Fora de escopo

Esta F1.4 não autoriza:

- criar contratos/schemas em código;
- alterar banco ou migrations;
- implementar graph, router, binding ou Agent Contract;
- ligar uma API de IA;
- selecionar provider gratuito específico;
- escrever no Cognitive Ledger;
- enviar comandos pelo TriView;
- ativar Cloud remoto, G2-A, G2-B, SSH, VPS ou NODE-01;
- deploy, release, produção ou tratamento de dados reais;
- remover componentes v1/v1.1.

## 16. Próximo gate

O plano executável está em [`2026-08-24-mcf-nextgen-reconciled-implementation-plan.md`](../superpowers/plans/2026-08-24-mcf-nextgen-reconciled-implementation-plan.md).

```yaml
architecture_candidate: complete
architecture_approved: false
implementation_authorized: false
next_action: LEANDRO_REVIEWS_EXACT_PLANNING_REVISION
```
