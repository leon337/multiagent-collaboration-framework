# MCF v1.0.0 — Publication Boundary

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Macroestado:** `CORRECTING / BLOCKED_FOR_HUMAN_GATE`  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## Invariantes

RC1, RC2 e RC3 permanecem preservadas. O candidato estável continua exclusivamente `v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794`. `main` permanece nesse mesmo SHA durante este boundary. PR #133 é somente control plane; nenhuma CI, review ou documentação constitui aprovação humana.

## P1 vigente — HEAD-change window antes da primeira mutação

A fronteira de criação da identidade stable é uma transação Git remota única. O run autorizado envia, na mesma operação:

```text
git push --atomic
  --force-with-lease=refs/heads/release/v1.0.0-stable-publish:<HEAD_APROVADO>
  <HEAD_APROVADO>:refs/heads/release/v1.0.0-stable-publish
  <RC3_SHA>:refs/tags/v1.0.0
```

O lease exige que o control-head remoto ainda seja exatamente o HEAD aprovado quando o servidor avalia a transação. A atomicidade impede resultado parcial: se o HEAD mudou, a criação da tag também falha. Um run cujo lease falhou não prossegue usando uma tag concorrente; um novo run é obrigatório.

## P2 vigente — exact RC3 tag sem Release

Se uma execução autorizada já estabeleceu a tag exata em RC3 e foi interrompida antes da Release, o validator aceita esse estado parcial como `AUTHORIZED_EXACT_TAG_ONLY_RECOVERY_STATE`. O `404` da Release é tratado como ausência esperada, não como erro de shell. Tag divergente e Release incompatível continuam fail-closed.

## HUMAN_GATE

Comentário mutável da Issue #131 não é autoridade. O receipt futuro é um commit GitHub Web verificado, exclusivo de `LEANDRO-HUMAN-GATE.yaml`, vinculado ao parent control-head e à identidade `leon337`/25374535. O estado atual permanece `NAO_APROVADO`.

## Evidência técnica antes do review terminal

```yaml
technical_head: 2129a9a555974c7c89e7a78afc00493e7901aaf5
publication_gate_run: 31753810306
validation: PASS
receipt_predicate_tests: PASS_4
atomic_git_tests: PASS_2
real_state_machine_tests: PASS_12
total_self_tests: PASS_18
authorize_publication: APPROVED_FALSE
publish_stable: SKIPPED
documentation_validation_run: 31753810224
documentation_validation: PASS
production_readiness_run: 31753810228
production_readiness: PASS
publication_P0_count: 0
publication_P1_count: 1
publication_P2_count: 1
critical_findings: 0
high_findings: 0
```

Os dois testes Git atômicos usam repositórios bare reais e provam: (1) HEAD inalterado permite criar a tag exata; (2) HEAD alterado imediatamente antes da transação faz o lease falhar e nenhuma tag é criada.

## Estado de gates

```yaml
P0: 0
P1: 1
P2: 1
CRITICAL: 0
HIGH: 0
P1_HEAD_CHANGE_WINDOW: CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW
P2_EXACT_TAG_NO_RELEASE_RECOVERY: CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW
AUDIT: BLOCKED_BY_PUBLICATION_P1
LEO_GATE: BLOCKED_BY_PUBLICATION_P1
HUMAN_GATE: NAO_APROVADO
stable_v1_0_0: NAO_PUBLICADA
publication_authorized: false
```

Nenhum P1 será zerado e nenhum thread será resolvido antes da revisão independente do SHA final confirmar a eliminação dos cenários. Nenhum conteúdo deste documento autoriza merge, tag, Release, `latest` ou publicação.
