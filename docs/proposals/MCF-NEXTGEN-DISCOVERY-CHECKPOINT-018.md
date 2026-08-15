# MCF NextGen — Discovery Checkpoint 018

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-018`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-15  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação explícita de LEANDRO para a Q16 após auditoria crítica transversal, encerrar o questionário Q1–Q16 e liberar apenas a formalização arquitetural F1.3–F1.6, sem autorizar implementação.

---

## 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
questions_completed: 16
questions_remaining: 0
last_completed_question: 16
next_question: NONE
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
Q11: COMPLETED_APPROVED_BY_LEANDRO
Q12: COMPLETED_APPROVED_BY_LEANDRO_CONCEPTUALLY
Q13: COMPLETED_APPROVED_BY_LEANDRO
Q14: COMPLETED_APPROVED_BY_LEANDRO_AFTER_NO_BLOCKER_REVIEW
Q15: COMPLETED_APPROVED_BY_LEANDRO_AFTER_NO_BLOCKER_REVIEW
Q16: COMPLETED_APPROVED_BY_LEANDRO_AFTER_CRITICAL_AUDIT
target_architecture_decision_approved: true
architecture_final_specification_approved: false
prototype_authorized: false
implementation_authorized: false
production_cutover_authorized: false
```

Q16 encerra o Discovery decisório Q1–Q16. Ela aprova a direção/arquitetura-alvo, não uma especificação executável final nem qualquer alteração de runtime, produção, schema, provider, secrets, agents ou skills.

---

## 2. Pergunta aprovada

### Q16 — Qual é a arquitetura final da Fase 1 e o GO/NO-GO?

Arquitetura-alvo aprovada:

> **`GOVERNED_PORTABLE_MULTIAGENT_RUNTIME`**

Definição:

> O MCF NextGen deve ser um runtime multiagente governado, persistente, verificável e portátil, no qual identidade, autoridade, estado, evidência, planejamento, execução, modelos e providers sejam separados por contratos explícitos; modelos auxiliam raciocínio, mas não constituem autoridade nem fonte de verdade.

Princípio operacional:

```text
MODEL PROPOSES
MCF GOVERNS
CANONICAL STATE RECORDS
EVIDENCE PROVES
POLICY AUTHORIZES
AGENTS/WORKERS EXECUTE
LEANDRO DECIDES WHEN HUMAN_GATE IS LEGITIMATELY REQUIRED
```

---

## 3. Distinção crítica: decisão de arquitetura vs especificação final

A auditoria de Q16 corrigiu uma ambiguidade importante.

```text
Q16 TARGET ARCHITECTURE DECISION
!=
FINAL EXECUTABLE ARCHITECTURE SPECIFICATION
```

Estado aprovado:

```yaml
target_architecture_decision_approved: true
architecture_final_specification_approved: false
```

F1.3–F1.6 ainda precisam transformar as decisões de Discovery em:

- consolidação formal e reconciliação de contratos;
- arquitetura alvo formal;
- plano de migração/backward compatibility;
- especificação executável, critérios de aceite e validation plan.

Somente depois, com aprovação explícita de LEANDRO, poderá existir autorização de implementação.

---

## 4. Boundaries lógicos da arquitetura

A arquitetura aprovada usa boundaries lógicos; eles não implicam serviços físicos separados.

```text
HUMAN / HOSTS
  -> CONSTITUTIONAL KERNEL
  -> POLICY SYSTEM
  -> STATE & CONTINUITY
  -> CONTROL / MISSION GRAPH
  -> CAPABILITY REGISTRY
  -> EXECUTION COORDINATOR
  -> EXECUTION BINDING
  -> WORKER
  -> POLICY ENFORCEMENT
  -> GOVERNED EFFECT BOUNDARY
  -> EXTENSIONS / ADAPTERS
  -> PROVIDER
  -> READ-BACK / EVIDENCE
  -> STATE + LEDGER
```

Ao redor desses contratos operam observability, assurance, recovery, evaluation e conformance/portability harnesses sem criar fontes concorrentes de verdade.

`LOGICAL_BOUNDARY != PHYSICAL_SERVICE`.

---

## 5. Constitutional Kernel, policy e bootstrap trust

