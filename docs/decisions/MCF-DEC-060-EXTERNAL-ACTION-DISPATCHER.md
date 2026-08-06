# MCF-DEC-060 — External Action Dispatcher e adapter GitHub de code review

**Estado:** TECNICAMENTE APROVADA; AGUARDANDO GATE DE INTEGRAÇÃO  
**Missão:** MCF-RUNTIME-006-A1  
**Tracking:** issue #70  
**RC:** `docs/reviews/MCF-DEC-060-RC-001-EXTERNAL-ACTION-DISPATCHER.md`

## 1. Problema

O runtime já validava permissões e recibos externos, mas dependia de um operador ou callback para fornecer `externalReceipt`. O MCF precisava executar sua primeira ação externa real sem perder os controles existentes.

## 2. Decisão

Introduzir uma fundação comum composta por:

```text
SkillExecutor
  → PermissionEngine
  → ExternalActionDispatcher
  → AdapterRegistry
  → GitHubCodeReviewAdapter
  → EvidenceValidator
  → PostgreSQL Event Ledger
```

O dispatcher não substitui o `PermissionEngine`. A permissão é validada antes de qualquer adapter ser consultado.

## 3. Contrato do adapter

```yaml
request:
  skill:
  agentId:
  inputs:
  tool:
  context:
    missionId:
    phaseId:
    expectedMissionVersion:
response:
  signed_receipt:
  metadata:
    adapterId:
    repository:
    targetType:
    reviewedFiles:
    coverage:
    unavailablePatchFiles:
    findings:
    findingsCount:
    verdict:
    readOnly: true
```

## 4. Adapter A1

```yaml
adapter_id: github-code-review-read-only-v1
skill: MCF-REVIEW-CODE
provider: github
operation: inspect-code
supported_targets:
  - pull_request
  - commit_sha
external_write: false
```

O adapter usa somente requisições HTTP `GET` para:

- metadados de pull request;
- páginas de arquivos alterados no pull request;
- metadados e páginas de arquivos de commit.

Não existem métodos de comentário, review submission, merge, atualização de branch ou alteração de arquivo.

## 5. Cobertura e revisão produzida

A revisão determinística procura evidências verificáveis, incluindo:

- possível credencial literal;
- execução dinâmica de código;
- sinks de HTML sem proteção;
- marcadores `TODO`/`FIXME` em linhas adicionadas;
- arquivo com superfície de mudança muito grande;
- código-fonte alterado sem arquivo de teste correspondente.

A cobertura é sempre declarada:

```yaml
COMPLETE: todos_os_arquivos_possuem_patch_textual
PARTIAL: pelo_menos_um_patch_esta_indisponivel
INVALID_RESPONSE: nenhum_patch_textual_foi_fornecido
pagination_limit: 1000_arquivos
```

Vereditos:

```yaml
PASS: nenhum_achado
PASS_WITH_FINDINGS: somente_achados_medium_ou_low
BLOCK: pelo_menos_um_achado_high
```

## 6. Evidência

O adapter cria recibo com `EvidenceValidator.createTrustedReceipt`. A validação específica de `MCF-REVIEW-CODE` exige:

- provider GitHub;
- SHA revisado;
- lista não vazia de arquivos;
- `findingsCount`;
- `verdict`;
- assinatura HMAC e digest válidos.

## 7. Falhas classificadas

```yaml
AUTHENTICATION_REQUIRED:
RATE_LIMITED:
TARGET_NOT_FOUND:
UNSUPPORTED_TARGET:
INVALID_RESPONSE:
NETWORK_FAILURE:
INVALID_CONTEXT:
RESERVATION_CONFLICT:
LEDGER_FAILURE:
ADAPTER_FAILURE:
```

Uma falha não fabrica recibo. A fase entra em `RECOVERING` com código e mensagem registrados.

## 8. Compatibilidade

Quando nenhum adapter suporta a ação, o comportamento anterior permanece:

```yaml
evidenceStatus: PENDING
phaseState: WAITING_EVIDENCE
missionState: WAITING_EXTERNAL
```

Adapters posteriores podem ser registrados sem modificar o `SkillExecutor`.

## 9. Reserva durável e ordem causal

Antes de qualquer chamada ao provider, o ledger valida a versão da missão e persiste, em uma única transação:

```text
PHASE_STARTED
SKILL_SELECTED
PERMISSION_GRANTED
TOOL_REQUESTED
EXTERNAL_ACTION_REQUESTED
EXTERNAL_ACTION_ALLOWED
```

Depois da leitura externa, a tentativa só pode seguir por transições explícitas:

```text
ALLOWED → EXECUTED → EVIDENCE_VALIDATED
ALLOWED → EXECUTED → EVIDENCE_REJECTED
ALLOWED → FAILED
```

Estados terminais não podem ser reescritos. Repetir a mesma transição é idempotente e não cria evento duplicado. A timeline usa a sequência persistida do ledger como ordem canônica.

## 10. Evidência de validação

```yaml
technical_head: 24b45615115b95cd2de75777b5123c23fc3dddb1
documentation_validation:
  run: 31071793017
  conclusion: success
foundation:
  run: 31071793043
  formatting: success
  lint: success
  typecheck: success
  migration_twice: success
  tests: success
  build: success
container_smoke:
  run: 31071793033
  conclusion: success
review: PASS_WITH_MINOR_RESERVATION
```

A reserva baixa restante é o reconciliador posterior de fases quando houver interrupção entre o provider somente leitura e a materialização final da fase.

## 11. Restrições

```yaml
production: BLOQUEADA
cost: NAO_AUTORIZADO
external_write: false
merge_automatico: false
publication: false
```
