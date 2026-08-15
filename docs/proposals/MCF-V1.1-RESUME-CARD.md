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
questions_completed: 5
questions_remaining: 15
last_completed_question: 5
next_question: 6
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Não repetir Q1–Q5 salvo solicitação explícita de LEANDRO.**

## Decisões aprovadas

### Q1 — `HYBRID_INTENT_AND_EXPLICIT_ACTIVATION`
Chat normal fora do MCF; comando explícito ou intenção clara inicia `ACTIVATING`; `ACTIVE` exige bootstrap/fonte verificáveis.

### Q2 — `LOCAL_FIRST_REMOTE_CHECKPOINTED`
`CHATGPT_REMOTE` opera por conectores/ferramentas remotas; `CODEX_LOCAL` usa workspace/terminal/Git local; GitHub é memória institucional/checkpoint/CI/revisão/integração; checkpoints remotos em boundaries semânticos/de risco.

### Q3 — `VERIFIED_TWO_STAGE_BOOTSTRAP`
Resolver `VALID_PROJECT_PIN > EXPLICIT_LEANDRO_SELECTION > CURRENT_STABLE`, carregar metodologia por tag/SHA imutável, sem silent mid-mission upgrade.

### Q4 — `VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES`
Operação degradada apenas sobre base local verificável e trabalho reversível; inconsistência canônica bloqueia; efeitos materiais/governados permanecem fail-closed.

### Q5 — `THREE_CANONICAL_ENTRY_MODES_WITH_RECOVERY_ROUTE`

```yaml
PROJECT_ENTRY_MODE:
  - NEW_PROJECT
  - ADOPT_EXISTING_PROJECT
  - RESUME_MCF_PROJECT
RECOVERY_ROUTE:
  - RECOVER_MCF_PROJECT
```

- `NEW_PROJECT`: não existe implementação material a preservar;
- `ADOPT_EXISTING_PROJECT`: existe projeto, mas sem continuidade MCF verificável;
- `RESUME_MCF_PROJECT`: projeto com continuidade MCF verificável;
- `RECOVER_MCF_PROJECT`: rota excepcional quando um projeto previamente MCF possui continuidade quebrada, divergente ou não verificável.

Classificação:

```text
HUMAN_INTENT + MACHINE_EVIDENCE = ENTRY_CLASSIFICATION
ADOPT != RECOVER
RESUME_REQUIRES_VERIFIED_CONTINUITY
```

LEANDRO fala naturalmente; MESTRE classifica. Se houver ambiguidade real: `PROJECT_ENTRY_CLASSIFICATION_UNRESOLVED` e execução permanece `NO_GO` até resolução.

## Ordem de leitura

1. GitHub live;
2. este Resume Card;
3. `MCF-V1.1-DISCOVERY-CHECKPOINT-005.md`;
4. `MCF-V1.1-QUESTIONNAIRE-ROADMAP-001.md`;
5. `MCF-V1.1-DECISION-LEDGER-001.md`;
6. `MCF-V1.1-DISCOVERY-CHARTER-001.md`.

## Política de continuidade

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

> **Q6 — Como deve funcionar a entrada de um projeto novo (`NEW_PROJECT`)?**

## Comando mínimo de retomada

> `Mestre, retome a Discovery da v1.1 pelo Resume Card e checkpoint mais recente. Continue do ponto exato.`
