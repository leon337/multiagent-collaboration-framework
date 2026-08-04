# MCF Runtime API

**Base:** `/v1/mcf`

## Autenticação

- endpoints de missão e bridge conversacional: sessão humana existente (`SessionAuthGuard`);
- callback de CI: header `x-mcf-runtime-token`;
- publicação social: não existe neste recorte.

## Despachar objetivo conversacional

```http
POST /v1/mcf/chat/dispatch
```

```json
{
  "objective": "Implementar uma ponte segura entre o chat e o runtime.",
  "repository": "leon337/multiagent-collaboration-framework",
  "sourceOfTruth": ["docs/runtime/MCF-RUNTIME-SPECIFICATION.md"]
}
```

O endpoint:

1. transforma o objetivo em contrato determinístico;
2. persiste a missão;
3. executa o bloco interno consecutivo no início do plano;
4. interrompe no primeiro passo externo;
5. retorna fases externas como `READY_EXTERNAL`;
6. mantém skills internas posteriores como `PLANNED_INTERNAL`;
7. mantém `humanActionRequired: false`.

O bloco interno inicial padrão executa:

```text
MCF-START-MISSION
→ MCF-SELECT-AGENTS
```

Ele não executa GitHub, Render, Vercel, Cloudflare ou CI sem recibo externo verificável. Objetivos Classe C são abertos, mas a próxima ação é direcionada ao gate de Léo antes de qualquer fase externa.

### Skills aceitas em `requestedSkills`

```text
MCF-START-MISSION
MCF-SELECT-AGENTS
MCF-IMPLEMENT-CHANGE
MCF-REVIEW-CODE
MCF-RUN-TESTS
MCF-GIT-PR-RELEASE
MCF-DEPLOY-VALIDATE
MCF-TRACE-MISSION
```

Resposta resumida:

```json
{
  "mission": {
    "id": "uuid",
    "state": "EXECUTING",
    "currentAgentId": "Rafael",
    "version": 3
  },
  "bootstrapPhaseId": "uuid-start",
  "bootstrapEvidenceStatus": "VALID",
  "internalExecutions": [
    {
      "skillId": "MCF-START-MISSION",
      "phaseId": "uuid-start",
      "evidenceStatus": "VALID",
      "handoffTo": "Miriam"
    },
    {
      "skillId": "MCF-SELECT-AGENTS",
      "phaseId": "uuid-select",
      "evidenceStatus": "VALID",
      "handoffTo": "Rafael"
    }
  ],
  "plan": [
    {
      "order": 1,
      "skillId": "MCF-START-MISSION",
      "agentId": "Mestre",
      "handoffTo": "Miriam",
      "toolProvider": "internal",
      "state": "COMPLETED"
    },
    {
      "order": 2,
      "skillId": "MCF-SELECT-AGENTS",
      "agentId": "Mestre",
      "handoffTo": "Rafael",
      "toolProvider": "internal",
      "state": "COMPLETED"
    },
    {
      "order": 3,
      "skillId": "MCF-IMPLEMENT-CHANGE",
      "agentId": "Rafael",
      "handoffTo": "Vinicius",
      "toolProvider": "github",
      "state": "READY_EXTERNAL"
    },
    {
      "order": 7,
      "skillId": "MCF-TRACE-MISSION",
      "agentId": "Augusto",
      "handoffTo": "Beatriz",
      "toolProvider": "internal",
      "state": "PLANNED_INTERNAL"
    }
  ],
  "humanActionRequired": false
}
```

## Criar missão

```http
POST /v1/mcf/missions
```

```json
{
  "contract": {
    "title": "Runtime verificável",
    "objective": "Executar uma missão persistente com evidência confiável.",
    "expectedOutcome": "Missão concluída com ledger e recibos.",
    "scope": ["runtime"],
    "outOfScope": ["deploy público"],
    "acceptanceCriteria": ["testes críticos passam"],
    "riskClass": "B",
    "selectedAgents": ["Mestre", "Rafael", "Renato", "Emily"],
    "selectedSkills": [
      "MCF-START-MISSION",
      "MCF-IMPLEMENT-CHANGE",
      "MCF-RUN-TESTS"
    ],
    "sourceOfTruth": ["skills/registry.yaml"]
  }
}
```

