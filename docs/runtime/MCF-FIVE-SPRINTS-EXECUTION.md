# MCF Runtime — Execução das Cinco Sprints

**Missão:** MCF-RUNTIME-001  
**Data:** 4 de agosto de 2026  
**Branch:** `feat/mcf-runtime-five-sprints`  
**PR:** #46

## 1. Objetivo

Executar em um único ciclo operacional as cinco sprints necessárias para transformar o MCF de protocolo interpretativo em recorte vertical executável.

## 2. Sprint 1 — Runtime, SkillExecutor e EvidenceValidator

### Entregas

- contratos tipados do runtime;
- `SkillRegistryLoader` para `skills/registry.yaml`;
- `PermissionEngine`;
- `SkillExecutor` para três skills;
- `EvidenceValidator` com HMAC SHA-256;
- APIs de missão e fase.

### Resultado

```yaml
skill_registry_loaded_at_runtime: true
executable_skills: 3
missing_external_receipt_claims_success: false
forged_receipt_rejected: true
direct_main_write_blocked: true
```

## 3. Sprint 2 — Estado persistente e event ledger

### Entregas

- migration `0013_mcf_runtime.sql`;
- missões;
- fases;
- recibos;
- handoffs;
- eventos;
- repositório PostgreSQL;
- retomada por `mission_id`;
- versão otimista;
- idempotência.

### Resultado

```yaml
mission_resume: implemented
phase_checkpoint: implemented
event_ledger: implemented
optimistic_locking: implemented
callback_idempotency: implemented
```

## 4. Sprint 3 — Schemas, gates e recuperação

### Entregas

- schemas Zod para API;
- validação de inputs obrigatórios;
- seleção de agente e skill pelo contrato;
- perfis de permissão executáveis;
- aliases controlados de providers;
- recuperação CAF;
- estados `WAITING_EXTERNAL` e `RECOVERING`.

### Resultado

```yaml
invalid_contract_rejected: true
unknown_skill_rejected: true
registered_but_not_executable_rejected: true
unauthorized_agent_rejected: true
forbidden_tool_rejected: true
failed_evidence_starts_recovery: true
```

## 5. Sprint 4 — CI/CD e callbacks

### Entregas

- workflow `MCF Runtime Integration`;
- `workflow_dispatch`;
- `repository_dispatch: mcf-run-tests`;
- execução de `pnpm verify`;
- callback autenticado;
- recibo de GitHub Actions;
- retomada da fase aguardando evidência.

### Resultado

```yaml
ci_trigger: implemented
ci_callback: implemented
callback_authentication: implemented
workflow_and_sha_required: true
failure_preserved_in_workflow: true
```

A ativação externa exige configurar `MCF_RUNTIME_URL` e `MCF_RUNTIME_TOKEN` como secrets do repositório.

## 6. Sprint 5 — Consolidação e timeline controlada

### Entregas

- MCF-DEC-054;
- especificação consolidada;
- API;
- recuperação;
- registro desta execução;
- candidatos sociais baseados no ledger.

### Resultado

```yaml
historic_decisions_deleted: false
runtime_specification_created: true
social_candidate_projection: implemented
automatic_publication: false
human_approval_required: true
```

## 7. Os sete pontos resolvidos

| Ponto | Implementação | Evidência esperada |
|---|---|---|
| SkillExecutor | loader + executor de três skills | testes unitários |
| EvidenceValidator | assinatura, digest e validação específica | testes contra adulteração |
| Estado persistente | PostgreSQL + retomada | teste de integração |
| Schemas e gates | Zod + PermissionEngine | lint, typecheck e testes |
| Handoffs e CAF | tabelas, eventos e estados de recuperação | integração e ledger |
| CI/CD | dispatch + callback autenticado | workflow e smoke |
| Consolidação | DEC-054 e docs/runtime | validação documental |

## 8. Falhas reais encontradas e recuperadas

### Formatação

```yaml
failure: prettier_check
class: RECOVERABLE
recovery: formatter_oficial
result: PASS
```

### Lint

```yaml
failure: nine_eslint_errors
class: RECOVERABLE
recovery: eslint_autofix_without_disabling_rules
result: PASS
```

### Teste de configuração

```yaml
failure: production_fixture_missing_new_secrets
class: RECOVERABLE
recovery: update_fixture_and_negative_tests
result: pending_final_CI_at_document_creation
```

### Empacotamento

```yaml
failure: canonical_skill_registry_outside_old_docker_context
class: DESIGN_DEFECT
recovery: root_context_and_selective_copy
result: pending_container_smoke_at_document_creation
```

## 9. Limites do recorte

- três de dezesseis skills são executáveis;
- adapters externos completos ainda precisam ser adicionados por skill;
- o workflow de integração precisa de secrets e URL do runtime;
- não existe publicação social automática;
- o produto ainda não substitui integralmente o Codex.

## 10. Critério final

A missão somente será marcada `ENTREGUE` após:

```yaml
documentation_validation: PASS
format: PASS
lint: PASS
typecheck: PASS
migrations_twice: PASS
unit_and_integration_tests: PASS
build: PASS
container_smoke: PASS
independent_audit: PASS_OR_PASS_WITH_RESERVATIONS
merge_to_main: true
```
