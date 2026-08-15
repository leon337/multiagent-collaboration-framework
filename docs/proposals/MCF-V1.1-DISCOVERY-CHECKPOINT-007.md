# MCF v1.1 — Discovery Checkpoint 007

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-007`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 7
questions_remaining: 13
last_completed_question: 7
next_question: 8
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução:** NÃO repetir Q1–Q7 salvo solicitação explícita de LEANDRO. Retomar em Q8.

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

```yaml
initial_entry_mode: ADOPT_EXISTING_PROJECT
classification_status: PROVISIONAL
reconnaissance: READ_ONLY_FIRST
target_project_mutation: FORBIDDEN
baseline:
  exact_ref_or_sha_required: true
  observed_at_required: true
evidence_states:
  - VERIFIED_FACT
  - OBSERVED_FACT
  - INFERRED
  - UNKNOWN
  - CONFLICTING
  - STALE_SUSPECTED
mcf_continuity_detection:
  verified: RECLASSIFY_TO_RESUME
  broken_or_unverified: ROUTE_TO_RECOVER
if_still_adopt:
  reconstruct_as_is: true
  project_reality_report: REQUIRED
  reality_readback: REQUIRED
reality_confirmation:
  - CONFIRMED
  - CONFIRMED_WITH_CORRECTIONS
  - REJECTED_OR_MISUNDERSTOOD
deep_human_intent_discovery:
  before_reality_confirmation: NO_GO
  after_reality_confirmation: GO
implementation_before_intent_alignment_gate: NO_GO
```

Princípios:

```text
READ_ONLY_FIRST
AS_IS != TO_BE
FACT != INFERENCE
DOCUMENTATION != AUTOMATICALLY_REALITY
MACHINE_DISCOVERS_TECHNICAL_FACTS
HUMAN_EXPLAINS_INTENT
```

---

## 3. Fronteira deixada para Q8

Q8 deve decidir **quais dimensões de intenção humana são obrigatórias** na `Human Intent Discovery`, tanto para `NEW_PROJECT` quanto para `ADOPT_EXISTING_PROJECT` após confirmação da realidade.

A Q8 deve definir o conjunto canônico de dimensões, sem transformar o processo em formulário rígido. Pontos já candidatos incluem problema, motivação, resultado desejado, usuários, jornadas críticas, must-have, nice-to-have, non-goals, prioridades, regras de negócio, dados, permissões, automação, integrações, plataforma, custos, qualidade, tolerância a falhas, definição de pronto e visão futura.

Detalhes sobre perguntas adaptativas ficam para Q9; progressive read-back para Q10; readiness para Q11.

---

## 4. Próxima pergunta

> **Q8 — Quais dimensões de intenção humana são obrigatórias?**

Implementação continua `NO_GO`.
