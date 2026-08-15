# MCF — Master Roadmap

**ID:** `MCF-MASTER-ROADMAP-001`  
**Status:** `ACTIVE_ROADMAP`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Regra:** estados mutáveis devem ser revalidados no GitHub/provider live.

---

# 1. Fases

## Fase Zero — Construir para aprender

**Estado:** `COMPLETE_IN_MAIN`.

Boundary terminal: `main@b91823a947715e09d69c72999e2278523f2259be`, PR #136 merged, Issue #135 closed, P0/P1/P2 = 0/0/0, CI pós-merge PASS, RC3 terminal NOOP PASS e Production Health PASS.

## Fase 1 — Reestruturar com o que aprendemos

Nome canônico: **MCF — Fase 1: Reestruturação e Evolução Pós-v1**  
Nome curto: **MCF NextGen**

Estado atual:

```yaml
stage: DISCOVERY_COMPLETE
target_architecture_decision_approved: true
architecture_final_specification_approved: false
prototype_authorized: false
implementation_authorized: false
production_cutover_authorized: false
```

Arquitetura-alvo decisória aprovada: `GOVERNED_PORTABLE_MULTIAGENT_RUNTIME`.

A aprovação de Q16 encerra o questionário de Discovery, mas não autoriza código, protótipo, migração material, alteração da stable ou produção.

## Fase 2 — Provar e generalizar

Provar valor empiricamente, comparar com baselines críveis, testar portabilidade e generalizar somente com evidência suficiente.

---

# 2. Roadmap macro

```text
FASE ZERO                                      ✅ COMPLETE_IN_MAIN

FASE 1 — MCF NEXTGEN
├── F1.1 Discovery guiado                      ✅ COMPLETE
├── F1.2 Questionário Q1–Q16                   ✅ COMPLETE 16/16
├── F1.3 Consolidação das decisões             👉 NEXT
├── F1.4 Arquitetura alvo formal               ⏳
├── F1.5 Plano de migração                     ⏳
├── F1.6 Especificação executável              ⏳
├── F1.7 Entrega estruturada ao executor       ⏳
├── F1.8 Implementação                         ⏳ NÃO AUTORIZADA
├── F1.9 Validação técnica e regressão         ⏳
└── F1.10 Release reestruturada                ⏳

FASE 2 — PROVAR E GENERALIZAR                  ⏳
```

---

# 3. Estado final do questionário

```yaml
questionnaire:
  total: 16
  completed: 16
  remaining: 0
  last_completed_question: 16
  next_question: NONE
  Q1: COMPLETED
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
  Q12: COMPLETED_APPROVED_BY_LEANDRO_CONCEPTUALLY
  Q13: COMPLETED_APPROVED_BY_LEANDRO
  Q14: COMPLETED_APPROVED_BY_LEANDRO_AFTER_NO_BLOCKER_REVIEW
  Q15: COMPLETED_APPROVED_BY_LEANDRO_AFTER_NO_BLOCKER_REVIEW
  Q16: COMPLETED_APPROVED_BY_LEANDRO_AFTER_CRITICAL_AUDIT
```

---

# 4. Decisões consolidadas Q1–Q16

## Q1 — Finalidade
Sistema pessoal de trabalho com IA para LEANDRO como foco inicial; continuidade durável; provar antes de generalizar.

## Q2 — Continuidade
`LAYERED_CONTINUITY_ARCHITECTURE`; memória, evidência, autoridade e live state separados; Project Capsule derivado; `UNKNOWN` permanece `UNKNOWN`.

