# MCF NextGen — Roadmap do Questionário de Discovery

**ID:** `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001`  
**Status:** `DISCOVERY_COMPLETE`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`

---

## 1. Regra do questionário

O questionário possui **16 perguntas canônicas**.

- uma pergunta por vez;
- LEANDRO pode escolher, combinar ou propor resposta;
- MESTRE registra decisões, consequências, contradições e pontos abertos;
- decisões relevantes são persistidas no GitHub antes de avançar;
- pergunta concluída não é repetida salvo solicitação de LEANDRO;
- hipótese não vira implementação automaticamente;
- Q1–Q16 precisam ser conciliadas antes de qualquer implementação NextGen.

---

## 2. Estado final do questionário

```yaml
question_count_total: 16
questions_completed: 16
questions_remaining: 0
last_completed_question: 16
next_question: NONE
question_01: COMPLETED
question_02: COMPLETED_APPROVED_BY_LEANDRO
question_03: COMPLETED_APPROVED_BY_LEANDRO
question_04: COMPLETED_APPROVED_BY_LEANDRO
question_05: COMPLETED_APPROVED_BY_LEANDRO
question_06: COMPLETED_APPROVED_BY_LEANDRO
question_07: COMPLETED_APPROVED_BY_LEANDRO
question_08: COMPLETED_APPROVED_BY_LEANDRO
question_09: COMPLETED_APPROVED_BY_LEANDRO
question_10: COMPLETED_APPROVED_BY_LEANDRO
question_11: COMPLETED_APPROVED_BY_LEANDRO
question_12: COMPLETED_APPROVED_BY_LEANDRO_CONCEPTUALLY
question_13: COMPLETED_APPROVED_BY_LEANDRO
question_14: COMPLETED_APPROVED_BY_LEANDRO_AFTER_NO_BLOCKER_REVIEW
question_15: COMPLETED_APPROVED_BY_LEANDRO_AFTER_NO_BLOCKER_REVIEW
question_16: COMPLETED_APPROVED_BY_LEANDRO_AFTER_CRITICAL_AUDIT
target_architecture_decision_approved: true
architecture_final_specification_approved: false
prototype_authorized: false
implementation_authorized: false
```

---

## 3. Decisões concluídas

### Q1 — Finalidade principal
Foco inicial: sistema pessoal de trabalho com IA para LEANDRO, continuidade durável, equipes especializadas e prova em uso real antes de generalização.

### Q2 — Continuidade de contexto
`LAYERED_CONTINUITY_ARCHITECTURE`. Checkpoint 004.

### Q3 — Agente MCF
`Agent Contract`; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY`. Checkpoint 005.

### Q4 — Autonomia
`MISSION-BOUNDED + RISK-BASED AUTONOMY`; Authority Envelope; TEAM_FIRST; HUMAN_GATE exclusivamente de LEANDRO quando exigido. Checkpoint 006.

### Q5 — Roteador de modelos
`CAPABILITY_AND_POLICY_BASED_ROUTER`; hard requirements antes de otimização; fallback compatível; Routing Receipt. Checkpoint 007.

### Q6 — Independência
`INDEPENDENCE != DIVERSITY`; blind-first, evidência e decisão próprias; assurance proporcional ao risco. Checkpoint 008.

### Q7 — Orquestração
`HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`; outer graph acíclico, loops limitados, paralelismo seguro, joins, replanning versionado e Completion Contract. Checkpoint 009.

### Q8 — Persistência
`LAYERED_CANONICAL_PERSISTENCE`; canonical knowledge, operational state, transition ledger, evidence e derived views. Checkpoint 010.

### Q9 — Experiência humana e observabilidade
`ACTIONABLE_PROGRESSIVE_OBSERVABILITY`; Decision Inbox, progressive disclosure, freshness e atenção humana orientada à mudança material. Checkpoint 011.

### Q10 — Core vs extensões
`MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS`; Constitutional Kernel + Core Services; plugins/skills/profiles/factories governados. Checkpoint 012.

### Q11 — Infraestrutura e placement
`PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT`; logical planes, durable dispatch, fencing/epoch, fail-closed em partições, recovery coerente e provider-neutral Core. Checkpoint 013.

### Q12 — Segurança, permissões e gates
`POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST`; default deny, delegação atenuante, enforcement fora do modelo, HUMAN_GATE de LEANDRO effect-bound/replay-protected, secret minimization e supply-chain trust verificável. Checkpoint 014.

