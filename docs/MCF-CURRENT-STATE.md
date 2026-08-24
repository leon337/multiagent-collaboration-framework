# MCF — Estado Atual e Mapa de Verdade

**Classificação:** `CURRENT_IMPLEMENTED`  
**Natureza:** mapa canônico de orientação; valores voláteis devem ser confirmados no GitHub/provider live  
**Reconciliação-base:** 2026-08-20
**Reconciliação adicional do ecossistema:** 2026-08-24
**Baseline histórico de estabilização:** `main@1a1e57208991db87bb3bac9267e29706caae7243`
**Main integrado observado:** `efe5164290d56f22023f07de073e2ad7c027fb95` (PR #160 e staging exato)

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
  local: baseline pré-sync **4/4 PASS**;
- `GET /v1/mcf/context/recovery` e `GET /v1/mcf/context/capabilities`, protegidos por token
  dedicado e desabilitados sem configuração;
- Capability Registry com implementação, conexão, autorização, runtime e verificação separados;
- adapter MCF → Cognitive Ledger read-only endurecido, limitado às três operações padrão, com
  ingresso próprio e E2E pelo `AppModule` real até o PostgreSQL;
- adapter MCF → Cloud local read-only, disabled-by-default, com cliente real, processo stdio
  governado, hashes antes/depois e E2E descartável.

O conjunto integrado foi mergeado pelo PR #160 em
`main@efe5164290d56f22023f07de073e2ad7c027fb95`; esse SHA passou em staging. As Capsules dos três
providers foram sincronizadas nos seus branches seguros. Isso não conecta nem ativa provider,
não torna evidência histórica current e não autoriza runtime de produção, VPS, SSH ou escrita.
O closeout da Capsule do MCF e o recovery estrutural 4/4 pós-sync continuam gates versionados
separados até sua própria evidência.

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

### Context Fabric e integração dos quatro repositórios — lab/staging integrado

O CF-0/CF-1 mínimo entrou no `main` pelo PR #153. O checkpoint de código combinado
`e646527fcb098d22923d64021aefe4dea9993ed3` foi consolidado, documentado e mergeado pelo PR #160
em `main@efe5164290d56f22023f07de073e2ad7c027fb95`, sem tornar o checkpoint arquitetural inteiro
canônico. Esse boundary entrega:

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

O PR #160 passou sete checks no HEAD exato. O workflow de staging repetiu smoke, migrações, suíte
e build, então publicou e verificou exatamente `efe5164290d56f22023f07de073e2ad7c027fb95`.
Produção permaneceu no baseline anterior e o roadmap público estático foi sincronizado à mesma
árvore do novo `main`. O GitHub classificou o PR #151 como `MERGED` porque seu HEAD já era
ancestral do merge consolidado; não houve um segundo merge independente. O PR #159 e sua proposta
de 49 agentes não entraram no candidato, que preservou os 29 agentes oficiais.

Estado preciso deste snapshot de closeout:

```yaml
ecosystem_integration_2026_08_24:
  recovery_audit_base: f52485d2bff004df2f1c6b1eb787575d9ad5a8fc
  agent_roster: 29
  roster_pr_159_included: false
  cf0_cf1:
    main_status: MERGED_PR_153
    merge_sha: 876e9f565671578c04be194c729c8d4e7b0080d9
  integrated_mcf:
    pull_request: 160
    main_merge: efe5164290d56f22023f07de073e2ad7c027fb95
    code_checkpoint: e646527fcb098d22923d64021aefe4dea9993ed3
    checks: PASS_7_OF_7
    cf2_registry_recovery: IMPLEMENTED_AND_MERGED
    baseline_structural_recovery_pre_sync: PASS_4_OF_4
    mcf_to_ledger: REAL_READONLY_LAB_E2E_PASS
    mcf_to_ledger_code: 43ba406
    mcf_to_cloud: REAL_LOCAL_READONLY_LAB_E2E_PASS
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
    staging:
      workflow_run: 32685810702
      result: DEPLOYED_EXACT_SHA
      revision: efe5164290d56f22023f07de073e2ad7c027fb95
      ready: PASS
  provider_semantic_sync:
    cognitive_ledger:
      pull_request: 3
      target_merge: a64cfc05f83567f624bbda70288310f56a7264e8
      ci: PASS
    triview_workspace:
      pull_request: 78
      target_merge: 09a361d761adf1e2e614d23718b84776c365cacc
      ci: PASS
    cloud_infrastructure:
      pull_request: 27
      target_merge: 38cd22e0a814bdf4957edcf5bb30506a4810bda0
      local_focused: PASS_21_OF_21
      local_regression: PASS_396_OF_396
      github_ci: NOT_EXECUTED_EXTERNAL_BILLING_GATE
  mcf_capsule_closeout:
    candidate_branch: codex/ecosystem-capsule-closeout-20260824
    status: PENDING_PR_CHECKS_MERGE_AND_EXACT_SHA_STAGING
    structural_recovery_post_sync: PENDING_AFTER_CLOSEOUT
  paid_ai_api_calls_observed: 0
  runtime_production:
    revision: 439da7b6479718f6545144954937b8c4358d7c46
    ready: PASS
    deploy_workflow_runs: 0
    status: NOT_AUTHORIZED_NOT_TOUCHED
  static_vercel_roadmap:
    deployment_class: PRODUCTION
    runtime_or_api: NONE
    integration_public_sync: PASS_BYTE_FOR_BYTE
    integration_sha256: 5d95e38b841e324f1b91848441492de1ffd0454becfc1c22fdbcbaf5cf1fca0e
    closeout_public_sync: PENDING
  vps_or_node_01_status: NOT_ACCESSED
  ssh_status: NOT_USED
```

As sincronizações semânticas foram versionadas nos branches seguros, não em produção: Ledger PR
#3 → `a64cfc05`; TriView PR #78 → `09a361d7`; Cloud PR #27 → `38cd22e0`. O Cloud GitHub Actions
não iniciou runners ou steps por gate externo de billing/spending; isso é
`NOT_EXECUTED_EXTERNAL_BILLING_GATE`. Os gates locais independentes passaram 21/21 focados e
396/396 na regressão, sem recomendar compra ou aumento de limite.

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

`cloud.context.local.read` e `cognitive-ledger.memory.read` permanecem `DISCONNECTED`, `INACTIVE`,
`HISTORICALLY_VERIFIED` e `LIVE_REQUIRED`. `cloud.workspace.g2a.read` permanece `NOT_AUTHORIZED`,
`DISCONNECTED`, `UNKNOWN` e `LIVE_REQUIRED`; `cloud.workspace.g2b.write` permanece
`NOT_AUTHORIZED`, `DISCONNECTED`, `BLOCKED` e `LIVE_REQUIRED`. Tasks 9/10, escrita externa, SSH e
NODE-01/VPS continuam fechados. O cockpit TriView permanece GET-only e evidence-only; a PR #74 e a
R7 física continuam gates separados.

O baseline estrutural anterior recuperou 4/4 projetos, mas ocorreu antes da sincronização
semântica. Este closeout atualiza a Capsule do MCF e seu source document; depois de PR, checks,
merge e staging do SHA exato, o recovery estrutural 4/4 deve ser repetido contra os quatro SHAs
pós-sync. Só esse novo Receipt encerra o gate final, sem conectar provider nem executar ação
material.

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
