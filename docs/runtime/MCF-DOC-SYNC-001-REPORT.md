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
4. os sete contratos legados usavam, em alguns casos, papéis anteriores ou mais estreitos que a matriz vigente;
5. `MCF-RUNTIME-006-PLAN.md` ainda estava marcado como planejado apesar de A1, A2 e C1 já terem avançado;
6. o checkpoint C1 ainda indicava gate de merge pendente apesar do PR #76 já estar mesclado;
7. a primeira tentativa de sincronização de estado resumiu detalhes probatórios do plano/checkpoint, detectados e restaurados antes do merge;
8. a primeira versão da validação contava 29 contratos, mas não comparava semanticamente o campo `Papel` com a matriz;
9. o filtro `pull_request.paths` não incluía o `README.md` raiz, embora sua declaração de 29 agentes fosse tratada como invariante.

## Correção

- adicionados os 22 contratos individuais faltantes sem ampliar competências;
- alinhados os sete contratos legados às funções oficiais da matriz, preservando responsabilidades históricas compatíveis;
- `docs/agentes/README.md` transformado em índice dos 29 agentes;
- validação documental reforçada para exigir exatamente 29 contratos individuais;
- CI passou a comparar automaticamente o `Papel` de cada contrato com a matriz canônica;
- `README.md` raiz adicionado ao filtro de caminhos da validação documental;
- estado do RUNTIME-006 reconciliado com os commits integrados;
- checkpoint C1 reconciliado com o merge observado sem inventar autorização ausente no checkpoint anterior;
- detalhes históricos de entrada, receipt, critérios, runs, artefatos e digests foram preservados.

## Revisão Codex e remediação

A revisão automatizada independente do Codex sobre o primeiro HEAD do PR #78 identificou:

```yaml
P1:
  finding: contratos_legados_divergiam_da_matriz_e_validacao_apenas_contava_arquivos
  state: REMEDIATED
  remediation:
    - sete_contratos_legados_alinhados
    - validacao_semantica_de_papel_contra_matriz
P2:
  finding: README_raiz_fora_do_pull_request_paths
  state: REMEDIATED
  remediation:
    - README.md_adicionado_ao_filtro_do_workflow
```

Como o HEAD mudou após essas correções, uma nova revisão Codex deve ser executada sobre o HEAD final antes do gate de integração.

## Invariantes preservados

```yaml
leandro:
  role: HUMAN_FINAL_AUTHORITY
  counted_as_agent: false
official_agents: 29
competence_source: MCF_29_AGENT_MATRIX
contracts_individual: 29
contract_role_matrix_validation: REQUIRED
root_readme_triggers_documentation_validation: true
production: BLOCKED
c1_real_provider_write: NOT_AUTHORIZED
new_agent_authority_created: false
```

## Resultado esperado

Um chat novo que use a documentação do repositório deve encontrar a mesma composição e funções oficiais em:

1. `README.md`;
2. matriz consolidada;
3. `docs/agentes/README.md`;
4. conjunto dos 29 contratos individuais;
5. CI de documentação.

## Limitação de auditoria desta execução

A revisão executada durante esta correção no mesmo ambiente cognitivo que produziu as alterações não será rotulada como auditoria independente quando o gate exigir independência real. A independência é fornecida pelo revisor externo configurado no GitHub e deve apontar explicitamente para o HEAD final revisado.

## Próximo passo

Após CI verde e nova revisão independente do HEAD final, integrar este pacote e retomar o RUNTIME-006 a partir do estado real pós-C1.
