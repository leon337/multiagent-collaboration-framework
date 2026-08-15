# MCF v1.1 — Decision Ledger

**ID:** `MCF-V1.1-DECISION-LEDGER-001`  
**Status:** `ACTIVE`  
**Branch:** `planning/mcf-v1.1-discovery`

Este ledger preserva decisões aprovadas por LEANDRO durante a Discovery da v1.1.0. Implementação permanece bloqueada até encerramento formal da Discovery e autorização separada.

---

## V11-D0 — Discovery Charter

```yaml
decision_id: V11-D0
status: APPROVED_BY_LEANDRO
target_version: v1.1.0
baseline: v1.0.0
implementation_authorized: false
```

## V11-Q01 — Activation Contract

```yaml
decision_id: V11-Q01
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: HYBRID_INTENT_AND_EXPLICIT_ACTIVATION
```

Chat normal permanece fora do MCF. Comando explícito ou intenção clara pode iniciar `ACTIVATING`; `ACTIVE` exige bootstrap/metodologia/fonte de verdade verificáveis.

## V11-Q02 — Execution Environment Contract

```yaml
decision_id: V11-Q02
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: LOCAL_FIRST_REMOTE_CHECKPOINTED
```

```text
MCF_METHOD != EXECUTION_HOST
EDIT != COMMIT != PUSH != PR
LOCAL_UNCHECKPOINTED != REMOTE_CHECKPOINTED
```

`CHATGPT_REMOTE` usa conectores/ferramentas remotas. `CODEX_LOCAL` usa workspace/terminal/Git local. GitHub permanece memória institucional, checkpoint remoto, CI, revisão e integração. Boundaries materiais/governados permanecem fail-closed sem evidência aplicável.

## V11-Q03 — Bootstrap Version Resolution

```yaml
decision_id: V11-Q03
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: VERIFIED_TWO_STAGE_BOOTSTRAP
resolution_order:
  - VALID_PROJECT_PIN
  - EXPLICIT_LEANDRO_SELECTION
  - CURRENT_STABLE
immutable_methodology_ref: REQUIRED
silent_mid_mission_upgrade: false
```

Bootstrap usa locator canônico para resolver a versão operacional e depois carrega metodologia por tag/SHA imutável. Discovery, planning, RC e experimental não são defaults.

## V11-Q04 — Degraded Operation / Fail-Closed

```yaml
decision_id: V11-Q04
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES
```

Operação degradada só pode continuar sobre base local verificável e trabalho reversível. Inconsistência entre fontes bloqueia. Recuperação exige revalidação canônica, reconciliação de `CHECKPOINT_DEBT` e `Degraded Operation Receipt`.

```text
UNAVAILABLE != INCONSISTENT
LOCAL_COPY != VERIFIED_LOCAL_COPY
HUMAN_AUTHORITY != TECHNICAL_EVIDENCE
```

## V11-Q05 — Project Entry Classification

```yaml
decision_id: V11-Q05
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: THREE_CANONICAL_ENTRY_MODES_WITH_RECOVERY_ROUTE
PROJECT_ENTRY_MODE:
  - NEW_PROJECT
  - ADOPT_EXISTING_PROJECT
  - RESUME_MCF_PROJECT
RECOVERY_ROUTE:
  - RECOVER_MCF_PROJECT
```

```text
HUMAN_INTENT + MACHINE_EVIDENCE = ENTRY_CLASSIFICATION
ADOPT != RECOVER
RESUME_REQUIRES_VERIFIED_CONTINUITY
```

## V11-Q06 — New Project Genesis

```yaml
decision_id: V11-Q06
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: PROGRESSIVE_DURABLE_PROJECT_GENESIS
```

Fluxo aprovado:

```text
VERIFIED MCF ACTIVATION
→ IDEA_CAPTURE
→ MINI-TRIAGE (3–5)
→ PROJECT_GENESIS
→ PROJECT HOME / REPOSITORY
→ METHODOLOGY PIN
→ DURABLE INTAKE CHECKPOINT
→ HUMAN INTENT DISCOVERY
→ INTENT READINESS
→ PROJECT INTENT PACKAGE
→ LEANDRO CONFIRMS
→ INTENT ALIGNMENT GATE = PASS
→ MCF-START-MISSION
```

