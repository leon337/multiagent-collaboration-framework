# MCF — Context Fabric & Human–AI Alignment — Discovery Checkpoint 001

**Status:** `DRAFT_DISCOVERY_CHECKPOINT`  
**Canonical:** `false`  
**Implementation authorized:** `false`  
**Architecture formally approved:** `false`  
**Human authority:** LEANDRO  
**Purpose:** preservar o alinhamento conceitual antes da próxima rodada arquitetural, sem transformar hipóteses em regra vigente.

## 1. Por que este checkpoint existe

Este checkpoint registra uma lacuna transversal observada após a evolução do MCF e durante o desenvolvimento de `leon337/cloud-infrastructure`.

O MCF já possui governança forte para missão, agentes, skills, ferramentas, permissões, gates, evidência, handoffs e recuperação. Porém, a experiência operacional mostrou uma assimetria: a engenharia, a arquitetura, a infraestrutura e os testes podem avançar mais rápido do que a documentação canônica, a recuperação de contexto, a descoberta cross-project e a tradução entre linguagem humana e conceitos técnicos.

O resultado prático é carga cognitiva desnecessária sobre LEANDRO. Em situações recorrentes, LEANDRO precisa funcionar como memória externa, roteador de contexto, catálogo de projetos, tradutor de termos ou operador técnico. Esse padrão deve ser tratado como problema arquitetural, não como simples falha de disciplina documental.

## 2. Objetivo humano primário

```yaml
human_goal:
  reduce_leandro_cognitive_load: true
  preserve_leandro_final_authority: true
  leandro_should_focus_on:
    - ideas
    - priorities
    - strategic_decisions
    - risk_acceptance
    - human_gates
  leandro_should_not_be_required_to:
    - transport_recoverable_context_between_chats
    - remember_project_locations_for_agents
    - explain_existing_capabilities_repeatedly
    - translate_natural_language_into_technical_jargon_before_being_understood
    - manually_reconcile_documentation_after_every_change
    - act_as_default_terminal_or_platform_operator
```

Princípio resumido:

> LEANDRO deve ser autoridade e estrategista, não memória, roteador, tradutor obrigatório, sincronizador documental ou operador técnico padrão.

## 3. Achados transversais já alinhados

### 3.1 Human Context Transport é antipadrão

Se contexto, estado, repositório, capability, decisão ou próximo passo puderem ser recuperados de fonte canônica acessível, o MCF não deve pedir a LEANDRO que os reexplique.

Um chat novo deve preferir recuperação autônoma de contexto antes de escalonamento humano.

### 3.2 Documentation Parity

Documentação não é artefato secundário. Ela é parte do estado operacional do sistema.

O estado técnico não deve permanecer materialmente mais avançado do que:

- documentação humana;
- estado machine-readable;
- checkpoints;
- relações cross-project;
- capabilities declaradas;
- capacidade de um novo agente recuperar corretamente o contexto.

`DONE` futuro deverá considerar a recuperabilidade de contexto, não apenas código/testes/deploy.

### 3.3 Documentation Drift

Deve existir mecanismo para detectar quando documentação e realidade divergem.

Uma fase não deve ser considerada plenamente encerrada se houve mudança material e o estado canônico correspondente ficou para trás.

### 3.4 Natural Language → Technical Concept Mapping

LEANDRO pode expressar intenção em linguagem natural sem conhecer previamente o termo técnico.

O MESTRE deve, quando útil:

1. reconhecer o conceito técnico provável;
2. dizer explicitamente qual é o termo;
3. explicar em linguagem humana;
4. indicar se é termo amplamente usado ou nomenclatura interna do MCF;
5. transformar o entendimento em requisito, risco, padrão ou regra aplicável;
6. não exigir que LEANDRO passe a usar o jargão futuramente.

Nome arquitetural candidato desta camada: **Semantic Bridge**.

### 3.5 Semantic Bridge não pode forçar equivalência incorreta

O sistema deve poder responder:

- “isso corresponde a X”; ou
- “isso se aproxima de X, mas difere em Y”.

É proibido escolher o primeiro jargão parecido e moldar a intenção humana para caber nele.

### 3.6 Concept Memory

Conceitos recorrentes e relevantes podem ser persistidos com estrutura, não como glossário solto.

Estrutura candidata:

```yaml
concept:
  canonical_name:
  plain_language_descriptions: []
  technical_meaning:
  scope:
  related_concepts: []
  not_equivalent_to: []
  triggers: []
  consequences: []
  examples: []
  provenance: []
  lifecycle_state:
```

A Concept Memory deve ajudar futuros agentes a reconhecer tanto o conceito quanto a forma como LEANDRO costuma descrevê-lo.

### 3.7 Context Fabric

O MCF deve evoluir de coordenador de missões para também servir como mapa do ecossistema de trabalho.

Ele não precisa duplicar o conteúdo de todos os repositórios; deve saber:

- que algo existe;
- para que serve;
- qual é sua fonte de verdade;
- como recuperar seu estado;
- quais capacidades fornece;
- quais relações possui;
- quais regras governam seu uso;
- quando verificar estado live em vez de confiar em snapshot.

