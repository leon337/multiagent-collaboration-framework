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
- sequência causal monotônica;
- repositório PostgreSQL;
- retomada por `mission_id`;
- versão otimista;
- idempotência.

### Resultado

```yaml
mission_resume: implemented
phase_checkpoint: implemented
event_ledger: implemented
causal_sequence: implemented
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

| Ponto | Implementação | Evidência verificada |
|---|---|---|
| SkillExecutor | loader + executor de três skills | testes unitários PASS |
| EvidenceValidator | assinatura, digest e validação específica | adulteração rejeitada em teste |
| Estado persistente | PostgreSQL + retomada | teste de integração PASS |
| Schemas e gates | Zod + PermissionEngine | lint, typecheck e testes PASS |
| Handoffs e CAF | tabelas, eventos e estados de recuperação | integração e ledger PASS |
| CI/CD | dispatch + callback autenticado | workflow e container smoke PASS |
| Consolidação | DEC-054 e `docs/runtime/` | validação documental PASS |

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
result: PASS
```

### Empacotamento

```yaml
failure: canonical_skill_registry_outside_old_docker_context
class: DESIGN_DEFECT
recovery: root_context_and_selective_copy
result: PASS
```

### Ordem causal

```yaml
failure: equal_timestamps_ordered_by_random_uuid
class: DESIGN_DEFECT
recovery: identity_sequence_and_ordered_repository
result: PASS
```

### Injeção de dependências

```yaml
failure: nest_received_function_metadata_for_type_only_dependencies
class: RUNTIME_DEFECT
recovery: explicit_provider_factories
result: PASS
```

## 9. Validação final do candidato

```yaml
documentation_validation: PASS
format: PASS
lint: PASS
typecheck: PASS
migrations_first_run: PASS
migrations_second_run: PASS
ops_tests: 10_PASS
server_tests: 95_PASS
web_tests: 5_PASS
build: PASS
container_compose_validation: PASS
container_build: PASS
container_migrations: PASS
server_startup: PASS
readiness: PASS
security_headers: PASS
non_root_runtime: PASS
independent_audit: PASS_WITH_MINOR_RESERVATIONS
```

## 10. Limites do recorte

- três de dezesseis skills são executáveis;
- adapters externos completos ainda precisam ser adicionados por skill;
- o workflow de integração precisa de secrets e URL do runtime;
- não existe publicação social automática;
- o produto ainda não substitui integralmente o Codex.

## 11. Critério final

```yaml
documentation_validation: PASS
format: PASS
lint: PASS
typecheck: PASS
migrations_twice: PASS
unit_and_integration_tests: PASS
build: PASS
container_smoke: PASS
independent_audit: PASS_WITH_MINOR_RESERVATIONS
merge_to_main: PENDING_LEO_GATE
```
