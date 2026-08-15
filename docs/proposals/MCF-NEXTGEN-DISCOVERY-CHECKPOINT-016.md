# MCF NextGen — Discovery Checkpoint 016

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-016`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-15  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação condicional de LEANDRO para a Q14 após auditoria crítica final sem bloqueio conceitual remanescente e fixar a retomada em Q15.

---

## 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 14
next_question: 15
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
Q15: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
prototype_authorized: false
```

A aprovação da Q14 é uma decisão de Discovery. Não autoriza implementar mecanismos de export/import, portabilidade, migração, conformance suites, provider replacement, external trials ou qualquer componente NextGen.

---

## 2. Pergunta aprovada

### Q14 — Como validar portabilidade e utilidade fora do ambiente atual?

Decisão consolidada:

> O MCF deve adotar `CLEAN_ROOM_PORTABILITY_AND_EXTERNAL_UTILITY_VALIDATION`: alegações de portabilidade e generalização precisam ser demonstradas a partir de artefatos/versionamentos identificados, em ambientes/contextos suficientemente independentes, sem dependências tácitas, preservando invariantes, autoridade, estado e provenance, e distinguindo prova técnica de portabilidade de prova real de utilidade externa.

Princípio central:

> Portabilidade é uma matriz de capacidades demonstradas, não um booleano. Utilidade externa é um nível de evidência de uso, não consequência automática de o software instalar.

---

## 3. Clean-room e compatibility envelope

Para alegação forte de portabilidade:

- usar artefato/release/candidate identificado por versão/digest;
- não depender de working tree, memória de chat, arquivos ocultos, ajustes manuais não documentados ou configuração pessoal implícita;
- declarar o envelope de ambientes suportados e capacidades mínimas;
- ambientes fora desse envelope podem ser `UNSUPPORTED`/`BLOCKED` sem constituir falha.

Invariantes:

```text
CLEAN_ROOM != FRESH_DIRECTORY
CONTAINERIZED != PORTABLE
UNDOCUMENTED_DEPENDENCY = PORTABILITY_DEFECT
```

---

## 4. Portability Matrix

A portabilidade deve ser reportada por dimensões, não por um único booleano:

```text
RUNTIME
PROVIDER
DATA
OPERATIONAL
PROJECT_DOMAIN
CONTEXT
EXIT
```

Cada camada/componente pode ser classificada separadamente. Componentes provider-specific são permitidos quando seu boundary é explícito e não contamina contratos que deveriam permanecer portáveis.

---

## 5. Níveis de evidência de portabilidade

```text
DECLARED
CONFORMANCE_TESTED
MIGRATION_PROVED
FIELD_PROVED
```

- `DECLARED`: arquitetura afirma compatibilidade; não é prova;
- `CONFORMANCE_TESTED`: target passa contratos/suíte aplicável;
- `MIGRATION_PROVED`: projeto/estado é transferido e reconstruído com integridade;
- `FIELD_PROVED`: uso significativo em outro ambiente/contexto.

`DECLARED_PORTABILITY != PROVEN_PORTABILITY`.

---

## 6. Migração coerente e in-flight work

Toda migração material deve ser ancorada a um boundary coerente, contendo conforme aplicável:

```yaml
migration_checkpoint:
  state_version:
  transition_cursor:
  evidence_boundary:
  config_version:
  policy_version:
```

Tasks/efeitos em `RUNNING`, `WAITING_GATE`, `PENDING_EFFECT`, `LEASED` ou `UNKNOWN_EFFECT` precisam ser tratados explicitamente.

Preservar quando necessário:

- `attempt_id`;
- fencing/epoch;
- idempotency key;
- effect status.

Invariante:

`MIGRATION_MUST_NOT_SILENTLY_REPLAY_MATERIAL_EFFECTS`.

---

## 7. Import seguro

Fluxo conceitual aprovado:

```text
EXPORT
  -> IMPORT
  -> VALIDATE
  -> RECONCILE
  -> ACTIVATE
```

Antes da ativação validada:

`NO_NEW_MATERIAL_EFFECT`.

Compatibilidade, policy, schema, extensions e required capabilities devem ser verificadas. Incompatibilidade material desconhecida resulta em `BLOCKED`, não em downgrade silencioso.

---

## 8. Authority, HUMAN_GATE e secrets após migração

- HUMAN_GATE emitido no ambiente origem não é automaticamente reutilizável no destino;
- temporary authority, leases, credentials e equivalentes devem expirar/revalidar/reemitir conforme policy;
- alterações de effect digest, resource, provider, policy ou preconditions podem invalidar autorização anterior;
- secrets não são copiados como estado normal do projeto;
- destino recebe requirements/references e executa novo binding autorizado.

