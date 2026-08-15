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

Objetivo: construir uma primeira geração completa o suficiente para descobrir empiricamente problemas reais de multiagentes, memória, governança, execução, observabilidade, segurança e publicação.

**Estado:** `COMPLETE_IN_MAIN`.

Boundary terminal da missão `MCF-PHASE-0-FINALIZATION-001`: `main@b91823a947715e09d69c72999e2278523f2259be`, PR #136 merged, Issue #135 closed, P0/P1/P2 = 0/0/0, CI pós-merge PASS, RC3 terminal NOOP PASS e Production Health PASS.

## FASE 1 — Reestruturar com o que aprendemos

Nome canônico: **MCF — Fase 1: Reestruturação e Evolução Pós-v1**  
Nome curto: **MCF NextGen**

Objetivo: preservar o que funciona, corrigir o que funciona mal, simplificar excessos, remover complexidade sem valor comprovado e preencher lacunas descobertas na Fase Zero.

**Estado:** `ACTIVE_DISCOVERY`. Arquitetura final, protótipo e implementação continuam não autorizados.

## FASE 2 — Provar e generalizar

Objetivo: provar empiricamente o valor da arquitetura reestruturada, comparar com baselines simples, testar portabilidade e preparar generalização apenas quando houver evidência suficiente.

---

# 2. Roadmap macro

```text
FASE ZERO — CONSTRUIR PARA APRENDER
│
├── Z0.1 Fundação e governança                  ✅
├── Z0.2 Agentes / skills / handoffs            ✅
├── Z0.3 Runtime executável                     ✅
├── Z0.4 Gates C / D / E                        ✅
├── Z0.5 Production Readiness                   ✅
├── Z0.6 Produção RC                            ✅
├── Z0.7 RC1 → RC2 → RC3                       ✅
├── Z0.8 Boundary stable v1.0.0                 ✅
├── Z0.9 Reconciliação documental final         ✅
└── Z0.10 Encerramento formal                   ✅ COMPLETE_IN_MAIN

FASE 1 — REESTRUTURAR COM O QUE APRENDEMOS
│
├── F1.1 Discovery guiado                       🔍 ACTIVE_DISCOVERY
├── F1.2 Questionário Q1–Q16                    🔍 Q1–Q5 ✅ | Q6 próxima
├── F1.3 Consolidação das decisões              ⏳
├── F1.4 Arquitetura alvo                       ⏳
├── F1.5 Plano de migração                      ⏳
├── F1.6 Especificação executável               ⏳
├── F1.7 Entrega estruturada ao executor        ⏳
├── F1.8 Implementação da reestruturação        ⏳ NÃO AUTORIZADA
├── F1.9 Validação técnica e regressão          ⏳
└── F1.10 Release reestruturada                 ⏳

FASE 2 — PROVAR E GENERALIZAR
│
├── F2.1 Benchmarks baseline                    ⏳
├── F2.2 Continuity Recovery Tests              ⏳
├── F2.3 Testes multi-model/provider            ⏳
├── F2.4 Cold-start outro humano/IA             ⏳
├── F2.5 Ablation agentes/controles             ⏳
├── F2.6 Portabilidade infraestrutura           ⏳
├── F2.7 UX externo                             ⏳
└── F2.8 Decisão generalização/produto          ⏳
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

Snapshots anteriores que mostrem estado diferente devem ser lidos como `HISTORICAL`, não como estado atual.

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
  Q6: NEXT_NOT_STARTED
```

A aprovação de perguntas de Discovery não autoriza implicitamente implementação.

---

# 5. Decisões de Discovery consolidadas

## Q1 — Finalidade

- sistema pessoal de trabalho com IA para LEANDRO como foco inicial;
- continuidade durável de projetos como problema central;
- ChatGPT/MESTRE inicialmente como camada cognitiva superior;
- equipes de agentes especializados;
- provar no uso real de LEANDRO antes de generalizar.

## Q2 — Continuidade

LEANDRO aprovou `LAYERED_CONTINUITY_ARCHITECTURE`.

Componentes: Framework Memory, Project Memory, Live Operational Memory, Evidence/Raw Archive, Continuity Builder e Project Capsule derivado/versionado.

Invariantes:

```text
MEMÓRIA ajuda a reconstruir.
EVIDÊNCIA prova o que aconteceu.
AUTORIDADE define o que vale.
ESTADO LIVE define onde estamos agora.
UNKNOWN permanece UNKNOWN sem evidência.
```

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

## Q3 — Agente MCF

LEANDRO aprovou `Agent Contract`.

Invariantes:

```text
AGENTE != MODELO
CAPABILITY != AUTHORITY
IDENTITY CONTINUITY != CAPABILITY CONTINUITY
AGENT OUTPUT != PROJECT TRUTH
```

