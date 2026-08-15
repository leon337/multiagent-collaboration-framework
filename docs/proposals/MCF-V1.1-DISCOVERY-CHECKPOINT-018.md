# MCF v1.1 — Discovery Checkpoint 018

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-018`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 18
questions_remaining: 2
last_completed_question: 18
next_question: 19
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
Q18: COMPLETED_APPROVED_BY_LEANDRO
Q19: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução de retomada:** NÃO repetir Q1–Q18 salvo solicitação explícita de LEANDRO. Retomar em Q19.

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
- Q18 — `COMPATIBLE_EXTENSION_VERSIONING_AND_EXPLICIT_MIGRATION` — Opção D.

---

## 3. Q18 — contrato aprovado

```yaml
evolution_strategy:
  rewrite_v1_core: false
  parallel_v11_architecture: false
  reuse_before_new_primitive: true
  extend_before_replace: true
  version_before_break: true
  explicit_migration_when_required: true

reuse_targets:
  - MCF_RUNTIME
  - MCF_START_MISSION
  - MCF_RECOVER_CONTEXT
  - MISSION_CONTRACT
  - PRF_AND_PHASE_CHECKPOINT
  - PERMISSION_PROFILES
  - HUMAN_DELEGATION_FIREWALL
  - HANDOFF_AND_RECEIPT_PRIMITIVES
  - RECONCILIATION
  - OBSERVABILITY

v11_extensions:
  - PROJECT_ENTRY_MODE
  - PROJECT_INTENT_PACKAGE_REFERENCE
  - PROJECT_REALITY_REPORT_REFERENCE
  - STANDING_AUTHORIZATION_METADATA
  - TRANSFERABLE_CONTINUITY_METADATA
  - RESUME_ROUTE_METADATA

schema_policy:
  explicit_schema_or_contract_version: REQUIRED_WHEN_FORMAT_EVOLVES
  additive_compatible_fields_preferred: true
  legacy_missing_v11_fields_means_invalid: false
  silent_rewrite_of_legacy_artifacts: false

legacy_projects:
  mass_migration_required: false
  remain_valid_when_supported_by_pinned_methodology: true
  upgrade_assessment_at_safe_boundary: true
  silent_mid_mission_upgrade: false
  compatibility_mode_allowed_when_safe_migration_unavailable: true

migration:
  detect_legacy_version: true
  assess_compatibility: true
  preserve_original_artifact: true
  create_successor_revision_or_artifact: true
  preserve_provenance: true
  validate_before_activation: true
  failed_or_unsafe_auto_migration: FAIL_CLOSED_WITH_COMPATIBILITY_MODE_WHEN_POSSIBLE

new_primitive_rule:
  no_equivalent_test_required: true
  justification_required_when_no_valid_v1_equivalent_exists: true
  derived_view_must_not_be_promoted_to_new_runtime_state_without_need: true

compatibility_dimensions:
  - DOCUMENT_COMPATIBILITY
  - CONTRACT_COMPATIBILITY
  - RUNTIME_COMPATIBILITY

release_identity:
  stable_v1_0_0_remains_immutable_historical_identity: true
  v1_1_0_requires_distinct_future_qualified_identity: true

semver_guard:
  v1_1_intended_as_compatible_minor_evolution: true
  discovered_incompatible_authority_gate_or_core_flow_change_must_be_reclassified: true

implementation_authorized: false
```

Regras centrais:

```text
V1_1_EXTENDS_V1_0
V1_1_DOES_NOT_DUPLICATE_V1_0
REUSE_BEFORE_NEW_PRIMITIVE
EXTEND_BEFORE_REPLACE
VERSION_BEFORE_BREAK
MIGRATE_WITH_PROVENANCE
NEVER_SILENTLY_REWRITE_HISTORY
OLD_PROJECT != INVALID_PROJECT
PROJECT_PIN_PREVENTS_SILENT_UPGRADE
NEW_PRIMITIVE_REQUIRES_NO_EQUIVALENT_JUSTIFICATION
DOCUMENT_COMPATIBILITY + CONTRACT_COMPATIBILITY + RUNTIME_COMPATIBILITY
V1_0_RELEASE_IDENTITY_REMAINS_IMMUTABLE
```

A v1.1 evolui o core v1.0 por extensão/versionamento e não cria um segundo runtime ou uma segunda governança paralela. `MCF-START-MISSION`, `MCF-RECOVER-CONTEXT`, Mission Contract, checkpoint/PRF, permission profiles/Human Delegation, handoffs, receipts, reconciliação e observabilidade devem ser reutilizados. Projetos v1.0 permanecem válidos quando suportados pelo methodology pin; migração ocorre em boundary seguro, preserva o artefato original e exige validação antes de ativação. Um primitive novo exige `NO_EQUIVALENT_TEST`. Incompatibilidade real em autoridade, gate ou fluxo central deve ser reclassificada, não ocultada como mudança minor.

---

## 4. Fronteira deixada para Q19

Q19 deve definir **como provar a v1.1.0 com testes reais**, sem considerar documentação ou implementação nominal como prova suficiente.

A Q19 deve cobrir pelo menos:

- projeto novo (`NEW_PROJECT`);
- adoção de projeto existente incompleto (`ADOPT_EXISTING_PROJECT`);
- retomada em novo chat/ambiente sem transcript anterior;
- `FAST_RESUME`, `RECONCILE` e `RECOVER_MCF_PROJECT`;
- PIP/Intent Alignment e impossibilidade de implementação antes do gate;
- autonomia técnica dentro do envelope e escalonamento correto por impacto material;
- standing authorization delimitada e fail-closed fora do boundary;
- compatibilidade real com artefatos/projetos v1.0 e migration path quando necessário;
- comprovação de ausência de arquitetura paralela onde primitives v1.0 equivalentes existirem;
- evidência reproduzível e critérios de aceitação antes de qualquer conclusão de prontidão.

Q19 define a estratégia probatória; Q20 consolidará arquitetura/contrato e decidirá GO / CONDITIONAL GO / NO-GO para implementação.

---

## 5. Próxima pergunta

> **Q19 — Como provar a v1.1.0 com testes reais?**

Implementação continua `NO_GO`.
