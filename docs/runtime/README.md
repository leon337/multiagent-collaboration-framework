# MCF Runtime

Este diretório documenta o recorte executável do Multiagent Collaboration Framework.

Fontes canônicas relacionadas:

- `skills/registry.yaml` — contratos das skills;
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md` — protocolo operacional;
- `docs/runtime/MCF-RUNTIME-006-PLAN.md` — plano e closeout histórico do RUNTIME-006;
- `artifacts/phases/` — evidência por fase;
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/` — código e testes.

## Arquitetura

```text
Chat objective
→ ChatMissionPlanner
→ ChatRuntimeBridge
→ MissionRuntime
→ SkillRegistryLoader
→ HumanDelegationGuard
→ PermissionEngine
→ SkillExecutor
→ EvidenceValidator
→ Persistence / Event Ledger
→ Handoff / Recovery
```

## Estado atual

```yaml
runtime_006: COMPLETE
skills_registered: 16
skills_executable: 16
skills_documental: 0

gate_c_real_provider_write: COMPLETE
gate_d_staging: COMPLETE
gate_e_release_candidate: COMPLETE

release_lineage:
  rc1: v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
  rc2: v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719
  rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794

production:
  state: LIVE
  qualified_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
  render_service: rsa-api-free
  latest_health_run: 31677775717
  latest_health: PASS_WITH_COLD_START_RECOVERY
  material_incidents_open: 0

stable_release_boundary:
  mission: MCF-STABLE-RELEASE-001
  issue: 131
  pr: 133
  state: REQUALIFYING
  candidate_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
  technical_boundary_reviewed_head: ce3ac1d5a605793c5eba74ff76a12f92bf515449
  publication_P0_count: 0
  publication_P1_count: 0
  critical_findings: 0
  high_findings: 0
  audit: PENDING_REAL_RENEWAL
  leo_gate: PENDING_REAL_RENEWAL
  human_gate: NAO_APROVADO
  stable_v1_0_0: NAO_PUBLICADA
```

O RUNTIME-006 e Gate E são históricos concluídos. A missão atual é o boundary Classe C separado `MCF-STABLE-RELEASE-001`.

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

## Rastreabilidade multiagente

O registry vigente define:

- `MCF-TRACE-MISSION` — primary owner Augusto;
- `MCF-SECURITY-REVIEW` — owners Ricardo/Júlia;
- `MCF-CLOSE-PHASE` — owners Carmem/Emily/Léo/Mestre, exigindo auditoria e decisão de LÉO.

Os endpoints reais de missão são protegidos por sessão Bearer válida. Comentários históricos no GitHub atribuídos a Augusto/Júlia/Emily/LÉO foram gravados via `chatgpt-codex-connector` e não substituem execução real do runtime para o boundary atual.

```yaml
AUGUSTO_TRACE: PENDING
JULIA_CLASS_C: PENDING
EMILY_AUDIT: PENDING
LEO_GATE: PENDING
```

## Publication boundary

O boundary técnico foi requalificado no HEAD `ce3ac1d5...`:

```yaml
publication_gate_run: 31679151733
publication_validation: PASS
production_readiness_run: 31679151776
production_readiness: PASS
documentation_validation_run: 31679151867
documentation_validation: PASS
independent_review_comment: 5277559034
independent_review: NO_MAJOR_ISSUES
publication_P0_count: 0
publication_P1_count: 0
```

O HUMAN_GATE futuro exige comentário da identidade GitHub autorizada de LEANDRO, com login/id/corpo/release/PR_HEAD exatos e `performed_via_github_app == null`. Um comentário criado pelo ChatGPT/Codex connector não qualifica.

Formato esperado somente depois de todos os controles e de uma decisão explícita de LEANDRO:

```text
LEANDRO_HUMAN_GATE: APPROVED
RELEASE: v1.0.0
PR_HEAD: <SHA exato do HEAD revisado do PR #133>
```

No estado atual não existe recibo qualificante; o job mutável permanece bloqueado.

## Produção e monitor

O monitor mais recente verificado é o run `31677775717`, SUCCESS no SHA RC3. O primeiro probe de readiness excedeu 20 s e a tentativa seguinte passou dentro da política de cold start. Nenhum incidente material aberto foi encontrado; Issue #129 permanece CLOSED/completed.

## Imutabilidade

- **governança:** identidades de release não devem ser retargetadas/reutilizadas;
- **proteção técnica observada:** RC3 `immutable:false`, rulesets `[]`, `main` sem branch protection observada;
- não se afirma undeletability técnica.

## Autorização vigente

```yaml
HUMAN_GATE: NAO_APROVADO
MERGE_PUBLICACAO_v1_0_0: NAO_AUTORIZADOS
TAG_v1_0_0: NAO_AUTORIZADA
GITHUB_RELEASE_v1_0_0: NAO_AUTORIZADA
LATEST_v1_0_0: NAO_AUTORIZADO
stable_v1_0_0: NAO_PUBLICADA
```

Nenhum conteúdo deste documento constitui autorização para publicar `v1.0.0`.