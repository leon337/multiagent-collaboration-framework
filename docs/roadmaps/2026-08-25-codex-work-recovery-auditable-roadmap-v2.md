# MCF — Roadmap Auditável de Recuperação do Trabalho do Codex (v2)

**Mission ID:** `MCF-20260825-CODEX-WORK-RECOVERY`  
**Phase ID:** `PHASE-01-CODEX-WORK-RECOVERY`  
**Branch:** `mission/codex-work-recovery-20260825`  
**Coordenador:** Mestre  
**Autoridade humana final:** Leandro  
**Autoridade operacional/gate:** Léo  
**Classe:** `B`  
**Fuso:** `America/Recife (BRT, UTC-03)`  
**Criado:** `2026-08-25 01:52 BRT`  
**Última atualização:** `2026-08-28 14:50 BRT`  
**Estado:** `AGUARDANDO_GATE_HUMANO_NEXTGEN`  
**Etapa atual:** `R11 — Handoff NextGen para Leandro`

> Único roadmap/checklist operacional canônico desta missão. `SUPERSEDED` nunca é fonte de estado corrente.

## 1. Objetivo

Recuperar sem perda o trabalho NextGen interrompido do Codex, preservar bytes/provenance, determinar se o payload precisava de integração e devolver a missão ao boundary correto sem reaplicar conteúdo histórico sobre uma `main` mais nova.

Em paralelo, foram criadas duas skills experimentais de governança: `MCF-FAILURE-AUTOPSY` e `MCF-MISSION-CHECKPOINT`.

## 2. Estado live de fechamento

```yaml
stable_release:
  version: v1.3.0
  target_sha: 2a264b283d976bd1b392052fa928d076debfc7fb
main:
  sha: 0b900ee03a05153e2e4a795fce7b457f5b4bb812
recovered_pr:
  number: 183
  branch: docs/mcf-nextgen-reconciliation-f14-plan-20260824
  head_sha: 82520932ae2face4559b8df6d169220111fe6930
  merged: true
post_reconciliation_pr:
  number: 185
  merge_sha: 0b900ee03a05153e2e4a795fce7b457f5b4bb812
  merged: true
concurrent_gate_pr:
  number: 186
  state: OPEN
  purpose: prepare ecosystem and NX-0 human gates; no NextGen runtime execution
nextgen_implementation_authorized: false
```

## 3. Falhas registradas e corrigidas

- `FALSE_LOCAL_WORKTREE_ACCESS_ASSUMPTION`: sandbox foi confundido com capacidade de host; SentinelX provou acesso ao `leo-N43SM`.
- `TWO_APPARENT_ACTIVE_ROADMAPS`: histórico superseded ficou na superfície ativa; corrigido mantendo uma única fonte canônica.

Histórico preservado em `artifacts/phases/PHASE-01-CODEX-WORK-RECOVERY/history/INITIAL-ROADMAP-SUPERSEDED.md`.

## 4. Checklist cronológico

### R0 — Descoberta correta de capacidade
`✅ CONCLUÍDO — 2026-08-25 01:51`

### R1 — Continuidade auditável
`✅ CONCLUÍDO — 2026-08-25 01:52`

### R2 — HUMAN_GATE do checklist
`✅ CONCLUÍDO — 2026-08-25 02:23`
- [x] Leandro aprovou a sequência operacional;
- [x] ambiguidade dos dois roadmaps foi corrigida.

### R3 — `MCF-FAILURE-AUTOPSY`
`✅ CONCLUÍDO COM RESSALVA — 2026-08-25 02:36`
- [x] contrato, `SKILL.md`, registry e testes;
- [x] cenários dos dois incidentes reais;
- [x] skill classificada `EXPERIMENTAL`.

### R4 — `MCF-MISSION-CHECKPOINT`
`✅ CONCLUÍDO COM RESSALVA — 2026-08-25 02:41`
- [x] contrato, `SKILL.md`, registry e testes;
- [x] roteamento por trigger phrase;
- [x] skill classificada `EXPERIMENTAL`.

