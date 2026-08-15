# MCF v1.1 — Decision Ledger

**ID:** `MCF-V1.1-DECISION-LEDGER-001`  
**Status:** `ACTIVE`  
**Branch:** `planning/mcf-v1.1-discovery`

Este ledger preserva decisões aprovadas por LEANDRO durante a Discovery da v1.1.0. Implementação permanece bloqueada até encerramento formal da Discovery e autorização separada.

---

## V11-D0 — Discovery Charter

```yaml
decision_id: V11-D0
status: APPROVED_BY_LEANDRO
target_version: v1.1.0
baseline: v1.0.0
implementation_authorized: false
```

## V11-Q01 — Activation Contract

```yaml
decision_id: V11-Q01
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: HYBRID_INTENT_AND_EXPLICIT_ACTIVATION
```

Chat normal permanece fora do MCF. Comando explícito ou intenção clara pode iniciar `ACTIVATING`; `ACTIVE` exige bootstrap/metodologia/fonte de verdade verificáveis.

## V11-Q02 — Execution Environment Contract

```yaml
decision_id: V11-Q02
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: LOCAL_FIRST_REMOTE_CHECKPOINTED
```

```text
MCF_METHOD != EXECUTION_HOST
EDIT != COMMIT != PUSH != PR
LOCAL_UNCHECKPOINTED != REMOTE_CHECKPOINTED
```

`CHATGPT_REMOTE` usa conectores/ferramentas remotas. `CODEX_LOCAL` usa workspace/terminal/Git local. GitHub permanece memória institucional, checkpoint remoto, CI, revisão e integração. Boundaries materiais/governados permanecem fail-closed sem evidência aplicável.

## V11-Q03 — Bootstrap Version Resolution

```yaml
decision_id: V11-Q03
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: VERIFIED_TWO_STAGE_BOOTSTRAP
resolution_order:
  - VALID_PROJECT_PIN
  - EXPLICIT_LEANDRO_SELECTION
  - CURRENT_STABLE
immutable_methodology_ref: REQUIRED
silent_mid_mission_upgrade: false
```

Bootstrap usa locator canônico para resolver a versão operacional e depois carrega metodologia por tag/SHA imutável. Discovery, planning, RC e experimental não são defaults.

## V11-Q04 — Degraded Operation / Fail-Closed

```yaml
decision_id: V11-Q04
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES
```

Operação degradada só pode continuar sobre base local verificável e trabalho reversível. Inconsistência entre fontes bloqueia. Recuperação exige revalidação canônica, reconciliação de `CHECKPOINT_DEBT` e `Degraded Operation Receipt`.

```text
UNAVAILABLE != INCONSISTENT
LOCAL_COPY != VERIFIED_LOCAL_COPY
HUMAN_AUTHORITY != TECHNICAL_EVIDENCE
```

## V11-Q05 — Project Entry Classification

```yaml
decision_id: V11-Q05
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: THREE_CANONICAL_ENTRY_MODES_WITH_RECOVERY_ROUTE
PROJECT_ENTRY_MODE:
  - NEW_PROJECT
  - ADOPT_EXISTING_PROJECT
  - RESUME_MCF_PROJECT
RECOVERY_ROUTE:
  - RECOVER_MCF_PROJECT
```

```text
HUMAN_INTENT + MACHINE_EVIDENCE = ENTRY_CLASSIFICATION
ADOPT != RECOVER
RESUME_REQUIRES_VERIFIED_CONTINUITY
```

## V11-Q06 — New Project Genesis

```yaml
decision_id: V11-Q06
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: PROGRESSIVE_DURABLE_PROJECT_GENESIS
```

Fluxo aprovado:

```text
VERIFIED MCF ACTIVATION
→ IDEA_CAPTURE
→ MINI-TRIAGE (3–5)
→ PROJECT_GENESIS
→ PROJECT HOME / REPOSITORY
→ METHODOLOGY PIN
→ DURABLE INTAKE CHECKPOINT
→ HUMAN INTENT DISCOVERY
→ INTENT READINESS
→ PROJECT INTENT PACKAGE
→ LEANDRO CONFIRMS
→ INTENT ALIGNMENT GATE = PASS
→ MCF-START-MISSION
```

Antes do Alignment Gate, implementação de produto é `NO_GO`. Discovery, documentação e protótipos não canônicos de descoberta podem existir nos limites definidos.

## V11-Q07 — Existing Project Reconnaissance Contract

```yaml
decision_id: V11-Q07
question: Q7
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: EVIDENCE_FIRST_EXISTING_PROJECT_RECONNAISSANCE
```

`ADOPT_EXISTING_PROJECT` começa provisório, com baseline exato e reconnaissance `READ_ONLY_FIRST`. Evidências são classificadas como `VERIFIED_FACT`, `OBSERVED_FACT`, `INFERRED`, `UNKNOWN`, `CONFLICTING` ou `STALE_SUSPECTED`. Continuidade MCF válida reclassifica para `RESUME`; continuidade quebrada/não verificável roteia para `RECOVER`. Permanecendo `ADOPT`, MESTRE reconstrói `AS-IS`, produz `Project Reality Report` e faz Reality Read-Back antes da Human Intent Discovery profunda.

