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

Nome canônico: **MCF — Fase 1: Reestruturação e Evolução Pós-v1**  
Nome curto: **MCF NextGen**

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
├── F1.2 Questionário Q1–Q16                    🔍 Q1 ✅ | Q2 ✅ | Q3 ✅ | Q4 ✅ | Q5 próxima
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
  Q5: NEXT_NOT_STARTED
```

A aprovação das perguntas de Discovery não concede autorização implícita para reestruturar runtime ou implementar hipóteses NextGen.

---

# 5. Decisões de Discovery já consolidadas

## Q1 — finalidade principal

- sistema pessoal de trabalho com IA para LEANDRO como foco inicial;
- continuidade durável de projetos como problema central;
- ChatGPT/MESTRE inicialmente como camada cognitiva superior;
- equipes de agentes especializados;
- provar e amadurecer primeiro no uso real de LEANDRO;
- generalização e produto comercial ficam posteriores à prova de valor.

## Q2 — continuidade de contexto

LEANDRO aprovou conceitualmente a `LAYERED_CONTINUITY_ARCHITECTURE`.

Componentes:

- Framework Memory;
- Project Memory;
- Live Operational Memory;
- Evidence / Raw Archive;
- Continuity Builder;
- Project Capsule derivado/versionado para retomada.

Invariantes:

```text
MEMÓRIA ajuda a reconstruir.
EVIDÊNCIA prova o que aconteceu.
AUTORIDADE define o que vale.
ESTADO LIVE define onde estamos agora.
```

O `Project Capsule` NÃO é fonte de verdade. Estado live deve ser revalidado. Ausência de evidência permanece `UNKNOWN`. Hipóteses não podem ser promovidas silenciosamente a fatos. Decisões e ações críticas exigem verificação/gates proporcionais ao risco. Continuidade deve ser comprovada empiricamente por `Continuity Recovery Test`/cold-start.

Checkpoint canônico: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

## Q3 — agente de verdade no MCF

LEANDRO aprovou conceitualmente o `Agent Contract` como base de classificação de um agente MCF.

Definição consolidada:

> Um agente MCF é uma entidade operacional identificável que possui identidade, papel, objetivos, capacidades, limites de autoridade, contratos de entrada e saída, política de decisão e rastreabilidade próprias, podendo usar diferentes modelos, ferramentas e ambientes de execução sem que esses componentes constituam sua identidade.

Invariantes:

```text
AGENTE != MODELO
CAPABILITY != AUTHORITY
IDENTITY CONTINUITY != CAPABILITY CONTINUITY
AGENT OUTPUT != PROJECT TRUTH
```

- persona/nome/instruções não bastam para satisfazer o `Agent Contract`;
- lifecycle é separado de agenthood (`EPHEMERAL`, `SESSION`, `PROJECT`, `PERSISTENT`);
- independência é separada de agenthood e será formalizada na Q6;
- troca de modelo exige capability validation aplicável;
- agentes não devem manter cópias concorrentes não governadas da verdade do projeto;
- output de agente só vira fato/estado/decisão oficial conforme evidência e autoridade aplicáveis.

Checkpoint canônico: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md`.

## Q4 — autonomia dos agentes

LEANDRO aprovou conceitualmente `MISSION-BOUNDED + RISK-BASED AUTONOMY`.

Princípios:

- missões relevantes possuem `Authority Envelope` conceitualmente explícito;
- autonomia existe apenas dentro do envelope de objetivo, ações, recursos, risco e gates;
- `CAPABILITY != AUTHORITY`;
- `UNKNOWN_AUTHORITY = DENY`;
- autoelevação de privilégio é proibida;
- conteúdo externo não pode expandir autoridade;
- estado live deve ser revalidado antes de ação material;
- risco não deve depender exclusivamente do executor;
- risco cumulativo por sequência precisa ser considerado;
- retries são limitados e idempotentes quando aplicável;
- revogação/emergency stop é requisito;
- equipe tenta recovery técnico antes de envolver LEANDRO (`TEAM_FIRST`);
- ações críticas/R3 exigem `HUMAN_GATE` exclusivamente de LEANDRO.

