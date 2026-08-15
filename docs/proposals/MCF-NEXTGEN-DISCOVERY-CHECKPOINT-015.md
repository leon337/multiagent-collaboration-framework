# MCF NextGen — Discovery Checkpoint 015

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-015`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-15  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação explícita de LEANDRO para a Q13 e fixar a retomada em Q14.

---

## 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 13
next_question: 14
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
Q14: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
prototype_authorized: false
```

A aprovação da Q13 é uma decisão de Discovery. Não autoriza implementar laboratório de benchmarks, instrumentação, novos graders, pipelines de avaliação ou qualquer componente NextGen.

---

## 2. Pergunta aprovada

### Q13 — Como provar que o MCF vale o custo e a complexidade?

Decisão consolidada:

> O MCF deve adotar `PREDECLARED_COMPARATIVE_VALUE_EVALUATION`: toda alegação forte de valor deve nascer de uma hipótese e contrato de avaliação definidos antes da execução, comparar o candidato contra baseline credível, preservar hard constraints e reportar trade-offs, incerteza e escopo de generalização sem transformar benchmark interno em propaganda.

Princípio central:

> O MCF não precisa provar que é sempre melhor. Ele precisa produzir evidência confiável sobre quando sua complexidade gera valor, quando apenas troca uma vantagem por outra e quando deve ser simplificado.

---

## 3. Evaluation Contract pré-declarado

Antes de uma avaliação material, registrar conforme aplicável:

```yaml
evaluation_contract:
  hypothesis:
  evaluation_question:
  candidate:
  baseline:
  baseline_mode:
  scenario_pack_version:
  controlled_factors:
  intentionally_different_factors:
  hard_constraints:
  metrics:
  grader_contract:
  repetition_plan:
  cost_accounting:
  decision_rule:
  generalization_scope:
```

Regras:

- regras de avaliação não podem ser alteradas silenciosamente depois de observado o resultado;
- configuração do candidato e baseline deve ser identificável/versionada;
- o fator experimental precisa ser explícito;
- baseline deve ser crível, não um strawman.

---

## 4. Modos de baseline

Q13 distingue três perguntas diferentes:

```text
CONTROLLED_COMPONENT_BASELINE
EQUAL_BUDGET_BASELINE
PRACTICAL_ALTERNATIVE_BASELINE
```

- `CONTROLLED_COMPONENT`: isola contribuição de um componente mantendo os demais fatores equivalentes quando possível;
- `EQUAL_BUDGET`: compara qualidade/resultado sob orçamento equivalente de recursos;
- `PRACTICAL_ALTERNATIVE`: compara o MCF contra a alternativa simples que realmente seria usada na prática.

`BASELINE_MUST_BE_CREDIBLE`.

---

## 5. Governança dos cenários

A avaliação deve distinguir, conforme maturidade:

```text
DEVELOPMENT SET
REGRESSION SET
HOLDOUT SET
REAL-WORLD SET
```

- Development: pode ser usado para aprendizado e ajuste;
- Regression: preserva capacidades já demonstradas;
- Holdout: usado para alegações fortes sem otimização contínua sobre os mesmos casos;
- Real-world: mede utilidade em condições reais, sem assumir causalidade automática.

Cherry-picking de cenários é incompatível com alegação forte de superioridade.

---

## 6. Independência da avaliação

Sempre que existir ground truth determinístico, ele é preferível a julgamento por LLM.

Quando houver julgamento sem ground truth objetivo:

- candidate self-grading não pode ser a única evidência;
- avaliação independente/blind é preferida quando aplicável;
- avaliação humana pode ser usada quando subjetividade for material;
- `grader_contract`, rubric e versão precisam ser identificáveis.

Conecta diretamente à Q6: independência de avaliação não é provada por mera troca de persona/modelo.

---

## 7. Estocasticidade e repetição

Invariantes:

```text
ONE_RUN != PERFORMANCE
ONE_SUCCESS != RELIABILITY
ONE_FAILURE != GENERAL_FAILURE
```

Quando a variância for material:

- repetir execuções;
- preferir desenho pareado quando aplicável;
- reportar distribuição, variância/uncertainty e outliers relevantes;
- não generalizar um único run.

Model/provider snapshot, execution profile, MCF/profile/extensions e grader devem ser versionados quando relevantes.

---

## 8. Hard constraints antes de valor

