# MCF-DEC-057 — Expansão de skills executáveis e recibos semânticos

## Estado

```yaml
status: APROVADA_E_VALIDADA_EM_STAGING
mission: MCF-RUNTIME-004
owner: Leo
human_final_authority: Leandro
```

## Contexto

O runtime executável inicial reconhecia somente:

- `MCF-START-MISSION`;
- `MCF-IMPLEMENT-CHANGE`;
- `MCF-RUN-TESTS`.

O registro oficial já continha 16 skills, mas declarar uma skill no YAML não a torna executável. Era necessário ampliar o recorte sem transformar afirmações textuais em execução externa.

## Decisão

O primeiro lote amplia o conjunto executável de três para oito skills:

```yaml
internal_execution:
  - MCF-START-MISSION
  - MCF-SELECT-AGENTS
  - MCF-TRACE-MISSION
external_receipt_required:
  - MCF-IMPLEMENT-CHANGE
  - MCF-REVIEW-CODE
  - MCF-RUN-TESTS
  - MCF-GIT-PR-RELEASE
  - MCF-DEPLOY-VALIDATE
```

## Fluxo padrão de mudança

```text
Mestre inicia missão
→ Mestre seleciona agentes
→ Rafael implementa
→ Vinicius revisa
→ Renato valida
→ Gabriel controla PR e gate
→ Augusto registra trace final
```

`MCF-DEPLOY-VALIDATE` é incluída somente quando o objetivo exigir ambiente, deploy, publicação ou rollback.

## Bloco interno causal

O Chat-to-Runtime Bridge executa somente as skills internas consecutivas no início do plano. Ele interrompe no primeiro passo externo.

Estados de planejamento:

```yaml
PLANNED_INTERNAL: skill interna ainda não executada
COMPLETED: skill interna executada com recibo válido
READY_EXTERNAL: ferramenta externa e recibo ainda necessários
```

Uma skill interna posicionada depois de uma fase externa não é antecipada. Por exemplo, `MCF-TRACE-MISSION` permanece `PLANNED_INTERNAL` até que as fases anteriores sejam concluídas.

Quando a missão contém apenas skills internas, não existe fase externa para interromper o bloco. Nesse caso, o bridge executa `MCF-START-MISSION`, `MCF-SELECT-AGENTS` e `MCF-TRACE-MISSION` em sequência; o trace final pode concluir a missão no próprio dispatch.

## Handoff dinâmico

`MCF-SELECT-AGENTS` usa `selected_domain_agent` no registro. O runtime exige uma entrada explícita e persiste o destinatário real. O marcador textual não pode ser gravado como agente.

As seguintes barreiras são aplicadas pelo runtime, independentemente do planejador:

```yaml
mission_contract:
  Leandro_in_selectedAgents: forbidden
handoff:
  target_not_in_selectedAgents: forbidden
  target_Leandro: forbidden
execution:
  agentId_Leandro: forbidden
```

A rejeição ocorre antes da persistência de eventos da fase ou da ferramenta.

## Política de conclusão da missão

`MCF-RUN-TESTS` e o callback de CI concluem somente a fase correspondente. Eles não encerram mais a missão.

A missão só pode chegar a `COMPLETED` quando:

```text
MCF-TRACE-MISSION
+ final_checkpoint=true
+ ledger possui PHASE_COMPLETED para todas as skills selecionadas
→ MISSION_COMPLETED
```

Se qualquer skill selecionada estiver ausente no ledger, o trace permanece válido, mas a missão continua `EXECUTING`.

Essa política impede que CI verde encerre prematuramente um fluxo que ainda possui PR, deploy, auditoria ou trace pendente.

## Recibos semânticos

Além de assinatura HMAC, digest, data, provider, operação e recurso, as seguintes skills exigem conteúdo específico:

### MCF-REVIEW-CODE

```yaml
provider: github
required:
  - commitSha
  - metadata.findingsCount
  - metadata.verdict
  - metadata.reviewedFiles
```

### MCF-GIT-PR-RELEASE

```yaml
provider: github
required:
  - externalId
  - commitSha
  - metadata.ciStatus: success
  - metadata.gateDecision: approved
  - metadata.prState
```

### MCF-DEPLOY-VALIDATE

```yaml
providers: [render, vercel, cloudflare]
required:
  - externalId
  - commitSha
  - metadata.deploymentStatus: [live, ready, success]
  - metadata.smokeStatus: [pass, success]
  - metadata.rollbackAvailable: true
```

## Gates de segurança

- execução interna é limitada a início, seleção e observabilidade;
- revisão de código usa operação somente leitura `inspect-code`;
- PR/release exige CI verde e gate aprovado no recibo;
- deploy de staging exige escopo autorizado;
- deploy para `production` ou `produção` exige `humanGateApproved: true`;
- escrita direta na `main` continua proibida;
- Leandro é bloqueado no contrato, na execução e no handoff técnico pelo HDF;
- ferramentas externas sem recibo permanecem `WAITING_EVIDENCE`;
- callback de CI não produz `MISSION_COMPLETED`.

## Limites

As outras oito skills do registro continuam documentadas, mas não executáveis pelo `SkillExecutor`. A ampliação futura será feita em lotes com contratos, permissões e evidências próprias.

O runtime valida recibos produzidos por integrações confiáveis. Esta decisão não cria, por si só, conectores autônomos de GitHub, Render, Vercel ou Cloudflare dentro do servidor.

## Critérios de aceite

```yaml
executable_skills: 8
internal_selection: verified
internal_trace: verified
dynamic_handoff: verified
review_receipt_semantics: verified
pr_receipt_semantics: verified
deploy_receipt_semantics: verified
production_gate: verified
mission_completion_by_final_trace: verified
ci_callback_closes_phase_only: verified
risk_downgrade: blocked
leandro_in_contract: blocked
leandro_as_executor: blocked
leandro_as_handoff: blocked
format_lint_typecheck: passed
migrations_twice: passed
tests_build: passed
container_smoke: passed
staging_e2e: passed
```

## Evidências de validação

```yaml
runtime_deploy:
  service: mcf-runtime-staging-api
  commit: 1b874745fff03e6a11311dd0f2e6e2fcbdb78644
  deploy_id: dep-d9p8ann10e5c73cns5ng
  status: live
hdf_staging_e2e:
  workflow_run_id: 30963759073
  job_id: 92181398156
  conclusion: success
eight_skill_staging_e2e:
  workflow: MCF Runtime V2 E2E
  workflow_run_id: 30968396598
  job_id: 92187240740
  tested_commit: cbf6d2b738b8f7010c73e57e27fcd0dc1b61b2c7
  conclusion: success
  verified:
    - eight_executable_skills_recognized
    - initial_internal_block_persisted
    - external_phases_wait_for_real_receipts
    - ci_callback_completes_phase_only
    - duplicate_callback_is_idempotent
    - production_deploy_without_gate_is_blocked
    - incomplete_external_mission_does_not_close
    - internal_only_mission_closes_on_bridge_final_trace
    - technical_session_revoked
```

A execução E2E não fabricou recibos de GitHub, Render, Vercel ou Cloudflare. Revisão, PR/release e deploy permaneceram pendentes quando não havia recibo externo confiável, preservando o limite declarado nesta decisão.
