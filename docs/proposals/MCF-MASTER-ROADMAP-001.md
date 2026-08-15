# MCF — Master Roadmap

**ID:** `MCF-MASTER-ROADMAP-001`  
**Status:** `ACTIVE_ROADMAP`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Escopo:** visão macro do MCF desde a Fase Zero até a reestruturação e validação futura.  
**Regra:** estados live devem sempre ser revalidados no GitHub; SHAs abaixo são boundaries/checkpoints e não substituem read-back live.

---

# 1. Modelo de fases

## FASE ZERO — Construir para aprender

**Estado:** `COMPLETE_IN_MAIN`.

Boundary terminal da missão `MCF-PHASE-0-FINALIZATION-001`: `main@b91823a947715e09d69c72999e2278523f2259be`, PR #136 merged, Issue #135 closed, P0/P1/P2 = 0/0/0, CI pós-merge PASS, RC3 terminal NOOP PASS e Production Health PASS.

## FASE 1 — Reestruturar com o que aprendemos

Nome canônico: **MCF — Fase 1: Reestruturação e Evolução Pós-v1**  
Nome curto: **MCF NextGen**

**Estado:** `ACTIVE_DISCOVERY`. Arquitetura final, protótipo e implementação continuam não autorizados.

## FASE 2 — Provar e generalizar

Objetivo: provar empiricamente valor, comparar com baselines simples, testar portabilidade e preparar generalização somente com evidência suficiente.

---

# 2. Roadmap macro

```text
FASE ZERO — CONSTRUIR PARA APRENDER
└── Z0.10 Encerramento formal                   ✅ COMPLETE_IN_MAIN

FASE 1 — REESTRUTURAR COM O QUE APRENDEMOS
│
├── F1.1 Discovery guiado                       🔍 ACTIVE_DISCOVERY
├── F1.2 Questionário Q1–Q16                    🔍 Q1–Q7 ✅ | Q8 próxima
├── F1.3 Consolidação das decisões              ⏳
├── F1.4 Arquitetura alvo                       ⏳
├── F1.5 Plano de migração                      ⏳
├── F1.6 Especificação executável               ⏳
├── F1.7 Entrega estruturada ao executor        ⏳
├── F1.8 Implementação da reestruturação        ⏳ NÃO AUTORIZADA
├── F1.9 Validação técnica e regressão          ⏳
└── F1.10 Release reestruturada                 ⏳

FASE 2 — PROVAR E GENERALIZAR                   ⏳
```

---

# 3. Boundary terminal da Fase Zero

```yaml
phase_zero:
  mission: MCF-PHASE-0-FINALIZATION-001
  state: COMPLETE_IN_MAIN
  audited_candidate: 47f083d304b989b397b9e740228817af0c588346
  merge_main: b91823a947715e09d69c72999e2278523f2259be
  pr_136: MERGED
  issue_135: CLOSED
  P0: 0
  P1: 0
  P2: 0
  post_merge_ci: PASS
  rc3_terminal_noop: PASS
  production_health: PASS

durable_release_identity:
  stable_v1_0_0: 7f741e10d0e745a90c732e084400b11e3f5e6794
  rc3: 7f741e10d0e745a90c732e084400b11e3f5e6794
```

---

# 4. Estado atual da Fase 1

```yaml
phase_1:
  canonical_name: MCF — Fase 1: Reestruturação e Evolução Pós-v1
  short_name: MCF NextGen
  stage: ACTIVE_DISCOVERY
  architecture_final_approved: false
  prototype_authorized: false
  implementation_authorized: false

questionnaire:
  total: 16
  Q1: COMPLETED
  Q2: COMPLETED_APPROVED_BY_LEANDRO
  Q3: COMPLETED_APPROVED_BY_LEANDRO
  Q4: COMPLETED_APPROVED_BY_LEANDRO
  Q5: COMPLETED_APPROVED_BY_LEANDRO
  Q6: COMPLETED_APPROVED_BY_LEANDRO
  Q7: COMPLETED_APPROVED_BY_LEANDRO
  Q8: NEXT_NOT_STARTED
```

A aprovação de perguntas de Discovery não autoriza implicitamente implementação.

---

# 5. Decisões de Discovery consolidadas

## Q1 — Finalidade
Sistema pessoal de trabalho com IA para LEANDRO como foco inicial; continuidade durável; provar no uso real antes de generalizar.

## Q2 — Continuidade
`LAYERED_CONTINUITY_ARCHITECTURE`; memória, evidência, autoridade e estado live separados; `UNKNOWN` permanece `UNKNOWN`; Project Capsule derivado; cold-start/Continuity Recovery Test.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

## Q3 — Agente MCF
`Agent Contract`; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY`; `IDENTITY CONTINUITY != CAPABILITY CONTINUITY`; `AGENT OUTPUT != PROJECT TRUTH`.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md`.

## Q4 — Autonomia
`MISSION-BOUNDED + RISK-BASED AUTONOMY`; `Authority Envelope`; `UNKNOWN_AUTHORITY = DENY`; retries limitados; `TEAM_FIRST`; HUMAN_GATE exclusivamente de LEANDRO em R3/crítico.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`.

## Q5 — Model Router
`CAPABILITY_AND_POLICY_BASED_ROUTER`; hard requirements obrigatórios; `UNKNOWN_CAPABILITY = NOT_COMPATIBLE`; fallback compatível/limitado; sem silent downgrade ou routing loop; routing receipt auditável.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md`.

