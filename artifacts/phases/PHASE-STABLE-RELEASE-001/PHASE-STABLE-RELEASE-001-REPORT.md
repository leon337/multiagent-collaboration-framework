# PHASE-STABLE-RELEASE-001 — REPORT

## Estado atual

```yaml
mission: MCF-STABLE-RELEASE-001
issue: 131
pr: 133
state: CORRECTING_BLOCKED_FOR_HUMAN_GATE
main_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
candidate_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
publication_P0_count: 0
publication_P1_count: 2
critical_findings: 0
high_findings: 0
stable_v1_0_0: NAO_PUBLICADA
HUMAN_GATE: NAO_APROVADO
```

## P1 — stable tag creation race

A stable tag agora é criada explicitamente pela Git Data API somente no SHA RC3. Se outro writer vencer a corrida, a ref é relida **antes** de qualquer GitHub Release; SHA divergente falha fechado. Release creation usa `--verify-tag`, sem `--target`.

## P1 — HUMAN_GATE revocation

Issue comment deixou de ser autoridade. O mecanismo futuro usa um único commit GitHub Web verificado, exclusivo do receipt e ligado ao parent control-head. Gate, HEAD e RC lineage são reconsumidos imediatamente antes da tentativa atômica de criação da tag stable; revogação/mudança anterior ao boundary impede tag e release.

GitHub Environment foi investigado, mas o environment observado não possui required reviewer/protection rules configurados, portanto não é usado como proteção fictícia.

## Teste dedicado e CAF

O teste atual executa as próprias funções `publish_or_recover` e `create_exact_stable_tag_fail_closed` com backend fake isolado.

```yaml
technical_head: f2c7047485beb06806be6c8a7de192314d4d1c17
stable_publication_gate_run: 31728317756
receipt_predicate_tests: PASS_4
real_state_machine_tests: PASS_11
total_self_tests: PASS_15
authorize_publication: APPROVED_FALSE
publish_stable: SKIPPED
documentation_validation_run: 31728317747
documentation_validation: PASS
production_readiness_run: 31728317685
production_readiness: PASS
```

Cenários cobertos: tag ausente; concorrente divergente; concorrente exata; recovery exato; tag divergente; release incompatível; create sem vencedor; HUMAN_GATE ausente; App/API/unsigned; revogação antes do tag boundary; mudança de PR HEAD antes do tag boundary.

CAF preservado:
- `31726128230`: falha segura revelou dependência de `set -e`;
- `31727880589` em `59df5bcc...`: teste real encontrou propagação restante de erro; autorização/publicação ficaram SKIPPED;
- `f2c704748...`: propagação explícita corrigida e reteste PASS.

## Revisão independente

```yaml
P1_tag_race: CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW
P1_human_gate_revocation: CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW
publication_P1_count: 2
```

## Produção e monitor

```yaml
production_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
render_service: rsa-api-free
render_deploy: dep-d9ugl7gae00c73c5snv0
production_state: LIVE
latest_health_run: 31726950466
latest_health_result: SUCCESS
material_incidents_open: 0
issue_129: CLOSED_COMPLETED
```

## Gates terminais

```yaml
AUDIT: NOT_RUN_BLOCKED_BY_PUBLICATION_P1
LEO_GATE: NOT_RUN_BLOCKED_BY_PUBLICATION_P1
HUMAN_GATE: NAO_APROVADO
```

## Próxima ação

Validar o HEAD documental final, reconfirmar invariantes e solicitar revisão independente do SHA exato. P1 permanece 2 até o review.

Nenhum conteúdo deste relatório autoriza merge, tag, release, `latest` ou publicação.
