# MCF NextGen — Discovery Checkpoint 005

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-14  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação explícita de LEANDRO para a Q3 do Discovery e fixar o ponto de retomada em Q4.

---

# 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 3
next_question: 4
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
```

A aprovação de Q3 é uma decisão de Discovery. Ela NÃO autoriza implementação do MCF NextGen.

---

# 2. Pergunta aprovada

## Q3 — O que é um agente de verdade no MCF?

Decisão consolidada:

> Um agente MCF é uma entidade operacional identificável que possui identidade, papel, objetivos, capacidades, limites de autoridade, contratos de entrada e saída, política de decisão e rastreabilidade próprias, podendo usar diferentes modelos, ferramentas e ambientes de execução sem que esses componentes constituam sua identidade.

A existência de um nome/persona, isoladamente, não é suficiente para classificar algo como agente MCF.

---

# 3. Agent Contract

Para uma entidade ser classificada oficialmente como `MCF_AGENT`, ela deve satisfazer um contrato mínimo conceitual:

```yaml
agent_contract:
  agent_id:
  identity:
  role:
  objectives:
  responsibilities:
  capabilities:
  permissions:
  input_contract:
  output_contract:
  decision_policy:
  state:
  provenance:
```

Detalhes concretos de schema, storage e runtime permanecem para arquitetura/especificação posteriores.

---

# 4. Agente não é modelo

Invariante aprovado:

`AGENTE != MODELO`

O modelo é um backend cognitivo utilizado pelo agente, não sua identidade.

Exemplos de backends possíveis:

- GPT;
- Claude;
- Gemini;
- Qwen;
- outros providers/modelos compatíveis.

Trocar o modelo pode preservar a identidade do agente, mas NÃO garante preservação de capacidade operacional.

Portanto:

```text
IDENTITY CONTINUITY != CAPABILITY CONTINUITY
```

Antes de trocar de modelo/provider para executar um contrato de agente, o MCF deverá validar se o backend substituto possui as capacidades exigidas. A política concreta de routing/fallback será definida na Q5.

---

# 5. Persona não é agente

Classificação conceitual aprovada:

```text
PERSONA
  = nome/personagem/instruções sem Agent Contract suficiente

MCF_AGENT
  = satisfaz Agent Contract

PERSISTENT_AGENT
  = MCF_AGENT + lifecycle persistente

ISOLATED_AGENT
  = MCF_AGENT + propriedades de isolamento explicitamente definidas

INDEPENDENT_AGENT / INDEPENDENT_REVIEWER
  = MCF_AGENT + critérios formais de independência
```

A independência não é tratada como simples nível linear de maturidade. Ela é uma propriedade multidimensional, cuja definição formal será aprofundada na Q6.

---

# 6. Lifecycle separado de agenthood

Persistência NÃO é requisito universal para ser agente.

Lifecycles conceituais aceitos:

```yaml
agent_lifecycle:
  - EPHEMERAL
  - SESSION
  - PROJECT
  - PERSISTENT
```

Um agente temporário pode ser um agente MCF legítimo se satisfizer o Agent Contract aplicável e sua execução for rastreável.

---

# 7. Independence Profile separado de agenthood

`AGENTHOOD` e `INDEPENDENCE` são conceitos diferentes.

Um perfil futuro de independência deverá poder expressar dimensões como:

```yaml
independence_profile:
  context_isolated:
  runtime_isolated:
  state_isolated:
  model_separated:
  provider_separated:
  authority_separated:
  evidence_separated:
```

Os critérios mínimos para revisão/agente independente permanecem deliberadamente abertos para Q6.

---

# 8. Memória do agente e verdade do projeto

Q3 preserva a decisão de Q2: agentes não devem manter cópias concorrentes e não governadas da verdade do projeto.

O agente pode possuir:

- estado privado de execução;
- histórico próprio;
- contexto temporário;
- preferências/configuração operacional permitidas;
- visão autorizada da Project Memory.

Mas a verdade do projeto permanece vinculada às fontes canônicas, estado live e evidências definidos pela arquitetura de continuidade da Q2.

---

# 9. Capability não é authority

Invariante aprovado:

```text
CAPABILITY != AUTHORITY
```

Um agente poder tecnicamente executar uma ação não significa que esteja autorizado a fazê-la.

Todo agente deve possuir fronteira explícita de autoridade, incluindo conceitualmente:

```yaml
authority_boundary:
  can_decide:
  can_execute:
  requires_gate:
  prohibited_actions:
  escalation_path:
```

Os níveis concretos de autonomia, HUMAN_GATE, retries, stop conditions e ações reversíveis/irreversíveis serão definidos na Q4.

---

# 10. Output do agente não é verdade automática

Em continuidade com o controle de alucinação aprovado na Q2:

```text
AGENT OUTPUT != PROJECT TRUTH
```

Uma afirmação gerada por um agente nasce como claim/proposta/resultado não verificado, conforme o contexto. Ela só pode ser promovida a fato oficial, decisão aprovada ou estado operacional quando satisfizer a política de evidência, autoridade e verificação aplicável.

Exemplo conceitual:

```text
Agente: "CI passou"
        ↓
CLAIM
        ↓
consultar run/evidência
        ↓
VERIFIED_FACT ou UNKNOWN/FAILED
```

Ausência de prova não pode ser convertida silenciosamente em certeza.

---

# 11. Invariantes consolidados da Q3

```yaml
q3_invariants:
  agent_is_not_model: true
  persona_is_not_agent_automatically: true
  agent_contract_required: true
  lifecycle_separate_from_agenthood: true
  independence_separate_from_agenthood: true
  capability_is_not_authority: true
  identity_continuity_is_not_capability_continuity: true
  model_capability_validation_required: true
  agent_output_is_not_project_truth: true
  project_truth_must_not_be_duplicated_per_agent_without_governance: true
```

---

# 12. Limites deliberadamente deixados para perguntas futuras

Q3 NÃO fecha:

- autonomia concreta e HUMAN_GATE — Q4;
- model routing/fallback/provider policy — Q5;
- definição formal de independência/revisão independente — Q6;
- graph/loops/paralelismo — Q7;
- persistência/documentação concreta — Q8;
- segurança e permissões detalhadas — Q12;
- ablation dos agentes existentes — Q15.

---

# 13. Hipóteses rejeitadas/refinadas

```yaml
rejected_or_refined:
  linear_maturity_ladder_as_complete_agent_model: REJECTED
  persistence_required_for_all_agents: REJECTED
  each_agent_owns_copy_of_project_truth: REJECTED
  model_swap_implies_capability_continuity: REJECTED
  agent_name_equals_independence: REJECTED
  agent_output_equals_verified_fact: REJECTED
```

---

# 14. Ponto exato de retomada

```yaml
phase_one_discovery:
  state: ACTIVE_DISCOVERY
  last_completed_question: 3
  next_question: 4
  Q4_started: false

approved_decisions:
  - Q1_FINALIDADE
  - Q2_LAYERED_CONTINUITY_ARCHITECTURE
  - Q3_AGENT_CONTRACT_AND_SEPARATION_OF_AGENTHOOD_LIFECYCLE_INDEPENDENCE

implementation_authorized: false
next_action: START_Q4
```

Q4 é:

> **Qual nível de autonomia os agentes devem possuir?**

**Não repetir Q1, Q2 ou Q3 salvo solicitação explícita de LEANDRO.**
