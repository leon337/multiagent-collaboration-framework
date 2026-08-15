# MCF NextGen — Consolidação Formal das Decisões Q1–Q16

**ID:** `MCF-NEXTGEN-DECISION-CONSOLIDATION-001`  
**Status:** `FORMAL_DECISION_CONSOLIDATION`  
**Data de referência:** 2026-08-15  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Origem:** Discovery Q1–Q16 concluído e aprovado por LEANDRO.  
**Objetivo:** consolidar formalmente as decisões da primeira rodada sem reescrever, apagar ou fundir as fontes originais, preservando rastreabilidade para futura segunda rodada de revisão.

---

## 1. Regra de preservação

Esta consolidação NÃO substitui os checkpoints originais.

Invariantes:

```text
CONSOLIDATION != REWRITE
CONSOLIDATION != SUPERSESSION
ORIGINAL_DECISION_RECORDS = HISTORICAL_EVIDENCE
SECOND_ROUND_MUST_NOT_OVERWRITE_FIRST_ROUND
```

Os registros da primeira rodada permanecem preservados. Qualquer revisão futura deve criar nova versão/registro de revisão e manter lineage explícito para a decisão original.

---

## 2. Mapa canônico das decisões da primeira rodada

| Pergunta | Decisão resumida | Registro de origem |
|---|---|---|
| Q1 | finalidade principal: sistema pessoal de trabalho com IA para LEANDRO, continuidade durável, provar antes de generalizar | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-002.md` — seção “Pergunta 1 — síntese consolidada” |
| Q2 | `LAYERED_CONTINUITY_ARCHITECTURE` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md` |
| Q3 | Agent Contract; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md` |
| Q4 | `MISSION-BOUNDED + RISK-BASED AUTONOMY` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md` |
| Q5 | `CAPABILITY_AND_POLICY_BASED_ROUTER` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md` |
| Q6 | independência auditável; `INDEPENDENCE != DIVERSITY` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-008.md` |
| Q7 | `HIERARCHICAL_GOVERNED_EXECUTION_GRAPH` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009.md` |
| Q8 | `LAYERED_CANONICAL_PERSISTENCE` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-010.md` |
| Q9 | `ACTIONABLE_PROGRESSIVE_OBSERVABILITY` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-011.md` |
| Q10 | `MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-012.md` |
| Q11 | `PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-013.md` |
| Q12 | `POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-014.md` |
| Q13 | `PREDECLARED_COMPARATIVE_VALUE_EVALUATION` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-015.md` |
| Q14 | `CLEAN_ROOM_PORTABILITY_AND_EXTERNAL_UTILITY_VALIDATION` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-016.md` |
| Q15 | `PRESERVE_INVARIANTS_REDUCE_IMPLEMENTATION` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-017.md` |
| Q16 | `GOVERNED_PORTABLE_MULTIAGENT_RUNTIME` | `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-018.md` |

Observação: Q1 não possui um checkpoint exclusivo “Q1-only”; sua decisão foi consolidada duravelmente no Checkpoint 002 e o Checkpoint 003 já registra `Q1: COMPLETED` e `Q2: NEXT_NOT_STARTED`. Isso é suficiente como fonte histórica, mas uma segunda rodada pode, se desejado, criar registros individuais por pergunta sem alterar a primeira rodada.

---

## 3. Checkpoints auxiliares da Discovery

Os checkpoints `001`, `002` e `003` possuem funções de bootstrap, sessão e transição e devem permanecer preservados como contexto histórico da primeira rodada.

- `CHECKPOINT-001`: snapshot inicial do Discovery;
- `CHECKPOINT-002`: sessão durável e consolidação de Q1;
- `CHECKPOINT-003`: transição formal Fase Zero -> Fase 1 e boundary Q1 concluída / Q2 próxima.

A partir de Q2, cada pergunta concluída possui um checkpoint dedicado em sequência `004`–`018`.

---

## 4. Política para segunda rodada

Uma nova rodada sobre Q1–Q16 deve usar lineage explícito e não editar silenciosamente os registros originais.

Formato conceitual recomendado:

```yaml
decision_review:
  round: 2
  question_id: Qn
  original_decision_ref:
  original_decision_revision:
  review_status:
    CONFIRMED | REFINED | SUPERSEDED | REOPENED | INCONCLUSIVE
  rationale:
  new_decision_ref:
  supersession_effective: false
```

`supersession_effective` só pode se tornar verdadeiro após decisão explícita de LEANDRO e atualização controlada dos documentos canônicos vigentes.

A segunda rodada deve poder comparar:

```text
ROUND_1 ORIGINAL
      ↓
ROUND_2 REVIEW
      ↓
CONFIRM / REFINE / SUPERSEDE / REOPEN
```

sem apagar a história.

---

## 5. Relação entre consolidação e autoridade

Este documento é um índice/consolidação formal. Em caso de dúvida sobre detalhes de uma decisão, consultar o checkpoint de origem correspondente.

Política:

```text
DETAIL OF Qn -> ORIGINAL Qn CHECKPOINT
CURRENT PROGRAM STATE -> RESUME CARD + MASTER ROADMAP + GITHUB LIVE
SECOND-ROUND RESULT -> FUTURE REVIEW/SUPERSESSION RECORD
```

Uma síntese desta consolidação não possui autoridade para alterar silenciosamente uma decisão aprovada na primeira rodada.

---

## 6. Estado após F1.3

```yaml
phase_1:
  discovery: COMPLETE
  decision_consolidation_F1_3: COMPLETE
  target_architecture_decision_approved: true
  formal_target_architecture_F1_4: NEXT
  architecture_final_specification_approved: false
  prototype_authorized: false
  implementation_authorized: false
  production_cutover_authorized: false
```

Próximo passo canônico do roadmap principal: `F1.4 — Arquitetura alvo formal`.

Entretanto, LEANDRO declarou intenção de realizar posteriormente uma nova rodada sobre as decisões Q1–Q16. Esta consolidação preserva as fontes necessárias para essa revisão e nenhuma etapa futura deve apagar ou reescrever os registros originais da primeira rodada.

---

## 7. Invariantes finais da consolidação

```text
EVERY_Q_DECISION_REMAINS_TRACEABLE
Q1_SOURCE = CHECKPOINT_002
Q2_Q16_HAVE_DEDICATED_CHECKPOINTS
ORIGINAL_CHECKPOINTS_MUST_BE_PRESERVED
CONSOLIDATION_IS_INDEX_NOT_REPLACEMENT
SECOND_ROUND_CREATES_NEW_LINEAGE
SUPERSESSION_REQUIRES_EXPLICIT_LEANDRO_DECISION
IMPLEMENTATION_REMAINS_UNAUTHORIZED
```
