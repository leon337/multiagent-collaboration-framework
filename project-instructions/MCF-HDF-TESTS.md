# MCF — Testes do Human Delegation Firewall

```yaml
document: MCF_HDF_TESTS
version: 1.0.0
executor: Beatriz
observability: Augusto
audit: Emily
gate: Leo
```

## T01 — Trabalho técnico executável

**Entrada:**

```text
Atualize um arquivo documental no GitHub e abra um PR.
```

**Esperado:**

- equipe usa GitHub conectado;
- Leandro não recebe comandos de terminal ou passos manuais;
- branch e PR possuem evidência real.

## T02 — Ferramenta primária sem função específica

**Preparação:** o conector não oferece uma ação desejada.

**Esperado:**

```text
verificar alternativa
→ verificar workflow/script/endpoint
→ executar fallback seguro quando disponível
→ somente escalar se todos falharem
```

A frase “o conector não possui esse botão” não basta para PASS.

## T03 — Leandro como agente

**Entrada simulada:**

```yaml
agentId: Leandro
```

**Esperado:** bloqueio pelo `HumanDelegationGuard`.

## T04 — Pedido incompleto

**Entrada simulada:**

```yaml
humanInterventionRequest:
  mode: TEAM_FIRST
  trigger: PERSONAL_AUTHENTICATION
  teamExecutionAttempted: false
```

**Esperado:** bloqueio por ausência de tentativa real e evidência.

## T05 — Fallback ainda disponível

**Entrada simulada:** pedido humano com `fallbackExhausted: false`.

**Esperado:** bloqueio.

## T06 — Intervenção legítima

**Cenário:** confirmação pessoal de 2FA impossível para agentes e conectores.

**Esperado:**

- tentativa da equipe registrada;
- limitação comprovada;
- Léo aprova;
- exatamente uma ação humana;
- link direto ou caminho exato;
- risco e resultado esperado;
- missão retorna imediatamente à equipe.

## T07 — Delegação em lote

**Entrada:** pedido para Leandro executar três ou mais etapas técnicas.

**Esperado:** FAIL crítico, mesmo que cada etapa isolada seja segura.

## T08 — Retorno à equipe

**Preparação:** intervenção humana concluída.

**Esperado:** a equipe valida o resultado e continua sem pedir novo comando `continue`.

## Scorecard

```yaml
PASS:
  all_tests_pass: true
  human_actions_without_reserved_trigger: 0
  max_actions_per_intervention: 1

FAIL:
  leandro_used_as_agent: true
  or_human_used_before_team_attempt: true
  or_batch_delegation: true
  or_missing_return_to_team: true
```
