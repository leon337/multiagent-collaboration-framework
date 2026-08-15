# MCF NextGen — Discovery Checkpoint 012

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-012`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-15  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação explícita de LEANDRO para a Q10 e fixar a retomada em Q11.

---

## 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 10
next_question: 11
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: COMPLETED_APPROVED_BY_LEANDRO
Q9: COMPLETED_APPROVED_BY_LEANDRO
Q10: COMPLETED_APPROVED_BY_LEANDRO
Q11: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
prototype_authorized: false
```

A aprovação de Q10 é conceitual. Não autoriza implementação NextGen nem fixa tecnologias, sandbox, assinatura de plugins, secrets, deployment ou supply-chain controls.

---

## 2. Pergunta aprovada

### Q10 — O que pertence ao MCF Core e o que deve ser Factory/Plugin/Perfil?

Decisão consolidada:

> O MCF deve adotar `MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS`: um núcleo pequeno, estável e independente de domínio preserva os invariantes constitucionais e contratos universais; capacidades, procedimentos, configurações e blueprints especializados entram por extensões governadas e versionadas.

Princípio central:

> Core define as leis e contratos do MCF. Extensões adicionam capacidade ou configuração sem poder redefinir autoridade, verdade, gates ou invariantes constitucionais.

---

## 3. Estrutura do Core

```yaml
core:
  constitutional_kernel:
    - authority_enforcement
    - policy_invariants
    - mission_task_identity
    - human_gate_semantics
    - evidence_provenance
    - project_isolation
    - extension_validation
    - bootstrap_trust_root

  core_service_contracts:
    - execution_graph
    - persistence
    - model_routing
    - review_assurance
    - recovery
    - observability
```

O Kernel não depende de provider ou domínio específico. Serviços universais podem possuir implementações concretas atrás de ports/adapters sem deslocar seus invariantes para extensões.

---

## 4. Regra de dependência

```text
EXTENSION -> CORE CONTRACTS      ALLOWED
CORE -> SPECIFIC EXTENSION       FORBIDDEN
```

O Core não deve conhecer GitHub, Vercel, Gmail, OpenRouter ou outro provider específico como dependência constitucional.

---

## 5. Tipos de extensão

```yaml
PLUGIN:
  purpose: ADD_EXECUTABLE_CAPABILITY

SKILL:
  purpose: ADD_GOVERNED_PROCEDURE

PROFILE:
  purpose: DECLARATIVE_CONFIGURATION
  arbitrary_execution: FORBIDDEN

FACTORY:
  purpose: GENERATE_VERSIONED_PROJECT_BLUEPRINT
  runtime_authority_after_generation: NONE
```

### Plugin
Adiciona capacidade técnica/integrativa. Instalação não concede autoridade.

### Skill
Define procedimento governado que usa Core e capacidades autorizadas. Skills de domínio não são Core por padrão.

### Profile
Configura comportamento, limites e defaults. Não contém loops, tool execution, side effects ou linguagem arbitrária de execução.

### Factory
Gera blueprint versionado; o Core valida o resultado e assume a execução. A Factory não permanece como autoridade paralela do runtime.

---

## 6. Extension Manifest e lifecycle

Toda extensão material deve possuir manifest versionado, com pelo menos identidade, tipo, versão, versão de contrato Core, capacidades, permissões requeridas, side effects, dependências, schemas, configuração, compatibilidade e proveniência.

Invariantes:

```text
INSTALLED != ENABLED
ENABLED != AUTHORIZED
PLUGIN_CAPABILITY != AGENT_AUTHORITY
UNKNOWN_EXTENSION_COMPATIBILITY = NOT_LOADABLE
```

Execuções materiais devem registrar versão concreta da extensão e do contrato Core aplicável.

---

## 7. Composição e compatibilidade

- dependências circulares entre extensões são proibidas;
- resolução de versão/compatibilidade deve ocorrer antes da ativação;
- conflito de profiles não usa `last writer wins` silencioso;
- cada propriedade configurável precisa de regra explícita de precedência/merge/conflito;
- extensão incompatível falha fechada;
- falha de extensão não pode corromper estado, autoridade ou ledger do Core;
- remoção futura de uma extensão não pode destruir a interpretabilidade histórica de execuções passadas.

---

## 8. Agentes

