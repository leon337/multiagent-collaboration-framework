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

Os dois P1s atuais tratam do estabelecimento seguro da identidade da tag stable diante de concorrência e da eliminação da dependência de autorização em comentário mutável. Ambos receberam correção técnica e testes dedicados, mas permanecem formalmente abertos até revisão independente do SHA final.

Evidência técnica anterior à reconciliação documental:

```yaml
technical_head: 4d5144ce46c9c77955c732824f5225f81cf0b55d
publication_gate_run: 31726482829
validation: PASS
self_tests: PASS_16
authorization_state: NAO_APROVADO
publication_job: SKIPPED
documentation_validation: PASS
```

O primeiro self-test da nova implementação falhou de maneira segura. O CAF identificou a causa, os predicados foram endurecidos e o reteste passou.

## Auditoria terminal

Por orientação de governança, Augusto, Júlia, Emily e Léo não são executados como substituição dos P1s atuais.

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
latest_health_run: 31677775717
latest_health_result: SUCCESS
cold_start_recovery: PASS
material_incidents_open: 0
```

## Imutabilidade

A imutabilidade das versões é uma regra de governança. Não se afirma proteção técnica absoluta: RC3 apresenta `immutable:false`, não há ruleset observado e `main` não está protegida no estado verificado.

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
