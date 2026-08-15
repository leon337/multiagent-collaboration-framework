# MCF NextGen — Discovery Checkpoint 017

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-017`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-15  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação condicional de LEANDRO para a Q15 após auditoria crítica final sem bloqueio conceitual remanescente e fixar a retomada em Q16.

---

## 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 15
next_question: 16
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
Q14: COMPLETED_APPROVED_BY_LEANDRO_AFTER_NO_BLOCKER_REVIEW
Q15: COMPLETED_APPROVED_BY_LEANDRO_AFTER_NO_BLOCKER_REVIEW
Q16: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
prototype_authorized: false
```

A aprovação da Q15 é uma decisão de Discovery. Não autoriza apagar, refatorar, substituir, migrar, desativar ou implementar componentes NextGen.

---

## 2. Pergunta aprovada

### Q15 — O que deve ser preservado, simplificado, removido ou substituído?

Estratégia consolidada:

> O MCF deve adotar `PRESERVE_INVARIANTS_REDUCE_IMPLEMENTATION`: preservar capacidades e invariantes que provaram valor, protegem segurança/correção ou são necessários para compatibilidade/migração; simplificar, substituir ou retirar implementações cuja complexidade não seja necessária para manter essas propriedades.

Princípio central:

> `PRESERVE_INVARIANT != PRESERVE_CURRENT_IMPLEMENTATION`.

Q15 não é uma lista de deleções. É um mapa de transição seguro da v1 para a arquitetura alvo.

---

## 3. Disposições permitidas

Q15 usa explicitamente:

```text
PRESERVE
SIMPLIFY
REPLACE
REMOVE
INCONCLUSIVE
ADD_REQUIRED
```

`INCONCLUSIVE` é obrigatório quando a evidência não sustenta uma decisão de poda.

`ADD_REQUIRED` identifica capabilities aprovadas em Q1–Q14 que não possuem equivalente suficiente na v1. Isso não autoriza implementação durante Discovery.

---

## 4. Semântica vs implementação

Toda classificação relevante deve distinguir:

```yaml
semantic_disposition:
  PRESERVE | SIMPLIFY | REPLACE | REMOVE | INCONCLUSIVE

implementation_disposition:
  KEEP | EVOLVE | REPLACE | RETIRE | INCONCLUSIVE
```

Preservar uma capability não obriga preservar classes, serviços, providers, topologia, arquivos, nomes de agentes ou schema atuais.

---

## 5. Elementos a preservar semanticamente

Preservar fortemente como capacidades/invariantes:

- durable mission/task state;
- separação de memória, evidência, autoridade e live state;
- transition ledger e lineage;
- evidence/provenance e `UNKNOWN` quando evidência for insuficiente;
- receipts estruturados, preferencialmente derivados/automatizados;
- governed external effects;
- idempotency, read-back e reconciliation;
- fail-closed authorization;
- TEAM_FIRST / proteção contra transformar a autoridade humana em operador técnico padrão;
- Agent Contract e seleção dinâmica por competência;
- Skill Contract como contrato governado;
- observability semantics e recovery;
- exact revision/artifact identity, readiness e validation discipline;
- assurance, independent review e HUMAN_GATE semantics;
- canonical decisions/evidence/history;
- stable v1.0.0 como referência histórica e baseline comparativo.

---

## 6. Elementos a simplificar/evoluir

Simplificar ou evoluir sem reduzir invariantes:

- receipts/documentação operacional: automatizar e derivar, sem remover auditabilidade;
- Skill Registry monolítico: separar capability contracts de provider/instance bindings;
- status/views duplicadas: manter como derived views, não fontes concorrentes;
- runtime atualmente hospedado em `rede-social-agentes`: extrair boundary lógico, sem exigir microservices;
- observability UI/dashboard: interface substituível sobre estado canônico;
- recovery terminology: distinguir retry, reconciliation, redeploy, rollback, compensation, restore e failover.

---

## 7. Elementos a substituir gradualmente

Substituição é gradual e condicionada a compatibilidade/conformance:

- keyword-based Chat Mission Planner;
- PermissionEngine com special cases de Lot/Gate/provider codificados;
- HDF com identidades `Leandro`/`Léo` hardcoded na semântica genérica;
- risk schema A/B/C como taxonomia canônica futura;
- provider bindings tratados como identidade do Core.

