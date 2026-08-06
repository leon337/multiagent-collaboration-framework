# MCF-DEC-060-RC-001 — Revisão independente do adapter externo A1

**Decisão:** PASS  
**Gate de integração:** APPROVED_FOR_MERGE  
**Missão:** MCF-RUNTIME-006-A1  
**PR:** #71  
**Head de código revisado:** `c4c30242da35e348181e926192c185ff1ebce6e1`  
**Head documental validado:** `fdadc5e3e87f8c69449c03fc2302c9f87284c0ec`

## 1. Escopo revisado

- `ExternalActionDispatcher` e `AdapterRegistry`;
- `GitHubCodeReviewAdapter` somente leitura;
- cobertura de arquivos, patches e paginação;
- reserva durável anterior ao provider;
- ordem causal completa do preflight;
- máquina de estados e lease do ledger;
- recibo assinado e validação de evidência;
- integração com `SkillExecutor` e `MissionRuntimeService`;
- migrações `0017_mcf_external_action_ledger.sql` e `0018_mcf_external_action_reservation_lease.sql`;
- testes unitários, integração, build e container smoke.

## 2. Achados resolvidos

```yaml
HIGH_A1_001:
  problema: veredito_poderia_parecer_completo_com_patch_ausente_ou_lista_truncada
  estado: RESOLVIDO
  evidencia:
    - cobertura_COMPLETE_ou_PARTIAL_explicita
    - falha_quando_nenhum_patch_textual_existe
    - paginacao_limitada_e_falha_explicita_acima_de_1000_arquivos

HIGH_A1_002:
  problema: tentativa_externa_nao_possuia_rastro_duravel_antes_do_provider
  estado: RESOLVIDO
  evidencia:
    - tentativa_reservada_em_transacao
    - EXTERNAL_ACTION_REQUESTED_persistido_antes_do_GET
    - EXTERNAL_ACTION_ALLOWED_persistido_antes_do_GET

MEDIUM_A1_003:
  problema: testes_nao_reproduziam_READ_AND_PROPOSE
  estado: RESOLVIDO

MEDIUM_A1_004:
  problema: URL_nao_validava_hostname_github.com
  estado: RESOLVIDO

HIGH_A1_005:
  problema: timeline_externa_precedia_abertura_e_autorizacao_da_fase
  estado: RESOLVIDO
  ordem:
    - PHASE_STARTED
    - SKILL_SELECTED
    - PERMISSION_GRANTED
    - TOOL_REQUESTED
    - EXTERNAL_ACTION_REQUESTED
    - EXTERNAL_ACTION_ALLOWED
    - EXTERNAL_ACTION_EXECUTED_ou_FAILED
    - EXTERNAL_ACTION_EVIDENCE_VALIDATED_ou_rejeicao

MEDIUM_A1_006:
  problema: ledger_aceitava_saltos_e_reescrita_de_estado_terminal
  estado: RESOLVIDO
  transicoes:
    ALLOWED:
      - EXECUTED
      - FAILED
    EXECUTED:
      - EVIDENCE_VALIDATED
      - EVIDENCE_REJECTED
    terminais:
      - FAILED
      - EVIDENCE_VALIDATED
      - EVIDENCE_REJECTED
      - ABANDONED
  idempotencia: repeticao_do_mesmo_estado_nao_gera_evento_duplicado

HIGH_A1_007:
  problema: reserva_da_missao_nao_permanecia_ativa_ate_a_persistencia_final
  estado: RESOLVIDO
  evidencia:
    - active_external_attempt_id_duravel
    - persistencia_final_restrita_a_tentativa_terminal_proprietaria
    - execucao_concorrente_bloqueada_enquanto_reserva_ativa

HIGH_A1_008:
  problema: arquivos_do_PR_poderiam_ser_associados_a_um_head_SHA_antigo
  estado: RESOLVIDO
  evidencia:
    - head_do_PR_relido_apos_cada_pagina
    - mudanca_do_SHA_gera_RESERVATION_CONFLICT_retryable

MEDIUM_A1_009:
  problema: aliases_de_provider_e_operation_geravam_recibo_nao_canonico
  estado: RESOLVIDO
  evidencia:
    - canonicalizacao_na_permissao
    - canonicalizacao_no_adapter
    - canonicalizacao_no_recibo
    - canonicalizacao_na_validacao

HIGH_A1_010:
  problema: interrupcao_apos_reserva_poderia_bloquear_a_missao_indefinidamente
  estado: RESOLVIDO
  evidencia:
    - lease_duravel_de_10_minutos
    - reconciliacao_transacional_na_proxima_reserva_ou_persistencia
    - estado_ABANDONED
    - evento_EXTERNAL_ACTION_ABANDONED_auditavel
    - liberacao_atomica_da_missao
```

## 3. Evidência final de CI

```yaml
documentation_validation:
  run: 31074496530
  conclusion: success
foundation:
  run: 31074496533
  formatting: success
  lint: success
  typecheck: success
  migration_twice: success
  tests: success
  build: success
container_smoke:
  run: 31074496557
  conclusion: success
```

## 4. Testes de hardening

```yaml
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

## 5. Estado da revisão e integração

```yaml
critical_open: 0
high_open: 0
medium_open: 0
low_open: 0
unresolved_threads: 0
main_divergence: false
mergeable: true
configured_checks: 3_success
integration_decision: APPROVED_FOR_MERGE
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
