# MCF-STAB-001 — Próxima passagem

## Estado

```yaml
missao: MCF-STAB-001
estado: GATES_TECNICOS_APROVADOS
tracking_issue: 68
pull_request: 69
branch: chore/mcf-stab-001-runtime-006
production: BLOQUEADA
cost: NAO_AUTORIZADO
merge: SUJEITO_A_GATE
```

## Entregas concluídas

- backlog legado classificado;
- issues #13 e #14 encerradas com histórico;
- documentos do PR #22 portados;
- lacuna do PR #29 implementada com enforcement transacional;
- MCF-DEC-059 e RC registradas;
- README sincronizado;
- plano do MCF-RUNTIME-006 versionado;
- format, lint, typecheck, migração repetida, testes, build, documentação e smoke aprovados no head técnico.

## Próxima missão técnica

```yaml
mission_id: MCF-RUNTIME-006-A1
objetivo: implementar_o_contrato_comum_de_adapters_externos
primeiro_adapter: CODE_REVIEW_READ_ONLY
risco: BAIXO
efeito_externo: LEITURA
```

## Sequência

1. fechar o gate de integração do PR #69;
2. preservar PRs #22 e #29 como incorporado e substituído;
3. abrir branch específica para `MCF-RUNTIME-006-A1`;
4. definir `ExternalAdapter`, `ExternalActionRequest` e `ExternalActionReceipt`;
5. implementar o adapter de revisão de código somente leitura;
6. validar SHA, diff, arquivos e recibo;
7. executar testes, auditoria e staging sem produção.

## Critério de abertura do adapter

O primeiro adapter só será integrado após a estabilização estar presente na `main`. A preparação e o desenho podem ocorrer antes, mas o merge seguirá o gate de governança aplicável.
