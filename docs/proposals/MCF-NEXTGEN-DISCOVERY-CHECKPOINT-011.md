# MCF NextGen — Discovery Checkpoint 011

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-011`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-14  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação explícita de LEANDRO para a Q9 do Discovery e fixar o ponto de retomada em Q10.

---

# 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 9
next_question: 10
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: COMPLETED_APPROVED_BY_LEANDRO
Q9: COMPLETED_APPROVED_BY_LEANDRO
Q10: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
```

A aprovação da Q9 é conceitual. Ela NÃO autoriza implementação do MCF NextGen e não fixa autenticação concreta da UI, canais de notificação, disponibilidade da interface, placement ou métricas formais finais.

---

# 2. Pergunta aprovada

## Q9 — Como deve ser a experiência humana e a observabilidade?

Decisão consolidada:

> O MCF deve usar `ACTIONABLE_PROGRESSIVE_OBSERVABILITY`: a experiência humana prioriza objetivo, estado, progresso material, bloqueios, necessidade real de ação humana e próximo passo; detalhes operacionais, timeline, evidências e telemetria aparecem progressivamente sob demanda, sempre derivados do estado canônico e nunca como fonte concorrente de verdade.

Princípio central:

> LEANDRO administra objetivos e decisões humanas legítimas; o MCF administra a complexidade técnica e só escala quando a política de autoridade/risco realmente exige ação humana.

---

# 3. Perguntas primárias da experiência humana

A visão principal deve responder rapidamente:

```text
1. O que estamos fazendo?
2. Onde estamos agora?
3. O que já foi concluído?
4. Existe algum problema material?
5. LEANDRO precisa agir?
6. Qual é o próximo passo?
```

A experiência humana deve ser orientada a exceções, decisões e progresso, não a despejo de telemetria.

---

# 4. Severidade operacional e atenção humana são eixos separados

```yaml
operational_severity:
  - NORMAL
  - INFO
  - DEGRADED
  - HIGH
  - CRITICAL

human_attention:
  - NONE
  - INFORMATIVE
  - DECISION_REQUIRED
  - HUMAN_GATE_REQUIRED
```

Invariantes:

```text
CRITICAL != HUMAN_GATE_REQUIRED
BLOCKED != HUMAN_ACTION_REQUIRED
TECHNICAL_FAILURE != HUMAN_GATE
```

Um incidente tecnicamente crítico pode ser resolvido pela equipe dentro da autoridade concedida; uma decisão de produto de baixo risco técnico pode pertencer exclusivamente a LEANDRO.

---

# 5. Decision Inbox / Central de Perguntas e Decisões

Decisões humanas necessárias devem ser centralizadas e deduplicadas.

Cada decisão material deve carregar, conceitualmente:

```yaml
human_decision_request:
  decision_id:
  object_id:
  object_version:
  state_version:
  question:
  why_human_is_required:
  recommendation:
  alternatives:
  risk:
  consequences:
  evidence_refs:
  lifecycle:
```

Lifecycle mínimo:

```text
OPEN
ANSWERED
EXPIRED
SUPERSEDED
CANCELLED
```

`ONE HUMAN DECISION NEED != N AGENT NOTIFICATIONS`.

A recomendação dos agentes/equipe é informação de suporte e nunca equivale à decisão autorizada de LEANDRO.

---

# 6. Aprovação humana é vinculada à versão

Invariante:

> `HUMAN_APPROVAL_IS_VERSION_BOUND`.

Uma aprovação deve valer somente para o objeto/versão/estado apresentados a LEANDRO.

Antes de executar uma ação derivada da aprovação, o runtime deve revalidar que o objeto e o estado material continuam compatíveis. Se a versão mudou de forma material, a decisão anterior torna-se stale/superseded e não deve ser aplicada silenciosamente ao novo estado.

---

# 7. UI é derived view e comandos não mutam estado diretamente

```text
DASHBOARD != SOURCE_OF_TRUTH
BUTTON_CLICK != CANONICAL_STATE_CHANGE
```

