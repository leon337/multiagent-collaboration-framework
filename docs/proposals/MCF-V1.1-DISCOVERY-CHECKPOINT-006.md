# MCF v1.1 — Discovery Checkpoint 006

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-006`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 6
questions_remaining: 14
last_completed_question: 6
next_question: 7
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução:** NÃO repetir Q1–Q6 salvo solicitação explícita de LEANDRO. Retomar em Q7.

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

```yaml
stages:
  - VERIFIED_MCF_ACTIVATION
  - IDEA_CAPTURE
  - MINI_TRIAGE
  - PROJECT_GENESIS
  - DURABLE_INTAKE_CHECKPOINT
  - HUMAN_INTENT_DISCOVERY
  - INTENT_READINESS
  - INTENT_ALIGNMENT_GATE
  - MCF_START_MISSION

mini_triage:
  target_questions: 3_to_5
  purpose: PROJECT_IDENTITY_NOT_FULL_REQUIREMENTS

project_genesis:
  before_deep_intent_discovery: true
  methodology_pin_required: true
  durable_project_home_required: true

pre_alignment:
  product_implementation: NO_GO
  discovery_and_documentation: ALLOWED
  noncanonical_discovery_prototype: CONDITIONAL

minimum_pre_mission_artifacts:
  - PROJECT_GENESIS_RECORD
  - PROJECT_INTAKE_CHECKPOINT
  - PROJECT_INTENT_PACKAGE
  - INTENT_ALIGNMENT_RECEIPT
```

Princípios:

```text
UNDERSTAND_BEFORE_IMPLEMENT
PERSIST_BEFORE_CONTEXT_IS_LOST
LOCAL_FIRST_CODE != LOCAL_ONLY_MEMORY
PROJECT_INTENT != MISSION_CONTRACT
```

O methodology pin nasce no Project Genesis. `MISSION CONTRACT` só nasce depois do `INTENT_ALIGNMENT_GATE = PASS`, via `MCF-START-MISSION`.

---

## 3. Fronteira deixada para Q7

Q7 deve decidir como o MCF trata `ADOPT_EXISTING_PROJECT` antes de perguntar ao humano em profundidade, incluindo:

- reconnaissance read-only inicial;
- quais fontes técnicas consultar automaticamente;
- como separar fatos observados, inferências e unknowns;
- como reconstruir o `AS-IS`;
- quando produzir o primeiro `Project Reality Report`;
- como detectar continuidade MCF já existente e reclassificar para `RESUME`/`RECOVER` quando necessário;
- quando voltar a LEANDRO para confirmação/correção;
- quais ações permanecem bloqueadas antes da confirmação da realidade reconstruída.

---

## 4. Próxima pergunta

> **Q7 — Como deve funcionar a entrada de um projeto existente (`ADOPT_EXISTING_PROJECT`) antes de perguntar ao humano em profundidade?**

Implementação continua `NO_GO`.
