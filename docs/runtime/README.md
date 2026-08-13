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
remaining_documental: []

gate_c_real_provider_write: COMPLETE
gate_d_staging: COMPLETE
gate_e_release_candidate: COMPLETE

release_lineage:
  rc1: v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
  rc2: v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719
  rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
  rc1_rc2_rc3: PRESERVED_PRERELEASES

production:
  state: LIVE
  qualified_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
  render_service: rsa-api-free
  production_readiness_run: 31653194401
  production_readiness: PASS
  latest_health_run: 31671899893
  latest_health: PASS_WITH_COLD_START_RECOVERY
  material_incident_open: false

stable_release_boundary:
  mission: MCF-STABLE-RELEASE-001
  issue: 131
  pr: 133
  state: REQUALIFYING
  required_target_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
  publication_P0_count: 0
  publication_P1_count: 1
  human_gate: NAO_APROVADO
  stable_v1_0_0: NAO_PUBLICADA
  publication_authorized: false
```

O RUNTIME-006 e o Gate E são históricos concluídos. A missão atual é separada: `MCF-STABLE-RELEASE-001`. Nenhuma frase antiga do closeout do Gate E que dizia `production: BLOCKED` deve ser interpretada como estado global atual; ela registra o boundary existente naquele momento.

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

Não há skill documental remanescente no runtime integrado.

## MCF-CLOSE-PHASE

```yaml
primary_owner: Carmem
owners: [Carmem, Emily, Leo, Mestre]
planner_state: READY_AGENT
handoff: Mestre
permission_profile: SCOPED_WRITE
provider: internal
operation: close-phase
resource: mcf-agent-runtime
```

O bridge não auto-completa a skill. Evidência obrigatória continua incluindo `phase_pack`, `audit_verdict`, `leo_decision` e `checkpoint`.

`ENTREGUE` só é válido com objetivo atendido, ausência de blockers/findings pendentes ou bloqueantes, auditoria PASS/PASSED, decisão aprovadora de Léo, nenhuma próxima ação pendente, `human_action_required=false` e concordância entre decisão/checkpoint.

Leandro não pode ser executor nem destinatário de handoff técnico; sua participação ocorre somente por `HUMAN_GATE` explícito conforme o protocolo.

## Rastreabilidade multiagente

O registry vigente define:

- `MCF-TRACE-MISSION` — owner `Augusto`, READ_ONLY, exige trace cronológico, handoffs e recovery;
- `MCF-SECURITY-REVIEW` — owners `Ricardo, Julia`, com veredito de governança e risco residual;
- `MCF-CLOSE-PHASE` — owners `Carmem, Emily, Leo, Mestre`, exige auditoria independente, decisão de Léo e checkpoint;
- sucesso sem evidência e self-approval sem evidência permanecem proibidos.

A auditoria Classe C da stable deve ser renovada no HEAD final do control plane antes de qualquer retorno ao HUMAN_GATE de LEANDRO.

## Estado da publicação estável

Os dois P1s originais do PR #133 receberam correção e prova executável. Uma revisão independente posterior encontrou um novo P1: recibo humano não vinculado ao HEAD revisado. A correção atual exige um recibo exato para release + PR_HEAD e revalida o HEAD remoto antes de qualquer efeito.

Formato esperado somente quando um futuro pacote final tiver sido aprovado tecnicamente e LEANDRO decidir aprovar:

```text
LEANDRO_HUMAN_GATE: APPROVED
RELEASE: v1.0.0
PR_HEAD: <SHA exato do HEAD revisado do PR #133>
```

No estado atual não existe recibo qualificante e o job mutável permanece bloqueado.

## Imutabilidade

- **governança:** identidades de release não devem ser retargetadas/reutilizadas;
- **proteção técnica observada:** não há evidência atual de undeletability absoluta; RC3 apresenta `immutable: false`, rulesets observados `[]` e `main` sem branch protection observada;
- portanto, não se afirma proteção técnica que não esteja configurada.

## Documentação da missão stable

- `docs/decisions/MCF-DEC-064-QUALIFICACAO-DA-RELEASE-ESTAVEL-V1.0.0.md`
- `docs/releases/MCF-v1.0.0-RC3.md`
- `artifacts/phases/PHASE-STABLE-RELEASE-001/PUBLICATION-BOUNDARY.md`
- `artifacts/phases/PHASE-STABLE-RELEASE-001/PHASE-STABLE-RELEASE-001-CHECKPOINT.yaml`
- `artifacts/phases/PHASE-STABLE-RELEASE-001/PHASE-STABLE-RELEASE-001-PRF.md`
- `artifacts/phases/PHASE-STABLE-RELEASE-001/PHASE-STABLE-RELEASE-001-REPORT.md`

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