```text
READ_ONLY_FIRST
AS_IS != TO_BE
FACT != INFERENCE
DOCUMENTATION != AUTOMATICALLY_REALITY
MACHINE_DISCOVERS_TECHNICAL_FACTS
HUMAN_EXPLAINS_INTENT
```

## V11-Q08 — Human Intent Dimensions Contract

```yaml
decision_id: V11-Q08
question: Q8
status: APPROVED_BY_LEANDRO
chosen_option: D
canonical_name: CANONICAL_INTENT_DIMENSIONS_WITH_EVIDENCE_AWARE_RESOLUTION
canonical_dimension_count: 20
fixed_question_count_required: false
```

### Problema

Definir o conjunto mínimo de dimensões que o MCF deve compreender antes de considerar a intenção humana suficientemente capturada, sem transformar a Discovery em formulário rígido nem exigir de LEANDRO decisões técnicas que pertencem à equipe.

### Alternativas consideradas

- A — 20 perguntas fixas;
- B — conversa totalmente livre;
- C — poucas dimensões essenciais e demais opcionais;
- D — 20 dimensões canônicas obrigatórias de compreender, resolvidas por contexto, evidência, respostas humanas e perguntas adaptativas, sem exigir 20 perguntas fixas.

### Decisão de LEANDRO

**Opção D.**

### Dimensões canônicas aprovadas

```yaml
intent_dimensions:
  purpose:
    - PROBLEM
    - MOTIVATION
    - DESIRED_OUTCOME

  users_and_experience:
    - TARGET_USERS
    - CRITICAL_USER_JOURNEYS

  scope:
    - MUST_HAVE
    - SHOULD_HAVE
    - NON_GOALS
    - PRIORITIES_AND_TRADEOFFS

  domain_and_operation:
    - BUSINESS_RULES
    - DATA_AND_SENSITIVITY
    - ROLES_AND_PERMISSIONS
    - AUTOMATION_LEVEL
    - INTEGRATIONS
    - PLATFORM_AND_USAGE_CONTEXT

  constraints_quality_and_success:
    - COST_AND_RESOURCE_CONSTRAINTS
    - QUALITY_EXPECTATIONS
    - FAILURE_TOLERANCE
    - DEFINITION_OF_DONE
    - FUTURE_VISION
```

### Estados possíveis por dimensão

```yaml
dimension_states:
  - CLEAR
  - PARTIAL
  - UNKNOWN
  - CONFLICTING
  - NOT_APPLICABLE
```

### Regras de resolução

```yaml
resolution:
  every_dimension_must_be_understood_or_explicitly_resolved: true
  fixed_question_count_required: false
  machine_evidence_may_supply_facts: true
  machine_evidence_may_invent_human_preferences: false
  human_unknown_allowed: true
  technical_decision_delegation_allowed: true
```

Princípios:

```text
DIMENSION_REQUIRED != QUESTION_REQUIRED
UNKNOWN != NOT_APPLICABLE
UNKNOWN != HUMAN_HAS_NO_PREFERENCE
MACHINE_EVIDENCE_CAN_SUPPLY_FACTS
MACHINE_EVIDENCE_CANNOT_INVENT_HUMAN_PREFERENCES
HUMAN_INTENT_DISCOVERY_ASKS_WHAT_WHY_WHO_CONSEQUENCES_PREFERENCES_CONSTRAINTS_SUCCESS
TEAM_ENGINEERING_DECIDES_HOW
```

- as 20 dimensões são obrigatórias como cobertura semântica, não como 20 perguntas literais;
- uma dimensão pode ser resolvida por resposta humana, contexto confirmado, evidência aplicável ou `NOT_APPLICABLE`;
- evidência técnica não pode ser usada para inferir preferência humana silenciosamente;
- `AS-IS` observado em projeto existente não substitui intenção `TO-BE`;
- quando LEANDRO não souber uma decisão técnica, pode delegar recomendação/decisão à equipe sem isso ser tratado como falha de Intake;
- tecnologias específicas, frameworks, bancos, padrões arquiteturais e provedores não fazem parte das dimensões humanas obrigatórias, salvo quando surgirem como restrição real de plataforma, recurso, custo ou contexto de uso;
- Q9 definirá a mecânica de perguntas adaptativas; Q10 o progressive read-back; Q11 a suficiência/readiness; Q12 a persistência no `Project Intent Package`.

---

## DISCOVERY-INPUT-001 — Codex Local-First

```yaml
input_id: DISCOVERY-INPUT-001
source: LEANDRO
status: RESOLVED_BY_V11_Q02
mapped_question: Q2
resolution: V11-Q02
```
