# MCF NextGen — Discovery Checkpoint 009

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-14  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação explícita de LEANDRO para a Q7 do Discovery e fixar o ponto de retomada em Q8.

---

# 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 7
next_question: 8
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
```

A aprovação da Q7 é conceitual. Ela NÃO autoriza implementação do MCF NextGen nem fixa mecanismos concretos de lock, fila, banco, scheduler ou compensação.

---

# 2. Pergunta aprovada

## Q7 — Como o trabalho deve ser orquestrado: pipeline, loops, graph ou paralelo?

Decisão consolidada:

> O MCF deve usar um `HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`: o fluxo principal organiza dependências acíclicas, paralelismo seguro e joins explícitos; loops de correção/recovery existem apenas como subfluxos delimitados, com progresso verificável, limites e condições de parada.

Princípio central:

> Paralelizar trabalho independente, serializar mutações conflitantes e nunca permitir loops, replanejamento ou expansão de tarefas sem governança.

---

# 3. Grafo principal e loops

```yaml
outer_graph:
  dependency_aware: true
  acyclic_dependencies: required
  explicit_transitions: required
  explicit_join_points: required

loops:
  isolated_subflows: true
  bounded: true
  max_iterations_required: true
  progress_evidence_required: true
  stop_conditions_required: true
  no_progress_detection_required: true
```

Deadlocks/ciclos arbitrários no grafo principal não são aceitos como modelo operacional normal.

---

# 4. Paralelismo e concorrência

Princípios:

```text
PARALLELISM != AUTOMATICALLY BETTER
TASK != AGENT
AGENT SAYS DONE != VERIFIED TASK SUCCESS
```

- tarefas independentes podem executar em paralelo;
- dependências devem ser respeitadas;
- leituras concorrentes podem ser permitidas conforme política;
- mutações conflitantes sobre o mesmo estado/recurso exigem coordenação;
- `last writer wins` não é política padrão aceitável para integração concorrente.

Mecanismos concretos de lock/versionamento/concorrência ficam para arquitetura posterior.

---

# 5. Joins, falhas parciais e integração

Todo join relevante deve declarar condições de entrada e predecessores exigidos.

```yaml
join:
  required_predecessors: explicit
  condition: explicit
```

Falha parcial em branches paralelas não pode avançar silenciosamente o fluxo. Cada nó deve possuir política explícita de falha/recovery compatível com seu efeito, podendo incluir retry, fallback, compensação, block ou replan.

Resultados paralelos que precisem ser combinados devem passar por etapa explícita de integração/merge e validação.

---

# 6. Replanning versionado

Invariante:

> Replanning cria nova versão de plano; não reescreve silenciosamente o histórico de execução.

```yaml
replanning:
  versioned: true
  immutable_execution_history: true
  authority_expansion: forbidden
  gate_removal: forbidden
  risk_ceiling_increase: forbidden_without_authority
  acceptance_criteria_erasure: forbidden
```

Replanning dentro do `Authority Envelope` pode ajustar tarefas e dependências, mas não ampliar autoridade ou eliminar proteções obrigatórias.

---

# 7. Complexity Budget e dynamic spawning

Decomposição, paralelismo e criação dinâmica de agentes/tarefas consomem orçamento de complexidade.

Conceito aprovado:

```yaml
complexity_budget:
  graph_depth: bounded
  fanout: bounded
  parallel_tasks: bounded
  active_agents: bounded
  task_count: bounded
  cost: bounded
  time: bounded
```

Valores concretos ficam para arquitetura/especificação posterior.

`UNBOUNDED_TASK_SPAWNING = FORBIDDEN`.

---

# 8. Estado, staleness e supersessão

Execuções devem carregar referência suficiente ao estado/plano/artefatos de entrada para permitir revalidação antes de integração.

Se o estado mudou de forma incompatível, output antigo deve ser rejeitado, revalidado, cancelado ou marcado como `SUPERSEDED`, conforme política.

Estados conceituais relevantes incluem:

```text
PENDING
READY
RUNNING
WAITING_DEPENDENCY
WAITING_GATE
SUCCEEDED
FAILED
BLOCKED
CANCELLED
SUPERSEDED
```

Detalhes finais da state machine ficam para implementação posterior.

---

# 9. Side effects, retries e compensação

Ações com efeitos externos não podem usar retry ingênuo.

```yaml
side_effect_task:
  idempotency_or_equivalent_control: required_when_possible
  compensation_strategy: required_when_applicable