A UI deve emitir intenção/comando autenticado; a transição material exige, conforme política:

```text
USER INTENT
  -> COMMAND
  -> AUTHORITY CHECK
  -> STATE/VERSION REVALIDATION
  -> POLICY CHECK
  -> TRANSITION
  -> RECEIPT
```

A UI e outros read models devem carregar freshness suficiente para não apresentar dados stale como live.

---

# 8. Progressive disclosure

Níveis conceituais aprovados:

```text
HUMAN_SUMMARY
  -> OPERATIONAL_DETAIL
  -> TIMELINE
  -> EVIDENCE
  -> RAW_TELEMETRY
```

A visão simples pode remover detalhe, mas não pode ocultar fatos materiais relevantes à decisão.

`SIMPLE_VIEW` e `TECHNICAL_VIEW` devem representar a mesma realidade subjacente.

---

# 9. Timeline cronológica e causal

A timeline pode mostrar sequência e causalidade, mas relações devem ser tipadas para evitar inferência indevida:

```yaml
relationship_type:
  - OBSERVED_SEQUENCE
  - EXPLICIT_DEPENDENCY
  - VERIFIED_CAUSAL_LINK
  - INFERRED_RELATIONSHIP
  - UNKNOWN
```

Invariantes:

```text
POST_HOC != CAUSATION
UNKNOWN_CAUSE_REMAINS_UNKNOWN
UNSUPPORTED_EXPLANATION = FORBIDDEN
```

---

# 10. Progresso material

Percentual ingênuo baseado apenas em contagem de tasks não deve ser o padrão, pois replanning pode alterar o número de tarefas.

Preferência conceitual:

```text
milestones
+ acceptance criteria
+ Completion Contract
+ current plan version
```

Métricas formais e scorecards ficam para Q13.

---

# 11. Notificações e alert fatigue

Notificações devem ser baseadas em mudança material, não em polling ou repetição do mesmo estado.

Exemplos de gatilhos relevantes:

- mudança material de estado;
- mudança de `human_attention`;
- HUMAN_GATE passa a ser requerido;
- deadline/escalation threshold relevante;
- falha/recuperação material quando a política exigir comunicação.

Deduplicação é obrigatória quando múltiplos agentes detectam a mesma necessidade humana.

---

# 12. Controles humanos: pause, cancel e emergency stop

São comandos semanticamente diferentes:

```text
PAUSE != CANCEL != EMERGENCY_STOP
```

A interface também deve distinguir intenção aceita de efeito confirmado:

```text
PAUSE_REQUESTED
  -> PAUSING
  -> PAUSED
```

`REQUESTED != ENFORCED`.

A fricção de interação deve ser proporcional ao risco. Ações materiais exigem revalidação e receipt.

---

# 13. Multi-project overview sem mistura de memória

Uma visão global de projetos é permitida por meio de summaries/views autorizadas.

Invariante:

```text
GLOBAL_OVERVIEW != MEMORY_MERGE
```

Memória, estado e autoridade continuam isolados por projeto; a agregação usa projeções controladas.

---

# 14. Observabilidade de agentes e privacidade de raciocínio

A observabilidade pode expor, conforme autorização:

- agente/run ativo;
- tarefa atual;
- modelo/provider/backend;
- tool calls materiais;
- estados/transições;
- decisões declaradas;
- receipts/evidências;
- custo/tempo/retries quando disponíveis.

Não há requisito de armazenar/exibir chain-of-thought privada do modelo.

```text
OBSERVABILITY = ACTIONS + STATE + DECISIONS + EVIDENCE + RECEIPTS
PRIVATE_CHAIN_OF_THOUGHT = NOT_REQUIRED
```

---

# 15. Evidência sob demanda

Afirmações materiais apresentadas ao humano devem permitir navegar até sua justificativa e evidência sem despejar logs brutos por padrão.

