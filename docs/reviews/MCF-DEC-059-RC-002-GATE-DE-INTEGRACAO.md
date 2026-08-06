# MCF-DEC-059 — RC-002 do gate de integração

**Objeto:** hardening final da hierarquia persistente  
**Revisora:** Emily  
**PR:** #69  
**Head técnico:** `970a72addbd573e3415826774b4808cfffd9dbfe`

## 1. Motivo da RC-002

A RC-001 aprovou a base da hierarquia, mas o gate de integração encontrou seis threads ainda abertas. O merge foi suspenso e o PR voltou para draft.

## 2. Achados do gate

```yaml
P1_HTTP_SCHEMA:
  problema: Zod_descartava_parentMissionId_e_returnToAgentId
  estado: RESOLVIDO
P1_NESTED_COMPLETION:
  problema: missao_intermediaria_podia_concluir_com_filho_pendente
  estado: RESOLVIDO
P2_PROTECTED_STATE:
  problema: retorno_podia_rebaixar_estado_protegido
  estado: RESOLVIDO
P1_PARENT_LOCK:
  problema: checkpoint_do_pai_era_capturado_sem_row_lock
  estado: RESOLVIDO
P2_FIREWALL:
  problema: returnToAgentId_podia_contornar_o_firewall_humano
  estado: RESOLVIDO
P2_LEDGER_ORDER:
  problema: evento_de_retorno_podia_anteceder_eventos_de_conclusao
  estado: RESOLVIDO
```

## 3. Correções auditadas

### Fronteira HTTP

O schema de criação de missão aceita e preserva os três campos públicos da hierarquia. Um teste unitário comprova que o controller os entrega intactos ao serviço.

### Cadeia de três níveis

O guard de suspensão passou a valer para qualquer missão com filho pendente, inclusive uma missão que também seja filha. O teste pai → filho → neto comprova que o filho não conclui antes do neto.

### Lock concorrente

A criação do filho executa `SELECT ... FOR UPDATE` sobre o pai antes de validar e capturar o checkpoint. O teste concorrente mantém a transação do filho aberta, comprova que a atualização do pai aguarda e verifica que ela é rejeitada após a criação do filho.

### Firewall humano

O banco rejeita:

- `returnToAgentId: Leandro`;
- destinatário ausente de `selectedAgents` da missão-pai.

### Ordem causal

O retorno é processado por constraint trigger diferido. O teste confirma:

```text
PHASE_COMPLETED < MISSION_COMPLETED < PARENT_RETURN_COMPLETED
```

## 4. Evidências

```yaml
documentation_validation:
  run_id: 31066918107
  conclusion: success
foundation:
  run_id: 31066918081
  conclusion: success
container_smoke:
  run_id: 31066918082
  conclusion: success
```

O Foundation comprovou:

- format: PASS;
- lint: PASS;
- typecheck: PASS;
- migration_twice: PASS;
- tests: PASS;
- build: PASS.

## 5. Threads

```yaml
threads_encontradas: 6
threads_resolvidas: 6
threads_abertas: 0
review_id: 4870590932
```

## 6. Resultado consolidado

```yaml
critical_open: 0
high_open: 0
medium_open: 0
low_open: 0
reserva_pai_filho_neto: RESOLVIDA
```

## 7. Veredito

```yaml
veredito: PASS
integracao_tecnica: APROVADA
merge_automatico: NAO
production: NAO_AUTORIZADA
cost: NAO_AUTORIZADO
publication: false
condicao_restante: CI_VERDE_DO_HEAD_CANONICO_DOCUMENTAL
```
