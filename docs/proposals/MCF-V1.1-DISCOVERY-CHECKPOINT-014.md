# MCF v1.1 — Discovery Checkpoint 014

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-014`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 14
questions_remaining: 6
last_completed_question: 14
next_question: 15
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
Q14: COMPLETED_APPROVED_BY_LEANDRO
Q15: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução de retomada:** NÃO repetir Q1–Q14 salvo solicitação explícita de LEANDRO. Retomar em Q15.

### Preferência de apresentação de LEANDRO

Ao apresentar alternativas decisórias, MESTRE deve marcar sua recomendação com **⭐** na lista final de opções para facilitar visualização. A estrela indica recomendação do MESTRE, não decisão automática; somente LEANDRO decide.

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
- Q14 — `LAYERED_AUTHORITY_WITH_REBUILDABLE_PROJECT_VIEWS` — Opção D.

---

## 3. Q14 — contrato aprovado

```yaml
authority_classes:
  CANONICAL_DURABLE_RECORD:
    role: AUTHORITATIVE_WITHIN_IDENTIFIED_SCOPE_AND_BOUNDARY
  LIVE_AUTHORITATIVE_STATE:
    role: CURRENT_AUTHORITY_FOR_VOLATILE_EXTERNAL_FACTS
  DERIVED_REBUILDABLE_VIEW:
    role: REBUILDABLE_FROM_AUTHORITATIVE_INPUTS_WITHOUT_CREATING_NEW_AUTHORITY
  WORKING_PROPOSED_ARTIFACT:
    role: NON_AUTHORITATIVE_UNTIL_EXPLICIT_PROMOTION

scope:
  universal_single_canonical_file: false
  authority_is_domain_and_boundary_specific: true
  duplicate_sources_of_truth: FORBIDDEN

product_brief:
  classification: DERIVED_REBUILDABLE_VIEW
  may_override_pip: false

gap_map:
  classification: DERIVED_REBUILDABLE_VIEW
  exact_prr_and_aligned_pip_inputs_required: true

completion_recovery_plan:
  initial_classification: WORKING_PROPOSED_ARTIFACT
  implementation_authority: false

checkpoint:
  canonical_for_captured_boundary: true
  live_reconciliation_required_for_volatile_state: true

implementation_authorized: false
```

Regras centrais:

```text
CANONICAL != CURRENT_FOREVER
DERIVED_VIEW_CANNOT_OVERRIDE_CANONICAL_RECORD
HISTORICAL_CANONICAL_RECORD_CANNOT_OVERRIDE_NEWER_LIVE_STATE_FOR_VOLATILE_FACTS
LIVE_STATE_CANNOT_REWRITE_HISTORY
MACHINE_INFERENCE_CANNOT_BECOME_HUMAN_DECISION_SILENTLY
REBUILDABLE_INFORMATION_SHOULD_NOT_CREATE_A_SECOND_SOURCE_OF_TRUTH
CHECKPOINT + LIVE_STATE -> RECONCILIATION
PLAN_EXISTS != PLAN_IS_AUTHORITY
```

### Autoridade em camadas

`CANONICAL_DURABLE_RECORD` preserva decisões, contratos, intenção alinhada, evidência, receipts, PRR no baseline exato e checkpoints dentro de boundaries identificados.

`LIVE_AUTHORITATIVE_STATE` governa fatos externos voláteis, como HEAD de branch, PR/Issue, CI, deploy, health, release metadata e provider state.

`DERIVED_REBUILDABLE_VIEW` inclui Resume Card, Current State Summary, Product Brief, Gap Map, dashboards e views de roadmap; esses artefatos devem ser reconstruíveis e não podem criar autoridade concorrente.

`WORKING_PROPOSED_ARTIFACT` inclui planos, análises, drafts e propostas antes de promoção explícita da decisão/contrato correspondente.

Um registro canônico histórico permanece verdadeiro sobre seu boundary, mas não substitui estado live mais recente para fatos voláteis. Estado live não reescreve história. Promoção de uma análise/proposta para decisão autoritativa deve ser explícita.

---

## 4. Fronteira deixada para Q15

Q15 deve definir **a divisão de autoridade entre LEANDRO e a equipe MCF após o intake**, preservando:

- LEANDRO como autoridade final sobre intenção, prioridades, limites e decisões humanas que a governança reservar ao humano;
- equipe MCF como responsável por traduzir intenção aprovada em engenharia e tomar decisões técnicas delegadas dentro do escopo;
- distinção entre autoridade humana final e microgerenciamento técnico;
- relação entre PIP alinhado, Mission Contract e decisões técnicas posteriores;
- como tratar decisões que mudam materialmente intenção, escopo, custo, risco ou resultado esperado;
- fronteira com Q16, que tratará especificamente HUMAN_GATE versus delegação técnica.

Q15 deve decidir autoridade geral; Q16 detalhará quais ações concretas continuam exigindo HUMAN_GATE.

---

## 5. Próxima pergunta

> **Q15 — Qual é a divisão de autoridade entre LEANDRO e a equipe MCF após o intake?**

Implementação continua `NO_GO`.
