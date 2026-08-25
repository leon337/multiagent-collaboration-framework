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
**Última atualização:** `2026-08-25 02:23 BRT`  
**Estado:** `EM_EXECUCAO`  
**Etapa atual:** `R3 — Skill 1: Autópsia de falha do agente`

> Este é o **único roadmap/checklist operacional canônico** desta missão. Documentos marcados `SUPERSEDED` não podem ser usados como fonte de estado corrente.

## 1. Objetivo

Recuperar, preservar, auditar e devolver continuidade ao trabalho NextGen produzido pelo Codex na worktree local interrompida, sem perda, sem reconstrução por aproximação e sem misturar o conteúdo original com correções posteriores.

Antes da recuperação material, criar e validar duas melhorias permanentes de governança:

1. `MCF-FAILURE-AUTOPSY` — autópsia de falha do agente por frase curta;
2. `MCF-MISSION-CHECKPOINT` — apresentação auditável do status/checkpoint da missão por frase curta.

## 2. Estado verificável de referência

```yaml
stable_release: v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
main_last_verified: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
recovery_branch: mission/codex-work-recovery-20260825
concurrent_pr_170:
  state_last_verified: OPEN
  merged_last_verified: false
  head_last_verified: 1da1a13bd8ca47bed2f4a4e560e64691788582f8
codex_worktree:
  host: leo-N43SM
  access: VERIFIED
  path: /home/leo/Documentos/GitHub/multiagent-collaboration-framework-nextgen-reconciliation-20260824
  branch: docs/mcf-nextgen-reconciliation-f14-plan-20260824
  head: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
current_measured_tracked_diff: 12 files / +1261 / -213
untracked_root: artifacts/phases/PHASE-NEXTGEN-RECONCILIATION-F14-001/
historical_screenshot_snapshot: 19 files / +1759 / -318
```

O snapshot histórico deve ser reconciliado em R6; diferença de contagem não é automaticamente erro.

## 3. Falhas de governança já registradas

### `FALSE_LOCAL_WORKTREE_ACCESS_ASSUMPTION`

A sessão confundiu ausência de `/home/leo` no sandbox com incapacidade de acesso ao host conectado. O acesso via SentinelX ao `leo-N43SM` foi depois verificado. Regra derivada: **ausência no sandbox não prova ausência de capacidade; descobrir conectores/hosts antes de declarar inacessibilidade**.

### `TWO_APPARENT_ACTIVE_ROADMAPS`

O roadmap inicial com premissa falsa permaneceu ao lado do roadmap corrigido em `docs/roadmaps/`, criando duas fontes operacionais aparentes. Após autorização de Leandro, o antigo foi retirado da área ativa e preservado em:

`artifacts/phases/PHASE-01-CODEX-WORK-RECOVERY/history/INITIAL-ROADMAP-SUPERSEDED.md`

Regra derivada: **preservar histórico não pode criar uma segunda fonte canônica aparente**.

## 4. Regra obrigatória de atualização cronológica

A cada avanço, retorno de correção, blocker ou gate, atualizar antes de declarar a transição concluída:

- `Última atualização`;
- `Estado`;
- `Etapa atual`;
- status/checks da etapa;
- registro cronológico;
- evidências/SHAs/links;
- próxima ação exata.

Formato:

```yaml
- timestamp_brt: YYYY-MM-DD HH:MM
  stage: Rn
  actor: <papel>
  action: <ação objetiva>
  evidence: [<referências>]
  result: PASS | FAIL | BLOCKED | PARTIAL | HUMAN_GATE
  next_action: <passo seguinte>
```

Falta de evidência = `NÃO_VERIFICADO`. Não expor nem inventar raciocínio privado token a token; expor fatos, premissas observáveis, decisões, ferramentas, omissões, causalidade suportada e limitações.

## 5. Checklist cronológico mestre

### R0 — Contenção e descoberta correta de capacidade
**Status:** `✅ CONCLUÍDO` — `2026-08-25 01:51 BRT`
- [x] release vigente consultada;
- [x] `main` live consultado;
- [x] branch de recovery criada;
- [x] hosts conectados descobertos;
- [x] `leo-N43SM` confirmado;
- [x] worktree, branch e HEAD do Codex confirmados;
- [x] falsa limitação de acesso registrada.

### R1 — Continuidade auditável
**Status:** `✅ CONCLUÍDO` — `2026-08-25 01:52 BRT`
- [x] roadmap canônico criado;
- [x] timestamp por transição definido;
- [x] etapa atual única definida;
- [x] log cronológico definido;
- [x] retomada cross-chat definida;
- [x] duas skills incluídas no roadmap.

