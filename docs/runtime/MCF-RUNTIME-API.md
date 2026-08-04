# MCF Runtime API

**Base:** `/v1/mcf`

## Autenticação

- endpoints de missão: sessão humana existente (`SessionAuthGuard`);
- callback de CI: header `x-mcf-runtime-token`;
- publicação social: não existe neste recorte.

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

### Fase interna

```json
{
  "skillId": "MCF-START-MISSION",
  "agentId": "Mestre",
  "inputs": {
    "objective": "Executar runtime"
  },
  "tool": {
    "provider": "internal",
    "operation": "create-contract",
    "resource": "mission/new"
  },
  "expectedMissionVersion": 1
}
```

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
  "expectedMissionVersion": 3
}
```

Sem recibo, a resposta retorna:

```yaml
evidenceStatus: PENDING
phaseState: WAITING_EVIDENCE
missionState: WAITING_EXTERNAL
```

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
