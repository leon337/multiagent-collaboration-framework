# MCF v1.1 — Decision Ledger

**ID:** `MCF-V1.1-DECISION-LEDGER-001`  
**Status:** `ACTIVE`  
**Branch:** `planning/mcf-v1.1-discovery`

Este ledger preserva decisões aprovadas por LEANDRO durante a Discovery da v1.1.0. Implementação permanece bloqueada até encerramento formal da Discovery e autorização separada. Os checkpoints imutáveis preservam o detalhamento histórico de cada decisão.

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

`CHATGPT_REMOTE` usa conectores/ferramentas remotas. `CODEX_LOCAL` usa workspace/terminal/Git local. GitHub permanece memória institucional e checkpoint remoto; boundaries materiais/governados permanecem fail-closed sem evidência aplicável.

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

## V11-Q04 — Degraded Operation / Fail-Closed

```yaml
decision_id: V11-Q04
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES
```

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

```text
VERIFIED MCF ACTIVATION
→ IDEA_CAPTURE
→ MINI-TRIAGE
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

Antes do Alignment Gate, implementação de produto é `NO_GO`.

## V11-Q07 — Existing Project Reconnaissance Contract

```yaml
decision_id: V11-Q07
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: EVIDENCE_FIRST_EXISTING_PROJECT_RECONNAISSANCE
```

`ADOPT_EXISTING_PROJECT` começa provisório, com baseline exato e reconnaissance `READ_ONLY_FIRST`. Continuidade MCF válida reclassifica para `RESUME`; continuidade quebrada/não verificável roteia para `RECOVER`. Permanecendo `ADOPT`, MESTRE reconstrói `AS-IS`, produz `Project Reality Report` e faz Reality Read-Back antes da Human Intent Discovery profunda.

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
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: CANONICAL_INTENT_DIMENSIONS_WITH_EVIDENCE_AWARE_RESOLUTION
canonical_dimension_count: 20
fixed_question_count_required: false
```

As 20 dimensões são `PROBLEM`, `MOTIVATION`, `DESIRED_OUTCOME`, `TARGET_USERS`, `CRITICAL_USER_JOURNEYS`, `MUST_HAVE`, `SHOULD_HAVE`, `NON_GOALS`, `PRIORITIES_AND_TRADEOFFS`, `BUSINESS_RULES`, `DATA_AND_SENSITIVITY`, `ROLES_AND_PERMISSIONS`, `AUTOMATION_LEVEL`, `INTEGRATIONS`, `PLATFORM_AND_USAGE_CONTEXT`, `COST_AND_RESOURCE_CONSTRAINTS`, `QUALITY_EXPECTATIONS`, `FAILURE_TOLERANCE`, `DEFINITION_OF_DONE` e `FUTURE_VISION`.

Estados: `CLEAR`, `PARTIAL`, `UNKNOWN`, `CONFLICTING`, `NOT_APPLICABLE`.

```text
DIMENSION_REQUIRED != QUESTION_REQUIRED
MACHINE_EVIDENCE_CAN_SUPPLY_FACTS
MACHINE_EVIDENCE_CANNOT_INVENT_HUMAN_PREFERENCES
TEAM_ENGINEERING_DECIDES_HOW
```

## V11-Q09 — Adaptive Questioning Contract

```yaml
decision_id: V11-Q09
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: EVIDENCE_AWARE_ADAPTIVE_QUESTIONING_WITH_INFORMATION_GAIN
```

Sem sequência ou quantidade fixa de perguntas. Uma resposta pode resolver várias dimensões. Dimensão `CLEAR` não reabre sem causa; follow-up exige ganho de informação; evidência reduz perguntas sem substituir intenção; loops de baixo ganho são proibidos.

```text
QUESTION -> ANSWER -> UPDATE_DIMENSIONS -> REASSESS -> NEXT_BEST_QUESTION
```

Mudança explícita de decisão humana preserva histórico: anterior `SUPERSEDED`, nova `CURRENT`.

## V11-Q10 — Progressive Semantic Read-Back Contract

```yaml
decision_id: V11-Q10
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: EVENT_DRIVEN_PROGRESSIVE_SEMANTIC_READBACK
```

Três níveis: `MICRO_CLARIFICATION`, `PROGRESSIVE_READBACK`, `FINAL_INTENT_READBACK`. Read-back progressivo é acionado por eventos materiais e safety cadence aproximada de 4–6 trocas significativas. Correções invalidam derivações erradas e recalculam dimensões dependentes. `FINAL_INTENT_READBACK` é obrigatório antes do Alignment Gate.

```text
PROGRESSIVE_READBACK = SEMANTIC_CHECKSUM
REJECTED_MACHINE_INTERPRETATION != HUMAN_DECISION
PROGRESSIVE_CONFIRMATION != INTENT_ALIGNMENT_GATE
```

## V11-Q11 — Context Sufficiency / Intent Readiness Contract

