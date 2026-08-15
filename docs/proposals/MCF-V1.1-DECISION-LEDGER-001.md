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

PIP é a memória durável da intenção humana, separando intenção original, síntese do MESTRE, decisões humanas, evidência, inferências, assumptions, unknowns e delegações. O `INTENT_ALIGNMENT_GATE` vincula revisão exata; `Mission Contract` nasce depois do alinhamento e referencia o PIP alinhado. Revisões alinhadas permanecem históricas e imutáveis.

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

`Project Reality Report` representa somente o `AS-IS` em baseline identificável, com evidência/provenance. `AS-IS / TO-BE Gap Map` compara revisão exata do PRR com revisão exata e alinhada do PIP. `Completion / Recovery Plan` nasce de gaps validados e não autoriza implementação. `RECOVER_MCF_PROJECT` reconcilia primeiro e só escala diante de divergência material.

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

Quatro classes de autoridade foram definidas: `CANONICAL_DURABLE_RECORD`, `LIVE_AUTHORITATIVE_STATE`, `DERIVED_REBUILDABLE_VIEW` e `WORKING_PROPOSED_ARTIFACT`. Canônico é específico de domínio/boundary; estado live governa fatos externos voláteis; derived views não criam autoridade concorrente; propostas exigem promoção explícita.

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

LEANDRO governa intenção, objetivo, resultado esperado, prioridades, limites e trade-offs humanos materiais. `ALIGNED_PIP + HUMAN_DECISIONS + MISSION_CONTRACT` formam o envelope aplicável. A equipe decide escolhas técnicas e operacionais ordinárias dentro desse envelope; mudança material cruza a fronteira humana. `TEAM_FIRST` precede escalonamento técnico.

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

`HUMAN_GATE` é determinado por impacto material, não pelo nome isolado da operação. Mudanças materiais de intenção/objetivo/público, custos fora do boundary, riscos jurídicos/privacidade/exposição, uso excepcional de credenciais/dados sensíveis, ações irreversíveis/de alto impacto, pivô/cancelamento, aceitação de risco material e ações reservadas por LEANDRO exigem gate. Autorizações antecipadas/contínuas são permitidas somente com limites verificáveis. Gate pendente bloqueia apenas a ação dependente; silêncio nunca equivale a aprovação.

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

Checkpoint é orientado a evento material/boundary de transferência. Pausa planejada, troca de chat ou ambiente exige checkpoint durável transferível. Resume Card é view derivada. Retomada segue `Resume Card → checkpoint canônico → fontes autoritativas → estado live → reconciliação`. Rotas: `FAST_RESUME`, `RECONCILE`, `RECOVER_MCF_PROJECT`. Memória do chat é opcional; trabalho local não persistido nunca é tratado como remotamente transferido.

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

## V11-Q18 — Compatible Extension and Migration Contract

```yaml
decision_id: V11-Q18
question: Q18
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: COMPATIBLE_EXTENSION_VERSIONING_AND_EXPLICIT_MIGRATION
```

### Problema

Evoluir a v1.0.0 para v1.1.0 sem reescrever ou duplicar runtime, memória, recovery, gates, permissions, checkpoints e Mission Contract; preservar projetos e artefatos existentes e manter a identidade histórica da release v1.0.0.

### Contrato conceitual aprovado

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

### Regras resultantes

- v1.1 estende o core v1.0 em vez de criar um segundo runtime ou segunda governança paralela;
- `MCF-START-MISSION` e `MCF-RECOVER-CONTEXT` são evoluídos para consumir os novos artefatos e modos de entrada, sem criar skills duplicadas apenas por versão;
- Mission Contract, checkpoint, permissions/Human Delegation, handoffs, receipts, reconciliação e observabilidade são reutilizados e versionados quando necessário;
- formatos novos preferem extensões aditivas compatíveis; ausência de campos v1.1 em artefato legado não torna automaticamente o projeto inválido;
- projetos v1.0 não sofrem migração em massa somente porque a v1.1 existe;
- `METHODOLOGY_PIN` impede upgrade silencioso no meio da missão; upgrade/migração ocorre em boundary seguro e explícito;
- migração preserva o artefato original e gera sucessor versionado com provenance e validação antes de ativação;
- primitive novo exige `NO_EQUIVALENT_TEST` e justificativa de ausência de mecanismo v1.0 válido;
- compatibilidade deve ser comprovada em documento, contrato e runtime;
- identidade publicada de v1.0.0 permanece histórica e imutável; v1.1.0 terá identidade própria futura;
- incompatibilidade real em autoridade, gates ou fluxo central deve ser reclassificada, não escondida dentro da versão minor.

Princípios:

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

---

## DISCOVERY-INPUT-001 — Codex Local-First

```yaml
input_id: DISCOVERY-INPUT-001
source: LEANDRO
status: RESOLVED_BY_V11_Q02
mapped_question: Q2
resolution: V11-Q02
```
