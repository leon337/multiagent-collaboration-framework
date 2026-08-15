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

**Não repetir Q1–Q3 salvo solicitação explícita de LEANDRO.**

## Q1 — decisão aprovada

`HYBRID_INTENT_AND_EXPLICIT_ACTIVATION` — Opção D.

## Q2 — decisão aprovada

`LOCAL_FIRST_REMOTE_CHECKPOINTED` — Opção D.

```text
MCF_METHOD != EXECUTION_HOST
EDIT != COMMIT != PUSH != PR
LOCAL_UNCHECKPOINTED != REMOTE_CHECKPOINTED
```

- `CHATGPT_REMOTE` → conectores e ferramentas remotas;
- `CODEX_LOCAL` → workspace, terminal e Git local;
- GitHub → memória institucional, checkpoint, colaboração, CI, revisão e integração;
- checkpoints remotos em boundaries semânticos/de risco;
- `CHECKPOINT_DEBT` permitido apenas para trabalho local reversível de baixo risco quando remoto indisponível;
- boundary material/governado → `FAIL_CLOSED` sem evidência remota aplicável.

## Q3 — decisão aprovada

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

`ACTIVE` só pode ocorrer depois que repositório, versão, referência imutável e bootstrap forem resolvidos/verificados.

## Ordem de leitura

1. GitHub live;
2. este Resume Card;
3. `MCF-V1.1-DISCOVERY-CHECKPOINT-003.md`;
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

> **Q4 — Como deve funcionar o fail-closed quando GitHub/bootstrap/fonte canônica não estiver acessível ou verificável?**

## Comando mínimo de retomada

> `Mestre, retome a Discovery da v1.1 pelo Resume Card e checkpoint mais recente. Continue do ponto exato.`
