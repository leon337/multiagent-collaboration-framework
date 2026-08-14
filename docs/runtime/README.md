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
  state: CORRECTING_BLOCKED_BY_SERVER_SIDE_PUBLICATION_PROTECTION
  publication_P0_count: 0
  publication_P1_count: 3
  publication_P2_count: 3
  critical_findings: 0
  high_findings: 0
  audit: BLOCKED_BY_PUBLICATION_P1
  leo_gate: BLOCKED_BY_PUBLICATION_P1
  human_gate: NAO_APROVADO
  stable_v1_0_0: NAO_PUBLICADA
  ready_for_human_gate: false
```

## Boundary stable em correção

A proteção server-side atual exige simultaneamente:

- ruleset de tags para `v1.0.0` e `mcf-control/v1.0.0`, protegendo update/deletion, sem bypass/exclusions;
- ruleset do control branch impedindo mudanças em `.github/workflows/**/*` e `scripts/**/*`, também sem bypass/exclusions.

Sem essas configurações reais, o Stable Publication Gate falha antes dos jobs de autorização/publicação.

O fluxo técnico consome autorização futura por transação Git `--atomic` com avanço não-noop do control branch e refs de publicação. Recovery posterior só é aceito sob refs consumidas/protegidas. Existing Release só entra em NOOP quando tag, target RC3, draft/prerelease, título/body e `latest` forem exatos.

## Evidência técnica atual

```yaml
technical_head: a2841407d07165ac9a4573f3db98e3e8788e9b5b
publication_gate_run: 31766055608
publication_gate: EXPECTED_FAILURE_MISSING_SERVER_SIDE_PROTECTION
receipt_tests: PASS_4
server_side_protection_tests: PASS_9
atomic_git_real_tests: PASS_3
state_machine_tests: PASS_14
total_self_tests: PASS_30
authorize_publication: SKIPPED
publication_job: SKIPPED
documentation_validation_run: 31766055514
documentation_validation: PASS
```

## Auditoria terminal

```yaml
AUGUSTO_TRACE: NOT_RUN
JULIA_CLASS_C: NOT_RUN
EMILY_AUDIT: NOT_RUN
LEO_GATE: NOT_RUN
AUDIT: BLOCKED_BY_PUBLICATION_P1
```

A renovação multiagente só ocorre depois de `publication_P0=0` e `publication_P1=0` confirmados por review independente e prova live da proteção server-side.

## Produção

Produção permanece no lineage qualificado da RC3. A reconfirmação terminal de produção, monitor, RCs, stable e incidentes ocorrerá somente depois de o publication boundary ficar sem P0/P1.

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
