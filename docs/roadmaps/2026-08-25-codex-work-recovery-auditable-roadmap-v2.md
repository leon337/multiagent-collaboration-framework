# MCF — Roadmap Auditável de Recuperação do Trabalho do Codex (v2)

**Mission ID:** `MCF-20260825-CODEX-WORK-RECOVERY`  
**Phase ID:** `PHASE-01-CODEX-WORK-RECOVERY`  
**Branch:** `mission/codex-work-recovery-20260825`  
**Coordenador:** Mestre  
**Autoridade humana final:** Leandro  
**Autoridade operacional/gate:** Léo  
**Classe de risco:** `B`  
**Fuso canônico:** `America/Recife (BRT, UTC-03)`  
**Criado em:** `2026-08-25 01:52 BRT`  
**Última atualização:** `2026-08-25 02:41 BRT`  
**Estado:** `EM_EXECUCAO`  
**Etapa atual:** `R5 — Validar skills e continuidade cross-chat`

> Este é o **único roadmap/checklist operacional canônico** desta missão. Documentos marcados `SUPERSEDED` não podem ser usados como fonte de estado corrente.

## 1. Objetivo

Recuperar, preservar, auditar e devolver continuidade ao trabalho NextGen produzido pelo Codex na worktree local interrompida, sem perda, sem reconstrução por aproximação e sem misturar o conteúdo original com correções posteriores.

Antes da recuperação material, criar e validar:

1. `MCF-FAILURE-AUTOPSY` — autópsia auditável de falha por frase curta;
2. `MCF-MISSION-CHECKPOINT` — status/checkpoint auditável por frase curta.

## 2. Estado verificável de referência

```yaml
stable_release: v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
main_live_2026_08_25_02_40: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
recovery_branch: mission/codex-work-recovery-20260825
recovery_branch_head_at_r4_test: c8f6efe837be0ff1f5818fc8a4a33cb23ae67e21
pr_170_live_2026_08_25_02_40:
  state: OPEN
  merged: false
  head: 1da1a13bd8ca47bed2f4a4e560e64691788582f8
codex_worktree:
  host: leo-N43SM
  access: VERIFIED
  path: /home/leo/Documentos/GitHub/multiagent-collaboration-framework-nextgen-reconciliation-20260824
  branch: docs/mcf-nextgen-reconciliation-f14-plan-20260824
  head: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
  measured_at_2026_08_25_02_41: 12 tracked files / +1261 / -213 + untracked PHASE-NEXTGEN-RECONCILIATION-F14-001/
historical_screenshot_snapshot: 19 files / +1759 / -318
```

## 3. Falhas de governança registradas

- `FALSE_LOCAL_WORKTREE_ACCESS_ASSUMPTION`: ausência no sandbox foi confundida com ausência de acesso ao host. Regra: descobrir ferramentas/conectores/hosts antes de declarar incapacidade.
- `TWO_APPARENT_ACTIVE_ROADMAPS`: histórico superseded ficou na superfície ativa. Regra: preservar histórico não pode criar segunda fonte canônica aparente.

Evidência histórica: `artifacts/phases/PHASE-01-CODEX-WORK-RECOVERY/history/INITIAL-ROADMAP-SUPERSEDED.md`.

## 4. Regra de atualização cronológica

A cada avanço, correção, blocker ou gate, atualizar antes de declarar transição concluída: timestamp, estado, etapa, checkboxes, registro, evidências/SHAs/links e próxima ação.

Falta de evidência = `NAO_VERIFICADO`. Não inventar cadeia privada token a token; usar somente fatos, premissas observáveis, ferramentas, omissões, decisões e causalidade suportada.

## 5. Checklist cronológico mestre

### R0 — Contenção e descoberta correta de capacidade
**Status:** `✅ CONCLUÍDO` — `2026-08-25 01:51 BRT`
- [x] release/main/PR consultados;
- [x] branch de recovery criada;
- [x] `leo-N43SM` + worktree/branch/HEAD confirmados;
- [x] falsa limitação registrada.

### R1 — Continuidade auditável
**Status:** `✅ CONCLUÍDO` — `2026-08-25 01:52 BRT`
- [x] roadmap canônico/timestamps/log/retomada cross-chat definidos;
- [x] duas skills adicionadas ao plano.

