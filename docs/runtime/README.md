# MCF Runtime

**Classificação:** `CURRENT_IMPLEMENTED`  
**Estado detalhado:** [`../MCF-CURRENT-STATE.md`](../MCF-CURRENT-STATE.md)

Este diretório documenta o recorte executável do **Multiagent Collaboration Framework**. O runtime existe em código e testes; não é apenas especificação documental.

## Código executável

```text
apps/rede-social-agentes/apps/server/src/mcf-runtime/
```

Fontes relacionadas:

- `skills/registry.yaml` — contratos/estado das skills;
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md` — protocolo operacional;
- `docs/runtime/MCF-RUNTIME-006-PLAN.md` — plano e trilha histórica do RUNTIME-006;
- `artifacts/phases/` — PRFs, checkpoints e evidências por boundary;
- `.github/workflows/` — validação, staging, readiness, monitoramento e releases;
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/` — implementação e testes.

## Arquitetura executável

```text
Chat objective / mission
→ ChatMissionPlanner
→ ChatRuntimeBridge
→ MissionRuntime
→ SkillRegistryLoader
→ HumanDelegationGuard
→ PermissionEngine
→ SkillExecutor / ExternalActionDispatcher
→ Adapter
→ EvidenceValidator / Receipt
→ Persistence / Event Ledger
→ Handoff / CAF / Gate / Checkpoint
```

Componentes materiais incluem persistência de missões/fases/eventos, hierarquia e retorno à missão-pai, permissionamento/HDF, adapters externos, reservations/idempotência, evidence validation, blocked-mission observability e recovery.

## Estado atual reconciliado

```yaml
main: 7f741e10d0e745a90c732e084400b11e3f5e6794
runtime_line: MCF-RUNTIME-006
skills_registered: 16
skills_executable: 16
skills_documental_only: 0
gate_c_real_provider_write: COMPLETE
gate_d_staging_deploy: COMPLETE
gate_e_release_candidate: COMPLETE
production_readiness: COMPLETE
production: COMPLETE
rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
stable_v1_0_0: NOT_PUBLISHED
```

Esses valores são snapshot documental de 2026-08-13. Para estado operacional, confirme GitHub live.

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

O registro atual não contém skill exclusivamente documental.

## External Action Dispatcher e adapters

`CURRENT_IMPLEMENTED`:

- adapters read-only para revisão/CI;
- operações GitHub reversíveis qualificadas em Gate C real;
- reservation/idempotência para evitar efeito duplicado;
- reconciliação pós-write por leitura quando o efeito externo é incerto;
- deploy/staging com binding de SHA, readiness/version e recovery por redeploy;
- receipts persistentes e validação semântica de evidência.

**Limite:** recovery por redeploy de SHA saudável não deve ser descrito como rollback nativo do provider sem evidência específica.

## Observabilidade

O RUNTIME-006 integrou observabilidade de missões bloqueadas, com causa, fase/agente, evidência, próxima ação/recovery e persistência no ledger. Em produção, um workflow recorrente monitora `/health/ready` e mantém evidência operacional externa.

## MCF-CLOSE-PHASE

`MCF-CLOSE-PHASE` é executável com Carmem como primary owner e Mestre como handoff técnico. Um `ENTREGUE` verdadeiro exige objetivo atendido, ausência de blockers/findings bloqueantes, auditoria suficiente, decisão aprovadora, checkpoint coerente e nenhuma ação humana/técnica pendente incompatível.

LEANDRO não é executor nem handoff técnico; é autoridade humana final e entra somente nos gatilhos de HUMAN_GATE previstos pela governança.

## Linha histórica do RUNTIME-006

Os documentos/PRFs antigos preservam o estado real de seus respectivos boundaries:

```text
fundação/adapters
→ Gate C real provider write
→ Gate D staging/deploy
→ observabilidade
→ 16/16 skills executáveis
→ Gate E / RC1
→ Production Readiness / RC2
→ produção
→ RC3
→ stable boundary ainda não concluído
```

Por isso, trechos antigos como `production: BLOCKED`, `gate_c: NOT_AUTHORIZED` ou “próximo boundary: Gate E” são `HISTORICAL` quando aparecem em artifacts/decisões emitidos antes dos respectivos marcos posteriores.

## Evidência principal

- Gate C: `artifacts/phases/PHASE-006-GATE-C-REAL-PROVIDER-WRITE/`;
- Gate D: `artifacts/phases/PHASE-006-GATE-D-INTEGRATION/` e staging adapter;
- observabilidade: `artifacts/phases/PHASE-006-LOT-3-OBSERVABILITY/`;
- skills restantes: `artifacts/phases/PHASE-006-LOT-4-*/`;
- Gate E: `artifacts/phases/PHASE-006-GATE-E-RELEASE-CANDIDATE/`;
- releases: `docs/releases/MCF-v1.0.0-RC1.md`, RC2 e RC3;
- production readiness: `docs/decisions/MCF-DEC-063-PRODUCTION-READINESS-POST-RC1.md`;
- stable qualification: `docs/decisions/MCF-DEC-064-QUALIFICACAO-DA-RELEASE-ESTAVEL-V1.0.0.md`.

## NextGen

A branch `planning/mcf-nextgen-discovery` é `UNDER_STUDY`. Ela não redefine este runtime vigente. Nenhuma hipótese de Project Capsule, novas memory layers, model routing, DAG/paralelismo ou reestruturação NextGen deve ser tratada como implementada sem código/teste/evidência no lineage atual.