### Q13 — Métricas e prova de valor
`PREDECLARED_COMPARATIVE_VALUE_EVALUATION`; Evaluation Contract prévio, baseline crível, hard constraints antes de otimização, scorecard multidimensional e evidência para Q15. Checkpoint 015.

### Q14 — Portabilidade e utilidade externa
`CLEAN_ROOM_PORTABILITY_AND_EXTERNAL_UTILITY_VALIDATION`; portability matrix, clean-room, migration-safe activation, authority rebinding, exit portability, Fresh Project/Operator/Context e níveis de evidência externa. Checkpoint 016.

### Q15 — Preservar, simplificar, remover ou substituir
`PRESERVE_INVARIANTS_REDUCE_IMPLEMENTATION`; preservar invariantes, não implementações por inércia; `PRESERVE / SIMPLIFY / REPLACE / REMOVE / INCONCLUSIVE / ADD_REQUIRED`; sunset condicionado a replacement/conformance/migração. Checkpoint 017.

### Q16 — Arquitetura-alvo e GO/NO-GO
**Status:** `COMPLETED / APPROVED_BY_LEANDRO_AFTER_CRITICAL_AUDIT`

Arquitetura-alvo: `GOVERNED_PORTABLE_MULTIAGENT_RUNTIME`.

Síntese:

- Constitutional Kernel pequeno e provider-neutral;
- policy decision e enforcement separados do Kernel, sem policy poder enfraquecer invariantes constitucionais;
- Bootstrap Trust requerido conceitualmente;
- state/ledger/evidence permanecem fontes canônicas conforme classe; Project Capsule é derived view;
- Capability Registry cobre agentes, backends/modelos, workers, extensions e tools com provenance/freshness;
- Router + placement convergem em `Execution Binding` coerente;
- `Execution Coordinator` preserva durable dispatch, attempts, fencing/epoch, admission e backpressure;
- effects materiais passam por policy enforcement + governed effect boundary; extension bypass é proibido;
- credentials/secrets e data classification possuem boundary explícito;
- hosts usam contratos MCF e não definem o Core;
- evaluation e portability/conformance usam contratos do runtime sem obrigação de inchar o Core;
- compatibility com v1 prioriza interpretabilidade histórica, migração de estado/evidence e mappings versionados, não preservação universal de APIs internas;
- migração é incremental, compatibility-first, com NextGen shadow sem efeitos materiais e exatamente uma autoridade/escritor material canônico por boundary;
- migração/cutover é efeito privilegiado e governado;
- acceptance gates são separados em Architecture Readiness, Implementation/Migration Readiness e Cutover/Release Readiness;
- target architecture decision aprovada não é autorização de produção nem implementação.

GO/NO-GO:

```yaml
questionnaire_direction: GO
target_architecture_decision: GO
discovery_completion: GO
F1_3_decision_consolidation: GO
F1_4_formal_target_architecture: GO
F1_5_migration_plan: GO
F1_6_executable_specification: GO
prototype: NO_GO_CURRENTLY
implementation: NO_GO_CURRENTLY
production_cutover: NO_GO
destructive_v1_change: NO_GO
final_implementation_authorization: REQUIRES_EXPLICIT_LEANDRO_APPROVAL
```

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-018.md`.

---

## 4. Encerramento do Discovery

O questionário Q1–Q16 está completo. Não há Q17.

A aprovação da Q16 encerra o Discovery decisório, mas não conclui a especificação executável da Fase 1.

Próximo bloco canônico:

> **F1.3 — Consolidação formal das decisões Q1–Q16.**

Depois: F1.4 Arquitetura alvo formal, F1.5 Plano de migração e F1.6 Especificação executável.

---

## 5. Política de checkpoint

Persistir checkpoint em decisão arquitetônica, aprovação de LEANDRO, mudança relevante, descoberta de lacuna, pausa, missão grande ou troca de sessão/projeto.

---

## 6. Protocolo de retomada

1. consultar GitHub live;
2. ler `MCF-NEXTGEN-RESUME-CARD.md`;
3. ler `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-018.md`;
4. ler este roadmap;
5. ler `MCF-MASTER-ROADMAP-001.md`;
6. continuar em F1.3.

```yaml
last_completed_question: 16
next_question: NONE
next_phase_block: F1_3_DECISION_CONSOLIDATION
instruction: NÃO REPETIR Q1-Q16
implementation_authorized: false
```
