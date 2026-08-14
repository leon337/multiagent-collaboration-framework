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
  mission: MCF-STABLE-RELEASE-001
  issue: 131
  pr: 133
  architecture: IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF
  publication_P0_count: 0
  publication_P1_count: 2
  publication_P2_count: 0
  critical_findings: 0
  high_findings: 0
  audit: BLOCKED_BY_PUBLICATION_P1
  leo_gate: BLOCKED_BY_PUBLICATION_P1
  human_gate: NAO_APROVADO
  stable_v1_0_0: NAO_PUBLICADA
  ready_for_human_gate: false
```

## Boundary stable em correção

O publication control plane agora separa:

- publisher imutável futuro: `release/v1.0.0-stable-publish`;
- approval ref humana: `release/v1.0.0-human-gate`;
- stable tag: `v1.0.0`;
- control-lock: `mcf-control/v1.0.0`.

A approval ref foi inicializada em `NAO_APROVADO`. O publisher não contém mais o receipt mutável e não precisa receber commit novo quando LEANDRO futuramente decidir o HUMAN_GATE.

A aprovação futura deverá vincular `v1.0.0`, o SHA exato do publisher e RC3. O consumo usa a approval ref como lease mutável na transação atômica; publisher branch, control-lock e stable identity permanecem semanticamente separados.

### Recovery

Depois do consumo, recovery só é permitido quando o mesmo publisher SHA codificado no lock continua sendo o publisher live, as tags estão exatas/protegidas e o control-lock é válido. Approval ref posterior ao consumo não autoriza código novo.

O modelo operacional é re-run do workflow associado ao mesmo publisher SHA. Recovery por publisher divergente falha fechado.

## Proteção server-side mínima

São necessários, mas ainda não configurados:

1. tag ruleset para `refs/tags/v1.0.0` e `refs/tags/mcf-control/v1.0.0`, com `update` + `deletion`, zero bypass/exclusions;
2. branch ruleset para `refs/heads/release/v1.0.0-stable-publish`, protegendo a branch inteira com `update` + `deletion`, zero bypass/exclusions.

O desenho antigo baseado em `file_path_restriction` foi **SUPERSEDED**: essa capacidade pertence a Push Rulesets e não é requisito do ambiente público atual. Não há dependência de plano pago, private/internal ou organização.

Enquanto `repository_rulesets=[]`, o Stable Publication Gate deve falhar antes de authorization/publication.

## Testes dedicados do redesenho

```yaml
reference_technical_head: 11d9b4c828e03ca49a55b1c7da0c0398b230739c
stable_publication_gate_run: 31769606221
receipt_tests: PASS_6
ruleset_tests: PASS_10
atomic_git_real_tests: PASS_3
state_machine_tests: PASS_20
total_self_tests: PASS_39
expected_behavior_without_required_protection: FAIL_CLOSED_BEFORE_AUTHORIZATION
publish_stable: SKIPPED
```

Os testes exercitam publisher correto/divergente, approval correto/stale/ausente/inválido, revogação antes do consumo, stable ausente/errada/exact-tag-only, control-lock parcial, falha/re-run após consumo, recovery com publisher diferente, rulesets ausentes, bypass/exclusions e Release recovery/NOOP.

Esse snapshot é técnico, não terminal. O HEAD final, runs e review independente ficam em receipt externo no PR #133/Issue #131 após congelamento.

## Findings atuais

```yaml
P0: 0
P1: 2
P2: 0
```

- P1 `PRRT_kwDOTnz-ks6ZHcv4`: tag ruleset real ainda ausente.
- P1 `PRRT_kwDOTnz-ks6ZJdRe`: immutable publisher design implementado/testado, pendente review terminal + branch ruleset real/prova live.

## Auditoria terminal

```yaml
AUGUSTO_TRACE: NOT_RUN
JULIA_CLASS_C: NOT_RUN
EMILY_AUDIT: NOT_RUN
LEO_GATE: NOT_RUN
AUDIT: BLOCKED_BY_PUBLICATION_P1
```

A renovação multiagente só ocorre depois de `publication_P0=0` e `publication_P1=0` confirmados por review independente e prova live dos rulesets mínimos.

## Produção

Produção permanece no lineage qualificado da RC3. A reconfirmação terminal de produção, monitor, RCs, stable e incidentes será registrada depois de o publication boundary ficar sem P0/P1.

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
