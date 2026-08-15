# MCF NextGen — Discovery Checkpoint 014

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-014`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-15  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação conceitual explícita de LEANDRO para a Q12 e fixar a retomada em Q13.

---

## 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 12
next_question: 13
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
Q13: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
prototype_authorized: false
```

A aprovação da Q12 é conceitual. Não autoriza implementar identity provider, credential broker, policy engine, sandbox, firewall, secret manager, assinatura, SLSA, OIDC, workload identity, MFA, plugin trust, rede, produção, workers ou qualquer outro mecanismo de segurança.

---

## 2. Pergunta aprovada

### Q12 — Quais controles de segurança, permissões e gates são essenciais?

Decisão consolidada:

> O MCF deve adotar `POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST`: nenhuma identidade, agente, worker, plugin, serviço, conteúdo externo ou modelo recebe confiança implícita; toda ação material deve passar por autorização contextual, enforcement verificável fora do modelo e fronteira de efeitos governada.

Subprincípios:

```text
ATTENUATED_DELEGATION
+
MEDIATED_MATERIAL_EFFECTS
```

Princípio central:

> O modelo pode propor. O agente pode solicitar. Somente uma camada de segurança verificável pode autorizar e efetivar ações materiais.

---

## 3. Default deny, identidade e cadeia de delegação

```yaml
security_defaults:
  unknown_identity: DENY
  unknown_authority: DENY
  unknown_compatibility: DENY
  missing_required_gate: DENY
  stale_gate: DENY
  expired_authority: DENY
```

`AUTHENTICATED != AUTHORIZED`.

Para efeitos materiais, preservar cadeia de principal/delegação suficiente para reconstruir quem pediu, executou e mediou o efeito:

```yaml
principal_chain:
  mission_authority:
  agent_id:
  run_id:
  worker_id:
  extension_id:
  adapter_id:
```

Invariante:

`DELEGATION_CAN_ONLY_ATTENUATE_AUTHORITY`.

Nenhuma delegação, plugin, worker, profile ou conteúdo externo pode ampliar autoridade recebida.

---

## 4. Autorização contextual

Autorização material deve ser vinculada, conforme aplicável, a:

- principal chain;
- mission/task/attempt;
- action;
- resource;
- audience;
- environment;
- security domain/project;
- authority scope;
- policy version;
- relevant state preconditions;
- expiration.

Permissão genérica como “pode usar GitHub” não é suficiente quando o efeito puder ser escopado por operação/recurso/contexto.

Least privilege é obrigatório; autorização ampla por conveniência não é default.

---

## 5. Policy Decision e Policy Enforcement

Para efeitos materiais:

```text
MODEL
  -> ACTION REQUEST
  -> POLICY DECISION
  -> POLICY ENFORCEMENT
  -> GOVERNED EFFECT BOUNDARY
  -> PROVIDER
  -> READ-BACK / EVIDENCE / RECEIPT
```

Invariantes:

```text
MODEL_COMPLIANCE_IS_NOT_SECURITY_BOUNDARY
DIRECT_MATERIAL_EFFECT_BYPASS = FORBIDDEN_WHEN_ARCHITECTURALLY_CONTROLLED
SECURITY_POLICY_MUTATION = PRIVILEGED_EFFECT
```

O modelo não é o Policy Enforcement Point. Prompt/instrução não substitui controle determinístico/verificável para efeito material.

Mudanças de policy, permissions, gates, credential bindings, plugin trust, network policy e equivalentes são efeitos privilegiados e não podem ser usadas para autoelevação indireta.

---

## 6. HUMAN_GATE de LEANDRO

LEANDRO permanece a autoridade humana final do MCF.

HUMAN_GATE material deve ser vinculado ao efeito realmente apresentado/autorizado, não apenas a um booleano `approved`.

Campos candidatos:

