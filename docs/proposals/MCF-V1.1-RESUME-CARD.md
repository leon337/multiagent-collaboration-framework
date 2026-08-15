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

**Não repetir Q1 ou Q2 salvo solicitação explícita de LEANDRO.**

## Q1 — decisão aprovada

`HYBRID_INTENT_AND_EXPLICIT_ACTIVATION` — Opção D.

- Chat normal fora do MCF;
- comando explícito pode iniciar ativação;
- intenção clara de projeto pode iniciar ativação;
- `ACTIVATING != ACTIVE`;
- `ACTIVE` exige bootstrap/metodologia/fonte de verdade verificável.

## Q2 — decisão aprovada

`LOCAL_FIRST_REMOTE_CHECKPOINTED` — Opção D.

Princípios:

```text
MCF_METHOD != EXECUTION_HOST
EDIT != COMMIT != PUSH != PR
LOCAL_UNCHECKPOINTED != REMOTE_CHECKPOINTED
```

### Modos suportados no escopo atual da v1.1

```yaml
CHATGPT_REMOTE:
  execution_plane: CONNECTORS_AND_REMOTE_TOOLS

CODEX_LOCAL:
  execution_plane: LOCAL_WORKSPACE_TERMINAL_AND_GIT
  exact_remote_baseline_required: true
  isolated_branch_or_worktree: true
  local_commits_allowed: true
  push_every_edit: false
  remote_checkpoint_required: true
```

### Checkpoint remoto obrigatório em

- fase/submissão concluída;
- pausa longa/fim de sessão;
- antes de HUMAN_GATE;
- antes de revisão independente;
- validação material concluída;
- antes de boundary de alto risco;
- handoff para outro agente;
- candidato de integração.

PR não é necessário a cada checkpoint; é requerido no boundary de integração/revisão aplicável.

Se o remoto estiver indisponível:

```yaml
low_risk_reversible_local_work: CONTINUE_WITH_CHECKPOINT_DEBT
material_or_governed_boundary: FAIL_CLOSED
```

## Ordem de leitura

1. GitHub live;
2. este Resume Card;
3. `MCF-V1.1-DISCOVERY-CHECKPOINT-002.md`;
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
novo Checkpoint
   ↓
Resume Card
   ↓
Roadmap
   ↓
NEXT QUESTION
```

## Próxima ação

> **Q3 — Como o bootstrap do MCF encontra e verifica a versão/metodologia vigente?**

## Comando mínimo de retomada

> `Mestre, retome a Discovery da v1.1 pelo Resume Card e checkpoint mais recente. Continue do ponto exato.`