### 3.8 Conta GitHub `leon337` como universo descobrível

A conta GitHub canônica de desenvolvimento é `leon337`.

Modelo candidato:

```yaml
github_ecosystem:
  canonical_account: leon337
  repositories:
    discoverable: all_accessible_repositories
    registered: explicitly_classified_projects
```

Qualquer repositório acessível pode ser descoberto por pesquisa contextual. Apenas projetos relevantes passam a `REGISTERED` para evitar poluição do catálogo.

Se LEANDRO mencionar um projeto, produto ou ideia relacionada, o MCF deve procurar primeiro por ativos já existentes e candidatos reutilizáveis antes de assumir que um projeto novo precisa ser criado.

### 3.9 Project Registry + Project Capsule

Dois componentes candidatos:

**Project Registry no MCF**
- identifica projetos relevantes;
- registra repositório, finalidade, relação com o ecossistema e fonte de verdade.

**Project Capsule no repositório do projeto**
- resume propósito;
- estado atual;
- workstream ativo;
- deploy/runtime conhecido;
- capabilities;
- human gates;
- próximo passo;
- freshness/proveniência.

A cápsula deve ser pequena, estruturada e machine-readable.

### 3.10 Capability Registry

Capability não deve ser representada apenas como `sim/não`.

Estados candidatos:

```text
DECLARED
→ IMPLEMENTED
→ CONNECTED
→ AUTHORIZED
→ ACTIVE
→ VERIFIED
```

Campos adicionais candidatos:

```yaml
capability:
  scope:
  allowed_operations: []
  prohibited_operations: []
  required_gate:
  expiration:
  last_verified_at:
  evidence: []
  runtime_state:
```

Uma capability não deve ser afirmada como disponível quando seu estado live não estiver comprovado.

### 3.11 Freshness Awareness

O sistema deve distinguir:

```text
documented_state
observed_state
live_state_required
historical_snapshot
```

Documentação histórica pode orientar, mas não deve substituir estado volátil verificável.

### 3.12 Cross-project Impact

Mudanças relevantes devem registrar impacto além do repositório corrente.

Estrutura candidata:

```yaml
cross_project_impact:
  affected_projects: []
  affected_capabilities: []
  affected_contracts: []
  affected_deployments: []
  reconciliation_required: false
```

Isso evita que uma mudança na infraestrutura, capability ou governança exija que LEANDRO lembre manualmente de atualizar projetos relacionados.

### 3.13 Artifact System

O exemplo de dificuldade para chegar ao conceito de **Design System** mostrou uma segunda lacuna: reconhecer o conceito não garante produzir artefatos consistentes.

Nome candidato: **MCF Artifact System**.

Escopo candidato:

- documentos;
- PDFs;
- apresentações;
- imagens;
- diagramas;
- planilhas;
- interfaces;
- relatórios.

Camadas candidatas:

1. design tokens;
2. templates;
3. content patterns;
4. rendering profiles;
5. validation rules.

O objetivo é separar “descobrir o conceito correto” de “produzir consistentemente conforme esse conceito”.

### 3.14 Human–AI Interface Contract do MESTRE

O feedback do MESTRE deve reduzir complexidade, não transferi-la para LEANDRO.

Requisitos candidatos para respostas operacionais, estratégicas, decisórias ou de continuidade:

- explicar tecnicamente quando necessário;
- traduzir também para linguagem natural;
- usar analogia quando reduzir complexidade;
- nomear conceito técnico relevante quando isso ajudar;
- explicar implicação local;
- explicar impacto sistêmico/cross-project quando aplicável;
- não exigir jargão de LEANDRO;
- terminar com três caminhos reais quando houver decisão/continuidade relevante;
- marcar a recomendação do MESTRE;
- preservar a autoridade final de LEANDRO.

Respostas factuais simples não devem inventar três opções artificiais.

### 3.15 Cognitive Compression

Princípio candidato:

```text
LINGUAGEM HUMANA
      ↓
expansão técnica interna
      ↓
classificação de conceito/risco/impacto
      ↓
execução/governança
      ↓
LINGUAGEM HUMANA novamente
```

O MCF absorve a complexidade técnica internamente e devolve decisões compreensíveis sem exigir que LEANDRO carregue o vocabulário ou todo o estado mental do sistema.

## 4. Modelo de conhecimento a aprofundar

A próxima rodada deve separar explicitamente:

- **memória** — algo foi discutido;
- **conhecimento** — um conceito/relação é compreendido;
- **estado** — condição atual verificável;
- **decisão** — escolha normativa vinculante;
- **evidência** — prova ligada a uma afirmação;
- **capability** — ação possível dentro de escopo e autoridade;
- **artefato** — saída produzida segundo padrão;
- **relação** — dependência ou impacto entre entidades.

Esses elementos não devem ser fundidos num único arquivo de “memória”.

## 5. Lifecycle de promoção de contexto

Nem toda observação de conversa deve se tornar regra canônica.

Lifecycle candidato:

