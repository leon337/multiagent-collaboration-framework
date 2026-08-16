# MCF v1.1 — Discovery Checkpoint 002

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-002`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 2
questions_remaining: 18
last_completed_question: 2
next_question: 3
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução:** NÃO repetir Q1 ou Q2 salvo solicitação explícita de LEANDRO. Retomar em Q3.

---

## 2. Decisão Q1 preservada

```yaml
activation_contract: HYBRID_INTENT_AND_EXPLICIT_ACTIVATION
chosen_option: D
```

Chat normal permanece fora do MCF. Comando explícito ou intenção clara de projeto pode iniciar `ACTIVATING`; `ACTIVE` exige bootstrap/metodologia/fonte de verdade verificável.

---

## 3. Decisão Q2 — Execution Environment Contract

LEANDRO escolheu **Opção D — `LOCAL_FIRST_REMOTE_CHECKPOINTED`**.

```yaml
same_mcf_methodology_across_hosts: true
supported_execution_modes_v1_1:
  - CHATGPT_REMOTE
  - CODEX_LOCAL

CHATGPT_REMOTE:
  primary_execution_plane: CONNECTORS_AND_REMOTE_TOOLS

CODEX_LOCAL:
  primary_execution_plane: LOCAL_WORKSPACE_TERMINAL_AND_GIT
  exact_remote_baseline_required: true
  isolated_branch_or_worktree: true
  local_commits_allowed: true
  push_every_edit: false
  remote_checkpoint_required: true
```

### Boundaries de checkpoint remoto aprovados

```yaml
remote_checkpoint_required_at:
  - PHASE_OR_SUBMISSION_COMPLETED
  - LONG_PAUSE_OR_SESSION_END
  - BEFORE_HUMAN_GATE
  - BEFORE_INDEPENDENT_REVIEW
  - MATERIAL_VALIDATION_PASS
  - BEFORE_HIGH_RISK_BOUNDARY
  - AGENT_HANDOFF
  - INTEGRATION_CANDIDATE
```

### Semântica

```text
EDIT != COMMIT != PUSH != PR
LOCAL_UNCHECKPOINTED != REMOTE_CHECKPOINTED
MCF_METHOD != EXECUTION_HOST
```

- Commit local pode ser frequente sem push a cada alteração.
- Push é checkpoint remoto/durável.
- PR é boundary de integração/revisão, não obrigatório a cada checkpoint.
- GitHub permanece memória institucional, CI, colaboração, revisão e integração.
- Codex usa workspace/terminal/Git local como execution plane quando disponível.

### Falha do remoto

```yaml
remote_unavailable:
  low_risk_reversible_local_work: CONTINUE_WITH_CHECKPOINT_DEBT
  material_or_governed_boundary: FAIL_CLOSED
```

Não atravessar HUMAN_GATE, review independente, deploy, merge, publicação ou boundary material relevante sem evidência remota aplicável.

---

## 4. Discovery input resolvido

```yaml
input: CODEX_LOCAL_FIRST_EXECUTION
previous_status: DISCOVERY_INPUT_PENDING_DECISION
current_status: RESOLVED_BY_Q2
resolution: LOCAL_FIRST_REMOTE_CHECKPOINTED
```

---

## 5. Próxima pergunta

> **Q3 — Como o bootstrap do MCF encontra e verifica a versão/metodologia vigente?**

Não iniciar implementação. Q3 continua sendo decisão de Discovery.
