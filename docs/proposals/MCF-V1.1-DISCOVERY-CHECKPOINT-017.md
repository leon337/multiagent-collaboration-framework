# MCF v1.1 — Discovery Checkpoint 017

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-017`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 17
questions_remaining: 3
last_completed_question: 17
next_question: 18
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
Q17: COMPLETED_APPROVED_BY_LEANDRO
Q18: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução de retomada:** NÃO repetir Q1–Q17 salvo solicitação explícita de LEANDRO. Retomar em Q18.

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
- Q17 — `EVENT_DRIVEN_TRANSFERABLE_CHECKPOINT_WITH_VERIFIED_RESUME` — Opção D.

---

## 3. Q17 — contrato aprovado

```yaml
checkpoint_model:
  trigger_basis: MATERIAL_EVENT_OR_TRANSFER_BOUNDARY
  every_interaction: false
  timer_or_message_count_is_primary_trigger: false
  canonical_for_captured_boundary: true
  remote_durable_checkpoint_required_for_transferability: true

checkpoint_triggers:
  - MATERIAL_HUMAN_DECISION
  - PHASE_OR_MISSION_BOUNDARY
  - MATERIAL_MISSION_CONTRACT_CHANGE
  - MATERIAL_STATE_CHANGE
  - IMPORTANT_HANDOFF
  - HUMAN_GATE_PENDING_OR_RESOLVED_WHEN_MATERIAL
  - PLANNED_PAUSE
  - PLANNED_CHAT_TRANSFER
  - PLANNED_EXECUTION_ENVIRONMENT_TRANSFER
  - MATERIAL_CONTEXT_LOSS_RISK

transferable_checkpoint:
  planned_pause_or_transfer_requires: true
  minimum_references:
    - PROJECT_AND_MISSION_IDENTITY
    - CURRENT_PHASE
    - METHODOLOGY_PIN
    - ALIGNED_PIP_REVISION_WHEN_APPLICABLE
    - MISSION_CONTRACT
    - OBJECTIVE_AND_CURRENT_STATE
    - REPOSITORY_BRANCH_AND_CHECKPOINT_SHA
    - MATERIAL_DECISIONS_SINCE_PREVIOUS_CHECKPOINT
    - EVIDENCE_AND_ARTIFACT_REFERENCES
    - OPEN_FINDINGS_AND_BLOCKERS
    - PENDING_HUMAN_GATES
    - ACTIVE_STANDING_AUTHORIZATIONS
    - NEXT_ACTION_AND_RESPONSIBLE
    - VOLATILE_LIVE_STATE_SNAPSHOT_WITH_CAPTURE_TIME
    - RESUME_INSTRUCTIONS
  duplicate_full_authoritative_documents: false

resume_card:
  classification: DERIVED_REBUILDABLE_VIEW
  role: FAST_ORIENTATION
  may_override_authoritative_sources: false

resume_pipeline:
  - RESUME_CARD
  - CANONICAL_CHECKPOINT
  - AUTHORITATIVE_RECORDS_AS_NEEDED
  - GITHUB_PROVIDER_LIVE_STATE
  - RECONCILIATION

resume_routes:
  FAST_RESUME:
    requires:
      - VALID_CHECKPOINT
      - AUTHORITATIVE_SOURCES_RESOLVED
      - LIVE_STATE_COMPATIBLE
      - NO_UNEXPLAINED_MATERIAL_DIVERGENCE
  RECONCILE:
    used_when: EXPLAINABLE_STATE_DRIFT_REQUIRES_RECONCILIATION
  RECOVER_MCF_PROJECT:
    used_when:
      - CHECKPOINT_MISSING_OR_INVALID
      - AUTHORITATIVE_SOURCE_MISSING_OR_CONFLICTING
      - UNEXPLAINED_MATERIAL_DIVERGENCE
      - INSUFFICIENT_EVIDENCE

