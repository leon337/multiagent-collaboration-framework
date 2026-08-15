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
├── F1.2 Questionário Q1–Q16                   🔍 Q1–Q12 ✅ | Q13 próxima
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
  completed: 12
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
  Q13: NEXT_NOT_STARTED
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
`INDEPENDENCE != DIVERSITY`; revisão independente exige separação observável, blind-first, evidência própria e decisão própria; assurance proporcional ao risco.

## Q7 — Orquestração
`HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`; outer graph acíclico; loops limitados; paralelismo seguro; joins; replanning versionado; Complexity Budget; Completion Contract.

## Q8 — Persistência
`LAYERED_CANONICAL_PERSISTENCE`; canonical knowledge, operational state, transition ledger, evidence e derived views; consistência durável, provenance, freshness, schema evolution e restorability.

## Q9 — Experiência humana e observabilidade
`ACTIONABLE_PROGRESSIVE_OBSERVABILITY`; atenção humana separada de severidade operacional; Decision Inbox; aprovação version-bound; UI derivada; progressive disclosure; causalidade tipada; notificações por mudança material.

## Q10 — Core vs extensões
`MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS`; Constitutional Kernel + Core Services; extensões governadas/versionadas; dependência Extension→Core; profiles declarativos; factories como blueprint generators; compatibilidade fail-closed.

## Q11 — Infraestrutura e placement
`PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT`; verdade/governança centralizadas logicamente, execução distribuível conforme hard requirements; durable dispatch, attempt identity, fencing/epoch, fail-closed em partições, recovery coerente e portabilidade sem provider como identidade constitucional.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-013.md`.

## Q12 — Segurança, permissões e gates
LEANDRO aprovou conceitualmente `POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST`.

Princípios:

- autorização default deny; `AUTHENTICATED != AUTHORIZED`;
- efeitos materiais preservam cadeia de principal/delegação e delegação só pode atenuar autoridade;
- autorização é vinculada ao contexto, audience, recurso, policy, estado e expiração conforme aplicável;
- model compliance não é security boundary; efeitos materiais exigem enforcement verificável fora do modelo;
- bypass direto do governed effect boundary é proibido quando arquiteturalmente controlável;
- mutation de security policy/permissions/gates/credential bindings é efeito privilegiado;
- HUMAN_GATE pertence exclusivamente a LEANDRO no MCF e deve ser vinculado ao efeito/precondições, expirar e ser protegido contra replay;
- consumo de aprovação é explícito e limitado, não um booleano reutilizável;
- conteúdo externo não é autoridade e sua provenance/trust não desaparece por resumo/RAG/handoff;
- output de modelo não é comando material seguro por definição;
- secrets não são memória/prompt/log/telemetry por default; preferir referências, brokers e credenciais curtas/escopadas;
- workers não são trust peers do Control Plane e devem ter blast radius limitado;
- cross-project access é deny por default; classificação de dados deve propagar e modelo não pode se autodesclassificar;
- plugins/extensões materiais exigem digest, provenance e verificação contra trust policy; presença de provenance não equivale a confiança;
- Authorization Receipt registra decisão de segurança, mas receipt não substitui evidence/read-back do efeito;
- revogação, autoridade material remota limitada e security budgets são obrigatórios;
- políticas de segurança são ativos críticos sujeitos a integridade/change control;
- Core generalizável conhece internal gate authority role; o binding atual pode ser LÉO; HUMAN_GATE permanece LEANDRO.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-014.md`.

---

# 5. Próximos blocos

Q13–Q16 decidirão:

- métricas e custo-benefício;
- portabilidade/validação externa;
- simplificação/remoção;
- arquitetura final e GO/NO-GO.

Próxima pergunta:

> **Q13 — Como provar que o MCF vale o custo e a complexidade?**

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
9. riscos e rollback/recovery definidos;
10. LEANDRO aprova a especificação final.

---

# 7. Ponto de retomada

```yaml
phase_zero: COMPLETE_IN_MAIN
phase_one_discovery: ACTIVE_DISCOVERY
last_completed_question: 12
next_question: 13
implementation_authorized: false
next_human_action_for_discovery: LEANDRO_AND_MESTRE_START_Q13
```

Ordem mínima de retomada:

1. `MCF-NEXTGEN-RESUME-CARD.md`;
2. `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-014.md`;
3. `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`;
4. este Master Roadmap;
5. GitHub/provider live para estado mutável.