Direção aprovada:

```text
LEGACY
  -> COMPATIBILITY LAYER
  -> NEW SEMANTICS
  -> CONFORMANCE
  -> MIGRATION
  -> SUNSET
```

`REPLACEMENT_EXISTS != LEGACY_CAN_BE_REMOVED`.

---

## 8. Agents e team catalog

A composição atual de 29 agentes é evidência/história válida da v1, mas não é requisito constitucional do Core.

```yaml
29_agent_catalog:
  historical_identity: PRESERVE
  contracts: PRESERVE
  core_membership: REMOVE_FROM_CORE
  automatic_active_default: INCONCLUSIVE
  role_value_review: REQUIRED
```

Cada papel ativo futuro deve justificar-se por valor demonstrável ou invariante necessário.

Named agents podem permanecer como Profile/Team Catalog da instalação de LEANDRO sem definir o Core generalizável.

---

## 9. Skills atuais

As 16 skills executáveis da v1 são ativos de evidência/regressão, não API eterna congelada.

```yaml
existing_skills:
  demonstrated_behaviors: PRESERVE_AS_EVIDENCE
  semantic_test_cases: PRESERVE
  exact_provider_bindings: DO_NOT_FREEZE
  exact_agent_handoffs: DO_NOT_FREEZE_BY_DEFAULT
  future_core_plugin_skill_profile_classification: REEVALUATE
```

Regression deve preservar comportamento/contrato necessário, não anti-patterns ou acoplamentos incidentais.

---

## 10. Providers, persistence e defaults

GitHub, Render e PostgreSQL não pertencem à identidade constitucional do Core.

Podem continuar como adapters oficiais e até defaults da distribuição:

```text
DEFAULT != CONSTITUTIONAL_REQUIREMENT
```

Provider-specific capability é permitida quando seu boundary é explícito.

---

## 11. Documentation e assurance

Simplificação de governança significa:

```text
REMOVE_MANUAL_DUPLICATION
AUTOMATE_EVIDENCE_COLLECTION
DERIVE_STATUS_VIEWS
```

Não significa:

```text
REMOVE_AUDITABILITY
REMOVE_AUTHORITY_TRACE
REMOVE_REQUIRED_EVIDENCE
```

Documentos históricos permanecem como história/evidência, mas não precisam participar do caminho ativo de decisão se superseded.

---

## 12. Stable v1.0.0 e compatibilidade

A stable v1.0.0 permanece:

```yaml
v1_0_0:
  immutable_reference: true
  comparison_baseline: true
  migration_source: true
  automatic_operational_rollback_target: false
```

`APPLICATION_RECOVERY != DATA_RECOVERY` continua válido.

Depois de mudanças de schema/estado, voltar ao binário v1 não é rollback seguro sem compatibilidade explicitamente comprovada.

Taxonomias legacy como risco A/B/C devem permanecer interpretáveis por mapping/versioning mesmo se substituídas no Core novo.

---

## 13. Dependency-aware disposition

Q15 exige `Disposition Dependency Graph` para impedir retirar fundações antes de seus consumidores/replacements.

Exemplos:

```text
Agent Contract
  -> Capability Registry
  -> Team Selection
  -> Mission Planning
  -> Execution Graph

Policy Contract
  -> Permission Enforcement
  -> Effect Boundary
  -> Provider Adapter
```

Decisões de disposição não podem ser aplicadas isoladamente quando houver dependência material.

---

## 14. Sunset criteria

Nada marcado `REPLACE` ou `REMOVE` pode ser aposentado apenas por decisão documental.

Pré-condições mínimas:

```text
REPLACEMENT_READY
SEMANTIC_CONFORMANCE_PASS
MIGRATION_OR_COMPATIBILITY_PASS
NO_REQUIRED_ACTIVE_DEPENDENCY
```

Somente depois: `SUNSET_ALLOWED`.

Authority boundaries devem migrar de forma fail-closed e sem janela em que o controle antigo já esteja desativado e o novo ainda não esteja ativo.

---

## 15. Architecture gaps / ADD_REQUIRED

Q15 reconhece capabilities aprovadas em Q1–Q14 ainda ausentes ou insuficientes na v1, incluindo conforme consolidação final:

