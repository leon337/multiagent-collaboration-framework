# MCF — Master Roadmap

**ID:** `MCF-MASTER-ROADMAP-001`  
**Status:** `ACTIVE_ROADMAP`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Escopo:** visão macro do MCF desde a Fase Zero até a reestruturação e validação futura.  
**Regra:** estados live devem sempre ser revalidados no GitHub; SHAs abaixo são referências do checkpoint, não substituem read-back live.

---

# 1. Modelo didático de fases

## FASE ZERO — Construir para aprender

Objetivo: construir uma primeira geração suficientemente completa para descobrir empiricamente os problemas reais de desenvolvimento multiagente, memória, governança, execução, observabilidade, segurança e publicação.

## FASE 1 — Reestruturar com o que aprendemos

Nome canônico:

**MCF — Fase 1: Reestruturação e Evolução Pós-v1**

Nome curto:

**MCF NextGen**

Objetivo: preservar o que funciona, corrigir o que funciona mal, simplificar excessos, remover complexidade sem valor comprovado e preencher lacunas descobertas na Fase Zero.

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
├── Z0.6 Produção RC                            ✅ RC3 live
├── Z0.7 RC1 → RC2 → RC3                       ✅ concluído
├── Z0.8 Boundary stable v1.0.0                 🔧 EM CORREÇÃO
├── Z0.9 Reconciliação documental final         ⏸ preparada, aguardando stable
└── Z0.10 Encerramento formal da Fase Zero      ⏳ pendente

FASE 1 — REESTRUTURAR COM O QUE APRENDEMOS
│
├── F1.1 Discovery guiado                       🔍 EM CURSO
├── F1.2 Questionário Q1–Q16                    🔍 Q1 concluída / Q2 próxima
├── F1.3 Consolidação das decisões              ⏳
├── F1.4 Arquitetura alvo                       ⏳
├── F1.5 Plano de migração                      ⏳
├── F1.6 Especificação executável               ⏳
├── F1.7 Entrega estruturada ao Codex/executor  ⏳
├── F1.8 Implementação da reestruturação        ⏳
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

# 3. Estado operacional live de referência no momento deste roadmap

Referência temporal: 2026-08-14, sessão de discovery.

```yaml
main_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
rc3_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
main_equals_rc3: true

stable_v1_0_0:
  tag: ABSENT_AT_LAST_READBACK
  release: ABSENT_AT_LAST_READBACK
  human_gate: NOT_APPROVED

pr_133:
  purpose: stable publication control plane
  state: OPEN
  merge: NOT_EXECUTED
  observed_head: 5875c459128e849fa76b735fb33f0c45a8355b20
  architecture: IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF
  publication_P0: 0
  publication_P1: 2
  publication_P2: 0
  ready_for_human_gate: false

pr_134:
  purpose: documentation reconciliation
  state: OPEN
  merge: NOT_EXECUTED
  observed_head: c8d2696a419f0781f3417ff8fa95149f031f9654
  dependency: wait_for_stable_boundary

nextgen_planning_branch:
  ref: planning/mcf-nextgen-discovery
  purpose: isolated durable discovery/planning
```

### Interpretação

A Fase Zero está tecnicamente madura, porém não encerrada. O ponto atual não é desenvolver novas funcionalidades no core; é fechar corretamente o boundary estável e reconciliar a documentação final sem contaminar RC3.

---

# 4. Boundary atual — stable v1.0.0

A stable NÃO está autorizada.

Invariantes:

```yaml
LEANDRO: final_human_authority
HUMAN_GATE: NOT_APPROVED
MERGE_PR_133: NOT_AUTHORIZED
STABLE_TAG: NOT_AUTHORIZED
STABLE_RELEASE: NOT_AUTHORIZED
LATEST_CHANGE: NOT_AUTHORIZED
```

O control plane evoluiu para separar:

- **publisher imutável**: código/workflow de publicação;
- **approval ref**: receipt humano separado;
- **stable/control-lock refs**: identidade publicada e lock de consumo.

Os P1 restantes dependem de proteção server-side real e prova live. Nenhum P1 deve ser zerado por análise apenas documental.

---

# 5. Reconciliação documental

Existe PR documental separado para reconciliar:

- `README.md`;
- `CHANGELOG.md`;
- docs/runtime;
- governança;
- auditorias;
- índices;
- histórico de releases;
- estado atual;
- classificação de `CURRENT_IMPLEMENTED`, `EXPERIMENTAL`, `UNDER_STUDY`, `HISTORICAL`, `SUPERSEDED`.

Esse PR não deve ser mergeado antes de o boundary stable ser fechado, pois sua integração moveria `main` além de RC3 e invalidaria o predicado de base atualmente qualificado.

Fluxo:

```text
stable boundary
   ↓
fechamento/autorização quando cabível
   ↓
refrescar reconciliação documental contra estado final
   ↓
revalidar/revisar
   ↓
merge documental governado
   ↓
Fase Zero formalmente encerrada
```

---

# 6. Discovery da Fase 1

O discovery é separado da stable e não altera a v1 atual.

Branch:

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

A reestruturação grande NÃO deve começar apenas porque a stable foi publicada.

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

No momento de criação deste roadmap:

```yaml
phase_zero:
  current_boundary: STABLE_V1_0_0
  state: CORRECTING

phase_one_discovery:
  state: ACTIVE_BUT_PAUSED_BEFORE_Q2
  last_completed_question: 1
  next_question: 2

next_human_action_for_discovery: NONE_NOW
next_operational_action: finish_current_stable_boundary_then_resume_questionnaire
```

Um novo chat deve conseguir reconstruir o estado lendo:

1. `MCF-NEXTGEN-RESUME-CARD.md`;
2. `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-002.md`;
3. `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`;
4. este `MCF-MASTER-ROADMAP-001.md`;
5. GitHub live para estado mutável.