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
stage: DECISION_CONSOLIDATION_COMPLETE
discovery: COMPLETE
questionnaire: COMPLETE_16_OF_16
decision_consolidation_F1_3: COMPLETE
target_architecture_decision_approved: true
architecture_final_specification_approved: false
prototype_authorized: false
implementation_authorized: false
production_cutover_authorized: false
```

Arquitetura-alvo decisória aprovada: `GOVERNED_PORTABLE_MULTIAGENT_RUNTIME`.

A aprovação de Q16 e a conclusão de F1.3 não autorizam código, protótipo, migração material, alteração da stable ou produção.

## Fase 2 — Provar e generalizar

Provar valor empiricamente, comparar com baselines críveis, testar portabilidade e generalizar somente com evidência suficiente.

---

# 2. Roadmap macro

```text
FASE ZERO                                      ✅ COMPLETE_IN_MAIN

FASE 1 — MCF NEXTGEN
├── F1.1 Discovery guiado                      ✅ COMPLETE
├── F1.2 Questionário Q1–Q16                   ✅ COMPLETE 16/16
├── F1.3 Consolidação das decisões             ✅ COMPLETE
├── F1.4 Arquitetura alvo formal               👉 NEXT
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

# 4. Consolidação formal F1.3

Documento canônico:

`docs/proposals/MCF-NEXTGEN-DECISION-CONSOLIDATION-001.md`

A consolidação é índice e síntese formal; não substitui nem reescreve os checkpoints originais.

Mapa de origem:

```text
Q1  -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-002.md (seção Pergunta 1)
Q2  -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md
Q3  -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md
Q4  -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md
Q5  -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md
Q6  -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-008.md
Q7  -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009.md
Q8  -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-010.md
Q9  -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-011.md
Q10 -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-012.md
Q11 -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-013.md
Q12 -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-014.md
Q13 -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-015.md
Q14 -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-016.md
Q15 -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-017.md
Q16 -> MCF-NEXTGEN-DISCOVERY-CHECKPOINT-018.md
```

Q1 não possui arquivo exclusivo `Q1-only`; sua decisão está preservada duravelmente no Checkpoint 002. Q2–Q16 possuem checkpoints dedicados.

LEANDRO declarou intenção de realizar posteriormente uma nova rodada sobre as decisões Q1–Q16. Política preservada:

```text
ORIGINAL_CHECKPOINTS_MUST_BE_PRESERVED
CONSOLIDATION != REWRITE
SECOND_ROUND_CREATES_NEW_LINEAGE
SUPERSESSION_REQUIRES_EXPLICIT_LEANDRO_DECISION
```

---

# 5. Decisões consolidadas Q1–Q16

- Q1 — sistema pessoal de trabalho com IA para LEANDRO como foco inicial; continuidade durável; provar antes de generalizar.
- Q2 — `LAYERED_CONTINUITY_ARCHITECTURE`.
- Q3 — Agent Contract; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY`.
- Q4 — `MISSION-BOUNDED + RISK-BASED AUTONOMY`.
- Q5 — `CAPABILITY_AND_POLICY_BASED_ROUTER`.
- Q6 — independência auditável; `INDEPENDENCE != DIVERSITY`.
- Q7 — `HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`.
- Q8 — `LAYERED_CANONICAL_PERSISTENCE`.
- Q9 — `ACTIONABLE_PROGRESSIVE_OBSERVABILITY`.
- Q10 — `MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS`.
- Q11 — `PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT`.
- Q12 — `POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST`.
- Q13 — `PREDECLARED_COMPARATIVE_VALUE_EVALUATION`.
- Q14 — `CLEAN_ROOM_PORTABILITY_AND_EXTERNAL_UTILITY_VALIDATION`.
- Q15 — `PRESERVE_INVARIANTS_REDUCE_IMPLEMENTATION`.
- Q16 — `GOVERNED_PORTABLE_MULTIAGENT_RUNTIME`.

---

# 6. GO/NO-GO vigente

```yaml
questionnaire_direction: GO
target_architecture_decision: GO
discovery_completion: GO
F1_3_decision_consolidation: COMPLETE
F1_4_formal_target_architecture: GO_NEXT
F1_5_migration_plan: GO_AFTER_F1_4
F1_6_executable_specification: GO_AFTER_F1_5
prototype: NO_GO_CURRENTLY
implementation: NO_GO_CURRENTLY
production_cutover: NO_GO
destructive_v1_change: NO_GO
final_implementation_authorization: REQUIRES_EXPLICIT_LEANDRO_APPROVAL
```

---

# 7. Próximo bloco: F1.4

### F1.4 — Arquitetura alvo formal

Objetivo:

- transformar a decisão `GOVERNED_PORTABLE_MULTIAGENT_RUNTIME` em arquitetura formal;
- definir boundaries, contracts, dependencies e interfaces de forma verificável;
- preservar os invariantes Q1–Q16;
- manter itens `INCONCLUSIVE` explicitamente abertos quando ainda dependerem de evidência;
- fornecer entrada formal para F1.5 Plano de Migração.

F1.4 continua sendo especificação/documentação. Não autoriza implementação.

A nova rodada de revisão Q1–Q16 pretendida por LEANDRO pode ser executada sem perda da primeira rodada, usando os registros individuais e lineage previsto na consolidação F1.3.

---

# 8. Critérios antes de implementação

Antes de pedir autorização de implementação devem existir, no mínimo:

1. Q1–Q16 concluídas — **PASS**;
2. F1.3 decisões formalmente consolidadas — **PASS**;
3. F1.4 arquitetura alvo formal documentada;
4. F1.5 plano de migração/backward compatibility formalizado;
5. F1.6 especificação executável e testável;
6. dispositions reconciliadas;
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

# 9. Ponto de retomada

```yaml
phase_zero: COMPLETE_IN_MAIN
phase_one_stage: DECISION_CONSOLIDATION_COMPLETE
questionnaire: COMPLETE_16_OF_16
decision_consolidation_F1_3: COMPLETE
target_architecture_decision: GOVERNED_PORTABLE_MULTIAGENT_RUNTIME
target_architecture_decision_approved: true
architecture_final_specification_approved: false
prototype_authorized: false
implementation_authorized: false
next_phase_block: F1_4_FORMAL_TARGET_ARCHITECTURE
```

Ordem mínima de retomada:

1. `MCF-NEXTGEN-RESUME-CARD.md`;
2. `MCF-NEXTGEN-DECISION-CONSOLIDATION-001.md`;
3. `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-018.md`;
4. `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`;
5. este Master Roadmap;
6. checkpoint individual da pergunta quando necessário;
7. GitHub/provider live para estado mutável.