`PROJECT_PORTABILITY != COPY_EVERY_SECRET`.

---

## 9. Policy drift e semantic equivalence

Target policy não precisa ser byte-a-byte igual à origem, mas não pode violar hard requirements do projeto.

Comparar source requirements vs target capabilities/policy antes da ativação.

Equivalência de migração é semântica, não identidade física:

```text
SEMANTIC_EQUIVALENCE != BYTE_IDENTITY
```

Preservar, conforme aplicável:

- mission identity/lineage;
- approved decisions;
- authority relations;
- task states;
- transition ordering;
- evidence provenance;
- completion semantics.

Quando IDs físicos mudarem, mapping verificável é permitido.

---

## 10. Data portability e evidence integrity

`EXPORT_EXISTS != PORTABILITY_WORKS`.

Para a classe alegada, deve existir prova real de import/reconstruction.

Referências externas de evidência precisam ser classificadas após migração, por exemplo:

```text
EMBEDDED_OR_PRESERVED
EXTERNALLY_RESOLVABLE
ARCHIVED
BROKEN
```

Copiar uma URL não prova que a evidência continua disponível ou íntegra.

Semantic round-trip `A -> B -> A` é um teste forte suportado, mas não é requisito universal.

---

## 11. Exit portability

Q14 inclui `PROJECT_EXIT_PORTABILITY`.

O MCF deve permitir exportar os principais ativos de um projeto em formatos documentados e interpretáveis, sem exigir que outro framework consiga executar automaticamente todos os comportamentos.

Objetivo: evitar lock-in opaco sobre dados, decisões, evidências e estado do projeto.

---

## 12. Extensibilidade sem false negative

Novo domínio pode legitimamente exigir Plugin/Profile/Factory/Blueprint específico.

Isso não é falha de generalização por si só.

Sinal de coupling: precisar alterar o Core para uma necessidade que deveria ser extensível.

A auditoria de portabilidade deve alcançar também:

- Core;
- Factory;
- Blueprint;
- Profile;
- distribuição/defaults.

`CORE_PORTABLE + DEFAULT_FACTORY_LOCKED = PORTABILITY_DEFECT_AT_DISTRIBUTION_BOUNDARY`.

---

## 13. Conformance e negative tests

A suíte de conformance do Core deve ser provider-independent onde aplicável.

Negative tests são obrigatórios para provar fail-closed, por exemplo quando target não possui capability, schema ou policy compatibility requerida.

Resultado esperado pode ser:

```text
SUPPORTED
MIGRATABLE
INCOMPATIBLE
BLOCKED_WITH_REASON
```

Supported compatibility window precisa ser declarada; Q14 não fixa hoje política N-1/N-2.

---

## 14. Utilidade externa

Níveis de evidência:

```text
DEMO
CONTROLLED_TRIAL
INDEPENDENT_TRIAL
FIELD_USE
```

- Demo não prova utilidade independente;
- Controlled Trial admite assistência próxima;
- Independent Trial reduz coaching contínuo;
- Field Use exige uso material representativo, não apenas demonstração trivial.

Toda conclusão deve declarar escopo de validade externa: domínio, perfil do operador, tamanho/complexidade do projeto, ambiente e duração/materialidade.

Uma experiência externa não prova generalização universal.

---

## 15. Operador externo e suporte

O perfil do operador precisa ser declarado:

```yaml
operator_profile:
  expected_skill_level:
  prior_MCF_experience:
  provided_documentation:
  allowed_training:
```

Separar:

```text
PLANNED_ONBOARDING
DOCUMENTED_SUPPORT
UNPLANNED_RESCUE
HIDDEN_MANUAL_FIX
```

Onboarding legítimo não é defeito. Rescue/hidden fix não declarado é evidence de lacuna de portabilidade/usabilidade.

Support burden deve ser medido via Q13.

---

## 16. Fresh Project, Fresh Operator e Fresh Context

Sequência conceitual de prova:

```text
SELF_PORTABILITY
  -> CLEAN_ROOM_INTERNAL
  -> FRESH_PROJECT
  -> FRESH_OPERATOR
  -> EXTERNAL_FIELD_USE
```

Para claims fortes de continuidade fora do ambiente original, executar também Fresh Context Recovery:

```text
NEW_SESSION_OR_AGENT
+
NO_PRIOR_CHAT_MEMORY
+
CANONICAL_ARTIFACTS
-> reconstruct objective, state, decisions, prohibitions and next allowed action
```

