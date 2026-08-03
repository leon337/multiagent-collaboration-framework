# Fase 1.1 — Registro de Causa Raiz

**Projeto:** Rede Social para Agentes de IA  
**Slice:** conta humana e sessão segura  
**PR:** #21  
**Data:** 2 de agosto de 2026, horário de Recife

## 1. Objetivo

Registrar as falhas reais encontradas durante o primeiro slice de identidade, suas causas e as correções mínimas aplicadas.

## 2. Incidentes

### INC-1 — Imports de dependências usados implicitamente pela injeção

```yaml
workflow_run: 30774344253
gate: lint
arquivos:
  - identity.controller.ts
  - identity.service.ts
  - postgres-identity.repository.ts
causa: dependencias_de_runtime_eram_referenciadas_apenas_por_metadados_implicitos_do_nest
```

**Correção:** tornar a injeção explícita com `@Inject` para `IdentityService`, `PasswordService`, `SessionTokenService` e `DatabaseService`.

**Resultado:** lint e typecheck passaram sem desabilitar a regra `consistent-type-imports`.

### INC-2 — Teste HTTP com predicado inválido

O primeiro rascunho do teste de erros HTTP usava um predicado que retornaria `void` depois da asserção, podendo produzir resultado incorreto.

**Correção:** capturar a rejeição de forma determinística, validar a classe da exceção e depois inspecionar `getResponse()`.

**Resultado:** os testes passaram a verificar explicitamente código público e `correlationId`.

### INC-3 — Divergência de formatação após endurecimento

```yaml
workflow_run: 30774659336
gate: format
arquivos:
  - identity.controller.ts
  - identity.controller.test.ts
```

**Correção:** aplicar a versão fixada do Prettier somente aos dois arquivos apontados. A permissão temporária de escrita da CI foi removida imediatamente depois.

## 3. Melhorias preventivas realizadas antes do gate final

A revisão de Ricardo identificou e corrigiu:

- duplicação desnecessária do e-mail dentro da auditoria;
- diferença de custo computacional entre conta inexistente e senha incorreta;
- ausência de `correlationId` nos erros públicos;
- formato de senha sem versão explícita dos parâmetros de `scrypt`.

## 4. Evidências verdes intermediárias

```yaml
run_30774442756:
  install: PASS
  format: PASS
  lint: PASS
  typecheck: PASS
  migrations_twice: PASS
  unit_tests: PASS
  build: PASS

run_30774495049:
  repository_integration_test: PASS
  duplicate_transaction_rollback: PASS
  audit_persistence: PASS
  session_persistence: PASS
```

## 5. Controles preservados

- nenhuma regra de lint foi desabilitada;
- nenhuma correção foi feita por sobreposição de código;
- não houve alteração de finalidade do slice;
- nenhuma credencial real foi utilizada;
- nenhum deploy foi executado;
- o banco foi recriado em cada execução;
- migrações foram executadas duas vezes para provar idempotência.
