# MCF — Roadmap Auditável de Recuperação do Trabalho do Codex (v2)

**Mission ID:** `MCF-20260825-CODEX-WORK-RECOVERY`  
**Phase ID:** `PHASE-01-CODEX-WORK-RECOVERY`  
**Branch:** `mission/codex-work-recovery-20260825`  
**Coordenador:** Mestre  
**Autoridade humana final:** Leandro  
**Autoridade operacional/gate:** Léo  
**Classe de risco:** `B`  
**Fuso canônico deste roadmap:** `America/Recife (BRT, UTC-03)`  
**Criado em:** `2026-08-25 01:52 BRT`  
**Última atualização:** `2026-08-25 01:52 BRT`  
**Estado:** `AGUARDANDO_GATE_DE_LEANDRO_PARA_INICIAR_EXECUCAO`  
**Etapa atual:** `R2 — Revisão humana do checklist`

> Este documento é o roadmap/checklist canônico a partir de `2026-08-25 01:52 BRT`.
> Ele **supersede apenas o estado operacional mutável e o blocker incorreto** do roadmap anterior
> `2026-08-25-codex-work-recovery-roadmap.md`, preservando o arquivo antigo como evidência histórica.

---

## 1. Objetivo

Recuperar, preservar, auditar e devolver continuidade ao trabalho NextGen produzido pelo Codex na worktree local interrompida, sem perda, sem reconstrução por aproximação e sem misturar o conteúdo original com correções posteriores.

Em paralelo, esta missão incluirá duas melhorias permanentes de governança do MCF:

1. uma skill de **autópsia de falha do agente**;
2. uma skill de **apresentação do checkpoint/status atual da missão**, acionável por frase curta, para que Leandro possa entender em que ponto estamos e retomar em outro chat sem reconstrução manual.

A implementação das skills e a recuperação material da worktree **não começam antes da aprovação explícita de Leandro sobre este checklist**.

---

## 2. Estado verificável no momento deste roadmap

```yaml
stable_release:
  version: v1.1.0
  sha: 5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
  verified_at: 2026-08-25 01:50 BRT

main:
  sha: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
  verified_at: 2026-08-25 01:51 BRT

recovery_branch:
  name: mission/codex-work-recovery-20260825
  current_remote_head_before_this_v2: 773c75329a8ceab17dd6c3d32cdd50fa35dd0e4d

concurrent_pr_170:
  state: OPEN
  merged: false
  head_sha: 1da1a13bd8ca47bed2f4a4e560e64691788582f8
  verified_at: 2026-08-25 01:51 BRT

codex_worktree:
  host: leo-N43SM
  host_access: VERIFIED
  path: /home/leo/Documentos/GitHub/multiagent-collaboration-framework-nextgen-reconciliation-20260824
  branch: docs/mcf-nextgen-reconciliation-f14-plan-20260824
  head: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
  access_verified_at: 2026-08-25 01:51 BRT

tracked_diff_now:
  files: 12
  additions: 1261
  deletions: 213
  untracked_root: artifacts/phases/PHASE-NEXTGEN-RECONCILIATION-F14-001/

historical_screenshot_snapshot:
  files_changed: 19
  additions: 1759
  deletions: 318
  status: HISTORICAL_EVIDENCE_TO_RECONCILE
```

### Correção formal de erro anterior

A afirmação anterior `LOCAL_WORKTREE_NOT_EXPOSED` é **FALSA / SUPERSEDED**.

Fato atual verificado:

```text
ChatGPT sandbox não contém /home/leo
        ≠
worktree inacessível

SentinelX → host leo-N43SM → worktree real acessível
```

Nenhum novo chat deve voltar a pedir ZIP/TAR/manual export a Leandro antes de tentar a rota de host conectado disponível.

---

## 3. Regra obrigatória de atualização cronológica

A cada avanço de etapa, retorno de correção, novo blocker ou gate, este roadmap deve ser atualizado **antes de declarar a transição concluída**.

Cada atualização deve modificar:

