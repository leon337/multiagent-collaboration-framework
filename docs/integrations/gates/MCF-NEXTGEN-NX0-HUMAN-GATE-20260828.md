# Gate humano proposto — MCF NextGen NX-0

**Status:** `PROPOSED_NOT_AUTHORIZED`  
**Boundary:** `NX-0_CONTRACTS_AND_CONFORMANCE`  
**Baseline MCF:** `main@0b900ee03a05153e2e4a795fce7b457f5b4bb812`

Documentos candidatos congelados nesse baseline:

| Documento               | SHA-256                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| disposition Q1–Q16      | `914afe6770c55b318b571f16adfb9bce8b79df5b8f4aed56cdd865ca0c882f8f` |
| arquitetura formal F1.4 | `597f45ecc3d4e21e96476ef7786a62ce1cde2d541a5f3c2986fc23db6ea9775e` |
| plano reconciliado      | `a38aab77f1102c31b3307b90a67433f99d458808d71946fe391a6fbfc3ef69af` |

## Objetivo

Transformar a arquitetura F1.4 em contratos públicos aditivos, schemas, fixtures e conformance sem
conectar o NextGen ao runtime. É como desenhar e testar os encaixes de uma tomada sem energizar a
rede elétrica.

## Pré-condições de decisão

LEANDRO revisa e aprova explicitamente, no SHA/digest exatos:

- disposition Q1–Q16;
- arquitetura formal F1.4;
- plano de implementação reconciliado;
- catálogo candidato de 17 famílias / 22 contratos públicos;
- este boundary e seus paths permitidos;
- política `ZERO_PAID_AI_API`.

O merge da documentação, a Issue #165 ou uma aprovação histórica não substituem essa decisão.

## Escopo autorizável

```yaml
gate_id: MCF-NEXTGEN-NX0-CONTRACTS-001
allowed:
  - public_typescript_contracts
  - json_schemas
  - valid_and_invalid_fixtures
  - schema_contract_parity_tests
  - compatibility_characterization_tests
  - generated_contract_documentation
  - zero_cost_repository_security_gate_if_missing
forbidden:
  - runtime_wiring
  - database_migration
  - registry_or_router_activation
  - provider_call
  - model_or_ai_api_invocation
  - external_mutation
  - vps_or_ssh
  - release_or_production
```

## Compatibility surfaces obrigatórias

- contratos v1/v1.1;
- MissionRuntime, estado e transition ledger;
- HDF, PermissionEngine, HUMAN_GATE e ExternalActionDispatcher;
- Human Control v1.2 e checkpoint interno;
- conta humana reservada/`HumanAuthorityProof` e provenance server-side do PR #181;
- gate autenticado de chat pré-bootstrap do PR #184;
- protocolo/schema/fixtures GUI/window dos PRs #179/#180;
- Context Fabric, Registry, Capsule v1 e Truth Contracts;
- Ledger e Cloud adapters disabled-by-default;
- 29 agentes e 16 skills;
- zero custo pago, secrets, privacidade e produção.

## Checklist de entrada

- [ ] autorização de LEANDRO cita gate, SHA, digest e paths;
- [ ] `origin/main` contemporâneo relido;
- [ ] Issues #141/#147/#164/#165 e PRs concorrentes relidos;
- [ ] quatro repositórios e Capsules recuperados read-only no snapshot contemporâneo;
- [ ] branch/worktree isolada e limpa;
- [ ] characterization baseline verde;
- [ ] catálogo/equivalência reavaliados se surgiu contrato concorrente;
- [ ] nenhuma capability live inferida;
- [ ] dependency e secret audit zero-cost passam;
- [ ] qualquer premissa divergente retorna o gate para revisão.

## Checklist de saída

- [ ] todo tipo público tem schema 1:1;
- [ ] toda entrada tem fixture positiva e negativa;
- [ ] unknown/stale/paid/unauthorized falham fechado;
- [ ] `AGENT`, `MODEL_BACKEND`, `COGNITIVE_EXECUTOR`, `WORKER`, `TOOL`, `EXTENSION` e `PROJECT`
      permanecem identidades distintas;
- [ ] `max_paid_ai_cost=0` é hard requirement sem fallback;
- [ ] v1/v1.1 continuam compilando e passando;
- [ ] PRs #175/#179/#180/#181/#184 não regressam;
- [ ] nenhum arquivo de runtime wiring ou migration foi alterado;
- [ ] format, lint, typecheck, tests, build e secret scan passam no SHA exato;
- [ ] rollback é remover apenas exports/schemas/fixtures novos;
- [ ] NX-1 permanece não autorizado.

## Stop conditions

Parar se houver contrato equivalente concorrente, segundo writer/runtime, alteração de semântica v1,
necessidade de migration, provider/model call, custo pago/trial/unknown, authority baseada em nome ou
payload, ou qualquer path fora do boundary aprovado.

## Texto mínimo de autorização futura

> Autorizo somente `MCF-NEXTGEN-NX0-CONTRACTS-001` no baseline, digest e paths enumerados no
> checkpoint contemporâneo, limitado a contratos, schemas, fixtures, conformance, documentação e
> gate de segurança zero-cost. Não autorizo runtime wiring, migration, provider/model/API, VPS,
> mutação externa, release, produção ou NX-1+.

Até essa decisão existir, o plano permanece executável apenas como documentação.
