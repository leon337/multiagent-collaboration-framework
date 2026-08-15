# MCF v1.1 — Resume Card

**USE ESTE ARQUIVO PRIMEIRO AO RETOMAR O TRABALHO DA v1.1 EM OUTRO CHAT.**

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

## Estado terminal da Discovery

```yaml
target_version: v1.1.0
status: DISCOVERY_COMPLETE
total_questions: 20
questions_completed: 20
questions_remaining: 0
last_completed_question: 20
next_question: NONE
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
Q17: COMPLETED_APPROVED_BY_LEANDRO
Q18: COMPLETED_APPROVED_BY_LEANDRO
Q19: COMPLETED_APPROVED_BY_LEANDRO
Q20: COMPLETED_APPROVED_BY_LEANDRO

discovery_verdict: CONDITIONAL_GO
conditional_go_scope: IMPLEMENTATION_PREPARATION_ONLY
conceptual_architecture: APPROVED

implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Não existe Q21. Não reiniciar Discovery nem iniciar implementação automaticamente.**

A continuidade canônica após o encerramento está neste Resume Card + `MCF-V1.1-DISCOVERY-CHECKPOINT-020.md` + `MCF-V1.1-DECISION-LEDGER-001.md`. Toda retomada deve consultar GitHub live antes de afirmar estado atual.

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
Q17: EVENT_DRIVEN_TRANSFERABLE_CHECKPOINT_WITH_VERIFIED_RESUME
Q18: COMPATIBLE_EXTENSION_VERSIONING_AND_EXPLICIT_MIGRATION
Q19: EVIDENCE_LAYERED_REAL_SCENARIO_QUALIFICATION_MATRIX
Q20: CONSOLIDATED_V11_ARCHITECTURE_WITH_CONDITIONAL_GO
```

## Arquitetura consolidada

```text
1. ACTIVATION_AND_BOOTSTRAP
2. PROJECT_ENTRY
3. PROJECT_CONTEXT
4. ALIGNMENT_AND_PLANNING_INPUTS
5. MISSION_EXECUTION
6. AUTHORITY_AND_HUMAN_GATE
7. PROJECT_MEMORY_AND_AUTHORITY
8. CONTINUITY_AND_RECOVERY
9. VERSION_AND_COMPATIBILITY
10. QUALIFICATION
```

### Síntese do fluxo

```text
VERIFIED ACTIVATION
→ PROJECT ENTRY CLASSIFICATION
→ NEW / ADOPT / RESUME / RECOVER
→ PROJECT GENESIS OR EVIDENCE-FIRST RECONNAISSANCE
→ HUMAN INTENT DISCOVERY
→ 20 CANONICAL INTENT DIMENSIONS
→ ADAPTIVE QUESTIONING
→ PROGRESSIVE READ-BACK
→ SEMANTIC READINESS
→ VERSIONED PIP
→ FINAL INTENT READ-BACK
→ LEANDRO CONFIRMS
→ INTENT ALIGNMENT GATE
→ PRR / GAP MAP / COMPLETION PLAN WHEN APPLICABLE
→ MISSION CONTRACT
→ MCF-START-MISSION
→ TEAM AUTONOMY INSIDE HUMAN ENVELOPE
→ IMPACT-BASED HUMAN_GATE + SCOPED AUTHORIZATION
→ EVENT-DRIVEN TRANSFERABLE CHECKPOINTS
→ FAST_RESUME / RECONCILE / RECOVER
→ COMPATIBLE V1.0→V1.1 EXTENSION
→ EVIDENCE-LAYERED QUALIFICATION
```

## Q20 — significado do veredito

```yaml
canonical_name: CONSOLIDATED_V11_ARCHITECTURE_WITH_CONDITIONAL_GO
verdict: CONDITIONAL_GO
scope: IMPLEMENTATION_PREPARATION_ONLY
```

`CONDITIONAL_GO` significa que a Discovery conceitual está completa e suficientemente madura para a preparação técnica da implementação. Não significa que a implementação já está autorizada.

```text
DISCOVERY_COMPLETE != IMPLEMENTATION_AUTHORIZED
CONDITIONAL_GO = GO_FOR_TECHNICAL_PREPARATION_ONLY
NO_CODE_FROM_Q20
NO_PROTOTYPE_FROM_Q20
NO_RELEASE_FROM_Q20
```

## Próxima fase permitida

A próxima fase é **PRE-IMPLEMENTATION TECHNICAL PREPARATION / CONFORMANCE**, ainda sem código de implementação.

Deve produzir:

1. `V1_0_IMPACT_AND_CONFORMANCE_ANALYSIS`;
2. mapa de reutilização/extensão versus candidato a novo primitive;
3. `NO_EQUIVALENT_TEST` para cada candidato a primitive novo;
4. schemas e contratos exatos;
5. runtime/skill/event/persistence mapping;
6. migration + compatibility plan;
7. implementation plan incremental;
8. Qualification Plan aderente à Q19;
9. team review;
10. HUMAN_GATE separado dirigido a LEANDRO para eventual autorização de implementação.

### Primitives v1.0 a reutilizar/estender por padrão

- MCF Runtime
- `MCF-START-MISSION`
- `MCF-RECOVER-CONTEXT`
- Mission Contract
- PRF/checkpoints
- permission profiles
- Human Delegation Firewall
- handoffs
- receipts
- reconciliation
- observability

### Candidatos a novos contratos duráveis

Ainda sujeitos a `NO_EQUIVALENT_TEST`:

- `PROJECT_INTENT_PACKAGE`
- `PROJECT_REALITY_REPORT`

### Não criar novo runtime state por padrão

- Resume Card
- Product Brief
- AS-IS / TO-BE Gap Map
- Completion/Recovery Plan draft

## Ordem de leitura ao retomar

1. consultar GitHub live e confirmar branch/HEAD pertinentes;
2. ler este Resume Card;
3. ler `docs/proposals/MCF-V1.1-DISCOVERY-CHECKPOINT-020.md`;
4. consultar `docs/proposals/MCF-V1.1-DECISION-LEDGER-001.md` para os contratos aprovados;
5. consultar `docs/proposals/MCF-V1.1-QUESTIONNAIRE-ROADMAP-001.md` para o fechamento das 20 perguntas;
6. manter `IMPLEMENTATION/CODEX_IMPLEMENTATION/PROTOTYPE/RELEASE = NO_GO`;
7. iniciar somente a preparação técnica/conformance, não implementação.

## Próxima ação

> **Preparar a implementação da v1.1 tecnicamente, começando pela análise de impacto/conformance da v1.0 e pelos `NO_EQUIVALENT_TESTS`, sem escrever código de implementação.**

## Comando mínimo de retomada em novo chat

> `Mestre, retome a v1.1 pelo Resume Card e pelo Checkpoint 020 no GitHub. Verifique o estado live do MCF. A Discovery Q1–Q20 está completa com CONDITIONAL_GO apenas para preparação técnica. Não reabra o questionário e não implemente. Inicie a preparação técnica/conformance da v1.1.`
