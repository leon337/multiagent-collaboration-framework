# MCF-DOC-SYNC-001 — Relatório de sincronização documental

**Data:** 8 de agosto de 2026  
**Issue:** #77  
**Base:** `ed67f0459c956146bdb9020a7ef37dfb59137512`  
**Classificação:** correção documental de consistência

## Origem

Um teste de retomada em chat novo consultou `docs/agentes/README.md` e os contratos individuais e inferiu incorretamente que o MCF possuía sete agentes. A verificação posterior da fonte canônica mostrou 29 agentes oficiais.

## Achados

1. a matriz consolidada e o README raiz registravam 29 agentes;
2. `docs/agentes/` possuía somente sete contratos individuais;
3. o workflow de documentação exigia somente esses sete contratos;
4. `MCF-RUNTIME-006-PLAN.md` ainda estava marcado como planejado apesar de A1, A2 e C1 já terem avançado;
5. o checkpoint C1 ainda indicava gate de merge pendente apesar do PR #76 já estar mesclado.

## Correção

- adicionados os 22 contratos individuais faltantes sem ampliar competências;
- `docs/agentes/README.md` transformado em índice dos 29 agentes;
- validação documental reforçada para exigir exatamente 29 contratos individuais;
- estado do RUNTIME-006 reconciliado com os commits integrados;
- checkpoint C1 reconciliado com o merge observado.

## Invariantes preservados

```yaml
leandro:
  role: HUMAN_FINAL_AUTHORITY
  counted_as_agent: false
official_agents: 29
competence_source: MCF_29_AGENT_MATRIX
production: BLOCKED
c1_real_provider_write: NOT_AUTHORIZED
new_agent_authority_created: false
```

## Resultado esperado

Um chat novo que use a documentação do repositório deve encontrar a mesma composição oficial em:

1. `README.md`;
2. matriz consolidada;
3. `docs/agentes/README.md`;
4. conjunto de contratos individuais;
5. CI de documentação.

## Próximo passo

Após CI e revisão independente deste pacote, retomar o RUNTIME-006 a partir do estado real pós-C1.
