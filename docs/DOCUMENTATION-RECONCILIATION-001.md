# MCF — Documentation Reconciliation 001

**MISSION:** `MCF-DOCUMENTATION-RECONCILIATION-001`  
**Classificação da missão:** documentação/governança; sem implementação NextGen  
**BASE_SHA pré-integração:** `7f741e10d0e745a90c732e084400b11e3f5e6794`  
**Branch:** `docs/mcf-documentation-reconciliation-001`  
**Data da reconciliação terminal:** 2026-08-14

## 1. Boundary atual

Esta missão reconcilia a documentação pertinente do MCF com GitHub live, código, testes, workflows, Issues/PRs, tags/releases, decisões e PRFs.

Proibições da execução documental atual:

- não implementar arquitetura NextGen;
- não alterar runtime/source code;
- não alterar workflows de publicação;
- não alterar rulesets;
- não criar, mover ou remover tags/releases;
- não alterar a identidade já publicada de `v1.0.0`;
- não alterar/retargetar RC1, RC2 ou RC3;
- não fazer mutação direta de `main`; `7f741e10…` é o baseline pré-integração, não um current-head durável;
- não mergear PR #134 durante esta reconciliação.

### Boundary histórico pré-stable

No snapshot de 2026-08-13, antes da publicação, era correto registrar `v1.0.0` como ausente, HUMAN_GATE como não aprovado e Issue #131/PR #133 como boundary ativo. Esse estado está `HISTORICAL` e foi superado pela publicação stable em 2026-08-14.

## 2. Fatos pós-stable duráveis e baseline operacional volátil

```yaml
release_facts:
  rc1: v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
  rc2: v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719
  rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
  stable_v1_0_0: PUBLISHED@7f741e10d0e745a90c732e084400b11e3f5e6794
  release_id: 370424375
  release_name: MCF v1.0.0
  release_draft: false
  release_prerelease: false
  latest: v1.0.0
  stable_issue_131: CLOSED_COMPLETED
  publisher_pr_133: CLOSED_UNMERGED
  publisher_head: f6d3955740dec0a43172b8bd8127e208eb727bf6
  human_gate: CONSUMED_PROTECTED
  human_approval_commit: 786d2535b70584762b45ae0512d43872d492b715
  consumption_lock: 22548bed68df93819a65d26027da353eeb0f8285
  publication_run_consume: 31780868780
  publication_run_recovery: 31781015382
  publication_result: SUCCESS
volatile_operational_state:
  pre_merge_baseline_main: 7f741e10d0e745a90c732e084400b11e3f5e6794
  main: READ_GITHUB_LIVE
  production_status: COMPLETE
  production_reported_commit: READ_PROVIDER_LIVE
```

GitHub live no momento da correção confirma `v1.0.0` no SHA exato da RC3; Release `MCF v1.0.0` é não-draft, não-prerelease e `latest`. Issue #131 está `closed/completed`; PR #133 está `closed/unmerged`.

O SHA `7f741e10…` é durável como identidade da RC3/stable. Como branch head, é apenas baseline pré-integração. A própria integração documental pode avançar `main` e, como Render acompanha `main`, pode também alterar o commit reportado por produção sem alterar source/runtime.

## 3. Fontes obrigatórias NextGen

Foram lidos integralmente, antes das alterações iniciais desta missão:

- `planning/mcf-nextgen-discovery:docs/proposals/MCF-DOCUMENTATION-RECONCILIATION-BRIEF-001.md`;
- `planning/mcf-nextgen-discovery:docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-001.md`.

Classificação preservada:

```yaml
nextgen: UNDER_STUDY
state: DRAFT_DISCOVERY
implementation_authorized: false
architecture_formally_approved: false
prototype_authorized: false
```

A publicação de `v1.0.0` não promove nenhum conceito NextGen a capacidade atual.

## 4. Escopo auditado

Domínios auditados por árvore, índice e/ou leitura dirigida das fontes que declaram arquitetura, estado ou capacidade:

