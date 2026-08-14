# MCF — Master Roadmap

**ID:** `MCF-MASTER-ROADMAP-001`  
**Status:** `ACTIVE_ROADMAP`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Escopo:** visão macro do MCF desde a Fase Zero até a reestruturação e validação futura.  
**Regra:** estados live devem sempre ser revalidados no GitHub; SHAs abaixo são referências de boundaries/checkpoints e não substituem read-back live.

---

# 1. Modelo didático de fases

## FASE ZERO — Construir para aprender

Objetivo: construir uma primeira geração suficientemente completa para descobrir empiricamente os problemas reais de desenvolvimento multiagente, memória, governança, execução, observabilidade, segurança e publicação.

**Estado:** `COMPLETE_IN_MAIN`.

Boundary terminal da missão `MCF-PHASE-0-FINALIZATION-001`: `main@b91823a947715e09d69c72999e2278523f2259be`, PR #136 merged, Issue #135 closed, P0/P1/P2 = 0/0/0, CI pós-merge PASS, RC3 terminal NOOP PASS e Production Health PASS.

## FASE 1 — Reestruturar com o que aprendemos

Nome canônico:

**MCF — Fase 1: Reestruturação e Evolução Pós-v1**

Nome curto:

**MCF NextGen**

Objetivo: preservar o que funciona, corrigir o que funciona mal, simplificar excessos, remover complexidade sem valor comprovado e preencher lacunas descobertas na Fase Zero.

**Estado:** `ACTIVE_DISCOVERY`. Arquitetura final, protótipo e implementação continuam não autorizados.

## FASE 2 — Provar e generalizar

Objetivo: provar empiricamente o valor da arquitetura reestruturada, comparar com baselines mais simples, testar portabilidade e preparar generalização para terceiros apenas quando houver evidência suficiente.

---

# 2. Roadmap macro

```text
FASE ZERO — CONSTRUIR PARA APRENDER
│
├── Z0.1 Fundação e governança                  ✅ concluída
├── Z0.2 Agentes / skills / handoffs            ✅ construídos/experimentados
├── Z0.3 Runtime executável                     ✅ implementado
├── Z0.4 Gates C / D / E                        ✅ concluídos
├── Z0.5 Production Readiness                   ✅ concluído
├── Z0.6 Produção RC                            ✅ concluída
├── Z0.7 RC1 → RC2 → RC3                       ✅ concluído
├── Z0.8 Boundary stable v1.0.0                 ✅ concluído
├── Z0.9 Reconciliação documental final         ✅ concluída
└── Z0.10 Encerramento formal da Fase Zero      ✅ COMPLETE_IN_MAIN

FASE 1 — REESTRUTURAR COM O QUE APRENDEMOS
│
├── F1.1 Discovery guiado                       🔍 ACTIVE_DISCOVERY
├── F1.2 Questionário Q1–Q16                    🔍 Q1 concluída / Q2 próxima
├── F1.3 Consolidação das decisões              ⏳
├── F1.4 Arquitetura alvo                       ⏳
├── F1.5 Plano de migração                      ⏳
├── F1.6 Especificação executável               ⏳
├── F1.7 Entrega estruturada ao Codex/executor  ⏳
├── F1.8 Implementação da reestruturação        ⏳ NÃO AUTORIZADA
├── F1.9 Validação técnica e regressão          ⏳
└── F1.10 Release da geração reestruturada      ⏳

FASE 2 — PROVAR E GENERALIZAR
│
├── F2.1 Benchmarks contra baseline simples     ⏳
├── F2.2 Continuity Recovery Tests              ⏳
├── F2.3 Testes multi-model/provider            ⏳
├── F2.4 Cold-start por outro humano/IA         ⏳
├── F2.5 Ablation de agentes/controles          ⏳
├── F2.6 Portabilidade de infraestrutura        ⏳
├── F2.7 UX para usuário externo                ⏳
└── F2.8 Decisão de generalização/produto       ⏳
```

---

# 3. Boundary terminal da Fase Zero

Referência temporal: 2026-08-14. Revalidar estado mutável antes de afirmar que continua igual.

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

A Fase Zero não possui blocker material remanescente no boundary terminal. Snapshots anteriores que mostrem stable ausente, PR #133 aberto, PR #134 pendente ou Fase Zero em fechamento são evidência histórica e não devem ser usados como estado atual.

---

# 4. Transição para a Fase 1

A conclusão da Fase Zero libera somente a continuidade do **Discovery e Planejamento** já aprovado como estágio de estudo.

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
  Q2: NEXT_NOT_STARTED
```

Não existe autorização implícita para reestruturar runtime, criar Project Capsule, model routing, DAG/paralelismo, Interaction Center ou qualquer outra hipótese NextGen.

---

# 5. Reconciliação documental da transição

A transição deve preservar a diferença entre histórico e estado atual:

- checkpoints 001/002 permanecem como evidência histórica de seus momentos;
- `MCF-NEXTGEN-RESUME-CARD.md` é artefato atual e deve refletir o boundary terminal da Fase Zero;
- este Master Roadmap é artefato atual e deve refletir a entrada em Fase 1 Discovery;
- `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md` continua válido: Q1 concluída, Q2 não iniciada;
- `docs/MCF-CURRENT-STATE.md` na `main` continua sendo mapa de capacidades implementadas e mantém NextGen como `UNDER_STUDY`; essa classificação é compatível com `ACTIVE_DISCOVERY` e não equivale a implementação.

Checkpoint canônico desta passagem: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-003.md`.

