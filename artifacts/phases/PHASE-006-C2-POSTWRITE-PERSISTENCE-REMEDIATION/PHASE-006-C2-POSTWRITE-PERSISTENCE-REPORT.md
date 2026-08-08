# PHASE-006-C2 — Relatório de remediação pós-write

## Resultado técnico acumulado

O C2 permanece em loop de remediação independente. O P1 original do HEAD `edaef62866aa1ff0af2985bfad20d1fe640c36cd` foi corrigido com estados `EXECUTING`/`UNKNOWN`, separação pré-write/pós-write e preservação de binding em ambiguidade.

A auditoria exata posterior do HEAD `60f069ee829b03cab93e484ef2782e00333c9377` (`PRR_kwDOTnz-ks8AAAABI2moFA`) encontrou dois defeitos adicionais:

1. **P1 — persistência UNKNOWN:** `persistExecution()` não aceitava attempts `UNKNOWN`, impedindo a gravação do estado `RECOVERING`.
2. **P2 — tombstone de fingerprint:** a liberação imediata do binding em `FAILED` permitia que outra missão reutilizasse a mesma chave global com payload incompatível.

## Remediação da rodada 2

### Persistência UNKNOWN

`PostgresMcfRuntimeRepository.persistExecution()` agora aceita `UNKNOWN` entre os estados do attempt que autorizam a persistência governada da missão/fase. O ponteiro `active_external_attempt_id` é limpo quando o estado `RECOVERING` é persistido, enquanto o `idempotency_scope_key` do attempt `UNKNOWN` permanece intacto.

Regressão:
- `postgres-mcf-runtime.unknown-persistence.integration.test.ts`: PASS.

### Tombstone global de fingerprint

A migration `0028_mcf_external_action_prewrite_fingerprint_tombstone.sql` remove a liberação automática do binding no momento de `FAILED`.

O row `FAILED` passa a atuar como tombstone durável de:
- `idempotency_scope_key`;
- `idempotency_fingerprint`.

No trigger de reserva global:
- retry com fingerprint compatível pode liberar o holder `FAILED` imediatamente antes da nova inserção;
- retry incompatível não libera o holder e falha no índice único persistente;
- recovery anterior de `ALLOWED`/`ABANDONED` expirados continua preservado.

Regressão:
- `github-pr-collaboration.global-idempotency.integration.test.ts`: PASS para conflito concorrente, tombstone após `FAILED`, rejeição cross-mission incompatível, retry compatível e novo bloqueio incompatível.

## Implementação validada desta rodada

HEAD: `3f68a97c25af742566e618ae6838d7d3cf4224fd`

CI:
- Documentation validation `31265446519`: PASS.
- Rede Social Container Smoke `31265446518`: PASS.
- Rede Social Foundation `31265446526`: PASS.
- format: PASS.
- lint: PASS.
- typecheck: PASS.
- migrations duas vezes: PASS.
- migration `0028`: PASS.
- 86/86 arquivos de teste: PASS.
- 357/357 testes server: PASS.
- build: PASS.
- Vitest artifact `9024011616`.
- digest `sha256:bbce94334711e2a8d1519c41181e5592d57a4fe777dcbf68d3ac2c1becf21e1b`.

## Histórico de ciclos

1. `edaef628...`: revisão FAIL/P1 pós-write.
2. primeira remediação: falha de formatação.
3. `777f012...`: testes revelaram regressão em adapters somente-leitura.
4. `3fede0da...`: implementação da primeira remediação verde.
5. `74fd45a...`: CI verde, revisão FAIL/P2 de proveniência do checkpoint.
6. `60f069ee...`: checkpoint self-bound + CI verde, revisão FAIL com P1 UNKNOWN persistence e P2 fingerprint tombstone.
7. `3f68a97c...`: segunda remediação funcional verde; checkpoint self-bound a ser revalidado no commit documental seguinte.

## Limites preservados

- real provider write: NOT_AUTHORIZED;
- production: BLOCKED;
- PR #80: deve permanecer DRAFT até gate;
- merge: BLOCKED;
- APPROVE/REQUEST_CHANGES/base/state/force-push/branch-protection: FORBIDDEN.

## Próximo gate

O commit que contiver este PRF será resolvido como `SELF`. Os três workflows e a revisão independente devem apontar para esse mesmo SHA. Somente depois cabe decisão operacional de Léo.
