# MCF v1.1 — Discovery Checkpoint 003

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-003`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 3
questions_remaining: 17
last_completed_question: 3
next_question: 4
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução:** NÃO repetir Q1–Q3 salvo solicitação explícita de LEANDRO. Retomar em Q4.

---

## 2. Decisões preservadas

### Q1

`HYBRID_INTENT_AND_EXPLICIT_ACTIVATION` — Opção D.

### Q2

`LOCAL_FIRST_REMOTE_CHECKPOINTED` — Opção D.

Princípios:

```text
MCF_METHOD != EXECUTION_HOST
EDIT != COMMIT != PUSH != PR
LOCAL_UNCHECKPOINTED != REMOTE_CHECKPOINTED
```

### Q3

`VERIFIED_TWO_STAGE_BOOTSTRAP` — Opção D.

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

Fluxo:

```text
ACTIVATING
   ↓
Bootstrap Index
   ↓
PROJECT_PIN > LEANDRO_EXPLICIT > CURRENT_STABLE
   ↓
TAG/SHA IMUTÁVEL
   ↓
carregar metodologia/governança
   ↓
verificar requisitos mínimos
   ↓
ACTIVE
```

---

## 3. Fronteira deixada para Q4

Q3 resolve descoberta e seleção da metodologia. Q4 deve decidir comportamento quando GitHub, Bootstrap Index, pin ou fonte canônica estiverem:

- indisponíveis;
- inconsistentes;
- não verificáveis;
- divergentes;
- parcialmente acessíveis.

Q4 deve definir fail-closed, fallback seguro e limites de operação degradada.

---

## 4. Próxima pergunta

> **Q4 — Como deve funcionar o fail-closed quando GitHub/bootstrap/fonte canônica não estiver acessível ou não puder ser verificada?**

Implementação continua `NO_GO`.