- `README.md`;
- `CHANGELOG.md`;
- `docs/README.md`;
- `docs/MCF-CURRENT-STATE.md`;
- `docs/runtime/`;
- `apps/rede-social-agentes/` e runtime em `apps/server/src/mcf-runtime/`;
- `skills/registry.yaml`;
- `docs/protocols/`;
- `docs/decisions/`, incluindo headers de status das decisões canônicas;
- `docs/agentes/` e `docs/matrices/`;
- `docs/governanca/`;
- `docs/auditoria/` e `docs/audits/`;
- `docs/releases/` + GitHub Releases/tags;
- `artifacts/phases/` / PRFs;
- `.github/workflows/` apenas como evidência, sem alteração;
- `render.yaml` e `/health/version` apenas como evidência de volatilidade do deploy commit;
- `experimentos/telefone-sem-fio-001/`;
- `docs/proposals/` e a branch NextGen;
- Issue #131, PR #133 e publication evidence da stable.

A auditoria não reescreve cada evidência histórica: documentos de boundary permanecem preservados quando seu estado antigo era correto na data de emissão. Quando um documento canônico antigo contém um status que pode ser lido como atual, ele deve receber classificação terminal/histórica explícita sem destruir o estado original.

## 5. Matriz de drift principal

| Documento/área | Afirmação antiga ou risco | Evidência | Correção | Classificação |
|---|---|---|---|---|
| `README.md` | stable `NOT_PUBLISHED`, HUMAN_GATE `NOT_APPROVED` | stable publicada; gate consumido/protegido | release facts atualizados | `SUPERSEDED` → `CURRENT_IMPLEMENTED` |
| `README.md` / `docs/MCF-CURRENT-STATE.md` / runtime | `main@7f741e10…` apresentado como current durável | merge do próprio PR avança `main`; Render segue `main` | `GOV-DOC-P1-002`: separar release facts de branch/deploy state volátil | `CURRENT_STATE_SEMANTICS_CORRECTED` |
| `docs/MCF-CURRENT-STATE.md` | stable ausente | tag/Release/latest live | mapa pós-stable | `SUPERSEDED` → `CURRENT_IMPLEMENTED` |
| `docs/runtime/README.md` | lineage terminava antes de stable | stable publicada no SHA RC3 | lineage encerrado em stable publicada | `SUPERSEDED` |
| `CHANGELOG.md` | stable ainda gated | publication runs + Release live | milestone `v1.0.0` adicionado | `HISTORICAL` + milestone atual |
| `docs/README.md` | stable ainda não publicada | Release `MCF v1.0.0` latest | índice reconciliado | `SUPERSEDED` |
| `apps/rede-social-agentes/README.md` | stable `NOT_PUBLISHED` | stable publicada | snapshot host atualizado | `SUPERSEDED` |
| `docs/decisions/MCF-DEC-064-QUALIFICACAO-DA-RELEASE-ESTAVEL-V1.0.0.md` | header dizia `Status: EM EXECUÇÃO` após publicação | stable publicada; Issue #131 closed/completed; PR #133 closed/unmerged; HUMAN_GATE consumido/protegido | `GOV-DOC-P1-001`: classificação terminal adicionada | `HISTORICAL AFTER STABLE PUBLICATION` |
| Issue #131 | boundary ativo | `CLOSED/COMPLETED` | referência atualizada | `HISTORICAL` |
| PR #133 | control plane aberto | `CLOSED/UNMERGED` | referência atualizada | `HISTORICAL` |
| HUMAN_GATE | `NOT_APPROVED` no snapshot pré-stable | approval + lock terminal | estado = `CONSUMED_PROTECTED` | `SUPERSEDED` |
| `telefone-sem-fio-001` | risco de extrapolar resultado | mesma instância ChatGPT no experimento | ressalva preservada | `EXPERIMENTAL` |
| NextGen | risco de promoção por causa da stable | checkpoint continua `DRAFT_DISCOVERY` | permanece `UNDER_STUDY` | `UNDER_STUDY` |

## 6. Correções de estado atual

### Runtime

Confirmado como executável. Esta missão não alterou runtime nem código.

### Skills

```yaml
registered: 16
executable: 16
documental_only: 0
```

### Gates/releases

```yaml
gate_c: COMPLETE
gate_d: COMPLETE
gate_e: COMPLETE
rc1: PRESERVED_PRERELEASE_HISTORICAL
rc2: PRESERVED_PRERELEASE_HISTORICAL
production: COMPLETE
rc3: PRESERVED_PRERELEASE_HISTORICAL
stable_v1_0_0: PUBLISHED_CURRENT
```