### R2 — HUMAN_GATE: revisão do checklist
**Status:** `✅ CONCLUÍDO` — `2026-08-25 02:23 BRT`
- [x] Leandro revisou e aprovou `R3 → R4 → R5 → R6`;
- [x] ambiguidade de dois roadmaps corrigida.

### R3 — `MCF-FAILURE-AUTOPSY`
**Status:** `✅ CONCLUÍDO COM RESSALVA` — `2026-08-25 02:36 BRT`
- [x] owners Augusto/Beatriz; suporte Emily/Patricia/Mestre;
- [x] baseline TDD RED criado antes do contrato;
- [x] contrato `skills/contracts/MCF-FAILURE-AUTOPSY.yaml`;
- [x] guia `skills/mcf-failure-autopsy/SKILL.md`;
- [x] registro `EXPERIMENTAL` em `skills/registry.yaml`;
- [x] duas falhas reais reavaliadas;
- [x] Beatriz `100/100`;
- [x] Emily `SUFICIENTE_PARA_GATE_INTERNO_R3`;
- [x] Léo `APROVAR_COM_RESSALVA`.

**Ressalva:** skill de governança/orquestração; não alegar integração ao `McfExecutableSkillId`/`SkillExecutor`.

### R4 — `MCF-MISSION-CHECKPOINT`
**Status:** `✅ CONCLUÍDO COM RESSALVA` — `2026-08-25 02:41 BRT`
- [x] owners Mestre/Miriam/Augusto; suporte Gabriel/Emily;
- [x] testes escritos antes do contrato;
- [x] contrato `skills/contracts/MCF-MISSION-CHECKPOINT.yaml`;
- [x] guia `skills/mcf-mission-checkpoint/SKILL.md`;
- [x] registro `EXPERIMENTAL` em `skills/registry.yaml`;
- [x] `SUPERSEDED` rejeitado para estado corrente;
- [x] staleness/`NAO_VERIFICADO` obrigatório quando live não puder ser relido;
- [x] branch/SHA/PR/link/próxima ação fazem parte do output;
- [x] `project-instructions/MCF-CHATGPT-PROJECT-INSTRUCTIONS.txt` atualizado para roteamento por trigger phrase sem reexplicação longa;
- [x] `main` e PR #170 relidos live no teste;
- [x] Beatriz `100/100`;
- [x] Emily `SUFICIENTE_PARA_GATE_INTERNO_R4`;
- [x] Léo `APROVAR_COM_RESSALVA`.

**Evidências R4:** `2d58dad2`, `8ec6075b`, `131347e8`, `c8f6efe8`, `cbadca13`, `2b0837f2`.

**Ressalva:** prova de um novo chat realmente independente pertence a R5; não simular como runtime real.

### R5 — Validar skills e continuidade cross-chat
**Status:** `🟡 EM EXECUÇÃO` — aberto `2026-08-25 02:41 BRT`
- [ ] validar gatilhos curtos no registry/instruções;
- [ ] validar erro de ferramenta semelhante ao ocorrido;
- [ ] validar duas fontes documentais aparentes;
- [ ] validar missão interrompida;
- [ ] validar cold-start sem depender do histórico da conversa;
- [ ] validar estado live mudou / staleness;
- [ ] validar blocker externo;
- [ ] validar afirmação sem evidência;
- [ ] validar link + próxima ação;
- [ ] validar rejeição de `SUPERSEDED`;
- [ ] registrar limite: sessão nova real não pode ser aberta por esta sessão;
- [ ] auditoria e gate de Léo.

### R6 — Inventário forense da worktree Codex
**Status:** `⏳ PLANEJADO`
- [ ] branch/HEAD/remotes/status porcelain;
- [ ] diff tracked completo sem editar;
- [ ] inventário untracked;
- [ ] reconciliar `12 tracked + untracked` ↔ `19 files` histórico;
- [ ] reconciliar `+1261/-213` ↔ `+1759/-318`;
- [ ] SHA-256 e patch/binário;
- [ ] nenhum reset/clean/rebase.

### R7 — Checkpoint remoto forense
**Status:** `⏳ PLANEJADO`
- [ ] preservar conteúdo original;
- [ ] commit separado de recovery;
- [ ] publicar/verificar SHA remoto.

### R8 — Reconciliar estado live
**Status:** `⏳ PLANEJADO`
- [ ] reler `main`/PRs/Issues;
- [ ] comparar recovery × main;
- [ ] conflitos textuais/semânticos;
- [ ] preservar Q1–Q16 e NX boundaries.

