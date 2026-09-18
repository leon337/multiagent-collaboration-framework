# MCF — Canonicalização de Workspace Local

**Classificação:** `CURRENT_IMPLEMENTED` no host indicado  
**Escopo:** `leo-N43SM`  
**Natureza:** política operacional local; GitHub live continua sendo a fonte de verdade para estado verificável.

## Regra canônica

No host `leo-N43SM`, novas missões do MCF devem partir de:

`/home/leo/mcf-workspaces/leo/multiagent-collaboration-framework`

Exceção: a missão pode declarar explicitamente um workspace/worktree isolado e sua finalidade.

Antes de ação material:

1. reler GitHub live;
2. `git fetch origin`;
3. confirmar branch e intenção da missão;
4. comparar `main` local com `origin/main`;
5. verificar working tree;
6. usar worktree isolado quando a mudança não deve ocorrer diretamente no workspace canônico.

## Classificação das cópias reconciliadas

| Caminho | Classificação | Uso |
|---|---|---|
| `/home/leo/mcf-workspaces/leo/multiagent-collaboration-framework` | `CANONICAL_EXECUTION_WORKSPACE` | entrada padrão |
| `/home/leo/mcf-workspaces/mestre/multiagent-collaboration-framework` | `ISOLATED_MESTRE_WORKSPACE` | testes/branches isoladas |
| `/home/leo/multiagent-collaboration-framework` | `LEGACY_FEATURE_WORKSPACE` | continuidade histórica de feature |
| `/home/leo/Documentos/GitHub/multiagent-collaboration-framework` | `HISTORICAL_RECOVERY_WORKTREE_HUB` | recovery/auditoria/worktrees históricos |

Nenhuma classificação autoriza exclusão automática.

## Boundary da bolha

Para missões executadas pelo MESTRE no ChatGPT, o MCF Harness V2 define:

`CHATGPT_BUBBLE_LOCAL_SANDBOX`

Brainbase não é executor dessa missão e o notebook não é runtime. O fluxo canônico é:

`ChatGPT bubble sandbox → local workspace → SQLite/WAL Mission Journal → local parallel engineering workers → local audit fan-in → receipt/checkpoint → GitHub/MCF para continuidade persistente`

Os workers locais podem executar em processos separados, mas não devem ser descritos como LLMs cognitivamente independentes sem backend cognitivo verificado.

## Project Registry

`schemas/context/project-registry-entry.schema.json` usa `additionalProperties: false` e não possui campo para caminho local. Portanto o caminho local não deve ser inserido em `context/projects/multiagent-collaboration-framework.yaml` por campo ad hoc.

Esta política operacional é o lugar apropriado para o roteamento local do host.
