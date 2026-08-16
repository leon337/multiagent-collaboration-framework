# MCF v1.1 — Discovery Checkpoint 012

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-012`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 12
questions_remaining: 8
last_completed_question: 12
next_question: 13
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
Q12: COMPLETED_APPROVED_BY_LEANDRO
Q13: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução de retomada:** NÃO repetir Q1–Q12 salvo solicitação explícita de LEANDRO. Retomar em Q13.

LEANDRO informou que a continuação ocorrerá em **outro chat** por causa do tamanho da janela atual. Este checkpoint e o Resume Card são o boundary canônico de handoff; o novo chat deve consultar GitHub live antes de afirmar estado atual.

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
- Q12 — `VERSIONED_PROVENANCE_AWARE_PROJECT_INTENT_PACKAGE` — Opção D.

### Q12 — contrato aprovado

```yaml
purpose:
  durable_representation_of_human_intent: true
  chat_transcript: false
  architecture_spec: false
  backlog: false
  mission_contract: false

separation:
  raw_human_intent: true
  mestre_synthesis: true
  human_decision: true
  machine_inference: true
  evidence: true
  assumption: true

core_sections:
  - IDENTITY
  - ORIGINAL_INTENT
  - CURRENT_INTENT_DIMENSIONS
  - HUMAN_DECISIONS
  - TECHNICAL_DELEGATIONS
  - ASSUMPTIONS
  - UNKNOWNS
  - BLOCKERS
  - CONFLICTS
  - READINESS
  - ALIGNMENT

dimensions:
  canonical_count: 20
  preserve_Q8_states: true
  readiness_impact_required: true
  provenance_required_for_material_claims: true

provenance_types:
  - HUMAN_DIRECT_STATEMENT
  - HUMAN_CONFIRMED_SYNTHESIS
  - PRIOR_VALID_HUMAN_DECISION
  - MACHINE_EVIDENCE
  - MACHINE_INFERENCE
  - TECHNICAL_DELEGATION
  - NOT_APPLICABLE_JUSTIFICATION

decision_history:
  overwrite_material_human_decisions: false
  previous_material_decision: SUPERSEDED
  current_material_decision: CURRENT
  rejected_machine_interpretation_is_human_decision: false

assumptions:
  may_silently_resolve_blocking_human_intent: false

lifecycle:
  - DISCOVERY_IN_PROGRESS
  - READY_FOR_ALIGNMENT
  - ALIGNED
  - REOPENED_AFTER_MATERIAL_CHANGE

revisioning:
  identifiable_revision_required: true
  aligned_revision_immutable: true

alignment:
  binds_to_exact_revision: true
  final_intent_readback_required: true
  intent_alignment_receipt_required: true

mission_contract:
  created_after_alignment: true
  references_aligned_pip_revision: true
  may_redefine_human_intent: false

product_brief:
  must_not_introduce_new_intent: true
  canonical_vs_derived: DEFER_TO_Q14

existing_project_artifacts:
  reality_report_and_gap_map: DEFER_TO_Q13
```

Princípios:

```text
PIP != CHAT_LOG
PIP != ARCHITECTURE
PIP != BACKLOG
PIP != MISSION_CONTRACT
RAW_INTENT != SYNTHESIS
SYNTHESIS != HUMAN_DECISION
INFERENCE != HUMAN_INTENT
ASSUMPTION != RESOLUTION
OLD_HUMAN_DECISION -> SUPERSEDED
NEW_HUMAN_DECISION -> CURRENT
ALIGNMENT_BINDS_TO_EXACT_PIP_REVISION
PROJECT_INTENT_CAN_OUTLIVE_ANY_SINGLE_MISSION
```

O PIP nasce progressivamente após `PROJECT_GENESIS`/início do intake, é enriquecido em boundaries semânticos, preserva `IDEA_CAPTURE` separado da síntese atual e registra provenance, delegações, assumptions, unknowns, blockers e conflicts como dados de primeira classe. `Intent Alignment Gate` aprova uma revisão exata; uma revisão alinhada permanece imutável e mudança material abre nova revisão. `Mission Contract` só nasce depois do alinhamento e referencia a revisão alinhada do PIP.

---

## 3. Fronteira deixada para Q13

Q13 deve decidir **quais artefatos adicionais um projeto existente (`ADOPT_EXISTING_PROJECT`) precisa produzir e como eles se relacionam com o PIP**, incluindo candidatos já preservados:

- `Project Reality Report` — realidade `AS-IS` reconstruída por evidência;
- `AS-IS / TO-BE Gap Map` — diferenças entre realidade confirmada e intenção humana;
- `Completion/Recovery Plan` — como transformar o gap em execução posterior;
- diferença entre adoção de projeto externo e recuperação de continuidade MCF quebrada;
- quais desses artefatos são obrigatórios, em quais entry modes e em qual ordem;
- como impedir que o `Project Reality Report` contamine o PIP com intenção inferida;
- como ligar evidências e baseline exato aos artefatos de realidade;
- quando o Gap Map pode ser produzido em relação a Reality Confirmation e Intent Alignment.

A decisão de canônico vs derived permanece reservada para Q14.

---

## 4. Próxima pergunta

> **Q13 — Quais artefatos adicionais um projeto existente precisa produzir?**

Implementação continua `NO_GO`.
