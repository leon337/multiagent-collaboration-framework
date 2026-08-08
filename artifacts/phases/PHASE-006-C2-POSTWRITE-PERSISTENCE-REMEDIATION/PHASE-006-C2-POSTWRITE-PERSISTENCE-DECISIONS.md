# PHASE-006-C2 — Decisões da remediação pós-write

## D1 — P1 original bloqueante

A revisão de `edaef628...` foi aceita como `REMEDIATION_REQUIRED`. `recordExecuted()` após receipt não pode cair em `recordFailed()`.

## D2 — Estados de execução

O C2 usa `ALLOWED → EXECUTING → EXECUTED|UNKNOWN|FAILED`, com `UNKNOWN` para efeito possivelmente aplicado e `FAILED` somente para efeito definitivamente não aplicado.

## D3 — Expiração pós-início

`EXECUTING` expirado vira `UNKNOWN` e mantém o binding. `ALLOWED` expirado pode seguir recovery pré-write.

## D4 — Compatibilidade de adapters

A barreira `EXECUTING` é exigida no adapter mutante C2; adapters somente-leitura preservam o fluxo anterior.

## D5 — Proveniência self-bound

Após o P2 do HEAD `74fd45a...`, o checkpoint não hardcoda um “HEAD final” futuro. `SELF` significa o Git commit que contém o checkpoint; CI e review são avaliados externamente para esse mesmo SHA.

## D6 — Aceitar segunda auditoria como FAIL

A revisão `PRR_kwDOTnz-ks8AAAABI2moFA` do HEAD `60f069ee...` encontrou:
- P1: `UNKNOWN` não passava por `persistExecution()`;
- P2: `FAILED` liberava a chave global e perdia proteção de fingerprint entre missões.

O gate permaneceu fechado.

## D7 — Persistir UNKNOWN no runtime

`PostgresMcfRuntimeRepository.persistExecution()` passa a aceitar `UNKNOWN` como attempt compatível com a persistência de missão/fase `RECOVERING`. O ponteiro ativo da missão é limpo, mas o binding global do attempt permanece.

## D8 — Tombstone de fingerprint para falha pré-write

A migration `0028_mcf_external_action_prewrite_fingerprint_tombstone.sql` remove a liberação imediata de binding em `FAILED`.

O holder `FAILED` preserva `idempotency_scope_key` + `idempotency_fingerprint`. Somente uma nova inserção com fingerprint compatível pode liberar o tombstone imediatamente antes de assumir o mesmo scope. Payload incompatível permanece bloqueado pelo índice único.

## D9 — Recovery legítimo continua permitido

A correção não converte falha pré-write em binding eterno: retry canonicamente idêntico pode substituir o tombstone. O teste global cobre explicitamente essa transição.

## D10 — Evidência da rodada 2

HEAD `3f68a97c25af742566e618ae6838d7d3cf4224fd`:
- três workflows PASS;
- migration 0028 aplicada duas vezes;
- 86/86 arquivos e 357/357 testes PASS;
- build PASS;
- artifact `9024011616`, digest `sha256:bbce94334711e2a8d1519c41181e5592d57a4fe777dcbf68d3ac2c1becf21e1b`.

## D11 — Limites

Real provider write, production e merge permanecem bloqueados. O PR permanece draft até o gate independente.

## D12 — Próxima decisão

Após CI e revisão independente do novo HEAD self-bound, Léo aplica o gate. Nenhum PASS é presumido antes disso.
