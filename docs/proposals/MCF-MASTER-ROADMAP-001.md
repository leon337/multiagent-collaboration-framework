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
├── F1.2 Questionário Q1–Q16                    🔍 Q1–Q8 ✅ | Q9 próxima
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
  Q8: COMPLETED_APPROVED_BY_LEANDRO
  Q9: NEXT_NOT_STARTED
```

A aprovação de perguntas de Discovery não autoriza implicitamente implementação.

---

# 5. Decisões de Discovery consolidadas

## Q1 — Finalidade
Sistema pessoal de trabalho com IA para LEANDRO como foco inicial; continuidade durável; provar no uso real antes de generalizar.

## Q2 — Continuidade
`LAYERED_CONTINUITY_ARCHITECTURE`; memória, evidência, autoridade e estado live separados; Project Capsule derivado; `UNKNOWN` permanece `UNKNOWN`; cold-start/Continuity Recovery Test.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

## Q3 — Agente MCF
`Agent Contract`; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY`; `AGENT OUTPUT != PROJECT TRUTH`.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md`.

## Q4 — Autonomia
`MISSION-BOUNDED + RISK-BASED AUTONOMY`; `Authority Envelope`; `UNKNOWN_AUTHORITY = DENY`; HUMAN_GATE exclusivamente de LEANDRO em R3/crítico.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`.

## Q5 — Model Router
`CAPABILITY_AND_POLICY_BASED_ROUTER`; hard requirements obrigatórios; `UNKNOWN_CAPABILITY = NOT_COMPATIBLE`; fallback compatível/limitado; routing receipt.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md`.

## Q6 — Independência e assurance
`INDEPENDENCE != DIVERSITY`; R2+ exige contexto separado, `BLIND_FIRST`, evidência/decisão próprias e receipt; `CONSENSUS != TRUTH`; assurance R0–R4 por risco.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-008.md`.

## Q7 — Orquestração
`HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`; outer graph acíclico; loops isolados/limitados; paralelismo dependency-safe; joins; replanning versionado; Complexity Budget; staleness control; Completion Contract.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009.md`.

## Q8 — Persistência e documentação
LEANDRO aprovou `LAYERED_CANONICAL_PERSISTENCE`.

Princípios:

- camadas lógicas: canonical knowledge, operational state, transition ledger, evidence e derived views;
- camadas lógicas não exigem cinco sistemas físicos;
- `ONE CLAIM CLASS -> ONE AUTHORITATIVE RESOLUTION POLICY`;
- live operational state não é documentação;
- conversas não são project truth;
- derived views são regeneráveis e possuem freshness;
- transições oficiais não podem existir pela metade: estado + transition ledger exigem atomicidade ou garantia equivalente;
- full Event Sourcing não é obrigatório;
- snapshots/checkpoints são ancorados em versões/cursors;
- evidências materiais exigem integridade/proveniência;
- retenção e Raw Archive são governados; não existe `store everything forever`;
- secrets não são promovidos para memória geral;
- schema versioning, supersession lineage e provenance de aprovação humana são requisitos;
- backup só é confiável com restorability testada;
- tecnologias concretas, RPO/RTO, placement e enforcement técnico ficam para Q11/Q12/Q16;
- reutilizar mecanismos atuais quando satisfizerem invariantes, evitando duplicação de infraestrutura.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-010.md`.

---

# 6. Discovery da Fase 1

Branch:

`planning/mcf-nextgen-discovery`

```yaml
questionnaire_total: 16
last_completed_question: 8
next_question: 9
Q9_started: false
implementation_authorized: false
architecture_final_approved: false
```

Próxima pergunta:

> **Q9 — Como deve ser a experiência humana e a observabilidade?**

Ela definirá timeline dos agentes, Central de Perguntas e Decisões, dashboard de projetos, estados/bloqueios/próxima ação, perguntas guiadas, nível de detalhe, visualização do trabalho e simplicidade para usuário não técnico.

---

# 7. Princípios consolidados

1. `AGENTE != MODELO`;
2. memória não substitui evidência;
3. ausência de prova não vira certeza operacional;
4. `CAPABILITY != AUTHORITY`;
5. `AGENT OUTPUT != PROJECT TRUTH`;
6. `UNKNOWN_AUTHORITY = DENY`;
7. `INDEPENDENCE != DIVERSITY`;
8. `CONSENSUS != TRUTH`;
9. `TASK != AGENT`;
10. replanning não reescreve história nem amplia autoridade;
11. loops/decomposição são limitados;
12. `GRAPH_EXHAUSTION != MISSION_COMPLETION`;
13. `LIVE_OPERATIONAL_STATE != DOCUMENTATION`;
14. `DERIVED_VIEW != SOURCE_OF_TRUTH`;
15. transições oficiais exigem consistência durável;
16. `BACKUP_EXISTS != RECOVERY_WORKS`;
17. complexidade só permanece se resolver problema real.

---

# 8. Blocos ainda a decidir

Q9–Q16 ainda decidirão:

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

Pré-condições: Q1–Q16 concluídas; contradições conciliadas; arquitetura alvo; `PRESERVE / MODIFY / SIMPLIFY / REMOVE / ADD`; métricas; plano de migração; backward compatibility; critérios de aceite; riscos/rollback; aprovação final de LEANDRO.

---

# 10. Regra de continuidade

Antes de encerrar sessão relevante: registrar decisões/hipóteses/estado live, criar/atualizar checkpoint, registrar `last_completed_question`/`next_question`, atualizar Resume Card e fazer read-back.

---

# 11. Ponto exato de retomada

```yaml
phase_zero:
  state: COMPLETE_IN_MAIN
  terminal_main: b91823a947715e09d69c72999e2278523f2259be

phase_one_discovery:
  state: ACTIVE_DISCOVERY
  last_completed_question: 8
  next_question: 9
  Q9_started: false

implementation_authorized: false
next_human_action_for_discovery: LEANDRO_AND_MESTRE_START_Q9
next_operational_action: NONE_BEFORE_Q9_DECISION
```

Um novo chat deve reconstruir o estado lendo:

1. `MCF-NEXTGEN-RESUME-CARD.md`;
2. `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-010.md`;
3. `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`;
4. este `MCF-MASTER-ROADMAP-001.md`;
5. GitHub/provider live para estado mutável;
6. checkpoints anteriores quando necessário.
