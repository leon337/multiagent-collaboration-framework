# MCF — Multiagent Collaboration Framework

O **MCF** é um framework para coordenação governada de agentes de IA, com papéis explícitos, seleção por competência, execução rastreável, handoffs, skills versionadas, runtime persistente, evidência verificável, recuperação de falhas e gates de autoridade.

> **Estado documental:** o mapa canônico está em [`docs/MCF-CURRENT-STATE.md`](docs/MCF-CURRENT-STATE.md). Branch heads, `latest`, estados de PR/Issue, workflows, metadados mutáveis de Release e SHAs/status reportados por providers são valores voláteis e devem ser lidos no GitHub/provider live.

## O que existe hoje

### `CURRENT_IMPLEMENTED`

O MCF possui runtime executável, não apenas metodologia documental.

Código principal:

```text
apps/rede-social-agentes/apps/server/src/mcf-runtime/
```

A aplicação hospedeira está em [`apps/rede-social-agentes/`](apps/rede-social-agentes/) e usa Node.js/pnpm, API, web, worker, PostgreSQL e workflows de validação/deploy.

Fluxo técnico simplificado:

```text
objetivo / missão
      ↓
MissionRuntime + persistência
      ↓
Skill registry + planner
      ↓
Human Delegation Firewall / Permission Engine
      ↓
Skill Executor / External Action Dispatcher
      ↓
adapter interno ou externo
      ↓
Evidence Validator + receipts + event ledger
      ↓
handoff / CAF / gate / checkpoint
```

Capacidades comprovadas incluem:

- missões, fases, eventos, receipts e handoffs persistentes;
- hierarquia missão-pai/submissão;
- Human Delegation Firewall e perfis de permissão;
- dispatcher de ações externas e adapters com evidência verificável;
- **16 skills registradas, 16 executáveis, 0 apenas documentais** no lineage qualificado;
- leitura de revisão de código e CI;
- escrita GitHub reversível e gates operacionais governados;
- staging com verificação de SHA, readiness/version e recovery por redeploy;
- observabilidade de missões bloqueadas;
- Production Readiness automatizado;
- produção pública materializada;
- promoção de produção governada por autorização persistida + gate operacional + SHA exato;
- `main` protegida e produção desacoplada de alterações comuns no branch.

Fontes: [`docs/runtime/`](docs/runtime/), [`skills/registry.yaml`](skills/registry.yaml), [`artifacts/phases/`](artifacts/phases/) e [workflows](.github/workflows/).

## Estado reconciliado

Snapshot documental reconciliado em 2026-08-20:

```yaml
current_reconciliation:
  main: 1a1e57208991db87bb3bac9267e29706caae7243
  main_protected: true

durable_release_identity:
  stable_v1_0_0: v1.0.0@7f741e10d0e745a90c732e084400b11e3f5e6794
  stable_v1_1_0: v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
  latest_release_metadata: READ_GITHUB_LIVE

production_snapshot:
  rsa_api_free:
    auto_deploy: off
    reported_commit: 439da7b6479718f6545144954937b8c4358d7c46
  rsa_web_free:
    auto_deploy: off
    reported_commit: 439da7b6479718f6545144954937b8c4358d7c46
  promotion_model: GOVERNED_EXACT_SHA
```

Esse snapshot é evidência datada, não uma promessa de valores futuros. Sempre releia o estado live para decisões operacionais.

O tag `v1.1.0` resolve para o SHA exato `5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`. A identidade de release não deve ser confundida com o HEAD atual de `main` nem com o commit atualmente executado pelo provider.

## Governança de produção

Produção **não acompanha mais `main` automaticamente**.

Fluxo atual:

```text
branch
  ↓
PR + CI + gates aplicáveis
  ↓
merge em main
  ↓
nenhum deploy automático

necessidade de produção
  ↓
autorização canônica de LEANDRO para boundary/SHA
  +
gate operacional persistido de LÉO
  +
SHA exato
  ↓
workflow governado
  ↓
provider + health/readiness + evidência
```

Invariantes centrais:

- `HUMAN_AUTHORITY != HUMAN_OPERATION`;
- LEANDRO não é executor técnico padrão;
- `MERGE_OR_MAIN_UPDATE != PRODUCTION_AUTHORIZATION`;
- `MAIN_UPDATE != PRODUCTION_DEPLOY`;
- `CI_GREEN != PRODUCTION_AUTHORIZATION`;
- `DISPATCH_INPUT != AUTHORIZATION_PROOF`;
- `EXACT_SHA_BINDING = REQUIRED`.