1. `Última atualização`;
2. `Estado`;
3. `Etapa atual`;
4. checkbox da etapa;
5. `Registro cronológico auditável`;
6. `Próxima ação exata`;
7. links/SHAs/evidências disponíveis.

Formato obrigatório do registro:

```yaml
- timestamp_brt: YYYY-MM-DD HH:MM
  stage: Rn
  actor: <agente/papel>
  action: <ação objetiva>
  evidence:
    - <SHA, arquivo, PR, host, teste ou ferramenta>
  result: PASS | FAIL | BLOCKED | PARTIAL | HUMAN_GATE
  next_action: <passo verificável seguinte>
```

### Regra de verdade

- Nenhuma etapa vira `✅ CONCLUÍDA` apenas por declaração do agente.
- Falta de evidência = `NÃO VERIFICADO`.
- Falha externa e falha de implementação devem ser separadas.
- Cada novo chat deve começar lendo este arquivo e o último registro cronológico.

---

## 4. Checklist cronológico mestre

### R0 — Contenção e descoberta correta de capacidade

**Status:** `✅ CONCLUÍDO`  
**Timestamp de fechamento:** `2026-08-25 01:51 BRT`

- [x] Consultar release vigente.
- [x] Consultar `main` live.
- [x] Confirmar branch de recuperação existente.
- [x] Descobrir hosts conectados.
- [x] Confirmar host `leo-N43SM`.
- [x] Confirmar acesso direto à worktree real.
- [x] Confirmar branch e HEAD local do trabalho do Codex.
- [x] Registrar que a alegação anterior de falta de acesso era incorreta.

**Saída:** fonte primária real localizada e acessível sem intervenção manual de Leandro.

---

### R1 — Criar mecanismo auditável de continuidade

**Status:** `✅ CONCLUÍDO`  
**Timestamp de fechamento:** `2026-08-25 01:52 BRT`

- [x] Criar este roadmap v2.
- [x] Tornar explícita a regra de timestamp por transição.
- [x] Definir uma única `Etapa atual`.
- [x] Definir registro cronológico append-only por evento.
- [x] Separar histórico anterior de estado corrente.
- [x] Incluir no roadmap as duas skills requeridas por Leandro.
- [x] Definir contrato mínimo de retomada cross-chat.

**Saída:** qualquer novo chat consegue localizar o ponto atual lendo este documento.

---

### R2 — GATE HUMANO: Leandro revisa este checklist

**Status:** `🟡 ATUAL / AGUARDANDO LEANDRO`  
**Aberto em:** `2026-08-25 01:52 BRT`

Leandro deve verificar se:

- [ ] a ordem cronológica está correta;
- [ ] as duas skills propostas representam exatamente a intenção desejada;
- [ ] a recuperação do Codex deve começar somente após as skills ou pode ocorrer depois da especificação delas;
- [ ] há alguma etapa que precisa ser adicionada/removida;
- [ ] os gatilhos sugeridos para as skills fazem sentido.

**Nenhuma implementação nova será iniciada antes deste gate.**

---

### R3 — Skill 1: Autópsia de falha do agente

**Status:** `⏳ PLANEJADO`

**Nome de trabalho:** `MCF-FAILURE-AUTOPSY`  
**Gatilhos candidatos:** `AUTÓPSIA DA FALHA`, `ANALISE SEU ERRO`, `ONDE VOCÊ ERROU?`

Checklist de implementação:

- [ ] definir contrato da skill;
- [ ] definir agente owner e agentes de controle aplicáveis;
- [ ] registrar no `skills/registry.yaml`;
- [ ] criar documentação/skill contract versionado;
- [ ] exigir reconstrução operacional auditável: objetivo → evidência → premissas → ferramentas → decisão → ponto da falha → regra violada → impacto → caminho correto → prevenção;
- [ ] proibir invenção de cadeia privada/token a token;
- [ ] usar resumo de raciocínio seguro quando disponível;
- [ ] testar contra o erro real `sandbox ≠ host conectado`;
- [ ] Beatriz validar cenários;
- [ ] Emily auditar fidelidade ao ocorrido;
- [ ] Léo emitir gate.