---

# 6. Discovery da Fase 1

O discovery é separado da implementação e não altera a v1 atual.

Branch de planejamento:

`planning/mcf-nextgen-discovery`

Objetivo:

- preservar decisões estratégicas;
- responder questionário canônico;
- transformar erros/acertos da Fase Zero em requisitos reais;
- impedir que o planejamento dependa de memória de chat;
- produzir arquitetura e plano antes de Codex/executor reestruturar o MCF.

Estado:

```yaml
questionnaire_total: 16
Q1: COMPLETED
Q2: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
```

---

# 7. Tese de produto em estudo

O MCF pretende permitir que LEANDRO transforme ideias em projetos executados por equipes de agentes, preservando memória, decisões, evidências, estado e continuidade de modo que projetos possam ser interrompidos, delegados e retomados sem dependência da memória humana, do contexto de um chat, de um modelo específico ou de uma equipe específica.

Princípios já consolidados ou fortemente aceitos:

1. `AGENTE != MODELO`;
2. GitHub permanece uma base forte de memória institucional;
3. ChatGPT/MESTRE atua inicialmente como camada cognitiva superior/orquestradora;
4. modelos externos podem executar papéis especializados;
5. roteamento/fallback deve preservar identidade e estado do agente;
6. autonomia operacional não substitui autoridade humana;
7. HUMAN_GATE deve ser distinguido de dependência operacional humana;
8. complexidade interna deve produzir simplicidade operacional externa;
9. múltiplos projetos devem ter memória/equipe/estado isolados;
10. documentação deve preservar conhecimento, não repetir conversa indefinidamente;
11. provider capability deve ser validada antes de virar requisito de governança;
12. nenhuma complexidade é preservada apenas porque já existe.

---

# 8. Blocos arquitetônicos a decidir na Fase 1

O questionário Q1–Q16 decidirá:

- propósito e usuário prioritário;
- memória e continuidade;
- definição real de agente;
- autonomia;
- model routing;
- independência/auditoria;
- graph/loops/paralelismo;
- documentação mínima suficiente;
- observabilidade/UX;
- Core versus factories/plugins/perfis;
- infraestrutura/placement;
- segurança/gates/permissões;
- métricas e custo-benefício;
- portabilidade/validação externa;
- simplificação/remoção;
- arquitetura final e GO/NO-GO.

---

# 9. Critérios para iniciar implementação da Fase 1

A reestruturação grande NÃO deve começar apenas porque a Fase Zero foi concluída.

Pré-condições:

1. questionário Q1–Q16 concluído;
2. decisões contraditórias conciliadas;
3. arquitetura alvo documentada;
4. itens `PRESERVE / MODIFY / SIMPLIFY / REMOVE / ADD` definidos;
5. métricas de comparação definidas;
6. plano de migração definido;
7. limites de backward compatibility definidos;
8. critérios de aceite definidos;
9. riscos e rollback definidos;
10. LEANDRO aprova a especificação da reestruturação.

Só então gerar missão estruturada para Codex/executor.

---

# 10. Fase 2 — prova de valor

A Fase 2 deverá responder empiricamente:

```text
MCF reestruturado
versus
workflow mais simples

QUAL PRODUZ MELHOR RESULTADO?
POR QUANTO?
A QUE CUSTO?
```

Métricas mínimas candidatas:

- tempo total;
- tokens/custo;
- retrabalho;
- defeitos escapados;
- intervenção humana;
- contexto perdido;
- tempo de retomada;
- quantidade de recuperação;
- qualidade final;
- satisfação operacional de LEANDRO.

Testes obrigatórios candidatos:

- Continuity Recovery Test;
- novo chat sem histórico bruto;
- outro modelo/provider;
- outro humano/executor;
- projetos distintos em paralelo;
- ablation de agentes/controles;
- portabilidade de infraestrutura.

---

# 11. Regra de continuidade

Antes de encerrar qualquer sessão relevante:

1. identificar decisões novas;
2. identificar hipóteses ainda abertas;
3. registrar estado live relevante;
4. atualizar ou criar checkpoint;
5. registrar `last_completed_question` e `next_question`;
6. gerar/atualizar Resume Card;
7. fazer read-back do GitHub;
8. somente então considerar a sessão encerrada com segurança.

---

# 12. Ponto exato de retomada

```yaml
phase_zero:
  state: COMPLETE_IN_MAIN
  terminal_main: b91823a947715e09d69c72999e2278523f2259be

phase_one_discovery:
  state: ACTIVE_DISCOVERY
  last_completed_question: 1
  next_question: 2
  Q2_started: false

implementation_authorized: false
next_human_action_for_discovery: LEANDRO_AND_MESTRE_START_Q2
next_operational_action: NONE_BEFORE_Q2_DECISION
```

Um novo chat deve reconstruir o estado lendo:

1. `MCF-NEXTGEN-RESUME-CARD.md`;
2. `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-003.md`;
3. `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`;
4. este `MCF-MASTER-ROADMAP-001.md`;
5. `docs/MCF-CURRENT-STATE.md` na `main`;
6. GitHub/provider live para estado mutável.