## Consultar missão

```http
GET /v1/mcf/missions/{missionId}
```

Retorna estado materializado e `version` atual.

## Executar fase

```http
POST /v1/mcf/missions/{missionId}/phases/execute
```

### Seleção interna

```json
{
  "skillId": "MCF-SELECT-AGENTS",
  "agentId": "Mestre",
  "inputs": {
    "mission_contract": {},
    "risk_class": "B",
    "selected_domain_agent": "Rafael"
  },
  "tool": {
    "provider": "internal",
    "operation": "inspect-selection",
    "resource": "mcf-chat-bridge"
  },
  "expectedMissionVersion": 2
}
```

O `handoffTo` retornado será o valor validado de `selected_domain_agent`, nunca o marcador textual do registro.

### Fase externa pendente

```json
{
  "skillId": "MCF-RUN-TESTS",
  "agentId": "Renato",
  "inputs": {
    "acceptance_criteria": ["pnpm verify passa"],
    "test_target": "pull request",
    "authorizedScope": true
  },
  "tool": {
    "provider": "github-actions",
    "operation": "workflow-result",
    "resource": "leon337/multiagent-collaboration-framework"
  },
  "expectedMissionVersion": 4
}
```

Sem recibo, a resposta retorna:

```yaml
evidenceStatus: PENDING
phaseState: WAITING_EVIDENCE
missionState: WAITING_EXTERNAL
```

## Recibos semânticos

A assinatura HMAC e o digest continuam obrigatórios. As skills abaixo também exigem metadados específicos.

### Revisão de código

```yaml
skill: MCF-REVIEW-CODE
provider: github
operation: inspect-code
receipt:
  commitSha: required
  metadata:
    findingsCount: non_negative_integer
    verdict: non_empty_string
    reviewedFiles: non_empty_array
```

### PR e integração

```yaml
skill: MCF-GIT-PR-RELEASE
provider: github
receipt:
  externalId: required
  commitSha: required
  metadata:
    ciStatus: success
    gateDecision: approved
    prState: non_empty_string
```

### Deploy e validação

```yaml
skill: MCF-DEPLOY-VALIDATE
providers: [render, vercel, cloudflare]
receipt:
  externalId: required
  commitSha: required
  metadata:
    deploymentStatus: [live, ready, success]
    smokeStatus: [pass, success]
    rollbackAvailable: true
```

Deploy para `production` ou `produção` exige `humanGateApproved: true`, além de `authorizedScope: true`.

## Callback do GitHub Actions

```http
POST /v1/mcf/callbacks/github-actions
x-mcf-runtime-token: <secret>
```

```json
{
  "missionId": "uuid",
  "phaseId": "uuid",
  "workflowName": "MCF Runtime Integration",
  "workflowRunId": "30890000000",
  "repository": "leon337/multiagent-collaboration-framework",
  "commitSha": "40-char-sha",
  "conclusion": "success",
  "completedAt": "2026-08-04T08:00:00.000Z"
}
```

Callbacks repetidos retornam `duplicate: true` e não duplicam eventos.

## Timeline técnica

```http
GET /v1/mcf/missions/{missionId}/timeline
```

Retorna a missão e todos os eventos ordenados.

## Candidatos sociais

```http
GET /v1/mcf/missions/{missionId}/social-candidates
```

Retorna somente projeções de `PHASE_COMPLETED` e `MISSION_COMPLETED`.

```yaml
automaticPublication: false
humanApprovalRequired: true
```

## Erros públicos

```text
MCF_RESOURCE_NOT_FOUND       404
MCF_VERSION_CONFLICT         409
MCF_PERMISSION_DENIED        403
MCF_EXECUTION_REJECTED       422
MCF_RUNTIME_AUTHENTICATION_FAILED 401
```
