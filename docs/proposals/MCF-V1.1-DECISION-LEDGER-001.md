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

### Problema

Definir como o MCF classifica a entrada de um projeto sem confundir criação, adoção de projeto externo, retomada de projeto já governado pelo MCF e recuperação de continuidade quebrada.

### Alternativas consideradas

- A — dois modos: `NEW_PROJECT` e `EXISTING_PROJECT`;
- B — três modos: `NEW_PROJECT`, `ADOPT_EXISTING_PROJECT`, `RESUME_MCF_PROJECT`;
- C — quatro modos independentes, incluindo `RECOVER_MCF_PROJECT` como quarto entry mode;
- D — três modos canônicos e `RECOVER_MCF_PROJECT` como rota excepcional acionada quando a continuidade MCF esperada está quebrada ou não verificável.

### Decisão de LEANDRO

**Opção D.**

### Contrato conceitual aprovado

```yaml
PROJECT_ENTRY_MODE:
  - NEW_PROJECT
  - ADOPT_EXISTING_PROJECT
  - RESUME_MCF_PROJECT

RECOVERY_ROUTE:
  - RECOVER_MCF_PROJECT

NEW_PROJECT:
  meaning: NO_MATERIAL_EXISTING_IMPLEMENTATION_TO_PRESERVE

ADOPT_EXISTING_PROJECT:
  meaning: EXISTING_PROJECT_NOT_YET_UNDER_VERIFIED_MCF_CONTINUITY

RESUME_MCF_PROJECT:
  meaning: EXISTING_PROJECT_WITH_VERIFIED_MCF_CONTINUITY

RECOVER_MCF_PROJECT:
  meaning: PRIOR_MCF_PROJECT_WITH_BROKEN_OR_UNVERIFIED_CONTINUITY
  classification: RECOVERY_ROUTE_NOT_PRIMARY_ENTRY_MODE
```

### Regras de classificação

```yaml
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

- LEANDRO fala em linguagem natural; não precisa escolher códigos internos;
- existência de repositório não define sozinha o modo — repo vazio pode continuar sendo `NEW_PROJECT`;
- projeto externo com implementação material e sem continuidade MCF verificável entra em `ADOPT_EXISTING_PROJECT`;
- `RESUME_MCF_PROJECT` exige memória/estado MCF verificáveis;
- se um projeto MCF esperado apresenta continuidade quebrada ou contraditória, o MCF roteia para `RECOVER_MCF_PROJECT` antes de retomar;
- enquanto a classificação estiver `UNRESOLVED`, MESTRE pode investigar e perguntar, mas execução de missão permanece `NO_GO`;
- modos como fork, migração, clone ou transferência não são primary entry modes da v1.1 e devem ser tratados como variações dos modos canônicos quando possível.

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
