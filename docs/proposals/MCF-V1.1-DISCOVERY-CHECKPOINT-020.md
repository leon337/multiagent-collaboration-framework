# MCF v1.1 — Discovery Checkpoint 020

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-020`  
**Status:** `DISCOVERY_COMPLETE`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado terminal da Discovery

```yaml
target_version: v1.1.0
discovery: COMPLETE
question_count_total: 20
questions_completed: 20
questions_remaining: 0
last_completed_question: 20
next_question: NONE
Q1: COMPLETED_APPROVED_BY_LEANDRO
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
Q12: COMPLETED_APPROVED_BY_LEANDRO
Q13: COMPLETED_APPROVED_BY_LEANDRO
Q14: COMPLETED_APPROVED_BY_LEANDRO
Q15: COMPLETED_APPROVED_BY_LEANDRO
Q16: COMPLETED_APPROVED_BY_LEANDRO
Q17: COMPLETED_APPROVED_BY_LEANDRO
Q18: COMPLETED_APPROVED_BY_LEANDRO
Q19: COMPLETED_APPROVED_BY_LEANDRO
Q20: COMPLETED_APPROVED_BY_LEANDRO

discovery_verdict: CONDITIONAL_GO
conditional_go_scope: IMPLEMENTATION_PREPARATION_ONLY
conceptual_architecture: APPROVED
blocking_conceptual_contradiction_found: false

implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução de retomada:** a Discovery Q1–Q20 está encerrada. Não abrir Q21 nem iniciar implementação. A retomada deve começar pela preparação técnica/conformance aprovada pela Q20, após verificar GitHub live e este checkpoint.

### Preferência de apresentação de LEANDRO

Ao apresentar alternativas decisórias, MESTRE marca sua recomendação com **⭐**. A estrela é apenas recomendação visual; somente LEANDRO decide.

---

## 2. Decisões preservadas

- Q1 — `HYBRID_INTENT_AND_EXPLICIT_ACTIVATION` — Opção D.
- Q2 — `LOCAL_FIRST_REMOTE_CHECKPOINTED` — Opção D.
- Q3 — `VERIFIED_TWO_STAGE_BOOTSTRAP` — Opção D.
- Q4 — `VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES` — Opção D.
- Q5 — `THREE_CANONICAL_ENTRY_MODES_WITH_RECOVERY_ROUTE` — Opção D.
- Q6 — `PROGRESSIVE_DURABLE_PROJECT_GENESIS` — Opção D.
- Q7 — `EVIDENCE_FIRST_EXISTING_PROJECT_RECONNAISSANCE` — Opção D.
- Q8 — `CANONICAL_INTENT_DIMENSIONS_WITH_EVIDENCE_AWARE_RESOLUTION` — Opção D.
- Q9 — `EVIDENCE_AWARE_ADAPTIVE_QUESTIONING_WITH_INFORMATION_GAIN` — Opção D.
- Q10 — `EVENT_DRIVEN_PROGRESSIVE_SEMANTIC_READBACK` — Opção D.
- Q11 — `SEMANTIC_READINESS_GATE_WITH_BLOCKING_UNKNOWNS` — Opção D.
- Q12 — `VERSIONED_PROVENANCE_AWARE_PROJECT_INTENT_PACKAGE` — Opção D.
- Q13 — `EVIDENCE_BOUND_CONDITIONAL_EXISTING_PROJECT_ARTIFACT_PIPELINE` — Opção D.
- Q14 — `LAYERED_AUTHORITY_WITH_REBUILDABLE_PROJECT_VIEWS` — Opção D.
- Q15 — `DELEGATED_TECHNICAL_AUTONOMY_WITHIN_HUMAN_APPROVED_ENVELOPE` — Opção D.
- Q16 — `IMPACT_BASED_HUMAN_GATES_WITH_SCOPED_STANDING_AUTHORIZATION` — Opção D.
- Q17 — `EVENT_DRIVEN_TRANSFERABLE_CHECKPOINT_WITH_VERIFIED_RESUME` — Opção D.
- Q18 — `COMPATIBLE_EXTENSION_VERSIONING_AND_EXPLICIT_MIGRATION` — Opção D.
- Q19 — `EVIDENCE_LAYERED_REAL_SCENARIO_QUALIFICATION_MATRIX` — Opção D.
- Q20 — `CONSOLIDATED_V11_ARCHITECTURE_WITH_CONDITIONAL_GO` — Opção D.

Detalhamento normativo integral: `docs/proposals/MCF-V1.1-DECISION-LEDGER-001.md`.

---

## 3. Q20 — contrato final aprovado

