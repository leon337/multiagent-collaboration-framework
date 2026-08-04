# MCF Runtime — Especificação Consolidada

**Versão:** 1.0.0  
**Decisão-base:** MCF-DEC-054  
**Estado:** candidato de release

## 1. Objetivo

Transformar contratos de missão e skills em execução persistente, validada e auditável.

## 2. Componentes

### MissionRuntimeService

Coordena criação, execução, callbacks, estados, eventos e handoffs.

### SkillRegistryLoader

Lê `skills/registry.yaml` sem criar uma segunda fonte de verdade. O parser aceita o subconjunto utilizado pelo registro atual e rejeita entradas incompletas ou IDs duplicados.

### PermissionEngine

Aplica:

- autoria da skill;
- ferramenta permitida;
- ferramenta proibida;
- perfil de permissão;
- escopo autorizado;
- gate humano;
- bloqueio de escrita direta em `main`;
- bloqueio de ações destrutivas ou públicas.

### SkillExecutor

Executa inicialmente:

```text
MCF-START-MISSION
MCF-IMPLEMENT-CHANGE
MCF-RUN-TESTS
```

Skills registradas, mas ainda sem adapter, são rejeitadas como `registered_but_not_executable`.

### EvidenceValidator

Assina e verifica recibos usando HMAC SHA-256. O digest SHA-256 cobre os metadados canônicos.

### MissionRepository

Persiste estado materializado e ledger em PostgreSQL. Atualizações de fase usam a versão esperada da missão para impedir perda silenciosa de concorrência.

### SocialTimelineService

Projeta apenas conclusões verificadas como candidatos `DRAFT_REVIEW`. Não publica conteúdo.

## 3. Máquina de estados

### Missão

```text
PLANNED
→ EXECUTING
→ WAITING_EXTERNAL
→ EXECUTING
→ COMPLETED
```

Recuperação:

```text
EXECUTING ou WAITING_EXTERNAL
→ RECOVERING
→ nova fase ou dependência externa
```

Estados excepcionais:

```text
BLOCKED_RISK
CANCELLED
```

### Fase

```text
PLANNED
→ EXECUTING
→ WAITING_EVIDENCE
→ COMPLETED
```

Falha:

```text
EXECUTING ou WAITING_EVIDENCE
→ RECOVERING
→ COMPLETED ou FAILED
```

## 4. Event ledger

Eventos principais:

- `MISSION_CREATED`;
- `PHASE_STARTED`;
- `SKILL_SELECTED`;
- `PERMISSION_GRANTED`;
- `TOOL_REQUESTED`;
- `TOOL_RECEIPT_RECORDED`;
- `EVIDENCE_VALIDATED`;
- `EVIDENCE_REJECTED`;
- `HANDOFF_CREATED`;
- `RECOVERY_STARTED`;
- `PHASE_COMPLETED`;
- `MISSION_COMPLETED`;
- `CI_CALLBACK_RECEIVED`.

Cada evento possui `idempotency_key` única.

## 5. Recibo confiável

```typescript
type ToolReceipt = {
  receiptId: string;
  provider: string;
  operation: string;
  resource: string;
  externalId: string | null;
  commitSha: string | null;
  status: 'SUCCEEDED' | 'FAILED' | 'PARTIAL';
  observedAt: string;
  payloadDigest: string;
  signature: string;
  metadata: Record<string, unknown>;
};
```

A assinatura não substitui a validação específica do provedor. O validator também compara operação, recurso, digest, tempo e identificadores obrigatórios.

## 6. Concorrência e idempotência

- toda execução recebe `expectedMissionVersion`;
- update divergente resulta em `MCF_VERSION_CONFLICT`;
- callbacks usam chave `ci:<workflowRunId>:<conclusion>`;
- o mesmo callback não gera recibo ou handoff duplicado;
- o workflow usa grupo de concorrência por missão e fase.

## 7. CAF executável

Quando a evidência não é válida:

1. o recibo é preservado com status `INVALID`;
2. a fase entra em `RECOVERING`;
3. a missão entra em `RECOVERING`;
4. `EVIDENCE_REJECTED` é registrado;
5. `RECOVERY_STARTED` recebe o fallback da skill;
6. nenhum handoff de sucesso é criado.

## 8. Segurança operacional

Variáveis obrigatórias em produção:

```text
DATABASE_URL
RATE_LIMIT_KEY_SECRET
MCF_RECEIPT_SECRET
MCF_RUNTIME_TOKEN
ALLOWED_ORIGINS
```

Os defaults de desenvolvimento são rejeitados em produção.

## 9. Critério de expansão

Uma nova skill só entra no conjunto executável quando possuir:

- adapter;
- entradas validadas;
- política de ferramenta;
- perfil de permissão;
- recibo verificável;
- fallback;
- testes unitários;
- teste de integração;
- documentação de API e ameaça.