```text
CLAIM
  -> CHECKS / REASON
  -> EVIDENCE REFS
  -> SOURCE / VERSION
```

`TEAM_RECOMMENDATION != AUTHORIZED_DECISION`.

---

# 16. O que fica deliberadamente para depois

A Q9 não precisa fixar agora:

- tecnologia/UI framework concreta;
- autenticação e autorização técnica dos comandos;
- canais exatos de notificação;
- disponibilidade/SLA da interface;
- placement de serviços/read models;
- criptografia/secrets/enforcement detalhado;
- métricas formais de custo/progresso/valor.

Esses temas pertencem principalmente às Q11, Q12, Q13 e à arquitetura final Q16.

---

# 17. Decisão consolidada

```yaml
Q9_DECISION:
  status: APPROVED_BY_LEANDRO
  experience_model: ACTIONABLE_PROGRESSIVE_OBSERVABILITY
  dashboard_is_source_of_truth: false
  dashboard_freshness_visible: REQUIRED
  operational_severity_separate_from_human_attention: REQUIRED
  technical_blocker_implies_human_gate: false
  human_approval_version_bound: REQUIRED
  stale_human_decision_detection: REQUIRED
  decision_deduplication: REQUIRED
  decision_lifecycle: REQUIRED
  ui_direct_state_mutation: FORBIDDEN
  command_authority_revalidation: REQUIRED
  command_state_version_revalidation: REQUIRED
  material_action_receipt: REQUIRED
  simple_view_may_hide_material_fact: false
  unknown_cause_remains_unknown: true
  unsupported_causality: FORBIDDEN
  causal_relationship_typing: REQUIRED
  naive_task_percentage_as_default: DISCOURAGED
  material_transition_notifications: REQUIRED
  repeated_alert_flooding: FORBIDDEN
  pause_cancel_emergency_stop_distinct: REQUIRED
  requested_vs_enforced_state_distinct: REQUIRED
  multi_project_memory_merge: FORBIDDEN
  private_chain_of_thought_required_for_observability: false
  implementation_authorized: false
```

---

# 18. Ponto de retomada

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
last_completed_question: 9
next_question: 10
approved_decisions:
  - Q1_PURPOSE
  - Q2_LAYERED_CONTINUITY_ARCHITECTURE
  - Q3_AGENT_CONTRACT
  - Q4_MISSION_BOUNDED_RISK_BASED_AUTONOMY
  - Q5_CAPABILITY_AND_POLICY_BASED_ROUTER
  - Q6_RISK_BASED_REVIEW_INDEPENDENCE
  - Q7_HIERARCHICAL_GOVERNED_EXECUTION_GRAPH
  - Q8_LAYERED_CANONICAL_PERSISTENCE
  - Q9_ACTIONABLE_PROGRESSIVE_OBSERVABILITY
working_hypotheses:
  - concrete_ui_and_notification_channels_to_be_defined_later
  - concrete_command_auth_and_policy_enforcement_to_be_defined_later
  - formal_progress_and_value_metrics_to_be_defined_in_Q13
rejected_hypotheses:
  - dashboard_as_source_of_truth
  - critical_operational_severity_automatically_means_human_gate
  - stale_approval_applies_to_new_object_version
  - ui_button_directly_mutates_canonical_state
  - temporal_sequence_is_automatically_causality
  - naive_task_count_is_reliable_universal_progress
  - multiple_agents_create_multiple_human_prompts_for_same_decision
  - global_dashboard_may_merge_project_memories
open_questions:
  - Q10_CORE_VS_FACTORY_PLUGIN_PROFILE
repo_live_state_reference:
  branch: planning/mcf-nextgen-discovery
  pre_write_head: f2c92f92e965f7f9f6b647ead21e67fa805d1862
next_action: START_Q10
resume_instructions: >-
  Consultar GitHub live, ler Resume Card, este checkpoint e o roadmap;
  não repetir Q1-Q9; iniciar Q10 somente como Discovery; não implementar NextGen.
```
