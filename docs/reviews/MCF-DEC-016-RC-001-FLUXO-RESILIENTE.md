# MCF-DEC-016 — RC-001 do Fluxo Resiliente

## Veredito

`PASS_WITH_AUTOMATION_RESERVATION`

```yaml
critical: 0
high: 0
medium: 1
low: 1
cenarios: 6
pass: 6
fail: 0
```

## Escopo

A revisão avaliou:

- MCF-DEC-016;
- schema `caf-flow-checkpoint.schema.json`;
- template `CAF-FLOW-CHECKPOINT.yaml`;
- tratamento do incidente HTTP 422 causado por tentativa de criar PR duplicado;
- risco de passagem de bastão para estado abstrato;
- risco de `ENCERRADO` com ação pendente.

## Cenários executados

### 1. Fluxo normal

Checkpoint em `EM_EXECUCAO`, sem falha, com destinatário válido e artefato.

**Resultado esperado:** válido.  
**Resultado observado:** válido.  
**Estado:** PASS.

### 2. PR duplicado recuperável

Checkpoint em `RECUPERANDO`, com erro HTTP 422, efeito confirmado como nenhum novo PR criado e recuperação por reutilização do PR existente.

**Resultado esperado:** válido.  
**Resultado observado:** válido.  
**Estado:** PASS.

### 3. Destinatário `ENCERRADO`

Checkpoint tenta passar o bastão para `ENCERRADO`.

**Resultado esperado:** inválido.  
**Resultado observado:** rejeitado pelo schema.  
**Estado:** PASS.

### 4. Estado encerrado com ação pendente

Checkpoint usa `estado: ENCERRADO` e `proxima_acao: implementar tela`.

**Resultado esperado:** inválido.  
**Resultado observado:** rejeitado porque `proxima_acao` deve ser `nenhuma`.  
**Estado:** PASS.

### 5. Falha sem efeito confirmado

Checkpoint declara falha recuperável, mas deixa `efeito_confirmado` vazio.

**Resultado esperado:** inválido.  
**Resultado observado:** rejeitado.  
**Estado:** PASS.

### 6. Dependência externa real

Checkpoint em `AGUARDANDO_DEPENDENCIA_EXTERNA`, com gate manual, efeito confirmado e destinatário Léo.

**Resultado esperado:** válido.  
**Resultado observado:** válido.  
**Estado:** PASS.

## Achado médio

O schema é validável, mas o repositório ainda não possui um job automático que valide todo checkpoint produzido nas conversas. A conformidade imediata depende do Mestre preencher e verificar o checkpoint antes da passagem.

### Recomendação

Em evolução futura, criar um validador de checkpoints e integrá-lo ao pipeline documental do MCF.

## Achado baixo

A lista de classes de falha cobre o cenário atual, mas poderá precisar de extensão quando existirem execuções distribuídas e concorrentes entre agentes reais.

## Conclusão

A decisão é suficiente para aplicação operacional imediata e impede documentalmente os erros observados:

- interrupção por falha recuperável;
- passagem para destinatário abstrato;
- encerramento com ação pendente;
- recuperação sem confirmação de efeito;
- ocultação de falhas.

## Gate

```yaml
aplicacao_operacional: APROVADA
publicacao_na_main: AGUARDANDO_MERGE_AUTORIZADO
merge: NAO_AUTORIZADO
```
