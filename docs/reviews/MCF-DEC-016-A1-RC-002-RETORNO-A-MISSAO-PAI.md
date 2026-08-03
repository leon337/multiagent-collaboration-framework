# MCF-DEC-016-A1 — RC-002 do retorno à missão-pai

## Escopo

Revisar a correção criada após o Mestre encerrar indevidamente a missão-pai da Fase 22A ao concluir o subfluxo de merge.

## Evidência do incidente

```yaml
subfluxo: MERGE-CURRENT-CYCLE
resultado_do_subfluxo: concluido
missao_pai: SCREEN-PHASE-22A-FIRST-SCREEN
estado_real_da_missao_pai: EM_EXECUCAO
estado_declarado_incorretamente: ENCERRADO
proxima_acao_declarada_incorretamente: nenhuma
```

## Artefatos revisados

- `docs/decisions/MCF-DEC-016-A1-RETORNO-OBRIGATORIO-A-MISSAO-PAI.md`;
- `schemas/caf-flow-checkpoint.schema.json`;
- `templates/CAF-FLOW-CHECKPOINT.yaml`.

## Cenários

### 1. Missão independente

```yaml
parent_mission_id: null
return_to: null
return_status: NOT_APPLICABLE
```

Resultado: `PASS`.

### 2. Submisão em execução

```yaml
parent_mission_id: MISSAO_PAI
return_to: Rafael
return_status: PENDING
estado: EM_EXECUCAO
```

Resultado: `PASS`.

### 3. Submisão encerrada com retorno pendente

```yaml
parent_mission_id: MISSAO_PAI
return_to: Rafael
return_status: PENDING
estado: ENCERRADO
```

Resultado esperado: rejeição pelo schema.  
Resultado: `PASS`.

### 4. Submisão encerrada após retorno concluído

```yaml
parent_mission_id: MISSAO_PAI
return_to: Rafael
return_status: COMPLETED
estado: ENCERRADO
proxima_acao: nenhuma
```

Resultado: `PASS`.

### 5. Destinatário abstrato

```yaml
return_to: ENCERRADO
```

Resultado esperado: rejeição.  
Resultado: `PASS`.

### 6. Restauração da missão-pai

Depois do encerramento da submisão, o checkpoint pai volta para:

```yaml
estado: EM_EXECUCAO
proxima_acao: implementar_wireframe
destinatario: Rafael
```

Resultado: `PASS`.

## Achados

```yaml
critical: 0
high: 0
medium: 1
low: 0
```

### Médio

A estrutura impede checkpoints hierárquicos inválidos, porém a pilha de missões ainda não é gerenciada automaticamente por um executor. A conformidade depende do Mestre produzir e restaurar os checkpoints.

## Veredito

`PASS_WITH_ENFORCEMENT_RESERVATION`

## Gate

Antes de considerar a continuidade totalmente automática, implementar um validador/orquestrador que:

1. empilhe a missão-pai ao abrir submisão;
2. exija `return_status: COMPLETED`;
3. restaure o checkpoint pai;
4. impeça resposta final enquanto a pilha não estiver vazia.

## Governança

```yaml
PR: 29
merge: NAO_AUTORIZADO
aplicacao_operacional: imediata
```
