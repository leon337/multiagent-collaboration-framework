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

Provar valor empiricamente, comparar com baselines simples, testar portabilidade e generalizar somente com evidência suficiente.

---

# 2. Roadmap macro

```text
FASE ZERO                                      ✅ COMPLETE_IN_MAIN

FASE 1 — MCF NEXTGEN
├── F1.1 Discovery guiado                      🔍 ACTIVE_DISCOVERY
├── F1.2 Questionário Q1–Q16                   🔍 Q1–Q9 ✅ | Q10 próxima
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
  completed: 9
  Q1: COMPLETED
  Q2: COMPLETED_APPROVED_BY_LEANDRO
  Q3: COMPLETED_APPROVED_BY_LEANDRO
  Q4: COMPLETED_APPROVED_BY_LEANDRO
  Q5: COMPLETED_APPROVED_BY_LEANDRO
  Q6: COMPLETED_APPROVED_BY_LEANDRO
  Q7: COMPLETED_APPROVED_BY_LEANDRO
  Q8: COMPLETED_APPROVED_BY_LEANDRO
  Q9: COMPLETED_APPROVED_BY_LEANDRO
  Q10: NEXT_NOT_STARTED
```

A aprovação de perguntas de Discovery não autoriza implementação.

---

# 4. Decisões consolidadas

## Q1 — Finalidade
Sistema pessoal de trabalho com IA para LEANDRO como foco inicial; continuidade durável; provar antes de generalizar.

## Q2 — Continuidade
`LAYERED_CONTINUITY_ARCHITECTURE`; memória, evidência, autoridade e estado live separados; Project Capsule derivado; `UNKNOWN` permanece `UNKNOWN`.

## Q3 — Agente MCF
`Agent Contract`; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY`; `AGENT OUTPUT != PROJECT TRUTH`.

## Q4 — Autonomia
`MISSION-BOUNDED + RISK-BASED AUTONOMY`; Authority Envelope; TEAM_FIRST; HUMAN_GATE exclusivamente de LEANDRO quando exigido.

## Q5 — Model Router
`CAPABILITY_AND_POLICY_BASED_ROUTER`; hard requirements; capability registry; fallback compatível/limitado; routing receipt.

## Q6 — Independência e assurance
`INDEPENDENCE != DIVERSITY`; blind-first/evidência própria/decisão própria para R2+; assurance R0–R4 por risco.

## Q7 — Orquestração
`HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`; outer graph acíclico; loops limitados; paralelismo seguro; joins; replanning versionado; Complexity Budget; Completion Contract.

## Q8 — Persistência
`LAYERED_CANONICAL_PERSISTENCE`; canonical knowledge, operational state, transition ledger, evidence e derived views; consistência durável, provenance, freshness, schema evolution e restorability.

## Q9 — Experiência humana e observabilidade
LEANDRO aprovou `ACTIONABLE_PROGRESSIVE_OBSERVABILITY`.

Princípios:

- visão principal orientada a objetivo, estado, progresso material, bloqueios, necessidade de ação humana e próximo passo;
- severidade operacional e atenção humana são eixos separados;
- `BLOCKED != HUMAN_ACTION_REQUIRED`;
- Decision Inbox centraliza/deduplica decisões humanas e possui lifecycle;
- aprovação humana é vinculada à versão do objeto/estado;
- dashboard/UI são derived views com freshness e não fonte de verdade;
- ações da UI passam por command/policy/state revalidation e receipt;
- progressive disclosure: Human Summary → Operational Detail → Timeline → Evidence → Raw Telemetry;
- Simple View não omite fatos materiais;
- causalidade é tipada; `POST_HOC != CAUSATION`;
- progresso prefere milestones/acceptance criteria/Completion Contract;
- notificações são baseadas em mudança material e deduplicadas;
- pause/cancel/emergency stop são semanticamente distintos;
- `REQUESTED != ENFORCED`;
- overview multi-project não funde memórias;
- chain-of-thought privada não é requisito de observabilidade.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-011.md`.

---

# 5. Próximos blocos

Q10–Q16 decidirão:

- Core vs factories/plugins/perfis;
- infraestrutura/placement;
- segurança/gates/permissões;
- métricas e custo-benefício;
- portabilidade/validação externa;
- simplificação/remoção;
- arquitetura final e GO/NO-GO.

Próxima pergunta:

> **Q10 — O que pertence ao MCF Core e o que deve ser Factory/Plugin/Perfil?**

---

# 6. Critérios para iniciar implementação

Pré-condições:

1. Q1–Q16 concluídas;
2. contradições conciliadas;
3. arquitetura alvo documentada;
4. `PRESERVE / MODIFY / SIMPLIFY / REMOVE / ADD` definidos;
5. métricas definidas;
6. plano de migração definido;
7. backward compatibility definida;
8. critérios de aceite definidos;
9. riscos e rollback definidos;
10. LEANDRO aprova a especificação final.

---

# 7. Ponto de retomada

```yaml
phase_zero: COMPLETE_IN_MAIN
phase_one_discovery: ACTIVE_DISCOVERY
last_completed_question: 9
next_question: 10
implementation_authorized: false
next_human_action_for_discovery: LEANDRO_AND_MESTRE_START_Q10
```

Ordem mínima de retomada:

1. `MCF-NEXTGEN-RESUME-CARD.md`;
2. `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-011.md`;
3. `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`;
4. este Master Roadmap;
5. GitHub/provider live para estado mutável.
