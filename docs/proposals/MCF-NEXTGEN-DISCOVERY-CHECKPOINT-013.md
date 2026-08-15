# MCF NextGen — Discovery Checkpoint 013

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-013`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-15  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação explícita de LEANDRO para a Q11 e fixar a retomada em Q12.

---

## 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 11
next_question: 12
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
Q12: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
prototype_authorized: false
```

A aprovação de Q11 é conceitual. Não autoriza provisionar VPS/cloud, implantar workers, migrar banco, alterar produção, secrets, providers, GitHub Actions ou qualquer infraestrutura existente.

---

## 2. Pergunta aprovada

### Q11 — Como deve funcionar a infraestrutura e o placement de serviços?

Decisão consolidada:

> O MCF deve adotar `PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT`: governança e verdade permanecem centralizadas logicamente, enquanto a execução pode ser distribuída entre local, VPS, cloud ou computação especializada conforme requisitos verificáveis de confiança, dados, capacidade, compatibilidade, custo e latência.

Princípio central:

> Centralizar verdade e governança; distribuir execução apenas quando houver benefício e sem permitir que placement, partições ou falhas ampliem autoridade.

---

## 3. Planos lógicos

A infraestrutura possui planos lógicos, que NÃO implicam serviços físicos separados:

```text
CONTROL PLANE
STATE PLANE
EXECUTION PLANE
INTEGRATION PLANE
PRESENTATION PLANE
```

Invariante:

`LOGICAL_PLANE != PHYSICAL_SERVICE`.

Uma instalação inicial pode consolidar múltiplos planos na mesma VPS/stack, desde que preserve as fronteiras semânticas, de autoridade, persistência e recuperação.

---

## 4. Control Plane e consistência

O Control Plane possui autoridade lógica única para coordenação canônica, política e gates.

```yaml
canonical_control:
  single_logical_authority: true
  ungoverned_multi_writer: FORBIDDEN
  active_active_without_consensus_or_fencing: FORBIDDEN
  canonical_state_prefers_consistency_under_partition: true
```

`SINGLE_LOGICAL_AUTHORITY != SINGLE_MACHINE_FOREVER`.

Alta disponibilidade futura não autoriza split-brain nem múltiplos escritores canônicos sem coordenação apropriada.

---

## 5. State Plane

O State Plane preserva os contratos da Q8:

- operational state durável;
- transition ledger durável;
- receipts/evidence metadata;
- checkpoints/recovery boundaries.

Invariantes:

```text
QUEUE != TASK SOURCE OF TRUTH
WORKER PRIVATE SCRATCH != PROJECT TRUTH
LOCAL STATE PLANE MAY BE CANONICAL
```

O estado canônico pode ser local/self-hosted quando a política exigir. O que é proibido é transformar cache/scratch privado de worker em verdade de projeto sem contrato explícito.

---

## 6. Execution Plane, leases e fencing

Workers são substituíveis quando possível e podem existir em local, VPS, cloud ou computação especializada.

Execução distribuída deve possuir:

```yaml
dispatch:
  durable: true
  attempt_identity: required
  execution_epoch_or_equivalent_fencing: required

leases:
  required_when_distributed: true
  worker_clock_is_authority: false
```

Lease sozinho não é suficiente. Um worker isolado pode continuar executando após expiração do lease. Para evitar split-brain e efeitos duplicados, tentativas materiais precisam de fencing/epoch ou mecanismo equivalente e revalidação compatível com o efeito.

Resultados de attempts/epochs obsoletos devem ser rejeitados ou reconciliados, não promovidos silenciosamente.

---

## 7. Partições de rede e execução offline

Se Control/State Plane não puderem ser consultados e a autoridade material não puder ser revalidada:

`UNKNOWN_AUTHORITY = DENY`.

```yaml
partitions:
  authority_unavailable_allows_new_material_effect: false
  offline_execution:
    possible_only_with_explicit_bounded_envelope: true
```

Execução offline futura só pode ocorrer dentro de envelope previamente autorizado, limitado por ações, dados, tempo, quantidade de efeitos e risco.

---

## 8. Fronteira de efeitos materiais

Efeitos externos materiais permanecem governados mesmo quando a task é executada remotamente.

