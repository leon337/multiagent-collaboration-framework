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
  state: CORRECTING_BLOCKED_FOR_HUMAN_GATE
  publication_P0_count: 0
  publication_P1_count: 1
  publication_P2_count: 1
  critical_findings: 0
  high_findings: 0
  audit: BLOCKED_BY_PUBLICATION_P1
  leo_gate: BLOCKED_BY_PUBLICATION_P1
  human_gate: NAO_APROVADO
  stable_v1_0_0: NAO_PUBLICADA
```

## Boundary stable em correção

**P1:** a primeira mutação stable usa `git push --atomic` com `--force-with-lease` no control-head aprovado e criação da tag RC3 na mesma transação. Se o HEAD remoto mudou, a transação inteira falha.

**P2:** tag `v1.0.0` exata em RC3 sem GitHub Release é um estado de recovery autorizado; o `404` da Release não encerra mais o validator.

Ambos estão `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

## Evidência técnica antes do review terminal

```yaml
technical_head: 2129a9a555974c7c89e7a78afc00493e7901aaf5
publication_gate_run: 31753810306
receipt_predicate_tests: PASS_4
atomic_git_tests: PASS_2
real_state_machine_tests: PASS_12
total_self_tests: PASS_18
authorize_publication: APPROVED_FALSE
publication_job: SKIPPED
documentation_validation_run: 31753810224
documentation_validation: PASS
production_readiness_run: 31753810228
production_readiness: PASS
```

Os testes incluem HEAD alterado imediatamente antes da primeira mutação, recovery de exact RC3 tag sem Release, tag divergente, Release incompatível, HUMAN_GATE ausente, receipt stale e App-mediated/invalid receipt.

## Auditoria terminal

```yaml
AUGUSTO_TRACE: NOT_RUN
JULIA_CLASS_C: NOT_RUN
EMILY_AUDIT: NOT_RUN
LEO_GATE: NOT_RUN
AUDIT: BLOCKED_BY_PUBLICATION_P1
```

A renovação multiagente só ocorre depois de `publication_P0=0` e `publication_P1=0` confirmados por revisão independente.

## Produção

Produção permanece no lineage qualificado da RC3. A reconfirmação terminal de produção, monitor, RCs, stable e incidentes ocorrerá depois do review e da auditoria multiagente.

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
