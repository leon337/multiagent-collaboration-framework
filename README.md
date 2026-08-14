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
  architecture: IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF
  publication_P0_count: 0
  publication_P1_count: 2
  publication_P2_count: 2
  critical_findings: 0
  high_findings: 0
  audit: BLOCKED_BY_PUBLICATION_P1
  leo_gate: BLOCKED_BY_PUBLICATION_P1
  human_gate: NAO_APROVADO
  stable_v1_0_0: NAO_PUBLICADA
  ready_for_human_gate: false
  publication_authorized: false
```

RC1, RC2 e RC3 permanecem preservadas. PR #133 é somente publication control plane e não altera o candidato RC3. PR #134 permanece aberto e não deve ser mergeado antes do fechamento deste boundary.

## Publication boundary

O desenho vigente separa código e autoridade humana:

- publisher: `release/v1.0.0-stable-publish`;
- approval ref: `release/v1.0.0-human-gate`;
- stable tag: `v1.0.0`;
- control lock: `mcf-control/v1.0.0`.

A approval ref está `NAO_APROVADO`; nenhum receipt aprovado foi criado. O publisher não recebe mais commits de HUMAN_GATE.

O receipt futuro exige LEANDRO, commit GitHub Web verificado, arquivo único e bytes exatos, vinculando release, RC3 e publisher SHA. O consumo futuro usa `git push --atomic` + lease da approval ref, criando control-lock + stable RC3 sem mover o publisher. Recovery só aceita o publisher SHA registrado no lock.

### Proteção server-side ainda requerida

- tag ruleset para `refs/tags/v1.0.0` e `refs/tags/mcf-control/v1.0.0`, active, `update` + `deletion`, **sem `creation`**, zero bypass/exclusions;
- branch ruleset para `refs/heads/release/v1.0.0-stable-publish`, active, `update` + `deletion`, zero bypass/exclusions.

O requirement anterior `branch ruleset + file_path_restriction` foi **SUPERSEDED**. Não é exigido Push Ruleset, private/internal, plano pago ou organização.

Sem os dois rulesets reais, o Stable Publication Gate deve falhar antes de autorização/publicação.

### Evidência técnica após review

```yaml
reference_technical_head: 6abb7c88e096c25c45d8457560907846affb57f6
stable_publication_gate_run: 31770534991
receipt_tests: PASS_10
ruleset_tests: PASS_11
atomic_git_real_tests: PASS_3
state_machine_tests: PASS_20
self_tests_total: PASS_44
expected_behavior_without_required_protection: FAIL_CLOSED_BEFORE_AUTHORIZATION
publish_stable: SKIPPED
```

Dois P2 do review exato anterior foram corrigidos/testados e aguardam nova revisão terminal: preservação dos bytes finais do receipt e rejeição de tag ruleset com `creation`.

O HEAD exato, run IDs e review independente finais são registrados externamente no PR #133/Issue #131 para evitar loop autorreferente.

## Auditoria terminal

Augusto/Júlia/Emily/LÉO só serão renovados depois de `publication_P0=0` e `publication_P1=0` confirmados por revisão independente e prova live dos controles externos.

```yaml
AUGUSTO_TRACE: NOT_RUN
JULIA_CLASS_C: NOT_RUN
EMILY_AUDIT: NOT_RUN
LEO_GATE: NOT_RUN
AUDIT: BLOCKED_BY_PUBLICATION_P1
```

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
