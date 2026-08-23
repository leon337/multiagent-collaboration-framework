# MCF — Estado Atual e Mapa de Verdade

**Classificação:** `CURRENT_IMPLEMENTED`  
**Natureza:** mapa canônico de orientação; valores voláteis devem ser confirmados no GitHub/provider live  
**Reconciliação:** 2026-08-20  
**Reconciliação local adicional do boundary CF-0/CF-1:** 2026-08-23
**Baseline desta reconciliação:** `main@1a1e57208991db87bb3bac9267e29706caae7243`

## 1. Regra de fonte de verdade

Este arquivo é o ponto de entrada documental para retomar o MCF. Ele não substitui leituras live de branch heads, PRs, Issues, workflows, releases nem providers.

Em caso de divergência, use esta ordem:

1. instrução explícita atual de LEANDRO;
2. GitHub/provider live;
3. código, testes, workflows e evidências do SHA aplicável;
4. decisões e protocolos vigentes;
5. documentos históricos.

Classificações:

- `CURRENT_IMPLEMENTED` — existe e possui evidência verificável;
- `EXPERIMENTAL` — experimento, sem equivaler a capacidade geral;
- `PLANNED` — boundary formal previsto, ainda não materializado;
- `UNDER_STUDY` — discovery/proposta sem autorização de implementação;
- `HISTORICAL` — verdade preservada de um boundary anterior;
- `SUPERSEDED` — substituído por decisão/evidência posterior.

## 2. Snapshot reconciliado em 2026-08-20

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

  governance_remediation:
    issue_140: CLOSED_COMPLETED
    pr_143: CLOSED_SUPERSEDED_UNMERGED
    pr_145: MERGED
    merge_sha: 1a1e57208991db87bb3bac9267e29706caae7243

  active_nonimplementation_work:
    issue_141_mission_control: DISCOVERY_IN_PROGRESS_IMPLEMENTATION_FALSE
    pr_142_governance_v2: OPEN_DRAFT_NOT_CURRENT_NOT_IMPLEMENTATION_AUTHORIZED
```

O snapshot acima foi verificado durante `MCF-STABILIZATION-001`. Qualquer valor mutável deve ser relido quando uma nova missão começar.

### Evidência de separação entre `main` e produção

Após o merge do PR #145, `main` avançou de `439da7b6…` para `1a1e5720…`. Os dois serviços de produção permaneceram em `439da7b6…`, sem novo deploy. Isso fornece evidência live do invariante:

```text
MAIN_UPDATE != PRODUCTION_AUTHORIZATION
MAIN_UPDATE != PRODUCTION_DEPLOY
CI_GREEN != PRODUCTION_AUTHORIZATION
```

Produção não deve acompanhar `main` automaticamente. Uma promoção é uma ação separada, governada e vinculada a SHA exato.

## 3. Identidades duráveis de release

As identidades de release não devem ser confundidas com o HEAD atual de `main` ou com o SHA atualmente reportado pelo provider.

```yaml
durable_release_identity:
  rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
  stable_v1_0_0: v1.0.0@7f741e10d0e745a90c732e084400b11e3f5e6794
  stable_v1_1_0: v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
```

O tag `v1.1.0` foi reconciliado contra `5d79f488407c77f7b9f21ecfefb41ddfb3a52aef` e é idêntico a esse SHA. Metadados mutáveis da página de Release e o conceito de `latest` continuam sendo leitura live.

O snapshot de 2026-08-14 da publicação `v1.0.0` permanece `HISTORICAL`; ele não deve ser usado como estado atual de `main`, provider, PR ou Issue.

## 4. O que o MCF é hoje

O MCF é um framework multiagente com duas camadas complementares:

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
- 16 skills registradas, 16 executáveis, 0 somente documentais no lineage qualificado;
- leitura de revisão de código e CI;
- escrita GitHub reversível e gates operacionais governados;
- staging com verificação de SHA/readiness/version e recovery por redeploy de SHA saudável;
- observabilidade de missões bloqueadas;
- Production Readiness automatizado com dependency audit, lint/typecheck, migrations, testes, build e backup/restore isolado;
- produção pública materializada;
- health monitoring de produção;
- promoção de produção governada por autorização persistida + LÉO gate operacional + SHA exato;
- `main` protegida por ruleset;
- provider de produção desacoplado de alterações comuns em `main` por Auto-Deploy OFF;
- GitHub Environment `production` como boundary de execução de produção.

## 6. Governança de produção atual

O PR #145 substituiu o histórico divergente do PR #143 e resolveu a Issue #140.

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
    ↓
provider
    ↓
health/readiness/evidência/receipt
```

Invariantes atuais:

- `HUMAN_AUTHORITY != HUMAN_OPERATION`;
- LEANDRO não é operador técnico rotineiro;
- `MERGE_OR_MAIN_UPDATE != PRODUCTION_AUTHORIZATION`;
- `CI_GREEN != PRODUCTION_AUTHORIZATION`;
- `DISPATCH_INPUT != AUTHORIZATION_PROOF`;
- `EXACT_SHA_BINDING = REQUIRED`;
- sem autorização canônica persistida, a promoção falha fechada;
- sem gate operacional aplicável de LÉO, a promoção falha fechada;
- provider mutation só ocorre depois da resolução autorizada.

