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

dimensions:
  canonical_count: 20
  preserve_Q8_states: true
  readiness_impact_required: true
  provenance_required_for_material_claims: true

provenance_types:
  - HUMAN_DIRECT_STATEMENT
  - HUMAN_CONFIRMED_SYNTHESIS
  - PRIOR_VALID_HUMAN_DECISION
  - MACHINE_EVIDENCE
  - MACHINE_INFERENCE
  - TECHNICAL_DELEGATION
  - NOT_APPLICABLE_JUSTIFICATION

decision_history:
  overwrite_material_human_decisions: false
  previous_material_decision: SUPERSEDED
  current_material_decision: CURRENT
  rejected_machine_interpretation_is_human_decision: false

assumptions:
  may_silently_resolve_blocking_human_intent: false

lifecycle:
  - DISCOVERY_IN_PROGRESS
  - READY_FOR_ALIGNMENT
  - ALIGNED
  - REOPENED_AFTER_MATERIAL_CHANGE

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

product_brief:
  must_not_introduce_new_intent: true
  canonical_vs_derived: DEFER_TO_Q14

existing_project_artifacts:
  reality_report_and_gap_map: DEFER_TO_Q13

implementation_authorized: false
```

### Regras resultantes

- o PIP nasce progressivamente após `PROJECT_GENESIS`/início do intake e é enriquecido em boundaries semânticos, não como log de cada frase;
- `IDEA_CAPTURE`/intenção original permanece separada da síntese atual do MESTRE;
- cada afirmação material deve preservar provenance suficiente para distinguir humano, máquina, evidência, inferência e delegação;
- evidência `AS-IS` de projeto existente não substitui intenção humana `TO-BE`;
- decisão humana material anterior é preservada como `SUPERSEDED`, e a nova como `CURRENT`;
- interpretação de máquina rejeitada nunca é promovida a decisão humana;
- delegações técnicas são registradas explicitamente para evitar retransferir engenharia a LEANDRO;
- assumptions, unknowns, blockers e conflicts são dados de primeira classe e não podem fabricar resolução humana;
- readiness é snapshot derivado e recalculável;
- `INTENT_ALIGNMENT_GATE` vincula-se a uma revisão exata do PIP;
- uma revisão alinhada permanece imutável como registro histórico; mudança material cria nova working revision e pode colocar o pacote em `REOPENED_AFTER_MATERIAL_CHANGE`;
- `Intent Alignment Receipt` prova quem confirmou, qual revisão foi confirmada e o resultado do gate, sem duplicar o conteúdo integral do PIP;
- `Mission Contract` nasce depois do alinhamento, referencia a revisão alinhada do PIP e não pode redefinir silenciosamente intenção humana;
- o `Product Brief` não pode introduzir intenção nova; sua classificação canônica/derived fica para Q14;
- `Project Reality Report` e `AS-IS / TO-BE Gap Map` permanecem separados e serão tratados na Q13.

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

### Problema

Definir quais artefatos adicionais um projeto existente precisa produzir sem misturar realidade observada, intenção humana e planejamento, evitando também reconstrução desnecessária quando a continuidade MCF permanece íntegra.

### Decisão de LEANDRO

**Opção D.**

### Contrato conceitual aprovado

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

### Regras resultantes

- `Project Reality Report` representa apenas o `AS-IS` comprovado em baseline identificável; não representa intenção humana, PIP ou plano;
- fatos materiais do PRR exigem evidência/provenance ou classificação explícita como inferência/unknown;
- código, documentação e estado técnico podem demonstrar o que existe, mas não definem silenciosamente o que LEANDRO deseja;
- `Reality Confirmation` ocorre após reconnaissance; correção de intenção segue para o PIP, enquanto contestação de fato observável exige reavaliação de evidência;
- o `AS-IS / TO-BE Gap Map` vincula uma revisão exata do PRR a uma revisão exata e alinhada do PIP;
- análise preliminar de gaps pode existir durante Discovery, mas não possui autoridade de planejamento antes de Reality Confirmation + Intent Alignment;
- `Completion / Recovery Plan` nasce de gaps validados e não autoriza implementação;
- em `ADOPT_EXISTING_PROJECT`, PRR é obrigatório; Gap Map e Completion/Recovery Plan são exigidos quando houver gap material entre AS-IS e TO-BE;
- em `RESUME_MCF_PROJECT` com continuidade verificável, não se reconstrói toda a Discovery nem os três artefatos por padrão;
- em `RECOVER_MCF_PROJECT`, primeiro se reconciliam checkpoint, PIP, Mission State, GitHub live e evidências; divergência material pode escalar para novo PRR, novo Gap Map e novo Completion/Recovery Plan;
- mudanças materiais em realidade, intenção ou gap invalidam/reabrem somente os artefatos dependentes, preservando referências de revisão;
- a classificação de artefatos como canônicos ou derived views permanece explicitamente adiada para Q14.

Princípios:

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

## V11-Q14 — Layered Project Memory Authority Contract

```yaml
decision_id: V11-Q14
question: Q14
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: LAYERED_AUTHORITY_WITH_REBUILDABLE_PROJECT_VIEWS
```

### Problema

Definir autoridade e precedência entre memória durável, estado live, snapshots históricos, análises e documentos auxiliares sem criar múltiplas fontes de verdade concorrentes.

### Decisão de LEANDRO

**Opção D.**

### Contrato conceitual aprovado

```yaml
authority_classes:
  CANONICAL_DURABLE_RECORD:
    role: AUTHORITATIVE_WITHIN_IDENTIFIED_SCOPE_AND_BOUNDARY
    examples:
      - ALIGNED_PROJECT_INTENT_PACKAGE_REVISION
      - HUMAN_DECISION_RECORD
      - INTENT_ALIGNMENT_RECEIPT
      - MISSION_CONTRACT
      - PROJECT_REALITY_REPORT_AT_EXACT_BASELINE
      - EVIDENCE_AND_RECEIPTS
      - CONTINUITY_CHECKPOINT
  LIVE_AUTHORITATIVE_STATE:
    role: CURRENT_AUTHORITY_FOR_VOLATILE_EXTERNAL_FACTS
    examples:
      - BRANCH_HEAD
      - PR_STATE
      - ISSUE_STATE
      - CI_STATE
      - DEPLOY_STATE
      - HEALTH_STATE
      - RELEASE_METADATA
      - PROVIDER_STATE
  DERIVED_REBUILDABLE_VIEW:
    role: REBUILDABLE_FROM_AUTHORITATIVE_INPUTS_WITHOUT_CREATING_NEW_AUTHORITY
    examples:
      - RESUME_CARD
      - CURRENT_STATE_SUMMARY
      - PRODUCT_BRIEF
      - AS_IS_TO_BE_GAP_MAP
      - DASHBOARD
      - ROADMAP_STATUS_VIEW
  WORKING_PROPOSED_ARTIFACT:
    role: NON_AUTHORITATIVE_UNTIL_RELEVANT_DECISION_OR_CONTRACT_IS_FORMALLY_PROMOTED
    examples:
      - COMPLETION_RECOVERY_PLAN_DRAFT
      - ANALYSES
      - DRAFTS
      - PROPOSALS