## Q6 — Independência e assurance
`INDEPENDENCE != DIVERSITY`; R2+ exige contexto separado, `BLIND_FIRST`, evidência e decisão próprias, receipt inicial; `CONSENSUS != TRUTH`; níveis R0–R4 proporcionais ao risco.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-008.md`.

## Q7 — Orquestração
LEANDRO aprovou `HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`.

Princípios:

- dependências acíclicas no outer graph;
- loops apenas em subfluxos delimitados, limitados e com prova de progresso;
- paralelismo dependency-safe;
- mutações conflitantes coordenadas;
- joins explícitos;
- falha parcial não avança silenciosamente;
- replanning versionado e histórico imutável;
- replan não amplia autoridade, risk ceiling nem remove gates obrigatórios;
- `Complexity Budget` limita graph depth, fanout, tarefas, agentes, custo e tempo;
- spawning ilimitado proibido;
- version preconditions/staleness control antes de integração;
- integração explícita; `last writer wins` não é padrão;
- side effects exigem idempotência/controle equivalente e compensação quando aplicável;
- `Completion Contract` define conclusão; `GRAPH_EXHAUSTION != MISSION_COMPLETION`.

Detalhes concretos de scheduler, filas, lock/concurrency, persistência e compensação foram deferidos corretamente para Q8/Q11/Q12/Q16.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009.md`.

---

# 6. Discovery da Fase 1

Branch:

`planning/mcf-nextgen-discovery`

```yaml
questionnaire_total: 16
last_completed_question: 7
next_question: 8
Q8_started: false
implementation_authorized: false
architecture_final_approved: false
```

Próxima pergunta:

> **Q8 — Qual documentação e estado persistente são realmente necessários?**

Ela definirá documentação mínima suficiente, checkpoint vs log bruto, decisões vs conversas, handoff compacto, deduplicação, versionamento, GitHub como memória institucional, banco/event store para estado vivo e artifacts para evidências pesadas.

---

# 7. Princípios consolidados

1. `AGENTE != MODELO`;
2. memória não substitui evidência;
3. ausência de prova não vira certeza operacional;
4. `CAPABILITY != AUTHORITY`;
5. `AGENT OUTPUT != PROJECT TRUTH`;
6. `UNKNOWN_AUTHORITY = DENY`;
7. routing/fallback preserva requisitos mínimos;
8. `UNKNOWN_CAPABILITY = NOT_COMPATIBLE`;
9. `INDEPENDENCE != DIVERSITY`;
10. `CONSENSUS != TRUTH`;
11. assurance é proporcional ao risco;
12. `TASK != AGENT`;
13. paralelismo não autoriza mutações conflitantes sem coordenação;
14. replanning não reescreve história nem amplia autoridade;
15. loops e decomposição são limitados por orçamento/progresso;
16. `GRAPH_EXHAUSTION != MISSION_COMPLETION`;
17. complexidade só permanece se resolver problema real.

---

# 8. Blocos ainda a decidir

Q8–Q16 ainda decidirão:

- documentação/estado persistente;
- observabilidade/UX;
- Core vs factories/plugins/perfis;
- infraestrutura/placement;
- segurança/gates/permissões;
- métricas e custo-benefício;
- portabilidade/validação externa;
- simplificação/remoção;
- arquitetura final e GO/NO-GO.

---

# 9. Critérios para iniciar implementação da Fase 1

Pré-condições:

1. Q1–Q16 concluídas;
2. decisões contraditórias conciliadas;
3. arquitetura alvo documentada;
4. `PRESERVE / MODIFY / SIMPLIFY / REMOVE / ADD` definidos;
5. métricas definidas;
6. plano de migração definido;
7. backward compatibility definida;
8. critérios de aceite definidos;
9. riscos e rollback definidos;
10. LEANDRO aprova a especificação final.

Só então gerar missão estruturada para executor/Codex.

---

# 10. Regra de continuidade

Antes de encerrar sessão relevante: registrar decisões/hipóteses/estado live, criar ou atualizar checkpoint, registrar `last_completed_question`/`next_question`, atualizar Resume Card e fazer read-back do GitHub.

---

# 11. Ponto exato de retomada

```yaml
phase_zero:
  state: COMPLETE_IN_MAIN
  terminal_main: b91823a947715e09d69c72999e2278523f2259be

phase_one_discovery:
  state: ACTIVE_DISCOVERY
  last_completed_question: 7
  next_question: 8
  Q8_started: false

implementation_authorized: false
next_human_action_for_discovery: LEANDRO_AND_MESTRE_START_Q8
next_operational_action: NONE_BEFORE_Q8_DECISION
```

Um novo chat deve reconstruir o estado lendo:

1. `MCF-NEXTGEN-RESUME-CARD.md`;
2. `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009.md`;
3. `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`;
4. este `MCF-MASTER-ROADMAP-001.md`;
5. GitHub/provider live para estado mutável;
6. checkpoints anteriores quando necessário.
