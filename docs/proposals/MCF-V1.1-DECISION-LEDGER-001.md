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

### Contrato conceitual aprovado

```text
CHAT_NORMAL
   ↓
comando explícito OU intenção clara de projeto/MCF
   ↓
ACTIVATING
   ↓
carregar/verificar metodologia e fonte de verdade
   ↓
ACTIVE
```

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
checkpoint_boundaries:
  - PHASE_OR_SUBMISSION_COMPLETED
  - LONG_PAUSE_OR_SESSION_END
  - BEFORE_HUMAN_GATE
  - BEFORE_INDEPENDENT_REVIEW
  - MATERIAL_VALIDATION_PASS
  - BEFORE_HIGH_RISK_BOUNDARY
  - AGENT_HANDOFF
  - INTEGRATION_CANDIDATE
pull_request:
  required_at_every_checkpoint: false
  required_for_integration_boundary: true
remote_unavailable:
  low_risk_reversible_local_work: CONTINUE_WITH_CHECKPOINT_DEBT
  material_or_governed_boundary: FAIL_CLOSED
```

### Semântica aprovada

```text
MCF_METHOD != EXECUTION_HOST
EDIT != COMMIT != PUSH != PR
LOCAL_UNCHECKPOINTED != REMOTE_CHECKPOINTED
```

---

## V11-Q03 — Bootstrap Version Resolution Contract

```yaml
decision_id: V11-Q03
question: Q3
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: VERIFIED_TWO_STAGE_BOOTSTRAP
```

### Problema

Definir como um novo ChatGPT/Codex encontra qual versão e metodologia MCF devem governar uma missão, evitando usar instrução stale, `main` mutável ou branch experimental como metodologia operacional por acidente.

### Alternativas consideradas

- A — versão fixa na instrução do ChatGPT;
- B — sempre seguir `main`;
- C — sempre usar a stable mais recente;
- D — bootstrap em duas etapas: locator canônico mutável apenas para resolução + metodologia pinada por referência imutável.

### Decisão de LEANDRO

**Opção D.**

### Contrato conceitual aprovado

```yaml
bootstrap_model: VERIFIED_TWO_STAGE_BOOTSTRAP
bootstrap_locator:
  repository: leon337/multiagent-collaboration-framework
  canonical_index: docs/bootstrap/MCF-BOOTSTRAP-INDEX.yaml
resolution_order:
  - VALID_PROJECT_PIN
  - EXPLICIT_LEANDRO_SELECTION
  - CURRENT_STABLE
mutable_locator:
  allowed: true
  purpose: RESOLVE_CURRENT_STABLE
immutable_methodology_ref:
  required: true
  accepted_identity:
    - TAG
    - COMMIT_SHA
default_exclusions:
  - DISCOVERY
  - PLANNING
  - RC
  - EXPERIMENTAL
  - ALPHA
  - BETA
project_methodology_pin:
  required_after_intake: true
silent_mid_mission_upgrade:
  allowed: false
active_requires:
  repository_verified: true
  version_resolved: true
  immutable_ref_resolved: true
  bootstrap_loaded: true
```

### Fluxo aprovado

```text
ACTIVATING
   ↓
consultar repositório oficial
   ↓
ler Bootstrap Index canônico
   ↓
resolver PROJECT_PIN > LEANDRO_EXPLICIT > CURRENT_STABLE
   ↓
resolver tag/SHA imutável
   ↓
carregar metodologia/governança nessa referência
   ↓
verificar requisitos mínimos
   ↓