Arquivos principais:

- `.github/workflows/mcf-runtime-production-deploy.yml`
- `render.yaml`
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/production-authorization.service.ts`
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/render-production-promotion.adapter.ts`
- `apps/rede-social-agentes/ops/production-authorization-resolver.mjs`
- `apps/rede-social-agentes/ops/production-promotion-policy.mjs`

## 7. Agentes e skills

A composição documental oficial contém **29 agentes nomeados**. LEANDRO é a autoridade humana final e não entra nessa contagem.

Fontes:

- `docs/agentes/README.md`
- `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-29-AGENTES.md`
- `skills/registry.yaml`

Papéis centrais:

- **LEANDRO** — autoridade humana final;
- **LÉO** — autoridade operacional delegada nos boundaries permitidos;
- **MESTRE** — orquestração da missão;
- agentes especialistas — selecionados por competência e risco.

## 8. Arquitetura em evolução

O arquivo `docs/architecture/ARCHITECTURAL_CHECKPOINT_004.md` permanece explicitamente:

```yaml
status: DRAFT_ARCHITECTURE
canonical: false
implementation_authorized: false
```

As ideias de ZRCL, Capability Registry, Artifact System e Validation Suite podem existir como discovery/design/fundação documental sem equivaler a uma nova arquitetura canônica implementada.

Não promover esses componentes, nem a arquitetura integral do checkpoint, a `CURRENT_IMPLEMENTED` sem decisão e evidência próprias.

### Context Fabric CF-0 + CF-1 mínimo — boundary local em revisão

Em 2026-08-23, a implementação autorizada de CF-0 + CF-1 mínimo foi concluída e verificada na branch isolada `codex/mcf-context-fabric-cf0-cf1`, sobre o Gate 0 em `027405348bec031edae0ac756643979e93a94452`.

O boundary materializado contém somente:

- contratos públicos aditivos `McfContext*` e quatro JSON Schemas isolados;
- Registry canônico do MCF e Capsule local versionados no Git;
- loader YAML estritamente read-only, resolução determinística de projeto, Truth Contracts e reconciliação fail-closed;
- Context Recovery Receipt declaradamente `evidence_only`;
- testes de contrato, schema, fixture, loader, resolução, verdade e recuperação.

Estado preciso deste snapshot:

```yaml
context_fabric_cf0_cf1_minimum:
  local_branch_status: IMPLEMENTED_AND_LOCALLY_VERIFIED
  main_status: NOT_MERGED
  push_status: NOT_PUSHED
  production_status: NOT_AUTHORIZED_NOT_TOUCHED
  runtime_wiring: NONE
  provider_or_external_mutation: NONE
  database_or_cache_canonicalization: NONE
  live_provider_adapters: DEFERRED_CF2
```

Essa implementação local não torna todo o `ARCHITECTURAL_CHECKPOINT_004` canônico, não altera `main` e não autoriza merge, release, deploy ou produção. Fatos operacionais marcados `LIVE_REQUIRED` continuam exigindo verificação na fonte live proprietária.

## 9. Mission Control

Issue #141 permanece aberta em discovery.

Estado vigente da própria contratação:

```yaml
state: DISCOVERY_IN_PROGRESS
implementation_authorized: false
```

Mission Control deve continuar separado do Execution Plane e não pode virar segunda fonte de verdade. Nenhuma implementação deve começar apenas porque discovery ou arquitetura candidata existem.

## 10. Governance Evolution v2

PR #142 permanece uma proposta auditável, não o estado atual do MCF.

Estado declarado:

```text
PROPOSED_V2
NOT_CURRENT
NOT_IMPLEMENTATION_AUTHORIZED
```

GOV-0/GOV-1 design autorizado anteriormente não implica autorização de merge, schema, runtime, metodologia, release ou produção.

## 11. Limitações e cuidados

- `main`, `latest`, PRs, Issues, workflow runs e provider state são voláteis;
- identidade de tag/release não é sinônimo de produção atual;
- produção atualmente pode reportar um SHA diferente de `main` por design;
- recovery por redeploy de SHA saudável não deve ser chamado de rollback nativo do provider sem evidência específica;
- 29 contratos de agentes não provam 29 processos cognitivos independentes simultâneos;
- propostas/discovery não são implementação;
- estados antigos `BLOCKED`, `NOT_APPROVED` ou `NOT_PUBLISHED` continuam verdadeiros quando lidos como `HISTORICAL` no boundary original.

## 12. Mapa documental

- porta pública: `README.md`
- estado atual: `docs/MCF-CURRENT-STATE.md`
- índice documental: `docs/README.md`
- runtime: `docs/runtime/` + `apps/rede-social-agentes/apps/server/src/mcf-runtime/`
- governança: `docs/governanca/`, `docs/protocols/`, `docs/decisions/`
- agentes: `docs/agentes/` e `docs/matrices/`
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
6. mantenha propostas não implementadas como `PLANNED` ou `UNDER_STUDY`;
7. nunca inferir produção a partir de `main` — leia o provider e o boundary de autorização separadamente.
