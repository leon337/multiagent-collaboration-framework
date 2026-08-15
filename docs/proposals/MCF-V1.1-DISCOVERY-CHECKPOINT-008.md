# MCF v1.1 — Discovery Checkpoint 008

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-008`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 8
questions_remaining: 12
last_completed_question: 8
next_question: 9
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: COMPLETED_APPROVED_BY_LEANDRO
Q9: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução:** NÃO repetir Q1–Q8 salvo solicitação explícita de LEANDRO. Retomar em Q9.

---

## 2. Decisões preservadas

### Q1
`HYBRID_INTENT_AND_EXPLICIT_ACTIVATION` — Opção D.

### Q2
`LOCAL_FIRST_REMOTE_CHECKPOINTED` — Opção D.

### Q3
`VERIFIED_TWO_STAGE_BOOTSTRAP` — Opção D.

### Q4
`VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES` — Opção D.

### Q5
`THREE_CANONICAL_ENTRY_MODES_WITH_RECOVERY_ROUTE` — Opção D.

### Q6
`PROGRESSIVE_DURABLE_PROJECT_GENESIS` — Opção D.

### Q7
`EVIDENCE_FIRST_EXISTING_PROJECT_RECONNAISSANCE` — Opção D.

### Q8
`CANONICAL_INTENT_DIMENSIONS_WITH_EVIDENCE_AWARE_RESOLUTION` — Opção D.

```yaml
canonical_dimension_count: 20
fixed_question_count_required: false

intent_dimensions:
  purpose:
    - PROBLEM
    - MOTIVATION
    - DESIRED_OUTCOME
  users_and_experience:
    - TARGET_USERS
    - CRITICAL_USER_JOURNEYS
  scope:
    - MUST_HAVE
    - SHOULD_HAVE
    - NON_GOALS
    - PRIORITIES_AND_TRADEOFFS
  domain_and_operation:
    - BUSINESS_RULES
    - DATA_AND_SENSITIVITY
    - ROLES_AND_PERMISSIONS
    - AUTOMATION_LEVEL
    - INTEGRATIONS
    - PLATFORM_AND_USAGE_CONTEXT
  constraints_quality_and_success:
    - COST_AND_RESOURCE_CONSTRAINTS
    - QUALITY_EXPECTATIONS
    - FAILURE_TOLERANCE
    - DEFINITION_OF_DONE
    - FUTURE_VISION

dimension_states:
  - CLEAR
  - PARTIAL
  - UNKNOWN
  - CONFLICTING
  - NOT_APPLICABLE
```

Regras:

```text
DIMENSION_REQUIRED != QUESTION_REQUIRED
UNKNOWN != NOT_APPLICABLE
UNKNOWN != HUMAN_HAS_NO_PREFERENCE
MACHINE_EVIDENCE_CAN_SUPPLY_FACTS
MACHINE_EVIDENCE_CANNOT_INVENT_HUMAN_PREFERENCES
TEAM_ENGINEERING_DECIDES_HOW
```

Cada dimensão precisa estar compreendida ou explicitamente resolvida. LEANDRO pode responder `não sei` ou delegar uma decisão técnica à equipe; isso não é falha de Intake. Tecnologia específica não é dimensão humana obrigatória, salvo quando representar restrição real.

---

## 3. Fronteira deixada para Q9

Q9 deve decidir **como o MESTRE transforma as 20 dimensões canônicas em uma conversa adaptativa**, evitando perguntas repetidas, interrogatório rígido e perguntas já resolvidas por contexto/evidência.

A Q9 deve definir, entre outros pontos:

- quando uma dimensão já está suficientemente respondida para não ser perguntada novamente;
- quando evidência técnica pode reduzir perguntas humanas;
- quando uma resposta abre follow-up;
- como priorizar dúvidas bloqueantes sobre detalhes secundários;
- como lidar com contradições entre respostas humanas, evidência e contexto;
- como manter rastreabilidade entre cada pergunta e a dimensão que ela tenta resolver;
- limites para evitar loops de perguntas sem ganho de informação.

Progressive read-back permanece reservado para Q10; readiness global para Q11.

---

## 4. Próxima pergunta

> **Q9 — Como perguntas adaptativas devem evitar interrogatório rígido e perguntas já respondidas por evidência?**

Implementação continua `NO_GO`.
