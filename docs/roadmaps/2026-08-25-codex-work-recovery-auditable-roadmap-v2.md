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
**Última atualização:** `2026-08-25 02:43 BRT`  
**Estado:** `EM_EXECUCAO`  
**Etapa atual:** `R6 — Inventário forense da worktree real do Codex`

> Único roadmap/checklist operacional canônico desta missão. `SUPERSEDED` nunca é fonte de estado corrente.

## Objetivo

Recuperar sem perda o trabalho NextGen interrompido do Codex, preservando bytes/provenance antes de qualquer reconciliação. Antes da recuperação material foram criadas duas skills experimentais de governança: `MCF-FAILURE-AUTOPSY` e `MCF-MISSION-CHECKPOINT`.

## Estado de referência

```yaml
stable_release: v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
main_live_at_r5: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
recovery_branch: mission/codex-work-recovery-20260825
pr_170_live_at_r5: OPEN / merged=false / head=1da1a13bd8ca47bed2f4a4e560e64691788582f8
codex_worktree:
  host: leo-N43SM
  path: /home/leo/Documentos/GitHub/multiagent-collaboration-framework-nextgen-reconciliation-20260824
  branch: docs/mcf-nextgen-reconciliation-f14-plan-20260824
  head: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
last_measured_unstaged_diff: 12 files / +1261 / -213
historical_screenshot_snapshot: 19 files / +1759 / -318
```

## Falhas registradas

- `FALSE_LOCAL_WORKTREE_ACCESS_ASSUMPTION`: sandbox foi confundido com capacidade de host; SentinelX provou acesso ao `leo-N43SM`.
- `TWO_APPARENT_ACTIVE_ROADMAPS`: histórico superseded ficou na superfície ativa; corrigido mantendo uma única fonte canônica.

Histórico: `artifacts/phases/PHASE-01-CODEX-WORK-RECOVERY/history/INITIAL-ROADMAP-SUPERSEDED.md`.

## Regra de auditoria

Toda transição atualiza timestamp, estado, etapa, checklist, log, evidências/SHAs/links e próxima ação antes de ser declarada concluída. Falta de evidência = `NAO_VERIFICADO`.

## Checklist cronológico

### R0 — Descoberta correta de capacidade
`✅ CONCLUÍDO — 01:51`
- [x] release/main/PR relidos;
- [x] branch recovery criada;
- [x] host/worktree/branch/HEAD confirmados.

### R1 — Continuidade auditável
`✅ CONCLUÍDO — 01:52`
- [x] roadmap canônico + log + retomada cross-chat.

### R2 — HUMAN_GATE do checklist
`✅ CONCLUÍDO — 02:23`
- [x] Leandro aprovou `R3 → R4 → R5 → R6`;
- [x] dois-roadmaps corrigido.

### R3 — `MCF-FAILURE-AUTOPSY`
`✅ CONCLUÍDO COM RESSALVA — 02:36`
- [x] TDD RED nos 2 incidentes;
- [x] contrato + `SKILL.md` + registry;
- [x] Beatriz 100/100;
- [x] Emily suficiente;
- [x] Léo aprovou com ressalva.

Evidências: `b75c186c`, `d95e0009`, `c2428c5e`, `b8346432`, `a17ca30a`.

### R4 — `MCF-MISSION-CHECKPOINT`
`✅ CONCLUÍDO COM RESSALVA — 02:41`
- [x] testes + contrato + `SKILL.md` + registry;
- [x] roteamento por trigger phrase nas project instructions;
- [x] main/PR #170 relidos;
- [x] Beatriz 100/100;
- [x] Emily suficiente;
- [x] Léo aprovou com R5 obrigatório.

Evidências: `2d58dad2`, `8ec6075b`, `131347e8`, `c8f6efe8`, `cbadca13`, `2b0837f2`.

### R5 — Validação integrada/cross-chat
`✅ CONCLUÍDO COM RESSALVA — 02:43`
- [x] parser determinístico confirmou triggers/status/roteamento: `6/6 PASS`;
- [x] cold-start estrutural extraiu mission/status/stage/next-action somente do roadmap remoto;
- [x] `docs/roadmaps/` contém uma única fonte desta missão;
- [x] main/PR live relidos;
- [x] worktree Codex permaneceu `12 files / +1261/-213 + untracked`;
- [x] Beatriz: `PASS_WITH_RUNTIME_E2E_LIMITATION`;
- [x] Emily: `EVIDENCE_SUFFICIENT_TO_CONTINUE_RECOVERY`;
- [x] Léo: `APROVAR_CONTINUIDADE_PARA_R6_COM_RESSALVA`.