ACTIVE
```

### Regras resultantes

- instruções globais podem apontar para o bootstrap, mas não devem duplicar a metodologia completa;
- `main` não é automaticamente a metodologia operacional;
- projeto MCF existente continua pela versão pinada, salvo processo explícito de upgrade;
- projeto novo ou projeto sem pin adota a `CURRENT_STABLE` resolvida pelo índice, salvo seleção explícita de LEANDRO;
- RC, Discovery, planning e versões experimentais não são defaults operacionais;
- atualização da stable não autoriza upgrade silencioso no meio de uma missão;
- detalhes de indisponibilidade, inconsistência e fail-closed são definidos em Q4.

---

## V11-Q04 — Degraded Operation and Fail-Closed Contract

```yaml
decision_id: V11-Q04
question: Q4
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES
```

### Problema

Definir como o MCF se comporta quando GitHub, Bootstrap Index, project pin ou outra fonte canônica está indisponível, parcialmente acessível, inconsistente ou não verificável, sem confundir alta disponibilidade com perda de integridade.

### Alternativas consideradas

- A — `ABSOLUTE_FAIL_CLOSED`: qualquer falha paralisa toda operação;
- B — `LAST_KNOWN_GOOD_CONTINUE`: continuar automaticamente usando cache local anterior;
- C — perguntar sempre a LEANDRO;
- D — operação degradada apenas quando a base local já é verificável, com fail-closed nos boundaries materiais/governados.

### Decisão de LEANDRO

**Opção D.**

### Contrato conceitual aprovado

```yaml
operation_model: VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES

new_project_without_verified_bootstrap:
  state: ACTIVATING_BLOCKED
  mcf_active: false

existing_project:
  verified_project_pin_required_for_degraded_mode: true
  verified_local_methodology_cache_allowed: true

degraded_allowed:
  - READ_ONLY_ANALYSIS
  - PLANNING
  - LOCAL_DOCUMENTATION
  - LOCAL_TESTS
  - REVERSIBLE_LOCAL_CODE_CHANGE
  - LOCAL_COMMIT

degraded_blocked:
  - MERGE
  - DEPLOY
  - RELEASE
  - PUBLICATION
  - FINAL_INTEGRATION
  - METHODOLOGY_UPGRADE
  - AUTHORITY_CHANGE
  - TERMINAL_INDEPENDENT_REVIEW
  - MATERIAL_EXTERNAL_EFFECT_WITHOUT_REMOTE_EVIDENCE

canonical_conflict:
  state: CANONICAL_CONFLICT_BLOCKED
  result: FAIL_CLOSED

remote_recovery:
  canonical_revalidation_required: true
  checkpoint_debt_reconciliation_required: true
  degraded_operation_receipt_required: true

human_authority:
  may_choose_policy_or_identified_version: true
  may_substitute_missing_technical_evidence: false
```

### Estados operacionais aprovados

```yaml
MCF_OPERATION_STATE:
  - NOT_ACTIVE
  - ACTIVATING
  - ACTIVE
  - ACTIVE_DEGRADED_VERIFIED
  - ACTIVATING_BLOCKED
  - CANONICAL_CONFLICT_BLOCKED
```

### Princípios resultantes

```text
UNAVAILABLE != INCONSISTENT
LOCAL_COPY != VERIFIED_LOCAL_COPY
CACHE_CAN_PROVE_IDENTITY != CACHE_CAN_PROVE_CURRENT_STABLE
HUMAN_AUTHORITY != TECHNICAL_EVIDENCE
```

- indisponibilidade pode permitir `ACTIVE_DEGRADED_VERIFIED` apenas quando metodologia/project pin local já estejam verificáveis;
- inconsistência entre fontes não pode ser resolvida silenciosamente e deve bloquear operação governada;
- projeto novo sem bootstrap verificável não se torna `ACTIVE`; conversa preparatória pode continuar fora do estado formal do MCF;
- operação degradada limita-se a trabalho local reversível e sem efeito material;
- GitHub/remote restaurado exige revalidação, comparação com estado local, quitação de `CHECKPOINT_DEBT` e reconciliação antes do retorno a `ACTIVE` normal;
- cache local pode provar a identidade da versão armazenada, mas não afirmar sozinho qual é a `CURRENT_STABLE`;
- LEANDRO mantém autoridade sobre escolhas humanas/políticas, mas não substitui prova técnica ausente por declaração.

### Evidência de operação degradada

Após reconciliação, a especificação futura deverá registrar um `Degraded Operation Receipt` com período degradado, causa, methodology SHA, baseline, ações locais, efeitos materiais, checkpoint debt, reconciliação e checkpoint remoto final.

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