## Q3 — Agente MCF
`Agent Contract`; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY`; `AGENT OUTPUT != PROJECT_TRUTH`.

## Q4 — Autonomia
`MISSION-BOUNDED + RISK-BASED AUTONOMY`; Authority Envelope; TEAM_FIRST; HUMAN_GATE exclusivamente de LEANDRO quando exigido.

## Q5 — Model Router
`CAPABILITY_AND_POLICY_BASED_ROUTER`; hard requirements, capability registry, fallback compatível/limitado e Routing Receipt.

## Q6 — Independência e assurance
`INDEPENDENCE != DIVERSITY`; blind-first, evidência própria, decisão própria e assurance proporcional ao risco.

## Q7 — Orquestração
`HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`; outer graph acíclico, loops limitados, paralelismo seguro, joins, replanning versionado, Complexity Budget e Completion Contract.

## Q8 — Persistência
`LAYERED_CANONICAL_PERSISTENCE`; canonical knowledge, operational state, transition ledger, evidence e derived views; provenance, freshness, schema evolution e restorability.

## Q9 — Experiência humana e observabilidade
`ACTIONABLE_PROGRESSIVE_OBSERVABILITY`; Decision Inbox, atenção humana separada de severidade, aprovação version-bound, UI derivada e progressive disclosure.

## Q10 — Core vs extensões
`MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS`; Constitutional Kernel + Core Services; extensões governadas/versionadas e provider-specific adapters fora da identidade constitucional.

## Q11 — Infraestrutura e placement
`PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT`; logical planes, durable dispatch, attempt identity, leases + fencing/epoch, fail-closed em partições, recovery coerente e provider-neutral Core.

## Q12 — Segurança, permissões e gates
`POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST`; default deny, delegação atenuante, enforcement fora do modelo, HUMAN_GATE de LEANDRO effect-bound/replay-protected, secret minimization, worker blast-radius limitado, cross-project deny e supply-chain trust verificável.

## Q13 — Métricas, prova de valor e custo
`PREDECLARED_COMPARATIVE_VALUE_EVALUATION`; Evaluation Contract prévio, baselines críveis, hard constraints antes de otimização, scorecard multidimensional, uncertainty/generalization scope, custo marginal/estrutural e evidência para decisões de complexidade.

## Q14 — Portabilidade e utilidade externa
`CLEAN_ROOM_PORTABILITY_AND_EXTERNAL_UTILITY_VALIDATION`; portability matrix, clean-room, compatibility envelope, migration-safe activation, authority rebinding, exit portability, Fresh Project/Operator/Context e níveis de evidência externa.

## Q15 — Preservação, simplificação e substituição
`PRESERVE_INVARIANTS_REDUCE_IMPLEMENTATION`; `PRESERVE / SIMPLIFY / REPLACE / REMOVE / INCONCLUSIVE / ADD_REQUIRED`; no big-bang; sunset condicionado a replacement/conformance/migração/dependências.

## Q16 — Arquitetura-alvo e GO/NO-GO
LEANDRO aprovou `GOVERNED_PORTABLE_MULTIAGENT_RUNTIME` após auditoria crítica transversal sem bloqueio conceitual remanescente.

Refinamentos centrais:

- Q16 aprova `target_architecture_decision`, não a especificação executável final;
- Constitutional Kernel não é policy configurável; policy decision/enforcement obedecem aos invariantes do Kernel;
- Bootstrap Trust conceitual é requerido para evitar trust cycle;
- Capability Registry cobre agentes, model backends, workers, extensions e tools;
- Router e placement convergem em `Execution Binding` coerente;
- `Execution Coordinator` cobre durable dispatch, attempt identity, fencing/epoch, admission e backpressure;
- Continuity Builder/Project Capsule permanecem derived, nunca segunda verdade;
- credentials/secrets, data classification e trust provenance possuem boundaries explícitos;
- extensions não podem bypassar Governed Effect Boundary;
- host/application boundary desacopla o Core de `rede-social-agentes` sem exigir microservices;
- assurance boundary não prova independência sozinho;
- evaluation e portability/conformance harnesses usam contratos do runtime sem necessidade de integrar todo benchmark ao Core;
- compatibility v1 preserva interpretabilidade histórica, state migration, evidence/receipts e mappings versionados, sem congelar APIs internas incidentais;
- migração segue `INCREMENTAL_COMPATIBILITY_FIRST` e proíbe v1/NextGen como writers materiais concorrentes;
- NextGen Shadow não executa efeitos materiais;
- cutover/migration é efeito privilegiado e governado;
- acceptance gates são separados por Architecture Readiness, Implementation/Migration Readiness e Cutover/Release Readiness.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-018.md`.

---

# 5. GO/NO-GO após Q16

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

---

# 6. Próximo bloco: F1.3

### F1.3 — Consolidação formal das decisões Q1–Q16

Objetivo:

- transformar os 16 checkpoints/decisões em um conjunto único de requisitos e invariantes;
- eliminar duplicações terminológicas sem reescrever história;
- registrar contradictions/resolutions e itens `INCONCLUSIVE` ainda deliberadamente abertos;
- preparar inputs formais para F1.4 Arquitetura Alvo.

F1.3 é trabalho de especificação/documentação. Não autoriza implementação.

---

# 7. Critérios antes de implementação

Antes de pedir autorização de implementação devem existir, no mínimo:

1. Q1–Q16 concluídas — **PASS**;
2. F1.3 decisões formalmente consolidadas;
3. F1.4 arquitetura alvo formal documentada;
4. F1.5 plano de migração/backward compatibility formalizado;
5. F1.6 especificação executável e testável;
6. dispositions `PRESERVE / SIMPLIFY / REPLACE / REMOVE / INCONCLUSIVE / ADD_REQUIRED` reconciliadas;
7. acceptance criteria e validation strategy executáveis;
8. riscos, security model, recovery e sunset definidos;
9. especificação aprovada vinculada a revisão exata/integridade/change-control apropriado;
10. LEANDRO aprova explicitamente a especificação final e autoriza implementação.

Até lá:

```text
PROTOTYPE = NO_GO
IMPLEMENTATION = NO_GO
PRODUCTION_CUTOVER = NO_GO
DESTRUCTIVE_V1_CHANGE = NO_GO
```

---

# 8. Ponto de retomada

```yaml
phase_zero: COMPLETE_IN_MAIN
phase_one_stage: DISCOVERY_COMPLETE
questionnaire: COMPLETE_16_OF_16
target_architecture_decision: GOVERNED_PORTABLE_MULTIAGENT_RUNTIME
target_architecture_decision_approved: true
architecture_final_specification_approved: false
prototype_authorized: false
implementation_authorized: false
next_phase_block: F1_3_DECISION_CONSOLIDATION
```

Ordem mínima de retomada:

1. `MCF-NEXTGEN-RESUME-CARD.md`;
2. `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-018.md`;
3. `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`;
4. este Master Roadmap;
5. GitHub/provider live para estado mutável.