### R9 — Validação técnica/semântica
**Status:** `⏳ PLANEJADO`
- [ ] diff check, links, Capsule/recovery;
- [ ] schemas/contratos, secret scan, Q13/Q14;
- [ ] Request/Receipt, sidecar/pointers, TriView;
- [ ] `state ↔ ledger` classificado;
- [ ] nenhum PASS antigo reutilizado.

### R10 — Auditoria e gate operacional
**Status:** `⏳ PLANEJADO`
- [ ] Beatriz, Emily, Augusto;
- [ ] Léo decide continuidade;
- [ ] matéria reservada volta a Leandro.

### R11 — Handoff para NextGen
**Status:** `⏳ PLANEJADO`
- [ ] checkpoint final branch/SHA/base;
- [ ] pendências/próximo boundary;
- [ ] NX-0 sem autorização implícita;
- [ ] link e retomada cross-chat.

## 6. Contrato de retomada em outro chat

1. consultar release vigente;
2. abrir este roadmap;
3. rejeitar `SUPERSEDED`;
4. ler etapa atual + último registro;
5. reler estados live mutáveis;
6. verificar host/worktree se aplicável;
7. continuar da próxima checkbox;
8. atualizar roadmap antes de declarar avanço.

## 7. Registro cronológico auditável

```yaml
- timestamp_brt: 2026-08-25 01:50
  stage: R0
  actor: Mestre
  action: Confirmou release v1.1.0.
  result: PASS
  next_action: verificar estado live e fonte local

- timestamp_brt: 2026-08-25 01:51
  stage: R0
  actor: Mestre/Gabriel
  action: Confirmou main, PR concorrente e worktree via leo-N43SM.
  evidence: [main@85ccf418, PR#170@1da1a13, worktree@85ccf418]
  result: PASS
  next_action: continuidade auditável

- timestamp_brt: 2026-08-25 01:52
  stage: R1
  actor: Mestre
  action: Criou roadmap auditável e definiu duas skills.
  result: PASS
  next_action: revisão humana

- timestamp_brt: 2026-08-25 02:05
  stage: R2
  actor: Leandro/Mestre
  action: Detectada ambiguidade de dois roadmaps.
  result: FAIL
  next_action: fonte canônica única

- timestamp_brt: 2026-08-25 02:12
  stage: R2
  actor: Leandro
  action: Aprovou reorganização documental.
  result: HUMAN_GATE
  next_action: corrigir

- timestamp_brt: 2026-08-25 02:15
  stage: R2
  actor: Mestre/Emily
  action: Superseded retirado da área ativa e preservado em history.
  result: PASS
  next_action: concluir revisão

- timestamp_brt: 2026-08-25 02:21
  stage: R2
  actor: Leandro/Mestre
  action: REVISADA recebida; gate mantido por faltar decisão explícita.
  result: HUMAN_GATE
  next_action: APROVO ou correções

- timestamp_brt: 2026-08-25 02:23
  stage: R2
  actor: Leandro
  action: Aprovou checklist e sequência R3→R4→R5→R6.
  result: PASS
  next_action: R3

- timestamp_brt: 2026-08-25 02:36
  stage: R3
  actor: Augusto/Beatriz/Emily/Léo
  action: MCF-FAILURE-AUTOPSY implementada como governança EXPERIMENTAL e validada nos dois baselines.
  evidence: [b75c186c, d95e0009, c2428c5e, b8346432, a17ca30a]
  result: PASS
  next_action: R4

- timestamp_brt: 2026-08-25 02:41
  stage: R4
  actor: Mestre/Miriam/Augusto/Gabriel/Beatriz/Emily/Léo
  action: MCF-MISSION-CHECKPOINT implementada como governança EXPERIMENTAL; roteamento por gatilho curto adicionado; estado live relido.
  evidence: [2d58dad2, 8ec6075b, 131347e8, c8f6efe8, cbadca13, 2b0837f2, main@85ccf418, PR#170@1da1a13]
  result: PASS
  next_action: R5
```

## 8. Próxima ação exata

`EXECUTAR R5 — validação integrada/cold-start das duas skills, registrando explicitamente o que não pode ser provado por uma sessão independente.`

R5 não autoriza tocar a worktree do Codex, `main`, VPS ou produção.