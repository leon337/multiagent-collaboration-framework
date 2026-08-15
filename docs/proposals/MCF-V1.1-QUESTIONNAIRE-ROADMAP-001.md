# MCF v1.1 — Roadmap do Questionário de Discovery

**ID:** `MCF-V1.1-QUESTIONNAIRE-ROADMAP-001`  
**Status:** `DISCOVERY_COMPLETE`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE

---

## 1. Regra do questionário

O questionário possui **20 perguntas canônicas** e foi concluído integralmente.

- uma pergunta por vez;
- LEANDRO pode escolher, combinar ou propor resposta;
- MESTRE registra consequências, riscos, dependências e pontos abertos;
- decisão relevante é persistida no GitHub antes de avançar;
- pergunta concluída não é repetida salvo solicitação explícita de LEANDRO;
- discovery input não é decisão;
- ao apresentar alternativas, MESTRE marca sua recomendação com **⭐** para facilitar visualização; a estrela não substitui decisão de LEANDRO;
- encerramento da Discovery não autoriza implementação automaticamente.

---

## 2. Estado final

```yaml
question_count_total: 20
questions_completed: 20
questions_remaining: 0
last_completed_question: 20
next_question: NONE
question_01: COMPLETED_APPROVED_BY_LEANDRO
question_02: COMPLETED_APPROVED_BY_LEANDRO
question_03: COMPLETED_APPROVED_BY_LEANDRO
question_04: COMPLETED_APPROVED_BY_LEANDRO
question_05: COMPLETED_APPROVED_BY_LEANDRO
question_06: COMPLETED_APPROVED_BY_LEANDRO
question_07: COMPLETED_APPROVED_BY_LEANDRO
question_08: COMPLETED_APPROVED_BY_LEANDRO
question_09: COMPLETED_APPROVED_BY_LEANDRO
question_10: COMPLETED_APPROVED_BY_LEANDRO
question_11: COMPLETED_APPROVED_BY_LEANDRO
question_12: COMPLETED_APPROVED_BY_LEANDRO
question_13: COMPLETED_APPROVED_BY_LEANDRO
question_14: COMPLETED_APPROVED_BY_LEANDRO
question_15: COMPLETED_APPROVED_BY_LEANDRO
question_16: COMPLETED_APPROVED_BY_LEANDRO
question_17: COMPLETED_APPROVED_BY_LEANDRO
question_18: COMPLETED_APPROVED_BY_LEANDRO
question_19: COMPLETED_APPROVED_BY_LEANDRO
question_20: COMPLETED_APPROVED_BY_LEANDRO

discovery_verdict: CONDITIONAL_GO
conditional_go_scope: IMPLEMENTATION_PREPARATION_ONLY
conceptual_architecture: APPROVED

implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

---

## 3. Perguntas canônicas e decisões

### Q1 — Qual deve ser o contrato de ativação do MCF?
**Decisão:** `HYBRID_INTENT_AND_EXPLICIT_ACTIVATION` — Opção D.

### Q2 — Como o MCF deve operar em diferentes ambientes de execução?
**Decisão:** `LOCAL_FIRST_REMOTE_CHECKPOINTED` — Opção D.

### Q3 — Como o bootstrap encontra e verifica a versão/metodologia vigente?
**Decisão:** `VERIFIED_TWO_STAGE_BOOTSTRAP` — Opção D.

### Q4 — Como deve funcionar o fail-closed quando GitHub/bootstrap/fonte canônica não estiver acessível?
**Decisão:** `VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES` — Opção D.

### Q5 — Quais modos de entrada de projeto o MCF deve reconhecer?
**Decisão:** `THREE_CANONICAL_ENTRY_MODES_WITH_RECOVERY_ROUTE` — Opção D.

### Q6 — Como deve funcionar a entrada de um projeto novo?
**Decisão:** `PROGRESSIVE_DURABLE_PROJECT_GENESIS` — Opção D.

### Q7 — Como deve funcionar a entrada de um projeto existente antes de perguntar ao humano?
**Decisão:** `EVIDENCE_FIRST_EXISTING_PROJECT_RECONNAISSANCE` — Opção D.

### Q8 — Quais dimensões de intenção humana são obrigatórias?
**Decisão:** `CANONICAL_INTENT_DIMENSIONS_WITH_EVIDENCE_AWARE_RESOLUTION` — Opção D.

### Q9 — Como perguntas adaptativas devem evitar interrogatório rígido e perguntas já respondidas por evidência?
**Decisão:** `EVIDENCE_AWARE_ADAPTIVE_QUESTIONING_WITH_INFORMATION_GAIN` — Opção D.

### Q10 — Como deve funcionar o progressive read-back e correção de entendimento?
**Decisão:** `EVENT_DRIVEN_PROGRESSIVE_SEMANTIC_READBACK` — Opção D.

### Q11 — Como medir Context Sufficiency / Intent Readiness antes de planejar?
**Decisão:** `SEMANTIC_READINESS_GATE_WITH_BLOCKING_UNKNOWNS` — Opção D.

### Q12 — Qual é o contrato do Project Intent Package?
**Decisão:** `VERSIONED_PROVENANCE_AWARE_PROJECT_INTENT_PACKAGE` — Opção D.

### Q13 — Quais artefatos adicionais um projeto existente precisa produzir?
**Decisão:** `EVIDENCE_BOUND_CONDITIONAL_EXISTING_PROJECT_ARTIFACT_PIPELINE` — Opção D.

### Q14 — O que é canônico e o que é derived view na memória/continuidade do projeto?
**Decisão:** `LAYERED_AUTHORITY_WITH_REBUILDABLE_PROJECT_VIEWS` — Opção D.

### Q15 — Qual é a divisão de autoridade entre LEANDRO e a equipe MCF após o intake?
**Decisão:** `DELEGATED_TECHNICAL_AUTONOMY_WITHIN_HUMAN_APPROVED_ENVELOPE` — Opção D.

### Q16 — Quais ações continuam exigindo HUMAN_GATE e quais decisões técnicas podem ser delegadas?
**Decisão:** `IMPACT_BASED_HUMAN_GATES_WITH_SCOPED_STANDING_AUTHORIZATION` — Opção D.

### Q17 — Como checkpoint, pause/resume e troca de chat devem funcionar?
**Decisão:** `EVENT_DRIVEN_TRANSFERABLE_CHECKPOINT_WITH_VERIFIED_RESUME` — Opção D.

### Q18 — Como evoluir a v1.0.0 para v1.1.0 preservando compatibilidade e evitando duplicação de mecanismos?
**Decisão:** `COMPATIBLE_EXTENSION_VERSIONING_AND_EXPLICIT_MIGRATION` — Opção D.

### Q19 — Como provar a v1.1.0 com testes reais?
**Decisão:** `EVIDENCE_LAYERED_REAL_SCENARIO_QUALIFICATION_MATRIX` — Opção D.

### Q20 — Qual é a arquitetura/contrato consolidado da v1.1.0 e qual o GO / CONDITIONAL GO / NO-GO para implementação?
**Decisão:** `CONSOLIDATED_V11_ARCHITECTURE_WITH_CONDITIONAL_GO` — Opção D.

Veredito Q20:

```yaml
DISCOVERY: COMPLETE
DISCOVERY_VERDICT: CONDITIONAL_GO
SCOPE: IMPLEMENTATION_PREPARATION_ONLY
IMPLEMENTATION: NO_GO
CODEX_IMPLEMENTATION: NO_GO
PROTOTYPE: NO_GO
RELEASE: NO_GO
```

---

## 4. Arquitetura consolidada

A arquitetura Q1–Q20 está organizada em dez blocos:

1. `ACTIVATION_AND_BOOTSTRAP`
2. `PROJECT_ENTRY`
3. `PROJECT_CONTEXT`
4. `ALIGNMENT_AND_PLANNING_INPUTS`
5. `MISSION_EXECUTION`
6. `AUTHORITY_AND_HUMAN_GATE`
7. `PROJECT_MEMORY_AND_AUTHORITY`
8. `CONTINUITY_AND_RECOVERY`
9. `VERSION_AND_COMPATIBILITY`
10. `QUALIFICATION`

Princípios de fechamento:

```text
DISCOVERY_COMPLETE != IMPLEMENTATION_AUTHORIZED
CONDITIONAL_GO = GO_FOR_TECHNICAL_PREPARATION_ONLY
V1_1_EXTENDS_V1_0
REUSE_BEFORE_NEW_PRIMITIVE
EXTEND_BEFORE_REPLACE
VERSION_BEFORE_BREAK
NEW_PRIMITIVE_REQUIRES_NO_EQUIVALENT_TEST
DOCUMENTED != IMPLEMENTED != TESTED != QUALIFIED
```

---

## 5. Handoff após Q20

O boundary canônico final da Discovery é:

```text
MCF-V1.1-RESUME-CARD.md
+
MCF-V1.1-DISCOVERY-CHECKPOINT-020.md
+
MCF-V1.1-DECISION-LEDGER-001.md
```

Não há Q21.

Qualquer novo chat deve consultar GitHub live, reconhecer Q1–Q20 como concluídas e não iniciar implementação automaticamente.

---

## 6. Próxima fase autorizável

A Q20 autoriza apenas **PRE-IMPLEMENTATION TECHNICAL PREPARATION / CONFORMANCE**.

Essa fase deve produzir:

- análise de impacto/conformance da v1.0;
- mapa de reutilização/extensão versus novos primitives;
- `NO_EQUIVALENT_TEST` para candidatos a novos primitives;
- schemas/contratos exatos;
- runtime/skill/event/persistence mapping;
- migration + compatibility plan;
- implementation plan;
- Qualification Plan aderente à Q19;
- team review;
- proposta de HUMAN_GATE separado para LEANDRO decidir eventual início da implementação.

## 7. Próxima ação

> **Iniciar preparação técnica/conformance da v1.1, sem implementação.**
