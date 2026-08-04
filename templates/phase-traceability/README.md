# Template — Pacote de Rastreabilidade da Fase

Copie este diretório para:

```text
artifacts/phases/PHASE-XX-SLUG/
```

Substitua `PHASE-XX` e os campos entre colchetes pelos valores reais.

## Ordem de leitura

1. `PHASE-XX-PLAN.md`;
2. `PHASE-XX-DECISIONS.md`;
3. `PHASE-XX-REPORT.md`;
4. `PHASE-XX-VALIDATION.txt`;
5. `PHASE-XX-VALIDATION-FULL.txt`;
6. `PHASE-XX-SMOKE.txt`;
7. `PHASE-XX-CHECKPOINT.yaml`;
8. `PHASE-XX-ARTIFACT-MANIFEST.sha256`.

## Regras

- não inventar arquivos, testes, commits ou resultados;
- registrar `NAO_APLICAVEL` com justificativa quando necessário;
- remover segredos e dados sensíveis;
- preservar referências a branch, commit, PR, workflow e artefatos reais;
- atualizar o checkpoint antes de transferir a fase;
- gerar o manifesto depois que os demais arquivos estiverem finalizados.

## Documentos adicionais

Acrescente conforme o domínio:

- `architecture.md`;
- `threat-model.md`;
- `privacy-model.md`;
- `database.md`;
- `api-contract.md`;
- `accessibility-report.md`;
- `deployment.md`;
- `rollback.md`;
- `incident-report.md`;
- `evaluation-scorecard.md`;
- `mission-trace.md`.
