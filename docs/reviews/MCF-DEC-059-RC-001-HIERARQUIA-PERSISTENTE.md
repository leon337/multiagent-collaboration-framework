# MCF-DEC-059 — RC-001 da hierarquia persistente

**Objeto:** retorno seguro e automático à missão-pai  
**Revisora:** Emily  
**PR:** #69  
**Head técnico validado:** `5256ef1392d0da55a6c5d47fd3f64eb4b2526bfd`

## 1. Escopo auditado

- contrato TypeScript de hierarquia;
- migração `0014_mcf_mission_hierarchy.sql`;
- migração `0015_mcf_single_active_submission.sql`;
- constraints, índices e triggers;
- snapshot do checkpoint do pai;
- suspensão operacional durante submissão;
- preservação de estados protegidos;
- bloqueio de conclusão prematura;
- restauração de estado, fase e agente;
- eventos de abertura, retorno, retomada e adiamento;
- limite de uma submissão ativa;
- compatibilidade com missões independentes;
- idempotência das migrações;
- testes de integração e regressão.

## 2. Cenários validados

### A — missão independente

Valores hierárquicos permanecem nulos e `NOT_APPLICABLE`.

Resultado: `PASS`.

### B — abertura de submissão

A submissão referencia missão-pai ativa, captura o checkpoint e registra `SUBMISSION_OPENED` no ledger do pai.

Resultado: `PASS`.

### C — avanço concorrente do pai

Uma tentativa de alterar fase ou agente do pai enquanto existe filho `PENDING` é rejeitada transacionalmente.

Resultado: `PASS`.

### D — conclusão prematura do pai

A tentativa de `COMPLETED` não altera estado, fase ou agente anteriores e não grava `MISSION_COMPLETED`.

Resultado: `PASS`.

### E — retorno normal

A submissão concluída recebe `returnStatus: COMPLETED`; o pai recupera o checkpoint e devolve o bastão ao agente configurado.

Resultado: `PASS`.

### F — estados protegidos

Foram testados:

- `BLOCKED_RISK`;
- `RECOVERING`;
- `WAITING_EXTERNAL`.

O retorno não rebaixa nenhum desses estados para `EXECUTING`; o ledger registra `PARENT_RETURN_DEFERRED`.

Resultado: `PASS`.

### G — uma submissão ativa

Uma segunda submissão `PENDING` para o mesmo pai é rejeitada pelo índice parcial único. Apenas um evento `SUBMISSION_OPENED` permanece registrado.

Resultado: `PASS`.

### H — migração repetida

As migrações completas, incluindo `0014` e `0015`, foram executadas duas vezes no mesmo banco de CI.

Resultado: `PASS`.

### I — regressão

Format, lint, typecheck, testes existentes, novos testes, build e container smoke passaram.

Resultado: `PASS`.

## 3. Achados durante a revisão

```yaml
HIGH_001:
  descricao: retorno_forcava_EXECUTING_sobre_estado_protegido
  estado: RESOLVIDO
MEDIUM_001:
  descricao: current_phase_id_nao_era_restaurado
  estado: RESOLVIDO
HIGH_002:
  descricao: progresso_concorrente_do_pai_podia_ser_sobrescrito
  estado: RESOLVIDO
MEDIUM_002:
  descricao: evento_SUBMISSION_OPENED_nao_era_emitido
  estado: RESOLVIDO
MEDIUM_003:
  descricao: multiplas_submissoes_pendentes_geravam_retorno_ambiguo
  estado: RESOLVIDO
```

## 4. Evidências

```yaml
Documentation_validation:
  run_id: 31065590519
  conclusion: success
Rede_Social_Foundation:
  run_id: 31065590521
  conclusion: success
Rede_Social_Container_Smoke:
  run_id: 31065590524
  conclusion: success
```

O Foundation comprovou:

- format: PASS;
- lint: PASS;
- typecheck: PASS;
- migration_twice: PASS;
- test: PASS;
- build: PASS.

## 5. Pendência residual

```yaml
critical_open: 0
high_open: 0
medium_open: 0
low_open: 1
```

### LOW-001 — profundidade hierárquica ampla

O ciclo validou pai e filho e proibiu irmãos paralelos pendentes. Cadeias pai → filho → neto deverão receber cenário explícito durante o endurecimento do MCF-RUNTIME-006.

A reserva não bloqueia a integração da estabilização.

## 6. Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATION
integracao_tecnica: APROVADA
merge_automatico: NAO
producao: NAO_AUTORIZADA
merge_do_PR_69: SUJEITO_AO_GATE_DE_GOVERNANCA
```
