# MCF v1.1 — Discovery Checkpoint 010

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-010`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 10
questions_remaining: 10
last_completed_question: 10
next_question: 11
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
Q11: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução:** NÃO repetir Q1–Q10 salvo solicitação explícita de LEANDRO. Retomar em Q11.

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

### Q10 — contrato aprovado

```yaml
readback_levels:
  - MICRO_CLARIFICATION
  - PROGRESSIVE_READBACK
  - FINAL_INTENT_READBACK

progressive_readback_triggers:
  - MATERIAL_SCOPE_CHANGE
  - MATERIAL_HUMAN_INTENT_CONFLICT
  - HIGH_IMPACT_INTERPRETATION
  - SIGNIFICANT_SEMANTIC_BLOCK_COMPLETED
  - EXCESSIVE_CHANGE_SINCE_LAST_READBACK
  - CONTEXT_OR_HANDOFF_BOUNDARY

cadence_safety_net:
  meaningful_exchanges: APPROXIMATELY_4_TO_6
  fixed_count: false

result_states:
  - CONFIRMED
  - CORRECTED
  - REJECTED

partial_confirmation:
  allowed: true

correction:
  stop_wrong_semantic_propagation: true
  identify_affected_dimensions: true
  invalidate_derived_assumptions: true
  recalculate_dimension_states: true

final_readback:
  required_before_intent_alignment_gate: true

progressive_confirmation:
  authorizes_implementation: false
```

Princípios:

```text
PROGRESSIVE_READBACK = SEMANTIC_CHECKSUM
HIGH_IMPACT_INTERPRETATION_REQUIRES_HUMAN_SEMANTIC_CHECK
CORRECTION_MUST_PROPAGATE_TO_DEPENDENT_DIMENSIONS
PARTIAL_CONFIRMATION_IS_ALLOWED
REJECTED_MACHINE_INTERPRETATION != HUMAN_DECISION
PROGRESSIVE_CONFIRMATION != INTENT_ALIGNMENT_GATE
```

Read-back deve enfatizar entendimento novo/material, mudanças, restrições importantes e incertezas abertas, sem recitar todas as dimensões. Mudança humana material preserva `SUPERSEDED -> CURRENT`; interpretação de máquina rejeitada jamais vira decisão humana.

---

## 3. Fronteira deixada para Q11

Q11 deve decidir como o MCF mede **Context Sufficiency / Intent Readiness** antes de planejar, incluindo:

- quais estados das 20 dimensões são aceitáveis;
- como distinguir `UNKNOWN` tolerável de `BLOCKING_UNKNOWN`;
- se deve existir score, matriz, regras mínimas ou combinação;
- quais dimensões não podem permanecer ambíguas;
- como tratar delegações técnicas e `NOT_APPLICABLE`;
- como conflitos e correções afetam readiness;
- quando MESTRE pode declarar `READY_FOR_ALIGNMENT`;
- quando deve permanecer `NOT_READY` ou `CONDITIONALLY_READY`;
- como impedir que quantidade de perguntas seja confundida com suficiência de contexto.

---

## 4. Próxima pergunta

> **Q11 — Como medir Context Sufficiency / Intent Readiness antes de planejar?**

Implementação continua `NO_GO`.