Taxonomia conceitual:

```yaml
R0_LOW: EXECUTE_WITHIN_ENVELOPE
R1_MEDIUM: EXECUTE_WITH_VERIFICATION_AND_EVIDENCE
R2_HIGH: REQUIRE_TECHNICAL_GATE_OR_DUAL_VERIFICATION
R3_CRITICAL: REQUIRE_HUMAN_GATE_LEANDRO
```

Detalhes concretos de Policy Engine, segurança, permissões e gates ficam para perguntas posteriores, especialmente Q12.

Checkpoint canônico: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`.

---

# 6. Discovery da Fase 1

Branch de planejamento:

`planning/mcf-nextgen-discovery`

Estado:

```yaml
questionnaire_total: 16
last_completed_question: 4
next_question: 5
Q5_started: false
implementation_authorized: false
architecture_final_approved: false
```

Próxima pergunta:

> **Q5 — Como deve funcionar o Roteador de Modelos de IA?**

Ela definirá modelo preferencial e fallbacks, quotas, custo, qualidade mínima, contexto, coding/reasoning/vision/tools, troca de modelo sem perda de identidade/estado e políticas de provider/indisponibilidade.

---

# 7. Tese de produto em estudo

O MCF pretende permitir que LEANDRO transforme ideias em projetos executados por equipes de agentes, preservando memória, decisões, evidências, estado e continuidade de modo que projetos possam ser interrompidos, delegados e retomados sem dependência da memória humana, do contexto de um chat, de um modelo específico ou de uma equipe específica.

Princípios consolidados ou fortemente aceitos:

1. `AGENTE != MODELO`;
2. GitHub permanece uma base forte de memória institucional;
3. ChatGPT/MESTRE atua inicialmente como camada cognitiva superior/orquestradora;
4. modelos externos podem executar papéis especializados;
5. roteamento/fallback deve preservar identidade e estado do agente quando houver capability compatibility;
6. autonomia operacional não substitui autoridade humana;
7. HUMAN_GATE deve ser distinguido de dependência operacional humana;
8. complexidade interna deve produzir simplicidade operacional externa;
9. múltiplos projetos devem ter memória/equipe/estado isolados;
10. documentação deve preservar conhecimento, não repetir conversa indefinidamente;
11. provider capability deve ser validada antes de virar requisito de governança;
12. nenhuma complexidade é preservada apenas porque já existe;
13. memória não substitui evidência;
14. ausência de prova não deve ser convertida em certeza operacional;
15. `CAPABILITY != AUTHORITY`;
16. `AGENT OUTPUT != PROJECT TRUTH`;
17. `UNKNOWN_AUTHORITY = DENY`;
18. agentes não podem ampliar a própria autoridade.

---

# 8. Blocos arquitetônicos ainda a decidir

Q5–Q16 ainda decidirão:

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

A reestruturação grande NÃO deve começar apenas porque Q1–Q4 foram concluídas.

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

A Fase 2 deverá comparar empiricamente o MCF reestruturado com workflows mais simples.

Métricas candidatas:

- tempo total;
- tokens/custo;
- retrabalho;
- defeitos escapados;
- intervenção humana;
- contexto perdido;
- tempo de retomada;
- recuperação;
- qualidade final;
- satisfação operacional de LEANDRO.

Testes candidatos:

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
  last_completed_question: 4
  next_question: 5
  Q5_started: false

implementation_authorized: false
next_human_action_for_discovery: LEANDRO_AND_MESTRE_START_Q5
next_operational_action: NONE_BEFORE_Q5_DECISION
```

Um novo chat deve reconstruir o estado lendo:

1. `MCF-NEXTGEN-RESUME-CARD.md`;
2. `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`;
3. `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`;
4. este `MCF-MASTER-ROADMAP-001.md`;
5. GitHub/provider live para estado mutável;
6. checkpoints anteriores quando histórico adicional for necessário.