```yaml
human_gate:
  authority: LEANDRO
  decision_id:
  action:
  resource:
  object_id:
  object_version:
  effect_digest:
  expected_preconditions:
  policy_version:
  issued_at:
  expires_at:
  consumption_mode:
  evidence_ref:
```

Regras:

- `HUMAN_APPROVAL != REUSABLE_CREDENTIAL`;
- alteração do efeito/precondições invalida aprovação incompatível;
- replay protection é obrigatória;
- consumo deve ser explícito: `SINGLE_USE`, `BOUNDED_MULTI_USE` ou `CONTINUOUS_UNTIL_EXPIRY`, conforme policy;
- aprovação humana precisa de evidência confiável da identidade/ato de LEANDRO;
- agente não pode afirmar posteriormente “Leandro aprovou” sem evidence/authority ref.

Para decisões críticas, o efeito apresentado a LEANDRO deve ser derivado de dados canônicos e separar fatos/effect preview de recomendação da IA.

---

## 7. Gates internos

Q10 estabeleceu que named agents não pertencem necessariamente ao Core generalizável.

Logo o Core deve conhecer um papel/contrato de autoridade interna, e a instalação atual do MCF pode vincular esse papel a LÉO.

```text
INTERNAL_GATE_AUTHORITY_ROLE -> current MCF binding may be LÉO
HUMAN_GATE -> LEANDRO
```

Gate interno não substitui HUMAN_GATE quando a policy exigir LEANDRO, e consenso entre agentes não equivale à autoridade humana final.

---

## 8. Conteúdo externo, prompt injection e provenance de confiança

`EXTERNAL_CONTENT != AUTHORITY_SOURCE`.

Conteúdo externo pode fornecer dados, nunca ampliar automaticamente permissões, tools, secrets, gates ou autoridade.

Trust/provenance deve sobreviver a transformações:

```text
EXTERNAL_UNTRUSTED
  -> summary / RAG / translation / handoff
  -> still derived from EXTERNAL_UNTRUSTED
```

Invariante:

`TRANSFORMATION_DOES_NOT_PROMOTE_TRUST`.

O output de modelo também não é comando seguro por definição:

`MODEL_OUTPUT != SAFE_MATERIAL_COMMAND`.

Para ferramentas materiais, preferir schemas tipados, parâmetros validados, allowlists e construção confiável de comandos em vez de strings arbitrárias produzidas pela IA.

---

## 9. Secrets e credenciais

Invariantes:

```text
SECRET_VALUE != PROJECT_MEMORY
SECRET_VALUE != PROJECT_CAPSULE
SECRET_VALUE != PROMPT_BY_DEFAULT
SECRET_VALUE != LOG_OR_TELEMETRY
```

Quando possível:

```text
SECRET_REF
  -> CREDENTIAL BROKER / EFFECT BOUNDARY
  -> SHORT-LIVED / AUDIENCE-BOUND CREDENTIAL
  -> PROVIDER
```

O modelo deve evitar ver o valor do secret quando a capacidade puder ser oferecida sem exposição direta.

Superfícies de exfiltração incluem prompts, logs, telemetry, errors, URLs, headers, evidence, artifacts e cache.

Credenciais materiais remotas devem ser escopadas, expiráveis e revogáveis proporcionalmente ao risco.

---

## 10. Workers e isolamento

Workers não são trust peers do Control Plane por default.

Worker comprometido não deve, por design, conseguir automaticamente:

- alterar authority/policy;
- forjar HUMAN_GATE;
- escrever livremente ledger canônico;
- acessar secrets administrativos globais;
- cruzar projetos sem autorização;
- usar credenciais permanentes e irrestritas.

Preferências arquiteturais:

```text
TASK_SCOPED
SHORT_LIVED
AUDIENCE_BOUND
REVOCABLE
```

Output de worker permanece sujeito a validation/evidence antes de promoção a estado canônico.

Sandbox/isolation é proporcional ao risco; Q12 não fixa processo/container/VM específico.

---

## 11. Network, projeto e classificação de dados

