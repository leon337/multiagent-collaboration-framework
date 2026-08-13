# MCF v1.0.0 — Publication Boundary

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Macroestado:** `CORRECTING / BLOCKED_FOR_HUMAN_GATE`  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## Invariantes

RC1, RC2 e RC3 permanecem preservadas. O candidato estável continua exclusivamente `v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794`. PR #133 é somente control plane e nenhuma CI ou documentação constitui aprovação humana.

## P1 — stable tag creation race

A correção estabelece a identidade da tag stable explicitamente no SHA RC3 antes de qualquer GitHub Release. Se outro writer vencer a criação concorrente, a ref resultante é relida antes da release; SHA divergente falha fechado. O caminho de criação da release usa a tag já estabelecida e verificada, sem depender de criação automática por target.

A autorização, o PR HEAD e a linhagem RC são reconsumidos imediatamente antes da tentativa de criação da ref. Essa tentativa é o publication boundary para estabelecer a identidade stable.

## P1 — HUMAN_GATE revocation

Comentários mutáveis da Issue #131 deixaram de ser autoridade. O mecanismo futuro é um receipt em commit GitHub Web verificado, alterando exclusivamente `LEANDRO-HUMAN-GATE.yaml`, vinculado ao parent control-head e à identidade `leon337`/25374535. Commits App/API/unsigned, receipt stale/alterado ou HEAD posterior são rejeitados.

GitHub Environment foi investigado, mas o environment observado `main - rsa-api-free` não possui required reviewer/protection rules configurados; essa proteção não é presumida.

## Evidência técnica

```yaml
technical_head: f2c7047485beb06806be6c8a7de192314d4d1c17
publication_gate_run: 31728317756
receipt_predicate_tests: PASS_4
real_state_machine_tests: PASS_11
total_self_tests: PASS_15
authorize_publication: APPROVED_FALSE
publish_stable: SKIPPED
documentation_validation_run: 31728317747
documentation_validation: PASS
production_readiness_run: 31728317685
production_readiness: PASS
publication_P0_count: 0
publication_P1_count: 2
critical_findings: 0
high_findings: 0
```

Os testes reais exercitam as próprias funções do boundary com backend fake isolado, cobrindo tag ausente, corrida divergente, corrida exata, recovery exato, tag divergente, release incompatível, HUMAN_GATE ausente, App/API/unsigned, revogação antes do boundary e mudança de PR HEAD antes do boundary.

## CAF

- run `31726128230`: falha segura revelou dependência de `set -e`;
- run `31727880589`, head `59df5bcc...`: teste real revelou propagação incompleta de retorno; nenhum job de publicação executou;
- head `f2c704748...`: guards passaram a propagar falhas explicitamente e o reteste passou.

## Estado de gates

```yaml
P0: 0
P1: 2
CRITICAL: 0
HIGH: 0
P1_tag_race: CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW
P1_human_gate_revocation: CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW
AUDIT: BLOCKED_BY_PUBLICATION_P1
LEO_GATE: BLOCKED_BY_PUBLICATION_P1
HUMAN_GATE: NAO_APROVADO
stable_v1_0_0: NAO_PUBLICADA
publication_authorized: false
```

Nenhum finding P1 será encerrado antes da revisão independente do SHA final. Nenhum conteúdo deste documento autoriza merge, tag, release, `latest` ou publicação.