### R5 — Validação integrada/cross-chat
`✅ CONCLUÍDO COM RESSALVA — 2026-08-25 02:43`
- [x] parser/roteamento `6/6 PASS`;
- [x] cold-start estrutural PASS;
- [x] fonte canônica única confirmada.

**Ressalva:** `NEW_CHAT_UI_E2E=NOT_EXECUTED`; as skills não devem ser promovidas além de `EXPERIMENTAL` sem smoke independente em nova conversa.

### R6 — Inventário forense da worktree Codex
`✅ CONCLUÍDO — 2026-08-28 14:47`
- [x] branch/HEAD/remotes/status capturados;
- [x] staged/unstaged/untracked separados;
- [x] payload final observado: `20 paths`;
- [x] hashes SHA-256 capturados;
- [x] worktree original não foi editada/resetada/limpa/rebaseada;
- [x] snapshot visual histórico classificado como telemetria não diretamente comparável.

### R7 — Checkpoint remoto forense
`✅ CONCLUÍDO POR CHECKPOINT REMOTO EXISTENTE — 2026-08-28 14:47`
- [x] PR #183 usa a mesma branch da worktree recuperada;
- [x] comparação byte a byte contra `PR183_HEAD@82520932...`;
- [x] `20 / 20 MATCH`;
- [x] checkpoint remoto exato já existe;
- [x] TAR redundante descartado para evitar segunda fonte operacional.

**Decisão:** `recovery/codex-nextgen-forensic-20260825` permanece apenas como branch auxiliar histórica; não é fonte canônica e não deve ser integrada.

### R8 — Reconciliar estado live
`✅ CONCLUÍDO — 2026-08-28 14:48`
- [x] release relida: `v1.3.0`;
- [x] `main@0b900ee0...` relida;
- [x] PR #183 confirmada merged;
- [x] PR #185 confirmada merged;
- [x] PR #186 confirmada open/gate-preparation only;
- [x] comparação `82520932..0b900ee0`: `main ahead_by=17`, `behind_by=0`;
- [x] conflitos semânticos avaliados;
- [x] Q1–Q16/NX preservados.

**Classificação:** `HISTORICAL_FORENSIC_PAYLOAD_ALREADY_ABSORBED_AND_RECONCILED`.

**Ação proibida:** reaplicar/cherry-pickar o payload antigo sobre `main`.

### R9 — Validação técnica/semântica fresca
`✅ CONCLUÍDO COM VARIÂNCIA NÃO BLOQUEANTE — 2026-08-28 14:49`

Workspace isolado no `main@0b900ee0...`, Node `24.18.0`, pnpm `11.17.0`.

- [x] dependências instaladas com lockfile congelado;
- [x] testes focados: `43/43 PASS`;
- [x] Prettier: PASS;
- [x] ESLint: PASS;
- [x] typecheck: PASS;
- [x] build: PASS;
- [x] `pnpm audit --prod`: zero vulnerabilidades conhecidas;
- [x] scan dirigido de segredos no delta: zero achados;
- [x] Q13/Q14 presentes;
- [x] Cognitive Execution Request/Receipt presentes;
- [x] Capsule v2 sidecar/version pointer definidos;
- [x] TriView/Mission Control preservados como read models;
- [x] `STATE_TRANSITION_AND_LEDGER_APPEND_ATOMIC_OR_EQUIVALENT` presente;
- [x] dependency/disposition graph preservado;
- [x] `implementation_authorized: false` preservado.

**Variância:** `git diff --check` no intervalo histórico PR183→main sinaliza somente dois `Markdown hard breaks` por dois espaços finais em metadados do protocolo de sucessão. Classificação: `NON_BLOCKING_MARKDOWN_HARD_BREAK_VARIANCE`.

Evidência detalhada: `artifacts/phases/PHASE-01-CODEX-WORK-RECOVERY/R6-R9-RECOVERY-RECONCILIATION-20260828.md`.

### R10 — Auditoria e gate operacional
`✅ CONCLUÍDO — 2026-08-28 14:50`

