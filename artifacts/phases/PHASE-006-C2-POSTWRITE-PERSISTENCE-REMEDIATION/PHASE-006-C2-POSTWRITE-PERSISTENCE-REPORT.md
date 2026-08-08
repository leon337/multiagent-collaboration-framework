# PHASE-006-C2 — Relatório de remediação pós-write

## Resultado técnico

O P1 identificado no HEAD `edaef62866aa1ff0af2985bfad20d1fe640c36cd` foi remediado no branch do PR #80. A implementação validada está em `3fede0da1e5d50b2a339b5c2dc88bd5036753b6e`.

A correção impede que um receipt já retornado pelo adapter seja reclassificado como falha pré-write quando `recordExecuted()` falha. O dispatcher retorna `UNKNOWN`, tenta persistir `recordUnknown()` e nunca chama `recordFailed()` nesse caminho.

## Mudanças funcionais

1. `ExternalActionDispatchResult` ganhou estado `UNKNOWN`.
2. O ledger ganhou estados `EXECUTING` e `UNKNOWN`.
3. O adapter C2 mutante persiste `EXECUTING` antes de `adapter.execute()`.
4. Receipt `PARTIAL` é persistido como `UNKNOWN`.
5. Falha de `recordExecuted()` após receipt retorna `UNKNOWN`, com retry automático bloqueado.
6. Expiração de `EXECUTING` converte o attempt para `UNKNOWN` e preserva `idempotency_scope_key`.
7. Migration `0027_mcf_external_action_unknown_state.sql` formaliza os novos estados.
8. `SkillExecutor` propaga `UNKNOWN` como recuperação com evidência pendente.
9. A barreira `EXECUTING` foi restringida ao adapter `github-pr-collaboration-write-v1`, preservando compatibilidade com adapters somente-leitura.

## Testes adicionados

- `external-action-dispatcher.postwrite-persistence.test.ts`: 4 regressões.
- `external-action-postwrite-unknown.integration.test.ts`: 1 integração de expiração/binding.

## Ciclos CAF observados

### Ciclo 1 — P1 capturado

Entrada: revisão independente do HEAD `edaef628...`.

Efeito verificado: `adapter.execute()` e `recordExecuted()` compartilhavam o mesmo `try/catch`; uma falha local posterior ao receipt podia seguir para `recordFailed()`.

Decisão: `REMEDIATION_REQUIRED`; merge permaneceu bloqueado.

### Ciclo 2 — primeira remediação e falha de formatação

Foram introduzidos `EXECUTING`, `UNKNOWN`, migration 0027 e testes. A Foundation `31263130473` falhou no gate de formatação antes de lint/typecheck/testes.

Recuperação: capturado o diff exato do Prettier sem alterar semântica.

### Ciclo 3 — formatação corrigida e regressão de compatibilidade

No HEAD `777f012f8dbd6702b420ad41909beeac41637d00`, formatação, lint, typecheck e migrations passaram, mas a Foundation `31263571041` encontrou três falhas em testes antigos porque `recordExecuting()` havia sido aplicado também a adapters somente-leitura.

Recuperação: a barreira durável foi limitada ao adapter C2 mutante, sem remover a proteção pós-write genérica.

### Ciclo 4 — implementação validada

HEAD: `3fede0da1e5d50b2a339b5c2dc88bd5036753b6e`.

- Documentation validation `31263689993`: PASS.
- Rede Social Container Smoke `31263690012`: PASS.
- Rede Social Foundation `31263689966`: PASS.
- 85/85 arquivos e 356/356 testes: PASS.
- migration 0027 duas vezes: PASS.
- build: PASS.
- Vitest artifact `9023511453`.
- digest `sha256:1d5c3d85e2d607f2cabb217b8cc7c85c920afb0391dd9976209efb13638d772a`.

### Ciclo 5 — candidato documental auditado e P2 de proveniência

HEAD auditado: `74fd45a57067eab5d0a61bfc91d1869249eee262`.

CI do mesmo HEAD:
- Documentation validation `31264072381`: PASS.
- Rede Social Container Smoke `31264072373`: PASS.
- Rede Social Foundation `31264072380`: PASS.
- Vitest artifact `9023622705`.
- digest `sha256:28f5e954dfb7cfc032f9e8231fb606173ceb546b5e824c1cfcdfaecea9ae89aa`.

Revisão independente `PRR_kwDOTnz-ks8AAAABI2lSrg`: `FAIL` por um P2 de consistência documental. O checkpoint ainda apontava para os runs da implementação e marcava o gate final como pendente.

Remediação: a proveniência final deixa de hardcodar um “HEAD final” que muda ao editar o próprio checkpoint. O gate passa a se vincular ao `SELF`, definido como o Git commit que contém o checkpoint, e exige externamente os três workflows e a revisão independente para esse mesmo SHA.

## Limites preservados

- provider real C2: NOT_AUTHORIZED;
- production: BLOCKED;
- PR #80: DRAFT;
- merge: não executado;
- operações proibidas do C2: inalteradas.

## Relação com a recuperação de conformidade

O PRF em `PHASE-006-C2-CONFORMANCE-RECOVERY` permanece histórico e não é reescrito. Ele documenta a recuperação de processo até o retorno ao gate. Esta fase posterior documenta a correção funcional exigida pelo P1 e a remediação documental exigida pelo P2 subsequente.

## Estado

A implementação funcional está tecnicamente validada. O próximo gate é avaliar CI e revisão independente no próprio Git HEAD que contém o checkpoint self-bound; somente depois cabe decisão de Léo.
