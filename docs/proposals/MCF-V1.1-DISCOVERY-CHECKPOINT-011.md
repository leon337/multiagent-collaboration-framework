# MCF v1.1 — Discovery Checkpoint 011

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-011`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 11
questions_remaining: 9
last_completed_question: 11
next_question: 12
Q1: COMPLETED_APPROVED_BY_LEANDRO
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
Q12: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução:** NÃO repetir Q1–Q11 salvo solicitação explícita de LEANDRO. Retomar em Q12.

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
- Q10 — `EVENT_DRIVEN_PROGRESSIVE_SEMANTIC_READBACK` — Opção D.
- Q11 — `SEMANTIC_READINESS_GATE_WITH_BLOCKING_UNKNOWNS` — Opção D.

### Q11 — contrato aprovado

```yaml
readiness_is:
  semantic: true
  question_count_based: false
  pure_score_based: false

readiness_impact:
  - BLOCKING
  - NON_BLOCKING

universal_intent_core:
  - PROBLEM
  - DESIRED_OUTCOME
  - TARGET_USERS
  - CRITICAL_USER_JOURNEYS
  - MUST_HAVE
  - NON_GOALS
  - PRIORITIES_AND_TRADEOFFS
  - DEFINITION_OF_DONE

conditionally_critical_dimensions:
  determined_by:
    - DOMAIN
    - RISK
    - DATA_SENSITIVITY
    - EXTERNAL_EFFECTS
    - CRITICAL_JOURNEYS
    - HUMAN_CONSTRAINTS

global_states:
  - NOT_READY
  - CONDITIONALLY_READY
  - READY_FOR_ALIGNMENT

ready_for_alignment_requires:
  blocking_unknowns: 0
  material_human_intent_conflicts: 0
  unresolved_high_impact_interpretations: 0
  semantic_coherence: true
  nonblocking_unknowns_preserved: true
  technical_delegations_explicit: true

ready_for_alignment:
  authorizes_implementation: false
```

Princípios:

```text
QUESTION_COUNT != CONTEXT_SUFFICIENCY
INTENT_SUFFICIENTLY_UNDERSTOOD != ALL_DETAILS_KNOWN
DIMENSION_STATE != READINESS_IMPACT
HIGH_SCORE_DOES_NOT_CANCEL_SEMANTIC_BLOCKER
DELEGATED_TECHNICAL_DETAIL != MISSING_HUMAN_INTENT
NOT_APPLICABLE = RESOLVED_WHEN_JUSTIFIED
CLEAR_FIELDS_CAN_STILL_BE_SEMANTICALLY_INCOHERENT
READY_FOR_ALIGNMENT != IMPLEMENTATION_AUTHORIZED
MATERIAL_INTENT_CHANGE_RECALCULATES_READINESS
```

`BLOCKING_UNKNOWN` é uma incerteza cuja resposta pode alterar materialmente produto, escopo, usuários, segurança, arquitetura, custo, risco ou critério de sucesso. `PARTIAL`/`UNKNOWN` podem permanecer quando explicitamente não bloqueantes. `CONDITIONALLY_READY` não passa automaticamente o `INTENT_ALIGNMENT_GATE`.

---

## 3. Fronteira deixada para Q12

Q12 deve decidir o contrato do **Project Intent Package**, incluindo:

- quais campos são obrigatórios;
- como as 20 dimensões aparecem ou são representadas;
- como preservar `IDEA_CAPTURE` sem misturar fala original com síntese do MESTRE;
- como registrar current decisions, superseded decisions, delegações, assumptions, unknowns e blockers;
- como representar readiness e evidência/proveniência;
- relação entre `Project Intent Package`, `Product Brief` e `Intent Alignment Receipt`;
- quando o pacote nasce, quando é atualizado e quando se torna suficientemente estável para `MCF-START-MISSION`;
- como evitar duplicação com Mission Contract e artefatos existentes da v1.0.

Artefatos de projeto existente adicionais continuam reservados para Q13; canônico vs derived para Q14.

---

## 4. Próxima pergunta

> **Q12 — Qual é o contrato do Project Intent Package?**

Implementação continua `NO_GO`.