O Constitutional Kernel contém invariantes que policies configuráveis não podem enfraquecer, incluindo:

- identidade e autoridade;
- delegação atenuante;
- HUMAN_GATE semantics;
- project/security isolation;
- trust root;
- extension validation root;
- default deny e invariantes constitucionais aplicáveis.

Separação aprovada:

```text
CONSTITUTIONAL KERNEL
  -> POLICY DECISION
  -> POLICY ENFORCEMENT
```

Policy comum não redefine a Constituição que valida a própria policy.

A arquitetura requer `Bootstrap Trust` conceitual, sem fixar tecnologia criptográfica:

```yaml
bootstrap_trust:
  instance_id:
  core_contract_version:
  trusted_authority_binding:
  trusted_policy_root:
  canonical_state_locator:
  trusted_extension_policy:
```

Na instância oficial do MCF:

```text
HUMAN_AUTHORITY -> LEANDRO
ORCHESTRATOR -> MESTRE
INTERNAL_GATE_AUTHORITY -> LÉO
```

Mudança desses bindings é efeito privilegiado. LÉO não pode transformar INTERNAL_GATE em HUMAN_GATE nem alterar o próprio authority binding unilateralmente.

---

## 6. State, continuity e source of truth

Preservar Q8:

```text
CANONICAL KNOWLEDGE
OPERATIONAL STATE
TRANSITION LEDGER
EVIDENCE
DERIVED VIEWS
```

State + transition devem permanecer consistentes em boundary atômico ou garantia equivalente.

Continuity Builder e Project Capsule são derivados:

```text
CANONICAL SOURCES
  -> CONTINUITY BUILDER
  -> PROJECT CAPSULE
```

`PROJECT_CAPSULE != SOURCE_OF_TRUTH`.

Derived view não pode promover automaticamente nova informação a verdade canônica; nova informação retorna pelo fluxo normal de evidence/authority/state transition.

---

## 7. Capability Registry e Execution Binding

A arquitetura requer capability evidence verificável para agentes, backends/modelos, workers, extensions e tools.

```yaml
capability_registry:
  subjects:
    - AGENT
    - MODEL_BACKEND
    - WORKER
    - EXTENSION
    - TOOL
  provenance: required
  freshness: required
  compatibility: required
```

Self-claim não é prova suficiente.

Model routing (Q5) e placement (Q11) convergem em um `Execution Binding` coerente:

```yaml
execution_binding:
  task_requirements:
  agent:
  cognitive_backend:
  tools:
  worker:
  placement:
  data_boundary:
  authority_context:
  policy_version:
```

Nenhuma execução material é elegível enquanto o binding conjunto violar capability, locality, compatibility, authority ou policy requirements.

---

## 8. Execution Graph, Coordinator e workers

Orquestração permanece `HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`.

O `Execution Coordinator` preserva semanticamente:

- durable dispatch;
- task readiness;
- attempt identity;
- fencing/epoch quando exigido;
- admission control;
- backpressure;
- worker eligibility;
- bounded retries/loops;
- Completion Contract.

Workers são executores, não Control Plane peers por default.

```text
CAPABILITY != AUTHORITY
PLACEMENT != AUTHORITY
WORKER_OUTPUT != CANONICAL_TRUTH_UNTIL_VALIDATED
```

---

## 9. Security, credentials, data classification e effects

Toda ação material segue:

```text
ACTION REQUEST
  -> POLICY DECISION
  -> POLICY ENFORCEMENT
  -> GOVERNED EFFECT BOUNDARY
  -> PROVIDER
  -> READ-BACK / EVIDENCE / RECEIPT
```

Extensões não podem criar bypass material alternativo.

Credential boundary conceitual:

```text
AGENT / MODEL
  -> CREDENTIAL CAPABILITY REQUEST
  -> CREDENTIAL BOUNDARY/BROKER PORT
  -> SCOPED CREDENTIAL
  -> EFFECT BOUNDARY
```

Secrets não pertencem a Project Memory/Project Capsule por default.

Security/trust metadata deve poder acompanhar dados e outputs:

```yaml
security_context:
  project_id:
  security_domain:
  classification:
  trust_origin:
  derived_from:
```

Transformação/resumo não promove trust ou reduz classificação automaticamente.

---