scope:
  universal_single_canonical_file: false
  authority_is_domain_and_boundary_specific: true
  rebuildable_information_should_duplicate_authority: false

precedence:
  derived_view_may_override_canonical_record: false
  historical_canonical_record_may_override_newer_live_state_for_volatile_fact: false
  live_state_may_rewrite_historical_record: false
  machine_inference_may_become_human_decision_silently: false

checkpoint:
  canonical_for_captured_boundary: true
  current_volatile_state_requires_live_reconciliation: true

promotion:
  explicit_promotion_required: true
  working_artifact_creation_does_not_create_authority: true
  derived_analysis_requiring_human_decision_must_be_recorded_in_authoritative_decision_record: true

product_brief:
  classification: DERIVED_REBUILDABLE_VIEW
  may_override_pip: false
  may_introduce_new_human_intent: false

gap_map:
  classification: DERIVED_REBUILDABLE_VIEW
  may_be_versioned_for_audit: true
  inputs:
    - EXACT_PRR_REVISION
    - EXACT_ALIGNED_PIP_REVISION
  machine_inference_becomes_human_intent_automatically: false

completion_recovery_plan:
  initial_classification: WORKING_PROPOSED_ARTIFACT
  existence_implies_implementation_authority: false

implementation_authorized: false
```

### Regras resultantes

- `CANONICAL` não significa `CURRENT_FOREVER`; um registro canônico pode ser histórico e continuar válido somente para seu boundary identificado;
- fatos externos voláteis são resolvidos por `LIVE_AUTHORITATIVE_STATE`, não por cópias documentais antigas;
- `LIVE_AUTHORITATIVE_STATE` não apaga nem reescreve a história preservada em registros duráveis;
- o PIP alinhado é autoridade sobre intenção humana da revisão aprovada; Product Brief é visão derivada e não pode alterar essa intenção;
- PRR é registro durável autoritativo da realidade observada no baseline exato que declara, não uma afirmação eterna do estado corrente;
- Gap Map é análise derivada/reconstruível entre PRR exato e PIP alinhado exato; pode ser versionado por auditoria sem se tornar autoridade independente sobre intenção;
- Completion/Recovery Plan nasce como working/proposed artifact e sua mera existência não autoriza execução;
- checkpoint é canônico como registro de continuidade do boundary capturado, porém a retomada deve reconciliá-lo com estado live antes de tratar fatos voláteis como atuais;
- Resume Card, dashboards, resumos, Product Brief e views de roadmap devem apontar para fontes autoritativas e permanecer reconstruíveis;
- promoção de proposta/análise para decisão ou contrato autoritativo deve ser explícita e registrar somente a autoridade necessária;
- não existe um único arquivo universal que seja fonte de verdade para todos os domínios do projeto.

Princípios:

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

### Decisão de LEANDRO

**Opção D.**

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
  domains_include:
    - ARCHITECTURE
    - IMPLEMENTATION_DETAILS
    - LIBRARIES_AND_FRAMEWORKS
    - DATA_MODELING
    - INFRASTRUCTURE_TECHNICAL_CHOICES
    - TEST_STRATEGY
    - TECHNICAL_SECURITY_CONTROLS
    - OBSERVABILITY
    - REFACTORING
    - BUG_FIXING
    - TECHNICAL_PATTERNS
  subject_to:
    - AGENT_COMPETENCE
    - MISSION_CONTRACT
    - GOVERNANCE
    - EVIDENCE
    - RISK_BOUNDARIES

material_change_test:
  checks:
    - HUMAN_INTENT
    - PROJECT_OBJECTIVE
    - TARGET_USERS
    - MUST_HAVE_OR_NON_GOAL
    - HUMAN_PRIORITY_OR_TRADEOFF
    - MATERIAL_COST_OR_RESOURCE_CONSTRAINT
    - MATERIAL_RISK
    - MATERIAL_EXTERNAL_EXPOSURE
    - DEFINITION_OF_DONE
    - DESIRED_OUTCOME
  if_no_material_change: TEAM_AUTHORITY_CONTINUES
  if_material_change: CROSS_HUMAN_AUTHORITY_BOUNDARY

team_first:
  ambiguity_default: ANALYZE_WITHIN_TEAM_FIRST
  ask_leandro_for_ordinary_technical_choice: false
  unresolved_or_out_of_envelope_decision: ESCALATE

role_boundaries:
  MESTRE:
    - COORDINATES
    - INTERPRETS_CONTRACTS
    - PROTECTS_HUMAN_ENVELOPE
    - MUST_NOT_REDEFINE_HUMAN_INTENT
  LEO:
    - OPERATIONAL_AUTHORITY_DELEGATED
    - DECIDES_INTERNAL_GATES_WITHIN_SCOPE
    - ESCALATES_OUT_OF_ENVELOPE_DECISIONS
  SPECIALIST_AGENTS:
    - TECHNICAL_AUTHORITY_WITHIN_COMPETENCE
    - TECHNICAL_AUTHORITY_WITHIN_MISSION_CONTRACT
    - MUST_NOT_PROMOTE_TECHNICAL_OPINION_TO_HUMAN_DECISION

human_gate_specific_actions: DEFER_TO_Q16
implementation_authorized: false
```

