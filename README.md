# Multiagent Collaboration Framework

Framework experimental para colaboração entre múltiplos agentes de IA com papéis definidos, seleção por competência, execução sequencial visível, loop orientado a objetivo, passagem de bastão contínua, skills versionadas, runtime persistente, evidência verificável, auditoria e gates governados.

## Governança

- **Leandro** é a autoridade humana final e não entra na contagem dos agentes.
- **Léo** é a autoridade delegada de continuidade operacional e gates internos.
- **Mestre** coordena a equipe, mantém o mapa da missão e apresenta o fluxo completo.
- Existem **29 agentes nomeados**, selecionados dinamicamente por competência.
- O protocolo operacional vigente está em `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`.

## Runtime executável

```text
objetivo conversacional
→ Chat-to-Runtime Bridge
→ MissionRuntime
→ SkillRegistryLoader
→ Human Delegation Firewall
→ PermissionEngine
→ SkillExecutor
→ EvidenceValidator
→ PostgreSQL / Event Ledger
→ Handoff / CAF
→ trace final verificado
```

## Estado canônico atual

```yaml
skills_registradas: 16
skills_executaveis: 16
skills_documentais: 0

runtime_006:
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
  latest_health_run: 31677775717
  latest_health: PASS_WITH_COLD_START_RECOVERY
  material_incidents_open: 0

stable_release_boundary:
  mission: MCF-STABLE-RELEASE-001
  issue: 131
  operational_pr: 133
  macrostate: REQUALIFYING
  required_stable_target_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
  technical_boundary_reviewed_head: ce3ac1d5a605793c5eba74ff76a12f92bf515449
  publication_P0_count: 0
  publication_P1_count: 0
  critical_findings: 0
  high_findings: 0
  audit: PENDING_REAL_RENEWAL
  leo_gate: PENDING_REAL_RENEWAL
  human_gate: NAO_APROVADO
  stable_v1_0_0: NAO_PUBLICADA
  publication_authorized: false
```

Os commits do PR #133 pertencem somente ao **control plane de publicação**. Eles não mudam o SHA qualificado da RC3 nem o alvo permitido da eventual `v1.0.0`.

## Boundary atual — MCF-STABLE-RELEASE-001

A produção e a RC3 já foram qualificadas. A missão stable é um milestone Classe C separado, conforme `MCF-DEC-064`; não existe Gate F inventado.

O HUMAN_GATE permanece **NÃO APROVADO**. `v1.0.0` permanece NÃO PUBLICADA.

O publication boundary técnico foi requalificado após sucessivas rodadas de finding/correção/teste/review. O mecanismo final protege contra:

- substring/quote/autor incorreto;
- recibo de HEAD obsoleto;
- stale run e janela TOCTOU antes da mutação;
- recovery divergente;
- comentário mediado por GitHub App usando o mesmo login/id de LEANDRO.

O recibo futuro deve ser exatamente:

```text
LEANDRO_HUMAN_GATE: APPROVED
RELEASE: v1.0.0
PR_HEAD: <SHA exato do HEAD revisado do PR #133>
```

Além de login/id/corpo/release/HEAD exatos, o workflow exige `performed_via_github_app == null`. Portanto, um comentário criado via ChatGPT/Codex ou outro GitHub App não satisfaz o HUMAN_GATE.

### Evidência do boundary técnico

```yaml
head: ce3ac1d5a605793c5eba74ff76a12f92bf515449
stable_publication_gate_run: 31679151733
validation: PASS
app_mediated_negative_fixture: PASS
qualifying_receipts: 0
stable_state: ABSENT
publish_stable: SKIPPED
production_readiness_run: 31679151776
production_readiness: PASS
documentation_validation_run: 31679151867
documentation_validation: PASS
independent_review_comment: 5277559034
independent_review: NO_MAJOR_ISSUES
publication_P0_count: 0
publication_P1_count: 0
```

O P1 foi zerado somente depois de correção, teste dedicado, evidência e revisão independente.

## Auditoria multiagente

Os comentários históricos atribuídos a Augusto/Júlia/Emily e o antigo `LEO_GATE: PASS` foram gravados via `chatgpt-codex-connector`. São mantidos como histórico, mas não contam como renovação real do boundary atual.

O runtime real possui `MCF-TRACE-MISSION`, `MCF-SECURITY-REVIEW` e `MCF-CLOSE-PHASE`, mas seus endpoints de missão exigem sessão Bearer válida. O canal atual não possui essa sessão e nenhum secret será extraído ou exposto para contornar o controle.

```yaml
AUGUSTO_TRACE: PENDING
JULIA_CLASS_C: PENDING
EMILY_AUDIT: PENDING
LEO_GATE: PENDING
```

Por isso a missão continua `REQUALIFYING` e ainda não é `READY_FOR_HUMAN_GATE`.

## Produção e monitor

O monitor agendado mais recente verificado é o run `31677775717`, concluído com `SUCCESS` no SHA RC3. O primeiro probe `/health/ready` excedeu 20 segundos e a tentativa de recuperação cold-start passou. Nenhum incidente material aberto foi encontrado e a Issue #129 permanece `CLOSED/completed`.

O cold start é explicitado como observação operacional LOW/não bloqueante.

## Imutabilidade de release

**Imutabilidade de governança:** tags/releases versionadas não devem ser retargetadas/reutilizadas.

**Proteção técnica observada:** RC3 apresenta `immutable: false`; rulesets observados `[]`; `main` sem branch protection observada. Não é alegada undeletability técnica absoluta.

## Efeito futuro da publicação

Somente depois de auditoria real, `LEO_GATE: PASS` e HUMAN_GATE explícito de LEANDRO, um HEAD final aprovado poderá:

1. criar `v1.0.0` apontando exatamente para `7f741e10...`;
2. criar GitHub Release não-prerelease;
3. marcar `v1.0.0` como `latest`;
4. verificar tag, release, target e estado final.

Esses efeitos permanecem **NÃO AUTORIZADOS**.

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
- `docs/runtime/MCF-RUNTIME-006-PLAN.md`
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

Nenhum texto deste README constitui autorização para publicar `v1.0.0`.