# MCF NextGen — Discovery Checkpoint 007

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-14  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação explícita de LEANDRO para a Q5 do Discovery e fixar o ponto de retomada em Q6.

---

# 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 5
next_question: 6
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
```

A aprovação de Q5 é uma decisão conceitual de Discovery. Ela NÃO autoriza implementação do MCF NextGen nem fixa provider/modelo concreto.

---

# 2. Pergunta aprovada

## Q5 — Como deve funcionar o Roteador de Modelos de IA?

Decisão consolidada:

> O MCF deve usar um `CAPABILITY_AND_POLICY_BASED_ROUTER`: primeiro identificar requisitos obrigatórios da tarefa, filtrar apenas modelos/providers compatíveis e autorizados e, somente entre os candidatos válidos, otimizar qualidade, custo, latência, quota e confiabilidade.

Princípio central:

> O MCF roteia por requisitos verificáveis da tarefa, não por marca, popularidade ou mera disponibilidade do modelo.

---

# 3. Separação entre requisitos duros e preferências

```yaml
hard_requirements:
  capabilities: REQUIRED
  context_window: REQUIRED_WHEN_APPLICABLE
  tools: REQUIRED_WHEN_APPLICABLE
  structured_output: REQUIRED_WHEN_APPLICABLE
  security_policy: REQUIRED
  authority_policy: REQUIRED
  quality_floor: REQUIRED

soft_preferences:
  cost: OPTIMIZE
  latency: OPTIMIZE
  quota: OPTIMIZE
  reliability: OPTIMIZE
```

Invariante:

`HARD_REQUIREMENTS_CANNOT_BE_DOWNGRADED_BY_ROUTER`

Nenhuma pressão por custo, quota, velocidade ou disponibilidade autoriza o router a usar modelo abaixo dos requisitos mínimos sem nova decisão autorizada.

---

# 4. Model Capability Registry

A arquitetura futura deve possuir registro verificável de capacidades dos modelos/providers.

Campos conceituais candidatos:

```yaml
model_capability_registry:
  provider:
  model_id:
  capabilities:
    reasoning:
    coding:
    vision:
    tools:
    structured_output:
    context_window:
  economics:
    relative_cost:
  operational:
    availability:
    latency:
    quota:
  security:
    data_policy:
  evidence:
    source:
    verified_at:
  status:
```

Invariantes:

```yaml
model_self_claim_is_evidence: false
unknown_capability: NOT_COMPATIBLE
capability_provenance: REQUIRED
capability_freshness: REQUIRED
runtime_health: REQUIRED
```

A capacidade deve ser suportada por configuração confiável, documentação oficial, probing/teste ou evidência operacional apropriada.

---

# 5. Router não deve ser uma única IA soberana

Falha identificada na auditoria:

> Uma única IA decidindo sozinha qual IA usar recriaria o problema de confiança que o MCF pretende conter.

Decisão refinada:

- a extração inicial de requisitos pode usar raciocínio de IA;
- os requisitos aprovados/derivados precisam ser materializados em `Task/Capability Contract`;
- filtros de compatibilidade, políticas, limites e fallbacks devem ser governados por regras verificáveis e não apenas pela interpretação livre de um modelo;
- o router não pode reduzir requisitos para encontrar um candidato disponível.

Invariante:

`ROUTER_INTERPRETATION != ROUTING_AUTHORITY`

---

# 6. Fluxo conceitual aprovado

```text
TASK / MISSION
  -> Task Requirement Builder
  -> Hard Requirements + Soft Preferences
  -> Policy Filter
  -> Model Capability Registry
  -> Compatible Candidates
  -> Deterministic/Policy-Governed Ranking
  -> Preflight Capability Check
  -> Selected Model
  -> Execution
  -> Verification / Evidence
  -> Metrics + Registry Health Update
```

Se não existir modelo compatível:

`NO_COMPATIBLE_MODEL -> BLOCKED / ESCALATE`

O sistema não deve fingir compatibilidade nem degradar silenciosamente.

---

# 7. Fallback seguro

```yaml
fallback:
  allowed: true
  compatibility_required: true
  silent_capability_downgrade: FORBIDDEN
  bounded_attempts: REQUIRED
  routing_loops: FORBIDDEN
  no_compatible_fallback: BLOCK
