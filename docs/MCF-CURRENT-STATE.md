# MCF — Estado Atual e Mapa de Verdade

**Classificação:** `CURRENT_IMPLEMENTED`  
**Natureza:** mapa canônico de orientação; valores voláteis devem ser confirmados no GitHub/provider live  
**Reconciliação-base:** 2026-08-20
**Reconciliação adicional do ecossistema:** 2026-08-23
**Baseline histórico de estabilização:** `main@1a1e57208991db87bb3bac9267e29706caae7243`
**Main observado pela integração:** `f52485d` (audit de recuperação de 2026-08-23)

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

### `CURRENT_IMPLEMENTED` no boundary Context Fabric

- CF-0/CF-1 mínimo mergeado no `main` pelo PR #153, merge
  `876e9f565671578c04be194c729c8d4e7b0080d9`;
- Registry e Capsule repository-native, contratos e schemas públicos;
- recuperação cross-repository estrutural dos quatro projetos com provenance e freshness Git
  local: baseline **4/4 PASS** na branch;
- `GET /v1/mcf/context/recovery` e `GET /v1/mcf/context/capabilities`, protegidos por token
  dedicado e desabilitados sem configuração;
- Capability Registry com implementação, conexão, autorização, runtime e verificação separados;
- adapter MCF → Cognitive Ledger read-only endurecido, limitado às três operações padrão, com
  ingresso próprio e E2E pelo `AppModule` real até o PostgreSQL;
- adapter MCF → Cloud local read-only, disabled-by-default, com cliente real, processo stdio
  governado, hashes antes/depois e E2E descartável.

Os itens posteriores ao CF-0/CF-1 permanecem na branch de integração até PR, checks e merge
próprios. Eles não devem ser descritos como presentes no `main`, staging ou produção.

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

### Context Fabric e integração dos quatro repositórios — boundary em consolidação

O CF-0/CF-1 mínimo deixou de ser apenas um candidato local: foi revisado e mergeado no `main`
pelo PR #153, merge `876e9f565671578c04be194c729c8d4e7b0080d9`. A branch isolada
`codex/ecosystem-context-integration@e646527fcb098d22923d64021aefe4dea9993ed3`
acrescenta, sem tornar o checkpoint arquitetural inteiro canônico:

- Registry de quatro projetos e leitura de suas Capsules;
- recuperação cross-repository, provenance qualificada e freshness Git local fail-closed;
- endpoints protegidos de recovery e capabilities;
- adapter MCF → Cognitive Ledger read-only, disabled-by-default, com schemas estritos, três
  operações allowlisted e token de ingresso próprio;
- adapter MCF → Cloud local read-only, disabled-by-default, com executável/root/operação/env
  allowlisted, stdio sem shell e proveniência por SHA-256;
- evidência real MCF → MCP → Edge/Auth → PostgREST → PostgreSQL/pgvector, sem persistência do
  payload de memória no MCF e com 0 embeddings/0 chamadas pagas;
- evidência real MCF → processo stdio Cloud em fixture descartável, com integridade pré/pós,
  limites e cleanup.

Estado preciso deste snapshot:

```yaml
ecosystem_integration_2026_08_23:
  mcf_main_audit: f52485d
  agent_roster: 29
  unmerged_roster_pr_159_included: false
  cf0_cf1:
    main_status: MERGED_PR_153
    merge_sha: 876e9f565671578c04be194c729c8d4e7b0080d9
  integration_branch:
    revision: e646527fcb098d22923d64021aefe4dea9993ed3
    main_status: NOT_MERGED
    cf2_registry_recovery: IMPLEMENTED_AND_VERIFIED_IN_BRANCH
    baseline_structural_recovery: 4_OF_4_PASS
    provider_capsule_semantic_sync: PENDING_POST_MAIN
    mcf_to_ledger: REAL_READONLY_LAB_E2E_PASS
    mcf_to_ledger_branch: f3ba9a0
    mcf_to_ledger_code: 43ba406
    mcf_to_cloud: REAL_LOCAL_READONLY_LAB_E2E_PASS
    mcf_to_cloud_branch: e5ae1f9
    mcf_to_cloud_code: 54fadec
    mcf_to_cloud_closure: 425e258
    migrations_twice: PASS_30_RECORDS
    pnpm_verify: PASS_EXIT_0
    test_summary:
      ops_passed: 38
      contracts_passed: 16
      web_passed: 5
      server_passed: 884
      total_passed: 943
      real_cloud_e2e_skipped_by_design: 3
      failed: 0
    format_lint_typecheck_build: PASS
    production_audit_high:
      status: PASS
      known_vulnerabilities: 0
  provider_merges:
    cognitive_ledger: e0e715b0105abe0bc636d198e7ebb137d7de9bd7
    cognitive_ledger_feature_tree: b882d28
    triview_release: 5013ffebd1c7efe8fb7cfd2d41f16e5efec49194
    triview_feature_tree: a072cf9
    cloud_lab_branch: dbd772a6c37452008b7c8debd58d2782127514db
    cloud_feature_tree: cb97df4
  paid_ai_api_calls_observed: 0
  runtime_production_status: NOT_AUTHORIZED_NOT_TOUCHED
  static_vercel_roadmap:
    deployment_class: PRODUCTION
    runtime_or_api: NONE
    final_public_sync: PENDING
  vps_or_node_01_status: NOT_ACCESSED
  ssh_status: NOT_USED
```

