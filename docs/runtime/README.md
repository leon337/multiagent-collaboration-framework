# MCF Runtime

Este diretório documenta o recorte executável do Multiagent Collaboration Framework.

Fontes canônicas:

- `skills/registry.yaml`;
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`;
- `artifacts/phases/PHASE-STABLE-RELEASE-001/`.

## Estado atual

```yaml
runtime_006: COMPLETE
skills_registered: 16
skills_executable: 16
main_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
candidate: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
production: LIVE
stable_release_boundary:
  mission: MCF-STABLE-RELEASE-001
  issue: 131
  pr: 133
  state: CORRECTING_BLOCKED_FOR_HUMAN_GATE
  publication_P0_count: 0
  publication_P1_count: 2
  critical_findings: 0
  high_findings: 0
  audit: BLOCKED_BY_PUBLICATION_P1
  leo_gate: BLOCKED_BY_PUBLICATION_P1
  human_gate: NAO_APROVADO
  stable_v1_0_0: NAO_PUBLICADA
```

Os dois P1s atuais receberam correção técnica e teste real, mas permanecem abertos até revisão independente do SHA final: corrida na identidade da tag stable e revogação do HUMAN_GATE.

O GitHub Environment foi investigado; o environment observado não possui required reviewer/protection rules configurados, portanto essa proteção não é presumida.

## Evidência técnica

```yaml
technical_head: f2c7047485beb06806be6c8a7de192314d4d1c17
publication_gate_run: 31728317756
receipt_predicate_tests: PASS_4
real_state_machine_tests: PASS_11
total_self_tests: PASS_15
authorize_publication: APPROVED_FALSE
publication_job: SKIPPED
documentation_validation_run: 31728317747
documentation_validation: PASS
production_readiness_run: 31728317685
production_readiness: PASS
```

Dois ciclos CAF anteriores falharam de forma segura e revelaram problemas de semântica/propagação de retorno do shell; o HEAD técnico acima corrigiu os guards e passou o reteste real.

## Auditoria terminal

```yaml
AUGUSTO_TRACE: NOT_RUN
JULIA_CLASS_C: NOT_RUN
EMILY_AUDIT: NOT_RUN
LEO_GATE: NOT_RUN
AUDIT: BLOCKED_BY_PUBLICATION_P1
```

## Produção e monitor

```yaml
production_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
render_service: rsa-api-free
render_deploy: dep-d9ugl7gae00c73c5snv0
latest_health_run: 31726950466
latest_health_result: SUCCESS
material_incidents_open: 0
```

## Autorização vigente

```yaml
HUMAN_GATE: NAO_APROVADO
MERGE_PUBLICACAO_v1_0_0: NAO_AUTORIZADOS
TAG_v1_0_0: NAO_AUTORIZADA
GITHUB_RELEASE_v1_0_0: NAO_AUTORIZADA
LATEST_v1_0_0: NAO_AUTORIZADO
stable_v1_0_0: NAO_PUBLICADA
```

Nenhum conteúdo deste documento constitui autorização de publicação.
