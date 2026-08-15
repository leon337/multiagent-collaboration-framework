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
questions_completed: 14
questions_remaining: 6
last_completed_question: 14
next_question: 15
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
Q12: COMPLETED_APPROVED_BY_LEANDRO
Q13: COMPLETED_APPROVED_BY_LEANDRO
Q14: COMPLETED_APPROVED_BY_LEANDRO
Q15: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Não repetir Q1–Q14 salvo solicitação explícita de LEANDRO.**

A continuidade canônica da Discovery está agora neste Resume Card + `MCF-V1.1-DISCOVERY-CHECKPOINT-014.md`. Qualquer retomada deve consultar GitHub live antes de afirmar estado atual.

## Preferência de apresentação de LEANDRO

Ao apresentar alternativas decisórias, MESTRE deve marcar sua recomendação com **⭐** na lista final. A estrela é somente recomendação visual; a decisão continua pertencendo exclusivamente a LEANDRO.

## Decisões aprovadas

```yaml
Q1: HYBRID_INTENT_AND_EXPLICIT_ACTIVATION
Q2: LOCAL_FIRST_REMOTE_CHECKPOINTED
Q3: VERIFIED_TWO_STAGE_BOOTSTRAP
Q4: VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES
Q5: THREE_CANONICAL_ENTRY_MODES_WITH_RECOVERY_ROUTE
Q6: PROGRESSIVE_DURABLE_PROJECT_GENESIS
Q7: EVIDENCE_FIRST_EXISTING_PROJECT_RECONNAISSANCE
Q8: CANONICAL_INTENT_DIMENSIONS_WITH_EVIDENCE_AWARE_RESOLUTION
Q9: EVIDENCE_AWARE_ADAPTIVE_QUESTIONING_WITH_INFORMATION_GAIN
Q10: EVENT_DRIVEN_PROGRESSIVE_SEMANTIC_READBACK
Q11: SEMANTIC_READINESS_GATE_WITH_BLOCKING_UNKNOWNS
Q12: VERSIONED_PROVENANCE_AWARE_PROJECT_INTENT_PACKAGE
Q13: EVIDENCE_BOUND_CONDITIONAL_EXISTING_PROJECT_ARTIFACT_PIPELINE
Q14: LAYERED_AUTHORITY_WITH_REBUILDABLE_PROJECT_VIEWS
```

## Síntese operacional Q6–Q14

```text
VERIFIED ACTIVATION
→ PROJECT ENTRY CLASSIFICATION
→ NEW: PROJECT GENESIS
   OR
  ADOPT: READ_ONLY RECONNAISSANCE + PROJECT REALITY REPORT + REALITY CONFIRMATION
   OR
  RESUME/RECOVER: VERIFIED CONTINUITY OR RECONCILIATION FIRST
→ HUMAN INTENT DISCOVERY
→ 20 CANONICAL INTENT DIMENSIONS
→ EVIDENCE-AWARE ADAPTIVE QUESTIONING
→ EVENT-DRIVEN PROGRESSIVE READ-BACK
→ SEMANTIC READINESS GATE
→ VERSIONED PROJECT INTENT PACKAGE
→ FINAL INTENT READ-BACK
→ LEANDRO CONFIRMS
→ INTENT ALIGNMENT GATE
→ AS-IS / TO-BE GAP MAP, quando aplicável
→ COMPLETION / RECOVERY PLAN, quando gap material exigir
→ MCF-START-MISSION
```

### Q8 — 20 dimensões

`PROBLEM`, `MOTIVATION`, `DESIRED_OUTCOME`, `TARGET_USERS`, `CRITICAL_USER_JOURNEYS`, `MUST_HAVE`, `SHOULD_HAVE`, `NON_GOALS`, `PRIORITIES_AND_TRADEOFFS`, `BUSINESS_RULES`, `DATA_AND_SENSITIVITY`, `ROLES_AND_PERMISSIONS`, `AUTOMATION_LEVEL`, `INTEGRATIONS`, `PLATFORM_AND_USAGE_CONTEXT`, `COST_AND_RESOURCE_CONSTRAINTS`, `QUALITY_EXPECTATIONS`, `FAILURE_TOLERANCE`, `DEFINITION_OF_DONE`, `FUTURE_VISION`.

Estados: `CLEAR`, `PARTIAL`, `UNKNOWN`, `CONFLICTING`, `NOT_APPLICABLE`.

### Q9 — perguntas adaptativas

```text
QUESTION
→ ANSWER
→ UPDATE ALL AFFECTED DIMENSIONS
→ CHECK CONTRADICTIONS
→ REASSESS PRIORITIES
→ NEXT BEST QUESTION
```

Sem sequência/quantidade fixa; follow-up exige ganho de informação; dimensão `CLEAR` não reabre sem causa; evidência reduz perguntas sem substituir intenção humana; loops de baixo ganho são proibidos.

### Q10 — read-back progressivo

Três níveis: `MICRO_CLARIFICATION`, `PROGRESSIVE_READBACK`, `FINAL_INTENT_READBACK`. Read-back funciona como checksum semântico. Correções invalidam derivações erradas e recalculam dimensões dependentes. Confirmação progressiva não equivale ao Alignment Gate.

### Q11 — readiness

```yaml
states:
  - NOT_READY
  - CONDITIONALLY_READY
  - READY_FOR_ALIGNMENT
```

