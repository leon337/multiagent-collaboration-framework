# MCF-LOCAL-AGENT-TEAM-RUNTIME-001

- **Issue:** #215
- **Status neste branch:** implementation candidate
- **Base:** `main@6c3d0f22cb35471b5d823fd83f7950ea67ad66aa`
- **Boundary:** local, non-production, disabled by default

## Achado integrado

O experimento local de 2026-09-18 provou roteamento de equipe, processos separados,
receipts por worker e receipt consolidado. Esta integração não copia o runtime
experimental para dentro do MCF. Ela encaixa o achado no runtime canônico existente.

```text
MissionRuntimeService
  -> SkillExecutor
  -> ExternalActionDispatcher
  -> AdapterRegistry
  -> LocalAgentTeamAdapter
  -> worker processes
  -> child receipts
  -> consolidated receipt
  -> EvidenceValidator
```

## Identidades

Os aliases experimentais foram reconciliados com identidades canônicas:

| Alias experimental | Identidade canônica |
| ------------------ | ------------------- |
| Sofia              | Sofia               |
| Beatriz            | Beatriz             |
| Emily              | Emily               |
| carmen             | Carmem              |
| Infra              | Bruno               |
| GitHub             | Gabriel             |
| Security           | Ricardo             |
| QA                 | Renato              |

Nenhum novo agente oficial é criado. A composição oficial continua sendo a matriz de 29 agentes.

## Controles

- provider: `local-agent-runtime`;
- operação: `execute-agent-team`;
- resource: `mcf-agent-runtime`;
- skill: `MCF-EXECUTE-LOCAL-TEAM`;
- executor desabilitado por padrão;
- proibido habilitar em `NODE_ENV=production`;
- subprocessos iniciados com `spawn(process.execPath, ...)`, sem shell;
- objetivo enviado via IPC, não interpolado em comando;
- paralelismo limitado a 1..8;
- timeout limitado e worker encerrado com `SIGKILL`;
- `mission_selected_agents` é sobrescrito server-side pelo `MissionRuntimeService`;
- receipts filhos e pai são assinados pelo `EvidenceValidator`;
- mismatch de roteamento, PID repetido ou receipt inválido falha fechado.

## Non-claim obrigatório

`processIsolationObserved=true` significa apenas processos de sistema distintos.

Ele **não** prova:

- modelos LLM independentes;
- cognição independente;
- sessões de modelo independentes;
- contribuição intelectual autônoma.

Por isso todos os receipts qualificáveis preservam:

```json
{
  "executionMode": "DETERMINISTIC_LOCAL_PROCESS",
  "cognitiveIndependenceProven": false
}
```

## Evidência da qualificação local

A inspeção paralela de integração foi repetida com `BASHPID`, evitando o falso
positivo de `$$` em subshells. Foram observados oito PIDs distintos na passagem:

`69750, 69751, 69752, 69754, 69756, 69758, 69760, 69762`.

Os testes do branch cobrem:

- identidades canônicas;
- roteamento determinístico;
- mission contract boundary;
- receipts pai/filhos verificáveis;
- executor disabled fail-closed;
- dois workers reais em processos OS distintos;
- timeout de worker;
- planner disabled-by-default;
- composição do AdapterRegistry.

## Gate

Merge, release e produção permanecem fora do escopo desta missão. O PR deve ser
revisado antes de qualquer alteração do estado canônico de `main`.