Antes de comparar custo, velocidade ou conveniência, validar hard constraints da missão.

Exemplos conforme aplicável:

- authority;
- security;
- data boundary;
- critical correctness;
- required evidence.

Regra:

> Benefício econômico, latência ou throughput não compensa violação de invariante obrigatório.

Falhas críticas não podem desaparecer em médias agregadas.

Exemplos de hard failure:

```text
UNAUTHORIZED_MATERIAL_EFFECT
CANONICAL_TRUTH_CORRUPTION
SECRET_DISCLOSURE
HUMAN_GATE_BYPASS
```

`UNAUTHORIZED_SUCCESS = FAILURE`.

---

## 9. Correct block / unknown sem premiar inutilidade

Q13 distingue resultados corretos e incorretos:

```text
CORRECT_EXECUTION
CORRECT_BLOCK
CORRECT_UNKNOWN
INCORRECT_EXECUTION
INCORRECT_BLOCK
INCORRECT_UNKNOWN
```

Bloquear corretamente ou preservar `UNKNOWN` pode ser sucesso do framework; bloquear tudo ou declarar `UNKNOWN` indevidamente é sinal de falha/overblocking.

Assim, safety não é medida apenas por ausência de incidentes, mas também por utilidade.

---

## 10. Value Scorecard multidimensional

O default não é um score único escondendo trade-offs.

Dimensões aprovadas:

```yaml
value_scorecard:
  outcome_quality:
  reliability:
  human_effort:
  time_to_accepted_outcome:
  marginal_cost:
  structural_cost:
  rework:
  continuity:
  recovery:
  framework_overhead:
```

Métricas complementares podem ser adicionadas por família de missão, desde que pré-declaradas.

Se houver índice agregado, pesos devem ser explícitos, versionados e definidos antes do resultado.

Pareto/trade-off é resultado legítimo.

---

## 11. Custo e tempo

Separar:

### Custo marginal
- modelos/APIs;
- compute;
- tool calls;
- storage;
- retries;
- human active time por missão.

### Custo estrutural
- desenvolvimento;
- manutenção;
- infraestrutura permanente;
- observabilidade;
- migrações;
- governança.

Tempo deve distinguir quando relevante:

```text
TIME_TO_FIRST_OUTPUT
TIME_TO_ACCEPTED_OUTCOME
HUMAN_ACTIVE_TIME
WAITING_TIME
RECOVERY_TIME
```

Evitar falsa precisão em métricas humanas.

---

## 12. Provenance das medições

Cada medição material deve identificar sua origem:

```text
OBSERVED
COMPUTED
HUMAN_REPORTED
ESTIMATED
```

Conclusões derivadas continuam sujeitas à tipagem epistemológica já aprovada nas Q2/Q9.

---

## 13. Continuidade, alucinação e recovery como valor mensurável

Q13 transforma capacidades aprovadas em Q2/Q7/Q8/Q11/Q12 em resultados mensuráveis.

### Continuidade
Pode medir:

- reconstruction accuracy;
- missing material facts;
- false facts;
- repeated context requests;
- correctness da próxima ação.

### Epistemic safety
Pode medir:

- unsupported claims generated;
- unsupported claims promoted to canonical truth;
- `UNKNOWN` corretamente preservado;
- conflicts detected.

### Recovery
Pode usar falhas controladas como:

- worker crash;
- provider timeout;
- network failure;
- stale state;
- model unavailable;
- ambiguous tool result.

E avaliar detecção, recuperação, duplicação de efeito, intervenção humana e estado final.

---

## 14. Overhead e custo da própria avaliação

A avaliação precisa contabilizar o peso do framework:

```yaml
framework_overhead:
  extra_execution_steps:
  extra_model_calls:
  extra_tool_calls:
  extra_storage:
  extra_latency:
  extra_operational_components:
  extra_failure_points:
```

A própria avaliação também possui custo e deve ser proporcional ao impacto da decisão.

`EVALUATION_COST` faz parte do desenho de avaliação.

---

## 15. Controlled evidence vs field evidence

Resultados precisam declarar contexto:

```text
CONTROLLED
FIELD_OBSERVATION
```

Field observation é evidência de utilidade real, mas não prova causalidade automaticamente.

Toda conclusão forte deve declarar escopo de generalização, por exemplo:

```yaml
generalization_scope:
  mission_family:
  risk_class:
  complexity_range:
  environment:
  constraints:
```

