# MCF-DEC-059 — Hierarquia persistente e retorno automático à missão-pai

**Estado:** APROVADA TECNICAMENTE; AGUARDANDO GATE DE INTEGRAÇÃO  
**Data:** 5 de agosto de 2026  
**Origem:** reconciliação do PR #29 e da MCF-DEC-016-A1

## 1. Problema

A correção anterior definiu os campos `parent_mission_id`, `return_to` e `return_status`, mas a restauração ainda dependia de atuação processual do Mestre.

Esse modelo permitia:

- conclusão global enquanto existia submissão pendente;
- perda do destinatário de retorno;
- divergência entre estado declarado e estado persistido;
- evento `MISSION_COMPLETED` sem conclusão válida no banco;
- sobrescrita de estado protegido da missão-pai;
- perda do checkpoint anterior;
- avanço concorrente do pai enquanto a submissão permanecia aberta;
- ambiguidade entre múltiplas submissões pendentes.

## 2. Decisão

A hierarquia passa a ser uma propriedade persistente de `mcf_missions`.

```yaml
parent_mission_id: text | null
return_to_agent_id: text | null
return_status: NOT_APPLICABLE | PENDING | COMPLETED
parent_checkpoint_state: mission_state | null
parent_checkpoint_phase_id: text | null
parent_checkpoint_agent_id: text | null
```

A API expõe somente os campos públicos necessários:

```yaml
parentMissionId:
returnToAgentId:
returnStatus:
```

O snapshot do checkpoint permanece interno ao banco.

## 3. Invariantes

### Missão independente

```yaml
parent_mission_id: null
return_to_agent_id: null
return_status: NOT_APPLICABLE
parent_checkpoint_state: null
```

### Submissão ativa

```yaml
parent_mission_id: identificador_valido
return_to_agent_id: agente_valido
return_status: PENDING
parent_checkpoint_state: estado_persistido_do_pai
```

### Submissão concluída

```yaml
parent_mission_id: identificador_valido
return_to_agent_id: agente_valido
return_status: COMPLETED
state: COMPLETED
```

Regras adicionais:

- uma missão não pode ser sua própria missão-pai;
- uma submissão não pode apontar para missão inexistente, concluída ou cancelada;
- cada missão-pai pode possuir somente uma submissão ativa;
- o pai não pode avançar fases normalmente enquanto o filho estiver pendente;
- transições para `BLOCKED_RISK`, `RECOVERING`, `WAITING_EXTERNAL` e `CANCELLED` continuam permitidas;
- estados protegidos nunca são rebaixados automaticamente para `EXECUTING`.

## 4. Enforcement transacional

A migração `0014_mcf_mission_hierarchy.sql` implementa:

1. campos e constraints de integridade;
2. snapshot do estado, fase e agente do pai;
3. normalização do contrato público;
4. evento idempotente `SUBMISSION_OPENED`;
5. suspensão do avanço operacional normal do pai;
6. bloqueio da conclusão do pai enquanto houver retorno pendente;
7. conclusão automática de `return_status`;
8. restauração do checkpoint validado;
9. preservação de estados protegidos;
10. retorno adiado quando a retomada automática não for segura;
11. supressão de `MISSION_COMPLETED` quando o estado persistido não for `COMPLETED`;
12. eventos idempotentes de retorno e retomada.

A migração `0015_mcf_single_active_submission.sql` cria índice parcial único que limita cada missão-pai a um único filho `PENDING`.

## 5. Eventos

```yaml
SUBMISSION_OPENED:
  mission_id: missao_pai
  payload:
    childMissionId:
    returnToAgentId:
    checkpointState:
    checkpointPhaseId:

PARENT_RETURN_COMPLETED:
  mission_id: submissao
  payload:
    parentMissionId:
    returnToAgentId:

PARENT_MISSION_RESUMED:
  mission_id: missao_pai
  payload:
    childMissionId:
    restoredState:
    restoredPhaseId:

PARENT_RETURN_DEFERRED:
  mission_id: missao_pai
  payload:
    childMissionId:
    reason:
```

## 6. Idempotência

Eventos hierárquicos usam chaves determinísticas ligadas ao pai e ao filho. A repetição de uma atualização não cria segunda abertura, segundo retorno ou segunda retomada lógica.

As migrações `0014` e `0015` foram executadas duas vezes no mesmo banco de CI.

## 7. Compatibilidade

Missões antigas permanecem independentes com valores nulos e `NOT_APPLICABLE`. Os campos públicos TypeScript são opcionais, preservando contratos existentes.

## 8. Achados encontrados e resolvidos

```yaml
HIGH_001:
  problema: retorno_forcava_EXECUTING_sobre_estado_protegido
  estado: RESOLVIDO
MEDIUM_001:
  problema: current_phase_id_nao_era_restaurado
  estado: RESOLVIDO
HIGH_002:
  problema: progresso_concorrente_do_pai_podia_ser_sobrescrito
  estado: RESOLVIDO
MEDIUM_002:
  problema: SUBMISSION_OPENED_nao_era_emitido
  estado: RESOLVIDO
MEDIUM_003:
  problema: multiplos_filhos_pendentes_disputavam_checkpoint_e_retorno
  estado: RESOLVIDO
```

## 9. Evidência técnica

```yaml
head_validado: 5256ef1392d0da55a6c5d47fd3f64eb4b2526bfd
format: PASS
lint: PASS
typecheck: PASS
migration_twice: PASS
integration_tests: PASS
build: PASS
container_smoke: PASS
documentation_validation: PASS
critical_open: 0
high_open: 0
medium_open: 0
```

Workflows:

- Documentation validation — run `31065590519` — PASS;
- Rede Social Foundation — run `31065590521` — PASS;
- Rede Social Container Smoke — run `31065590524` — PASS.

## 10. Relação com o PR #29

O PR #29 preserva a origem conceitual. O PR #69 substitui a restauração manual por controles persistentes, transacionais, testados e auditáveis.

## 11. Limite da aprovação

A aprovação técnica não autoriza merge automático, produção, custo externo nem publicação. A integração à `main` permanece sujeita ao gate de governança do PR #69.
