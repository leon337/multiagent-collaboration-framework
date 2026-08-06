# MCF-DEC-060 — External Action Dispatcher e adapter GitHub de code review

**Estado:** IMPLEMENTADA; AGUARDANDO CI E RC  
**Missão:** MCF-RUNTIME-006-A1  
**Tracking:** issue #70

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
response:
  signed_receipt:
  metadata:
    adapterId:
    repository:
    targetType:
    reviewedFiles:
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
- arquivos alterados no pull request;
- metadados e arquivos de commit.

Não existem métodos de comentário, review submission, merge, atualização de branch ou alteração de arquivo.

## 5. Revisão produzida

A primeira versão é determinística e procura evidências verificáveis, incluindo:

- possível credencial literal;
- execução dinâmica de código;
- sinks de HTML sem proteção;
- marcadores `TODO`/`FIXME` em linhas adicionadas;
- arquivo com superfície de mudança muito grande;
- código-fonte alterado sem arquivo de teste correspondente.

Vereditos:

```yaml
PASS: nenhum_achado
PASS_WITH_FINDINGS: somente_achados_medium_ou_low
BLOCK: pelo_menos_um_achado_high
```

## 6. Evidência

O adapter cria recibo com `EvidenceValidator.createTrustedReceipt`. A validação específica de `MCF-REVIEW-CODE` continua exigindo:

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

## 9. Ledger

A migração `0017_mcf_external_action_ledger.sql` espelha o fluxo existente nos eventos:

```text
EXTERNAL_ACTION_REQUESTED
EXTERNAL_ACTION_ALLOWED
EXTERNAL_ACTION_EXECUTED | EXTERNAL_ACTION_FAILED
EXTERNAL_ACTION_EVIDENCE_VALIDATED
```

O trigger ignora provider `internal` e usa chaves idempotentes derivadas do evento original.

## 10. Restrições

```yaml
production: BLOQUEADA
cost: NAO_AUTORIZADO
external_write: false
merge_automatico: false
publication: false
```
