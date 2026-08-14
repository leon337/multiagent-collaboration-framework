# Multiagent Collaboration Framework

Framework experimental para colaboração entre múltiplos agentes de IA com papéis definidos, seleção por competência, execução sequencial visível, loop orientado a objetivo, passagem de bastão contínua, skills versionadas, runtime persistente, evidência verificável, auditoria e gates governados.

## Governança

- **Leandro** é a autoridade humana final.
- **Léo** é a autoridade delegada de continuidade operacional e gates internos.
- **Mestre** coordena a equipe e a missão.
- Existem **29 agentes nomeados**, selecionados dinamicamente por competência.
- O protocolo vigente está em `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`.

## Estado canônico atual

```yaml
runtime_006: COMPLETE
skills_executaveis: 16
main_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
candidate: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
production: LIVE
stable_release_boundary:
  mission: MCF-STABLE-RELEASE-001
  issue: 131
  pr: 133
  macrostate: CORRECTING_BLOCKED_BY_SERVER_SIDE_PUBLICATION_PROTECTION
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
  publication_authorized: false
```

RC1, RC2 e RC3 permanecem preservadas. PR #133 é somente control plane e não altera o candidato RC3. PR #134 permanece aberto e não deve ser mergeado antes do fechamento deste boundary.

## Publication boundary

A publicação permanece bloqueada por proteção server-side ainda ausente no GitHub live. O contrato atual exige:

- ruleset de tags ativo para `refs/tags/v1.0.0` e `refs/tags/mcf-control/v1.0.0`, com update/deletion, zero bypass e zero exclusions;
- ruleset do control branch `refs/heads/release/v1.0.0-stable-publish`, zero bypass/exclusions e restrição de mudanças em `.github/workflows/**/*` e `scripts/**/*`.

O Stable Publication Gate falha fechado enquanto esse contrato não é comprovado. Os testes dedicados atuais cobrem receipt, rulesets, transação Git atômica, recovery e metadados completos da Release.

### Evidência técnica atual

```yaml
technical_head: a2841407d07165ac9a4573f3db98e3e8788e9b5b
stable_publication_gate_run: 31766055608
stable_publication_gate: EXPECTED_FAILURE_MISSING_SERVER_SIDE_PROTECTION
receipt_tests: PASS_4
server_side_protection_tests: PASS_9
atomic_git_real_tests: PASS_3
state_machine_tests: PASS_14
self_tests_total: PASS_30
authorize_publication: SKIPPED
publish_stable: SKIPPED
documentation_validation_run: 31766055514
documentation_validation: PASS
```

## Auditoria terminal

Por governança, Augusto/Júlia/Emily/LÉO só serão renovados depois de `publication_P0=0` e `publication_P1=0` confirmados por revisão independente e prova live dos controles externos.

```yaml
AUGUSTO_TRACE: NOT_RUN
JULIA_CLASS_C: NOT_RUN
EMILY_AUDIT: NOT_RUN
LEO_GATE: NOT_RUN
AUDIT: BLOCKED_BY_PUBLICATION_P1
```

## Imutabilidade

A imutabilidade das versões é uma regra de governança. Proteção técnica só é alegada quando houver configuração GitHub verificável correspondente; no boundary stable atual essa configuração ainda é blocker explícito.

## Skills executáveis

1. `MCF-START-MISSION`
2. `MCF-SELECT-AGENTS`
3. `MCF-RECOVER-CONTEXT`
4. `MCF-DEFINE-PRODUCT`
5. `MCF-DESIGN-EXPERIENCE`
6. `MCF-DESIGN-ARCHITECTURE`
7. `MCF-IMPLEMENT-CHANGE`
8. `MCF-REVIEW-CODE`
9. `MCF-RUN-TESTS`
10. `MCF-GIT-PR-RELEASE`
11. `MCF-DEPLOY-VALIDATE`
12. `MCF-TRACE-MISSION`
13. `MCF-EVALUATE-AGENTS`
14. `MCF-SECURITY-REVIEW`
15. `MCF-DEBUG-INCIDENT`
16. `MCF-CLOSE-PHASE`

## Documentação principal

- `docs/runtime/README.md`
- `skills/registry.yaml`
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`
- `artifacts/phases/PHASE-STABLE-RELEASE-001/`

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

Nenhum texto deste README constitui autorização de publicação.
