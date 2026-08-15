# MCF NextGen — Discovery Checkpoint 008

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-008`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-14  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação explícita de LEANDRO para a Q6 do Discovery e fixar o ponto de retomada em Q7.

---

# 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 6
next_question: 7
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
```

A aprovação da Q6 é conceitual e não autoriza implementação do MCF NextGen.

---

# 2. Pergunta aprovada

## Q6 — O que significa independência entre agentes e revisores?

Decisão consolidada:

> Independência no MCF deve ser demonstrada por propriedades observáveis da execução e da revisão — contexto separado, decisão própria, coleta própria de evidências e ausência de contaminação por vereditos prévios — e não pelo nome da persona, pela simples troca de modelo ou por auto declaração do revisor.

Princípio central:

> `INDEPENDENCE != DIVERSITY`.

Diversidade de modelo, provider, runtime ou auditor externo reduz risco de falhas correlacionadas, mas não substitui independência real.

---

# 3. Requisitos mínimos para revisão independente

Para uma revisão ser classificada como `INDEPENDENT_REVIEW`, a execução deve satisfazer conceitualmente:

```yaml
independent_review_requires:
  separate_agent_identity: true
  separate_execution_context: true
  blind_first_verdict: true
  independent_evidence_collection: true
  separate_decision: true
  immutable_initial_receipt: true
```

`BLIND_FIRST` significa que o revisor recebe primeiro o artefato, requisitos, critérios de aceite e fontes canônicas necessárias, sem ser ancorado pelo veredito/conclusão do implementador ou por reviews prévios.

---

# 4. Compartilhamento permitido e contaminação

Compartilhar as mesmas fontes canônicas NÃO destrói independência.

Permitido:

- mesmo código/artefato;
- mesmos requisitos;
- mesmo repositório/GitHub;
- mesma especificação;
- mesmas fontes canônicas.

Contaminação a evitar antes do veredito inicial:

- conclusão do implementador;
- diagnóstico prévio;
- finding já formulado;
- veredito PASS/FAIL anterior;
- justificativas desenhadas para convencer o revisor.

Invariante:

`SHARED_CANONICAL_EVIDENCE_OK / SHARED_PRIOR_CONCLUSION_IS_CONTAMINATION`.

---

# 5. Independência versus diversidade

Mesmo modelo pode produzir revisão independente se contexto, evidência e decisão forem separados.

Modelos diferentes podem produzir revisão NÃO independente se um recebe e reproduz a conclusão do outro.

Portanto:

```text
INDEPENDENCE != MODEL_DIVERSITY
MODEL_DIVERSITY != PROOF_OF_INDEPENDENCE
```

Diversidade é camada adicional de assurance, aplicada conforme risco.

---

# 6. Review Receipt e prova de independência

O próprio revisor não pode provar sua independência apenas declarando-a.

A arquitetura futura deve conseguir registrar evidência operacional suficiente, por exemplo:

```yaml
review_receipt:
  reviewer_agent_id:
  session_or_run_id:
  model:
  provider:
  sources_read:
  prior_verdicts_visible:
  artifact_mutation_permission:
  review_started_at:
  verdict_committed_at:
```

Detalhes finais de schema/runtime ficam para especificação posterior.

Invariante:

`SELF_DECLARED_INDEPENDENCE != PROOF`.

---

# 7. Separação entre review, fix e validation

Para assurance forte, o revisor deve registrar seu veredito inicial antes de modificar o artefato.

Fluxo conceitual:

```text
DISCOVERY / REVIEW
  -> VERDICT + RECEIPT
  -> FIX
  -> VALIDATION
```

Isso preserva a evidência original e evita que o próprio processo de correção apague ou reinterprete o finding inicial.

---

# 8. Consenso e verdade

A concordância entre múltiplos modelos/agentes não constitui prova por si só.

Invariantes:

```text
CONSENSUS != TRUTH
REVIEWER CLAIM != VERIFIED FINDING
```

Resultado oficial continua dependendo de evidência, testes, estado canônico e autoridade aplicáveis.

Ausência de evidência suficiente permanece `UNKNOWN`, não `PASS`.