**Aceite:** uma frase curta dispara uma autópsia útil e reprodutível, sem Leandro precisar reescrever a explicação longa.

---

### R4 — Skill 2: Status/checkpoint da missão (Tópico 3 de Leandro)

**Status:** `⏳ PLANEJADO`

**Nome de trabalho:** `MCF-MISSION-CHECKPOINT`  
**Gatilhos candidatos:** `ONDE ESTAMOS?`, `STATUS DA MISSÃO`, `CHECKPOINT DA MISSÃO`

A skill deve:

- [ ] localizar o roadmap/checklist canônico da missão;
- [ ] ler o último registro cronológico;
- [ ] reler estado live mutável quando necessário;
- [ ] informar etapa atual;
- [ ] mostrar concluído / atual / pendente / bloqueado;
- [ ] informar último timestamp BRT;
- [ ] informar branch, SHA e PR relevantes;
- [ ] fornecer o link direto do roadmap/checklist;
- [ ] informar a próxima ação exata;
- [ ] distinguir fato, inferência e não verificado;
- [ ] não reiniciar a missão;
- [ ] produzir um checkpoint que outro chat possa usar imediatamente.

**Aceite:** Leandro usa uma frase curta e recebe a fotografia auditável da missão + link, sem precisar explicar contexto novamente.

---

### R5 — Validar as duas skills e a continuidade cross-chat

**Status:** `⏳ PLANEJADO`

- [ ] cenário: erro de ferramenta semelhante ao ocorrido;
- [ ] cenário: missão interrompida em etapa intermediária;
- [ ] cenário: novo chat sem histórico desta conversa;
- [ ] cenário: GitHub avançou desde o último checkpoint;
- [ ] cenário: blocker externo;
- [ ] cenário: afirmação do agente sem evidência;
- [ ] validar que a skill de status sempre fornece link e próxima ação;
- [ ] validar que a autópsia separa fatos de hipótese;
- [ ] auditoria independente;
- [ ] gate de Léo.

---

### R6 — Inventário forense da worktree real do Codex

**Status:** `⏳ PLANEJADO`

- [ ] capturar branch, HEAD, remotes e status por porcelain;
- [ ] capturar diff tracked completo sem editar;
- [ ] inventariar todos os untracked em `PHASE-NEXTGEN-RECONCILIATION-F14-001/`;
- [ ] reconciliar `12 tracked + untracked` com o snapshot histórico `19 files`;
- [ ] reconciliar `+1261/-213` atual com `+1759/-318` histórico;
- [ ] gerar hashes SHA-256 dos arquivos do payload;
- [ ] preservar patch/binário quando aplicável;
- [ ] não rodar reset/clean/rebase;
- [ ] registrar qualquer divergência como evidência, não como erro automático.

**Aceite:** sabemos exatamente quais bytes existem e como se relacionam ao último estado observado do Codex.

---

### R7 — Checkpoint remoto forense

**Status:** `⏳ PLANEJADO`

- [ ] preservar o conteúdo original antes de corrigir qualquer coisa;
- [ ] publicar o payload recuperado em commit separado nesta branch ou em branch dedicada derivada dela, conforme verificação Git;
- [ ] não misturar melhorias com o checkpoint original;
- [ ] registrar SHA remoto;
- [ ] verificar o conteúdo novamente no GitHub;
- [ ] atualizar este roadmap com timestamp + SHA.

**Aceite:** o trabalho deixa de depender da máquina local e pode ser retomado por outro chat/agente.

---

### R8 — Reconciliar com o estado live do MCF

**Status:** `⏳ PLANEJADO`

- [ ] reler `main`;
- [ ] reler PR #170 e outras PRs/Issues relevantes;
- [ ] comparar recovery × main;
- [ ] separar conflito textual de conflito semântico;
- [ ] registrar toda decisão de reconciliação;
- [ ] preservar lineage Q1–Q16;
- [ ] verificar efeitos sobre NX-0/NX-1…NX-9;
- [ ] não incorporar mudança concorrente silenciosamente.

---

