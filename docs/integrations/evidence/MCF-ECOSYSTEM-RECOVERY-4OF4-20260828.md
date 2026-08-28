# MCF Ecosystem — evidência do recovery estrutural final 4/4

**Classificação:** `VERIFIED_READ_ONLY_EVIDENCE`
**Janela do recovery UTC:** `2026-08-28T18:11:17.344Z`–`2026-08-28T18:11:17.676Z`
**Automações pós-merge observadas até:** `2026-08-28T18:33:40Z`
**Resultado do recovery:** `PASS`
**Exit code do recovery:** `0`

## Objetivo e boundary

Este gate repetiu a recuperação estrutural depois do merge do roadmap/Capsule MCF e das
sincronizações documentais Cloud/TriView. Ele exercitou a `McfContextRecoveryApiService` real com
`recoverReadOnly(projectId, true)`, incluindo schemas, Registry, Capsule, proveniência e freshness
Git local.

O run não iniciou servidor, não persistiu Receipt, não conectou provider, não chamou VPS, não usou
SSH, não executou write, não publicou release e não invocou API de IA paga. O recovery não disparou
deploy nem qualquer ação material; automações normais do merge MCF são classificadas separadamente.

## Revisões congeladas

| Projeto              | Ref verificada                                           | SHA exato                                  |
| -------------------- | -------------------------------------------------------- | ------------------------------------------ |
| MCF                  | `refs/heads/main`                                        | `b2be8eeb1c6753bea912cca741803f8497ab880a` |
| Cloud Infrastructure | `refs/heads/mcf/mission-001-control-bridge-g1`           | `420ee7d26bc40159e3040a5319b16b21a6f02499` |
| Cognitive Ledger     | `refs/heads/docs/ecosystem-promotion-gate-sync-20260828` | `a3fc0d61737d4b0b55b265f34383c0e9b77d7334` |
| TriView Workspace    | `refs/heads/release/1.0.0a4`                             | `7b2440a64d6519515100911f486547480b5ab9aa` |

O Ledger foi deliberadamente verificado no head draft do PR #4: o target de design possui
auto-deploy Render documentado e não foi alterado. MCF, Cloud e TriView foram verificados em
worktrees detached dos respectivos merge SHAs. Os quatro worktrees estavam limpos e seus `HEAD`s
coincidiram com as revisões configuradas.

## Receipts validados

| Projeto                              | Receipt                                                 | Estado      | Read-only | Material | Evidence-only | Capsule/live SHA                           | Fontes | Claims | Warnings |
| ------------------------------------ | ------------------------------------------------------- | ----------- | --------: | -------: | ------------: | ------------------------------------------ | -----: | -----: | -------: |
| `cloud-infrastructure`               | `context-recovery-dea9fb1d-5cbc-4b7d-9f33-80238695f2a2` | `RECOVERED` |      true |    false |          true | `420ee7d26bc40159e3040a5319b16b21a6f02499` |      6 |     17 |        0 |
| `cognitive-ledger`                   | `context-recovery-47c4f659-1f24-4958-9afa-c959fece60d3` | `RECOVERED` |      true |    false |          true | `a3fc0d61737d4b0b55b265f34383c0e9b77d7334` |      6 |     17 |        0 |
| `multiagent-collaboration-framework` | `context-recovery-870444f4-1ca9-49fd-8a6b-2f4ef7cf439e` | `RECOVERED` |      true |    false |          true | `b2be8eeb1c6753bea912cca741803f8497ab880a` |      6 |     17 |        0 |
| `triview-workspace-linux`            | `context-recovery-b19698d4-236f-4dc3-888e-e4b18db6c27d` | `RECOVERED` |      true |    false |          true | `7b2440a64d6519515100911f486547480b5ab9aa` |      6 |     17 |        0 |

Cada Receipt contém quatro fontes `REGISTRY` revisionadas por
`b2be8eeb1c6753bea912cca741803f8497ab880a`, uma fonte `CAPSULE` revisionada pelo SHA próprio do
projeto e uma fonte `LIVE_VERIFICATION` no mesmo SHA. Não houve warning ou divergência entre Capsule
e revisão Git observada.

### Semântica do Capsule MCF congelado

