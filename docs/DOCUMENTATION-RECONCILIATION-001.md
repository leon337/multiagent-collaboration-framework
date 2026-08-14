# MCF — Documentation Reconciliation 001

**MISSION:** `MCF-DOCUMENTATION-RECONCILIATION-001`  
**Classificação da missão:** documentação/governança; sem implementação NextGen  
**BASE_SHA pré-integração:** `7f741e10d0e745a90c732e084400b11e3f5e6794`  
**Branch:** `docs/mcf-documentation-reconciliation-001`  
**Data da reconciliação:** 2026-08-14

## 1. Boundary

Esta missão reconcilia documentação com GitHub/provider live, código, testes, workflows, Issues/PRs, tags/releases, decisões e PRFs.

Proibições:

- não implementar NextGen;
- não alterar runtime/source;
- não alterar workflows de publicação, rulesets ou Render config;
- não criar/mover/remover tags ou Releases;
- não alterar identidade `v1.0.0`/RC1/RC2/RC3;
- não fazer mutação direta de `main`;
- não mergear PR #134 nesta execução.

## 2. Identidade durável vs. estado mutável

```yaml
durable_release_identity:
  rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
  stable_v1_0_0: v1.0.0@7f741e10d0e745a90c732e084400b11e3f5e6794
publication_evidence:
  publisher_head_at_publication: f6d3955740dec0a43172b8bd8127e208eb727bf6
  human_approval_commit: 786d2535b70584762b45ae0512d43872d492b715
  consumption_lock: 22548bed68df93819a65d26027da353eeb0f8285
  publication_run_consume: 31780868780
  publication_run_recovery: 31781015382
live_github_state:
  main: READ_GITHUB_LIVE
  release_metadata: READ_GITHUB_LIVE
  latest: READ_GITHUB_LIVE
  issue_131_state: READ_GITHUB_LIVE
  pr_133_state: READ_GITHUB_LIVE
live_provider_state:
  production_health: READ_PROVIDER_LIVE
  production_reported_commit: READ_PROVIDER_LIVE
pre_merge_snapshot_2026_08_14:
  main: 7f741e10d0e745a90c732e084400b11e3f5e6794
  release_id: 370424375
  release_name: MCF v1.0.0
  release_draft: false
  release_prerelease: false
  latest: v1.0.0
  issue_131: CLOSED_COMPLETED
  pr_133: CLOSED_UNMERGED
  human_gate: CONSUMED_PROTECTED
  production_boundary: COMPLETE
```

O SHA `7f741e10…` é durável como identidade RC3/stable. O bloco de snapshot registra somente o que foi verificado em 2026-08-14. `main`, `latest`, estado de Issue/PR, metadados mutáveis de Release e provider health/commit podem mudar posteriormente.

## 3. Boundary histórico pré-stable

Antes da publicação, era correto registrar `v1.0.0` ausente, HUMAN_GATE não aprovado e Issue #131/PR #133 como boundary ativo. Isso permanece apenas como `HISTORICAL`.

## 4. NextGen

Fontes de discovery lidas antes das alterações:

- `planning/mcf-nextgen-discovery:docs/proposals/MCF-DOCUMENTATION-RECONCILIATION-BRIEF-001.md`;
- `planning/mcf-nextgen-discovery:docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-001.md`.

```yaml
nextgen: UNDER_STUDY
state: DRAFT_DISCOVERY
implementation_authorized: false
architecture_formally_approved: false
prototype_authorized: false
```

A publicação stable não promove conceitos NextGen a capacidades atuais.

## 5. Escopo auditado

Foram auditados por árvore, índice e/ou leitura dirigida:

- `README.md`, `CHANGELOG.md`, `docs/README.md`, `docs/MCF-CURRENT-STATE.md`;
- `docs/runtime/`, host README e runtime executável;
- skills, protocolos, decisões, agentes/matrizes, governança, auditorias;
- releases/tags e `artifacts/phases/`;
- workflows apenas como evidência;
- `render.yaml` e `/health/version` como evidência de volatilidade do deploy commit;
- experimento telefone-sem-fio;
- propostas/NextGen;
- Issue #131, PR #133 e publication evidence.

Documentos históricos não são reescritos quando descrevem corretamente seu boundary original. Current-state surfaces não podem apresentar snapshots mutáveis como invariantes atuais.

## 6. Matriz de drift