```yaml
decision_id: V11-Q20
chosen_option: D
canonical_name: CONSOLIDATED_V11_ARCHITECTURE_WITH_CONDITIONAL_GO

discovery:
  status: COMPLETE
  conceptual_architecture: APPROVED
  blocking_conceptual_contradiction_found: false

verdict:
  type: CONDITIONAL_GO
  scope: IMPLEMENTATION_PREPARATION_ONLY

pre_implementation_requirements:
  - V1_0_IMPACT_AND_CONFORMANCE_ANALYSIS
  - NO_EQUIVALENT_TEST_FOR_EACH_CANDIDATE_NEW_PRIMITIVE
  - EXACT_SCHEMA_AND_CONTRACT_DESIGN
  - RUNTIME_AND_SKILL_MAPPING
  - MIGRATION_AND_COMPATIBILITY_PLAN
  - IMPLEMENTATION_PLAN
  - QUALIFICATION_PLAN_FROM_Q19
  - TEAM_REVIEW
  - SEPARATE_IMPLEMENTATION_HUMAN_GATE_BY_LEANDRO

authorizations:
  implementation: false
  codex_implementation: false
  prototype: false
  release: false
```

### Arquitetura consolidada em 10 blocos

1. `ACTIVATION_AND_BOOTSTRAP`
2. `PROJECT_ENTRY`
3. `PROJECT_CONTEXT`
4. `ALIGNMENT_AND_PLANNING_INPUTS`
5. `MISSION_EXECUTION`
6. `AUTHORITY_AND_HUMAN_GATE`
7. `PROJECT_MEMORY_AND_AUTHORITY`
8. `CONTINUITY_AND_RECOVERY`
9. `VERSION_AND_COMPATIBILITY`
10. `QUALIFICATION`

### Regra de evolução

```text
V1_1_EXTENDS_V1_0
REUSE_BEFORE_NEW_PRIMITIVE
EXTEND_BEFORE_REPLACE
VERSION_BEFORE_BREAK
NEW_PRIMITIVE_REQUIRES_NO_EQUIVALENT_TEST
```

Primitives v1.0 a reutilizar/estender por padrão: runtime, `MCF-START-MISSION`, `MCF-RECOVER-CONTEXT`, Mission Contract, PRF/checkpoints, permission profiles, Human Delegation Firewall, handoffs, receipts, reconciliação e observabilidade.

Candidatos a novos contratos duráveis, ainda sujeitos a `NO_EQUIVALENT_TEST`: `PROJECT_INTENT_PACKAGE` e `PROJECT_REALITY_REPORT`.

`Resume Card`, Product Brief, Gap Map e Completion/Recovery Plan draft não devem virar novos estados autoritativos de runtime por padrão.

---

## 4. Significado do CONDITIONAL_GO

```text
DISCOVERY_COMPLETE != IMPLEMENTATION_AUTHORIZED
CONDITIONAL_GO = GO_FOR_TECHNICAL_PREPARATION_ONLY
NO_CODE_FROM_Q20
NO_PROTOTYPE_FROM_Q20
NO_RELEASE_FROM_Q20
```

A Discovery está suficientemente madura para sair da investigação conceitual e entrar em preparação técnica. Isso não autoriza editar código do produto/runtime, iniciar Codex implementation, produzir protótipo ou release.

---

## 5. Próxima fase permitida

A próxima fase deve ser **PRE-IMPLEMENTATION TECHNICAL PREPARATION / CONFORMANCE** e produzir, no mínimo:

1. análise exata do impacto sobre a v1.0 vigente;
2. mapa de reutilização/extensão versus candidatos a novos primitives;
3. `NO_EQUIVALENT_TEST` documentado para cada candidato a primitive novo;
4. schemas e contratos exatos;
5. mapeamento runtime/skills/events/persistência;
6. estratégia de compatibilidade e migração;
7. plano de implementação incremental;
8. Qualification Plan aderente à Q19;
9. revisão técnica da equipe;
10. HUMAN_GATE separado para LEANDRO decidir se implementação será autorizada.

---

## 6. Boundary de retomada

```text
MCF-V1.1-RESUME-CARD.md
+
MCF-V1.1-DISCOVERY-CHECKPOINT-020.md
+
MCF-V1.1-DECISION-LEDGER-001.md
```

Toda retomada deve consultar GitHub live antes de afirmar estado atual.

## 7. Próxima ação

> **Iniciar somente a preparação técnica/conformance da v1.1, sem implementação, a partir do contrato Q20 e da v1.0 live.**

Qualquer autorização de implementação pertence exclusivamente a LEANDRO em HUMAN_GATE posterior e separado.
