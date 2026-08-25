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
**Última atualização:** `2026-08-25 02:36 BRT`  
**Estado:** `EM_EXECUCAO`  
**Etapa atual:** `R4 — Skill 2: Status/checkpoint da missão`

> Este é o **único roadmap/checklist operacional canônico** desta missão. Documentos marcados `SUPERSEDED` não podem ser usados como fonte de estado corrente.

## 1. Objetivo

Recuperar, preservar, auditar e devolver continuidade ao trabalho NextGen produzido pelo Codex na worktree local interrompida, sem perda, sem reconstrução por aproximação e sem misturar o conteúdo original com correções posteriores.

Antes da recuperação material, criar e validar:

1. `MCF-FAILURE-AUTOPSY` — autópsia auditável de falha por frase curta;
2. `MCF-MISSION-CHECKPOINT` — status/checkpoint auditável por frase curta.

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

## 3. Falhas de governança já registradas

### `FALSE_LOCAL_WORKTREE_ACCESS_ASSUMPTION`
Ausência de `/home/leo` no sandbox foi indevidamente convertida em alegação de inacessibilidade. SentinelX depois comprovou acesso ao `leo-N43SM`. Regra: **descobrir ferramentas/conectores/hosts antes de declarar incapacidade; sem prova, usar `NAO_VERIFICADO`**.

### `TWO_APPARENT_ACTIVE_ROADMAPS`
O roadmap inicial superseded permaneceu na área ativa ao lado do canônico. Foi retirado de `docs/roadmaps/` e preservado em `artifacts/phases/PHASE-01-CODEX-WORK-RECOVERY/history/INITIAL-ROADMAP-SUPERSEDED.md`. Regra: **preservar histórico não pode criar segunda fonte canônica aparente**.

## 4. Regra obrigatória de atualização cronológica

A cada avanço, correção, blocker ou gate, atualizar antes de declarar a transição concluída: timestamp, estado, etapa atual, checks, registro cronológico, evidências/SHAs/links e próxima ação.

```yaml
- timestamp_brt: YYYY-MM-DD HH:MM
  stage: Rn
  actor: <papel>
  action: <ação objetiva>
  evidence: [<referências>]
  result: PASS | FAIL | BLOCKED | PARTIAL | HUMAN_GATE
  next_action: <passo seguinte>
```

Falta de evidência = `NAO_VERIFICADO`. Não inventar/expor cadeia privada token a token; usar fatos, premissas observáveis, ferramentas, omissões, decisões e causalidade suportada.

## 5. Checklist cronológico mestre

### R0 — Contenção e descoberta correta de capacidade
**Status:** `✅ CONCLUÍDO` — `2026-08-25 01:51 BRT`
- [x] release/main/PR concorrente consultados;
- [x] branch de recovery criada;
- [x] `leo-N43SM`, worktree, branch e HEAD do Codex confirmados;
- [x] falsa limitação de acesso registrada.

### R1 — Continuidade auditável
**Status:** `✅ CONCLUÍDO` — `2026-08-25 01:52 BRT`
- [x] roadmap canônico criado;
- [x] timestamp/etapa única/log definidos;
- [x] retomada cross-chat definida;
- [x] duas skills incluídas no plano.

### R2 — HUMAN_GATE: revisão do checklist
**Status:** `✅ CONCLUÍDO` — `2026-08-25 02:23 BRT`
- [x] checklist revisado;
- [x] ambiguidade documental corrigida;
- [x] sequência `R3 → R4 → R5 → R6` aprovada explicitamente por Leandro.

### R3 — `MCF-FAILURE-AUTOPSY`
**Status:** `✅ CONCLUÍDO COM RESSALVA` — `2026-08-25 02:36 BRT`
- [x] contrato e owners definidos: Augusto/Beatriz; suporte Emily/Patricia/Mestre;
- [x] registrada no `skills/registry.yaml` como `EXPERIMENTAL`;
- [x] contrato versionado criado;
- [x] guia `SKILL.md` criado;
- [x] reconstrução auditável exigida;
- [x] invenção de cadeia privada/token a token proibida;
- [x] baseline TDD criado antes do contrato usando duas falhas reais;
- [x] `FALSE_LOCAL_WORKTREE_ACCESS_ASSUMPTION` reavaliada;
- [x] `TWO_APPARENT_ACTIVE_ROADMAPS` reavaliada;
- [x] Beatriz: `100/100 PASS_STRUCTURAL_AND_SCENARIO`;
- [x] Emily: `SUFICIENTE_PARA_GATE_INTERNO_R3`;
- [x] Léo: `APROVAR_COM_RESSALVA`.

**Evidências R3:**
- `docs/tests/MCF-FAILURE-AUTOPSY-TESTS.md` — commit `b75c186c1c72152b0b304d376cb47c18b9ec7c72`;
- `skills/contracts/MCF-FAILURE-AUTOPSY.yaml` — commit `d95e00099f89b349c0abd57b1672682c0d59d132`;
- `skills/mcf-failure-autopsy/SKILL.md` — commit `c2428c5e244ba88b742a3f2362b8589feb28ea52`;
- `skills/registry.yaml` — commit `b834643232cc254de903f1a0f5e0dbdaaca905bb`;
- `R3-FAILURE-AUTOPSY-EVALUATION.md` — commit `a17ca30a1364ca5bb69650d8b17da176efd70dc9`.

**Ressalva:** registro como skill de governança/orquestração não equivale a inclusão no conjunto tipado do `SkillExecutor`; promoção runtime exige missão separada.

