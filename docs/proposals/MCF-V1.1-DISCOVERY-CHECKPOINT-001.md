# MCF v1.1 — Discovery Checkpoint 001

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-001`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 1
questions_remaining: 19
last_completed_question: 1
next_question: 2
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
release_authorized: false
```

**Instrução:** NÃO repetir Q1 salvo solicitação explícita de LEANDRO. Retomar em Q2.

---

## 2. Decisão Q1

LEANDRO escolheu **Opção D — ativação híbrida**.

```yaml
activation_contract: HYBRID_INTENT_AND_EXPLICIT_ACTIVATION
normal_chat_outside_mcf: true
explicit_activation: true
intent_detection_activation: true
active_requires_verified_bootstrap: true
```

Fluxo:

```text
CHAT NORMAL
   ↓
comando explícito OU intenção clara de projeto
   ↓
MCF ACTIVATING
   ↓
verificação do bootstrap/metodologia/fonte de verdade
   ↓
MCF ACTIVE
```

---

## 3. Novo input surgido antes da Q2

LEANDRO introduziu uma melhoria ainda não decidida:

> Quando o MCF for usado dentro do Codex, aproveitar terminal e workspace local para executar o desenvolvimento diretamente no repositório local, evitando usar o GitHub como intermediário de cada edição; sincronizar com o GitHub em etapas/checkpoints apropriados.

Classificação:

```yaml
input: CODEX_LOCAL_FIRST_EXECUTION
status: DISCOVERY_INPUT_PENDING_DECISION
mapped_question: Q2
```

Refinamento preliminar do MESTRE, ainda não aprovado:

```yaml
candidate_model: LOCAL_FIRST_REMOTE_CHECKPOINTED
avoid:
  - GITHUB_EVERY_EDIT
  - LOCAL_ONLY_UNTIL_FINISHED
```

A hipótese é que o **MCF Method/Governance permaneça único**, enquanto o plano de trabalho varia conforme o ambiente:

- ChatGPT: connectors/serviços remotos e GitHub como principal superfície técnica disponível;
- Codex: terminal/workspace/git local como execution plane;
- GitHub: persistência institucional, colaboração, checkpoints, revisão, CI e entrega remota.

Q2 deve decidir frequência e boundaries de commits, push, PR, checkpoint remoto, pausa, HUMAN_GATE e revisão.

---

## 4. Artefatos criados nesta Discovery

```text
docs/proposals/MCF-V1.1-DISCOVERY-CHARTER-001.md
docs/proposals/MCF-V1.1-QUESTIONNAIRE-ROADMAP-001.md
docs/proposals/MCF-V1.1-DECISION-LEDGER-001.md
docs/proposals/MCF-V1.1-DISCOVERY-CHECKPOINT-001.md
docs/proposals/MCF-V1.1-RESUME-CARD.md  # criado no mesmo ciclo de inicialização
```

---

## 5. Próxima pergunta

> **Q2 — Como o MCF deve operar em diferentes ambientes de execução, especialmente ChatGPT remoto e Codex local-first?**

Não decidir implementação durante Q2. A pergunta é arquitetural/metodológica.
