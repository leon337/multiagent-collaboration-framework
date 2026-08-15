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
Estado: `ACTIVE_DISCOVERY`.

Arquitetura final, protótipo e implementação continuam não autorizados.

## Fase 2 — Provar e generalizar

Provar valor empiricamente, comparar com baselines críveis, testar portabilidade e generalizar somente com evidência suficiente.

---

# 2. Roadmap macro

```text
FASE ZERO                                      ✅ COMPLETE_IN_MAIN

FASE 1 — MCF NEXTGEN
├── F1.1 Discovery guiado                      🔍 ACTIVE_DISCOVERY
├── F1.2 Questionário Q1–Q16                   🔍 Q1–Q15 ✅ | Q16 próxima
├── F1.3 Consolidação das decisões             ⏳
├── F1.4 Arquitetura alvo                      ⏳
├── F1.5 Plano de migração                     ⏳
├── F1.6 Especificação executável              ⏳
├── F1.7 Entrega estruturada ao executor       ⏳
├── F1.8 Implementação                         ⏳ NÃO AUTORIZADA
├── F1.9 Validação técnica e regressão         ⏳
└── F1.10 Release reestruturada                ⏳

FASE 2 — PROVAR E GENERALIZAR                  ⏳
```

---

# 3. Estado atual da Fase 1

```yaml
phase_1:
  stage: ACTIVE_DISCOVERY
  architecture_final_approved: false
  prototype_authorized: false
  implementation_authorized: false

questionnaire:
  total: 16
  completed: 15
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
  Q16: NEXT_NOT_STARTED
```

A aprovação de perguntas de Discovery não autoriza implementação.

---

# 4. Decisões consolidadas

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

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-013.md`.

## Q12 — Segurança, permissões e gates
`POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST`; default deny, delegação atenuante, enforcement fora do modelo, HUMAN_GATE de LEANDRO effect-bound/replay-protected, secret minimization, worker blast-radius limitado, cross-project deny e supply-chain trust verificável.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-014.md`.

## Q13 — Métricas, prova de valor e custo
`PREDECLARED_COMPARATIVE_VALUE_EVALUATION`; Evaluation Contract prévio, baselines críveis, hard constraints antes de otimização, scorecard multidimensional, uncertainty/generalization scope, custo marginal/estrutural e evidência para Q15.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-015.md`.

## Q14 — Portabilidade e utilidade externa
`CLEAN_ROOM_PORTABILITY_AND_EXTERNAL_UTILITY_VALIDATION`; portability matrix, clean-room, compatibility envelope, migration-safe activation, authority rebinding, exit portability, Fresh Project/Operator/Context e níveis de evidência externa.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-016.md`.

## Q15 — Preservação, simplificação e substituição
LEANDRO aprovou `PRESERVE_INVARIANTS_REDUCE_IMPLEMENTATION` após auditoria e revisão final sem bloqueio conceitual remanescente.

Princípios:

- preservar invariantes não implica preservar a implementação atual;
- disposições formais: `PRESERVE`, `SIMPLIFY`, `REPLACE`, `REMOVE`, `INCONCLUSIVE`, `ADD_REQUIRED`;
- falta de evidência resulta em `INCONCLUSIVE`, não poda inventada;
- `REMOVE_FROM_CORE != DELETE`;
- durable state, evidence/provenance, transition ledger, governed effects, fail-closed authorization, TEAM_FIRST, Agent/Skill Contracts, observability/recovery, assurance e stable baseline são preservados semanticamente;
- receipts e documentação operacional devem ser automatizados/derivados sem reduzir auditabilidade;
- keyword planner, special-case PermissionEngine, HDF com identidade hardcoded e risk schema A/B/C canônico devem ser substituídos gradualmente, nunca por big bang;
- 29 agentes não pertencem ao Core; contratos/história são preservados e default ativo depende de evidência;
- 16 skills atuais são evidência/regressão, sem congelar providers/handoffs incidentais;
- GitHub, Render e PostgreSQL podem ser adapters/defaults, não identidade constitucional;
- runtime deve reduzir coupling ao host `rede-social-agentes` por boundary lógico, sem exigir microservices;
- stable v1.0.0 é referência/baseline/migration source, não rollback operacional automático após mudança de dados/schema;
- decisões de disposição precisam respeitar dependency graph;
- sunset exige replacement pronto, semantic conformance, migration/compatibility e ausência de dependência ativa;
- capabilities aprovadas em Q1–Q14 ainda ausentes entram como `ADD_REQUIRED`, sem autorização de implementação.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-017.md`.

---

# 5. Próximo bloco

Q16 decidirá:

- reconciliação final de Q1–Q15;
- arquitetura alvo da Fase 1;
- boundaries finais Core/Extensions/Host/State/Execution/Security;
- plano de migração e compatibilidade com v1;
- acceptance criteria e validation strategy;
- riscos, recovery e sunset boundaries;
- GO/NO-GO conceitual.

Próxima pergunta:

> **Q16 — Qual é a arquitetura final da Fase 1 e o GO/NO-GO?**

---

# 6. Critérios para iniciar implementação

Pré-condições:

1. Q1–Q16 concluídas;
2. contradições conciliadas;
3. arquitetura alvo documentada;
4. `PRESERVE / SIMPLIFY / REPLACE / REMOVE / INCONCLUSIVE / ADD_REQUIRED` reconciliados;
5. métricas definidas;
6. plano de migração definido;
7. backward compatibility definida;
8. critérios de aceite definidos;
9. riscos e rollback/recovery definidos;
10. LEANDRO aprova explicitamente a especificação final e autoriza o avanço correspondente.

---

# 7. Ponto de retomada

```yaml
phase_zero: COMPLETE_IN_MAIN
phase_one_discovery: ACTIVE_DISCOVERY
last_completed_question: 15
next_question: 16
architecture_final_approved: false
prototype_authorized: false
implementation_authorized: false
next_human_action_for_discovery: LEANDRO_AND_MESTRE_START_Q16
```

Ordem mínima de retomada:

1. `MCF-NEXTGEN-RESUME-CARD.md`;
2. `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-017.md`;
3. `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`;
4. este Master Roadmap;
5. GitHub/provider live para estado mutável.
