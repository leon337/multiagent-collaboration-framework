# R6–R9 — Evidência de recuperação e reconciliação do trabalho do Codex

**Mission:** `MCF-20260825-CODEX-WORK-RECOVERY`  
**Data:** `2026-08-28`  
**Fuso:** `America/Recife (BRT, UTC-03)`  
**Executor:** MESTRE com execução por papéis MCF na mesma sessão  
**Autoridade humana:** LEANDRO

## 1. Fonte forense original

Worktree preservada:

```text
host: leo-N43SM
path: /home/leo/Documentos/GitHub/multiagent-collaboration-framework-nextgen-reconciliation-20260824
branch: docs/mcf-nextgen-reconciliation-f14-plan-20260824
base HEAD: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
```

Nenhum `reset`, `clean`, `rebase`, checkout destrutivo ou edição de payload foi executado durante a recuperação.

## 2. Fechamento R6 — inventário forense

O payload observado contém:

```text
tracked paths: 12
untracked artifact paths: 8
payload final observado: 20 paths
```

O estado Git histórico possuía camadas staged/unstaged diferentes; portanto o card visual antigo `19 files / +1759/-318` não foi forçado a coincidir com a árvore final. Essa telemetria histórica permanece classificada como `HISTORICAL_UI_TELEMETRY_NOT_DIRECTLY_COMPARABLE`.

## 3. Fechamento R7 — checkpoint remoto já existente

A PR #183 utilizou a mesma branch nominal da worktree:

```text
PR: #183
head branch: docs/mcf-nextgen-reconciliation-f14-plan-20260824
head SHA: 82520932ae2face4559b8df6d169220111fe6930
merge SHA: fb237d1875d0f72fecc2f87a4641e06086195998
```

Foi realizada comparação byte a byte dos 20 arquivos locais recuperados contra os mesmos paths em `82520932ae2face4559b8df6d169220111fe6930`.

Resultado:

```text
20 / 20 MATCH
```

Todos os SHA-256 locais coincidiram individualmente com os bytes do HEAD remoto da PR #183.

**Decisão:** o checkpoint remoto forense já existe no Git. Não publicar TAR redundante e não criar segundo payload operacional. A branch auxiliar `recovery/codex-nextgen-forensic-20260825`, criada anteriormente a partir do HEAD-base, não é necessária para integração e não deve ser tratada como fonte canônica.

## 4. Fechamento R8 — reconciliação com estado live

Estado live relido em 2026-08-28:

```text
stable release: v1.3.0
release target: 2a264b283d976bd1b392052fa928d076debfc7fb
main: 0b900ee03a05153e2e4a795fce7b457f5b4bb812
PR #185: merged
PR #186: open, gate-preparation only
```

Comparação `PR183_HEAD..main`:

```text
base: 82520932ae2face4559b8df6d169220111fe6930
head: 0b900ee03a05153e2e4a795fce7b457f5b4bb812
status: ahead
main ahead_by: 17
main behind_by: 0
```

Os commits posteriores evoluíram Human Control, sucessão cross-chat e documentação NextGen. A PR #185 reconciliou explicitamente os artefatos NextGen após as PRs #180/#184.

**Classificação:** `HISTORICAL_FORENSIC_PAYLOAD_ALREADY_ABSORBED_AND_RECONCILED`.

**Ação proibida:** cherry-pick/reaplicação do payload antigo sobre `main`, pois produziria risco de regressão e sobrescrita de reconciliações posteriores.

## 5. Fechamento R9 — validação fresca do main exato

Workspace isolado:

```text
/tmp/mcf-recovery-validation-20260828
HEAD = 0b900ee03a05153e2e4a795fce7b457f5b4bb812
Node = v24.18.0
pnpm = 11.17.0
```

Dependências instaladas com `pnpm install --frozen-lockfile --prefer-offline`.

### Testes focados frescos

```text
context-recovery.service.test.ts       25 PASS
mcf-context-fixtures.test.ts            3 PASS
human-control-policy.test.ts           10 PASS
chat-runtime-bridge.service.test.ts     5 PASS
----------------------------------------------
TOTAL                                  43 PASS / 0 FAIL
```

### Qualidade/build frescos

```text
prettier --check: PASS
eslint: PASS
typecheck: PASS
build packages/server/web/worker: PASS
pnpm audit --prod --audit-level high: No known vulnerabilities found
scan dirigido de segredos no delta PR183..main: nenhum achado
```

### `git diff --check`

A comparação histórica `82520932..0b900ee0` sinalizou somente dois finais de linha com dois espaços em:

```text
docs/protocols/MCF-PROTOCOLO-SUCESSAO-CROSS-CHAT-E-CONTROLE-DE-JANELAS.md
```

São linhas de metadados Markdown usando o padrão `dois espaços = hard line break` (`Classificação` e `Estado`). Não há erro de runtime associado. Classificação: `NON_BLOCKING_MARKDOWN_HARD_BREAK_VARIANCE`.

### Invariantes semânticos verificados no main atual

Presentes na arquitetura/plano vigentes:

- `STATE_TRANSITION_AND_LEDGER_APPEND_ATOMIC_OR_EQUIVALENT`;
- dependency/disposition graph Q15;
- Cognitive Execution Request/Receipt;
- Q13 com Evaluation Contract predeclarado;
- Q14 com Portability Matrix/Receipt;
- Capsule v2 sidecar + version pointer preservando v1;
- TriView/Mission Control como read models, sem autoridade própria;
- `implementation_authorized: false`;
- `NX-0_CONTRACTS_AND_CONFORMANCE` como primeiro boundary recomendado somente após gate humano.

## 6. Vereditos por papel

### Beatriz — qualidade

`PASS_WITH_NONBLOCKING_DOC_VARIANCE`.

### Emily — auditoria

`EVIDENCE_SUFFICIENT_TO_CLOSE_RECOVERY_AND_RETURN_TO_HUMAN_GATE`.

### Augusto — trace

`RECOVERY_TRACE_RECONSTRUCTIBLE`; o checkpoint remoto existente elimina dependência da worktree local para continuidade.

### Léo — gate operacional

`APPROVE_R11_HANDOFF`; não autoriza implementation boundary NextGen.

## 7. Decisão final desta evidência

```yaml
R6: CLOSED
R7: CLOSED_BY_EXISTING_EXACT_REMOTE_CHECKPOINT
R8: CLOSED_NO_REAPPLY
R9: CLOSED_PASS_WITH_NONBLOCKING_DOC_VARIANCE
next_stage: R10_R11_CLOSEOUT_AND_HUMAN_GATE
nextgen_implementation_authorized: false
```

A recuperação material não exige nova publicação do payload. O próximo boundary pertence à governança NextGen e depende de decisão explícita de LEANDRO.