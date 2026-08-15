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

### Problema

Decidir como um chat novo reconhece quando deve operar pela metodologia MCF sem transformar toda conversa comum em missão MCF.

### Alternativas consideradas

- A — MCF sempre ativo;
- B — ativação somente por comando explícito;
- C — ativação somente por detecção de intenção;
- D — híbrida: comando explícito + detecção de intenção, seguida de bootstrap verificável.

### Decisão de LEANDRO

**Opção D.**

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

A ativação por intenção não equivale automaticamente a afirmar que o MCF foi carregado. O estado `ACTIVE` exige bootstrap/fonte de verdade verificável segundo a futura decisão das Q3/Q4.

### Consequências

- conversas comuns permanecem fora do MCF;
- `Mestre`, `Ative o MCF`, `Assuma este projeto` e equivalentes podem iniciar ativação explícita;
- intenção clara de criar/retomar/assumir projeto pode iniciar ativação contextual;
- a metodologia completa não deve ficar duplicada em uma instrução global estática;
- detalhes de bootstrap ainda dependem de Q3/Q4.

---

## V11-Q02 — Execution Environment Contract

```yaml
decision_id: V11-Q02
question: Q2
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: LOCAL_FIRST_REMOTE_CHECKPOINTED
```

### Problema

Decidir como a mesma metodologia/governança do MCF deve operar em ambientes com capacidades diferentes, especialmente ChatGPT remoto e Codex com terminal/workspace local, sem sacrificar velocidade nem continuidade durável.

### Alternativas consideradas

- A — `GITHUB_CENTRIC_EVERYWHERE`: sincronizar quase toda alteração no GitHub;
- B — `LOCAL_UNTIL_FINISHED`: trabalhar localmente até o produto estar pronto;
- C — `LOCAL_FIRST_TIME_BASED_CHECKPOINTS`: checkpoints remotos por intervalo de tempo;
- D — `LOCAL_FIRST_REMOTE_CHECKPOINTED`: execução local por padrão, com checkpoints remotos em boundaries semânticos e de risco.

### Decisão de LEANDRO

**Opção D.**

### Contrato conceitual aprovado

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
EDIT != COMMIT != PUSH != PR
```

- `COMMIT_LOCAL`: organiza e protege trabalho no workspace local;
- `PUSH/CHECKPOINT_REMOTO`: torna o estado durável fora do host local;
- `PR`: boundary de integração/revisão, não obrigatório a cada checkpoint.

### Princípios resultantes

- `MCF_METHOD != EXECUTION_HOST`;
- a governança, autoridade, gates, evidência e contrato de missão permanecem invariantes entre hosts;
- o plano de execução pode variar conforme as capacidades do ambiente;
- GitHub não precisa intermediar cada edição do Codex;
- GitHub permanece memória institucional, superfície de colaboração, checkpoints, CI, revisão e integração;
- trabalho local não sincronizado deve ser distinguido de estado remoto durável;
- `LOCAL_UNCHECKPOINTED != REMOTE_CHECKPOINTED`;
- indisponibilidade remota não autoriza atravessar HUMAN_GATE, review, deploy, merge, publicação ou outro boundary material sem evidência remota aplicável.

### Consequências para especificação futura

A v1.1 deverá permitir que o runtime/protocolo reconheça o ambiente de execução sem duplicar a metodologia. A implementação concreta de adapters/host contracts permanece fora desta decisão de Discovery.

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