### R9 — Validação técnica e semântica

**Status:** `⏳ PLANEJADO`

- [ ] `git diff --check`;
- [ ] links/documentação;
- [ ] Capsule/recovery tests aplicáveis;
- [ ] schemas/contratos;
- [ ] secret scan gratuito e reproduzível;
- [ ] Q13/Q14;
- [ ] Request/Receipt e autorização por tentativa;
- [ ] migration pointer/sidecar;
- [ ] TriView downstream;
- [ ] classificação explícita de `state ↔ ledger`;
- [ ] nenhum PASS antigo reutilizado para novo diff.

---

### R10 — Auditoria e gate operacional

**Status:** `⏳ PLANEJADO`

- [ ] Beatriz consolida evidências de qualidade;
- [ ] Emily audita a cadeia e não conformidades;
- [ ] Augusto verifica cronologia/handoffs quando aplicável;
- [ ] Léo decide continuidade;
- [ ] matéria reservada volta para HUMAN_GATE de Leandro.

---

### R11 — Handoff de volta para a missão NextGen

**Status:** `⏳ PLANEJADO`

- [ ] checkpoint final com branch/SHA/base;
- [ ] lista de pendências reais;
- [ ] próximo boundary exato;
- [ ] NX-0 continua sem autorização implícita;
- [ ] link do roadmap final;
- [ ] novo chat consegue retomar apenas lendo o checkpoint.

**Estado esperado da recuperação:** `ENTREGUE`.

---

## 5. Contrato mínimo de retomada em outro chat

Qualquer novo MESTRE que receba esta missão deve executar, nesta ordem:

```text
1. consultar a release vigente do repositório oficial;
2. abrir este roadmap v2;
3. ler “Etapa atual”;
4. ler o último item do “Registro cronológico auditável”;
5. reler GitHub live para estados mutáveis;
6. verificar host/worktree quando a etapa depender de arquivos locais;
7. continuar da próxima checkbox pendente da etapa atual;
8. atualizar este roadmap com data/hora antes de declarar avanço.
```

É proibido reiniciar a missão do zero enquanto existir checkpoint válido.

---

## 6. Registro cronológico auditável

```yaml
- timestamp_brt: 2026-08-25 01:50
  stage: R0
  actor: Mestre
  action: Releu release oficial e confirmou v1.1.0@5d79f488.
  evidence:
    - GitHub releases/latest
  result: PASS
  next_action: verificar main, PR concorrente e fonte local real

- timestamp_brt: 2026-08-25 01:51
  stage: R0
  actor: Mestre/Gabriel
  action: Confirmou main, PR #170 e acesso direto à worktree no host leo-N43SM.
  evidence:
    - main@85ccf418740e78b5e1e3eeb7742baf6f869978c1
    - PR#170 head@1da1a13bd8ca47bed2f4a4e560e64691788582f8
    - host leo-N43SM
    - worktree branch docs/mcf-nextgen-reconciliation-f14-plan-20260824
    - worktree HEAD 85ccf418740e78b5e1e3eeb7742baf6f869978c1
    - tracked diff 12 files, +1261/-213
  result: PASS
  next_action: criar mecanismo auditável de continuidade

- timestamp_brt: 2026-08-25 01:52
  stage: R1
  actor: Mestre
  action: Criou roadmap/checklist auditável v2 e incluiu as duas skills requeridas no plano.
  evidence:
    - docs/roadmaps/2026-08-25-codex-work-recovery-auditable-roadmap-v2.md
  result: PASS
  next_action: HUMAN_GATE de Leandro para aprovar ou corrigir o checklist
```

---

## 7. Próxima ação exata

`AGUARDAR LEANDRO revisar este checklist.`

Enquanto este gate estiver aberto:

- não criar ainda as duas skills;
- não copiar/commit/push do payload do Codex;
- não modificar a worktree local;
- não alterar `main`;
- não abrir PR de recuperação.

Após aprovação explícita de Leandro, avançar para `R3 — Skill 1: Autópsia de falha do agente`, salvo se Leandro alterar a ordem.