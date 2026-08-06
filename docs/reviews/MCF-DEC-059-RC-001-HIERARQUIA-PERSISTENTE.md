# MCF-DEC-059 — RC-001 da hierarquia persistente

**Objeto:** retorno automático à missão-pai  
**Revisora:** Emily  
**PR:** #69  
**Head validado:** `5c420693133c6bec218172089b0d1f14b88d149c`

## 1. Escopo auditado

- contrato TypeScript de hierarquia;
- migração `0014_mcf_mission_hierarchy.sql`;
- constraints e triggers transacionais;
- bloqueio de conclusão prematura;
- restauração da missão-pai;
- eventos de retorno;
- compatibilidade com missões independentes;
- teste de integração;
- idempotência da migração.

## 2. Cenários validados

### A — missão independente

Sem missão-pai, o runtime mantém:

```yaml
parentMissionId: null
returnToAgentId: null
returnStatus: NOT_APPLICABLE
```

Resultado: `PASS`.

### B — submissão válida

A submissão referencia missão-pai ativa e destinatário de retorno.

Resultado: `PASS`.

### C — conclusão prematura da missão-pai

A missão-pai tenta persistir `COMPLETED` enquanto existe submissão `PENDING`.

Resultado esperado:

- estado persistido permanece `EXECUTING`;
- evento `MISSION_COMPLETED` não é registrado.

Resultado: `PASS`.

### D — conclusão da submissão

A submissão termina com sucesso.

Resultado esperado:

- `returnStatus: COMPLETED`;
- evento `PARENT_RETURN_COMPLETED`;
- missão-pai restaurada para `EXECUTING`;
- bastão devolvido ao agente configurado;
- evento `PARENT_MISSION_RESUMED`.

Resultado: `PASS`.

### E — migração repetida

A sequência completa de migrações foi executada duas vezes no mesmo banco do CI.

Resultado: `PASS`.

### F — regressão do runtime

Lint, typecheck, testes existentes, build e container smoke foram executados.

Resultado: `PASS`.

## 3. Evidências

```yaml
Documentation_validation:
  run_id: 31063763465
  conclusion: success
Rede_Social_Foundation:
  run_id: 31063763483
  conclusion: success
Rede_Social_Container_Smoke:
  run_id: 31063763463
  conclusion: success
```

O workflow Foundation comprovou:

- format: PASS;
- lint: PASS;
- typecheck: PASS;
- migration_twice: PASS;
- test: PASS;
- build: PASS.

## 4. Achados

```yaml
critical: 0
high: 0
medium: 0
low: 1
```

### LOW-001 — profundidade hierárquica ampla ainda não testada

O cenário validado cobre uma missão-pai e uma submissão. Cadeias com múltiplos níveis deverão receber testes adicionais durante o endurecimento do MCF-RUNTIME-006.

O achado não bloqueia a integração da correção atual.

## 5. Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATION
integracao: APROVADA
producao: NAO_AUTORIZADA
merge_do_PR_69: SUJEITO_AO_GATE_DE_GOVERNANCA
```
