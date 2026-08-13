# MCF v1.0.0 — Publication Boundary

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Macroestado:** `REQUALIFYING`  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## Invariantes

- RC1 → `9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`;
- RC2 → `d73d936a63cc9462a95bcf481f4b8e1d4b255719`;
- RC3 → `7f741e10d0e745a90c732e084400b11e3f5e6794`;
- eventual `v1.0.0` somente pode apontar ao SHA exato da RC3;
- o PR #133 altera somente o control plane;
- nenhuma documentação ou CI constitui autorização humana.

## Identidade autorizada

```yaml
leandro_github_login: leon337
leandro_github_user_id: 25374535
repository_owner: leon337
```

O workflow revalida login, id e ownership contra a API do GitHub.

## HUMAN_GATE autenticado e HEAD-bound

O recibo futuro esperado é exatamente:

```text
LEANDRO_HUMAN_GATE: APPROVED
RELEASE: v1.0.0
PR_HEAD: <SHA exato do HEAD revisado do PR #133>
```

Um recibo só qualifica se:

1. login = `leon337`;
2. user id = `25374535`;
3. corpo = igualdade integral;
4. release = `v1.0.0`;
5. `PR_HEAD` = HEAD exato do evento e do PR remoto;
6. `performed_via_github_app == null`;
7. existir exatamente um recibo qualificante;
8. título do PR estiver exatamente no valor aprovado no momento futuro da autorização.

O item 6 é necessário porque a API do GitHub comprovou que comentários criados pelo conector podem carregar login/id da conta, mas também expõem `performed_via_github_app.slug=chatgpt-codex-connector`. Comentário mediado por App não satisfaz o HUMAN_GATE.

## Defesa contra stale run / TOCTOU

- `concurrency` agrupa runs pelo PR;
- `cancel-in-progress: true` cancela run antigo quando novo evento o substitui;
- o job mutável revalida HEAD remoto, título, identidade, RC lineage e recibo atual;
- a função de verificação viva é chamada antes de recovery/criação e novamente imediatamente antes de `gh release create`.

## Recovery

Estado normal:

```yaml
stable_tag: ABSENT
stable_release: ABSENT
```

Recovery só é aceito se tag/release já existentes forem exatamente `v1.0.0` no SHA RC3, não forem draft/prerelease e continuarem acompanhadas de título + HUMAN_GATE atual válidos. Qualquer estado divergente falha fechado.

## Executabilidade comprovada

O workflow introduzido no próprio PR executou de fato sem merge em `main`:

```yaml
run: 31676208679
event: pull_request
ref: refs/pull/133/merge
validate_publication_boundary: PASS
publish_stable: SKIPPED
```

## Requalificação mais recente do boundary técnico

```yaml
head: ce3ac1d5a605793c5eba74ff76a12f92bf515449
publication_gate_run: 31679151733
app_mediated_negative_fixture: PASS
qualifying_receipts: 0
stable_state: ABSENT
publish_stable: SKIPPED
production_readiness_run: 31679151776
production_readiness: PASS
documentation_validation_run: 31679151867
documentation_validation: PASS
independent_review_comment: 5277559034
independent_review: NO_MAJOR_ISSUES
publication_P0_count: 0
publication_P1_count: 0
critical_findings: 0
high_findings: 0
```

O P1 somente foi zerado após correção, teste dedicado, evidência e revisão independente.

## Privilégios

- permissões globais: read-only;
- `contents: write` somente no job `publish-stable`;
- job mutável depende do validador read-only;
- publicação continua bloqueada pelo título atual e pela ausência de recibo qualificante.

## Auditoria multiagente

Os comentários históricos atribuídos a Augusto/Júlia/Emily/LÉO foram produzidos via GitHub App e não são aceitos como renovação real do boundary atual.

```yaml
AUDIT: PENDING_REAL_RENEWAL
AUGUSTO: PENDING
JULIA: PENDING
EMILY: PENDING
LEO_GATE: PENDING
```

Por isso a missão permanece `REQUALIFYING`, embora o publication boundary técnico esteja sem P0/P1.

## Imutabilidade

**Governança:** identidades versionadas não devem ser retargetadas/reutilizadas.

**Proteção técnica observada:** RC3 `immutable:false`; rulesets observados `[]`; `main` sem branch protection observada. Não é alegada undeletability técnica.

## Estado de autorização

```yaml
HUMAN_GATE: NAO_APROVADO
publication_authorized: false
merge_for_publication: NAO_AUTORIZADO
tag_v1_0_0: NAO_AUTORIZADA
github_release_v1_0_0: NAO_AUTORIZADA
latest_v1_0_0: NAO_AUTORIZADO
stable_v1_0_0: NAO_PUBLICADA
```

Nenhum trecho deste documento constitui aprovação humana.