## 10. Agents, skills, extensions e hosts

`Agent Contract` permanece Core; named agent catalog não é requisito constitucional.

Os 29 agentes atuais permanecem como contratos/história/profile possível da instância, mas seu default ativo permanece `INCONCLUSIVE` até evidência suficiente.

As 16 skills v1 permanecem ativos de evidence/regression; sua classificação futura Core/Skill/Plugin/Profile não é congelada por Q16.

Extensions continuam:

```text
PLUGIN
SKILL
PROFILE
FACTORY
```

com `INSTALLED != ENABLED != AUTHORIZED`.

Host/Application boundary é explícito:

```text
MCF CORE CONTRACTS
  <- HOST ADAPTERS
     - Chat
     - CLI
     - Web
     - HTTP API
     - Mobile
     - rede-social-agentes
```

O host usa MCF; o host não define o MCF.

GitHub, Render, PostgreSQL e outros providers podem continuar adapters/defaults; `DEFAULT != CONSTITUTIONAL_REQUIREMENT`.

---

## 11. Assurance, evaluation e portability

`Assurance Plane` como boundary funcional não prova independência por si só. Reviews que exigem independência devem satisfazer o contrato Q6 (blind-first, contexto/evidência/decisão próprios, etc.).

Evaluation Q13 e portability/conformance Q14 permanecem harnesses/contratos sobre o runtime, sem obrigação de inchar o Core operacional.

Resultados `INCONCLUSIVE` da Q15 permanecem inconclusivos; Q16 não decide silenciosamente quantos dos 29 agentes serão default nem a classificação final de todas as 16 skills.

---

## 12. Backward compatibility

Compatibilidade é classificada, não promessa universal de preservar APIs internas antigas.

```yaml
compatibility_classes:
  historical_interpretability: REQUIRED
  v1_project_state_migration: REQUIRED
  v1_evidence_and_receipts: REQUIRED_TO_REMAIN_INTERPRETABLE
  legacy_risk_taxonomy: VERSIONED_MAPPING_REQUIRED
  exact_internal_class_API_compatibility: NOT_UNIVERSALLY_REQUIRED
  plugin_contract_compatibility_window: MUST_BE_DECLARED_PER_CONTRACT
```

Stable v1.0.0 permanece baseline histórico/migration source, não rollback operacional automático após alterações incompatíveis de dados/schema.

---

## 13. Migração incremental e autoridade única

Estratégia aprovada:

`INCREMENTAL_COMPATIBILITY_FIRST`.

Fluxo:

```text
V1 BASELINE LOCKED
  -> NEXTGEN CONTRACTS
  -> COMPATIBILITY / TRANSLATION LAYER
  -> NEXTGEN SHADOW — NO MATERIAL EFFECTS
  -> STATE MIGRATION DRY RUN
  -> SEMANTIC CONFORMANCE
  -> CUTOVER FREEZE
  -> MIGRATION + RECONCILIATION
  -> ACTIVATION GATE
  -> NEXTGEN CANONICAL
  -> LEGACY READ-ONLY
  -> SUNSET WHEN CRITERIA PASS
```

Invariantes:

```text
ONE_CANONICAL_MATERIAL_WRITER_PER_EXECUTION_BOUNDARY
COMPATIBILITY_LAYER != UNGOVERNED_DUAL_WRITE
NEXTGEN_SHADOW_CANNOT_PERFORM_MATERIAL_EFFECTS
MIGRATION_IS_A_PRIVILEGED_GOVERNED_EFFECT
```

Migração/cutover deve ser version-bound e auditável. Nenhum big-bang rewrite foi aprovado.

---

## 14. Sunset

Nada legacy marcado `REPLACE/REMOVE` pode ser aposentado apenas porque o replacement existe.

```text
REPLACEMENT_READY
+
SEMANTIC_CONFORMANCE_PASS
+
MIGRATION_OR_COMPATIBILITY_PASS
+
NO_REQUIRED_ACTIVE_DEPENDENCY
-> SUNSET_ALLOWED
```

Authority migration deve permanecer fail-closed sem janela entre desativação do controle antigo e ativação do novo.

---

## 15. Acceptance gates por estágio

Q16 separa três gates:

### Architecture Readiness
Requer, antes de pedir autorização de implementação:

