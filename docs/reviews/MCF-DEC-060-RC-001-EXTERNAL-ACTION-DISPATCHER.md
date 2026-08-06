# MCF-DEC-060-RC-001 — Revisão independente do adapter externo A1

**Decisão:** PASS  
**Gate de integração:** APPROVED_FOR_MERGE  
**Missão:** MCF-RUNTIME-006-A1  
**PR:** #71  
**Head técnico final:** `da9a48449e509bd446197f22b1490d783f3f8729`  
**Head validado:** `f626216e9941c58357a1772f908d1606dd8917d9`

## 1. Escopo revisado

- dispatcher, registry e contratos de ações externas;
- `GitHubCodeReviewAdapter` somente leitura;
- vínculo entre recurso autorizado e repositório consultado;
- cobertura de patches, paginação e mutação do head do PR;
- reserva durável, lease, timeout e reconciliação;
- recibo assinado, validação de evidência e timeline;
- migrações `0017` e `0018`;
- testes unitários, integração, regressão e recuperação.

## 2. Achados resolvidos

```yaml
HIGH_A1_001:
  problema: cobertura_incompleta_poderia_parecer_PASS
  estado: RESOLVIDO

HIGH_A1_002:
  problema: tentativa_sem_rastro_duravel_antes_do_provider
  estado: RESOLVIDO

MEDIUM_A1_003:
  problema: testes_nao_reproduziam_READ_AND_PROPOSE
  estado: RESOLVIDO

MEDIUM_A1_004:
  problema: hostname_github_nao_validado
  estado: RESOLVIDO

HIGH_A1_005:
  problema: ordem_causal_global_incorreta
  estado: RESOLVIDO

MEDIUM_A1_006:
  problema: transicoes_invalidas_no_ledger
  estado: RESOLVIDO

HIGH_A1_007:
  problema: reserva_da_missao_nao_permanecia_ate_persistencia_final
  estado: RESOLVIDO

HIGH_A1_008:
  problema: arquivos_do_PR_podiam_ser_associados_a_SHA_antigo
  estado: RESOLVIDO

MEDIUM_A1_009:
  problema: aliases_de_provider_e_operation_geravam_recibo_inconsistente
  estado: RESOLVIDO

HIGH_A1_010:
  problema: interrupcao_apos_reserva_podia_bloquear_missao_indefinidamente
  estado: RESOLVIDO
  evidencia:
    - lease_de_10_minutos
    - estado_ABANDONED
    - evento_EXTERNAL_ACTION_ABANDONED
    - reconciliacao_transacional

HIGH_A1_011:
  problema: inputs_repository_podia_divergir_do_tool_resource
  estado: RESOLVIDO
  evidencia:
    - consulta_derivada_do_tool_resource
    - input_opcional_normalizado
    - divergencia_rejeitada_com_INVALID_CONTEXT
    - falha_antes_de_qualquer_chamada_de_rede

MEDIUM_A1_012:
  problema: lease_podia_expirar_durante_adapter_ainda_ativo
  estado: RESOLVIDO
  evidencia:
    - deadline_global_de_5_minutos
    - lease_de_10_minutos
    - AbortSignal_compartilhado_por_deadline
    - falha_ADAPTER_TIMEOUT_retryable
    - chamada_de_rede_abortada_antes_da_expiracao
```

## 3. Evidência final de CI

```yaml
documentation_validation:
  run: 31075440687
  conclusion: success
foundation:
  run: 31075440813
  formatting: success
  lint: success
  typecheck: success
  migration_twice: success
  tests: success
  build: success
container_smoke:
  run: 31075440824
  conclusion: success
```

## 4. Testes de hardening

```yaml
repository_resource_mismatch_before_network: PASS
adapter_timeout_before_lease_expiry: PASS
timed_out_request_abort: PASS
durable_mission_reservation: PASS
concurrent_mission_persistence_block: PASS
terminal_owner_release: PASS
expired_orphan_reconciliation: PASS
abandoned_event_audit: PASS
pull_request_head_mutation: PASS
provider_alias_canonicalization: PASS
stale_version_reservation: PASS
partial_coverage: PASS
pagination_limit: PASS
causal_preflight_order: PASS
invalid_state_transition: PASS
idempotent_transition: PASS
```

## 5. Estado da revisão

```yaml
review_id: 4871466719
decision: PASS
critical_open: 0
high_open: 0
medium_open: 0
low_open: 0
unresolved_threads: 0
main_divergence: false
mergeable: true
merge_authorized: false
```

## 6. Restrições preservadas

```yaml
external_write: false
production: BLOQUEADA
cost: NAO_AUTORIZADO
publication: false
merge_automatico: false
merge_autorizado: false
```

## 7. Veredito

O A1 atende aos critérios técnicos e governamentais para merge. Este RC não executa nem autoriza merge, produção, publicação ou custo externo. A integração depende de autorização humana explícita de Leandro.