```text
OBSERVATION
→ CANDIDATE_CONCEPT
→ CHECKPOINTED
→ CANONICAL
→ SUPERSEDED
```

Este documento está em `CHECKPOINTED / DRAFT_DISCOVERY` e não autoriza mudança normativa.

## 6. Relação com `cloud-infrastructure`

A investigação atual identificou uma divergência relevante entre documentação canônica da `main` de `leon337/cloud-infrastructure` e o trabalho técnico mais recente em F1.2c.

A próxima arquitetura deve prever reconciliação explícita entre MCF e Cloud Infrastructure, mas este checkpoint não altera nenhum dos dois contratos atuais.

Estado conceitual pretendido:

```text
MCF
  ↕ descoberta, contexto, capabilities, governança
Cloud Infrastructure
  ↕ desired/live state, VPS, runbooks, recovery
NODE-01 / labs
```

O MCF deve conhecer a existência e a função da infraestrutura sem duplicar seu estado técnico como fonte primária.

## 7. Critério de teste em chat isolado

Teste futuro deve usar linguagem natural e contexto isolado.

Exemplos de entrada:

```text
“MESTRE, vamos continuar a VPS.”
“Em que estamos trabalhando?”
“Você consegue fazer alterações na VPS?”
“Quero continuar o projeto Hermes Agente.”
```

Critérios candidatos de PASS:

- MCF reconhecido;
- conta `leon337` reconhecida como universo descobrível;
- projeto relevante localizado sem link fornecido por LEANDRO;
- fonte canônica localizada;
- estado live verificado quando necessário;
- capability não inventada;
- human gates reconhecidos;
- relações cross-project identificadas;
- próximo passo recuperado;
- nenhuma informação recuperável solicitada a LEANDRO.

Falhas críticas candidatas:

- pedir a LEANDRO repositório que poderia ser descoberto;
- pedir a LEANDRO contexto disponível em fonte canônica;
- inventar capability;
- confundir snapshot histórico com estado live;
- declarar projeto/phase `DONE` com documentation drift material;
- interpretar incorretamente intenção humana apenas para encaixar jargão.

## 8. Auditoria crítica do estado atual do MCF

Classificação qualitativa neste checkpoint:

```yaml
mcf_current_strengths:
  governance: STRONG
  execution_discipline: STRONG
  evidence_and_gates: STRONG
  human_delegation: GOOD

mcf_current_gaps:
  context_federation: WEAK_OR_FRAGMENTED
  cross_project_discovery: PARTIAL_OPPORTUNISTIC
  documentation_parity: INSUFFICIENTLY_GOVERNED
  semantic_bridge: NOT_FORMALIZED
  concept_memory: NOT_FORMALIZED
  artifact_production_governance: MATERIAL_GAP
  human_ai_cognitive_interface: PARTIAL_INCONSISTENT
  isolated_chat_cross_project_recovery: NOT_YET_PROVEN
```

## 9. Componentes arquiteturais candidatos para a próxima rodada

```yaml
architecture_candidates:
  - MCF_Context_Fabric
  - Project_Registry
  - Project_Capsule
  - Capability_Registry
  - Semantic_Bridge
  - Concept_Memory
  - Documentation_Parity
  - Documentation_Drift_Detection
  - Cross_Project_Impact_Graph
  - MCF_Artifact_System
  - Mestre_Human_AI_Interface_Contract
  - Isolated_Chat_Context_Recovery_Tests
```

Nenhum desses nomes implica implementação aprovada.

## 10. Regras que NÃO foram aprovadas ainda

Este checkpoint NÃO autoriza:

- alterar o runtime MCF;
- alterar skills vigentes;
- alterar permissões ou HDF;
- alterar Cloud Infrastructure;
- registrar toda a conta `leon337` como projeto ativo;
- conceder novos acessos à VPS;
- afirmar capabilities não verificadas;
- promover este desenho a arquitetura canônica;
- implementar Project Registry, Concept Memory, Semantic Bridge ou Artifact System.

## 11. Próxima fase proposta

Realizar nova rodada arquitetural madura cobrindo conjuntamente:

1. Context Fabric e modelo de conhecimento;
2. Project Discovery e ecossistema `leon337`;
3. Project Registry / Project Capsule;
4. Capability lifecycle e freshness;
5. Documentation Parity + drift detection + Definition of Done;
6. Semantic Bridge;
7. Concept Memory e política de promoção de conceitos;
8. Artifact System e padronização de documentos/imagens/layouts;
9. contrato cognitivo de resposta do MESTRE;
10. cross-project impact e reconciliação;
11. persistência, provenance e supersession;
12. testes de chat isolado e critérios de aceitação.

Somente após revisão explícita de LEANDRO esta discovery poderá avançar para proposta arquitetural canônica ou implementação.

## 12. Frase de alinhamento

> O MCF deve reduzir a carga cognitiva de LEANDRO sem reduzir sua autoridade: entender linguagem natural, recuperar contexto autonomamente, descobrir ativos existentes, manter documentação em paridade com a realidade, conectar projetos e produzir artefatos consistentes — deixando para LEANDRO ideias, prioridades e decisões humanas genuínas.