Isso testa Q2 fora do ambiente de origem.

---

## 17. Portability Receipt e regressão

Provas materiais de portabilidade produzem `Portability Receipt` com, conforme aplicável:

```yaml
portability_receipt:
  source_environment:
  target_environment:
  artifact_identity:
  portability_claim:
  clean_room_conditions:
  compatibility_checks:
  migration_checkpoint:
  hidden_dependencies_found:
  support_interventions:
  integrity_checks:
  conformance_result:
  recovery_result:
  final_state:
```

O receipt é evidência do teste, não fonte única da verdade.

Claims preservados de portabilidade devem possuir futura regression suite proporcional ao claim, para detectar lock-in reintroduzido.

---

## 18. Relação com Q13

Q14 reutiliza `PREDECLARED_COMPARATIVE_VALUE_EVALUATION`.

Portabilidade/utilidade são avaliadas por contratos pré-declarados, hard constraints, métricas e escopo de generalização já definidos na Q13.

Q14 não cria metodologia paralela de avaliação.

---

## 19. Estado atual da prova

O MCF v1 comprova execução real, staging/produção e integrações concretas, mas isso não equivale a portabilidade geral comprovada.

Estado conceitual correto após Q14:

```yaml
portability_architecture: APPROVED_IN_DISCOVERY
clean_room_validation_method: APPROVED_IN_DISCOVERY
general_portability_proof: NOT_YET_EXECUTED
external_utility_proof: NOT_YET_EXECUTED
```

---

## 20. Auditoria final e condição de aprovação

LEANDRO declarou aprovação condicionada a não haver falhas remanescentes.

MESTRE executou revisão final do escopo após a auditoria crítica e não encontrou bloqueio conceitual remanescente.

Riscos de implementação como mecanismo concreto de snapshot, migração, authority rebinding, schema upgrade e regressão futura permanecem deliberadamente para especificação/implementação posterior, mas já estão transformados em requisitos explícitos da arquitetura e não constituem lacunas conceituais abertas da Q14.

```yaml
Q14_AUDIT_FINAL:
  conceptual_blocker: NONE_FOUND
  approval_condition_satisfied: true
```

---

## 21. Invariantes consolidados da Q14

```text
PORTABILITY_IS_A_MATRIX_NOT_BOOLEAN
DECLARED_PORTABILITY != PROVEN_PORTABILITY
CLEAN_ROOM != FRESH_DIRECTORY
UNDOCUMENTED_DEPENDENCY = PORTABILITY_DEFECT
MIGRATION_MUST_NOT_SILENTLY_REPLAY_MATERIAL_EFFECTS
NO_NEW_MATERIAL_EFFECT_BEFORE_IMPORT_ACTIVATION
MIGRATED_HUMAN_GATE != AUTOMATICALLY_REUSABLE
PROJECT_PORTABILITY != COPY_EVERY_SECRET
SEMANTIC_EQUIVALENCE != BYTE_IDENTITY
EXPORT_EXISTS != PORTABILITY_WORKS
DEMO != EXTERNAL_UTILITY_PROVED
PRESERVE_SCOPE_OF_CLAIM
```

---

## 22. Próxima pergunta canônica

### Q15 — O que deve ser preservado, simplificado, removido ou substituído?

Status: `NEXT_NOT_STARTED`.

Q15 deverá usar as evidências e invariantes de Q1–Q14 para classificar componentes/complexidades sem preservar algo apenas porque já existe.

---

## 23. Retomada

```yaml
last_completed_question: 14
next_question: 15
approved_decisions:
  Q14: CLEAN_ROOM_PORTABILITY_AND_EXTERNAL_UTILITY_VALIDATION
working_hypotheses: []
rejected_hypotheses:
  - CONTAINERIZED_EQUALS_PORTABLE
  - PORTABILITY_IS_BOOLEAN
  - EXPORT_ONLY_PROVES_PORTABILITY
  - MIGRATED_HUMAN_GATE_IS_AUTOMATICALLY_REUSABLE
  - COPY_SECRETS_IS_PROJECT_PORTABILITY
  - DEMO_PROVES_EXTERNAL_UTILITY
open_questions:
  - Q15_PRESERVE_SIMPLIFY_REMOVE_REPLACE
repo_live_state_reference:
  branch: planning/mcf-nextgen-discovery
  pre_Q14_approval_head: 8f1fca97230e3d878c892ba24af86e720d42b774
next_action: START_Q15_DISCOVERY
resume_instructions: READ_RESUME_CARD_THEN_CHECKPOINT_016_AND_VALIDATE_GITHUB_LIVE
implementation_authorized: false
```
