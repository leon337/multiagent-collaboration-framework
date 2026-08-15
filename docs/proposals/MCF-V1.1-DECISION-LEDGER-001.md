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

### Problema

Definir como o MCF assume um projeto existente sem depender da memória de LEANDRO e sem confundir o que foi construído (`AS-IS`) com o que LEANDRO queria construir (`TO-BE`).

### Alternativas consideradas

- A — perguntar primeiro ao humano e auditar depois;
- B — auditar e tratar o código como intenção;
- C — auditoria read-only + resumo + confirmação humana;
- D — reconnaissance orientado por evidências, baseline exato, classificação de fatos/inferências/unknowns, detecção de continuidade MCF, reconstrução `AS-IS`, Project Reality Report e read-back antes da Discovery humana profunda.

### Decisão de LEANDRO

**Opção D.**

### Contrato conceitual aprovado

```yaml
entry_mode:
  initial: ADOPT_EXISTING_PROJECT
  status: PROVISIONAL

initial_policy:
  target_project_mutation: FORBIDDEN
  reconnaissance: READ_ONLY_FIRST

baseline:
  exact_ref_or_sha_required: true
  observed_at_required: true

automatic_sources:
  - SOURCE_CODE
  - DOCUMENTATION
  - GIT_HISTORY
  - BRANCHES_TAGS_RELEASES
  - ISSUES
  - PULL_REQUESTS
  - CI_WORKFLOWS
  - TESTS
  - DATA_SCHEMAS_MIGRATIONS
  - CONFIGURATION
  - DEPLOY_METADATA_WHEN_ACCESSIBLE

evidence_states:
  - VERIFIED_FACT
  - OBSERVED_FACT
  - INFERRED
  - UNKNOWN
  - CONFLICTING
  - STALE_SUSPECTED

mcf_continuity_detection:
  enabled: true
  verified_continuity:
    reclassify_to: RESUME_MCF_PROJECT
  broken_or_unverified_continuity:
    route_to: RECOVER_MCF_PROJECT

if_still_adopt:
  reconstruct_as_is: true
  project_reality_report: REQUIRED
  reality_readback_to_leandro: REQUIRED

reality_confirmation:
  states:
    - CONFIRMED
    - CONFIRMED_WITH_CORRECTIONS
    - REJECTED_OR_MISUNDERSTOOD

target_project_methodology_pin:
  before_adoption_confirmation: NOT_WRITTEN_TO_TARGET
  after_adoption_commitment: REQUIRED

deep_human_intent_discovery:
  before_reality_confirmation: NO_GO
  after_reality_confirmation: GO

implementation:
  before_intent_alignment_gate: NO_GO
```

### Princípios resultantes

```text
READ_ONLY_FIRST
AS_IS != TO_BE
FACT != INFERENCE
DOCUMENTATION != AUTOMATICALLY_REALITY
MACHINE_DISCOVERS_TECHNICAL_FACTS
HUMAN_EXPLAINS_INTENT
```

- o baseline observado deve ser ligado a SHA/ref e timestamp;
- nenhuma correção “óbvia” pode ser feita durante reconnaissance;
- fontes divergentes devem ser registradas como `CONFLICTING`, não reconciliadas por palpite;
- afirmações relevantes precisam preservar sua classe de evidência;
- a inspeção procura sinais de continuidade MCF antes de consolidar adoção;
- continuidade MCF válida reclassifica para `RESUME_MCF_PROJECT`;
- continuidade MCF quebrada/não verificável roteia para `RECOVER_MCF_PROJECT`;
- se continuar `ADOPT_EXISTING_PROJECT`, MESTRE reconstrói o `AS-IS`, produz `Project Reality Report` e faz read-back a LEANDRO;
- correções de LEANDRO complementam a realidade observada, sem apagar fatos técnicos;
- Human Intent Discovery profunda só começa após Reality Confirmation;
- methodology pin não é escrito no projeto alvo antes do compromisso de adoção;
- se LEANDRO desistir após reconnaissance, não há ownership claim nem dívida de execução;
- segredos podem ser detectados como referência, mas valores não devem ser expostos.

---

## DISCOVERY-INPUT-001 — Codex Local-First

```yaml
input_id: DISCOVERY-INPUT-001
source: LEANDRO
status: RESOLVED_BY_V11_Q02
mapped_question: Q2
resolution: V11-Q02
```
