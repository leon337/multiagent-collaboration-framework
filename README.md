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
  macrostate: CORRECTING_BLOCKED_FOR_HUMAN_GATE
  publication_P0_count: 0
  publication_P1_count: 1
  publication_P2_count: 1
  critical_findings: 0
  high_findings: 0
  audit: BLOCKED_BY_PUBLICATION_P1
  leo_gate: BLOCKED_BY_PUBLICATION_P1
  human_gate: NAO_APROVADO
  stable_v1_0_0: NAO_PUBLICADA
  publication_authorized: false
```

RC1, RC2 e RC3 permanecem preservadas. PR #133 é somente control plane e não altera o candidato RC3.

## Publication boundary

### P1 — HEAD-change window

A primeira mutação stable usa uma transação Git remota `--atomic` com `--force-with-lease` no control-head aprovado e criação de `refs/tags/v1.0.0` em RC3 na mesma operação. Se o HEAD remoto mudou antes da transação, o lease falha e nenhuma tag é criada.

Estado: `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

### P2 — exact RC3 tag sem Release

O validator aceita tag exata em RC3 + Release ausente como recovery autorizado. Tag divergente ou Release incompatível continuam fail-closed.

Estado: `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

Estado atual do receipt:

```yaml
authority: LEANDRO
state: NAO_APROVADO
release: v1.0.0
approved_control_head: null
approval_method: GITHUB_WEB_VERIFIED_COMMIT_REQUIRED
```

### Evidência técnica antes do review terminal

```yaml
technical_head: 2129a9a555974c7c89e7a78afc00493e7901aaf5
stable_publication_gate_run: 31753810306
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
```

P1 permanece aberto até revisão independente do HEAD final.

## Auditoria terminal

Por governança, Augusto/Júlia/Emily/LÉO só serão renovados depois de `publication_P0=0` e `publication_P1=0`.

```yaml
AUGUSTO_TRACE: NOT_RUN
JULIA_CLASS_C: NOT_RUN
EMILY_AUDIT: NOT_RUN
LEO_GATE: NOT_RUN
AUDIT: BLOCKED_BY_PUBLICATION_P1
```

## Imutabilidade

A imutabilidade das versões é uma regra de governança. Não é alegada proteção técnica absoluta sem configuração GitHub verificável correspondente.

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
```

Nenhum texto deste README constitui autorização de publicação.