O Ledger PR #2 foi mergeado no branch `design/cognitive-ledger-foundation`; o TriView PR #77 foi
mergeado em `release/1.0.0a4`; e o Cloud PR #26 foi mergeado no branch lab
`mcf/mission-001-control-bridge-g1`. Esses targets não equivalem a produção.

No Ledger, o provider continua oferecendo quatro tools read-only, mas o consumidor MCF expõe
somente `ler_diario`, `buscar_eventos` e `recuperar_contexto`; `ler_fonte_bruta` foi bloqueada
antes do MCP. No E2E final do checkpoint `e646527f`, as 3 operações produziram 3 auditorias,
o fingerprint `953cf4f346240c029c3bcd584d02eed0` permaneceu idêntico, houve 0 embeddings,
0 chamadas pagas e 0 persistência de memória no MCF; apenas o contador técnico sem payload
chegou a 7.

No Cloud, além dos 396/396 testes e 13/13 marcadores do provider, o cliente real do MCF passou
6 arquivos/49 testes focados, e o E2E executou 3/3 testes E2E. Onze
Bearers do mesmo peer compartilharam o mesmo bucket de abuso; 16 arquivos necessários à execução
foram verificados antes/depois. O postflight confirmou worktrees limpas, portas fechadas e banco
descartável removido. O runtime Python ainda confia no executável/stdlib, módulos dinâmicos e
dependências locais do ambiente verificado; `python -I` e o audit hook reduzem superfície, mas
não constituem sandbox de sistema operacional nem prova completa da supply chain. Por isso o
capability permanece restrito ao laboratório local.

O capability local `cloud.context.local.read` possui evidência histórica de laboratório, mas o
remoto `cloud.workspace.g2a.read` permanece `NOT_AUTHORIZED`, `DISCONNECTED` e
`LIVE_REQUIRED`. Tasks 9/10, G2-B ativo, escrita externa, SSH, NODE-01/VPS e runtime de produção
continuam fora do boundary. A página estática Vercel pertence à classe de deployment
`Production` da Vercel, porém não contém runtime nem API do MCF. O baseline estrutural de recovery
já recuperou 4/4 projetos; ele não prova que o texto das Capsules representa o estado pós-main.
No HEAD `e646527f`, migrations 2x passaram com 30 registros; `pnpm verify` terminou com exit 0;
38 ops + 16 contracts + 5 web + 884 server somaram 943 testes aprovados, com 3 real-Cloud E2E
pulados por design e 0 falhas. Format, lint, typecheck e build passaram, e o audit de produção em
nível high reportou 0 vulnerabilidades conhecidas.

Ainda faltam, nesta ordem, PR/checks/merge MCF; staging por SHA com runtime de produção/VPS
intactos e Vercel; sincronização semântica das Capsules nos providers; closeout MCF; e repetição
do recovery estrutural 4/4 contra as Capsules pós-sync.

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
- roadmap do ecossistema: `docs/MCF-ECOSYSTEM-INTEGRATION-ROADMAP.html`
- handoff da integração: `docs/integrations/MCF-ECOSYSTEM-PARALLEL-HANDOFF-20260823.md`
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
