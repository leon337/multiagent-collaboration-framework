# PRF — PHASE-STABLE-RELEASE-001

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Classe:** C  
**Estado:** `CORRECTING / BLOCKED_FOR_HUMAN_GATE`  
**Autoridade humana:** LEANDRO  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## Candidato preservado

```yaml
main_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
candidate_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
rc1: v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
rc2: v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719
rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
stable_v1_0_0: NAO_PUBLICADA
publication_authorized: false
```

PR #133 permanece somente control plane. Nenhum commit deste PR altera RC3 ou produção.

## P1 vigente — HEAD-change window antes da stable tag

**Achado:** uma aprovação ligada a um control-head podia sobreviver até a primeira mutação se o HEAD remoto mudasse depois da última verificação client-side e antes do create-ref.

**Correção:** a primeira mutação stable deixa de ser uma chamada REST precedida por um snapshot de HEAD. O boundary passa a ser uma única transação Git remota:

```text
git push --atomic
  --force-with-lease=refs/heads/release/v1.0.0-stable-publish:<HEAD_APROVADO>
  <HEAD_APROVADO>:refs/heads/release/v1.0.0-stable-publish
  <RC3_SHA>:refs/tags/v1.0.0
```

O lease é verificado pelo servidor na mesma operação que tenta criar a tag; `--atomic` exige all-or-none. Se o control-head remoto deixou de ser o HEAD aprovado, a transação falha e a tag não é criada. Um run cuja transação falhou não continua em recovery; exige novo run.

**Teste dedicado Git real isolado:**
- control-head permanece no SHA esperado → transação atômica cria a tag no SHA exato;
- outro clone move o control-head imediatamente antes da transação → lease falha e a tag permanece ausente.

**Estado:** `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

## P2 vigente — exact RC3 tag sem Release

**Achado:** após criação correta da tag, uma interrupção antes da Release fazia o validator morrer no `404` sob `set -e` e bloqueava o recovery.

**Correção:** quando `v1.0.0` existe exatamente em RC3 e HUMAN_GATE continua válido, ausência da Release é classificada como `AUTHORIZED_EXACT_TAG_ONLY_RECOVERY_STATE`; o job pode alcançar o recovery. Release incompatível continua fail-closed.

**Estado:** `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

## HUMAN_GATE

Comentário mutável não é autoridade. O receipt futuro continua sendo um commit GitHub Web verificado que altera exclusivamente `LEANDRO-HUMAN-GATE.yaml`, com author `leon337`/25374535, committer `web-flow`/19864447, assinatura GitHub válida, mensagem/conteúdo exatos e vínculo ao parent control-head. O receipt atual permanece `NAO_APROVADO`.

## Evidência técnica atual

```yaml
technical_head: 2129a9a555974c7c89e7a78afc00493e7901aaf5
stable_publication_gate_run: 31753810306
stable_publication_gate: PASS
receipt_predicate_tests: PASS_4
atomic_git_tests: PASS_2
real_state_machine_tests: PASS_12
self_tests_total: PASS_18
authorize_publication: PASS_WITH_APPROVED_FALSE
publish_stable: SKIPPED
documentation_validation_run: 31753810224
documentation_validation: PASS
production_readiness_run: 31753810228
production_readiness: PASS
```

Cenários explicitamente cobertos: aprovação/control-head válido; HEAD alterado imediatamente antes da primeira mutação; exact RC3 tag sem Release; tag divergente; exact tag + exact Release NOOP; Release incompatível; HUMAN_GATE ausente; receipt stale; App/invalid receipt; corrida divergente; falha da transação sem tag.

## Findings vigentes antes do review terminal

```yaml
publication_P0_count: 0
publication_P1_count: 1
publication_P2_count: 1
critical_findings: 0
high_findings: 0
P1_HEAD_CHANGE_WINDOW: CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW
P2_EXACT_TAG_NO_RELEASE_RECOVERY: CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW
AUDIT: BLOCKED_BY_PUBLICATION_P1
LEO_GATE: BLOCKED_BY_PUBLICATION_P1
HUMAN_GATE: NAO_APROVADO
stable_v1_0_0: NAO_PUBLICADA
```

Nenhum P1 será zerado e nenhum thread será resolvido antes de revisão independente do HEAD exato confirmar que o cenário não reaparece.

## Próxima ação

Revalidar o HEAD documental final, solicitar revisão independente exata e somente depois decidir resolução dos threads. Augusto/Júlia/Emily/LÉO permanecem bloqueados até `publication_P0=0` e `publication_P1=0`.

Nenhum conteúdo deste PRF autoriza merge, tag, Release, `latest` ou publicação.
