# MCF NextGen — Discovery Checkpoint 010

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-010`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-14  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação explícita de LEANDRO para a Q8 do Discovery e fixar o ponto de retomada em Q9.

---

# 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 8
next_question: 9
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: COMPLETED_APPROVED_BY_LEANDRO
Q9: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
```

A aprovação da Q8 é conceitual. Ela NÃO autoriza implementação do MCF NextGen e não fixa tecnologia física de banco, object storage, filas, backup topology ou mecanismo concreto de segurança.

---

# 2. Pergunta aprovada

## Q8 — Qual documentação e estado persistente são realmente necessários?

Decisão consolidada:

> O MCF deve usar `LAYERED_CANONICAL_PERSISTENCE`: separar semanticamente conhecimento canônico, estado operacional, histórico de transições, evidências e visões derivadas; cada classe de claim possui política explícita de resolução de autoridade; estado e transições devem permanecer consistentes dentro de um boundary durável único ou garantia equivalente.

Princípio central:

> Persistir somente o que é necessário para reconstruir, provar, governar e retomar o projeto — sem transformar documentação, chats ou snapshots derivados em fontes concorrentes de verdade.

---

# 3. Camadas lógicas de persistência

```yaml
logical_layers:
  canonical_knowledge:
    purpose: conhecimento declarativo e durável
    versioned: true
    preferred_medium: GIT_WHEN_APPROPRIATE

  operational_state:
    purpose: estado atual de missões, tasks, gates, runs e blockers
    durable: true
    transactional_or_equivalent: true

  transition_ledger:
    purpose: histórico auditável de transições e eventos relevantes
    durable: true
    append_or_immutability_semantics: true

  evidence:
    purpose: provas, receipts, logs e artifacts
    integrity_metadata: required
    governed_retention: required

  derived_views:
    purpose: retomada, UX e síntese
    examples:
      - PROJECT_CAPSULE
      - RESUME_CARD
      - DASHBOARD
      - HANDOFF
    regenerable: true
    freshness_metadata: required
```

Essas cinco camadas são lógicas. A Q8 NÃO exige cinco sistemas físicos separados.

---

# 4. Política de autoridade por classe de claim

A formulação simples `ONE FACT -> ONE AUTHORITATIVE HOME` foi refinada para:

> `ONE CLAIM CLASS -> ONE AUTHORITATIVE RESOLUTION POLICY`.

Exemplo conceitual:

```yaml
authority_registry:
  source_code: GIT_AT_COMMIT
  approved_decision: DECISION_REGISTRY
  mission_current_state: OPERATIONAL_STATE
  mission_history: TRANSITION_LEDGER
  github_current_state: GITHUB_LIVE
  observed_historical_github_state: VERIFIED_SNAPSHOT
  evidence_content: EVIDENCE_STORE
  derived_view: NOT_AUTHORITATIVE
```

Estado live externo e observação histórica são classes distintas.

---

# 5. Consistência entre estado e transições

Principal finding resolvido pela auditoria:

`STATE_EVENT_DUAL_WRITE` não pode permitir estados oficiais pela metade.

Invariantes:

```yaml
consistency:
  partial_transition_commit: forbidden
  state_event_divergence: forbidden
  atomic_or_equivalent_transition_boundary: required
```

A Q8 não obriga Event Sourcing puro. O desenho aprovado é compatível com `Durable Operational State + Durable Transition Ledger`, desde que exista garantia de consistência equivalente.

---

# 6. GitHub e estado operacional

Git/GitHub permanece forte para:

- código;
- arquitetura;
- Agent Contracts;
- políticas;
- schemas/migrations;
- decisões duráveis;
- documentação humana/versionada.

GitHub NÃO deve ser tratado como banco operacional universal para heartbeat, locks, leases, fila, retries instantâneos, health volátil ou estado de task em alta frequência.

Invariante:

`LIVE_OPERATIONAL_STATE != DOCUMENTATION`.

---

# 7. Derived Views e freshness

Project Capsule, Resume Card, dashboards e handoffs são projeções derivadas e regeneráveis.

Devem carregar metadata suficiente para detectar staleness, por exemplo:

```yaml
derived_view:
  generated_at:
  source_state_version:
  event_cursor:
  knowledge_revision:
  source_refs:
  freshness: FRESH | STALE | UNKNOWN
```

Invariantes:

```text
DERIVED_VIEW != SOURCE_OF_TRUTH
STALE_DERIVED_VIEW != CURRENT_STATE
```

---

# 8. Checkpoints e snapshots

Checkpoint registra boundary significativo; não deve duplicar toda a história.

Snapshots/checkpoints devem ser ancorados em versões/cursors suficientes para relacioná-los ao estado e histórico correspondentes.

```yaml
checkpoint_anchor:
  state_version:
  event_cursor:
  plan_version:
  generated_at:
```

Snapshot é projeção histórica verificável, não uma verdade live concorrente.

---

# 9. Evidências e integridade

Evidências relevantes devem possuir metadata de integridade e proveniência, por exemplo:

```yaml
evidence:
  evidence_id:
  media_type:
  digest:
  size:
  locator:
  created_at:
  producer:
  retention_class:
```

`evidence_ref` sem integridade/proveniência suficiente não é garantia de prova durável.

---

# 10. Retenção, Raw Archive e dados sensíveis

A classificação `HOT / WARM / COLD` permanece válida, mas cada classe deve possuir política de retenção/arquivamento compatível com necessidade, risco e custo.