- [x] Beatriz: `PASS_WITH_NONBLOCKING_DOC_VARIANCE`;
- [x] Emily: `EVIDENCE_SUFFICIENT_TO_CLOSE_RECOVERY_AND_RETURN_TO_HUMAN_GATE`;
- [x] Augusto: `RECOVERY_TRACE_RECONSTRUCTIBLE`;
- [x] Léo: `APPROVE_R11_HANDOFF`;
- [x] nenhuma autorização de implementação NextGen inferida.

### R11 — Handoff NextGen
`🟡 AGUARDANDO GATE HUMANO — 2026-08-28 14:50`

- [x] checkpoint final com branch/SHA/base;
- [x] payload antigo classificado e preservado;
- [x] pendências reais separadas;
- [x] `NX-0` continua sem autorização implícita;
- [x] continuidade cross-chat preservada;
- [ ] decisão explícita de Leandro sobre disposition/F1.4/boundary de implementação.

## 5. Gate humano atual

O roadmap NextGen vigente no `main` mantém:

```yaml
reconciliation: complete_candidate
formal_architecture: complete_candidate_not_approved
implementation_plan: complete_candidate_not_authorized
implementation_authorized: false
recommended_first_boundary: NX-0_CONTRACTS_AND_CONFORMANCE
```

Sem decisão explícita, todos os work packages NX permanecem `NO_GO`.

Decisões separadas reservadas a Leandro:

1. aprovar ou corrigir a disposition Q1–Q16;
2. aprovar ou corrigir a arquitetura formal F1.4;
3. autorizar, se desejar, somente o boundary `NX-0_CONTRACTS_AND_CONFORMANCE`;
4. manter fechados os demais efeitos/runtime/providers/VPS/produção até gates futuros específicos.

## 6. Registro cronológico final

```yaml
- {timestamp_brt: '2026-08-25 01:51', stage: R0, result: PASS, action: 'main/PR/worktree verificados'}
- {timestamp_brt: '2026-08-25 01:52', stage: R1, result: PASS, action: 'roadmap auditável criado'}
- {timestamp_brt: '2026-08-25 02:23', stage: R2, result: PASS, action: 'checklist aprovado por Leandro'}
- {timestamp_brt: '2026-08-25 02:36', stage: R3, result: PASS_WITH_RESTRICTION, action: 'failure-autopsy EXPERIMENTAL'}
- {timestamp_brt: '2026-08-25 02:41', stage: R4, result: PASS_WITH_RESTRICTION, action: 'mission-checkpoint EXPERIMENTAL'}
- {timestamp_brt: '2026-08-25 02:43', stage: R5, result: PASS_WITH_RESTRICTION, action: 'cross-chat estrutural validado; UI E2E pendente'}
- {timestamp_brt: '2026-08-28 14:47', stage: R6, result: PASS, action: 'payload forense 20 paths inventariado'}
- {timestamp_brt: '2026-08-28 14:47', stage: R7, result: PASS, action: '20/20 bytes iguais ao HEAD remoto da PR #183'}
- {timestamp_brt: '2026-08-28 14:48', stage: R8, result: PASS, action: 'main 17 commits à frente; payload já absorvido/reconciliado'}
- {timestamp_brt: '2026-08-28 14:49', stage: R9, result: PASS_WITH_NONBLOCKING_VARIANCE, action: '43/43 + format/lint/typecheck/build/audit PASS'}
- {timestamp_brt: '2026-08-28 14:50', stage: R10, result: PASS, action: 'auditoria operacional aprova handoff sem autorização NX'}
- {timestamp_brt: '2026-08-28 14:50', stage: R11, result: HUMAN_GATE, action: 'recuperação concluída; NextGen retorna a Leandro'}
```

## 7. Próxima ação exata

`AGUARDAR DECISÃO EXPLÍCITA DE LEANDRO SOBRE Q1–Q16, F1.4 E EVENTUAL AUTORIZAÇÃO DO BOUNDARY NX-0.`
