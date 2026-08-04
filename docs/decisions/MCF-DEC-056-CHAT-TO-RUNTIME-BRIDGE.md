# MCF-DEC-056 — Chat-to-Runtime Bridge

## Estado

```yaml
status: CANDIDATA_PARA_GATE_FINAL
decision_owner: Leo
human_final_authority: Leandro
mission: MCF-RUNTIME-003
pull_request: 55
```

## Contexto

O MissionRuntime já persistia missões, fases, eventos, handoffs e evidências, mas o objetivo recebido em uma conversa ainda precisava ser convertido manualmente em um contrato técnico. Essa lacuna mantinha o chat e o runtime como camadas separadas.

O Human Delegation Firewall também exige que a equipe seja acionada antes de Leandro e que qualquer intervenção humana seja exceção formal, não operação técnica padrão.

## Decisão

Criar um bridge autenticado:

```text
objetivo conversacional
→ contrato determinístico
→ missão persistida
→ MCF-START-MISSION executada internamente
→ handoff para Miriam
→ próximas fases expostas como READY_EXTERNAL
→ recibos reais obrigatórios para GitHub, CI ou outro provedor
```

Endpoint:

```http
POST /v1/mcf/chat/dispatch
```

## Invariantes

1. `Leandro` não pode entrar em `selectedAgents`.
2. O bridge executa automaticamente somente `MCF-START-MISSION` com provedor `internal`.
3. Fases externas nunca são marcadas como executadas sem recibo verificável.
4. O risco solicitado pode elevar, mas nunca reduzir, o risco inferido.
5. Objetivos Classe C são encaminhados ao gate interno de Léo antes de qualquer fase externa.
6. A resposta do bridge declara `humanActionRequired: false`.
7. O endpoint exige sessão humana válida.
8. O plano é limitado às skills que o runtime realmente executa.

## Skills do recorte

```yaml
MCF-START-MISSION:
  executor: Mestre
  handoff: Miriam
  execution: internal
MCF-IMPLEMENT-CHANGE:
  executor: Rafael
  handoff: Vinicius
  execution: external_receipt_required
MCF-RUN-TESTS:
  executor: Renato
  handoff: Emily
  execution: external_receipt_required
```

## Segurança

- payload validado com Zod;
- repositório validado no formato `owner/name`;
- HDF permanece aplicado pelo `PermissionEngine`;
- nenhuma chave ou token é recebido no payload;
- nenhuma ação pública, financeira ou destrutiva é autorizada pelo bridge;
- evidência externa inventada permanece proibida;
- rebaixamento de risco é bloqueado por regra e teste.

## Limites declarados

O bridge não transforma o ChatGPT em um processo autônomo em segundo plano. Ele cria uma entrada persistente e verificável para a missão e devolve o próximo plano executável. A execução de ferramentas continua dependendo dos conectores disponíveis e de recibos reais.

O MVP ainda não possui idempotência própria por `dispatchId`. Repetições do mesmo POST podem criar missões distintas. Essa melhoria deve ser tratada antes de uso com retries automáticos não controlados.

## Critérios de aceite

```yaml
endpoint_autenticado: required
mission_persisted: required
internal_bootstrap_valid: required
external_execution_fabricated: prohibited
leandro_as_executor: prohibited
risk_downgrade: prohibited
format_lint_typecheck: pass
migrations_twice: pass
tests_build: pass
container_smoke: pass
staging_e2e: required_before_final_closure
```

## Rollback

Remover o controller, o serviço, o planejador e os contratos do bridge. Os endpoints existentes de missão e callback permanecem independentes e não são alterados pelo rollback.
