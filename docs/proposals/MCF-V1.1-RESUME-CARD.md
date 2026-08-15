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
questions_completed: 8
questions_remaining: 12
last_completed_question: 8
next_question: 9
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: COMPLETED_APPROVED_BY_LEANDRO
Q9: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Não repetir Q1–Q8 salvo solicitação explícita de LEANDRO.**

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

### Q8 — `CANONICAL_INTENT_DIMENSIONS_WITH_EVIDENCE_AWARE_RESOLUTION`

```yaml
canonical_dimension_count: 20
fixed_question_count_required: false

dimensions:
  - PROBLEM
  - MOTIVATION
  - DESIRED_OUTCOME
  - TARGET_USERS
  - CRITICAL_USER_JOURNEYS
  - MUST_HAVE
  - SHOULD_HAVE
  - NON_GOALS
  - PRIORITIES_AND_TRADEOFFS
  - BUSINESS_RULES
  - DATA_AND_SENSITIVITY
  - ROLES_AND_PERMISSIONS
  - AUTOMATION_LEVEL
  - INTEGRATIONS
  - PLATFORM_AND_USAGE_CONTEXT
  - COST_AND_RESOURCE_CONSTRAINTS
  - QUALITY_EXPECTATIONS
  - FAILURE_TOLERANCE
  - DEFINITION_OF_DONE
  - FUTURE_VISION

dimension_states:
  - CLEAR
  - PARTIAL
  - UNKNOWN
  - CONFLICTING
  - NOT_APPLICABLE
```

Regras centrais:

```text
DIMENSION_REQUIRED != QUESTION_REQUIRED
UNKNOWN != NOT_APPLICABLE
UNKNOWN != HUMAN_HAS_NO_PREFERENCE
MACHINE_EVIDENCE_CAN_SUPPLY_FACTS
MACHINE_EVIDENCE_CANNOT_INVENT_HUMAN_PREFERENCES
TEAM_ENGINEERING_DECIDES_HOW
```

Cada dimensão precisa ser compreendida ou explicitamente resolvida. `Não sei` e delegação técnica à equipe são respostas legítimas quando apropriadas; não exigem que LEANDRO possua conhecimento técnico.

## Ordem de leitura

1. GitHub live;
2. este Resume Card;
3. `MCF-V1.1-DISCOVERY-CHECKPOINT-008.md`;
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

> **Q9 — Como perguntas adaptativas devem evitar interrogatório rígido e perguntas já respondidas por evidência?**

## Comando mínimo de retomada

> `Mestre, retome a Discovery da v1.1 pelo Resume Card e checkpoint mais recente. Continue do ponto exato.`
