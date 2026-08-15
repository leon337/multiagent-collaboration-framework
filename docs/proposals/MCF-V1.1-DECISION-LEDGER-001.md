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

## DISCOVERY-INPUT-001 — Codex Local-First

```yaml
input_id: DISCOVERY-INPUT-001
source: LEANDRO
status: PENDING_DECISION
mapped_question: Q2
not_a_decision: true
```

### Insight registrado

Quando o MCF for invocado dentro do Codex, o Codex já possui terminal e workspace local. Em vez de realizar cada alteração através do GitHub como superfície de execução, ele pode trabalhar diretamente em um repositório/local workspace, produzir código, executar testes e criar commits localmente com maior velocidade, sincronizando com o GitHub em boundaries/checkpoints apropriados.

### Refinamento preliminar do MESTRE — ainda não aprovado

Candidato de arquitetura:

```text
MCF METHOD / GOVERNANCE
          ↓
EXECUTION ENVIRONMENT ADAPTER
      ↙                 ↘
CHATGPT_REMOTE       CODEX_LOCAL
      ↓                 ↓
connectors/services   terminal/workspace/git
      └────────┬────────┘
               ↓
        DURABLE CHECKPOINTS
               ↓
             GITHUB
```

Nome candidato: `LOCAL_FIRST_REMOTE_CHECKPOINTED`.

A hipótese evita tanto `GITHUB_EVERY_EDIT` quanto `LOCAL_ONLY_UNTIL_FINISHED`. A frequência e os boundaries de push/checkpoint serão decididos na Q2.