```text
WORKER
  -> EFFECT REQUEST
  -> GOVERNED EFFECT BOUNDARY
  -> policy / authority / attempt+epoch / idempotency
  -> provider
  -> read-back / receipt
```

Invariantes:

```text
BLIND_RETRY = FORBIDDEN
PLACEMENT != AUTHORITY
CAPABILITY != AUTHORITY
```

Quando o domínio permitir, o objetivo é efeito observável `effectively-once` por idempotência, read-back, reconciliação e fencing; Q11 não promete `exactly-once` universal.

---

## 9. Placement Policy

Placement deriva de requisitos, não de provider fixo.

Hard requirements candidatos:

- trust boundary;
- data locality;
- required capabilities;
- authority constraints;
- runtime/Core compatibility.

Somente depois dos hard requirements o sistema pode otimizar:

- custo;
- latência;
- disponibilidade.

Fallback não pode reduzir silenciosamente requisitos. `LOCAL_REQUIRED`, por exemplo, não pode migrar para cloud apenas porque um worker local falhou.

Placement material deve produzir `Placement Receipt` com task/attempt, requisitos, node selecionado, candidatos rejeitados, versões relevantes e policy version.

---

## 10. Data boundaries

Data locality cobre mais que input.

```yaml
data_boundary:
  input: governed
  output: governed
  evidence: governed
  telemetry: governed
  cache: governed
```

Logs, traces, evidências ou prompts não podem vazar para placement não autorizado apenas porque o input principal permaneceu local.

---

## 11. Compatibilidade e version skew

Workers e runtimes distribuídos precisam declarar versões/capacidades verificáveis.

Campos candidatos:

```yaml
worker:
  worker_id:
  runtime_version:
  core_contract_version:
  capabilities:
  placement_class:
  health:
  last_seen:
```

`UNKNOWN_COMPATIBILITY = NOT_ELIGIBLE`.

Version skew controlado pode existir; incompatibilidade desconhecida não deve ser testada em execução material.

---

## 12. Artefatos, ambientes e deploy

Ambientes permanecem separados conceitualmente:

`DEV -> STAGING -> PRODUCTION`.

A identidade de release deve distinguir:

```yaml
release_identity:
  source_revision:
  artifact_digest:
  config_version:
```

`SOURCE_SHA != DEPLOYED_ARTIFACT_DIGEST`.

Container-first é preferível quando apropriado, mas não obrigatório universalmente. Kubernetes NÃO é requisito inicial.

Provider específico, GitHub Actions, Render, VPS ou SaaS são bindings/implementações, não identidade constitucional do MCF.

---

## 13. Recovery

Cada serviço material possui Recovery Class proporcional ao seu valor.

Recovery deve considerar failure domains:

- processo;
- máquina;
- provider;
- região, quando relevante.

O restore precisa reconstruir um ponto coerente entre state, ledger, evidence refs/artifacts e configuração/versionamento.

Invariantes:

```text
BACKUP_EXISTS != RECOVERY_WORKS
APP_REDEPLOY != DATA_RESTORE
APP_ROLLBACK != DATABASE_ROLLBACK
REDEPLOY != ROLLBACK != DATA_RESTORE != COMPENSATION != FAILOVER
```

Migrations/schema evolution precisam de estratégia compatível com recovery; voltar o aplicativo anterior não prova que o banco voltou a um estado compatível.

Restore testing permanece obrigatório conforme Q8.

---

## 14. Escala e backpressure

Q11 preserva o Complexity Budget da Q7.

```yaml
admission_control:
  required: true
backpressure:
  required: true
unbounded_worker_spawning: FORBIDDEN
```

`WORKER_ALIVE != TASK_PROGRESSING`.

Heartbeats provam apenas liveness; progresso material precisa de critérios próprios.

---

## 15. Emergency stop e revogação distribuída

Q11 preserva Q4/Q9:

`REQUESTED != ENFORCED`.

Em partição de rede, emergency stop pode não alcançar instantaneamente um worker remoto. Execução material remota deve usar autoridade limitada/expirável e revalidação proporcional ao risco para impedir que isolamento de rede produza autorização indefinida.

Os mecanismos concretos de identidade, credenciais, revogação, sandbox e network policy pertencem à Q12.

---

## 16. Portabilidade

