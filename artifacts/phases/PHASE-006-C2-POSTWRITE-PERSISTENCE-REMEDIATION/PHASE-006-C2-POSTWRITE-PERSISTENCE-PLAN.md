# PHASE-006-C2 — Remediação de persistência pós-write

## Contrato da fase

```yaml
mission_id: MCF-RUNTIME-006-C2-POSTWRITE-PERSISTENCE-REMEDIATION
parent_mission_id: MCF-RUNTIME-006-C2
phase_id: PHASE-006-C2-POSTWRITE-PERSISTENCE-REMEDIATION
objective: impedir que falha de persistência local após receipt de mutação externa seja classificada como FAILED e libere binding de idempotência
expected_outcome: efeitos possivelmente aplicados permanecem UNKNOWN com binding durável até reconciliação explícita
risk_class: B
current_state: VALIDACAO_TECNICA_CONCLUIDA
cycle: 4
decision_authority: Leo
phase_artifact_directory: artifacts/phases/PHASE-006-C2-POSTWRITE-PERSISTENCE-REMEDIATION
```

## Origem

A revisão independente do PR #80 no HEAD exato `edaef62866aa1ff0af2985bfad20d1fe640c36cd` encontrou P1: `ExternalActionDispatcher.dispatch()` tratava falha de `recordExecuted()` após retorno bem-sucedido do adapter como `FAILED`, permitindo que a migration 0026 liberasse o `idempotency_scope_key`.

## Escopo

- separar falha de execução do adapter de falha posterior de persistência do sucesso;
- representar efeito externo ambíguo como `UNKNOWN`;
- persistir `EXECUTING` antes de permitir mutação do adapter C2;
- preservar binding quando `EXECUTING` expira;
- manter `FAILED` para falha definitivamente não aplicada;
- adicionar regressões específicas;
- manter compatibilidade dos adapters anteriores somente-leitura;
- atualizar checkpoint e rastreabilidade.

## Fora do escopo

- habilitar escrita real GitHub pelo adapter C2;
- `APPROVE`, `REQUEST_CHANGES`, merge, close/reopen, mudança de base, force-push ou branch protection;
- deploy ou produção;
- ampliar operações além de `comment-pr`, `review-pr-comment` e `update-pr-text-metadata`;
- reescrever retrospectivamente o PRF de recuperação de conformidade da issue #81.

## Critérios de aceite

```yaml
postwrite_record_executed_failure: UNKNOWN
postwrite_record_failed_called: false
partial_receipt: UNKNOWN
c2_pre_mutation_state: EXECUTING
expired_executing_state: UNKNOWN
expired_executing_binding: PRESERVED
definitive_prewrite_failure: FAILED
read_only_adapter_regression: PASS
migration_0027_twice: PASS
dispatcher_regression_tests: PASS
expired_executing_integration_test: PASS
full_server_tests: PASS
format_lint_typecheck_build: PASS
documentation_validation: PASS
container_smoke: PASS
real_provider_write: NOT_AUTHORIZED
production: BLOCKED
exact_final_head_review: PENDING
```

## Agentes e responsabilidades

- **Mestre:** coordenação, contrato, CAF e transferência do checkpoint.
- **Gabriel:** remediação de integração/runtime e vínculo ao PR.
- **Renato:** validação de CI, migrations, testes e build.
- **Augusto:** rastreabilidade de ciclos, falhas e recuperações.
- **Miriam:** reconciliação entre issue #81, revisão posterior e fonte de verdade atual.
- **Carmem:** consistência do PRF e checkpoint, sem inventar evidência.
- **Emily:** auditoria independente do HEAD final.
- **Léo:** decisão do gate após auditoria.

## Fluxo

```text
P1 no HEAD edaef628
→ capturar e confirmar
→ corrigir dispatcher/ledger/recovery
→ adicionar migration 0027 e regressões
→ validar
→ corrigir formatação
→ validar
→ corrigir compatibilidade read-only
→ validar implementação em 3fede0da
→ gerar PRF/checkpoint
→ CI do HEAD documental final
→ revisão independente do HEAD exato
→ gate de Léo
```

## Autorizações e proibições

A remediação pode alterar apenas o branch do PR #80 dentro do escopo C2 e seus artefatos de rastreabilidade. Escrita real do provider C2 e integração em `main` permanecem bloqueadas até os gates vigentes.