### Regras resultantes

- LEANDRO governa intenção, objetivo, resultado esperado, prioridades humanas, limites e trade-offs humanos materiais;
- a equipe MCF governa decisões técnicas e operacionais dentro do envelope humano aprovado, sem exigir aprovação humana para escolhas técnicas ordinárias;
- `ALIGNED_PIP + HUMAN_DECISIONS + MISSION_CONTRACT` formam o envelope de autoridade aplicável;
- a equipe não pode redefinir silenciosamente o envelope para justificar uma solução técnica;
- antes de escalar uma ambiguidade, aplica-se `TEAM_FIRST`: especialistas analisam evidências, alternativas e consequências e tentam resolver dentro da autoridade delegada;
- escolha técnica que não altera materialmente o envelope permanece sob autoridade da equipe;
- mudança material de intenção, objetivo, público, must-have/non-goal, prioridade, custo/recurso, risco, exposição externa, definição de pronto ou resultado esperado cruza a fronteira da autoridade humana;
- MESTRE protege e interpreta o envelope; LÉO exerce autoridade operacional delegada; especialistas possuem autoridade técnica limitada à competência, contrato e governança;
- autoridade humana final não equivale a microgerenciamento técnico;
- a lista específica de ações que exigem `HUMAN_GATE` permanece reservada para Q16.

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