### GOV-DOC-P1-001

A auditoria do MESTRE no comentário `5291207799` encontrou DEC-064 apresentando `EM EXECUÇÃO` como status atual. A correção foi documental e não destrutiva: o topo agora declara `CONCLUÍDA — HISTORICAL AFTER STABLE PUBLICATION` e registra o resultado terminal.

### GOV-DOC-P1-002

A reauditoria do MESTRE no comentário `5291403832` encontrou self-invalidation de current-state: o mesmo SHA `7f741e10…` era correto simultaneamente como RC3/stable e como `main` pré-merge, mas somente os fatos de release são duráveis. A correção:

- preserva `v1.0.0` e RC3 em `7f741e10…`;
- reclassifica `main@7f741e10…` como `pre_merge_baseline_main`;
- exige `main: READ_GITHUB_LIVE` para estado corrente;
- exige `production_reported_commit: READ_PROVIDER_LIVE`;
- registra que uma integração documentation-only pode avançar commit de branch/deploy sem alterar a árvore da aplicação/runtime;
- mantém verificação pós-merge de deploy/version/health reservada para governança posterior.

## 7. CHANGELOG

O CHANGELOG permanece estruturado por milestones, não por commit dump. A reconciliação pós-stable adiciona `v1.0.0` como marco publicado em 2026-08-14 e reclassifica wording pré-publicação como contexto histórico.

## 8. README e índices

README, índice e current-state agora distinguem:

- runtime executável e capacidades comprovadas;
- fatos duráveis de release: RC1/RC2/RC3, stable, Release/latest e receipt de publicação;
- estado volátil: `main` e SHA reportado pelo deploy, sempre lidos live;
- HUMAN_GATE consumido/protegido;
- Issue #131 concluída e PR #133 fechado sem merge;
- NextGen `UNDER_STUDY`;
- mapa para fontes e evidências.

## 9. Runtime docs

`docs/runtime/README.md` representa o lineage pós-stable sem confundir release SHA com branch/deploy SHA corrente. O plano detalhado do RUNTIME-006 permanece `HISTORICAL`; seus SHAs e estados antigos não são reescritos.

## 10. NextGen

Nenhuma implementação feita. Todos os conceitos que dependem da próxima geração permanecem `UNDER_STUDY`.

## 11. Experimento telefone-sem-fio

```yaml
classification: EXPERIMENTAL
preservation_handoff_evidence: POSITIVE
cognitive_independence_proven: false
reason: roles_executed_within_same_ChatGPT_context_family
required_for_stronger_claim: separated_sessions_contexts_or_instances
```

## 12. Itens deliberadamente preservados

- releases/artefatos RC1/RC2/RC3: preservados como identidades/evidência histórica;
- PRFs/checkpoints antigos: preservados para rastreabilidade;
- decisões de entry state: preservadas quando descrevem corretamente o momento de decisão;
- DEC-064: corpo e estado de entrada originais preservados, com classificação terminal adicionada;
- contratos de agentes: não reescritos em massa quando não havia drift funcional comprovado;
- publication workflows, rulesets, tags, Release stable, Render config e runtime: somente lidos como evidência, nunca alterados por esta missão.

## 13. Critério de conclusão pós-stable

Antes de considerar esta reconciliação pronta para nova auditoria de governança:

1. validar o HEAD documental final em CI;
2. executar stale/current-state scan, incluindo headers canônicos e exact-SHA assertions de `main`/produção que se invalidariam pelo próprio merge;
3. aceitar SHAs de branch/deploy antigos somente como `pre_merge_baseline`/`HISTORICAL`/evidência de execução;
4. provar que o diff permanece documentation-only;
5. reconfirmar live stable tag, Release/latest, Issue #131 e PR #133 e capturar `main` apenas como leitura live momentânea;
6. solicitar revisão independente do SHA exato;
7. corrigir qualquer finding material e revalidar;
8. registrar `GOV-DOC-P1-001` e `GOV-DOC-P1-002` no checkpoint/report;
9. não mergear PR #134 até decisão posterior do MESTRE.