---

# 9. Níveis de assurance

Taxonomia conceitual aprovada:

```yaml
R0_SELF_REVIEW:
  description: mesmo agente/contexto ou auto revisão

R1_SEPARATE_REVIEW:
  description: agente/contexto separado, sem todas as garantias formais de independência

R2_INDEPENDENT_REVIEW:
  description: contexto separado + blind-first + evidência própria + decisão própria + receipt

R3_DIVERSE_INDEPENDENT_REVIEW:
  description: R2 + diversidade suficiente de modelo/provider/runtime conforme risco

R4_EXTERNAL_ASSURANCE:
  description: R3 + auditoria humana/externa quando o risco justificar
```

A seleção do nível deve ser `RISK_BASED`, evitando custo/latência desnecessários em tarefas triviais.

---

# 10. Divergência entre revisores

Majority vote não é regra padrão para resolver desacordo técnico.

Fluxo conceitual:

```text
DISAGREEMENT
  -> comparar evidências
  -> reproduzir/testar
  -> adjudicação independente quando necessário
  -> se inconclusivo: UNKNOWN / BLOCKED
  -> HUMAN_GATE LEANDRO apenas quando política/risco exigir decisão humana legítima
```

Invariante:

`MAJORITY_VOTE_DEFAULT = FORBIDDEN`.

---

# 11. Relação com Q2–Q5

A Q6 herda:

- Q2: memória não é evidência; ausência de prova permanece `UNKNOWN`;
- Q3: `AGENT OUTPUT != PROJECT TRUTH` e independência é separada de agenthood;
- Q4: assurance deve ser proporcional ao risco; HUMAN_GATE pertence exclusivamente a LEANDRO;
- Q5: diversidade/model routing não pode ser confundida com independência e capacidades precisam ser verificadas.

---

# 12. Decisão consolidada

```yaml
Q6_DECISION:
  status: APPROVED_BY_LEANDRO
  independence_is_persona_change: false
  independence_is_model_diversity: false
  blind_first_review: REQUIRED_FOR_R2_PLUS
  independent_evidence_collection: REQUIRED_FOR_R2_PLUS
  separate_decision: REQUIRED_FOR_R2_PLUS
  immutable_initial_receipt: REQUIRED_FOR_R2_PLUS
  self_declared_independence_is_proof: false
  consensus_is_truth: false
  reviewer_claim_is_verified_finding: false
  majority_vote_default: FORBIDDEN
  disagreement_resolution: EVIDENCE_BASED
  assurance_policy: RISK_BASED
  assurance_levels:
    - R0_SELF_REVIEW
    - R1_SEPARATE_REVIEW
    - R2_INDEPENDENT_REVIEW
    - R3_DIVERSE_INDEPENDENT_REVIEW
    - R4_EXTERNAL_ASSURANCE
  implementation_authorized: false
```

---

# 13. Ponto de retomada

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
last_completed_question: 6
next_question: 7
approved_decisions:
  - Q1_PURPOSE
  - Q2_LAYERED_CONTINUITY_ARCHITECTURE
  - Q3_AGENT_CONTRACT
  - Q4_MISSION_BOUNDED_RISK_BASED_AUTONOMY
  - Q5_CAPABILITY_AND_POLICY_BASED_ROUTER
  - Q6_RISK_BASED_REVIEW_INDEPENDENCE
working_hypotheses:
  - concrete_review_receipt_schema_to_be_defined_later
  - assurance_thresholds_by_risk_to_be_defined_later
rejected_hypotheses:
  - persona_change_proves_independence
  - model_change_proves_independence
  - consensus_equals_truth
  - self_declared_independence_is_sufficient
  - majority_vote_as_default_adjudication
open_questions:
  - Q7_ORCHESTRATION_MODEL
repo_live_state_reference:
  branch: planning/mcf-nextgen-discovery
next_action: START_Q7
resume_instructions: >-
  Consultar GitHub live, ler Resume Card, este checkpoint e o roadmap do questionário;
  não repetir Q1-Q6; iniciar Q7 somente como Discovery; não implementar NextGen.
```