### R2 — HUMAN_GATE: revisão do checklist
**Status:** `✅ CONCLUÍDO` — fechado `2026-08-25 02:23 BRT`
- [x] Leandro revisou o checklist;
- [x] ambiguidade dos dois roadmaps corrigida;
- [x] Leandro aprovou explicitamente a sequência;
- [x] sequência autorizada: `R3 → R4 → R5 → R6`.

### R3 — `MCF-FAILURE-AUTOPSY`
**Status:** `🟡 EM EXECUÇÃO` — aberto `2026-08-25 02:23 BRT`
- [ ] definir contrato e owners;
- [ ] registrar no `skills/registry.yaml`;
- [ ] criar contrato versionado e guia da skill;
- [ ] exigir reconstrução auditável: objetivo → fatos/evidências → premissas → ferramentas disponíveis/usadas/omitidas → decisão incorreta → regra violada → impacto → caminho correto → prevenção;
- [ ] proibir invenção de cadeia privada/token a token;
- [ ] testar `FALSE_LOCAL_WORKTREE_ACCESS_ASSUMPTION`;
- [ ] testar `TWO_APPARENT_ACTIVE_ROADMAPS`;
- [ ] Beatriz validar cenários;
- [ ] Emily auditar suficiência;
- [ ] Léo emitir gate interno.

**Gatilhos candidatos aprovados:** `AUTÓPSIA DA FALHA`, `ANALISE SEU ERRO`, `ONDE VOCÊ ERROU?`.

### R4 — `MCF-MISSION-CHECKPOINT`
**Status:** `⏳ PLANEJADO`
- [ ] localizar roadmap/checkpoint canônico;
- [ ] rejeitar `SUPERSEDED` como estado corrente;
- [ ] ler último registro;
- [ ] reler estado mutável quando necessário;
- [ ] informar etapa, concluído/atual/pendente/bloqueado;
- [ ] informar timestamp, branch, SHA, PRs, link e próxima ação;
- [ ] distinguir fato/inferência/não verificado;
- [ ] impedir reinício de missão com checkpoint válido;
- [ ] Beatriz/Emily validar;
- [ ] Léo emitir gate interno.

**Gatilhos candidatos aprovados:** `ONDE ESTAMOS?`, `STATUS DA MISSÃO`, `CHECKPOINT DA MISSÃO`.

### R5 — Validar skills e continuidade cross-chat
**Status:** `⏳ PLANEJADO`
- [ ] erro de ferramenta semelhante ao ocorrido;
- [ ] duas fontes documentais aparentes;
- [ ] missão interrompida;
- [ ] novo chat sem histórico;
- [ ] estado GitHub mudou;
- [ ] blocker externo;
- [ ] afirmação sem evidência;
- [ ] status sempre fornece link + próxima ação;
- [ ] checkpoint ignora `SUPERSEDED`;
- [ ] autópsia separa fato/hipótese;
- [ ] auditoria e gate.

### R6 — Inventário forense da worktree Codex
**Status:** `⏳ PLANEJADO`
- [ ] capturar branch/HEAD/remotes/status porcelain;
- [ ] capturar diff tracked completo sem editar;
- [ ] inventariar untracked;
- [ ] reconciliar `12 tracked + untracked` com histórico `19 files`;
- [ ] reconciliar `+1261/-213` com `+1759/-318`;
- [ ] SHA-256 dos arquivos;
- [ ] patch/binário quando aplicável;
- [ ] nenhum reset/clean/rebase.

### R7 — Checkpoint remoto forense
**Status:** `⏳ PLANEJADO`
- [ ] preservar conteúdo original antes de correções;
- [ ] commit de recovery separado;
- [ ] publicar checkpoint remoto;
- [ ] registrar/verificar SHA.

### R8 — Reconciliar estado live
**Status:** `⏳ PLANEJADO`
- [ ] reler `main`/PRs/Issues relevantes;
- [ ] comparar recovery × main;
- [ ] separar conflitos textuais/semânticos;
- [ ] preservar lineage Q1–Q16 e boundaries NX.

### R9 — Validação técnica/semântica
**Status:** `⏳ PLANEJADO`
- [ ] `git diff --check`, links, testes Capsule/recovery;
- [ ] schemas/contratos e secret scan;
- [ ] Q13/Q14;
- [ ] Request/Receipt e autorização por tentativa;
- [ ] migration sidecar/pointers;
- [ ] TriView downstream;
- [ ] `state ↔ ledger` explicitamente classificado;
- [ ] nenhum PASS antigo reutilizado para diff novo.