- Project Capsule / Continuity Builder;
- Capability Registry;
- Model Router e Execution Backend/Profile abstraction;
- governed execution graph compatível com Q7;
- fencing/epoch/attempt identity onde exigido;
- policy-enforced principal/delegation chain;
- portability manifest/receipt/conformance;
- Evaluation Contract/value evidence.

Esses itens entram em Q16 como `ADD_REQUIRED`, não como implementação iniciada.

---

## 16. Disposition Record

Formato conceitual aprovado:

```yaml
component_disposition:
  component_id:
  current_evidence:
  protected_invariants:
  semantic_disposition:
  implementation_disposition:
  target_boundary:
  compatibility:
  dependencies:
  replacement_preconditions:
  migration_requirements:
  sunset_criteria:
```

Para gap:

```yaml
architecture_gap:
  capability:
  reason:
  source_decision:
  disposition: ADD_REQUIRED
```

---

## 17. Auditoria final e condição de aprovação

LEANDRO declarou aprovação condicionada a não haver falhas remanescentes.

Após a auditoria crítica, foram corrigidas as lacunas de `INCONCLUSIVE`, semântica de REMOVE, risco de congelar os 29 agentes/16 skills, big-bang replacement, authority migration gap, burocracia vs auditabilidade, default provider vs Core identity, interpretabilidade legacy, rollback inseguro para v1, dependency graph, `ADD_REQUIRED` e sunset criteria.

A verificação final contra Q1–Q14 e o estado live não encontrou novo bloqueio conceitual.

```yaml
Q15_AUDIT_FINAL:
  conceptual_blocker: NONE_FOUND
  approval_condition_satisfied: true
```

---

## 18. Invariantes consolidados da Q15

```text
PRESERVE_INVARIANT != PRESERVE_CURRENT_IMPLEMENTATION
INSUFFICIENT_EVIDENCE -> INCONCLUSIVE
REMOVE_FROM_CORE != DELETE
DEFAULT != CONSTITUTIONAL_REQUIREMENT
REPLACEMENT_EXISTS != LEGACY_CAN_BE_REMOVED
REGRESSION_PRESERVES_REQUIRED_BEHAVIOR_NOT_INCIDENTAL_COUPLING
SIMPLIFY_GOVERNANCE != REMOVE_AUDITABILITY
APPLICATION_RECOVERY != DATA_RECOVERY
SUNSET_REQUIRES_REPLACEMENT_CONFORMANCE_MIGRATION_AND_NO_ACTIVE_DEPENDENCY
ADD_REQUIRED != IMPLEMENT_NOW
```

---

## 19. Próxima pergunta canônica

### Q16 — Qual é a arquitetura final da Fase 1 e o GO/NO-GO?

Status: `NEXT_NOT_STARTED`.

Q16 deverá reconciliar Q1–Q15, definir arquitetura alvo, boundaries finais, plano de migração/compatibilidade, acceptance criteria, riscos/recovery e decidir o GO/NO-GO conceitual da Fase 1. Mesmo a conclusão de Q16 não autoriza implementação sem a aprovação final explícita de LEANDRO conforme o protocolo vigente.

---

## 20. Retomada

```yaml
last_completed_question: 15
next_question: 16
approved_decisions:
  Q15: PRESERVE_INVARIANTS_REDUCE_IMPLEMENTATION
working_hypotheses: []
rejected_hypotheses:
  - PRESERVE_ALL_V1_IMPLEMENTATION
  - REMOVE_MEANS_DELETE_IMMEDIATELY
  - REPLACE_MEANS_BIG_BANG_REWRITE
  - ALL_29_AGENTS_MUST_BE_ACTIVE_DEFAULT
  - ALL_16_SKILLS_MUST_FREEZE_CURRENT_BINDINGS
  - SIMPLIFY_GOVERNANCE_MEANS_REMOVE_AUDITABILITY
  - V1_IS_UNCONDITIONAL_ROLLBACK_TARGET
open_questions:
  - Q16_FINAL_ARCHITECTURE_AND_GO_NO_GO
repo_live_state_reference:
  branch: planning/mcf-nextgen-discovery
  pre_Q15_approval_head: 9409a3fc02b2bb5cdc4753f28e4bc54d9a7ef043
next_action: START_Q16_DISCOVERY
resume_instructions: READ_RESUME_CARD_THEN_CHECKPOINT_017_AND_VALIDATE_GITHUB_LIVE
implementation_authorized: false
```