Raw Archive passa a ser conceitualmente `GOVERNED_RAW_ARCHIVE`:

- minimização de dados;
- classificação;
- redaction quando aplicável;
- controle de acesso;
- retenção/deleção governadas.

Invariantes:

```text
RAW != STORE_EVERYTHING_FOREVER
CONVERSATION != PROJECT_TRUTH
PERSIST_EVERY_AGENT_THOUGHT = false
```

Secrets não podem ser promovidos automaticamente à memória geral do projeto. A memória pode guardar `secret_ref`, nunca depender da propagação do secret em texto bruto.

Detalhes técnicos de segurança ficam principalmente para Q12.

---

# 11. Versionamento, supersession e approvals

Estruturas persistentes materiais devem possuir `schema_version` ou mecanismo equivalente de evolução compatível.

Decisões não devem ser silenciosamente reescritas:

```text
DECISION v1 -> SUPERSEDED_BY -> DECISION v2
```

Aprovações humanas materiais devem preservar autoridade, objeto/versão aprovada, momento e evidência/referência suficiente.

Invariante:

`AI_CLAIM_OF_HUMAN_APPROVAL != PROOF_OF_APPROVAL`.

---

# 12. Recovery e reconstrução

Persistência confiável exige recuperação testável.

Invariantes:

```text
BACKUP_EXISTS != RECOVERY_WORKS
```

A arquitetura deve suportar restauração coerente de conhecimento, estado, transition lineage e evidence refs.

Replay integral desde o primeiro evento não deve ser exigido. Snapshots/checkpoints confiáveis podem acelerar reconstrução, desde que ancorados no ledger/estado aplicável.

RPO/RTO, topologia de backup e placement físico ficam principalmente para Q11.

---

# 13. Compatibilidade com a fundação atual

A Q8 é uma evolução conceitual compatível com a direção do runtime atual, que já possui persistência durável de missões/fases/eventos/receipts e ledger de ações externas.

Regra de arquitetura:

> Reutilizar e evoluir mecanismos existentes quando satisfizerem os invariantes; não criar novos serviços apenas para reproduzir capacidades já presentes.

---

# 14. O que fica deliberadamente para depois

A Q8 não precisa decidir agora:

- PostgreSQL versus outra tecnologia;
- object storage concreto;
- filas/workers;
- topology de backup/restore;
- RPO/RTO;
- locks/leases concretos;
- encryption/KMS;
- ACLs e segredo management concreto;
- placement de serviços;
- enforcement técnico de segurança.

Esses temas pertencem principalmente a Q11, Q12 e Q16.

---

# 15. Decisão consolidada

```yaml
Q8_DECISION:
  status: APPROVED_BY_LEANDRO
  persistence_model: LAYERED_CANONICAL_PERSISTENCE
  claim_class_authority_registry: REQUIRED
  live_operational_state_is_documentation: false
  conversation_is_project_truth: false
  derived_views_are_authoritative: false
  derived_views_regenerable: REQUIRED
  derived_view_freshness_metadata: REQUIRED
  state_event_partial_transition: FORBIDDEN
  atomic_or_equivalent_transition_boundary: REQUIRED
  full_event_sourcing_required: false
  checkpoints_boundary_based: true
  snapshots_anchored_to_state_and_event_version: REQUIRED
  evidence_integrity_metadata: REQUIRED
  governed_retention: REQUIRED
  governed_raw_archive: REQUIRED
  secret_promotion_to_general_memory: FORBIDDEN
  schema_versioning: REQUIRED
  supersession_lineage: REQUIRED
  human_approval_provenance: REQUIRED
  tested_restorability: REQUIRED
  five_physical_systems_required: false
  implementation_authorized: false
```

---

# 16. Ponto de retomada

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
last_completed_question: 8
next_question: 9
approved_decisions:
  - Q1_PURPOSE
  - Q2_LAYERED_CONTINUITY_ARCHITECTURE
  - Q3_AGENT_CONTRACT
  - Q4_MISSION_BOUNDED_RISK_BASED_AUTONOMY
  - Q5_CAPABILITY_AND_POLICY_BASED_ROUTER
  - Q6_RISK_BASED_REVIEW_INDEPENDENCE
  - Q7_HIERARCHICAL_GOVERNED_EXECUTION_GRAPH
  - Q8_LAYERED_CANONICAL_PERSISTENCE
working_hypotheses:
  - concrete_persistence_technologies_to_be_defined_later
  - concrete_retention_values_to_be_defined_later
  - concrete_backup_rpo_rto_to_be_defined_later
  - concrete_security_enforcement_to_be_defined_later
rejected_hypotheses:
  - documentation_as_live_operational_database
  - conversation_as_project_truth
  - derived_views_as_authoritative_truth
  - unconstrained_dual_write_state_and_events
  - mandatory_full_event_sourcing
  - five_physical_persistence_systems_required
  - store_everything_forever
  - secret_propagation_into_general_memory
open_questions:
  - Q9_HUMAN_EXPERIENCE_AND_OBSERVABILITY
repo_live_state_reference:
  branch: planning/mcf-nextgen-discovery
next_action: START_Q9
resume_instructions: >-
  Consultar GitHub live, ler Resume Card, este checkpoint e o roadmap;
  não repetir Q1-Q8; iniciar Q9 somente como Discovery; não implementar NextGen.
```
