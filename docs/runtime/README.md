# MCF Runtime

Este diretório documenta o recorte executável do Multiagent Collaboration Framework.

Fontes canônicas relacionadas:

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
  architecture: IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF
  publication_P0_count: 0
  publication_P1_count: 2
  publication_P2_count: 2
  audit: BLOCKED_BY_PUBLICATION_P1
  leo_gate: BLOCKED_BY_PUBLICATION_P1
  human_gate: NAO_APROVADO
  stable_v1_0_0: NAO_PUBLICADA
  ready_for_human_gate: false
```

## Boundary stable

O publication control plane separa:

- publisher: `release/v1.0.0-stable-publish`;
- approval ref: `release/v1.0.0-human-gate`;
- stable tag: `v1.0.0`;
- control-lock: `mcf-control/v1.0.0`.

A approval ref permanece `NAO_APROVADO`. O publisher não contém receipt humano mutável.

O receipt futuro exige LEANDRO, commit GitHub Web verificado, arquivo único e bytes exatos, incluindo newline terminal. O consumo usa a approval ref como lease mutável na transação atômica; recovery aceita somente o mesmo publisher SHA registrado no lock.

## Proteção server-side mínima

1. tag ruleset para `refs/tags/v1.0.0` e `refs/tags/mcf-control/v1.0.0`: active, `update` + `deletion`, **sem `creation`**, zero bypass/exclusions;
2. branch ruleset para `refs/heads/release/v1.0.0-stable-publish`: active, `update` + `deletion`, zero bypass/exclusions.

O desenho antigo com `file_path_restriction` foi **SUPERSEDED**. Não há dependência de Push Ruleset, private/internal, plano pago ou organização.

Enquanto `repository_rulesets=[]`, o Stable Publication Gate deve falhar antes de authorization/publication.

## Testes dedicados

```yaml
reference_technical_head: 6abb7c88e096c25c45d8457560907846affb57f6
stable_publication_gate_run: 31770534991
receipt_tests: PASS_10
ruleset_tests: PASS_11
atomic_git_real_tests: PASS_3
state_machine_tests: PASS_20
total_self_tests: PASS_44
expected_behavior_without_required_protection: FAIL_CLOSED_BEFORE_AUTHORIZATION
publish_stable: SKIPPED
```

Os dois P2 do review anterior — bytes finais do receipt e regra `creation` em tag ruleset — estão corrigidos/testados e aguardam review terminal do novo HEAD.

## Findings

```yaml
P0: 0
P1: 2
P2: 2
```

- P1 `PRRT_kwDOTnz-ks6ZHcv4`: tag ruleset real ainda ausente.
- P1 `PRRT_kwDOTnz-ks6ZJdRe`: publisher imutável implementado/testado, pendente review terminal + branch ruleset real.
- P2 `discussion_r3781129491`: corrected/tested/pending review.
- P2 `discussion_r3781129494`: corrected/tested/pending review.

## Auditoria

```yaml
AUGUSTO_TRACE: NOT_RUN
JULIA_CLASS_C: NOT_RUN
EMILY_AUDIT: NOT_RUN
LEO_GATE: NOT_RUN
AUDIT: BLOCKED_BY_PUBLICATION_P1
```

## Autorização vigente

```yaml
HUMAN_GATE: NAO_APROVADO
MERGE_PUBLICACAO_v1_0_0: NAO_AUTORIZADOS
TAG_v1_0_0: NAO_AUTORIZADA
GITHUB_RELEASE_v1_0_0: NAO_AUTORIZADA
LATEST_v1_0_0: NAO_AUTORIZADO
stable_v1_0_0: NAO_PUBLICADA
READY_FOR_HUMAN_GATE: false
```

Nenhum conteúdo deste documento constitui autorização de publicação.