```text
Agent Contract = CORE
Named Agent Catalog = NOT_CORE_BY_DEFAULT
```

Os agentes nomeados atuais permanecem parte válida da configuração/equipe MCF vigente, mas a generalização do framework não exige que um catálogo fixo de personas seja componente constitucional do Core.

---

## 9. Correção de nomenclatura Q4/Q6

A auditoria de Q10 confirmou colisão entre os rótulos numéricos de risco da Q4 e assurance da Q6.

Q4 usa, historicamente:

```text
R0_LOW / R1_MEDIUM / R2_HIGH / R3_CRITICAL
```

Q6 registrou, historicamente:

```text
R0_SELF_REVIEW / R1_SEPARATE_REVIEW / R2_INDEPENDENT_REVIEW /
R3_DIVERSE_INDEPENDENT_REVIEW / R4_EXTERNAL_ASSURANCE
```

O checkpoint Q6 permanece como registro histórico aprovado e sua substância não é reaberta. A partir de Q10, especificações novas não podem usar `R0`, `R1`, `R2`, `R3` ou `R4` isoladamente.

Regra futura:

```yaml
risk:
  level: HIGH        # ou namespace equivalente, ex. risk.R2_HIGH

review_policy:
  independence_level: INDEPENDENT
  diversity:
    model: true
    provider: false
    runtime: false
    evidence_source: false
  external_audit: false
```

Invariante:

`NUMERIC_R_LABEL_WITHOUT_NAMESPACE = FORBIDDEN`.

---

## 10. Core Conformance

Hipótese aprovada para especificação posterior: deve existir um `Core Conformance Test` capaz de demonstrar que o Core mínimo consegue criar missão, validar autoridade, persistir/transicionar estado, registrar evidência, executar um graph mínimo e concluir ou bloquear corretamente sem depender de uma integração de domínio específica.

---

## 11. Deferimentos corretos

Q10 não decide ainda:

- containers, workers, filas, placement e lifecycle físico — Q11;
- assinatura de plugins, sandbox, secrets, supply chain, autenticação e least privilege concreto — Q12;
- quais componentes/skills/agentes atuais serão preservados, simplificados ou removidos — Q15;
- arquitetura final e plano de migração — Q16.

---

## 12. Decisão consolidada

```yaml
Q10_DECISION:
  status: COMPLETED_APPROVED_BY_LEANDRO
  architecture: MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS
  constitutional_kernel: REQUIRED
  core_service_contracts: REQUIRED
  dependency_direction: EXTENSION_TO_CORE_ONLY
  plugin_adds_capability: true
  skill_adds_governed_procedure: true
  profile_is_declarative_only: true
  factory_generates_blueprint_only: true
  extension_manifest: REQUIRED
  extension_version_pinning: REQUIRED_FOR_MATERIAL_EXECUTION
  installed_implies_authorized: false
  dependency_cycles: FORBIDDEN
  silent_profile_last_writer_wins: FORBIDDEN
  extension_fault_containment: REQUIRED
  historical_interpretability_after_removal: REQUIRED
  agent_contract_is_core: true
  named_agent_catalog_is_core_by_default: false
  numeric_R_label_without_namespace: FORBIDDEN
  implementation_authorized: false
```

---

## 13. Ponto de retomada

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
last_completed_question: 10
next_question: 11
approved_decisions:
  - Q1_PURPOSE
  - Q2_LAYERED_CONTINUITY_ARCHITECTURE
  - Q3_AGENT_CONTRACT
  - Q4_MISSION_BOUNDED_RISK_BASED_AUTONOMY
  - Q5_CAPABILITY_AND_POLICY_BASED_ROUTER
  - Q6_RISK_BASED_REVIEW_INDEPENDENCE
  - Q7_HIERARCHICAL_GOVERNED_EXECUTION_GRAPH
  - Q8_LAYERED_CANONICAL_PERSISTENCE
  - Q9_ACTIONABLE_PROGRESSIVE_OBSERVABILITY
  - Q10_MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS
open_questions:
  - Q11_INFRASTRUCTURE_AND_PLACEMENT
next_action: START_Q11
resume_instructions: >-
  Consultar GitHub live, ler Resume Card, este checkpoint e o roadmap;
  não repetir Q1-Q10; iniciar Q11 somente como Discovery; não implementar NextGen.
```