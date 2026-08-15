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

As 20 dimensões não são percorridas por sequência fixa. Antes de cada pergunta, MESTRE incorpora novo contexto/evidência, atualiza todas as dimensões afetadas, verifica contradições, identifica incertezas bloqueantes e escolhe a próxima pergunta de maior valor informacional com menor carga humana possível.

```yaml
questioning_model:
  fixed_sequence: false
  fixed_question_count: false
  one_primary_question_at_a_time: true
question_priority:
  - MATERIAL_HUMAN_INTENT_CONFLICT
  - BLOCKING_UNCERTAINTY
  - HIGH_INFORMATION_GAIN
  - HIGH_RISK_UNCERTAINTY
  - DEPENDENCY_UNLOCK
  - SECONDARY_REFINEMENT
clear_dimension:
  repeat_without_new_cause: PROHIBITED
evidence:
  use_to_reduce_questions: true
  may_replace_human_preference: false
followup:
  requires_information_value: true
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

```text
ONE_ANSWER_MAY_RESOLVE_MULTIPLE_DIMENSIONS
CLEAR_DOES_NOT_REOPEN_WITHOUT_CAUSE
FOLLOW_UP_REQUIRES_INFORMATION_VALUE
AS_IS_TO_BE_DIFFERENCE != HUMAN_INTENT_CONFLICT
MACHINE_EVIDENCE_REDUCES_QUESTIONS_BUT_DOES_NOT_REPLACE_HUMAN_INTENT
QUESTION -> ANSWER -> UPDATE_DIMENSIONS -> REASSESS -> NEXT_BEST_QUESTION
```

Mudança explícita de decisão humana preserva histórico: anterior `SUPERSEDED`, nova `CURRENT`.

## V11-Q10 — Progressive Semantic Read-Back Contract

```yaml
decision_id: V11-Q10
question: Q10
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: EVENT_DRIVEN_PROGRESSIVE_SEMANTIC_READBACK
```

O MCF valida entendimento de forma progressiva, orientada por eventos e com cadência de segurança. Read-back intermediário é checksum semântico; não substitui o `FINAL_INTENT_READBACK` nem autoriza implementação.

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

```text
PROGRESSIVE_READBACK = SEMANTIC_CHECKSUM
HIGH_IMPACT_INTERPRETATION_REQUIRES_HUMAN_SEMANTIC_CHECK
CORRECTION_MUST_PROPAGATE_TO_DEPENDENT_DIMENSIONS
PARTIAL_CONFIRMATION_IS_ALLOWED
REJECTED_MACHINE_INTERPRETATION != HUMAN_DECISION
PROGRESSIVE_CONFIRMATION != INTENT_ALIGNMENT_GATE
```

## V11-Q11 — Context Sufficiency / Intent Readiness Contract

```yaml
decision_id: V11-Q11
question: Q11
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: SEMANTIC_READINESS_GATE_WITH_BLOCKING_UNKNOWNS
```

### Problema

Definir quando o MCF já compreendeu intenção humana suficiente para parar de perguntar e preparar o alinhamento final, sem exigir certeza artificial sobre todos os detalhes e sem permitir que lacunas materiais sejam escondidas por contagem de perguntas ou score alto.

### Decisão de LEANDRO

**Opção D.**

### Contrato conceitual aprovado

```yaml
readiness_is:
  semantic: true
  question_count_based: false
  pure_score_based: false

dimension_states_preserved_from_Q8:
  - CLEAR
  - PARTIAL
  - UNKNOWN
  - CONFLICTING
  - NOT_APPLICABLE

readiness_impact:
  - BLOCKING
  - NON_BLOCKING

blocking_unknown_definition:
  may_materially_change:
    - PRODUCT
    - SCOPE
    - USERS
    - SECURITY
    - ARCHITECTURE
    - COST
    - RISK
    - SUCCESS_CRITERIA

universal_intent_core:
  - PROBLEM
  - DESIRED_OUTCOME
  - TARGET_USERS
  - CRITICAL_USER_JOURNEYS
  - MUST_HAVE
  - NON_GOALS
  - PRIORITIES_AND_TRADEOFFS
  - DEFINITION_OF_DONE

conditionally_critical_dimensions:
  determined_by:
    - DOMAIN
    - RISK
    - DATA_SENSITIVITY
    - EXTERNAL_EFFECTS
    - CRITICAL_JOURNEYS
    - HUMAN_CONSTRAINTS

delegation:
  explicit_technical_delegation_is_valid_resolution: true

not_applicable:
  counts_as_resolved: true

diagnostic_score:
  allowed: true
  gate_authority: false
  may_override_blocker: false

global_states:
  - NOT_READY
  - CONDITIONALLY_READY
  - READY_FOR_ALIGNMENT

ready_for_alignment_requires:
  blocking_unknowns: 0
  material_human_intent_conflicts: 0
  unresolved_high_impact_interpretations: 0
  semantic_coherence: true
  nonblocking_unknowns_preserved: true
  technical_delegations_explicit: true

ready_for_alignment:
  authorizes_implementation: false

readiness:
  recalculated_after_material_change: true
```

### Regras resultantes

- `INTENT_SUFFICIENTLY_UNDERSTOOD != ALL_DETAILS_KNOWN`;
- `DIMENSION_STATE != READINESS_IMPACT`;
- `BLOCKING_UNKNOWN` é uma incerteza cuja resposta pode alterar materialmente produto, escopo, usuários, segurança, arquitetura, custo, risco ou critério de sucesso;
- `PARTIAL` ou `UNKNOWN` podem ser aceitáveis quando explicitamente não bloqueantes;
- `NOT_APPLICABLE` conta como dimensão resolvida quando fundamentado;
- delegação técnica explícita à equipe conta como resolução válida da intenção humana;
- conflito material de intenção humana é bloqueante até resolução; conflito técnico de evidência não é automaticamente blocker de Intent Readiness;
- o core universal precisa estar semanticamente livre de blockers; outras dimensões tornam-se críticas conforme domínio e risco;
- score pode existir apenas como diagnóstico/observabilidade e jamais sobrescreve blocker semântico;
- `CONDITIONALLY_READY` pode preparar síntese/read-back final, mas não passa automaticamente o `INTENT_ALIGNMENT_GATE`;
- `READY_FOR_ALIGNMENT` significa contexto suficiente para apresentar a intenção consolidada a LEANDRO, não autorização de implementação;
- readiness é estado derivado e deve ser recalculado após mudança material;
- o MESTRE deve parar de perguntar quando o próximo questionamento tiver baixo ganho informacional, não houver incerteza bloqueante e o core semântico estiver coerente.

Princípios:

```text
QUESTION_COUNT != CONTEXT_SUFFICIENCY
HIGH_SCORE_DOES_NOT_CANCEL_SEMANTIC_BLOCKER
DELEGATED_TECHNICAL_DETAIL != MISSING_HUMAN_INTENT
NOT_APPLICABLE = RESOLVED_WHEN_JUSTIFIED
CLEAR_FIELDS_CAN_STILL_BE_SEMANTICALLY_INCOHERENT
READY_FOR_ALIGNMENT != IMPLEMENTATION_AUTHORIZED
MATERIAL_INTENT_CHANGE_RECALCULATES_READINESS
```

Q12 definirá como esse entendimento suficientemente pronto é persistido no `Project Intent Package`.

---

## DISCOVERY-INPUT-001 — Codex Local-First

```yaml
input_id: DISCOVERY-INPUT-001
source: LEANDRO
status: RESOLVED_BY_V11_Q02
mapped_question: Q2
resolution: V11-Q02
```