## V11-Q17 — Event-Driven Transferable Continuity Contract

```yaml
decision_id: V11-Q17
question: Q17
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: EVENT_DRIVEN_TRANSFERABLE_CHECKPOINT_WITH_VERIFIED_RESUME
```

### Problema

Permitir pausa, troca de chat, troca de ambiente e retomada confiável sem depender da memória do chat anterior, sem transformar checkpoint em log de conversa e sem declarar como transferido trabalho que exista apenas localmente ou não seja verificável.

### Decisão de LEANDRO

**Opção D.**

### Contrato conceitual aprovado

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

### Regras resultantes

- checkpoint é orientado a eventos materiais e boundaries de transferência, não a cada mensagem nem prioritariamente por relógio/contagem;
- pausa planejada, troca de chat ou troca de ambiente exige checkpoint durável e transferível;
- Resume Card continua `DERIVED_REBUILDABLE_VIEW`: orienta rapidamente, mas não substitui o checkpoint nem fontes autoritativas;
- retomada segue `Resume Card → checkpoint canônico → fontes autoritativas necessárias → GitHub/provider live → reconciliação`;
- continuidade válida usa `FAST_RESUME`; drift explicável usa `RECONCILE`; ausência/conflito/divergência material inexplicável/evidência insuficiente roteia para `RECOVER_MCF_PROJECT`;
- memória/transcript do chat anterior é contexto opcional, nunca requisito de continuidade;
- trabalho exclusivamente local e não persistido não pode ser tratado como transferido remotamente;
- em transferência planejada de ambiente, estado local deve ser persistido por mecanismo autorizado ou a transferibilidade deve ser declarada bloqueada;
- trabalho local perdido ou não verificável é declarado `LOST_OR_UNVERIFIED_LOCAL_WORK`, nunca reconstruído por invenção;
- `PAUSED != CANCELLED`, `WAITING_HUMAN_GATE != FAILED` e `NEW_CHAT != NEW_MISSION`;
- retomada somente continua do `next_action` depois de validar checkpoint, metodologia, contratos aplicáveis e estado live.

Princípios:

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

---

## DISCOVERY-INPUT-001 — Codex Local-First

```yaml
input_id: DISCOVERY-INPUT-001
source: LEANDRO
status: RESOLVED_BY_V11_Q02
mapped_question: Q2
resolution: V11-Q02
```
