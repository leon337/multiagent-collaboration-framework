# MCF Runtime — Recuperação Executável pelo Protocolo CAF

**Versão:** 1.0.0  
**Fonte normativa:** MCF-DEC-016  
**Implementação:** MCF-DEC-054

## 1. Finalidade

Definir como falhas instrumentais, evidências inválidas, concorrência e callbacks duplicados são tratados pelo runtime sem reiniciar a missão nem alegar sucesso inexistente.

## 2. Ciclo implementado

```text
CAPTURAR
→ CLASSIFICAR
→ VERIFICAR EFEITO
→ ESCOLHER RECUPERAÇÃO
→ EXECUTAR
→ VALIDAR
→ RETORNAR AO FLUXO
```

## 3. Falhas cobertas

### Evidência ausente

Uma skill externa sem recibo retorna:

```yaml
phase_state: WAITING_EVIDENCE
mission_state: WAITING_EXTERNAL
evidence_status: PENDING
success_claimed: false
```

### Evidência inválida

Assinatura, digest, operação, recurso, janela temporal ou identificador incompatível produz:

```yaml
phase_state: RECOVERING
mission_state: RECOVERING
evidence_status: INVALID
ledger_events:
  - EVIDENCE_REJECTED
  - RECOVERY_STARTED
handoff_success: false
```

### Ferramenta externa falhou

Recibo assinado com `FAILED` ou `PARTIAL` é preservado, mas não satisfaz o critério de sucesso. A skill fornece o fallback registrado.

### Concorrência

Toda execução recebe `expectedMissionVersion`. Quando a versão materializada mudou, o repositório rejeita a gravação com `MCF_VERSION_CONFLICT`.

A recuperação deve:

1. reler a missão;
2. comparar eventos posteriores;
3. recompor a intenção;
4. executar somente se a ação ainda for necessária;
5. usar nova chave de idempotência.

### Callback duplicado

O callback do GitHub Actions usa:

```text
ci:<workflowRunId>:<conclusion>
```

A repetição retorna `duplicate: true` sem criar novo recibo, handoff ou evento.

## 4. Limites de repetição

```yaml
same_parameters: zero_retries
corrected_parameters: one_retry
safe_alternative_route: one_attempt
external_dependency_after_budget: WAITING_EXTERNAL
risk_after_budget: BLOCKED_RISK
```

## 5. Evidência de recuperação

Uma recuperação é válida somente quando o ledger contém:

- evento da falha;
- efeito confirmado;
- fallback selecionado;
- nova ação;
- novo recibo ou dependência externa declarada;
- estado posterior;
- handoff somente após validação.

## 6. Não reinicialização

É proibido criar nova missão apenas porque uma fase falhou. A missão preserva:

- ID;
- contrato;
- versão;
- eventos anteriores;
- recibos;
- fases;
- handoffs;
- achados abertos.

## 7. Gate humano

O runtime não executa fallback destrutivo, público, financeiro ou de alto impacto. Esses casos exigem `HUMAN_GATE` e permanecem em `BLOCKED_RISK` ou `WAITING_EXTERNAL` até decisão válida.

## 8. Critérios de aceite

```yaml
failure_is_visible: true
partial_effect_checked: true
receipt_preserved: true
success_without_valid_evidence: false
mission_restarted_by_default: false
callback_idempotent: true
handoff_only_after_validation: true
```
