# MCF-DEC-059 — Hierarquia persistente e retorno automático à missão-pai

**Estado:** EM VALIDAÇÃO NO PR #69  
**Data:** 5 de agosto de 2026  
**Origem:** reconciliação do PR #29 e da MCF-DEC-016-A1

## 1. Problema

A correção anterior definiu os campos `parent_mission_id`, `return_to` e `return_status`, mas a aplicação permanecia processual: o Mestre precisava lembrar de restaurar manualmente a missão-pai.

Esse modelo não era suficiente para o runtime persistente porque permitia:

- conclusão global enquanto existia submissão pendente;
- perda do destinatário de retorno;
- divergência entre estado declarado e estado persistido;
- evento `MISSION_COMPLETED` sem conclusão válida no banco.

## 2. Decisão

A hierarquia passa a ser uma propriedade persistente de `mcf_missions`.

```yaml
parent_mission_id: text | null
return_to_agent_id: text | null
return_status: NOT_APPLICABLE | PENDING | COMPLETED
```

A API representa os mesmos campos no contrato em camelCase:

```yaml
parentMissionId:
returnToAgentId:
returnStatus:
```

## 3. Invariantes

### Missão independente

```yaml
parent_mission_id: null
return_to_agent_id: null
return_status: NOT_APPLICABLE
```

### Submissão ativa

```yaml
parent_mission_id: identificador_valido
return_to_agent_id: agente_valido
return_status: PENDING
```

### Submissão concluída

```yaml
parent_mission_id: identificador_valido
return_to_agent_id: agente_valido
return_status: COMPLETED
state: COMPLETED
```

Uma missão não pode ser sua própria missão-pai. Uma submissão não pode apontar para missão inexistente, concluída ou cancelada.

## 4. Enforcement transacional

A migração `0014_mcf_mission_hierarchy.sql` implementa:

1. colunas e constraints de integridade;
2. índice para localizar submissões pendentes;
3. trigger de normalização do contrato;
4. bloqueio de conclusão da missão-pai enquanto existir retorno pendente;
5. conclusão automática de `return_status` quando a submissão termina;
6. restauração automática da missão-pai em `EXECUTING`;
7. devolução do bastão para `return_to_agent_id`;
8. supressão de `MISSION_COMPLETED` quando o estado persistido não for `COMPLETED`;
9. eventos idempotentes de retorno e retomada.

## 5. Eventos

```yaml
PARENT_RETURN_COMPLETED:
  mission_id: submissao
  payload:
    parentMissionId:
    returnToAgentId:

PARENT_MISSION_RESUMED:
  mission_id: missao_pai
  payload:
    childMissionId:
    returnToAgentId:
```

## 6. Idempotência

Os eventos de retorno usam chaves determinísticas ligadas à submissão. Uma repetição da atualização não cria um segundo retorno lógico.

## 7. Compatibilidade

Missões antigas permanecem independentes porque as novas colunas recebem:

```yaml
parent_mission_id: null
return_to_agent_id: null
return_status: NOT_APPLICABLE
```

O contrato existente continua válido porque os campos TypeScript são opcionais.

## 8. Critério de aprovação

```yaml
format: PASS
typecheck: PASS
migration_twice: PASS
integration_test: PASS
container_smoke: PASS
documentation_validation: PASS
critical_findings: 0
high_findings: 0
```

Até todos os critérios passarem, a decisão permanece `EM VALIDAÇÃO` e o PR #69 continua draft.

## 9. Relação com o PR #29

O PR #29 preserva a origem conceitual da correção. A implementação atual substitui a dependência de restauração manual por controles persistentes e transacionais.
