# Documentação do MCF

Este diretório reúne documentação normativa, operacional, histórica, experimental e de release do **MCF — Multiagent Collaboration Framework**.

## Comece por aqui

1. [`MCF-CURRENT-STATE.md`](MCF-CURRENT-STATE.md) — snapshot reconciliado do estado atual e mapa de fontes.
2. [`../README.md`](../README.md) — visão pública do framework e localização do runtime executável.
3. [`runtime/README.md`](runtime/README.md) — arquitetura/runtime executável, skills, adapters e evidências.
4. [`protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`](protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md) — protocolo operacional vigente.
5. [`agentes/README.md`](agentes/README.md) — composição documental dos 29 agentes nomeados.
6. [`../CHANGELOG.md`](../CHANGELOG.md) — marcos históricos verificáveis.

Para valores voláteis — branch, SHA, PR, Issue, workflow, deploy, tag ou release — **GitHub live prevalece sobre qualquer snapshot documental**.

## Classificação de informação

A reconciliação usa explicitamente:

- `CURRENT_IMPLEMENTED` — existe no código/infraestrutura e possui evidência verificável;
- `EXPERIMENTAL` — evidência limitada a experimento, sem generalização automática;
- `PLANNED` — boundary/atividade formalmente prevista e ainda não materializada;
- `UNDER_STUDY` — hipótese/discovery sem autorização de implementação;
- `HISTORICAL` — estado verdadeiro de um boundary passado;
- `SUPERSEDED` — regra/afirmação substituída por decisão ou evidência posterior.

Documentos antigos podem conter SHAs, `BLOCKED`, “próximo boundary” ou autoridades que eram corretos no momento de emissão. Quando classificados como `HISTORICAL`, eles não devem ser interpretados como estado live.

## Runtime e capacidades executáveis

Código atual:

`../apps/rede-social-agentes/apps/server/src/mcf-runtime/`

Documentação:
- [`runtime/`](runtime/)
- [`../skills/registry.yaml`](../skills/registry.yaml)
- [`../artifacts/phases/`](../artifacts/phases/)
- [`../.github/workflows/`](../.github/workflows/)

Estado reconciliado: 16 skills registradas, 16 executáveis e 0 somente documentais; Gate C, Gate D e Gate E são boundaries concluídos; produção foi concluída posteriormente; RC1/RC2/RC3 estão preservadas; `v1.0.0` estável ainda não foi publicada.

## Governança e autoridade

Fontes atuais mais relevantes:
- [`protocols/`](protocols/) — protocolos operacionais vigentes;
- [`decisions/`](decisions/) — decisões e boundaries, incluindo MCF-DEC-050 a MCF-DEC-064;
- [`governanca/`](governanca/) — fundação normativa e materiais de governança, alguns preservados como baseline histórico;
- [`agentes/`](agentes/) e [`matrices/`](matrices/) — contratos e competências.

LEANDRO é a autoridade humana final e não é agente. LÉO é agente distinto com autoridade operacional delegada dentro do boundary vigente. MESTRE atua como orquestrador responsável pela missão.

## Releases, readiness e produção

- [`releases/`](releases/) — documentação de RC1, RC2 e RC3;
- [`decisions/MCF-DEC-062-GATE-E-RELEASE-CANDIDATE.md`](decisions/MCF-DEC-062-GATE-E-RELEASE-CANDIDATE.md) — Gate E / RC1 (`HISTORICAL`);
- [`decisions/MCF-DEC-063-PRODUCTION-READINESS-POST-RC1.md`](decisions/MCF-DEC-063-PRODUCTION-READINESS-POST-RC1.md) — Production Readiness/produção (`HISTORICAL` com capacidades preservadas);
- [`decisions/MCF-DEC-064-QUALIFICACAO-DA-RELEASE-ESTAVEL-V1.0.0.md`](decisions/MCF-DEC-064-QUALIFICACAO-DA-RELEASE-ESTAVEL-V1.0.0.md) — boundary stable em execução;
- [`../.github/workflows/mcf-production-readiness.yml`](../.github/workflows/mcf-production-readiness.yml) e health monitor — automação atual.

`v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794` é a candidata qualificada do snapshot reconciliado. `v1.0.0` continua não publicada e sujeita ao HUMAN_GATE de LEANDRO.

## Auditorias e evidências

- [`auditoria/`](auditoria/) — auditoria/remediação v0.1, preservada como `HISTORICAL`;
- [`audits/`](audits/) — auditorias independentes específicas;
- [`evidence/`](evidence/) — evidências documentais quando aplicável;
- [`../artifacts/phases/`](../artifacts/phases/) — PRFs/checkpoints/validações das fases mais recentes.

Não presuma que `docs/audits/` centraliza todas as auditorias posteriores: evidências recentes também vivem nos PRFs, reviews e artifacts de cada boundary.

## Experimentos

`../experimentos/telefone-sem-fio-001/` é `EXPERIMENTAL`.

O experimento fornece evidência positiva de preservação/handoff no protocolo testado, mas **não comprova independência cognitiva real**, pois os papéis foram executados no mesmo ChatGPT.

## Propostas e NextGen

- [`proposals/`](proposals/) contém propostas disponíveis na branch corrente;
- a branch `planning/mcf-nextgen-discovery` contém discovery pós-Fase-Zero.

O material NextGen está `UNDER_STUDY`: arquitetura formalmente aprovada = false; implementação/protótipo autorizados = false no checkpoint de discovery. Ideias de Project Capsule, novas camadas de memória, model routing, DAG/paralelismo, Interaction Center, gateways, caching/rate limiting, VPS e outras propostas não devem ser anunciadas como capacidade atual sem evidência independente no runtime vigente.

## Índice por domínio

| Domínio | Local |
|---|---|
| Estado atual | `MCF-CURRENT-STATE.md` |
| Runtime | `runtime/` |
| Protocolos | `protocols/` |
| Decisões | `decisions/` |
| Agentes | `agentes/`, `matrices/` |
| Governança | `governanca/` |
| Auditoria | `auditoria/`, `audits/` |
| Releases | `releases/` |
| Runbooks | `runbooks/` |
| Projetos | `projects/` |
| Evidências | `evidence/`, `../artifacts/phases/` |
| Experimentos | `../experimentos/`, `experimentos/` |
| Propostas/discovery | `proposals/`, branches de planejamento |

## Regra de continuidade

Ao retomar uma missão, não use este índice como prova de estado live. Consulte GitHub, depois o `MCF-CURRENT-STATE.md`, a decisão/PRF do boundary ativo e o código/testes/workflows pertinentes.