Portabilidade significa capacidade real de migrar ou executar em placement alternativo preservando contratos e invariantes.

```text
PORTABLE != ACTIVE_MULTI_CLOUD
```

Não é requisito operar simultaneamente em vários clouds. A prova empírica de portabilidade pertence à Q14.

---

## 17. Deferimentos corretos

Q11 não decide ainda:

- autenticação de workers/agentes;
- secrets management;
- criptografia concreta;
- sandbox/container isolation policy detalhada;
- network policy e egress controls;
- plugin signing/supply chain;
- least privilege concreto;
- mecanismo concreto de fencing/consensus/queue;
- RPO/RTO numéricos;
- thresholds de capacidade/custo;
- provider final de cada componente.

Segurança concreta segue para Q12; métricas/custo/SLOs para Q13; prova de portabilidade para Q14; escolhas finais/migração para Q15/Q16.

---

## 18. Decisão consolidada

```yaml
Q11_DECISION:
  status: COMPLETED_APPROVED_BY_LEANDRO
  infrastructure_model: PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT
  logical_planes_are_physical_services: false
  single_logical_control_authority: true
  ungoverned_multi_writer: FORBIDDEN
  canonical_consistency_under_partition: REQUIRED
  queue_is_source_of_truth: false
  local_state_plane_may_be_canonical: true
  worker_private_state_is_project_truth: false
  durable_dispatch: REQUIRED
  distributed_execution_attempt_identity: REQUIRED
  fencing_or_execution_epoch: REQUIRED
  worker_clock_is_lease_authority: false
  material_effect_without_authority_revalidation: FORBIDDEN
  bounded_offline_envelope: REQUIRED_IF_OFFLINE_EXECUTION_EXISTS
  governed_material_effect_boundary: REQUIRED
  blind_retry: FORBIDDEN
  idempotency_readback_reconciliation: REQUIRED_WHEN_APPLICABLE
  silent_placement_requirement_downgrade: FORBIDDEN
  data_boundary_includes_telemetry_and_evidence: true
  unknown_worker_compatibility: NOT_ELIGIBLE
  source_revision_distinct_from_artifact_digest: true
  app_recovery_is_data_recovery: false
  admission_control: REQUIRED
  backpressure: REQUIRED
  unbounded_worker_spawning: FORBIDDEN
  coherent_recovery_point: REQUIRED
  restore_testing: REQUIRED
  portable_means_active_multicloud: false
  provider_binding_is_core_identity: false
  placement_receipt: REQUIRED
  implementation_authorized: false
```

---

## 19. Ponto de retomada

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
last_completed_question: 11
next_question: 12
approved_decisions:
  - Q1_PURPOSE
  - Q2_LAYERED_CONTINUITY_ARCHITECTURE
  - Q3_AGENT_CONTRACT
  - Q4_MISSION_BOUNDED_RISK_BASED_AUTONOMY
  - Q5_CAPABILITY_AND_POLICY_BASED_ROUTER
  - Q6_AUDITABLE_INDEPENDENCE
  - Q7_HIERARCHICAL_GOVERNED_EXECUTION_GRAPH
  - Q8_LAYERED_CANONICAL_PERSISTENCE
  - Q9_ACTIONABLE_PROGRESSIVE_OBSERVABILITY
  - Q10_MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS
  - Q11_PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT
working_hypotheses:
  - concrete_runtime_topology_to_be_decided_after_discovery
  - concrete_fencing_queue_consensus_technologies_deferred
  - concrete_provider_bindings_deferred
rejected_hypotheses:
  - mcf_identity_bound_to_single_vps_or_provider
  - lease_alone_prevents_split_brain
  - queue_is_canonical_task_truth
  - worker_private_scratch_is_project_truth
  - silent_locality_downgrade_to_cloud
  - application_redeploy_equals_data_recovery
  - active_multicloud_required_for_portability
open_questions:
  - Q12_SECURITY_PERMISSIONS_GATES
repo_live_state_reference:
  branch: planning/mcf-nextgen-discovery
next_action: START_Q12
resume_instructions: >-
  Consultar GitHub live, ler Resume Card, este checkpoint e o roadmap;
  não repetir Q1-Q11; iniciar Q12 somente como Discovery; não implementar NextGen.
```