- decisões Q1–Q16 reconciliadas;
- contratos/boundaries formalizados;
- dependency graph;
- security/trust model formal;
- migration/backward compatibility plan;
- validation/evaluation strategy;
- acceptance criteria executáveis;
- recovery/sunset strategy;
- exact approved specification revision + integrity/change-control path.

### Implementation/Migration Readiness
Depois de implementação autorizada e executada, requer conforme escopo:

- semantic conformance;
- regression;
- migration/restore tests;
- shadow evaluation;
- security validation;
- no hard-constraint violations.

### Cutover/Release Readiness
Requer, conforme escopo:

- estado final reconciliado;
- required evidence/reviews/gates;
- recovery readiness;
- acceptable regressions/value evidence;
- explicit authority/HUMAN_GATE quando policy exigir.

`TARGET_ARCHITECTURE_APPROVAL != PRODUCTION_AUTHORIZATION`.

---

## 16. GO/NO-GO aprovado

```yaml
Q16_GO_NO_GO:
  questionnaire_direction: GO
  target_architecture_decision: GO
  discovery_completion: GO
  F1_3_decision_consolidation: GO
  F1_4_formal_target_architecture: GO
  F1_5_migration_plan: GO
  F1_6_executable_specification: GO
  prototype: NO_GO_CURRENTLY
  implementation: NO_GO_CURRENTLY
  production_cutover: NO_GO
  destructive_v1_change: NO_GO
  final_implementation_authorization: REQUIRES_EXPLICIT_LEANDRO_APPROVAL
```

---

## 17. Auditoria final da Q16

A auditoria transversal encontrou e refinou:

- final architecture vs executable specification ambiguity;
- Kernel/policy responsibility overlap;
- bootstrap trust cycle;
- v1/NextGen dual-authority risk;
- compatibility-layer dual-write risk;
- migration as privileged effect;
- continuity second-source-of-truth risk;
- Capability Registry omission;
- routing/placement inconsistency;
- durable dispatch/admission/backpressure underrepresentation;
- credentials/data-classification boundaries;
- host boundary omission;
- assurance independence ambiguity;
- evaluation/conformance Core bloat risk;
- extension effect bypass;
- HUMAN UI authority boundary;
- authority-binding change control;
- backward-compatibility scope;
- mixed acceptance gates;
- final specification integrity boundary.

Após os refinamentos:

```yaml
Q16_AUDIT_FINAL:
  conceptual_blocker: NONE_FOUND
  target_architecture: GOVERNED_PORTABLE_MULTIAGENT_RUNTIME
  approved_by_leandro: true
```

---

## 18. Estado da Fase 1 após Q16

```yaml
phase_zero: COMPLETE_IN_MAIN
phase_1:
  stage: DISCOVERY_COMPLETE
  questionnaire: COMPLETE_16_OF_16
  target_architecture_decision_approved: true
  architecture_final_specification_approved: false
  prototype_authorized: false
  implementation_authorized: false
  production_cutover_authorized: false
```

Próximo bloco canônico:

> **F1.3 — Consolidação formal das decisões Q1–Q16.**

Depois: F1.4 Arquitetura alvo formal, F1.5 Plano de migração e F1.6 Especificação executável. Nenhuma dessas etapas autoriza implementação por si só.

---

## 19. Retomada

```yaml
last_completed_question: 16
next_question: NONE
approved_decisions:
  Q16: GOVERNED_PORTABLE_MULTIAGENT_RUNTIME
working_hypotheses: []
open_questions:
  - F1_3_FORMAL_DECISION_CONSOLIDATION
  - F1_4_FORMAL_TARGET_ARCHITECTURE
  - F1_5_MIGRATION_AND_COMPATIBILITY_PLAN
  - F1_6_EXECUTABLE_SPECIFICATION
repo_live_state_reference:
  branch: planning/mcf-nextgen-discovery
  pre_Q16_approval_head: d5a13d7d668035e6546a3b8d6b7db8e50b64b155
next_action: START_F1_3_DECISION_CONSOLIDATION
resume_instructions: READ_RESUME_CARD_THEN_CHECKPOINT_018_AND_VALIDATE_GITHUB_LIVE
implementation_authorized: false
```
