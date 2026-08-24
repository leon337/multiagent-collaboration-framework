# MCF Ecosystem — evidência do recovery estrutural final 4/4

**Classificação:** `VERIFIED_READ_ONLY_EVIDENCE`  
**Janela UTC:** `2026-08-24T04:14:24.044Z`–`2026-08-24T04:14:24.195Z`  
**Resultado:** `PASS`  
**Exit code:** `0`

## Objetivo e boundary

Este gate repetiu a recuperação estrutural depois da sincronização semântica das quatro Capsules.
Ele exercitou as `ApiService` reais do MCF com `recoverReadOnly(projectId, true)`, incluindo
validação de schemas, Registry, Capsule, proveniência e freshness Git local.

O run não iniciou servidor, não persistiu Receipt, não conectou provider, não chamou VPS,
produção ou API paga e não executou ação material ou mutação externa.

## Revisões congeladas

| Projeto              | Ref verificada                                  | SHA exato                                  |
| -------------------- | ----------------------------------------------- | ------------------------------------------ |
| MCF                  | `refs/heads/main`                               | `2dc4584c4be186b5cdf131105b810610a9cf620a` |
| Cloud Infrastructure | `refs/heads/mcf/mission-001-control-bridge-g1`  | `38cd22e0a814bdf4957edcf5bb30506a4810bda0` |
| Cognitive Ledger     | `refs/heads/design/cognitive-ledger-foundation` | `a64cfc05f83567f624bbda70288310f56a7264e8` |
| TriView Workspace    | `refs/heads/release/1.0.0a4`                    | `09a361d761adf1e2e614d23718b84776c365cacc` |

Cada ref remota correspondeu ao SHA esperado. Os quatro detached worktrees temporários iniciaram e
terminaram limpos, com o `HEAD` exato configurado.

## Receipts validados

| Projeto                              | Receipt                                                 | Estado      | Read-only | Material | Evidence-only | Capsule/live SHA                           | Fontes | Claims | Warnings |
| ------------------------------------ | ------------------------------------------------------- | ----------- | --------: | -------: | ------------: | ------------------------------------------ | -----: | -----: | -------: |
| `cloud-infrastructure`               | `context-recovery-24f4f928-9467-49a5-bf61-955054438232` | `RECOVERED` |      true |    false |          true | `38cd22e0a814bdf4957edcf5bb30506a4810bda0` |      6 |     17 |        0 |
| `cognitive-ledger`                   | `context-recovery-2340a6bb-5aed-451a-a2e3-757025635c2c` | `RECOVERED` |      true |    false |          true | `a64cfc05f83567f624bbda70288310f56a7264e8` |      6 |     17 |        0 |
| `multiagent-collaboration-framework` | `context-recovery-49e30dc2-8a19-46da-9cbc-532a6e026eca` | `RECOVERED` |      true |    false |          true | `2dc4584c4be186b5cdf131105b810610a9cf620a` |      6 |     17 |        0 |
| `triview-workspace-linux`            | `context-recovery-4c0ec1bb-fc44-4caf-8f30-f7116ba6a0ed` | `RECOVERED` |      true |    false |          true | `09a361d761adf1e2e614d23718b84776c365cacc` |      6 |     17 |        0 |

Cada Receipt foi validado pelo schema canônico e contém exatamente:

- quatro fontes `REGISTRY` revisionadas por `2dc4584c4be186b5cdf131105b810610a9cf620a`;
- uma fonte `CAPSULE` revisionada pelo SHA próprio do projeto;
- uma fonte `LIVE_VERIFICATION` no mesmo SHA próprio;
- 17 claims com proveniência, nenhum warning e nenhuma ação material.

## Snapshot do Capability Registry

O snapshot retornou `read_only=true`, `evidence_only=true`, quatro projetos e as seis capabilities
esperadas:

| Capability                     | Modo            | Autorização      | Conexão        | Runtime    | Verificação             | Freshness       |
| ------------------------------ | --------------- | ---------------- | -------------- | ---------- | ----------------------- | --------------- |
| `cloud.context.local.read`     | `READ_ONLY`     | `AUTHORIZED`     | `DISCONNECTED` | `INACTIVE` | `HISTORICALLY_VERIFIED` | `LIVE_REQUIRED` |
| `cloud.workspace.g2a.read`     | `READ_ONLY`     | `NOT_AUTHORIZED` | `DISCONNECTED` | `UNKNOWN`  | `HISTORICALLY_VERIFIED` | `LIVE_REQUIRED` |
| `cloud.workspace.g2b.write`    | `BOUNDED_WRITE` | `NOT_AUTHORIZED` | `DISCONNECTED` | `BLOCKED`  | `HISTORICALLY_VERIFIED` | `LIVE_REQUIRED` |
| `cognitive-ledger.memory.read` | `READ_ONLY`     | `AUTHORIZED`     | `DISCONNECTED` | `INACTIVE` | `HISTORICALLY_VERIFIED` | `LIVE_REQUIRED` |
| `mcf.capability.registry.read` | `READ_ONLY`     | `AUTHORIZED`     | `CONNECTED`    | `ACTIVE`   | `VERIFIED`              | `LIVE_REQUIRED` |
| `mcf.context.recovery.read`    | `READ_ONLY`     | `AUTHORIZED`     | `CONNECTED`    | `ACTIVE`   | `VERIFIED`              | `LIVE_REQUIRED` |

O `PASS` não promove evidência histórica a current. Em especial, G2-A remoto permanece `UNKNOWN` e
G2-B permanece `BLOCKED`; ambos continuam desconectados e exigem evidência live e autorização
própria antes de qualquer mudança operacional.

## Diff-guard e cleanup

O diff-guard `efe5164290d56f22023f07de073e2ad7c027fb95` →
`2dc4584c4be186b5cdf131105b810610a9cf620a` confirmou zero mudanças nos serviços de recovery e
Registry, contratos ou `schemas/context`. Entre esses SHAs mudaram somente Capsule, README,
documentação e dois testes de Context.

O gate usou Node `v24.18.0`, pnpm `11.17.0` e o `tsx` fixado pelo lockfile. O diretório temporário e
seus quatro worktrees foram removidos após o run; os quatro worktrees-fonte continuaram limpos.

Esta página é a evidência versionada do run. Os Receipts não foram persistidos por design; suas
identidades e invariantes relevantes estão registradas acima.
