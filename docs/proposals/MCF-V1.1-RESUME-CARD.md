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
questions_completed: 16
questions_remaining: 4
last_completed_question: 16
next_question: 17
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
Q15: COMPLETED_APPROVED_BY_LEANDRO
Q16: COMPLETED_APPROVED_BY_LEANDRO
Q17: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Não repetir Q1–Q16 salvo solicitação explícita de LEANDRO.**

A continuidade canônica da Discovery está agora neste Resume Card + `MCF-V1.1-DISCOVERY-CHECKPOINT-016.md`. Qualquer retomada deve consultar GitHub live antes de afirmar estado atual.

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
Q15: DELEGATED_TECHNICAL_AUTONOMY_WITHIN_HUMAN_APPROVED_ENVELOPE
Q16: IMPACT_BASED_HUMAN_GATES_WITH_SCOPED_STANDING_AUTHORIZATION
```

## Síntese operacional Q6–Q16

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
→ TEAM AUTONOMY WITHIN HUMAN-APPROVED ENVELOPE
→ IMPACT-BASED HUMAN GATES + SCOPED STANDING AUTHORIZATION
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
```

PIP é a memória durável e versionada da intenção humana; separa intenção, síntese, decisões, evidência, inferências, delegações, assumptions e unknowns. `INTENT_ALIGNMENT_GATE` vincula revisão exata e `Mission Contract` nasce depois do alinhamento.

### Q13 — artefatos de projeto existente

```yaml
canonical_name: EVIDENCE_BOUND_CONDITIONAL_EXISTING_PROJECT_ARTIFACT_PIPELINE
artifacts:
  - PROJECT_REALITY_REPORT
  - AS_IS_TO_BE_GAP_MAP
  - COMPLETION_RECOVERY_PLAN
```

PRR representa realidade `AS-IS` em baseline exato; Gap Map compara PRR exato com PIP alinhado exato; Completion/Recovery Plan nasce de gaps validados. `RECOVER_MCF_PROJECT` reconcilia primeiro e só escala diante de divergência material.

### Q14 — autoridade e views

```yaml
canonical_name: LAYERED_AUTHORITY_WITH_REBUILDABLE_PROJECT_VIEWS
authority_classes:
  - CANONICAL_DURABLE_RECORD
  - LIVE_AUTHORITATIVE_STATE
  - DERIVED_REBUILDABLE_VIEW
  - WORKING_PROPOSED_ARTIFACT
```

Canônico é específico de domínio/boundary; estado live prevalece para fatos voláteis; derived views não criam autoridade concorrente; working/proposed artifacts exigem promoção explícita.

### Q15 — autoridade humana × autonomia técnica

```yaml
canonical_name: DELEGATED_TECHNICAL_AUTONOMY_WITHIN_HUMAN_APPROVED_ENVELOPE
```

LEANDRO governa intenção, objetivo, resultado esperado, prioridades, limites e trade-offs humanos materiais. A equipe MCF governa escolhas técnicas e operacionais dentro do envelope formado por `ALIGNED_PIP + HUMAN_DECISIONS + MISSION_CONTRACT`. `TEAM_FIRST` é aplicado antes de escalar ambiguidades. Mudança material do envelope cruza a fronteira da autoridade humana.

### Q16 — HUMAN_GATE e autorizações delimitadas

```yaml
canonical_name: IMPACT_BASED_HUMAN_GATES_WITH_SCOPED_STANDING_AUTHORIZATION
```

`HUMAN_GATE` é disparado por impacto material, não pelo nome isolado da operação. Mudanças materiais de intenção/objetivo/público, custos fora do boundary, riscos jurídicos/privacidade/exposição, uso excepcional de credenciais/dados sensíveis, ações irreversíveis/de alto impacto, pivô/cancelamento, aceitação de risco material e ações reservadas por LEANDRO exigem gate. Autorizações antecipadas/contínuas são permitidas apenas com escopo delimitado. `TEAM_FIRST` precede o gate; gate pendente bloqueia somente a ação dependente; silêncio nunca significa aprovação.

```text
MATERIAL_IMPACT > OPERATION_NAME
TEAM_FIRST_BEFORE_HUMAN_GATE
SCOPED_AUTHORIZATION != UNBOUNDED_AUTHORITY
NO_RESPONSE != APPROVAL
PENDING_HUMAN_GATE_BLOCKS_DEPENDENT_ACTION_NOT_ALL_SAFE_WORK
```

## Ordem de leitura ao retomar

1. consultar GitHub live e confirmar a branch `planning/mcf-v1.1-discovery`;
2. ler este Resume Card;
3. ler `docs/proposals/MCF-V1.1-DISCOVERY-CHECKPOINT-016.md`;
4. ler `docs/proposals/MCF-V1.1-QUESTIONNAIRE-ROADMAP-001.md`;
5. consultar `docs/proposals/MCF-V1.1-DECISION-LEDGER-001.md` quando precisar dos contratos aprovados;
6. manter `implementation/prototype/release = NO_GO`;
7. iniciar **Q17**, não Q16.

## Próxima ação

> **Q17 — Como checkpoint, pause/resume e troca de chat devem funcionar?**

## Comando mínimo de retomada em novo chat

> `Mestre, retome a Discovery da v1.1 pelo Resume Card e pelo Checkpoint 016 no GitHub. Verifique o estado live da branch planning/mcf-v1.1-discovery e continue exatamente pela Q17. Não repita Q1–Q16 e não inicie implementação.`
