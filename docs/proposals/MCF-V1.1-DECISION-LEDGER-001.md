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

---

## DISCOVERY-INPUT-001 — Codex Local-First

```yaml
input_id: DISCOVERY-INPUT-001
source: LEANDRO
status: RESOLVED_BY_V11_Q02
mapped_question: Q2
resolution: V11-Q02
```
