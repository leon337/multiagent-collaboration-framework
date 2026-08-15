# MCF v1.1 — Discovery Checkpoint 015

**ID:** `MCF-V1.1-DISCOVERY-CHECKPOINT-015`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Baseline:** `main@b91823a947715e09d69c72999e2278523f2259be`

---

## 1. Estado de retomada

```yaml
target_version: v1.1.0
discovery: ACTIVE
question_count_total: 20
questions_completed: 15
questions_remaining: 5
last_completed_question: 15
next_question: 16
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
Q16: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Instrução de retomada:** NÃO repetir Q1–Q15 salvo solicitação explícita de LEANDRO. Retomar em Q16.

### Preferência de apresentação de LEANDRO

Ao apresentar alternativas decisórias, MESTRE deve marcar sua recomendação com **⭐** na lista final. A estrela é somente recomendação visual; a decisão continua pertencendo exclusivamente a LEANDRO.

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

---

## 3. Q15 — contrato aprovado

```yaml
human_authority:
  final_human_authority: LEANDRO
  governs:
    - HUMAN_INTENT
    - PROJECT_OBJECTIVE
    - DESIRED_OUTCOME
    - HUMAN_PRIORITIES
    - HUMAN_CONSTRAINTS
    - MATERIAL_HUMAN_TRADEOFFS
  technical_micro_management_required: false

human_envelope:
  authoritative_inputs:
    - ALIGNED_PROJECT_INTENT_PACKAGE
    - APPLICABLE_HUMAN_DECISIONS
    - MISSION_CONTRACT
  team_may_silently_redefine: false

team_authority:
  delegated_technical_autonomy: true
  valid_only_within_human_envelope: true
  subject_to:
    - AGENT_COMPETENCE
    - MISSION_CONTRACT
    - GOVERNANCE
    - EVIDENCE
    - RISK_BOUNDARIES

material_change_test:
  checks:
    - HUMAN_INTENT
    - PROJECT_OBJECTIVE
    - TARGET_USERS
    - MUST_HAVE_OR_NON_GOAL
    - HUMAN_PRIORITY_OR_TRADEOFF
    - MATERIAL_COST_OR_RESOURCE_CONSTRAINT
    - MATERIAL_RISK
    - MATERIAL_EXTERNAL_EXPOSURE
    - DEFINITION_OF_DONE
    - DESIRED_OUTCOME
  if_no_material_change: TEAM_AUTHORITY_CONTINUES
  if_material_change: CROSS_HUMAN_AUTHORITY_BOUNDARY

team_first:
  ambiguity_default: ANALYZE_WITHIN_TEAM_FIRST
  ask_leandro_for_ordinary_technical_choice: false
  unresolved_or_out_of_envelope_decision: ESCALATE

human_gate_specific_actions: DEFER_TO_Q16
implementation_authorized: false
```

Regras centrais:

```text
HUMAN_FINAL_AUTHORITY != TECHNICAL_MICROMANAGEMENT
WITHIN_APPROVED_ENVELOPE -> TEAM_DECIDES_AND_CONTINUES
MATERIAL_ENVELOPE_CHANGE -> HUMAN_AUTHORITY_BOUNDARY
TEAM_FIRST_BEFORE_HUMAN_ESCALATION
TECHNICAL_OPINION != HUMAN_DECISION
```

LEANDRO mantém autoridade sobre intenção, objetivo, resultado esperado, prioridades, limites e trade-offs humanos materiais. A equipe MCF toma decisões técnicas e operacionais ordinárias dentro do envelope aprovado sem exigir aprovação humana para cada escolha. `ALIGNED_PIP + HUMAN_DECISIONS + MISSION_CONTRACT` formam o envelope aplicável. Mudança material cruza a fronteira da autoridade humana.

`TEAM_FIRST` permanece obrigatório antes de escalar ambiguidades técnicas: a equipe analisa evidências e alternativas e tenta resolver dentro da autoridade delegada. MESTRE protege o envelope, LÉO exerce autoridade operacional delegada e agentes especialistas possuem autoridade técnica limitada à competência, contrato e governança.

---

## 4. Fronteira deixada para Q16

Q16 deve decidir **quais ações concretas continuam exigindo HUMAN_GATE e quais decisões técnicas podem permanecer delegadas**, sem desfazer Q15.

A Q16 deve distinguir pelo menos:

- mudança material de intenção/escopo versus escolha técnica ordinária;
- custo financeiro novo ou relevante;
- exposição pública/jurídica relevante;
- credenciais e dados sensíveis excepcionais;
- ações externas irreversíveis ou de alto impacto;
- publicação/release/produção;
- cancelamento e conflito estratégico;
- possibilidade de autorização antecipada/contínua com limites claros;
- comportamento quando o gate humano estiver ausente ou não respondido;
- `TEAM_FIRST` versus `HUMAN_GATE`.

---

## 5. Próxima pergunta

> **Q16 — Quais ações continuam exigindo HUMAN_GATE e quais decisões técnicas podem ser delegadas?**

Implementação continua `NO_GO`.
