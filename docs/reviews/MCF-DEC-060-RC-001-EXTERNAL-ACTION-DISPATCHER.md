# MCF-DEC-060-RC-001 — Revisão independente do adapter externo A1

**Decisão:** PASS_WITH_MINOR_RESERVATION  
**Missão:** MCF-RUNTIME-006-A1  
**PR:** #71  
**Head técnico:** `24b45615115b95cd2de75777b5123c23fc3dddb1`

## 1. Escopo revisado

- `ExternalActionDispatcher` e `AdapterRegistry`;
- `GitHubCodeReviewAdapter` somente leitura;
- cobertura de arquivos, patches e paginação;
- reserva durável anterior ao provider;
- ordem causal completa do preflight;
- máquina de estados do ledger;
- recibo assinado e validação de evidência;
- integração com `SkillExecutor` e `MissionRuntimeService`;
- migração `0017_mcf_external_action_ledger.sql`;
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
  idempotencia: repeticao_do_mesmo_estado_nao_gera_evento_duplicado
```

## 3. Evidência de CI

```yaml
documentation_validation:
  run: 31071793017
  conclusion: success
foundation:
  run: 31071793043
  formatting: success
  lint: success
  typecheck: success
  migration_twice: success
  tests: success
  build: success
container_smoke:
  run: 31071793033
  conclusion: success
```

## 4. Reserva residual

```yaml
LOW_A1_007:
  descricao: >-
    O preflight, a reserva e o resultado externo são duráveis antes e durante a leitura,
    mas a linha final da fase continua sendo materializada por persistExecution após o provider.
    Uma interrupção nesse intervalo deixa evidência suficiente para reconciliação, porém ainda
    exige um reconciliador de fases em hardening posterior.
  impacto: baixo_no_A1_por_ser_operacao_somente_leitura
  tratamento: MCF_RUNTIME_006_HARDENING
```

## 5. Restrições preservadas

```yaml
external_write: false
production: BLOQUEADA
cost: NAO_AUTORIZADO
publication: false
merge_automatico: false
```

## 6. Veredito

O A1 atende aos critérios técnicos para sair do modo draft e seguir ao gate de integração. Este RC não autoriza merge, produção, publicação ou custo externo.
