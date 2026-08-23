# MCF — Estado Atual e Mapa de Verdade

**Classificação:** `CURRENT_IMPLEMENTED` + `CURRENT_CANONICAL_DOCUMENTATION`  
**Natureza:** mapa canônico de orientação; valores voláteis devem ser confirmados no GitHub/provider live  
**Reconciliação:** 2026-08-23  
**Baseline live anterior à MCF-DEC-053:** `main@f52485d2bff004df2f1c6b1eb787575d9ad5a8fc`

## 1. Regra de fonte de verdade

Este arquivo é o ponto de entrada documental para retomar o MCF. Ele não substitui leituras live de branch heads, PRs, Issues, workflows, releases nem providers.

Em caso de divergência, use esta ordem:

1. instrução explícita atual de LEANDRO;
2. GitHub/provider live;
3. código, testes, workflows e evidências do SHA aplicável;
4. decisões e protocolos vigentes;
5. documentos históricos.

Classificações:

- `CURRENT_IMPLEMENTED` — existe e possui evidência verificável no runtime/boundary descrito;
- `CURRENT_CANONICAL_DOCUMENTATION` — decisão/contrato canônico, podendo possuir implementação parcial explicitamente declarada;
- `EXPERIMENTAL` — experimento, sem equivaler a capacidade geral;
- `PLANNED` — boundary formal previsto, ainda não materializado;
- `UNDER_STUDY` — discovery/proposta sem autorização de implementação;
- `HISTORICAL` — verdade preservada de um boundary anterior;
- `SUPERSEDED` — substituído por decisão/evidência posterior.

## 2. Snapshot reconciliado de produção/runtime

O snapshot de produção reconciliado em 2026-08-20 permanece evidência histórica datada:

```yaml
reconciled_snapshot_2026_08_20:
  main:
    sha: 1a1e57208991db87bb3bac9267e29706caae7243
    protected: true
    production_auto_deploy_equivalence: false

  durable_release_identity:
    stable_v1_0_0: v1.0.0@7f741e10d0e745a90c732e084400b11e3f5e6794
    stable_v1_1_0: v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
    latest_release_metadata: READ_GITHUB_LIVE

  production:
    rsa_api_free:
      auto_deploy: off
      reported_commit: 439da7b6479718f6545144954937b8c4358d7c46
    rsa_web_free:
      auto_deploy: off
      reported_commit: 439da7b6479718f6545144954937b8c4358d7c46
    promotion_model: GOVERNED_EXACT_SHA
    github_environment: production
    environment_branch_boundary: main_only
```

Qualquer valor mutável deve ser relido quando uma nova missão começar.

### Evidência de separação entre `main` e produção

```text
MAIN_UPDATE != PRODUCTION_AUTHORIZATION
MAIN_UPDATE != PRODUCTION_DEPLOY
CI_GREEN != PRODUCTION_AUTHORIZATION
```

Produção não deve acompanhar `main` automaticamente. Uma promoção é ação separada, governada e vinculada a SHA exato.

## 3. Identidades duráveis de release

```yaml
durable_release_identity:
  rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
  stable_v1_0_0: v1.0.0@7f741e10d0e745a90c732e084400b11e3f5e6794
  stable_v1_1_0: v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
```

Metadados mutáveis da página de Release e o conceito de `latest` continuam sendo leitura live.

## 4. O que o MCF é hoje

O MCF possui duas camadas complementares:

1. **governança e coordenação** — papéis, autoridade, gates, PRFs, handoffs, CAF, Human Delegation Firewall e evidência rastreável;
2. **runtime executável** — persistência de missões/fases/eventos/receipts, skills executáveis, adapters externos, dispatcher, reconciliação, observabilidade e integrações de CI/deploy/GitHub.

Runtime principal:

`apps/rede-social-agentes/apps/server/src/mcf-runtime/`

Aplicação hospedeira:

`apps/rede-social-agentes/`

## 5. Capacidades atuais comprovadas

### `CURRENT_IMPLEMENTED`

- missões, fases, eventos, handoffs e receipts persistentes;
- hierarquia missão-pai/submissão;
- Human Delegation Firewall e perfis de permissão;
- External Action Dispatcher e adapters com evidência;
- **16 skills executáveis** no `SkillExecutor`;
- leitura de revisão de código e CI;
- escrita GitHub reversível e gates operacionais governados;
- staging com verificação de SHA/readiness/version e recovery por redeploy de SHA saudável;
- observabilidade de missões bloqueadas;
- Production Readiness automatizado;
- produção pública materializada;
- health monitoring de produção;
- promoção de produção governada por autorização persistida + LÉO gate operacional + SHA exato;
- `main` protegida por ruleset;
- provider de produção desacoplado de alterações comuns em `main` por Auto-Deploy OFF.

### `CURRENT_CANONICAL_DOCUMENTATION` — MCF-DEC-053

```yaml
organization:
  roster_named_agents: 49
  human_authority_counted_as_agent: false
  canonical_matrix: docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-49-AGENTES.md
  individual_contracts: 49

skills:
  registered: 22
  executable: 16
  documental_only: 6

new_divisions:
  design_and_experience_engineering:
    lead: Evelyn
  ai_and_model_systems:
    technical_lead: Tiago

runtime_extension_for_new_skill_ids: PENDING_NOT_CLAIMED
```