Antes do Alignment Gate, implementação de produto é `NO_GO`. Discovery, documentação e protótipos não canônicos de descoberta podem existir nos limites definidos.

## V11-Q07 — Existing Project Reconnaissance Contract

```yaml
decision_id: V11-Q07
question: Q7
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: EVIDENCE_FIRST_EXISTING_PROJECT_RECONNAISSANCE
```

`ADOPT_EXISTING_PROJECT` começa provisório, com baseline exato e reconnaissance `READ_ONLY_FIRST`. Evidências são classificadas como `VERIFIED_FACT`, `OBSERVED_FACT`, `INFERRED`, `UNKNOWN`, `CONFLICTING` ou `STALE_SUSPECTED`. Continuidade MCF válida reclassifica para `RESUME`; continuidade quebrada/não verificável roteia para `RECOVER`. Permanecendo `ADOPT`, MESTRE reconstrói `AS-IS`, produz `Project Reality Report` e faz Reality Read-Back antes da Human Intent Discovery profunda.

```text
READ_ONLY_FIRST
AS_IS != TO_BE
FACT != INFERENCE
DOCUMENTATION != AUTOMATICALLY_REALITY
MACHINE_DISCOVERS_TECHNICAL_FACTS
HUMAN_EXPLAINS_INTENT
```

## V11-Q08 — Human Intent Dimensions Contract

```yaml
decision_id: V11-Q08
question: Q8
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: CANONICAL_INTENT_DIMENSIONS_WITH_EVIDENCE_AWARE_RESOLUTION
canonical_dimension_count: 20
fixed_question_count_required: false
```

As 20 dimensões canônicas são `PROBLEM`, `MOTIVATION`, `DESIRED_OUTCOME`, `TARGET_USERS`, `CRITICAL_USER_JOURNEYS`, `MUST_HAVE`, `SHOULD_HAVE`, `NON_GOALS`, `PRIORITIES_AND_TRADEOFFS`, `BUSINESS_RULES`, `DATA_AND_SENSITIVITY`, `ROLES_AND_PERMISSIONS`, `AUTOMATION_LEVEL`, `INTEGRATIONS`, `PLATFORM_AND_USAGE_CONTEXT`, `COST_AND_RESOURCE_CONSTRAINTS`, `QUALITY_EXPECTATIONS`, `FAILURE_TOLERANCE`, `DEFINITION_OF_DONE` e `FUTURE_VISION`.

Estados por dimensão: `CLEAR`, `PARTIAL`, `UNKNOWN`, `CONFLICTING`, `NOT_APPLICABLE`.

```text
DIMENSION_REQUIRED != QUESTION_REQUIRED
UNKNOWN != NOT_APPLICABLE
UNKNOWN != HUMAN_HAS_NO_PREFERENCE
MACHINE_EVIDENCE_CAN_SUPPLY_FACTS
MACHINE_EVIDENCE_CANNOT_INVENT_HUMAN_PREFERENCES
TEAM_ENGINEERING_DECIDES_HOW
```

## V11-Q09 — Adaptive Questioning Contract

```yaml
decision_id: V11-Q09
question: Q9
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: EVIDENCE_AWARE_ADAPTIVE_QUESTIONING_WITH_INFORMATION_GAIN
```

### Decisão

As 20 dimensões não são percorridas por sequência fixa. Antes de cada pergunta, MESTRE incorpora novo contexto/evidência, atualiza todas as dimensões afetadas, verifica contradições, identifica incertezas bloqueantes e escolhe a próxima pergunta de maior valor informacional com menor carga humana possível.

