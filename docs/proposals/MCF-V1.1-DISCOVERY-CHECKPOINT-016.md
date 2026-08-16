# MCF v1.1 — Discovery Checkpoint 016

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-016`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 16
questions_remaining: 4
last_completed_question: 16
next_question: 17
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
Q15: COMPLETED_APPROVED_BY_LEANDRO
Q16: COMPLETED_APPROVED_BY_LEANDRO
Q17: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução de retomada:** NÃO repetir Q1–Q16 salvo solicitação explícita de LEANDRO. Retomar em Q17.

### Preferência de apresentação de LEANDRO

Ao apresentar alternativas decisórias, MESTRE deve marcar sua recomendação com **⭐** na lista final. A estrela indica recomendação do MESTRE, não decisão automática; somente LEANDRO decide.

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
- Q15 — `DELEGATED_TECHNICAL_AUTONOMY_WITHIN_HUMAN_APPROVED_ENVELOPE` — Opção D.
- Q16 — `IMPACT_BASED_HUMAN_GATES_WITH_SCOPED_STANDING_AUTHORIZATION` — Opção D.

---

## 3. Q16 — contrato aprovado

```yaml
human_gate_model:
  trigger_basis: MATERIAL_IMPACT_NOT_OPERATION_NAME_ALONE
  final_human_authority: LEANDRO
  team_first_required: true
  silence_means_approval: false

non_delegable_human_gate_triggers:
  - MATERIAL_CHANGE_TO_HUMAN_INTENT
  - MATERIAL_CHANGE_TO_PROJECT_OBJECTIVE
  - MATERIAL_CHANGE_TO_TARGET_USERS
  - MATERIAL_CHANGE_TO_MUST_HAVE_OR_NON_GOAL
  - MATERIAL_CHANGE_TO_DEFINITION_OF_DONE_OR_DESIRED_OUTCOME
  - NEW_OR_MATERIAL_FINANCIAL_COMMITMENT_OUTSIDE_AUTHORIZED_BOUNDARY
  - MATERIAL_LEGAL_PRIVACY_OR_PUBLIC_EXPOSURE
  - EXCEPTIONAL_USE_OF_PERSONAL_CREDENTIAL_OR_SENSITIVE_DATA
  - IRREVERSIBLE_OR_HIGH_IMPACT_EXTERNAL_ACTION
  - MATERIAL_STRATEGIC_CHANGE_OR_ACCEPTANCE_OF_MATERIAL_RISK
  - PROJECT_CANCELLATION_OR_PIVOT
  - ACTION_EXPLICITLY_RESERVED_BY_LEANDRO

standing_authorization:
  allowed: true
  must_be_bounded: true
  fields:
    - PROJECT_OR_MISSION
    - ACTION_CLASSES
    - ENVIRONMENT
    - MAXIMUM_COST
    - REVERSIBILITY_REQUIREMENT
    - EXPIRY_OR_BOUNDARY
    - EXCLUSIONS
    - EVIDENCE_REQUIREMENTS
  silent_scope_expansion: false

team_first:
  ordinary_technical_ambiguity: RESOLVE_WITHIN_TEAM_FIRST
  safe_authorized_work_may_continue: true
  ask_leandro_for_ordinary_technical_choice: false

pending_gate_behavior:
  dependent_action: BLOCKED_FAIL_CLOSED
  independent_safe_authorized_work: CONTINUE
  entire_mission_blocked_by_default: false
  no_response_is_approval: false
  past_approval_extends_to_new_material_scope: false

gate_presentation:
  human_decision_focused: true
  require_human_to_solve_engineering: false

implementation_authorized: false
```

Regras centrais:

```text
MATERIAL_IMPACT > OPERATION_NAME
TEAM_FIRST_BEFORE_HUMAN_GATE
SCOPED_AUTHORIZATION != UNBOUNDED_AUTHORITY
NO_RESPONSE != APPROVAL
PAST_APPROVAL != NEW_MATERIAL_AUTHORIZATION
PENDING_HUMAN_GATE_BLOCKS_DEPENDENT_ACTION_NOT_ALL_SAFE_WORK
HUMAN_GATE_ASKS_FOR_HUMAN_DECISION_NOT_ENGINEERING_SOLUTION
```

`HUMAN_GATE` é determinado pelo impacto material e pela autoridade aplicável, não pelo nome isolado da operação. LEANDRO pode conceder autorização antecipada/contínua, mas ela deve permanecer delimitada e jamais se expandir silenciosamente. `TEAM_FIRST` continua obrigatório para ambiguidades técnicas ordinárias. Quando um gate estiver pendente, a ação dependente fica fail-closed, mas trabalho independente, seguro e autorizado pode continuar. Silêncio nunca equivale a aprovação.

---

## 4. Fronteira deixada para Q17

Q17 deve definir **como checkpoint, pause/resume e troca de chat funcionam na v1.1**, preservando as decisões já aprovadas sobre:

- GitHub como memória institucional/remota;
- `LOCAL_FIRST_REMOTE_CHECKPOINTED`;
- checkpoints como `CANONICAL_DURABLE_RECORD` no boundary capturado;
- reconciliação obrigatória com estado live para fatos voláteis;
- `RESUME_MCF_PROJECT` versus `RECOVER_MCF_PROJECT`;
- PIP alinhado, Mission Contract, evidências e decisões como memória durável;
- nenhuma dependência da memória do chat como fonte autoritativa;
- retomada sem reconstruir toda a Discovery quando a continuidade for verificável;
- comportamento quando o checkpoint estiver ausente, desatualizado, conflitante ou não verificável;
- boundary mínimo que deve ser persistido antes de pausa/troca de chat.

---

## 5. Próxima pergunta

> **Q17 — Como checkpoint, pause/resume e troca de chat devem funcionar?**

Implementação continua `NO_GO`.
