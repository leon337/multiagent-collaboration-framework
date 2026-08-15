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
questions_completed: 11
questions_remaining: 9
last_completed_question: 11
next_question: 12
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: COMPLETED_APPROVED_BY_LEANDRO
Q9: COMPLETED_APPROVED_BY_LEANDRO
Q10: COMPLETED_APPROVED_BY_LEANDRO
Q11: COMPLETED_APPROVED_BY_LEANDRO
Q12: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Não repetir Q1–Q11 salvo solicitação explícita de LEANDRO.**

## Decisões aprovadas

### Q1 — `HYBRID_INTENT_AND_EXPLICIT_ACTIVATION`
Chat normal fora do MCF; ativação exige bootstrap/fonte verificáveis.

### Q2 — `LOCAL_FIRST_REMOTE_CHECKPOINTED`
Mesma metodologia em hosts diferentes; checkpoints remotos em boundaries semânticos/de risco.

### Q3 — `VERIFIED_TWO_STAGE_BOOTSTRAP`
Pin/seleção explícita/stable; metodologia por tag/SHA imutável; sem silent mid-mission upgrade.

### Q4 — `VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES`
Operação degradada somente sobre base verificável e trabalho reversível; boundary material/governado permanece fail-closed.

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
ADOPT provisional
→ exact baseline
→ READ_ONLY reconnaissance
→ evidence classification
→ RESUME / RECOVER / ADOPT
→ AS-IS
→ PROJECT REALITY REPORT
→ REALITY READ-BACK
→ LEANDRO confirma/corrige
→ Human Intent Discovery
```

### Q8 — `CANONICAL_INTENT_DIMENSIONS_WITH_EVIDENCE_AWARE_RESOLUTION`
20 dimensões canônicas; estados `CLEAR`, `PARTIAL`, `UNKNOWN`, `CONFLICTING`, `NOT_APPLICABLE`; dimensão obrigatória não significa pergunta fixa. Evidência reduz perguntas, mas não inventa preferências humanas. Engenharia decide `HOW`.

### Q9 — `EVIDENCE_AWARE_ADAPTIVE_QUESTIONING_WITH_INFORMATION_GAIN`

```text
QUESTION
→ ANSWER
→ UPDATE ALL AFFECTED DIMENSIONS
→ CHECK CONTRADICTIONS
→ REASSESS PRIORITIES
→ NEXT BEST QUESTION
```

Sem sequência/quantidade fixa; prioridade para conflito, blocker, ganho informacional, risco e dependency unlock; dimensão `CLEAR` não reabre sem causa; follow-up exige valor; loops de baixo ganho proibidos; delegação técnica é resolução válida.

### Q10 — `EVENT_DRIVEN_PROGRESSIVE_SEMANTIC_READBACK`

```text
ADAPTIVE QUESTIONING
→ EVENT/CADENCE TRIGGER
→ PROGRESSIVE READ-BACK
→ LEANDRO CONFIRMS / CORRECTS / REJECTS
→ UPDATE AFFECTED DIMENSIONS
→ INVALIDATE WRONG DERIVATIONS
→ CONTINUE
```

Três níveis: `MICRO_CLARIFICATION`, `PROGRESSIVE_READBACK`, `FINAL_INTENT_READBACK`; read-back orientado por eventos com safety cadence aproximada de 4–6 trocas significativas; correções propagam para dependências; final read-back obrigatório antes do Alignment Gate.

### Q11 — `SEMANTIC_READINESS_GATE_WITH_BLOCKING_UNKNOWNS`

```yaml
readiness_is:
  semantic: true
  question_count_based: false
  pure_score_based: false

readiness_impact:
  - BLOCKING
  - NON_BLOCKING

universal_intent_core:
  - PROBLEM
  - DESIRED_OUTCOME
  - TARGET_USERS
  - CRITICAL_USER_JOURNEYS
  - MUST_HAVE
  - NON_GOALS
  - PRIORITIES_AND_TRADEOFFS
  - DEFINITION_OF_DONE

conditionally_critical_dimensions:
  determined_by:
    - DOMAIN
    - RISK
    - DATA_SENSITIVITY
    - EXTERNAL_EFFECTS
    - CRITICAL_JOURNEYS
    - HUMAN_CONSTRAINTS

global_states:
  - NOT_READY
  - CONDITIONALLY_READY
  - READY_FOR_ALIGNMENT

ready_for_alignment_requires:
  blocking_unknowns: 0
  material_human_intent_conflicts: 0
  unresolved_high_impact_interpretations: 0
  semantic_coherence: true
  nonblocking_unknowns_preserved: true
  technical_delegations_explicit: true
```

Regras centrais:

```text
QUESTION_COUNT != CONTEXT_SUFFICIENCY
INTENT_SUFFICIENTLY_UNDERSTOOD != ALL_DETAILS_KNOWN
DIMENSION_STATE != READINESS_IMPACT
HIGH_SCORE_DOES_NOT_CANCEL_SEMANTIC_BLOCKER
DELEGATED_TECHNICAL_DETAIL != MISSING_HUMAN_INTENT
NOT_APPLICABLE = RESOLVED_WHEN_JUSTIFIED
READY_FOR_ALIGNMENT != IMPLEMENTATION_AUTHORIZED
```

`BLOCKING_UNKNOWN` é incerteza que pode alterar materialmente produto, escopo, usuários, segurança, arquitetura, custo, risco ou sucesso. `PARTIAL/UNKNOWN` podem permanecer se não bloqueantes. `CONDITIONALLY_READY` não atravessa automaticamente o `INTENT_ALIGNMENT_GATE`. Readiness é recalculada após mudança material.

## Ordem de leitura

1. GitHub live;
2. este Resume Card;
3. `MCF-V1.1-DISCOVERY-CHECKPOINT-011.md`;
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

> **Q12 — Qual é o contrato do Project Intent Package?**

## Comando mínimo de retomada

> `Mestre, retome a Discovery da v1.1 pelo Resume Card e checkpoint mais recente. Continue do ponto exato.`
