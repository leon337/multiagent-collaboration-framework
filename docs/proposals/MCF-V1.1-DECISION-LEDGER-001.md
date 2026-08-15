# MCF v1.1 — Decision Ledger

**ID:** `MCF-V1.1-DECISION-LEDGER-001`  
**Status:** `ACTIVE`  
**Branch:** `planning/mcf-v1.1-discovery`

Este ledger preserva decisões da Discovery da v1.1.0 sem depender do histórico de chat.

---

## V11-D0 — Discovery Charter

```yaml
decision_id: V11-D0
kind: DISCOVERY_GOVERNANCE
status: APPROVED_BY_LEANDRO
target_version: v1.1.0
baseline: v1.0.0
branch: planning/mcf-v1.1-discovery
implementation_authorized: false
```

### Decisão

A evolução v1.1 será definida primeiro por Discovery estruturada. A implementação pelo Codex só pode ocorrer após fechamento do escopo, reconciliação, revisão crítica e autorização explícita de LEANDRO.

---

## V11-Q01 — MCF Activation Contract

```yaml
decision_id: V11-Q01
question: Q1
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: HYBRID_INTENT_AND_EXPLICIT_ACTIVATION
```

### Decisão

Chat normal permanece fora do MCF. Comando explícito ou intenção clara de projeto pode iniciar `ACTIVATING`; `ACTIVE` exige bootstrap/metodologia/fonte de verdade verificável.

---

## V11-Q02 — Execution Environment Contract

```yaml
decision_id: V11-Q02
question: Q2
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: LOCAL_FIRST_REMOTE_CHECKPOINTED
```

### Decisão

A mesma metodologia/governança do MCF opera em hosts diferentes, enquanto o execution plane pode variar.

```text
MCF_METHOD != EXECUTION_HOST
EDIT != COMMIT != PUSH != PR
LOCAL_UNCHECKPOINTED != REMOTE_CHECKPOINTED
```

`CHATGPT_REMOTE` usa conectores/ferramentas remotas; `CODEX_LOCAL` usa workspace, terminal e Git local. GitHub permanece memória institucional, checkpoint remoto, CI, revisão e integração. Checkpoints remotos são exigidos em boundaries semânticos/de risco. Trabalho local reversível pode continuar temporariamente com `CHECKPOINT_DEBT` quando remoto estiver indisponível; boundary material/governado permanece `FAIL_CLOSED`.

---

## V11-Q03 — Bootstrap Version Resolution Contract

```yaml
decision_id: V11-Q03
question: Q3
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: VERIFIED_TWO_STAGE_BOOTSTRAP
```

### Decisão

O bootstrap resolve a metodologia em duas etapas: locator canônico mutável apenas para descobrir a versão operacional e referência imutável por tag/SHA para carregar a metodologia.

```yaml
bootstrap_locator:
  repository: leon337/multiagent-collaboration-framework
  canonical_index: docs/bootstrap/MCF-BOOTSTRAP-INDEX.yaml
resolution_order:
  - VALID_PROJECT_PIN
  - EXPLICIT_LEANDRO_SELECTION
  - CURRENT_STABLE
immutable_methodology_ref:
  required: true
  accepted_identity: [TAG, COMMIT_SHA]
project_methodology_pin:
  required_after_intake: true
silent_mid_mission_upgrade:
  allowed: false
default_exclusions:
  - DISCOVERY
  - PLANNING
  - RC
  - EXPERIMENTAL
  - ALPHA
  - BETA
```

---

## V11-Q04 — Degraded Operation and Fail-Closed Contract

```yaml
decision_id: V11-Q04
question: Q4
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES
```

### Decisão

Quando a fonte canônica estiver indisponível, operação degradada só é permitida quando a base local já é verificável e apenas para trabalho local reversível. Inconsistência entre fontes produz bloqueio canônico e fail-closed.

```text
UNAVAILABLE != INCONSISTENT
LOCAL_COPY != VERIFIED_LOCAL_COPY
CACHE_CAN_PROVE_IDENTITY != CACHE_CAN_PROVE_CURRENT_STABLE
HUMAN_AUTHORITY != TECHNICAL_EVIDENCE
```

Merge, deploy, release, publicação, integração final, upgrade de metodologia, mudança de autoridade, review terminal e efeitos externos materiais sem evidência remota ficam bloqueados. Recuperação do remoto exige revalidação, reconciliação do `CHECKPOINT_DEBT` e `Degraded Operation Receipt`.

---

## V11-Q05 — Project Entry Classification Contract

```yaml
decision_id: V11-Q05
question: Q5
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: THREE_CANONICAL_ENTRY_MODES_WITH_RECOVERY_ROUTE
```

### Decisão

O MCF possui três modos canônicos de entrada e uma rota excepcional de recuperação.

```yaml
PROJECT_ENTRY_MODE:
  - NEW_PROJECT
  - ADOPT_EXISTING_PROJECT
  - RESUME_MCF_PROJECT
RECOVERY_ROUTE:
  - RECOVER_MCF_PROJECT
classification:
  human_intent: INPUT
  machine_evidence: REQUIRED
  automatic_detection: ENABLED
  ambiguous_state: PROJECT_ENTRY_CLASSIFICATION_UNRESOLVED
execution_before_classification:
  allowed: false
```

Princípios:

```text
HUMAN_INTENT + MACHINE_EVIDENCE = ENTRY_CLASSIFICATION
ADOPT != RECOVER
RESUME_REQUIRES_VERIFIED_CONTINUITY
```