Readiness é semântica, não contagem de perguntas nem score puro. `BLOCKING_UNKNOWN` é incerteza capaz de alterar materialmente produto, escopo, usuários, segurança, arquitetura, custo, risco ou sucesso. `READY_FOR_ALIGNMENT != IMPLEMENTATION_AUTHORIZED`.

### Q12 — Project Intent Package

```yaml
canonical_name: VERSIONED_PROVENANCE_AWARE_PROJECT_INTENT_PACKAGE
core_sections:
  - IDENTITY
  - ORIGINAL_INTENT
  - CURRENT_INTENT_DIMENSIONS
  - HUMAN_DECISIONS
  - TECHNICAL_DELEGATIONS
  - ASSUMPTIONS
  - UNKNOWNS
  - BLOCKERS
  - CONFLICTS
  - READINESS
  - ALIGNMENT
lifecycle:
  - DISCOVERY_IN_PROGRESS
  - READY_FOR_ALIGNMENT
  - ALIGNED
  - REOPENED_AFTER_MATERIAL_CHANGE
```

Regras centrais:

```text
PIP != CHAT_LOG
PIP != ARCHITECTURE
PIP != BACKLOG
PIP != MISSION_CONTRACT
RAW_INTENT != SYNTHESIS
SYNTHESIS != HUMAN_DECISION
INFERENCE != HUMAN_INTENT
ASSUMPTION != RESOLUTION
OLD_HUMAN_DECISION -> SUPERSEDED
NEW_HUMAN_DECISION -> CURRENT
ALIGNMENT_BINDS_TO_EXACT_PIP_REVISION
PROJECT_INTENT_CAN_OUTLIVE_ANY_SINGLE_MISSION
```

O PIP preserva provenance de afirmações materiais, delegações técnicas, assumptions, unknowns, blockers e conflicts. O `INTENT_ALIGNMENT_GATE` aprova uma revisão exata; revisão alinhada é histórica/imutável. Mudança material cria nova working revision. `Mission Contract` nasce depois do alinhamento e referencia a revisão alinhada do PIP.

### Q13 — artefatos de projeto existente

```yaml
canonical_name: EVIDENCE_BOUND_CONDITIONAL_EXISTING_PROJECT_ARTIFACT_PIPELINE
artifacts:
  - PROJECT_REALITY_REPORT
  - AS_IS_TO_BE_GAP_MAP
  - COMPLETION_RECOVERY_PLAN
```

`Project Reality Report` representa apenas realidade `AS-IS` em baseline exato com evidência/provenance; não representa intenção nem plano. `Gap Map` compara revisão exata do PRR com revisão exata e alinhada do PIP. `Completion/Recovery Plan` nasce de gaps validados e não autoriza implementação. `RECOVER_MCF_PROJECT` reconcilia primeiro e só escala diante de divergência material.

### Q14 — autoridade e views

```yaml
canonical_name: LAYERED_AUTHORITY_WITH_REBUILDABLE_PROJECT_VIEWS
authority_classes:
  - CANONICAL_DURABLE_RECORD
  - LIVE_AUTHORITATIVE_STATE
  - DERIVED_REBUILDABLE_VIEW
  - WORKING_PROPOSED_ARTIFACT
```

- `CANONICAL_DURABLE_RECORD` é autoritativo dentro de escopo/boundary identificado;
- `LIVE_AUTHORITATIVE_STATE` prevalece para fatos externos voláteis;
- `DERIVED_REBUILDABLE_VIEW` deve ser reconstruível e não cria nova fonte de verdade;
- `WORKING_PROPOSED_ARTIFACT` não possui autoridade até promoção explícita;
- Product Brief e Gap Map são derived views;
- Completion/Recovery Plan nasce como working/proposed;
- checkpoint é canônico para o boundary capturado, mas fatos voláteis exigem reconciliação live;
- não existe um único arquivo universal que seja fonte de verdade para todos os domínios.

```text
CANONICAL != CURRENT_FOREVER
DERIVED_VIEW_CANNOT_OVERRIDE_CANONICAL_RECORD
LIVE_STATE_CANNOT_REWRITE_HISTORY
CHECKPOINT + LIVE_STATE -> RECONCILIATION
PLAN_EXISTS != PLAN_IS_AUTHORITY
```

## Ordem de leitura ao retomar

1. consultar GitHub live e confirmar a branch `planning/mcf-v1.1-discovery`;
2. ler este Resume Card;
3. ler `docs/proposals/MCF-V1.1-DISCOVERY-CHECKPOINT-014.md`;
4. ler `docs/proposals/MCF-V1.1-QUESTIONNAIRE-ROADMAP-001.md`;
5. consultar `docs/proposals/MCF-V1.1-DECISION-LEDGER-001.md` quando precisar dos contratos aprovados;
6. manter `implementation/prototype/release = NO_GO`;
7. iniciar **Q15**, não Q14.

## Próxima ação

> **Q15 — Qual é a divisão de autoridade entre LEANDRO e a equipe MCF após o intake?**

## Comando mínimo de retomada em novo chat

> `Mestre, retome a Discovery da v1.1 pelo Resume Card e pelo Checkpoint 014 no GitHub. Verifique o estado live da branch planning/mcf-v1.1-discovery e continue exatamente pela Q15. Não repita Q1–Q14 e não inicie implementação.`