O Capsule MCF recuperado em `b2be8eeb` conserva o estado
`ECOSYSTEM_REPOSITORY_ALIGNMENT_READY__LIVE_PROVIDER_VPS_RELEASE_AND_NEXTGEN_NX0_NOT_AUTHORIZED` e o
`observed_at=2026-08-28T18:00:44Z`: ele é a entrada pré-gate exata que esta prova recuperou. O estado
`REPOSITORY_ALIGNMENT_COMPLETE__LIVE_GATES_CLOSED` deste relatório é a conclusão posterior do gate,
não uma reescrita retroativa daquela entrada. Este closeout não altera `.mcf/project-capsule.yaml`;
qualquer sincronização futura do Capsule cria um novo snapshot e exige outro recovery 4/4 antes de
ser chamada de comprovada.

## Interpretação correta

O `PASS` prova que o MCF consegue reconstruir contexto estrutural coerente dos quatro repositórios
no snapshot congelado. Ele não prova conexão ou freshness operacional e não altera os gates:

- `cloud.context.local.read` e `cognitive-ledger.memory.read` continuam desconectados/inativos fora
  do laboratório;
- G2-A remoto continua não autorizado/desconectado e exige evidência live;
- G2-B continua não autorizado/desconectado/bloqueado, sem VPS, SSH ou write;
- Ledger PR #4 continua draft atrás do gate Render;
- TriView continua bloqueado por R7 físico e HUMAN_GATE;
- NextGen NX-0 continua proposto e não autorizado.

## Publicação estática do roadmap

O deployment Vercel do merge MCF `b2be8eeb` concluiu com sucesso sob o deployment GitHub
`6146231533`. O alias público
[`mcf-ecosystem-roadmap.vercel.app`](https://mcf-ecosystem-roadmap.vercel.app/) retornou HTTP 200 e
correspondeu byte a byte ao HTML do commit:

```text
sha256 fda91e3667d9bedf5535714e1c44b81b95611e8f62debc3508e374f65f65e0f7
bytes  121778
```

Essa publicação é uma página estática; não contém runtime, API, credencial ou autoridade para
executar qualquer gate.

## Automação de staging pós-merge

O merge alterou testes em `apps/rede-social-agentes/**`, portanto o workflow versionado de staging
foi disparado automaticamente pelo filtro de paths. O run
[`33198097882`](https://github.com/leon337/multiagent-collaboration-framework/actions/runs/33198097882)
passou configuração protegida, smoke descartável, formatação, lint, typecheck, migrations 2x, suíte
e build. Em seguida, a automação preexistente invocou o hook Render para uma tentativa real de
rollout em staging, mas o SHA `b2be8eeb1c6753bea912cca741803f8497ab880a` não foi confirmado
dentro do timeout de 20 minutos. O workflow terminou `failure` com resultado controlado `RECOVERED`,
`deployId=null`, `rollbackDeployId=null` e confirmação do SHA saudável anterior
`5c7f9832f037f374ec3fe2d4160342a5f2cf8a06`. IDs nulos não significam ausência de requisição ao
hook.

Os logs não registram uma causa mais específica que a ausência de convergência no tempo limite; por
isso esta evidência não atribui o incidente a código, Render ou rede. Não houve retry manual,
workflow dispatch, ação no runtime de produção ou VPS. A tentativa externa de staging foi efeito do
workflow preexistente acionado pelo merge; uma investigação ou nova promoção exige boundary
separado.

Os follow-ons automáticos de publicação
[`33198253757`](https://github.com/leon337/multiagent-collaboration-framework/actions/runs/33198253757)
e
[`33198253774`](https://github.com/leon337/multiagent-collaboration-framework/actions/runs/33198253774)
também não publicaram nem redirecionaram release. Os próprios logs os encerraram como `immutable
NOOP`: `v1.0.0-RC2` já permanecia em
`d73d936a63cc9462a95bcf481f4b8e1d4b255719` e `v1.0.0-RC3` em
`7f741e10d0e745a90c732e084400b11e3f5e6794`. O callback de staging
[`33199849384`](https://github.com/leon337/multiagent-collaboration-framework/actions/runs/33199849384)
foi `skipped`. Portanto, essas automações preexistentes não ampliaram o efeito material do merge.

## Validação antecedente

O conteúdo recuperado entrou no MCF pelo PR #186, merge
`b2be8eeb1c6753bea912cca741803f8497ab880a`, depois de sete verificações verdes: Documentation
Validation, Production Readiness, v1.1 Qualification, Container Smoke, Foundation, Vercel e Vercel
Preview Comments. Localmente, 28 testes focados, Prettier, ESLint, typecheck, links Markdown,
integridade HTML, schema/semântica do Capsule, `git diff --check` e scan dirigido de segredos
passaram.

Os Receipts são evidência efêmera desta execução e não foram persistidos como memória. Esta página
registra apenas suas identidades, revisões e invariantes auditáveis.
