# MCF v1.1 — Resume Card

**USE ESTE ARQUIVO PRIMEIRO AO RETOMAR ESTA DISCOVERY EM OUTRO CHAT.**

## Identidade

- Projeto: MCF — Multiagent Collaboration Framework
- Repositório: `leon337/multiagent-collaboration-framework`
- Humano / autoridade final: **LEANDRO**
- Orquestrador: **MESTRE**
- LÉO é agente distinto de LEANDRO
- Branch da Discovery v1.1: `planning/mcf-v1.1-discovery`

## Baseline preservado

```yaml
v1_0_0: PUBLISHED_STABLE
baseline_main_at_discovery_start: b91823a947715e09d69c72999e2278523f2259be
v1_0_mutation_by_discovery: NONE
nextgen_round_1_mutation: NONE
```

## Estado da Discovery

```yaml
target_version: v1.1.0
status: ACTIVE_DISCOVERY
total_questions: 20
questions_completed: 1
questions_remaining: 19
last_completed_question: 1
next_question: 2
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Não repetir Q1 salvo solicitação explícita de LEANDRO.**

## Q1 — decisão aprovada

`HYBRID_INTENT_AND_EXPLICIT_ACTIVATION` — Opção D.

- Chat normal fora do MCF;
- comando explícito pode iniciar ativação;
- intenção clara de projeto pode iniciar ativação;
- `ACTIVATING != ACTIVE`;
- `ACTIVE` exige bootstrap/metodologia/fonte de verdade verificável.

## Input pendente para Q2

`CODEX_LOCAL_FIRST_EXECUTION` foi registrado como `DISCOVERY_INPUT`, não como decisão.

Hipótese candidata:

```text
MCF METHOD / GOVERNANCE
      ↓
Execution environment específico
  ↙                    ↘
ChatGPT              Codex
remote/connectors     local terminal/workspace/git
  └────────────┬────────────┘
               ↓
        GitHub checkpoints
```

Nome candidato: `LOCAL_FIRST_REMOTE_CHECKPOINTED`.

Q2 deve decidir se esse modelo é aprovado e em quais boundaries o Codex deve commit/push/checkpoint/abrir PR.

## Ordem de leitura

1. GitHub live;
2. este Resume Card;
3. `MCF-V1.1-DISCOVERY-CHECKPOINT-001.md`;
4. `MCF-V1.1-QUESTIONNAIRE-ROADMAP-001.md`;
5. `MCF-V1.1-DECISION-LEDGER-001.md`;
6. `MCF-V1.1-DISCOVERY-CHARTER-001.md`.

## Política de continuidade

Para cada nova pergunta aprovada:

```text
LEANDRO DECIDE
   ↓
Decision Ledger
   ↓
Checkpoint
   ↓
Resume Card
   ↓
Roadmap
   ↓
NEXT QUESTION
```

Assim, se a sessão parar após Q5, o estado durável deve registrar Q1–Q5 como concluídas e Q6 como próxima.

## Próxima ação

> **Q2 — Como o MCF deve operar em diferentes ambientes de execução, especialmente ChatGPT remoto e Codex local-first?**

## Comando mínimo de retomada

> `Mestre, retome a Discovery da v1.1 pelo Resume Card e checkpoint mais recente. Continue do ponto exato.`