| Área | Risco/afirmação antiga | Correção | Classificação |
|---|---|---|---|
| current-state pré-stable | stable `NOT_PUBLISHED` / HUMAN_GATE `NOT_APPROVED` | stable identity publicada e entry-state antigo marcado histórico | `SUPERSEDED` |
| DEC-064 | `Status: EM EXECUÇÃO` após stable | `GOV-DOC-P1-001`: classificação terminal não destrutiva | `HISTORICAL AFTER STABLE PUBLICATION` |
| `main@7f741e10…` | apresentado como current durável | `GOV-DOC-P1-002`: `pre_merge_snapshot` + `READ_GITHUB_LIVE` | `CURRENT_STATE_SEMANTICS_CORRECTED` |
| deploy SHA | poderia ser inferido como RC3 permanente | `READ_PROVIDER_LIVE`; docs-only merge pode avançar commit sem source change | `CURRENT_STATE_SEMANTICS_CORRECTED` |
| `latest`, Issue #131, PR #133, Release metadata | inicialmente agrupados como “fatos duráveis” | Codex P2: mover para `READ_GITHUB_LIVE` ou snapshot datado | `CURRENT_STATE_SEMANTICS_CORRECTED` |
| telefone-sem-fio | risco de extrapolar independência | ressalva metodológica preservada | `EXPERIMENTAL` |
| NextGen | risco de promoção por stable | permanece discovery não autorizado | `UNDER_STUDY` |

## 7. GOV-DOC-P1-001

Comentário de governança `5291207799`: DEC-064 apresentava `EM EXECUÇÃO` como current após stable. Correção: `CONCLUÍDA — HISTORICAL AFTER STABLE PUBLICATION`, preservando corpo/regras/estado de entrada como histórico.

## 8. GOV-DOC-P1-002 e P2 do review

Comentário de governança `5291403832`: current-state se auto-invalidava porque `main@7f741e10…` era tratado como durável embora o próprio merge pudesse avançar `main` e o deploy reportado.

Correção inicial:

- preservar RC3/stable em `7f741e10…`;
- `main` = `READ_GITHUB_LIVE`;
- production reported commit = `READ_PROVIDER_LIVE`;
- `7f741e10…` associado a `main` apenas como snapshot pré-integração;
- registrar que merge documentation-only pode avançar branch/deploy commit sem alterar application/runtime source.

O Codex review do HEAD `85f980206655a7d93fc080885f737bfdd4528225` abriu P2 adicional: `latest`, Issue #131 e PR #133 também são mutáveis e não podem ser rotulados como fatos duráveis. A correção foi ampliada transversalmente:

- bloco durável limitado à identidade RC3/stable e evidências de publicação;
- `latest`, Release metadata, Issue/PR state = `READ_GITHUB_LIVE`;
- valores verificados em 2026-08-14 preservados apenas em `pre_merge_snapshot_2026_08_14`;
- provider health/commit = `READ_PROVIDER_LIVE`.

## 9. Runtime e skills

Esta missão não altera runtime. Estado de qualificação preservado:

```yaml
registered_skills: 16
executable_skills: 16
documental_only_skills: 0
gate_c: COMPLETE_HISTORICAL
gate_d: COMPLETE_HISTORICAL
gate_e: COMPLETE_HISTORICAL
production_boundary: COMPLETE_HISTORICAL
```

Status operacional corrente é sempre live.

## 10. Itens preservados

- RC1/RC2/RC3 e stable identity;
- PRFs/checkpoints históricos;
- entry states válidos na data original;
- DEC-064 com classificação terminal adicionada, sem apagar a decisão original;
- contratos de agentes sem reescrita em massa;
- publication workflows, rulesets, tags, Release, Render config e runtime sem mutação por esta missão.

## 11. Critério de conclusão

Antes de devolver ao MESTRE:

1. congelar o novo HEAD documental;
2. Documentation Validation, Foundation e Production Readiness PASS nesse HEAD;
3. scan de current-state cobrindo:
   - exact `main`/deploy SHA como current;
   - `latest` fixo como current durável;
   - Issue/PR status fixo como current durável;
   - Release metadata mutável rotulada durável;
   - headers canônicos históricos;
4. provar diff documentation-only;
5. read-back live das identidades stable e, separadamente, dos estados GitHub momentâneos;
6. fresh Codex review do HEAD exato;
7. corrigir qualquer finding material e repetir o ciclo;
8. manter PR #134 DRAFT/OPEN/UNMERGED.
