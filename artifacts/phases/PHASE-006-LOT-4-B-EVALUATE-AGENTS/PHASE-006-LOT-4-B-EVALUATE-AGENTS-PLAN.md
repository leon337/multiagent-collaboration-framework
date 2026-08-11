# PHASE-006-LOT-4-B-EVALUATE-AGENTS — Plano

## Identidade
- Missão: `MCF-RUNTIME-006-LOT-4-SKILLS`
- Fase: `PHASE-006-LOT-4-B-EVALUATE-AGENTS`
- Issue: `#97`
- PR técnico: `#98`
- Classe: `C`
- Base técnica: `5a03c443ff3e4d80755b8bd0b8c6bd3cf350f6a3`
- Candidato validado: `279a4b1e3b8e8b5b948d95481ec85e5223322278`
- Merge técnico: `741abdad70432b9232256b7204156d96770c9b4d`

## Objetivo
Converter `MCF-EVALUATE-AGENTS` em capacidade executável governada preservando `READ_ONLY`, owners Beatriz/Tiago, handoff Emily e evidência reproduzível.

## Critérios finais
1. `READY_AGENT`, sem autoexecução pelo bridge.
2. `test_cases` e `scores` não vazios e significativos.
3. `regressions` obrigatório e permitido vazio.
4. Evidência inválida → `RECOVERING`, sem handoff.
5. Beatriz/Tiago owners; Emily handoff.
6. `READ_ONLY`, PermissionEngine e HDF preservados.
7. Persistência/versionamento pelo MissionRuntime.
8. Foundation/Smoke PASS no HEAD exato.
9. Revisões, auditoria independente e Léo PASS antes do merge.
10. Produção e live staging adapter bloqueados.

## Resultado
Todos os critérios técnicos foram atendidos. Candidato e squash merge compartilham a tree `a0e676152c7070381480b9c5422f103887987eab`. Próximo boundary: `MCF-RUNTIME-006-LOT-4-C-SECURITY-REVIEW`.