chat_memory:
  classification: OPTIONAL_CONTEXT
  required_for_project_continuity: false
  previous_chat_transcript_required: false

local_first_transfer:
  local_uncheckpointed_work_equals_remote_checkpointed: false
  local_only_state_may_be_declared_transferred: false
  planned_environment_transfer_requires_persist_or_explicitly_block_transferability: true
  unrecoverable_local_work_must_be_declared_lost_or_unverified: true

continuity_states:
  - ACTIVE
  - PAUSED_TRANSFERABLE
  - WAITING_EXTERNAL
  - WAITING_HUMAN_GATE
  - RECOVERY_REQUIRED
  - CLOSED

resume_integrity:
  verify_methodology_pin: true
  verify_checkpoint_integrity: true
  verify_pip_and_mission_contract_when_applicable: true
  reconcile_volatile_live_state: true
  resume_from_declared_next_action_only_after_validation: true

implementation_authorized: false
```

Regras centrais:

```text
CHECKPOINT != CHAT_LOG
MATERIAL_EVENT_OR_TRANSFER_BOUNDARY -> DURABLE_CHECKPOINT
PLANNED_TRANSFER_REQUIRES_TRANSFERABLE_CHECKPOINT
RESUME_CARD = ORIENTATION, NOT AUTHORITY
CHAT_MEMORY = OPTIONAL_CONTEXT
PROJECT_CONTINUITY_MUST_NOT_REQUIRE_PREVIOUS_CHAT
LOCAL_UNCHECKPOINTED != REMOTE_CHECKPOINTED
UNVERIFIED_LOCAL_WORK_MUST_NOT_BE_INVENTED_AS_TRANSFERRED
CHECKPOINT + AUTHORITATIVE_RECORDS + LIVE_STATE -> RECONCILIATION
VALID_CONTINUITY -> FAST_RESUME
MATERIAL_UNEXPLAINED_DIVERGENCE -> RECOVER_MCF_PROJECT
NEW_CHAT != NEW_MISSION
PAUSED != CANCELLED
```

### Resume / recover

A retomada não reconstrói a Discovery por padrão. Quando checkpoint, fontes autoritativas e estado live forem compatíveis, usa-se `FAST_RESUME` e continua-se do `next_action`. Derivações ou alterações voláteis explicáveis usam `RECONCILE`. Ausência, corrupção, conflito material inexplicável ou evidência insuficiente roteiam para `RECOVER_MCF_PROJECT` e `MCF-RECOVER-CONTEXT`.

### Troca de chat e ambiente

Memória ou transcript do chat anterior podem auxiliar, porém nunca são requisito para continuidade. Uma troca planejada de chat/ambiente exige checkpoint transferível. Estado exclusivamente local deve ser persistido por mecanismo autorizado antes da transferência ou a transferibilidade deve ser declarada bloqueada. Estado local perdido ou não verificável nunca é reconstruído por invenção.

---

## 4. Fronteira deixada para Q18

Q18 deve decidir **como evoluir da v1.0.0 para v1.1.0 preservando compatibilidade e evitando duplicação de mecanismos**.

A Q18 deve confrontar as decisões Q1–Q17 com mecanismos já existentes na v1.0.0 e definir princípios de evolução, incluindo:

- extensão versus substituição;
- compatibilidade com `MCF-START-MISSION`, `MCF-RECOVER-CONTEXT`, PRF/checkpoints, Mission Contract, runtime, permission profiles e governança vigente;
- migração/versionamento de documentos e contratos;
- comportamento de projetos/artefatos existentes da v1.0.0;
- prevenção de uma segunda arquitetura paralela de memória, gates, recovery ou execução;
- boundaries que devem permanecer invariantes;
- critérios para introduzir nova estrutura somente quando não houver mecanismo atual equivalente.

---

## 5. Próxima pergunta

> **Q18 — Como evoluir a v1.0.0 para v1.1.0 preservando compatibilidade e evitando duplicação de mecanismos?**

Implementação continua `NO_GO`.
