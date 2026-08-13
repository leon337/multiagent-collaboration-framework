# Multiagent Collaboration Framework

Framework experimental para colaboração entre múltiplos agentes de IA com papéis definidos, seleção por competência, execução sequencial visível, loop orientado a objetivo, passagem de bastão contínua, skills versionadas, runtime persistente, evidência verificável, auditoria e gates governados.

## Governança

- **Leandro** é a autoridade humana final.
- **Léo** é a autoridade delegada de continuidade operacional e gates internos.
- **Mestre** coordena a equipe e a missão.
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
  publication_P1_count: 2
  critical_findings: 0
  high_findings: 0
  audit: BLOCKED_BY_PUBLICATION_P1
  leo_gate: BLOCKED_BY_PUBLICATION_P1
  human_gate: NAO_APROVADO
  stable_v1_0_0: NAO_PUBLICADA
  publication_authorized: false
```

RC1, RC2 e RC3 permanecem preservadas. Os commits do PR #133 pertencem somente ao control plane de publicação e não mudam o SHA qualificado da RC3.

## Publication boundary

Dois P1s foram corrigidos tecnicamente e testados, mas permanecem formalmente abertos até revisão independente do SHA final:

1. a criação da identidade `v1.0.0` agora deve estabelecer e validar primeiro a tag exata em RC3, falhando antes da criação de release se uma corrida produzir SHA divergente;
2. comentário mutável deixou de ser autoridade de HUMAN_GATE; o mecanismo futuro exige um receipt em commit GitHub Web verificado, exclusivo do arquivo de autorização e vinculado ao control-head revisado.

O GitHub Environment foi investigado, porém o environment observado está sem required reviewer/protection rules configurados. Essa proteção não é alegada nem usada.

Estado atual do receipt:

```yaml
authority: LEANDRO
state: NAO_APROVADO
release: v1.0.0
approved_control_head: null
approval_method: GITHUB_WEB_VERIFIED_COMMIT_REQUIRED
```

Evidência técnica mais recente antes da reconciliação documental:

```yaml
technical_head: 4d5144ce46c9c77955c732824f5225f81cf0b55d
stable_publication_gate_run: 31726482829
validation: PASS
self_tests: PASS_16
authorize_publication: APPROVED_FALSE
publish_stable: SKIPPED
documentation_validation: PASS
```

O primeiro self-test desse desenho falhou de forma segura; o CAF identificou dependência indevida da semântica de `set -e`, os predicados foram endurecidos com retornos explícitos e o reteste passou.

`publication_P1_count` somente poderá voltar a zero depois de revisão independente do HEAD documental final confirmar os dois cenários.

## Produção e monitor

```yaml
production_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
render_service: rsa-api-free
render_deploy: dep-d9ugl7gae00c73c5snv0
production_state: LIVE
latest_health_run: 31677775717
latest_health_result: SUCCESS
cold_start_recovery: PASS
material_incidents_open: 0
```

## Auditoria terminal

Por orientação de governança, Augusto/Júlia/Emily/LÉO não são executados como substituição dos P1s atuais.

```yaml
AUGUSTO_TRACE: NOT_RUN
JULIA_CLASS_C: NOT_RUN
EMILY_AUDIT: NOT_RUN
LEO_GATE: NOT_RUN
AUDIT: BLOCKED_BY_PUBLICATION_P1
```

## Imutabilidade

A imutabilidade das versões é uma regra de governança. Não é alegada proteção técnica absoluta: RC3 apresenta `immutable:false`, não há ruleset observado e `main` não está protegida no estado verificado.

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