```

Detalhes concretos de filas, idempotency keys, transactions/sagas e compensação são deferidos principalmente para Q11/Q12 e arquitetura final.

---

# 10. Completion Contract

A missão só pode ser marcada `COMPLETED` quando seu contrato de conclusão estiver satisfeito.

```yaml
completion_contract:
  required_outputs: satisfied
  acceptance_criteria: satisfied
  required_evidence: present
  required_reviews: passed
  required_gates: satisfied
  unresolved_blockers: 0
```

Invariante:

`GRAPH_EXHAUSTION != MISSION_COMPLETION`.

O grafo pode parar por falha, bloqueio ou cancelamento; somente critérios satisfeitos permitem conclusão verdadeira.

---

# 11. Relação com Q2–Q6

A Q7 herda:

- Q2: estado live e outputs precisam ser revalidados; histórico/evidência não pode ser reescrito silenciosamente;
- Q3: tarefa e agente são conceitos distintos;
- Q4: retries, replan, spawning e mutações permanecem dentro do `Authority Envelope` e do risco permitido;
- Q5: routing/fallback não pode criar loops ou reduzir hard requirements;
- Q6: níveis de assurance/review podem compor nós/gates do grafo conforme risco.

---

# 12. O que fica deliberadamente para depois

A Q7 não precisa definir agora:

- algoritmo concreto de scheduler;
- banco/event store;
- filas/workers;
- lock pessimista versus optimistic concurrency;
- formato final da state machine persistente;
- mecanismo concreto de idempotency/compensation;
- placement dos workers e serviços;
- enforcement técnico de permissões/gates.

Esses temas serão tratados principalmente em Q8, Q11, Q12 e na arquitetura final Q16.

---

# 13. Decisão consolidada

```yaml
Q7_DECISION:
  status: APPROVED_BY_LEANDRO
  orchestration_model: HIERARCHICAL_GOVERNED_EXECUTION_GRAPH
  outer_graph_acyclic_dependencies: REQUIRED
  bounded_isolated_loops: REQUIRED
  no_progress_detection: REQUIRED
  dependency_safe_parallelism: REQUIRED
  conflicting_mutations_coordinated: REQUIRED
  explicit_join_contracts: REQUIRED
  partial_failure_silent_advance: FORBIDDEN
  replanning_versioned: REQUIRED
  immutable_execution_history: REQUIRED
  complexity_budget: REQUIRED
  unbounded_task_spawning: FORBIDDEN
  stale_output_control: REQUIRED
  last_writer_wins_default: FORBIDDEN
  completion_contract: REQUIRED
  graph_exhaustion_is_completion: false
  implementation_authorized: false
```

---

# 14. Ponto de retomada

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
last_completed_question: 7
next_question: 8
approved_decisions:
  - Q1_PURPOSE
  - Q2_LAYERED_CONTINUITY_ARCHITECTURE
  - Q3_AGENT_CONTRACT
  - Q4_MISSION_BOUNDED_RISK_BASED_AUTONOMY
  - Q5_CAPABILITY_AND_POLICY_BASED_ROUTER
  - Q6_RISK_BASED_REVIEW_INDEPENDENCE
  - Q7_HIERARCHICAL_GOVERNED_EXECUTION_GRAPH
working_hypotheses:
  - concrete_scheduler_and_state_machine_to_be_defined_later
  - concrete_concurrency_control_to_be_defined_later
  - concrete_complexity_budget_values_to_be_defined_later
rejected_hypotheses:
  - purely_sequential_pipeline_as_universal_default
  - unrestricted_everything_parallel
  - arbitrary_cycles_in_outer_graph
  - unbounded_execution_loops
  - silent_plan_history_rewrite
  - unbounded_task_agent_spawning
  - last_writer_wins_as_default_merge_policy
open_questions:
  - Q8_PERSISTENT_STATE_AND_DOCUMENTATION
repo_live_state_reference:
  branch: planning/mcf-nextgen-discovery
next_action: START_Q8
resume_instructions: >-
  Consultar GitHub live, ler Resume Card, este checkpoint e o roadmap;
  não repetir Q1-Q7; iniciar Q8 somente como Discovery; não implementar NextGen.
```
