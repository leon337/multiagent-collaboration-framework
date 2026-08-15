# MCF v1.1 — Discovery Checkpoint 004

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-004`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 4
questions_remaining: 16
last_completed_question: 4
next_question: 5
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução:** NÃO repetir Q1–Q4 salvo solicitação explícita de LEANDRO. Retomar em Q5.

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

```yaml
new_project_without_verified_bootstrap:
  state: ACTIVATING_BLOCKED
  mcf_active: false
existing_project:
  verified_project_pin_required_for_degraded_mode: true
  verified_local_methodology_cache_allowed: true
degraded_allowed:
  - READ_ONLY_ANALYSIS
  - PLANNING
  - LOCAL_DOCUMENTATION
  - LOCAL_TESTS
  - REVERSIBLE_LOCAL_CODE_CHANGE
  - LOCAL_COMMIT
degraded_blocked:
  - MERGE
  - DEPLOY
  - RELEASE
  - PUBLICATION
  - FINAL_INTEGRATION
  - METHODOLOGY_UPGRADE
  - AUTHORITY_CHANGE
  - TERMINAL_INDEPENDENT_REVIEW
  - MATERIAL_EXTERNAL_EFFECT_WITHOUT_REMOTE_EVIDENCE
canonical_conflict:
  state: CANONICAL_CONFLICT_BLOCKED
  result: FAIL_CLOSED
remote_recovery:
  canonical_revalidation_required: true
  checkpoint_debt_reconciliation_required: true
  degraded_operation_receipt_required: true
human_authority:
  may_choose_policy_or_identified_version: true
  may_substitute_missing_technical_evidence: false
```

Estados operacionais:

```yaml
MCF_OPERATION_STATE:
  - NOT_ACTIVE
  - ACTIVATING
  - ACTIVE
  - ACTIVE_DEGRADED_VERIFIED
  - ACTIVATING_BLOCKED
  - CANONICAL_CONFLICT_BLOCKED
```

Princípios:

```text
UNAVAILABLE != INCONSISTENT
LOCAL_COPY != VERIFIED_LOCAL_COPY
CACHE_CAN_PROVE_IDENTITY != CACHE_CAN_PROVE_CURRENT_STABLE
HUMAN_AUTHORITY != TECHNICAL_EVIDENCE
```

---

## 3. Continuidade e recuperação

Quando o remoto voltar após operação degradada:

```text
REMOTE RESTORED
   ↓
REVERIFY CANONICAL STATE
   ↓
COMPARE LOCAL/REMOTE/PIN/BOOTSTRAP
   ↓
RECONCILE CHECKPOINT_DEBT
   ↓
PUBLISH REMOTE CHECKPOINT
   ↓
DEGRADED OPERATION RECEIPT
   ↓
ACTIVE
```

Nenhum efeito material/governado pode ser legitimado retroativamente apenas por autoridade humana sem evidência técnica aplicável.

---

## 4. Próxima pergunta

> **Q5 — Quais modos de entrada de projeto o MCF deve reconhecer?**

Candidatos já identificados: `NEW_PROJECT`, `EXISTING_PROJECT`, `RESUME_MCF_PROJECT`.

Implementação continua `NO_GO`.
