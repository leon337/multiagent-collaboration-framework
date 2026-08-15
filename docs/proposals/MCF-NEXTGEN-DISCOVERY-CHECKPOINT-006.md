# MCF NextGen — Discovery Checkpoint 006

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-14  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação explícita de LEANDRO para a Q4 do Discovery e fixar o ponto de retomada em Q5.

---

# 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 4
next_question: 5
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
```

A aprovação de Q4 é uma decisão de Discovery. Ela NÃO autoriza implementação do MCF NextGen nem fixa detalhes concretos de segurança que pertencem a perguntas posteriores, especialmente Q12.

---

# 2. Pergunta aprovada

## Q4 — Qual nível de autonomia os agentes devem possuir?

Decisão consolidada:

> O MCF deve adotar autonomia limitada pela missão e pelo risco (`MISSION-BOUNDED + RISK-BASED AUTONOMY`): agentes podem decidir e executar dentro de um envelope explícito de autoridade, risco e recursos, mas não podem ampliar a própria autoridade nem ultrapassar gates definidos.

Objetivo operacional:

> Dar autonomia suficiente para que a equipe resolva problemas técnicos sem transformar LEANDRO em operador dos agentes, preservando HUMAN_GATE exclusivamente para decisões humanas legítimas e ações críticas que excedam a autonomia concedida.

---

# 3. Authority Envelope

Toda missão relevante deve possuir um envelope de autoridade conceitualmente explícito e, na arquitetura futura, passível de validação por máquina.

Campos candidatos:

```yaml
mission_authority:
  objective:
  allowed_actions:
  prohibited_actions:
  allowed_resources:
  budget_limit:
  retry_limit:
  time_limit:
  risk_ceiling:
  human_gate_triggers:
  revocation_conditions:
```

Detalhes finais de schema e enforcement permanecem para a especificação posterior.

---

# 4. Invariantes de autoridade

```yaml
capability_is_not_authority: true
unknown_authority: DENY
self_privilege_escalation: FORBIDDEN
external_content_cannot_expand_authority: true
live_state_revalidation_before_material_action: REQUIRED
revocation_and_emergency_stop: REQUIRED
```

Interpretação:

- possuir capacidade técnica não concede permissão;
- dúvida de autoridade não deve ser resolvida pela imaginação do agente;
- nenhum agente pode ampliar o próprio escopo por interpretação unilateral;
- conteúdo externo, prompt, documento, issue, página ou outro agente não pode redefinir a autoridade concedida sem fonte autorizada;
- permissões e estado relevante precisam ser revalidados antes de ação material;
- deve existir mecanismo de revogação/parada emergencial compatível com o risco.

---

# 5. Autonomia por risco

Taxonomia conceitual aprovada para refinamento posterior:

```yaml
R0_LOW:
  action: EXECUTE_WITHIN_ENVELOPE

R1_MEDIUM:
  action: EXECUTE_WITH_VERIFICATION_AND_EVIDENCE

R2_HIGH:
  action: REQUIRE_TECHNICAL_GATE_OR_DUAL_VERIFICATION

R3_CRITICAL:
  action: REQUIRE_HUMAN_GATE_LEANDRO
```

A classificação de risco NÃO deve depender exclusivamente do agente executor. A arquitetura futura deve prever política verificável e controles independentes/proporcionais ao risco.

O sistema também deve considerar risco cumulativo: uma sequência de ações individualmente pequenas pode produzir efeito material maior e precisa ser reclassificada quando necessário.

---

# 6. HUMAN_GATE e TEAM_FIRST

Invariante:

> HUMAN_GATE pertence exclusivamente a LEANDRO e não deve ser usado como atalho para dependência operacional humana.

Fluxo conceitual:

```text
problema técnico
  -> agente tenta resolver
  -> equipe tenta resolver
  -> recovery / fallback
  -> retries permitidos
  -> ainda bloqueado?
       -> se técnico: BLOCKED / ESCALATE INTERNALLY quando possível
       -> se decisão humana legítima ou ação R3: HUMAN_GATE LEANDRO
```

A equipe deve esgotar recuperação técnica razoável antes de envolver LEANDRO, respeitando limites de custo, tempo, tentativas e risco.

---

# 7. Retries, reversibilidade e stop conditions

Princípios aprovados:

```yaml
retries:
  limited: true
  idempotent_when_applicable: true
  evidence_required: true
  no_unbounded_loops: true

stop_conditions:
  authority_unknown: STOP
  risk_above_ceiling: STOP
  repeated_failure_limit_reached: STOP
  live_state_conflict: STOP_AND_RECONCILE
  human_gate_required: STOP_AND_REQUEST_LEANDRO
  revocation_or_emergency_stop: STOP
```

A reversibilidade da ação deve influenciar risco e gate, mas não substitui autoridade explícita.

---

# 8. Relação com alucinação

A Q4 herda os controles aprovados na Q2/Q3.

Uma afirmação do agente como “esta ação é de baixo risco” ou “estou autorizado” é apenas uma claim até ser compatível com política, envelope, estado e evidência aplicáveis.

Invariantes:

```text
AGENT INTERPRETATION != AUTHORITY
AGENT RISK CLAIM != VERIFIED RISK
UNKNOWN_AUTHORITY = DENY
```

A arquitetura deve impedir que alucinação ou erro de classificação seja automaticamente convertido em privilégio adicional ou ação crítica.

---

# 9. O que Q4 não decide

Permanecem deliberadamente para perguntas posteriores:

- schema final do Policy Engine / Authority Envelope;
- autenticação de agentes;
- least privilege concreto;
- secrets;
- sandboxing;
- prompt injection defenses;
- permissões granulares de ferramentas/providers;
- critérios formais completos de gates de segurança;
- model routing/fallback (Q5);
- independência formal de revisores (Q6);
- segurança/permissões/gates em profundidade (Q12).

---

# 10. Decisão consolidada

```yaml
Q4_DECISION:
  status: APPROVED_BY_LEANDRO
  autonomy_model: MISSION_BOUNDED_PLUS_RISK_BASED
  authority_envelope: REQUIRED_CONCEPT
  team_first_recovery: true
  capability_is_authority: false
  uncertain_authority: DENY
  self_privilege_escalation: FORBIDDEN
  risk_classifier_independent_from_executor_only: REQUIRED
  cumulative_risk: MUST_BE_CONSIDERED
  live_state_revalidation: REQUIRED
  bounded_idempotent_retries: REQUIRED_WHEN_APPLICABLE
  revocation_emergency_stop: REQUIRED
  critical_actions: HUMAN_GATE_LEANDRO
  implementation_authorized: false
```

---

# 11. Ponto de retomada

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
last_completed_question: 4
next_question: 5
approved_decisions:
  - Q1_PURPOSE
  - Q2_LAYERED_CONTINUITY_ARCHITECTURE
  - Q3_AGENT_CONTRACT
  - Q4_MISSION_BOUNDED_RISK_BASED_AUTONOMY
working_hypotheses:
  - concrete_policy_engine_schema_to_be_defined_later
  - concrete_risk_scoring_to_be_defined_later
rejected_hypotheses:
  - broad_unbounded_agent_autonomy
  - capability_implies_authority
  - agent_self_escalation
  - unknown_authority_allows_execution
open_questions:
  - Q5_MODEL_ROUTER
repo_live_state_reference:
  branch: planning/mcf-nextgen-discovery
next_action: START_Q5
resume_instructions: >-
  Consultar GitHub live, ler Resume Card, este checkpoint e o roadmap do questionário;
  não repetir Q1-Q4; iniciar Q5 somente como Discovery; não implementar NextGen.
```
