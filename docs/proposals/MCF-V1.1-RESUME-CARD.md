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
questions_completed: 7
questions_remaining: 13
last_completed_question: 7
next_question: 8
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Não repetir Q1–Q7 salvo solicitação explícita de LEANDRO.**

## Decisões aprovadas

### Q1 — `HYBRID_INTENT_AND_EXPLICIT_ACTIVATION`
Chat normal fora do MCF; comando explícito ou intenção clara inicia `ACTIVATING`; `ACTIVE` exige bootstrap/fonte verificáveis.

### Q2 — `LOCAL_FIRST_REMOTE_CHECKPOINTED`
Mesma metodologia em hosts diferentes; ChatGPT remoto por conectores, Codex local por workspace/terminal/Git; checkpoints remotos em boundaries semânticos/de risco.

### Q3 — `VERIFIED_TWO_STAGE_BOOTSTRAP`
Resolver `VALID_PROJECT_PIN > EXPLICIT_LEANDRO_SELECTION > CURRENT_STABLE`, carregar por tag/SHA imutável e impedir silent mid-mission upgrade.

### Q4 — `VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES`
Operação degradada apenas sobre base local verificável e trabalho reversível; inconsistência canônica bloqueia; autoridade humana não substitui evidência técnica.

### Q5 — `THREE_CANONICAL_ENTRY_MODES_WITH_RECOVERY_ROUTE`

```yaml
PROJECT_ENTRY_MODE:
  - NEW_PROJECT
  - ADOPT_EXISTING_PROJECT
  - RESUME_MCF_PROJECT
RECOVERY_ROUTE:
  - RECOVER_MCF_PROJECT
```

### Q6 — `PROGRESSIVE_DURABLE_PROJECT_GENESIS`

```text
VERIFIED ACTIVATION
→ IDEA_CAPTURE
→ MINI-TRIAGE
→ PROJECT_GENESIS
→ PROJECT HOME / REPO
→ METHODOLOGY PIN
→ DURABLE INTAKE CHECKPOINT
→ HUMAN INTENT DISCOVERY
→ INTENT READINESS
→ PROJECT INTENT PACKAGE
→ LEANDRO CONFIRMS
→ INTENT ALIGNMENT GATE
→ MCF-START-MISSION
```

### Q7 — `EVIDENCE_FIRST_EXISTING_PROJECT_RECONNAISSANCE`

```text
LEANDRO: "Assuma este projeto"
→ ADOPT_EXISTING_PROJECT (provisional)
→ freeze baseline exato
→ READ_ONLY reconnaissance
→ classificar fatos/inferências/unknowns/conflitos
→ detectar continuidade MCF
   → RESUME se válida
   → RECOVER se quebrada/não verificável
   → ADOPT se realmente externo ao MCF
→ reconstruir AS-IS
→ PROJECT REALITY REPORT
→ REALITY READ-BACK
→ LEANDRO confirma/corrige
→ Human Intent Discovery profunda
```

Estados de evidência aprovados:

```yaml
- VERIFIED_FACT
- OBSERVED_FACT
- INFERRED
- UNKNOWN
- CONFLICTING
- STALE_SUSPECTED
```

Princípios:

```text
READ_ONLY_FIRST
AS_IS != TO_BE
FACT != INFERENCE
DOCUMENTATION != AUTOMATICALLY_REALITY
MACHINE_DISCOVERS_TECHNICAL_FACTS
HUMAN_EXPLAINS_INTENT
```

Antes da confirmação de realidade, mutação do projeto alvo é `NO_GO`. Methodology pin só é escrito no projeto após compromisso de adoção. Implementação permanece `NO_GO` até `INTENT_ALIGNMENT_GATE = PASS`.

## Ordem de leitura

1. GitHub live;
2. este Resume Card;
3. `MCF-V1.1-DISCOVERY-CHECKPOINT-007.md`;
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

> **Q8 — Quais dimensões de intenção humana são obrigatórias?**

## Comando mínimo de retomada

> `Mestre, retome a Discovery da v1.1 pelo Resume Card e checkpoint mais recente. Continue do ponto exato.`
