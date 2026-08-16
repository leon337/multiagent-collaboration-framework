# MCF v1.1 — Discovery Checkpoint 019

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-019`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 19
questions_remaining: 1
last_completed_question: 19
next_question: 20
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
Q19: COMPLETED_APPROVED_BY_LEANDRO
Q20: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução de retomada:** NÃO repetir Q1–Q19 salvo solicitação explícita de LEANDRO. Retomar em Q20.

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
- Q19 — `EVIDENCE_LAYERED_REAL_SCENARIO_QUALIFICATION_MATRIX` — Opção D.

---

## 3. Q19 — contrato aprovado

```yaml
qualification_layers:
  - UNIT_AND_CONTRACT
  - INTEGRATION
  - REAL_E2E_SCENARIOS
  - NEGATIVE_AND_FAILURE_PATHS
  - RECOVERY_AND_RECONCILIATION
  - V1_0_COMPATIBILITY_AND_MIGRATION
  - CLEAN_ROOM_CONTINUITY
  - STRUCTURAL_NO_PARALLEL_ARCHITECTURE
  - EXACT_HEAD_REGRESSION
  - INDEPENDENT_REVIEW

required_scenario_families:
  - NEW_PROJECT
  - ADOPT_EXISTING_PROJECT
  - FAST_RESUME_CLEAN_ROOM_NEW_CHAT
  - RECONCILE_EXPLAINABLE_DRIFT
  - RECOVER_MCF_PROJECT_BROKEN_CONTINUITY
  - TEAM_FIRST_TECHNICAL_AUTONOMY
  - HUMAN_GATE_MATERIAL_BOUNDARY
  - STANDING_AUTHORIZATION_POSITIVE_AND_NEGATIVE
  - PENDING_GATE_PARTIAL_BLOCKING
  - V1_0_LEGACY_COMPATIBILITY
  - MIGRATION_FAILURE_AND_FAIL_CLOSED
  - SOURCE_AUTHORITY_PRECEDENCE
  - MACHINE_INFERENCE_NOT_HUMAN_INTENT
  - NO_PARALLEL_ARCHITECTURE
  - EXACT_HEAD_REGRESSION

clean_room_continuity:
  previous_chat_transcript_required: false
  hidden_previous_chat_memory_as_required_input: false
  expected_route_when_consistent: FAST_RESUME

critical_contract_testing:
  positive_path_required: true
  negative_path_required: true
  fail_closed_boundaries_required: true
  team_autonomy_must_also_be_proved: true

evidence_contract:
  per_case_required:
    - TEST_CASE_ID
    - INPUT
    - EXPECTED_RESULT
    - EXECUTION_REFERENCE
    - OBSERVED_RESULT
    - EVIDENCE_REFERENCE
    - PASS_OR_FAIL
    - TESTED_HEAD
  narrative_only_claim_is_sufficient: false

exact_head:
  evidence_must_bind_to_exact_sha: true
  material_change_after_qualification_requires_affected_reassessment: true

independent_review:
  implementer_as_sole_final_qualifier: false
  independent_validation_or_audit_required: true

qualification_verdicts:
  - PASS
  - CONDITIONAL_PASS
  - FAIL

implementation_authorized: false
```

Regras centrais:

```text
DOCUMENTED != IMPLEMENTED != TESTED != QUALIFIED
QUALIFICATION_REQUIRES_REAL_BEHAVIOR_EVIDENCE
CLEAN_ROOM_RESUME_MUST_NOT_REQUIRE_PREVIOUS_CHAT
CRITICAL_CONTRACT = POSITIVE_PATH + NEGATIVE_PATH
TEAM_AUTONOMY_MUST_BE_TESTED_NOT_ONLY_HUMAN_BLOCKING
TEST_EVIDENCE_BINDS_TO_EXACT_HEAD
MATERIAL_HEAD_CHANGE -> REASSESS_AFFECTED_TESTS
LEGACY_COMPATIBILITY_MUST_BE_PROVED_NOT_ASSUMED
MIGRATION_FAILURE_MUST_NOT_ACTIVATE_PARTIAL_SUCCESSOR
INDEPENDENT_REVIEW_REQUIRED_FOR_FINAL_QUALIFICATION
```

A v1.1 não será considerada comprovada por documentação ou testes isolados. A qualificação exige cenários reais e negativos, clean-room de novo chat sem transcript como requisito, recovery/reconciliation, TEAM_FIRST, HUMAN_GATE, standing authorization, compatibilidade/migração v1.0, precedência de fontes, separação inferência/intenção, prova de reutilização dos primitives v1.0, evidência vinculada ao SHA exato e revisão independente.

---

## 4. Fronteira deixada para Q20

Q20 deve consolidar **Q1–Q19 em uma arquitetura/contrato final da v1.1.0** e decidir o veredito da Discovery para a próxima fase.

A Q20 deve separar explicitamente:

- `DISCOVERY_COMPLETE` de `IMPLEMENTATION_AUTHORIZED`;
- arquitetura proposta de capacidade já implementada;
- novos primitives realmente necessários versus extensões dos primitives v1.0;
- dependências, riscos e lacunas ainda abertas;
- critérios que permitam `GO`, `CONDITIONAL_GO` ou `NO_GO` para iniciar uma fase posterior de implementação;
- qualquer autorização posterior como HUMAN_GATE separado de LEANDRO.

---

## 5. Próxima pergunta

> **Q20 — Qual é a arquitetura/contrato consolidado da v1.1.0 e qual o GO / CONDITIONAL GO / NO-GO para implementação?**

Todos os gates continuam `NO_GO` até decisão explícita posterior de LEANDRO.