```yaml
questioning_model:
  fixed_sequence: false
  fixed_question_count: false
  one_primary_question_at_a_time: true

before_each_question:
  - INGEST_NEW_CONTEXT
  - UPDATE_ALL_AFFECTED_DIMENSIONS
  - CHECK_CONTRADICTIONS
  - IDENTIFY_BLOCKING_UNCERTAINTIES
  - RANK_QUESTION_CANDIDATES

question_priority:
  - MATERIAL_HUMAN_INTENT_CONFLICT
  - BLOCKING_UNCERTAINTY
  - HIGH_INFORMATION_GAIN
  - HIGH_RISK_UNCERTAINTY
  - DEPENDENCY_UNLOCK
  - SECONDARY_REFINEMENT

question_value_considers:
  - INFORMATION_GAIN
  - BLOCKER_REDUCTION
  - RISK_REDUCTION
  - DEPENDENCY_UNLOCK
  - HUMAN_BURDEN
  - REPETITION_PENALTY

clear_dimension:
  repeat_without_new_cause: PROHIBITED

evidence:
  use_to_reduce_questions: true
  may_replace_human_preference: false

followup:
  requires_information_value: true
  allowed_when:
    - PARTIAL_REMAINS
    - MATERIAL_AMBIGUITY_CREATED
    - CONTRADICTION_CREATED
    - SCOPE_OR_RISK_CHANGED
    - IMPORTANT_DEPENDENCY_UNLOCKED

conflict_types:
  - AS_IS_TO_BE_DIFFERENCE
  - EVIDENCE_CONFLICT
  - HUMAN_INTENT_CONFLICT

low_information_loop:
  repeated_followups: PROHIBITED
  unresolved_nonblocking: PRESERVE_AND_CONTINUE
  unresolved_blocking: MARK_BLOCKING_UNKNOWN

human_delegation:
  valid_resolution: true
```

Princípios:

```text
ONE_ANSWER_MAY_RESOLVE_MULTIPLE_DIMENSIONS
CLEAR_DOES_NOT_REOPEN_WITHOUT_CAUSE
FOLLOW_UP_REQUIRES_INFORMATION_VALUE
AS_IS_TO_BE_DIFFERENCE != HUMAN_INTENT_CONFLICT
MACHINE_EVIDENCE_REDUCES_QUESTIONS_BUT_DOES_NOT_REPLACE_HUMAN_INTENT
QUESTION -> ANSWER -> UPDATE_DIMENSIONS -> REASSESS -> NEXT_BEST_QUESTION
```

Mudança explícita de decisão humana não apaga o histórico: decisão anterior deve ser marcada `SUPERSEDED` e a nova como `CURRENT`. Loops de follow-up com baixo ganho são proibidos. A carga cognitiva de LEANDRO entra como custo real na seleção da próxima pergunta.

## V11-Q10 — Progressive Semantic Read-Back Contract

```yaml
decision_id: V11-Q10
question: Q10
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: EVENT_DRIVEN_PROGRESSIVE_SEMANTIC_READBACK
```

### Decisão

O MCF valida entendimento de forma progressiva, orientada por eventos e com cadência de segurança. Read-back intermediário é checksum semântico para impedir propagação de interpretações erradas; não substitui o `FINAL_INTENT_READBACK` nem autoriza implementação.

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

content:
  emphasize:
    - NEW_UNDERSTANDING
    - MATERIAL_CHANGES
    - HIGH_IMPACT_INTENT
    - IMPORTANT_CONSTRAINTS
    - OPEN_UNCERTAINTIES
  repeat_all_dimensions_every_time: false
  distinguish_fact_from_interpretation: true
  false_certainty: prohibited

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

history:
  material_human_change:
    old: SUPERSEDED
    new: CURRENT
  rejected_machine_interpretation:
    must_not_become_human_decision: true

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

Correções materiais preservam histórico; interpretações derivadas invalidadas não podem continuar contaminando dimensões dependentes. Read-backs devem enfatizar o que é novo, material, alterado e ainda incerto, em linguagem compreensível para LEANDRO, sem repetir mecanicamente as 20 dimensões. Q11 definirá readiness global.

---

## DISCOVERY-INPUT-001 — Codex Local-First

```yaml
input_id: DISCOVERY-INPUT-001
source: LEANDRO
status: RESOLVED_BY_V11_Q02
mapped_question: Q2
resolution: V11-Q02
```