**Ressalva:** `NEW_CHAT_UI_E2E=NOT_EXECUTED`; skills permanecem `EXPERIMENTAL` até smoke real em nova conversa após integração.

Evidência: `artifacts/phases/PHASE-01-CODEX-WORK-RECOVERY/R5-RECOVERY-SKILLS-CROSS-CHAT-VALIDATION.md` (`d15830f4`).

### R6 — Inventário forense da worktree Codex
`🟡 EM EXECUÇÃO — aberto 02:43`
- [ ] capturar branch/HEAD/remotes/status porcelain v2;
- [ ] capturar diff `HEAD` completo sem editar;
- [ ] inventariar staged/unstaged/untracked separadamente;
- [ ] reconciliar contagem atual com snapshot `19 files`;
- [ ] reconciliar stats com `+1759/-318`;
- [ ] SHA-256 de todos os arquivos do payload;
- [ ] produzir patch binário reproduzível;
- [ ] não executar reset/clean/rebase.

### R7 — Checkpoint remoto forense
`⏳ PLANEJADO`
- [ ] preservar material original em commit separado;
- [ ] publicar/verificar SHA remoto.

### R8 — Reconciliar estado live
`⏳ PLANEJADO`
- [ ] reler main/PRs/Issues;
- [ ] comparar recovery × main;
- [ ] conflitos textuais/semânticos;
- [ ] preservar Q1–Q16/NX.

### R9 — Validação técnica/semântica
`⏳ PLANEJADO`
- [ ] diff check, links, Capsule/recovery, schemas, secret scan;
- [ ] Q13/Q14, Request/Receipt, sidecar, TriView, `state ↔ ledger`;
- [ ] nenhum PASS antigo reutilizado.

### R10 — Auditoria/gate
`⏳ PLANEJADO`
- [ ] Beatriz/Emily/Augusto;
- [ ] Léo;
- [ ] matéria reservada → Leandro.

### R11 — Handoff NextGen
`⏳ PLANEJADO`
- [ ] checkpoint final + pendências + próximo boundary;
- [ ] NX-0 sem autorização implícita;
- [ ] link/retomada cross-chat.

## Contrato de retomada

Novo chat: release → este roadmap → rejeitar superseded → etapa atual + último log → reler live → host/worktree se necessário → próxima checkbox → atualizar roadmap.

## Registro cronológico

```yaml
- {timestamp_brt: '2026-08-25 01:51', stage: R0, result: PASS, action: 'main/PR/worktree verificados'}
- {timestamp_brt: '2026-08-25 01:52', stage: R1, result: PASS, action: 'roadmap auditável criado'}
- {timestamp_brt: '2026-08-25 02:05', stage: R2, result: FAIL, action: 'dois roadmaps aparentes detectados'}
- {timestamp_brt: '2026-08-25 02:12', stage: R2, result: HUMAN_GATE, action: 'reorganização documental aprovada'}
- {timestamp_brt: '2026-08-25 02:15', stage: R2, result: PASS, action: 'fonte canônica única restaurada'}
- {timestamp_brt: '2026-08-25 02:21', stage: R2, result: HUMAN_GATE, action: 'REVISADA recebida; decisão explícita pendente'}
- {timestamp_brt: '2026-08-25 02:23', stage: R2, result: PASS, action: 'APROVO recebido; sequência autorizada'}
- {timestamp_brt: '2026-08-25 02:36', stage: R3, result: PASS, action: 'failure-autopsy implementada/validada como EXPERIMENTAL'}
- {timestamp_brt: '2026-08-25 02:41', stage: R4, result: PASS, action: 'mission-checkpoint implementada/validada como EXPERIMENTAL'}
- {timestamp_brt: '2026-08-25 02:43', stage: R5, result: PASS, action: 'cold-start estrutural PASS; NEW_CHAT_UI_E2E não executado'}
- {timestamp_brt: '2026-08-25 02:43', stage: R6, result: PARTIAL, action: 'inventário forense iniciado', next_action: 'capturar estado byte-exato sem mutação'}
```

## Próxima ação exata

`R6 — CAPTURAR ESTADO GIT COMPLETO + UNTRACKED + HASHES + PATCH SEM MODIFICAR A WORKTREE.`