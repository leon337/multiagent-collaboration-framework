# MCF v1.1 — Discovery Checkpoint 009

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-009`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 9
questions_remaining: 11
last_completed_question: 9
next_question: 10
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: COMPLETED_APPROVED_BY_LEANDRO
Q9: COMPLETED_APPROVED_BY_LEANDRO
Q10: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução:** NÃO repetir Q1–Q9 salvo solicitação explícita de LEANDRO. Retomar em Q10.

---

## 2. Decisões preservadas

- Q1 — `HYBRID_INTENT_AND_EXPLICIT_ACTIVATION` — Opção D.
- Q2 — `LOCAL_FIRST_REMOTE_CHECKPOINTED` — Opção D.
- Q3 — `VERIFIED_TWO_STAGE_BOOTSTRAP` — Opção D.
- Q4 — `VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES` — Opção D.
- Q5 — `THREE_CANONICAL_ENTRY_MODES_WITH_RECOVERY_ROUTE` — Opção D.
- Q6 — `PROGRESSIVE_DURABLE_PROJECT_GENESIS` — Opção D.
- Q7 — `EVIDENCE_FIRST_EXISTING_PROJECT_RECONNAISSANCE` — Opção D.
- Q8 — `CANONICAL_INTENT_DIMENSIONS_WITH_EVIDENCE_AWARE_RESOLUTION` — Opção D.
- Q9 — `EVIDENCE_AWARE_ADAPTIVE_QUESTIONING_WITH_INFORMATION_GAIN` — Opção D.

### Q9 — contrato aprovado

```yaml
questioning_model:
  fixed_sequence: false
  fixed_question_count: false
  one_primary_question_at_a_time: true

before_each_question:
  - INGEST_NEW_CONTEXT
  - UPDATE_ALL_AFFECTED_DIMENSIONS
  - CHECK_CONTRADICTIONS
  - IDENTIFY_BLOCKING_UNCERTAINTIES
  - RANK_QUESTION_CANDIDATES

question_priority:
  - MATERIAL_HUMAN_INTENT_CONFLICT
  - BLOCKING_UNCERTAINTY
  - HIGH_INFORMATION_GAIN
  - HIGH_RISK_UNCERTAINTY
  - DEPENDENCY_UNLOCK
  - SECONDARY_REFINEMENT

clear_dimension:
  repeat_without_new_cause: PROHIBITED

evidence:
  use_to_reduce_questions: true
  may_replace_human_preference: false

followup:
  requires_information_value: true

conflict_types:
  - AS_IS_TO_BE_DIFFERENCE
  - EVIDENCE_CONFLICT
  - HUMAN_INTENT_CONFLICT

low_information_loop:
  repeated_followups: PROHIBITED
  unresolved_nonblocking: PRESERVE_AND_CONTINUE
  unresolved_blocking: MARK_BLOCKING_UNKNOWN

human_delegation:
  valid_resolution: true
```

Princípios:

```text
ONE_ANSWER_MAY_RESOLVE_MULTIPLE_DIMENSIONS
CLEAR_DOES_NOT_REOPEN_WITHOUT_CAUSE
FOLLOW_UP_REQUIRES_INFORMATION_VALUE
AS_IS_TO_BE_DIFFERENCE != HUMAN_INTENT_CONFLICT
MACHINE_EVIDENCE_REDUCES_QUESTIONS_BUT_DOES_NOT_REPLACE_HUMAN_INTENT
QUESTION -> ANSWER -> UPDATE_DIMENSIONS -> REASSESS -> NEXT_BEST_QUESTION
```

Mudança explícita de decisão preserva histórico: anterior `SUPERSEDED`, nova `CURRENT`. A carga cognitiva humana é fator de custo na escolha da próxima pergunta.

---

## 3. Fronteira deixada para Q10

Q10 deve decidir como funciona o **progressive read-back e a correção de entendimento** durante a Human Intent Discovery, incluindo:

- quando MESTRE deve interromper perguntas para resumir o entendimento;
- quais dimensões incluir em cada read-back;
- como LEANDRO confirma, corrige ou rejeita partes da síntese;
- como registrar correções sem apagar histórico;
- como evitar que uma interpretação errada se propague por várias perguntas;
- quando um read-back é obrigatório por mudança material de escopo ou conflito.

Readiness global permanece reservado para Q11.

---

## 4. Próxima pergunta

> **Q10 — Como deve funcionar o progressive read-back e a correção de entendimento?**

Implementação continua `NO_GO`.