```yaml
decision_id: V11-Q11
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: SEMANTIC_READINESS_GATE_WITH_BLOCKING_UNKNOWNS
```

Readiness é semântica, não baseada em quantidade de perguntas ou score puro. Estados globais: `NOT_READY`, `CONDITIONALLY_READY`, `READY_FOR_ALIGNMENT`. `BLOCKING_UNKNOWN` é incerteza capaz de alterar materialmente produto, escopo, usuários, segurança, arquitetura, custo, risco ou sucesso.

Core universal: `PROBLEM`, `DESIRED_OUTCOME`, `TARGET_USERS`, `CRITICAL_USER_JOURNEYS`, `MUST_HAVE`, `NON_GOALS`, `PRIORITIES_AND_TRADEOFFS`, `DEFINITION_OF_DONE`. Outras dimensões tornam-se críticas conforme domínio e risco.

```text
QUESTION_COUNT != CONTEXT_SUFFICIENCY
INTENT_SUFFICIENTLY_UNDERSTOOD != ALL_DETAILS_KNOWN
HIGH_SCORE_DOES_NOT_CANCEL_SEMANTIC_BLOCKER
DELEGATED_TECHNICAL_DETAIL != MISSING_HUMAN_INTENT
READY_FOR_ALIGNMENT != IMPLEMENTATION_AUTHORIZED
```

## V11-Q12 — Project Intent Package Contract

```yaml
decision_id: V11-Q12
question: Q12
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: VERSIONED_PROVENANCE_AWARE_PROJECT_INTENT_PACKAGE
```

### Problema

Transformar a intenção humana capturada pela Discovery em memória durável, versionada e auditável, sem confundir fala original de LEANDRO, síntese do MESTRE, decisões humanas, evidência técnica, inferências, assumptions ou delegações, e sem duplicar arquitetura, backlog ou Mission Contract.

### Decisão de LEANDRO

**Opção D.**

### Contrato conceitual aprovado

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
implementation_authorized: false
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

## V11-Q13 — Existing Project Artifact Pipeline Contract

```yaml
decision_id: V11-Q13
question: Q13
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: EVIDENCE_BOUND_CONDITIONAL_EXISTING_PROJECT_ARTIFACT_PIPELINE
```

`Project Reality Report` representa somente o `AS-IS` em baseline exato com evidência/provenance. `AS-IS / TO-BE Gap Map` vincula revisão exata do PRR à revisão exata e alinhada do PIP. `Completion / Recovery Plan` nasce de gaps validados, não autoriza implementação e é condicional quando existe gap material. `RECOVER_MCF_PROJECT` reconcilia continuidade antes de reconstruir.

Princípios:

```text
AS_IS != TO_BE
PRR != PIP
PRR != PLAN
GAP = EXACT_PRR_REVISION x EXACT_ALIGNED_PIP_REVISION
PLAN_CREATED != IMPLEMENTATION_AUTHORIZED
RESUME != RECONSTRUCT_BY_DEFAULT
RECOVER = RECONCILE_FIRST, ESCALATE_ON_MATERIAL_DIVERGENCE
```

## V11-Q14 — Layered Project Memory Authority Contract

```yaml
decision_id: V11-Q14
question: Q14
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: LAYERED_AUTHORITY_WITH_REBUILDABLE_PROJECT_VIEWS
```

```yaml
authority_classes:
  CANONICAL_DURABLE_RECORD:
    role: AUTHORITATIVE_WITHIN_IDENTIFIED_SCOPE_AND_BOUNDARY
  LIVE_AUTHORITATIVE_STATE:
    role: CURRENT_AUTHORITY_FOR_VOLATILE_EXTERNAL_FACTS
  DERIVED_REBUILDABLE_VIEW:
    role: REBUILDABLE_WITHOUT_CREATING_NEW_AUTHORITY
  WORKING_PROPOSED_ARTIFACT:
    role: NON_AUTHORITATIVE_UNTIL_EXPLICIT_PROMOTION
```

Princípios:

```text
CANONICAL != CURRENT_FOREVER
DERIVED_VIEW_CANNOT_OVERRIDE_CANONICAL_RECORD
LIVE_STATE_CANNOT_REWRITE_HISTORY
CHECKPOINT + LIVE_STATE -> RECONCILIATION
PLAN_EXISTS != PLAN_IS_AUTHORITY
```

## V11-Q15 — Human Envelope / Delegated Technical Authority Contract

```yaml
decision_id: V11-Q15
question: Q15
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: DELEGATED_TECHNICAL_AUTONOMY_WITHIN_HUMAN_APPROVED_ENVELOPE
```

### Problema

Definir como LEANDRO permanece autoridade humana final sem ser obrigado a microgerenciar engenharia, permitindo que a equipe MCF tome decisões técnicas e operacionais de forma autônoma dentro da intenção e dos limites previamente aprovados.

