# Documentação do MCF

Este diretório reúne documentação normativa, operacional, histórica, experimental e de release do **MCF — Multiagent Collaboration Framework**.

## Comece por aqui

1. [`MCF-CURRENT-STATE.md`](MCF-CURRENT-STATE.md) — mapa reconciliado de identidades duráveis e estado operacional volátil.
2. [`../README.md`](../README.md) — visão pública do framework e localização do runtime executável.
3. [`runtime/README.md`](runtime/README.md) — arquitetura/runtime executável, skills, adapters e evidências.
4. [`protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`](protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md) — protocolo operacional vigente.
5. [`agentes/README.md`](agentes/README.md) — composição documental dos **49 agentes nomeados**.
6. [`matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-49-AGENTES.md`](matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-49-AGENTES.md) — matriz vigente após MCF-DEC-053.
7. [`../CHANGELOG.md`](../CHANGELOG.md) — marcos históricos verificáveis.

Para valores voláteis — branch head, SHA de branch, estado de PR/Issue, `latest`, metadados mutáveis de Release, workflow e SHA reportado por deploy — **GitHub/provider live prevalece sobre qualquer snapshot documental**.

## Classificação de informação

- `CURRENT_IMPLEMENTED` — existe no código/infraestrutura e possui evidência verificável;
- `CURRENT_CANONICAL_DOCUMENTATION` — decisão/contrato canônico cuja implementação pode ser parcial e deve ser declarada;
- `EXPERIMENTAL` — evidência limitada a experimento;
- `PLANNED` — boundary previsto, ainda não materializado;
- `UNDER_STUDY` — hipótese/discovery sem autorização de implementação;
- `HISTORICAL` — estado verdadeiro de um boundary passado;
- `SUPERSEDED` — regra/afirmação substituída por decisão ou evidência posterior.

Documentos históricos não devem ser interpretados como estado live.

## Runtime e capacidades executáveis

Código atual:

`../apps/rede-social-agentes/apps/server/src/mcf-runtime/`

Documentação:
- [`runtime/`](runtime/)
- [`../skills/registry.yaml`](../skills/registry.yaml)
- [`../artifacts/phases/`](../artifacts/phases/)
- [`../.github/workflows/`](../.github/workflows/)

Estado após MCF-DEC-053:

```yaml
skills:
  registered: 22
  executable: 16
  documental_only: 6
agents:
  named: 49
```

As seis novas skills especializadas estão registradas documentalmente; o `SkillExecutor` continua aceitando os 16 IDs implementados. Registro YAML não equivale a execução.

## Governança e autoridade

Fontes atuais mais relevantes:
- [`protocols/`](protocols/) — protocolos operacionais vigentes;
- [`decisions/`](decisions/) — decisões e boundaries;
- [`governanca/`](governanca/) — fundação normativa e materiais de governança;
- [`agentes/`](agentes/) e [`matrices/`](matrices/) — contratos e competências.

LEANDRO é a autoridade humana final e não é agente. LÉO é agente distinto com autoridade operacional delegada dentro do boundary vigente. MESTRE atua como orquestrador responsável pela missão.

### MCF-DEC-053 — expansão organizacional

A composição vigente adiciona duas divisões especializadas:

- **Design & Experience Engineering**, liderada por Evelyn;
- **AI & Model Systems**, liderada tecnicamente por Tiago.

O roster total é de 49 agentes, com seleção dinâmica. Ter 49 contratos não significa executar 49 agentes em toda missão e não prova 49 processos cognitivos independentes.

## Releases, readiness e produção

- [`releases/`](releases/) — documentação histórica de releases;
- workflows e estado de produção devem ser consultados live quando a missão depender deles.

Identidades duráveis conhecidas continuam separadas de estado live de `main`/provider:

```yaml
durable_release_identity:
  rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
  stable_v1_0_0: v1.0.0@7f741e10d0e745a90c732e084400b11e3f5e6794
  stable_v1_1_0: v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
live_github_state:
  release_metadata: READ_GITHUB_LIVE
  latest: READ_GITHUB_LIVE
```

## Auditorias e evidências

- [`auditoria/`](auditoria/) — auditoria/remediação histórica;
- [`audits/`](audits/) — auditorias independentes específicas;
- [`evidence/`](evidence/) — evidências documentais;
- [`../artifacts/phases/`](../artifacts/phases/) — PRFs/checkpoints/validações.

## Experimentos

`../experimentos/telefone-sem-fio-001/` é `EXPERIMENTAL`.

O experimento fornece evidência positiva de preservação/handoff no protocolo testado, mas **não comprova independência cognitiva real**, pois os papéis foram executados no mesmo ChatGPT.

## Propostas e NextGen

Materiais de `proposals/` e branches de planning permanecem com a classificação declarada em seus próprios boundaries. Ideias de memória, routing, gateways, caching, VPS ou novas camadas não devem ser anunciadas como capacidade atual sem evidência no runtime vigente.

## Índice por domínio

| Domínio | Local |
|---|---|
| Estado atual | `MCF-CURRENT-STATE.md` |
| Runtime | `runtime/` |
| Protocolos | `protocols/` |
| Decisões | `decisions/` |
| Agentes | `agentes/`, `matrices/` |
| Skills | `../skills/registry.yaml` |
| Governança | `governanca/` |
| Auditoria | `auditoria/`, `audits/` |
| Releases | `releases/` + GitHub Releases |
| Runbooks | `runbooks/` |
| Projetos | `projects/` |
| Evidências | `evidence/`, `../artifacts/phases/` |
| Experimentos | `../experimentos/`, `experimentos/` |
| Propostas/discovery | `proposals/`, branches de planejamento |

## Regra de continuidade

Ao retomar uma missão, não use este índice como prova de estado live. Consulte GitHub/provider, depois `MCF-CURRENT-STATE.md`, a decisão/PRF do boundary ativo e o código/testes/workflows pertinentes.