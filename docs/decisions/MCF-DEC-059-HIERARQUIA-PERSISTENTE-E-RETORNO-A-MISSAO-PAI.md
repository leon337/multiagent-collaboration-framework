# MCF-DEC-059 — Hierarquia persistente e retorno seguro à missão-pai

**Estado:** APROVADA TECNICAMENTE; AGUARDANDO CI DO HEAD CANÔNICO  
**Data:** 5 de agosto de 2026  
**Origem:** reconciliação do PR #29, MCF-DEC-016-A1 e gate de integração do PR #69

## 1. Problema

O runtime precisava representar submissões como missões filhas persistentes, sem depender de lembrança processual para devolver o bastão à missão-pai.

Os riscos identificados durante as revisões foram:

- conclusão global enquanto existia submissão pendente;
- perda do estado, fase ou agente do checkpoint do pai;
- rebaixamento indevido de `BLOCKED_RISK`, `RECOVERING` ou `WAITING_EXTERNAL`;
- avanço concorrente do pai enquanto um filho permanecia aberto;
- múltiplas submissões pendentes disputando o mesmo retorno;
- campos hierárquicos removidos na validação HTTP;
- corrida entre criação do filho e atualização do pai;
- retorno destinado a Leandro ou a agente não selecionado pelo pai;
- missão intermediária concluída enquanto possuía filho pendente;
- evento de retorno registrado antes dos eventos que concluíram o filho.

## 2. Decisão

A hierarquia é propriedade persistente de `mcf_missions`.

```yaml
parent_mission_id: text | null
return_to_agent_id: text | null
return_status: NOT_APPLICABLE | PENDING | COMPLETED
parent_checkpoint_state: mission_state | null
parent_checkpoint_phase_id: text | null
parent_checkpoint_agent_id: text | null
```

A API pública aceita:

```yaml
parentMissionId: uuid | null
returnToAgentId: string | null
returnStatus: NOT_APPLICABLE | PENDING | COMPLETED
```

O snapshot do checkpoint permanece interno ao banco.

## 3. Invariantes

1. uma missão não pode ser sua própria missão-pai;
2. o pai deve existir e permanecer ativo;
3. cada pai pode possuir somente uma submissão `PENDING`;
4. a criação do filho bloqueia a linha do pai com `FOR UPDATE` enquanto valida e captura o checkpoint;
5. `returnToAgentId` deve pertencer a `selectedAgents` da missão-pai;
6. Leandro, autoridade humana final, não pode receber retorno técnico;
7. qualquer missão com filho pendente — inclusive missão intermediária — fica suspensa para avanço normal;
8. transições para `BLOCKED_RISK`, `RECOVERING`, `WAITING_EXTERNAL` e `CANCELLED` continuam permitidas;
9. conclusão prematura não altera estado, fase ou agente do pai;
10. estados protegidos nunca são rebaixados automaticamente;
11. o retorno restaura o checkpoint somente quando a retomada é segura;
12. o ledger registra os eventos na ordem causal.

## 4. Implementação

### Migração `0014_mcf_mission_hierarchy.sql`

Implementa os campos, constraints, snapshot, normalização, eventos hierárquicos, bloqueio de conclusão prematura e restauração do pai.

### Migração `0015_mcf_single_active_submission.sql`

Cria índice parcial único para limitar cada pai a uma submissão ativa.

### Migração `0016_mcf_hierarchy_gate_hardening.sql`

Implementa:

- lock `FOR UPDATE` na missão-pai;
- validação do destinatário de retorno;
- bloqueio explícito de Leandro como executor técnico;
- suspensão de qualquer missão com filho pendente;
- suporte seguro a cadeia pai → filho → neto;
- constraint trigger `DEFERRABLE INITIALLY DEFERRED` para ordenar o retorno após a conclusão do filho.

### Fronteira HTTP

`mission-runtime.controller.ts` preserva os campos hierárquicos durante a validação Zod.

## 5. Eventos

```yaml
SUBMISSION_OPENED:
  mission_id: missao_pai

PHASE_COMPLETED:
  mission_id: submissao

MISSION_COMPLETED:
  mission_id: submissao

PARENT_RETURN_COMPLETED:
  mission_id: submissao

PARENT_MISSION_RESUMED:
  mission_id: missao_pai

PARENT_RETURN_DEFERRED:
  mission_id: missao_pai
```

Ordem causal obrigatória para retorno normal:

```text
PHASE_COMPLETED < MISSION_COMPLETED < PARENT_RETURN_COMPLETED
```

## 6. Segurança e firewall humano

O destinatário de retorno é validado transacionalmente contra `selectedAgents` do pai. O nome `Leandro` é bloqueado como destino técnico, preservando a Human Delegation Firewall e a autoridade humana final.

## 7. Concorrência e idempotência

- a linha do pai é bloqueada antes da captura do checkpoint;
- atualizações concorrentes aguardam e depois são rejeitadas caso a submissão esteja pendente;
- eventos usam chaves determinísticas;
- migrações `0014`, `0015` e `0016` foram executadas duas vezes no mesmo banco de CI.

## 8. Achados resolvidos

```yaml
HIGH_001: retorno_rebaixava_estado_protegido
MEDIUM_001: fase_do_checkpoint_nao_era_restaurada
HIGH_002: progresso_concorrente_do_pai_podia_ser_sobrescrito
MEDIUM_002: SUBMISSION_OPENED_nao_era_emitido
MEDIUM_003: multiplas_submissoes_pendentes_geravam_retorno_ambiguo
P1_HTTP_SCHEMA: campos_hierarquicos_eram_descartados
P1_NESTED_COMPLETION: missao_intermediaria_podia_concluir_com_filho_pendente
P1_PARENT_LOCK: checkpoint_podia_ser_capturado_sem_lock
P2_FIREWALL: retorno_podia_contornar_delegation_firewall
P2_LEDGER_ORDER: retorno_podia_aparecer_antes_da_conclusao
```

Todos estão `RESOLVIDOS`.

## 9. Evidência técnica do hardening

```yaml
head_tecnico: 970a72addbd573e3415826774b4808cfffd9dbfe
documentation_validation: 31066918107_PASS
foundation: 31066918081_PASS
container_smoke: 31066918082_PASS
format: PASS
lint: PASS
typecheck: PASS
migrations_twice: PASS
tests: PASS
build: PASS
review_threads_resolved: 6
critical_open: 0
high_open: 0
medium_open: 0
low_open: 0
```

## 10. Testes adicionados

- preservação dos campos hierárquicos na fronteira HTTP;
- rejeição de Leandro como destinatário técnico;
- rejeição de agente não selecionado pelo pai;
- pai → filho → neto;
- bloqueio da conclusão da missão intermediária;
- restauração sequencial dos checkpoints;
- corrida entre abertura da submissão e atualização do pai;
- ordem causal do ledger.

## 11. Limite da aprovação

Esta decisão não autoriza produção, custo externo, publicação automática ou merge sem gate. O PR #69 somente poderá ser integrado após o head canônico documental repetir todos os workflows obrigatórios.
