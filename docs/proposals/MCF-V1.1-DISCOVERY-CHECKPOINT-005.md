# MCF v1.1 — Discovery Checkpoint 005

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-005`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 5
questions_remaining: 15
last_completed_question: 5
next_question: 6
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução:** NÃO repetir Q1–Q5 salvo solicitação explícita de LEANDRO. Retomar em Q6.

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

```yaml
PROJECT_ENTRY_MODE:
  - NEW_PROJECT
  - ADOPT_EXISTING_PROJECT
  - RESUME_MCF_PROJECT

RECOVERY_ROUTE:
  - RECOVER_MCF_PROJECT
```

Semântica:

```text
NEW_PROJECT
= não existe implementação material que precise ser preservada

ADOPT_EXISTING_PROJECT
= existe projeto/implementação, mas sem continuidade MCF verificável

RESUME_MCF_PROJECT
= existe projeto com continuidade MCF verificável

RECOVER_MCF_PROJECT
= projeto previamente MCF cuja continuidade esperada está quebrada, divergente ou não verificável
```

Classificação:

```yaml
human_intent: INPUT
machine_evidence: REQUIRED
automatic_detection: ENABLED
ambiguous_state: PROJECT_ENTRY_CLASSIFICATION_UNRESOLVED
execution_before_classification: false
```

Princípios:

```text
HUMAN_INTENT + MACHINE_EVIDENCE = ENTRY_CLASSIFICATION
ADOPT != RECOVER
RESUME_REQUIRES_VERIFIED_CONTINUITY
```

LEANDRO não precisa conhecer ou escolher os códigos internos. MESTRE classifica a entrada a partir da linguagem natural + evidência disponível. `RECOVER_MCF_PROJECT` é rota excepcional, não quarto modo primário.

---

## 3. Fronteira deixada para Q6

Q5 define **qual modo** foi reconhecido. Q6 deve decidir o protocolo completo para `NEW_PROJECT`, incluindo:

- mini-triagem inicial;
- quando nomear projeto/repositório;
- quando criar ou exigir repositório;
- quando pin da metodologia passa a existir;
- quando iniciar Human Intent Discovery;
- quais ações são permitidas antes do `Intent Alignment Gate`;
- quais artefatos mínimos nascem antes de `MCF-START-MISSION`.

---

## 4. Próxima pergunta

> **Q6 — Como deve funcionar a entrada de um projeto novo (`NEW_PROJECT`)?**

Implementação continua `NO_GO`.
