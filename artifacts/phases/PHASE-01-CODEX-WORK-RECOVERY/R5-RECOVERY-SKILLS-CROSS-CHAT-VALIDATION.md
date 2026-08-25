# R5 — Validação integrada das skills de recuperação

**Skills:** `MCF-FAILURE-AUTOPSY`, `MCF-MISSION-CHECKPOINT`  
**Modo:** validação determinística + cold-start estrutural usando somente fontes versionadas/live; não representa abertura real de uma segunda conversa.

## 1. Validação determinística do registry e instruções

Comando read-only executado no host conectado, lendo a branch remota por `raw.githubusercontent.com` e parseando `skills/registry.yaml`:

```text
FA trigger: PASS
FA experimental: PASS
MC trigger: PASS
MC experimental: PASS
routing rule: PASS
new chat rule: PASS
TOTAL: 6 / 6
```

Isto comprova que:

- as duas skills estão registradas;
- os gatilhos curtos estão presentes;
- ambas continuam honestamente `EXPERIMENTAL`;
- as instruções do projeto mandam selecionar trigger phrase inequívoca sem exigir reexplicação longa;
- há regra explícita de novo chat para localizar checkpoint antes de pedir reconstrução manual.

## 2. Cold-start estrutural sem usar o histórico da conversa

Um processo read-only recebeu apenas a URL canônica do roadmap remoto e extraiu:

```text
mission_id: MCF-20260825-CODEX-WORK-RECOVERY
last_update: 2026-08-25 02:41 BRT
state: EM_EXECUCAO
stage: R5 — Validar skills e continuidade cross-chat
superseded-current-guard: PASS
next-action: PASS
```

**Resultado:** `PASS_STRUCTURAL_COLD_START`.

Isto demonstra que o estado necessário para retomada está versionado fora da memória desta conversa.

## 3. Releitura de estado mutável

Durante R4/R5 foram relidos diretamente no GitHub:

```yaml
main: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
pr_170:
  state: OPEN
  merged: false
  head: 1da1a13bd8ca47bed2f4a4e560e64691788582f8
recovery_branch_head_during_r4: c8f6efe837be0ff1f5818fc8a4a33cb23ae67e21
```

O contrato não confunde último estado versionado com live: quando a releitura não for possível, exige `STALE`/`NAO_VERIFICADO`.

## 4. Fonte canônica única

A listagem live de `docs/roadmaps/` na branch mostrou somente:

`2026-08-25-codex-work-recovery-auditable-roadmap-v2.md`

O roadmap inicial permanece apenas em history/Git e está marcado `SUPERSEDED`.

**Resultado:** `PASS` para o cenário de duas fontes aparentes.

## 5. Prova de não interferência na worktree do Codex

Após R3/R4, leitura Git direta da worktree do Codex permaneceu:

```text
branch: docs/mcf-nextgen-reconciliation-f14-plan-20260824
tracked diff: 12 files changed, +1261/-213
untracked: artifacts/phases/PHASE-NEXTGEN-RECONCILIATION-F14-001/
```

Ou seja, a implementação das skills ocorreu na branch remota de recovery e **não alterou** o payload local que será inventariado em R6.

## 6. Cenários integrados

| Cenário | Veredito |
|---|---|
| erro de ferramenta / capacidade omitida | PASS — baseline FA-01 |
| duas fontes documentais aparentes | PASS — baseline FA-02 + canonical listing |
| missão interrompida com checkpoint | PASS estrutural — roadmap contém etapa + next action |
| cold-start sem histórico da conversa | PASS estrutural — extração remota reproduzível |
| estado live alterável | PASS — releitura ou `STALE/NAO_VERIFICADO` exigidos |
| blocker externo | PASS contratual — não inventar causa/estado |
| afirmação sem evidência | PASS contratual — `NAO_VERIFICADO` |
| link + próxima ação | PASS contratual/roadmap |
| superseded rejeitado | PASS |

## 7. Limitação que não será mascarada

**`NEW_CHAT_UI_E2E = NOT_EXECUTED`**.

Esta sessão não abriu uma segunda conversa independente do produto para disparar os gatilhos de ponta a ponta. Portanto não se declara prova de runtime/chat E2E. A evidência atual comprova contrato, roteamento documental, fonte cross-chat versionada e cold-start estrutural.

Por esse motivo ambas as skills permanecem `EXPERIMENTAL`. Um smoke real em nova conversa deve ocorrer depois que a mudança estiver integrada numa superfície de projeto que consuma esta versão.

## 8. Beatriz — veredito

`PASS_WITH_RUNTIME_E2E_LIMITATION`.

Nenhum critério estrutural crítico falhou. A limitação remanescente é explicitamente fora da prova possível desta mesma conversa.

## 9. Emily — auditoria

`EVIDENCE_SUFFICIENT_TO_CONTINUE_RECOVERY`.

A limitação E2E foi preservada, não transformada em PASS. A continuidade para R6 não depende de alegar runtime executável das skills.

## 10. Gate operacional de Léo

**Decisão:** `APROVAR_CONTINUIDADE_PARA_R6_COM_RESSALVA`.

**Ressalva:** manter as skills `EXPERIMENTAL` e exigir smoke E2E de nova conversa antes de qualquer promoção a capacidade estável/runtime.

**Próxima ação:** `R6 — inventário forense da worktree real do Codex`.