Network egress deve ser governável conforme risco/policy.

Cross-project access é `DENY` por default.

Isolamento deve alcançar, quando aplicável:

- operational state/database namespaces;
- vector stores;
- object/evidence storage;
- caches;
- filesystem;
- credentials/secrets.

Dados materiais/sensíveis precisam de classificação e propagação de classificação.

Classes conceituais mínimas candidatas:

```text
PUBLIC
INTERNAL
SENSITIVE
SECRET
```

`MODEL_SELF_DECLASSIFICATION = FORBIDDEN`.

Transformar/resumir dados não reduz classificação automaticamente.

---

## 12. Plugins, extensões e supply chain

Extensões materiais devem possuir contratos verificáveis de identidade/integridade/compatibilidade/permissão.

```yaml
extension_security:
  extension_id:
  version:
  artifact_digest:
  provenance:
  expected_source_or_builder:
  manifest:
  permissions:
  data_access:
  external_side_effects:
```

`PROVENANCE_PRESENT != ARTIFACT_TRUSTED`.

Provenance/digest precisam ser verificados contra trust policy e expectativas de source/builder/publisher; mudança de versão/artifact não herda confiança automaticamente.

Ativar extensão não amplia autoridade do agente/mission envelope.

---

## 13. Efeitos, idempotência, evidence e receipts

Q12 preserva os controles comprovados na v1 e as decisões Q4/Q7/Q8/Q11:

- reservation/idempotency quando aplicável;
- no blind retry;
- read-back/reconciliation;
- efeito incerto permanece `UNKNOWN`;
- receipt contextual e íntegro;
- evidence separada do claim.

Para efeitos materiais, Authorization Receipt deve ser suficiente para reconstruir a decisão de segurança, por exemplo:

```yaml
authorization_receipt:
  request_digest:
  subject_chain:
  action:
  resource:
  policy_version:
  authority_ref:
  gate_ref:
  decision: ALLOW | DENY | REQUIRE_GATE
  attempt_id:
  effect_digest:
  result:
  verification_ref:
  integrity_ref:
```

`RECEIPT != EFFECT_PROOF`.

Receipt prova a decisão/registro; read-back/evidence prova o estado observado.

Negativas e mudanças materiais de segurança também precisam ser auditáveis sem expor secrets: ALLOW, DENY, REQUIRE_GATE, REVOKE, policy change, credential issue/revoke, plugin enable/disable e gate consumption, conforme policy.

---

## 14. Revogação, Emergency Stop e break-glass

Autoridade material deve ser revogável e/ou limitada por lifetime compatível com o risco.

Quanto maior o risco, mais próxima do efeito deve estar a autorização/revalidação quando tecnicamente viável.

Preservado de Q9/Q11:

`STOP_REQUESTED != STOP_ENFORCED`.

Se houver mecanismo futuro `BREAK_GLASS`, ele não pode ser bypass genérico:

```yaml
break_glass:
  human_authority_required: true
  reason_required: true
  scope_limited: true
  time_limited: true
  audited: true
  normal_use: forbidden
```

Q12 não obriga implementação inicial de break-glass.

---

## 15. Resource abuse / security budgets

Complexity Budget (Q7), admission control/backpressure (Q11) também têm função de segurança.

O sistema deve conseguir impor limites materiais como:

```yaml
security_budget:
  tool_calls:
  external_effects:
  compute:
  api_requests:
  concurrent_actions:
```

Valores/medição econômica detalhada pertencem à Q13.

---

## 16. Integridade das próprias policies

Security policy, authority rules, HUMAN_GATE policy e extension trust policy são ativos críticos.

Devem possuir combinação verificável de:

- versionamento;
- change control;
- provenance;
- integridade;
- autoridade de modificação;
- recuperação/auditoria.

A branch de Discovery atual não é, por si só, o boundary final de proteção dessas futuras políticas. A tecnologia concreta de proteção é decisão de arquitetura/implementação posterior.