### R10 — Auditoria e gate operacional
**Status:** `⏳ PLANEJADO`
- [ ] Beatriz consolida qualidade;
- [ ] Emily audita evidências;
- [ ] Augusto confere cronologia/handoffs;
- [ ] Léo decide continuidade;
- [ ] matéria reservada retorna a Leandro.

### R11 — Handoff para NextGen
**Status:** `⏳ PLANEJADO`
- [ ] checkpoint final branch/SHA/base;
- [ ] pendências reais;
- [ ] próximo boundary exato;
- [ ] NX-0 sem autorização implícita;
- [ ] link final e retomada cross-chat.

## 6. Contrato de retomada em outro chat

1. consultar release vigente;
2. abrir este roadmap;
3. confirmar que não está `SUPERSEDED`;
4. ler `Etapa atual` e último registro cronológico;
5. reler estados live mutáveis;
6. verificar host/worktree quando aplicável;
7. continuar da próxima checkbox pendente;
8. atualizar roadmap antes de declarar avanço.

É proibido reiniciar do zero enquanto existir checkpoint válido.

## 7. Registro cronológico auditável

```yaml
- timestamp_brt: 2026-08-25 01:50
  stage: R0
  actor: Mestre
  action: Confirmou release v1.1.0.
  evidence: [GitHub releases/latest]
  result: PASS
  next_action: verificar estado live e fonte local

- timestamp_brt: 2026-08-25 01:51
  stage: R0
  actor: Mestre/Gabriel
  action: Confirmou main, PR concorrente e acesso direto à worktree em leo-N43SM.
  evidence: [main@85ccf418, PR#170@1da1a13, host leo-N43SM, worktree HEAD@85ccf418]
  result: PASS
  next_action: criar continuidade auditável

- timestamp_brt: 2026-08-25 01:52
  stage: R1
  actor: Mestre
  action: Criou roadmap auditável e definiu duas skills permanentes no plano.
  evidence: [docs/roadmaps/2026-08-25-codex-work-recovery-auditable-roadmap-v2.md]
  result: PASS
  next_action: revisão humana

- timestamp_brt: 2026-08-25 02:05
  stage: R2
  actor: Leandro/Mestre
  action: Detectada ambiguidade de dois roadmaps ativos aparentes.
  evidence: [screenshot, TWO_APPARENT_ACTIVE_ROADMAPS]
  result: FAIL
  next_action: manter uma única fonte canônica

- timestamp_brt: 2026-08-25 02:12
  stage: R2
  actor: Leandro
  action: Aprovou reorganização documental.
  evidence: [autorização explícita na conversa]
  result: HUMAN_GATE
  next_action: executar correção

- timestamp_brt: 2026-08-25 02:15
  stage: R2
  actor: Mestre/Emily
  action: Removeu roadmap superseded da superfície ativa e preservou evidência histórica.
  evidence: [INITIAL-ROADMAP-SUPERSEDED.md, docs/roadmaps com uma fonte canônica]
  result: PASS
  next_action: Leandro concluir revisão

- timestamp_brt: 2026-08-25 02:21
  stage: R2
  actor: Leandro/Mestre
  action: Leandro informou REVISADA; Mestre manteve gate por faltar decisão explícita.
  evidence: [mensagem REVISADA]
  result: HUMAN_GATE
  next_action: receber APROVO ou correções

- timestamp_brt: 2026-08-25 02:23
  stage: R2
  actor: Leandro
  action: Aprovou explicitamente o checklist e a sequência R3→R4→R5→R6.
  evidence: [mensagem APROVO]
  result: PASS
  next_action: iniciar R3

- timestamp_brt: 2026-08-25 02:23
  stage: R3
  actor: Mestre
  action: Iniciou MCF-FAILURE-AUTOPSY usando os dois incidentes reais como baseline RED.
  evidence: [FALSE_LOCAL_WORKTREE_ACCESS_ASSUMPTION, TWO_APPARENT_ACTIVE_ROADMAPS]
  result: PARTIAL
  next_action: criar contrato, registro e testes da skill
```

## 8. Próxima ação exata

`EXECUTAR R3 — implementar e validar MCF-FAILURE-AUTOPSY sem iniciar recuperação material do Codex.`

Durante R3 não modificar a worktree local do Codex, `main`, VPS, produção ou payload de recuperação.