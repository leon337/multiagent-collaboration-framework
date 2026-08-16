# MCF v1.1 — Discovery Checkpoint 013

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-013`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 13
questions_remaining: 7
last_completed_question: 13
next_question: 14
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
Q13: COMPLETED_APPROVED_BY_LEANDRO
Q14: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução de retomada:** NÃO repetir Q1–Q13 salvo solicitação explícita de LEANDRO. Retomar em Q14.

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
- Q13 — `EVIDENCE_BOUND_CONDITIONAL_EXISTING_PROJECT_ARTIFACT_PIPELINE` — Opção D.

---

## 3. Q13 — contrato aprovado

```yaml
artifacts:
  project_reality_report:
    purpose: REPRESENT_AS_IS_ONLY
    exact_baseline_required: true
    evidence_and_provenance_required: true
    human_intent_contamination_forbidden: true
  as_is_to_be_gap_map:
    purpose: COMPARE_CONFIRMED_REALITY_TO_ALIGNED_INTENT
    exact_prr_revision_required: true
    exact_aligned_pip_revision_required: true
    planning_authority_before_alignment: false
  completion_recovery_plan:
    purpose: TRANSFORM_VALIDATED_GAPS_INTO_LATER_EXECUTION_PATH
    requires_valid_gap_map: true
    implementation_authority: false

entry_modes:
  ADOPT_EXISTING_PROJECT:
    project_reality_report: REQUIRED
    gap_map: REQUIRED_WHEN_MATERIAL_GAP_EXISTS
    completion_recovery_plan: REQUIRED_WHEN_MATERIAL_GAP_EXISTS
  RESUME_MCF_PROJECT:
    full_reconstruction_by_default: false
    requires_verified_continuity: true
  RECOVER_MCF_PROJECT:
    reconcile_checkpoint_pip_mission_state_github_and_evidence_first: true
    full_reconstruction_by_default: false
    escalate_on_material_divergence: true
    may_require_new_prr_gap_plan: true

reality_confirmation:
  occurs_after_reconnaissance: true
  human_statement_about_technical_fact_becomes_machine_evidence_automatically: false
  human_intent_corrections_route_to_pip: true
  disputed_observable_facts_require_evidence_reassessment: true

gap_map_authority:
  preliminary_analysis_before_alignment: allowed_non_authoritative
  authoritative_for_planning_requires:
    - REALITY_CONFIRMED
    - EXACT_PRR_REVISION
    - PIP_ALIGNED
    - EXACT_ALIGNED_PIP_REVISION

invalidation:
  material_reality_change:
    - NEW_PRR_REVISION
    - GAP_REASSESSMENT
  material_intent_change:
    - NEW_PIP_WORKING_REVISION
    - REALIGNMENT_IF_REQUIRED
    - GAP_REASSESSMENT
  material_gap_change:
    - PLAN_REASSESSMENT

canonical_vs_derived: DEFER_TO_Q14
implementation_authorized: false
```

Regras centrais:

```text
AS_IS != TO_BE
PRR != PIP
PRR != PLAN
HUMAN_AUTHORITY_OVER_INTENT != AUTOMATIC_TECHNICAL_EVIDENCE
GAP = EXACT_PRR_REVISION x EXACT_ALIGNED_PIP_REVISION
PLAN_CREATED != IMPLEMENTATION_AUTHORIZED
RESUME != RECONSTRUCT_BY_DEFAULT
RECOVER = RECONCILE_FIRST, ESCALATE_ON_MATERIAL_DIVERGENCE
MATERIAL_CHANGE -> REASSESS_DEPENDENT_ARTIFACTS
```

### `ADOPT_EXISTING_PROJECT`

Fluxo aprovado:

```text
READ_ONLY RECONNAISSANCE
→ PROJECT REALITY REPORT
→ REALITY CONFIRMATION
→ HUMAN INTENT DISCOVERY
→ PIP
→ INTENT ALIGNMENT
→ AS-IS / TO-BE GAP MAP
→ COMPLETION PLAN, se houver gap material
→ MCF-START-MISSION
```

O PRR é obrigatório. Gap Map e Completion/Recovery Plan são condicionais à existência de gap material.

### `RESUME_MCF_PROJECT`

Quando a continuidade MCF é verificável, a retomada não reconstrói toda a Discovery ou os três artefatos por padrão. O estado canônico é reconciliado com GitHub/evidências e a missão continua do checkpoint válido.

### `RECOVER_MCF_PROJECT`

Primeiro se reconciliam checkpoint, PIP, Mission State, GitHub live e evidências. Somente divergência material escala para reconstrução adicional e pode exigir nova revisão de PRR, Gap Map e Completion/Recovery Plan.

### Relação PRR × PIP × Gap × Plan

```text
PROJECT REALITY REPORT
  = realidade AS-IS em baseline/revisão identificável

PROJECT INTENT PACKAGE
  = intenção TO-BE de LEANDRO em revisão identificável

GAP MAP
  = comparação entre PRR exato e PIP alinhado exato

COMPLETION / RECOVERY PLAN
  = caminho de execução posterior derivado dos gaps validados
```

Reality Confirmation não transforma afirmação humana sobre fato técnico em evidência automática. Correção de intenção alimenta PIP; disputa sobre fato observável exige reavaliação da evidência.

Análise preliminar de gap pode existir antes do alinhamento, porém não possui autoridade de planejamento. Gap Map apto a orientar planejamento exige Reality Confirmation e `INTENT_ALIGNMENT_GATE` sobre revisão exata do PIP.

Mudança material de realidade, intenção ou gap reabre/recalcula apenas artefatos dependentes, preservando provenance e referências de revisão.

---

## 4. Fronteira deixada para Q14

Q14 deve decidir **o que é canônico e o que é derived view na memória/continuidade do projeto**.

A Q13 deliberadamente NÃO classificou PRR, PIP, Gap Map, Completion/Recovery Plan, Product Brief, checkpoints, receipts ou views operacionais como canônicos/derived. Essa autoridade permanece reservada para Q14.

---

## 5. Próxima pergunta

> **Q14 — O que é canônico e o que é derived view na memória/continuidade do projeto?**

Implementação continua `NO_GO`.