---

## 17. Correção de nomenclatura Q4/Q6

Permanece a decisão da Q10: novas especificações não devem usar `R0–R4` sem namespace/semântica explícita, pois Q4 e Q6 possuem taxonomias históricas colidentes.

Q12 não reabre a substância da Q6; apenas evita que policy/permissions introduzam ambiguidade futura.

---

## 18. Deferimentos corretos

Q12 não escolhe ainda:

- IdP concreto;
- MFA concreto;
- OIDC/workload identity;
- SPIFFE/SPIRE;
- Vault/secret manager;
- policy engine específico;
- firewall/service mesh;
- sandbox/container/VM específico;
- algoritmo/formato de assinatura;
- nível SLSA;
- PKI concreta;
- mecanismo de attestation;
- cryptographic key hierarchy;
- credential broker concreto;
- thresholds de security budgets.

Essas escolhas devem satisfazer os invariantes da Q12 e serão tratadas na consolidação/Q16 e implementação posterior autorizada.

---

## 19. Decisão consolidada

```yaml
Q12_DECISION:
  status: COMPLETED_APPROVED_BY_LEANDRO_CONCEPTUALLY
  security_model: POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST
  default_authorization: DENY
  authenticated_is_authorized: false
  principal_chain_for_material_effects: REQUIRED
  delegation_can_increase_authority: false
  least_privilege: REQUIRED
  audience_bound_authorization: REQUIRED_WHEN_APPLICABLE
  model_is_policy_enforcement_point: false
  deterministic_enforcement_for_material_effects: REQUIRED
  direct_material_effect_bypass: FORBIDDEN_WHEN_CONTROLLED
  policy_mutation_is_privileged_effect: true
  human_gate_authority: LEANDRO
  human_gate_effect_binding: REQUIRED
  human_gate_replay_protection: REQUIRED
  human_gate_consumption_mode: EXPLICIT
  external_content_can_expand_authority: false
  transformation_promotes_trust: false
  model_output_is_safe_command: false
  secret_promotion_to_memory: FORBIDDEN
  secret_visibility_to_model_by_default: FORBIDDEN
  worker_is_control_plane_trust_peer: false
  cross_project_default: DENY
  classification_propagation: REQUIRED
  model_self_declassification: FORBIDDEN
  extension_digest_and_provenance: REQUIRED
  provenance_verification_against_trust_policy: REQUIRED
  authorization_receipt_for_material_effects: REQUIRED
  receipt_equals_effect_proof: false
  revocation: REQUIRED
  security_budget_enforcement: REQUIRED
  security_policy_integrity_change_control: REQUIRED
  implementation_authorized: false
```

---

## 20. Ponto de retomada

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
last_completed_question: 12
next_question: 13
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
  - Q12_POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST
working_hypotheses:
  - concrete_security_technologies_deferred_until_architecture_consolidation
  - security_controls_should_reuse_v1_proven_patterns_when_they_fit_nextgen_contracts
rejected_hypotheses:
  - model_prompt_is_sufficient_security_enforcement
  - authenticated_means_authorized
  - agent_id_alone_is_complete_material_actor_identity
  - human_approval_is_reusable_boolean
  - transformed_external_content_becomes_trusted
  - plugin_provenance_presence_means_plugin_trusted
  - long_lived_unbounded_remote_credentials_are_default
  - policy_changes_are_ordinary_nonprivileged_configuration
open_questions:
  - Q13_COST_COMPLEXITY_AND_VALUE_PROOF
repo_live_state_reference:
  branch: planning/mcf-nextgen-discovery
  pre_q12_persistence_head: 749236fc3e660e4e43212537cad2688516ff802c
next_action: START_Q13
resume_instructions: >-
  Consultar GitHub live, ler Resume Card, este checkpoint e o roadmap;
  não repetir Q1-Q12; iniciar Q13 somente como Discovery; não implementar NextGen.
```