As seis novas skills registradas por MCF-DEC-053 são documentais enquanto não forem adicionadas explicitamente ao `SkillExecutor` com evidência e testes. Registrar a skill no YAML não prova execução.

## 6. Governança de produção atual

Fluxo esperado:

```text
mudança em branch
    ↓
PR + CI + revisão/gates aplicáveis
    ↓
merge em main
    ↓
NENHUM deploy automático

necessidade real de produção
    ↓
autorização humana canônica de LEANDRO para boundary/SHA
    +
gate operacional persistido de LÉO
    +
SHA exato
    ↓
workflow de promoção governada
```

Invariantes atuais:

- `HUMAN_AUTHORITY != HUMAN_OPERATION`;
- LEANDRO não é operador técnico rotineiro;
- `MERGE_OR_MAIN_UPDATE != PRODUCTION_AUTHORIZATION`;
- `CI_GREEN != PRODUCTION_AUTHORIZATION`;
- `DISPATCH_INPUT != AUTHORIZATION_PROOF`;
- `EXACT_SHA_BINDING = REQUIRED`;
- sem autorização canônica persistida, a promoção falha fechada;
- sem gate operacional aplicável de LÉO, a promoção falha fechada.

## 7. Agentes e skills

A composição documental oficial contém **49 agentes nomeados**. LEANDRO é a autoridade humana final e não entra nessa contagem.

Fontes vigentes:

- `docs/agentes/README.md`
- `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-49-AGENTES.md`
- `docs/decisions/MCF-DEC-053-EXPANSAO-ORGANIZACIONAL-PARA-49-AGENTES.md`
- `skills/registry.yaml`

Fontes históricas preservadas:

- `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-29-AGENTES.md`
- MCF-DEC-050 na parte de composição anterior.

Papéis centrais:

- **LEANDRO** — autoridade humana final;
- **LÉO** — autoridade operacional delegada nos boundaries permitidos;
- **MESTRE** — orquestração da missão;
- **Evelyn** — liderança de Design & Experience Engineering;
- **Tiago** — liderança técnica de AI & Model Systems;
- especialistas — selecionados dinamicamente por competência e risco.

A cobertura de AI & Model Systems é explicitamente global/provider-neutral e inclui ecossistemas asiáticos, open weights, free APIs, routers, protocolos, self-hosting, harnesses e benchmarks quando material à missão.

## 8. Arquitetura em evolução

O arquivo `docs/architecture/ARCHITECTURAL_CHECKPOINT_004.md` permanece explicitamente:

```yaml
status: DRAFT_ARCHITECTURE
canonical: false
implementation_authorized: false
```

As ideias de ZRCL, Capability Registry, Artifact System e Validation Suite podem existir como discovery/design/fundação documental sem equivaler a uma nova arquitetura canônica implementada.

### Context Fabric CF-0 + CF-1 mínimo

O boundary previamente registrado de CF-0/CF-1 mantém sua classificação própria. MCF-DEC-053 não altera automaticamente Context Fabric, produção, schemas, provider state ou release.

## 9. Mission Control

Issue #141 e qualquer estado mutável relacionado devem ser lidos live antes de afirmação operacional. Discovery/alinhamento não autoriza implementação por si só.

## 10. Governance Evolution v2

O estado de PRs de governança é volátil e deve ser lido live. Design autorizado não equivale automaticamente a autorização de merge, schema, runtime, metodologia, release ou produção.

## 11. Limitações e cuidados

- `main`, `latest`, PRs, Issues, workflow runs e provider state são voláteis;
- identidade de tag/release não é sinônimo de produção atual;
- produção pode reportar SHA diferente de `main` por design;
- **49 contratos de agentes não provam 49 processos cognitivos independentes simultâneos**;
- as seis novas skills de MCF-DEC-053 estão registradas, mas **NÃO EXECUTÁVEIS** no runtime atual;
- ferramentas listadas para skills documentais não concedem permissão nem execução;
- propostas/discovery não são implementação;
- claims de provider, benchmark ou free tier permanecem NÃO VERIFICADOS para uso operacional até evidência própria compatível.

## 12. Mapa documental

- porta pública: `README.md`
- estado atual: `docs/MCF-CURRENT-STATE.md`
- índice documental: `docs/README.md`
- runtime: `docs/runtime/` + `apps/rede-social-agentes/apps/server/src/mcf-runtime/`
- governança: `docs/governanca/`, `docs/protocols/`, `docs/decisions/`
- agentes: `docs/agentes/` e `docs/matrices/`
- skills: `skills/registry.yaml`
- releases: `docs/releases/` + GitHub tags/releases live
- evidências/PRFs: `artifacts/phases/`, `docs/evidence/`, `docs/audits/`, `docs/auditoria/`
- propostas/discovery: `docs/proposals/` e branches de planejamento

## 13. Regra de continuidade

Ao retomar o projeto:

1. leia a instrução atual de LEANDRO;
2. consulte GitHub/provider live;
3. leia este mapa;
4. identifique o boundary/missão ativos;
5. confira código, testes, workflows e evidências do SHA aplicável;
6. mantenha skills documentais como não executáveis até runtime/testes comprovarem o contrário;
7. mantenha propostas não implementadas como `PLANNED` ou `UNDER_STUDY`;
8. nunca inferir produção a partir de `main` — leia o provider e o boundary de autorização separadamente.