Lifecycle e independência são propriedades separadas de agenthood.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md`.

## Q4 — Autonomia

LEANDRO aprovou `MISSION-BOUNDED + RISK-BASED AUTONOMY`.

Princípios:

- `Authority Envelope`;
- `UNKNOWN_AUTHORITY = DENY`;
- autoelevação proibida;
- conteúdo externo não amplia autoridade;
- risco não depende exclusivamente do executor;
- risco cumulativo;
- retries limitados/idempotentes quando aplicável;
- revogação/emergency stop;
- `TEAM_FIRST`;
- R3/crítico → HUMAN_GATE exclusivamente de LEANDRO.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`.

## Q5 — Model Router

LEANDRO aprovou `CAPABILITY_AND_POLICY_BASED_ROUTER`.

Princípios:

- requisitos da tarefa antes da seleção do modelo;
- hard requirements são filtros obrigatórios;
- router não pode reduzir hard requirements;
- `UNKNOWN_CAPABILITY = NOT_COMPATIBLE`;
- model self-claim não é evidência;
- Model Capability Registry com proveniência/freshness/health;
- custo, latência e quota são preferências após compatibilidade;
- fallback só para modelo compatível;
- silent capability downgrade proibido;
- fallbacks limitados e sem loops;
- nenhum candidato compatível → `BLOCKED / ESCALATE`;
- routing receipt auditável.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md`.

---

# 6. Discovery da Fase 1

Branch de planejamento:

`planning/mcf-nextgen-discovery`

Estado:

```yaml
questionnaire_total: 16
last_completed_question: 5
next_question: 6
Q6_started: false
implementation_authorized: false
architecture_final_approved: false
```

Próxima pergunta:

> **Q6 — O que significa independência entre agentes e revisores?**

Ela definirá separação funcional, contexto/sessão, modelo, provider, autoridade, evidência e critérios mínimos para chamar uma revisão de independente.

---

# 7. Princípios consolidados

1. `AGENTE != MODELO`;
2. memória não substitui evidência;
3. ausência de prova não vira certeza operacional;
4. `CAPABILITY != AUTHORITY`;
5. `AGENT OUTPUT != PROJECT TRUTH`;
6. `UNKNOWN_AUTHORITY = DENY`;
7. agentes não ampliam a própria autoridade;
8. routing/fallback deve preservar requisitos mínimos;
9. `UNKNOWN_CAPABILITY = NOT_COMPATIBLE`;
10. custo/free tier não supera segurança/capacidade;
11. múltiplos projetos devem ter memória/equipe/estado isolados;
12. complexidade só permanece se resolver problema real.

---

# 8. Blocos ainda a decidir

Q6–Q16 ainda decidirão:

- independência/auditoria;
- graph/loops/paralelismo;
- documentação mínima suficiente;
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
5. métricas de comparação definidas;
6. plano de migração definido;
7. backward compatibility definida;
8. critérios de aceite definidos;
9. riscos e rollback definidos;
10. LEANDRO aprova a especificação final.

Só então gerar missão estruturada para executor/Codex.

---

# 10. Fase 2 — prova de valor

Comparar empiricamente o MCF reestruturado com workflows mais simples usando métricas como tempo, custo/tokens, retrabalho, defeitos, intervenção humana, contexto perdido, tempo de retomada, recovery e qualidade final.

Testes candidatos:

- Continuity Recovery Test;
- novo chat sem histórico bruto;
- outro modelo/provider;
- outro humano/executor;
- projetos paralelos;
- ablation de agentes/controles;
- portabilidade de infraestrutura.

---

# 11. Regra de continuidade

Antes de encerrar sessão relevante:

1. identificar decisões novas;
2. identificar hipóteses abertas;
3. registrar estado live relevante;
4. atualizar/criar checkpoint;
5. registrar `last_completed_question` e `next_question`;
6. atualizar Resume Card;
7. fazer read-back do GitHub;
8. só então considerar a sessão segura para retomada.

---

# 12. Ponto exato de retomada

```yaml
phase_zero:
  state: COMPLETE_IN_MAIN
  terminal_main: b91823a947715e09d69c72999e2278523f2259be

phase_one_discovery:
  state: ACTIVE_DISCOVERY
  last_completed_question: 5
  next_question: 6
  Q6_started: false

implementation_authorized: false
next_human_action_for_discovery: LEANDRO_AND_MESTRE_START_Q6
next_operational_action: NONE_BEFORE_Q6_DECISION
```

Um novo chat deve reconstruir o estado lendo:

1. `MCF-NEXTGEN-RESUME-CARD.md`;
2. `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md`;
3. `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`;
4. este `MCF-MASTER-ROADMAP-001.md`;
5. GitHub/provider live para estado mutável;
6. checkpoints anteriores quando histórico adicional for necessário.