A remediação foi integrada pelo PR #145 e resolveu a Issue #140. O PR #143 foi encerrado sem merge por ter sido substituído pela implementação limpa baseada no `main` atual.

Arquivos principais:

- [`.github/workflows/mcf-runtime-production-deploy.yml`](.github/workflows/mcf-runtime-production-deploy.yml)
- [`render.yaml`](render.yaml)
- [`production-authorization.service.ts`](apps/rede-social-agentes/apps/server/src/mcf-runtime/production-authorization.service.ts)
- [`render-production-promotion.adapter.ts`](apps/rede-social-agentes/apps/server/src/mcf-runtime/render-production-promotion.adapter.ts)

## Governança e agentes

- **LEANDRO** — autoridade humana final; não é agente do MCF.
- **LÉO** — agente com autoridade operacional delegada para continuidade e gates internos dentro do boundary vigente.
- **MESTRE** — orquestrador responsável pela condução da missão e exposição do fluxo.
- agentes especialistas — ativados conforme competência, risco e boundary.

Existem **29 agentes nomeados**, selecionados por competência. Essa composição descreve papéis/contratos do MCF; não prova 29 modelos cognitivos independentes em execução simultânea. LEANDRO não entra nessa contagem.

Protocolo operacional vigente:
[`docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`](docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md)

Princípios centrais:

- evidência antes de declaração de sucesso;
- ESEV para execução visível e verificável;
- CAF para falhas recuperáveis;
- PRF para fases Classe B/C;
- gates/reviews vinculados ao estado e SHA aplicável;
- LEANDRO não é operador técnico rotineiro;
- ação externa irreversível ou publicação relevante exige autoridade compatível com o boundary.

## Skills

O registro canônico está em [`skills/registry.yaml`](skills/registry.yaml).

```yaml
registered: 16
executable: 16
documental_only: 0
```

Skills atuais:

`MCF-START-MISSION`, `MCF-SELECT-AGENTS`, `MCF-RECOVER-CONTEXT`, `MCF-DEFINE-PRODUCT`, `MCF-DESIGN-EXPERIENCE`, `MCF-DESIGN-ARCHITECTURE`, `MCF-IMPLEMENT-CHANGE`, `MCF-REVIEW-CODE`, `MCF-RUN-TESTS`, `MCF-GIT-PR-RELEASE`, `MCF-DEPLOY-VALIDATE`, `MCF-TRACE-MISSION`, `MCF-EVALUATE-AGENTS`, `MCF-SECURITY-REVIEW`, `MCF-DEBUG-INCIDENT` e `MCF-CLOSE-PHASE`.

## Releases e marcos

| Marco                                | Classificação                        | Estado                  |
| ------------------------------------ | ------------------------------------ | ----------------------- |
| Runtime persistente / evidence model | `CURRENT_IMPLEMENTED`                | integrado               |
| Gate C — provider write              | `HISTORICAL` + capacidade preservada | concluído               |
| Gate D — staging/deploy              | `HISTORICAL` + capacidade preservada | concluído               |
| Gate E                               | `HISTORICAL`                         | concluído               |
| `v1.0.0-RC1`                         | `HISTORICAL`                         | prerelease preservada   |
| `v1.0.0-RC2`                         | `HISTORICAL`                         | prerelease preservada   |
| `v1.0.0-RC3`                         | `HISTORICAL` + identidade preservada | `7f741e10…`             |
| `v1.0.0`                             | identidade durável                   | `7f741e10…`             |
| `v1.1.0`                             | identidade durável                   | `5d79f488…`             |
| governança de produção pós-v1.1      | `CURRENT_IMPLEMENTED`                | #140 resolvida via #145 |

`latest` e metadados mutáveis da página de Release devem ser lidos live.

Detalhes históricos: [`CHANGELOG.md`](CHANGELOG.md), [`docs/releases/`](docs/releases/) e [`docs/decisions/`](docs/decisions/).

## Arquitetura em evolução

O checkpoint [`docs/architecture/ARCHITECTURAL_CHECKPOINT_004.md`](docs/architecture/ARCHITECTURAL_CHECKPOINT_004.md) continua uma arquitetura draft, não canônica e sem autorização de implementação.

ZRCL, Context Fabric, Truth Contracts, Capability Registry, Artifact System e Validation Suite devem ser classificados conforme evidência real do componente; a existência de documentos/propostas não transforma automaticamente esse conjunto em arquitetura canônica implementada.