---

## 16. Overfitting e blind preference

Para reduzir benchmark overfitting:

- preservar holdout/rotating cases quando alegações fortes exigirem;
- mover casos usados em otimização para regressão quando apropriado;
- combinar benchmark controlado com missões reais.

Quando avaliação humana subjetiva comparar variantes, blind labeling é preferido quando possível.

---

## 17. Estados formais de conclusão

Resultados permitidos:

```text
BENEFICIAL
NON_INFERIOR
TRADEOFF
REGRESSED
DISQUALIFIED_HARD_CONSTRAINT
INCONCLUSIVE
```

`INCONCLUSIVE` é resultado legítimo.

O framework não deve pressionar toda avaliação a terminar em `MCF_WINS`.

---

## 18. Interface com Q15

A Q13 não decide automaticamente preservar componentes. Ela produz evidência estruturada:

```yaml
component_value_evidence:
  component:
  invariant_protected:
  measured_benefits:
  measured_costs:
  ablation_result:
  alternatives:
  confidence:
  recommendation:
    PRESERVE | SIMPLIFY | REPLACE | REMOVE | INCONCLUSIVE
```

Regra aprovada:

> Complexidade precisa demonstrar valor mensurável ou proteger invariante obrigatório.

Refinamento essencial:

> Preservar o invariante não implica preservar a implementação atual usada para protegê-lo.

Essa distinção será usada na Q15.

---

## 19. Value Hypothesis

Para nova complexidade material, usar hipótese explícita de valor quando aplicável:

```yaml
value_hypothesis:
  expected_benefit:
  expected_cost:
  measurable_outcomes:
  evaluation_window:
  falsification_condition:
```

Isso evita adicionar arquitetura apenas porque parece sofisticada.

---

## 20. Invariantes consolidados da Q13

```text
ACTIVITY != VALUE
BASELINE_MUST_BE_CREDIBLE
ONE_RUN != PERFORMANCE
UNAUTHORIZED_SUCCESS = FAILURE
CRITICAL_FAILURE_CANNOT_BE_AVERAGED_AWAY
FIELD_OBSERVATION != AUTOMATIC_CAUSALITY
INCONCLUSIVE_IS_VALID
HIDDEN_SINGLE_SCORE = FORBIDDEN_BY_DEFAULT
COMPLEXITY_REQUIRES_VALUE_OR_REQUIRED_INVARIANT
PRESERVE_INVARIANT != PRESERVE_CURRENT_IMPLEMENTATION
```

---

## 21. Estado da arquitetura após Q13

Q13 não escolhe ferramenta concreta de benchmark, grader provider, banco de métricas ou plataforma de eval.

O que ficou aprovado é a metodologia arquitetural de prova de valor que qualquer implementação futura deverá satisfazer.

Nenhum benchmark executado durante a Discovery autoriza implementação NextGen.

---

## 22. Próxima pergunta canônica

### Q14 — Como validar portabilidade e utilidade fora do ambiente atual?

Status: `NEXT_NOT_STARTED`.

Objetivo: definir como provar que o MCF e seus contratos funcionam fora do ambiente atual, em outros providers/runtimes/projetos e, futuramente, para usuários/organizações diferentes, sem confundir portabilidade declarada com portabilidade demonstrada.

---

## 23. Retomada

```yaml
last_completed_question: 13
next_question: 14
approved_decisions:
  Q13: PREDECLARED_COMPARATIVE_VALUE_EVALUATION
working_hypotheses: []
rejected_hypotheses:
  - SELF_COMPARISON_IS_SUFFICIENT
  - STRAWMAN_BASELINE_IS_ACCEPTABLE
  - ONE_RUN_PROVES_RELIABILITY
  - CRITICAL_FAILURE_CAN_BE_AVERAGED_AWAY
  - HIDDEN_SINGLE_SCORE_IS_DEFAULT
open_questions:
  - Q14_PORTABILITY_AND_EXTERNAL_UTILITY
repo_live_state_reference:
  branch: planning/mcf-nextgen-discovery
  pre_Q13_approval_head: 2a3cbcb2a85f1b50b0655ea7e75c2f04a50d5542
next_action: START_Q14_DISCOVERY
resume_instructions: READ_RESUME_CARD_THEN_CHECKPOINT_015_AND_VALIDATE_GITHUB_LIVE
implementation_authorized: false
```
