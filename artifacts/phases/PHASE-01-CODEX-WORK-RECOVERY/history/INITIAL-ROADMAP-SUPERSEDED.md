# Evidência histórica — roadmap inicial superseded

**Mission ID:** `MCF-20260825-CODEX-WORK-RECOVERY`  
**Status:** `SUPERSEDED / NAO_USAR_PARA_CONTINUIDADE`  
**Registrado em:** `2026-08-25 02:12 BRT`  
**Autoridade da correção:** Leandro aprovou a recomendação de manter um único roadmap operacional canônico.

## 1. Artefato original preservado

O roadmap inicial existiu em:

`docs/roadmaps/2026-08-25-codex-work-recovery-roadmap.md`

Último blob observado antes da retirada da área operacional ativa:

`5023279fc8e4d5103bcf7774c3a07d6565f8e5f7`

Commit da branch no qual o arquivo ainda estava presente imediatamente antes desta reorganização:

`346419a745bd60f13f36f5edbb22294c98f65df0`

Evidência imutável no histórico Git:

https://github.com/leon337/multiagent-collaboration-framework/blob/346419a745bd60f13f36f5edbb22294c98f65df0/docs/roadmaps/2026-08-25-codex-work-recovery-roadmap.md

## 2. Por que foi superseded

O roadmap inicial continha a premissa incorreta de que a sessão não possuía acesso direto ao filesystem da máquina que continha a worktree do Codex.

A verificação posterior demonstrou:

```text
ChatGPT sandbox não contém /home/leo
        ≠
worktree inacessível

SentinelX
  → host leo-N43SM
  → /home/leo/Documentos/GitHub/multiagent-collaboration-framework-nextgen-reconciliation-20260824
  → acesso de leitura confirmado
```

Além da premissa factual incorreta, surgiu uma segunda falha de governança documental: após criar o roadmap corrigido v2, o roadmap superseded permaneceu lado a lado em `docs/roadmaps/`, criando duas fontes aparentemente operacionais e aumentando o risco de um novo agente escolher o documento errado.

## 3. Correção aplicada

A partir de `2026-08-25 02:12 BRT`:

- o roadmap inicial deixa a área ativa `docs/roadmaps/`;
- esta referência histórica preserva sua existência, SHA e motivo da supersessão;
- o conteúdo integral continua recuperável pelo histórico Git/commit acima;
- o único roadmap operacional canônico da missão passa a ser:

`docs/roadmaps/2026-08-25-codex-work-recovery-auditable-roadmap-v2.md`

## 4. Regra para novos agentes/chats

**NÃO usar o roadmap inicial para determinar estado corrente, blockers ou próxima ação.**

Usá-lo somente para:

- auditoria da falha;
- estudo da cadeia causal;
- comparação histórica;
- validação da futura skill `MCF-FAILURE-AUTOPSY`.
