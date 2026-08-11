# PHASE-006-LOT-4-A-INTERNAL-CORE-SKILLS — Relatório

## Estado
`CANDIDATE_READY_FOR_EXACT_HEAD_VALIDATION`

Este relatório descreve o candidato pré-gate. Não representa aprovação, merge ou conclusão da fase.

## Rastreamento
- Issue: `#94`
- PR draft: `#95`
- Branch: `feat/mcf-runtime-006-lot4-a-internal-core-skills`
- Base inicial: `8a6d0673afdb4892983cb03d52d3d176b23252f9`
- HEAD de implementação imediatamente anterior ao PRF: `5e4cfb4af121f0f05dd531317f152c6269cdc4d4`

## Implementação
Foram incorporadas ao candidato:
- `MCF-RECOVER-CONTEXT`;
- `MCF-DEFINE-PRODUCT`;
- `MCF-DESIGN-EXPERIENCE`;
- `MCF-DESIGN-ARCHITECTURE`.

O runtime agora:
- reconhece as quatro skills no contrato tipado e no executor;
- agenda trabalho de domínio como `READY_AGENT`;
- exige `execution_evidence` por skill;
- valida evidência antes e depois da criação do recibo;
- entra em `RECOVERING` quando a prova é ausente ou inválida;
- preserva owner, permissão e HDF;
- não permite que o chat bridge fabrique saída de domínio;
- possui teste integrado de persistência/versionamento pelo `MissionRuntime`.

## Findings encontrados durante a própria fase
1. O novo teste de persistência inicialmente falhou no `prettier --check`. A correção foi feita usando a saída do próprio Prettier 3.9.6 configurado pelo workspace.
2. A revisão detectou divergência entre provider canonizado pelo `PermissionEngine` e comparação literal no `SkillExecutor`. O caminho foi unificado com `canonicalizeProvider`.
3. A revisão detectou que arrays não vazios ainda poderiam conter placeholders sem conteúdo. O validador foi endurecido e recebeu regressão dedicada.

Esses findings foram corrigidos antes do candidato PRF e os SHAs anteriores não contam como gate do candidato final.

## Governança
- revisão técnica final: `PENDING`;
- auditoria independente: `PENDING`;
- gate técnico de Léo: `PENDING`;
- merge autorizado: `false`;
- HUMAN_GATE de Leandro: `NOT_REQUIRED`;
- ações manuais de Leandro: `0`.

## Segurança operacional
- produção: `BLOCKED`;
- live staging adapter: `DISABLED`;
- ação destrutiva: `false`;
- nova credencial: `false`;
- bypass de PermissionEngine/HDF: `false`.

## Próxima ação
Executar Foundation e Container Smoke no SHA exato do commit que contém este PRF. Somente após PASS no mesmo HEAD o candidato pode avançar para revisão técnica, auditoria independente e gate de Léo.