### R4 — `MCF-MISSION-CHECKPOINT`
**Status:** `🟡 EM EXECUÇÃO` — aberto `2026-08-25 02:36 BRT`
- [ ] definir contrato e owners;
- [ ] registrar no `skills/registry.yaml`;
- [ ] criar contrato versionado e guia da skill;
- [ ] localizar roadmap/checkpoint canônico;
- [ ] rejeitar `SUPERSEDED` como estado corrente;
- [ ] reler estado mutável quando necessário;
- [ ] informar etapa, concluído/atual/pendente/bloqueado;
- [ ] informar timestamp, branch, SHA, PRs, link e próxima ação;
- [ ] distinguir fato/inferência/não verificado;
- [ ] impedir reinício de missão com checkpoint válido;
- [ ] Beatriz/Emily validar;
- [ ] Léo emitir gate interno.

**Gatilhos aprovados:** `ONDE ESTAMOS?`, `STATUS DA MISSÃO`, `CHECKPOINT DA MISSÃO`.

### R5 — Validar skills e continuidade cross-chat
**Status:** `⏳ PLANEJADO`
- [ ] erro de ferramenta semelhante;
- [ ] duas fontes documentais aparentes;
- [ ] missão interrompida;
- [ ] novo chat sem histórico;
- [ ] estado live mudou;
- [ ] blocker externo;
- [ ] afirmação sem evidência;
- [ ] status fornece link + próxima ação;
- [ ] checkpoint ignora `SUPERSEDED`;
- [ ] autópsia separa fato/hipótese;
- [ ] auditoria e gate.

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
- [ ] publicar e verificar SHA remoto.

### R8 — Reconciliar estado live
**Status:** `⏳ PLANEJADO`
- [ ] reler `main`/PRs/Issues;
- [ ] comparar recovery × main;
- [ ] conflitos textuais/semânticos;
- [ ] preservar Q1–Q16 e NX boundaries.

### R9 — Validação técnica/semântica
**Status:** `⏳ PLANEJADO`
- [ ] diff check, links, testes Capsule/recovery;
- [ ] schemas/contratos, secret scan, Q13/Q14;
- [ ] Request/Receipt, sidecar/pointers, TriView;
- [ ] `state ↔ ledger` classificado;
- [ ] nenhum PASS antigo reutilizado.

### R10 — Auditoria e gate operacional
**Status:** `⏳ PLANEJADO`
- [ ] Beatriz, Emily, Augusto;
- [ ] gate de Léo;
- [ ] matéria reservada volta a Leandro.

### R11 — Handoff para NextGen
**Status:** `⏳ PLANEJADO`
- [ ] checkpoint final branch/SHA/base;
- [ ] pendências e próximo boundary;
- [ ] NX-0 sem autorização implícita;
- [ ] link final e retomada cross-chat.

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
  evidence: [GitHub releases/latest]
  result: PASS
  next_action: verificar estado live e fonte local

- timestamp_brt: 2026-08-25 01:51
  stage: R0
  actor: Mestre/Gabriel
  action: Confirmou main, PR concorrente e acesso direto à worktree.
  evidence: [main@85ccf418, PR#170@1da1a13, host leo-N43SM, worktree@85ccf418]
  result: PASS
  next_action: criar continuidade auditável

- timestamp_brt: 2026-08-25 01:52
  stage: R1
  actor: Mestre
  action: Criou roadmap auditável e incluiu duas skills no plano.
  evidence: [roadmap v2]
  result: PASS
  next_action: revisão humana

- timestamp_brt: 2026-08-25 02:05
  stage: R2
  actor: Leandro/Mestre
  action: Detectada ambiguidade de dois roadmaps ativos aparentes.
  evidence: [TWO_APPARENT_ACTIVE_ROADMAPS]
  result: FAIL
  next_action: manter fonte canônica única

- timestamp_brt: 2026-08-25 02:12
  stage: R2
  actor: Leandro
  action: Aprovou reorganização documental.
  evidence: [autorização explícita]
  result: HUMAN_GATE
  next_action: corrigir organização

- timestamp_brt: 2026-08-25 02:15
  stage: R2
  actor: Mestre/Emily
  action: Retirou roadmap superseded da superfície ativa e preservou histórico.
  evidence: [INITIAL-ROADMAP-SUPERSEDED.md]
  result: PASS
  next_action: concluir revisão

- timestamp_brt: 2026-08-25 02:21
  stage: R2
  actor: Leandro/Mestre
  action: REVISADA recebida; gate mantido até decisão explícita.
  evidence: [mensagem REVISADA]
  result: HUMAN_GATE
  next_action: receber APROVO ou correções

- timestamp_brt: 2026-08-25 02:23
  stage: R2
  actor: Leandro
  action: Aprovou checklist e sequência R3→R4→R5→R6.
  evidence: [mensagem APROVO]
  result: PASS
  next_action: iniciar R3

- timestamp_brt: 2026-08-25 02:23
  stage: R3
  actor: Mestre
  action: Iniciou baseline TDD da autópsia usando duas falhas reais.
  evidence: [FALSE_LOCAL_WORKTREE_ACCESS_ASSUMPTION, TWO_APPARENT_ACTIVE_ROADMAPS]
  result: PARTIAL
  next_action: contrato/registro/testes

- timestamp_brt: 2026-08-25 02:36
  stage: R3
  actor: Augusto/Beatriz/Emily/Léo
  action: Contrato, guia, registro e cenários produzidos; Beatriz marcou 100/100; Emily considerou evidência suficiente; Léo aprovou com ressalva de não-executabilidade runtime.
  evidence: [b75c186c, d95e0009, c2428c5e, b8346432, a17ca30a]
  result: PASS
  next_action: iniciar R4 — MCF-MISSION-CHECKPOINT
```

## 8. Próxima ação exata

`EXECUTAR R4 — implementar e validar MCF-MISSION-CHECKPOINT.`

R4/R5 não autorizam tocar a worktree do Codex, `main`, VPS ou produção.