---

## V11-Q06 — New Project Genesis Contract

```yaml
decision_id: V11-Q06
question: Q6
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: PROGRESSIVE_DURABLE_PROJECT_GENESIS
```

### Problema

Definir como um `NEW_PROJECT` passa da ideia humana para uma casa durável de projeto e, depois, para uma missão técnica, sem implementar cedo demais nem deixar a Discovery presa ao contexto transitório do chat.

### Alternativas consideradas

- A — entrevista completa antes de criar repositório;
- B — criar repositório imediatamente ao ouvir a ideia;
- C — mini-triagem → repo → Discovery → gate;
- D — gênese progressiva e durável: ativação verificada, captura da ideia, mini-triagem, identidade provisória, Project Genesis durável, methodology pin, checkpoints durante Intake, Human Intent Discovery, Intent Alignment Gate e somente então `MCF-START-MISSION`.

### Decisão de LEANDRO

**Opção D.**

### Contrato conceitual aprovado

```yaml
entry_mode: NEW_PROJECT
model: PROGRESSIVE_DURABLE_PROJECT_GENESIS

stages:
  - VERIFIED_MCF_ACTIVATION
  - IDEA_CAPTURE
  - MINI_TRIAGE
  - PROJECT_GENESIS
  - DURABLE_INTAKE_CHECKPOINT
  - HUMAN_INTENT_DISCOVERY
  - INTENT_READINESS
  - INTENT_ALIGNMENT_GATE
  - MCF_START_MISSION

mini_triage:
  target_questions: 3_to_5
  purpose: PROJECT_IDENTITY_NOT_FULL_REQUIREMENTS

project_genesis:
  before_deep_intent_discovery: true
  methodology_pin_required: true
  durable_project_home_required: true

naming:
  internal_project_id: STABLE
  repository_slug: TECHNICAL_IDENTITY
  working_title: PROVISIONAL
  final_product_name: MAY_CHANGE_BEFORE_ALIGNMENT

pre_alignment:
  product_implementation: NO_GO
  discovery_and_documentation: ALLOWED
  noncanonical_discovery_prototype: CONDITIONAL

minimum_pre_mission_artifacts:
  - PROJECT_GENESIS_RECORD
  - PROJECT_INTAKE_CHECKPOINT
  - PROJECT_INTENT_PACKAGE
  - INTENT_ALIGNMENT_RECEIPT

mission_contract:
  created_before_mcf_start_mission: false

abandonment:
  allowed_before_alignment: true
  creates_execution_debt: false
```

### Fluxo aprovado

```text
LEANDRO: "Mestre, tenho uma ideia."
        ↓
MCF ACTIVATION + bootstrap/version verified
        ↓
NEW_PROJECT
        ↓
IDEA_CAPTURE — preservar intenção humana original
        ↓
MINI-TRIAGE — 3–5 perguntas de alta alavancagem
        ↓
PROJECT GENESIS — internal id + working title + repo slug + descrição
        ↓
PROJECT HOME / REPOSITORY
        ↓
METHODOLOGY PIN
        ↓
PROJECT GENESIS RECORD
        ↓
DURABLE INTAKE CHECKPOINT
        ↓
HUMAN INTENT DISCOVERY
        ↓
INTENT READINESS
        ↓
PROJECT INTENT PACKAGE
        ↓
MESTRE READ-BACK FINAL
        ↓
LEANDRO CONFIRMA
        ↓
INTENT ALIGNMENT GATE = PASS
        ↓
MCF-START-MISSION
        ↓
TEAM PLANNING / TECHNICAL ARCHITECTURE / IMPLEMENTATION
```

### Regras resultantes

- `IDEA_CAPTURE` deve preservar o que LEANDRO realmente disse antes de traduções técnicas posteriores;
- o repositório/project home nasce depois de identidade mínima suficiente e antes da entrevista profunda, para que o Intake seja durável;
- `internal_project_id`, `repository_slug`, `working_title` e nome/marca final são conceitos distintos;
- o methodology pin nasce no Project Genesis para impedir silent upgrade durante uma Discovery longa;
- `LOCAL_FIRST` para código não significa `LOCAL_ONLY` para memória: Intake e checkpoints devem ganhar persistência durável aplicável;
- antes do `INTENT_ALIGNMENT_GATE`, o MCF pode explorar, pesquisar, documentar, criar hipóteses e protótipos de descoberta não canônicos, mas implementação de produto permanece `NO_GO`;
- protótipo de Discovery, quando útil, é descartável/não canônico e não recebe crédito de implementação;
- terminar número fixo de perguntas não equivale a readiness; Q8–Q11 definirão conteúdo e suficiência da intenção;
- `PROJECT_INTENT_PACKAGE` e `INTENT_ALIGNMENT_RECEIPT` devem existir antes de `MCF-START-MISSION`;
- `MISSION CONTRACT` nasce a partir de `MCF-START-MISSION`, não durante a captura da intenção;
- uma ideia pode ser `ABANDONED_BEFORE_ALIGNMENT` sem criar dívida de execução.

---

## DISCOVERY-INPUT-001 — Codex Local-First

```yaml
input_id: DISCOVERY-INPUT-001
source: LEANDRO
status: RESOLVED_BY_V11_Q02
mapped_question: Q2
not_a_decision: true
resolution: V11-Q02
```

O insight de execução local no Codex foi incorporado e decidido formalmente em `V11-Q02` como `LOCAL_FIRST_REMOTE_CHECKPOINTED`.