### Integração do ecossistema em laboratório

O CF-0/CF-1 mínimo foi mergeado no `main` pelo PR #153. A branch
`codex/ecosystem-context-integration` acrescenta Registry/Capsules dos quatro projetos,
recuperação read-only, freshness Git local, Capability Registry e um E2E real pré-hardening da
ponte MCF → Cognitive Ledger sem API paga. O contrato final do adapter Ledger — três operações,
token ingress próprio e E2E pelo `AppModule` — ainda está em revisão. Cognitive Ledger PR #2,
TriView PR #77 e Cloud PR #26 foram mergeados em seus targets seguros de design/release/lab.

A ponte **real** MCF → Cloud ainda está em andamento: os 396/396 testes Cloud e 13/13 marcadores
com fixture não devem ser chamados de conexão real do MCF. O hardening Ledger também precisa de
SHA/E2E finais. G2-B permanece inativo. Nada dessa integração autoriza produção, VPS/NODE-01,
escrita externa ou R7 ampla.

Veja o [roadmap visual](docs/MCF-ECOSYSTEM-INTEGRATION-ROADMAP.html) e o
[handoff factual](docs/integrations/MCF-ECOSYSTEM-PARALLEL-HANDOFF-20260823.md).

## Mission Control

A Issue #141 permanece em `DISCOVERY_IN_PROGRESS` com `implementation_authorized: false`.

O Mission Control deve permanecer separado do Execution Plane e não pode se tornar segunda fonte de verdade. Discovery/alinhamento não autoriza implementação por si só.

## Governance Evolution v2

O PR #142 permanece `OPEN / DRAFT / NOT_CURRENT / NOT_IMPLEMENTATION_AUTHORIZED`.

Design autorizado de GOV-0/GOV-1 não equivale a autorização de merge, runtime, schema, metodologia, release ou produção.

## Experimentos

### `telefone-sem-fio-001` — `EXPERIMENTAL`

O experimento encontrou evidência positiva de preservação/handoff no protocolo testado. A ressalva metodológica é obrigatória: **os papéis foram executados no mesmo ChatGPT**, portanto o resultado não comprova independência cognitiva real entre agentes.

Fonte: [`experimentos/telefone-sem-fio-001/RESULTADO_FINAL.md`](experimentos/telefone-sem-fio-001/RESULTADO_FINAL.md).

## Mapa rápido

| Pergunta                        | Fonte                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Qual é o estado atual?          | [`docs/MCF-CURRENT-STATE.md`](docs/MCF-CURRENT-STATE.md) + GitHub/provider live                                  |
| Onde está o runtime?            | [`apps/rede-social-agentes/apps/server/src/mcf-runtime/`](apps/rede-social-agentes/apps/server/src/mcf-runtime/) |
| Como o runtime é documentado?   | [`docs/runtime/README.md`](docs/runtime/README.md)                                                               |
| Quais skills existem?           | [`skills/registry.yaml`](skills/registry.yaml)                                                                   |
| Quem são os agentes?            | [`docs/agentes/README.md`](docs/agentes/README.md)                                                               |
| Qual é o protocolo operacional? | [`docs/protocols/`](docs/protocols/)                                                                             |
| Onde estão as decisões?         | [`docs/decisions/`](docs/decisions/)                                                                             |
| Onde está a governança?         | [`docs/governanca/`](docs/governanca/)                                                                           |
| Onde estão PRFs/evidências?     | [`artifacts/phases/`](artifacts/phases/) e [`docs/evidence/`](docs/evidence/)                                    |
| Qual é o histórico de releases? | [`CHANGELOG.md`](CHANGELOG.md) e [`docs/releases/`](docs/releases/)                                              |
| Onde estão experimentos?        | [`experimentos/`](experimentos/)                                                                                 |
| Onde estão propostas?           | [`docs/proposals/`](docs/proposals/) e branches de planning                                                      |
| Qual é o índice completo?       | [`docs/README.md`](docs/README.md)                                                                               |

## Regra de continuidade

Antes de afirmar estado atual de branch, SHA, PR, Issue, workflow, produção, `latest`, Release ou deploy:

1. leia a instrução atual de LEANDRO;
2. consulte GitHub/provider live;
3. use [`docs/MCF-CURRENT-STATE.md`](docs/MCF-CURRENT-STATE.md) como mapa;
4. confira código/testes/workflows/evidências do boundary ativo;
5. nunca inferir produção a partir do HEAD de `main`.