### Contrato conceitual aprovado

```yaml
human_authority:
  final_human_authority: LEANDRO
  governs:
    - HUMAN_INTENT
    - PROJECT_OBJECTIVE
    - DESIRED_OUTCOME
    - HUMAN_PRIORITIES
    - HUMAN_CONSTRAINTS
    - MATERIAL_HUMAN_TRADEOFFS
  technical_micro_management_required: false
human_envelope:
  authoritative_inputs:
    - ALIGNED_PROJECT_INTENT_PACKAGE
    - APPLICABLE_HUMAN_DECISIONS
    - MISSION_CONTRACT
  team_may_silently_redefine: false
team_authority:
  delegated_technical_autonomy: true
  valid_only_within_human_envelope: true
material_change_test:
  if_no_material_change: TEAM_AUTHORITY_CONTINUES
  if_material_change: CROSS_HUMAN_AUTHORITY_BOUNDARY
team_first:
  ambiguity_default: ANALYZE_WITHIN_TEAM_FIRST
  ask_leandro_for_ordinary_technical_choice: false
  unresolved_or_out_of_envelope_decision: ESCALATE
human_gate_specific_actions: DEFER_TO_Q16
implementation_authorized: false
```

Princípios:

```text
HUMAN_FINAL_AUTHORITY != TECHNICAL_MICROMANAGEMENT
WITHIN_APPROVED_ENVELOPE -> TEAM_DECIDES_AND_CONTINUES
MATERIAL_ENVELOPE_CHANGE -> HUMAN_AUTHORITY_BOUNDARY
TEAM_FIRST_BEFORE_HUMAN_ESCALATION
TECHNICAL_OPINION != HUMAN_DECISION
```

## V11-Q16 — Impact-Based Human Gate Contract

```yaml
decision_id: V11-Q16
question: Q16
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: IMPACT_BASED_HUMAN_GATES_WITH_SCOPED_STANDING_AUTHORIZATION
```

### Problema

Definir quando a equipe MCF deve parar e solicitar decisão de LEANDRO sem transformar a autoridade humana final em gargalo operacional, preservando autonomia técnica dentro do envelope aprovado e proteção fail-closed em boundaries materiais.

### Decisão de LEANDRO

**Opção D.**

### Contrato conceitual aprovado

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
  must_explain:
    - WHAT_HAPPENED
    - DECISION_REQUIRED
    - TEAM_RECOMMENDATION
    - ALTERNATIVES_IF_RELEVANT
    - IMPACT_OF_NO_DECISION
  require_human_to_solve_engineering: false

implementation_authorized: false
```

### Regras resultantes

- `HUMAN_GATE` é determinado por impacto material e pela autoridade aplicável, não apenas pelo nome da operação;
- mudanças materiais de intenção, objetivo, público, must-have/non-goal, definição de pronto ou resultado esperado pertencem a LEANDRO;
- compromisso financeiro novo/relevante fora de autorização vigente, exposição jurídica/privacidade/pública material, uso excepcional de credencial pessoal/dado sensível, ações externas irreversíveis/de alto impacto, pivô/cancelamento, aceitação de risco material e ações explicitamente reservadas por LEANDRO exigem gate humano;
- LEANDRO pode conceder autorização antecipada/contínua, mas ela deve possuir escopo, ambiente, classes de ação, limites, expiração/boundary, exclusões e evidência claramente definidos;
- autorização para um boundary não se expande silenciosamente para outros;
- `TEAM_FIRST` permanece obrigatório antes do escalonamento de ambiguidades técnicas ordinárias;
- quando um gate estiver pendente, somente a ação dependente fica fail-closed; trabalho independente, seguro e autorizado pode continuar;
- silêncio ou ausência de resposta nunca equivalem a aprovação;
- aprovação histórica não cobre novo escopo material, salvo quando este estiver claramente contido em autorização contínua ainda válida;
- o HUMAN_GATE deve apresentar a decisão humana necessária em linguagem compreensível, sem exigir que LEANDRO resolva a engenharia.

Princípios:

```text
MATERIAL_IMPACT > OPERATION_NAME
TEAM_FIRST_BEFORE_HUMAN_GATE
SCOPED_AUTHORIZATION != UNBOUNDED_AUTHORITY
NO_RESPONSE != APPROVAL
PAST_APPROVAL != NEW_MATERIAL_AUTHORIZATION
PENDING_HUMAN_GATE_BLOCKS_DEPENDENT_ACTION_NOT_ALL_SAFE_WORK
HUMAN_GATE_ASKS_FOR_HUMAN_DECISION_NOT_ENGINEERING_SOLUTION
```

---

## DISCOVERY-INPUT-001 — Codex Local-First

```yaml
input_id: DISCOVERY-INPUT-001
source: LEANDRO
status: RESOLVED_BY_V11_Q02
mapped_question: Q2
resolution: V11-Q02
```