```

O grafo/lista de fallback deve possuir limites claros de tentativa e evitar alternância infinita entre modelos/providers.

Trocar modelo preserva a identidade do agente apenas quando o novo backend satisfaz o contrato de capacidade aplicável.

Invariantes herdados da Q3:

```text
AGENTE != MODELO
IDENTITY CONTINUITY != CAPABILITY CONTINUITY
```

---

# 8. Custo, quotas e capacidade gratuita

Custo, free tier e quota são fatores de otimização, nunca requisitos superiores à capacidade/segurança.

Princípios:

```yaml
budget_and_quota:
  considered_before_selection: true
  reservation_when_applicable: DESIRED
  can_override_hard_requirements: false
  quota_exhaustion_allows_silent_downgrade: false
```

Um modelo gratuito é preferível quando satisfaz os mesmos requisitos e a política favorece custo, mas gratuidade por si só não prova adequação.

---

# 9. Qualidade e criticidade

Podem existir tiers operacionais candidatos, desde que não substituam requisitos específicos da tarefa:

```yaml
TIER_0_MECHANICAL:
  target: ECONOMICAL_COMPATIBLE_MODEL
TIER_1_NORMAL:
  target: BALANCED_MODEL
TIER_2_COMPLEX:
  target: STRONG_CAPABILITY_MODEL
TIER_3_CRITICAL:
  target: STRONG_MODEL_PLUS_POLICY_REQUIRED_VERIFICATION
```

Risco/complexidade maior pode elevar o piso cognitivo, mas a seleção final continua condicionada ao contrato da tarefa.

---

# 10. Anti-alucinação e segurança de routing

A Q5 herda os invariantes Q2–Q4.

```yaml
model_claim_about_capability: CLAIM_ONLY
router_claim_about_compatibility: CLAIM_UNTIL_POLICY_CHECK
unknown_capability: NOT_COMPATIBLE
hard_requirement_mutation_by_router: FORBIDDEN
external_content_changes_router_policy: FORBIDDEN
routing_receipt: REQUIRED
```

Toda decisão material de roteamento deve ser auditável, incluindo requisitos usados, candidatos eliminados, modelo escolhido, motivo, fallback e evidências relevantes.

---

# 11. O que Q5 não decide

Permanecem para perguntas posteriores:

- critérios formais completos de revisão independente (Q6);
- graph/loops/paralelismo de trabalho (Q7);
- persistência concreta do registry/logs (Q8/Q11);
- UX do router (Q9);
- placement de serviços/providers (Q11);
- segurança, secrets, sandboxing e permissões granulares (Q12);
- métricas/benchmarks finais de qualidade e custo-benefício (Q13);
- validação multi-provider e portabilidade (Q14);
- implementação concreta do router.

---

# 12. Decisão consolidada

```yaml
Q5_DECISION:
  status: APPROVED_BY_LEANDRO
  router: CAPABILITY_AND_POLICY_BASED
  route_by_requirements_not_brand: true
  agent_identity_survives_compatible_model_switch: true
  hard_requirements_mutable_by_router: false
  unknown_capability: NOT_COMPATIBLE
  model_self_claim_is_evidence: false
  capability_registry: REQUIRED_CONCEPT
  capability_provenance: REQUIRED
  capability_freshness: REQUIRED
  runtime_health: REQUIRED
  silent_capability_downgrade: FORBIDDEN
  bounded_fallback: REQUIRED
  routing_loops: FORBIDDEN
  no_compatible_model: BLOCK
  routing_receipt: REQUIRED
  cost_quota_latency_after_hard_filters: true
  implementation_authorized: false
```

---

# 13. Ponto de retomada

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
last_completed_question: 5
next_question: 6
approved_decisions:
  - Q1_PURPOSE
  - Q2_LAYERED_CONTINUITY_ARCHITECTURE
  - Q3_AGENT_CONTRACT
  - Q4_MISSION_BOUNDED_RISK_BASED_AUTONOMY
  - Q5_CAPABILITY_AND_POLICY_BASED_ROUTER
working_hypotheses:
  - final_task_requirement_schema_to_be_defined_later
  - final_capability_registry_schema_to_be_defined_later
  - quality_scoring_and_benchmarks_to_be_defined_later
rejected_hypotheses:
  - fixed_single_model_as_general_rule
  - cheapest_model_first_without_hard_filters
  - strongest_model_for_every_task
  - silent_capability_downgrade
  - router_can_relax_hard_requirements
  - unbounded_fallback_loops
open_questions:
  - Q6_INDEPENDENT_AGENTS_AND_REVIEWERS
repo_live_state_reference:
  branch: planning/mcf-nextgen-discovery
next_action: START_Q6
resume_instructions: >-
  Consultar GitHub live, ler Resume Card, este checkpoint e o roadmap do questionário;
  não repetir Q1-Q5; iniciar Q6 somente como Discovery; não implementar NextGen.
```
