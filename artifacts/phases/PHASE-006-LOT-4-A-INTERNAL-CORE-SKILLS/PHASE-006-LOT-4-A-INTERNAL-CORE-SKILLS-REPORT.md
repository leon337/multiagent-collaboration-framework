# PHASE-006-LOT-4-A-INTERNAL-CORE-SKILLS — Relatório

## Estado
`CANDIDATE_READY_FOR_EXACT_HEAD_VALIDATION`

Este relatório descreve o candidato pré-gate. Não representa aprovação, merge ou conclusão da fase.

## Rastreamento
- Issue: `#94`
- PR draft: `#95`
- Branch: `feat/mcf-runtime-006-lot4-a-internal-core-skills`
- Base inicial: `8a6d0673afdb4892983cb03d52d3d176b23252f9`
- HEAD de implementação imediatamente anterior a esta sincronização PRF: `404f0bc294f5a0f92c5847e443d58491fb4b1af5`

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
- possui teste integrado de persistência/versionamento pelo `MissionRuntime`;
- resolve o registry canônico a partir do CWD real do pacote server.

## Findings encontrados durante a própria fase
1. O novo teste de persistência inicialmente falhou no `prettier --check`. A correção foi feita usando a saída do próprio Prettier 3.9.6 configurado pelo workspace.
2. A revisão detectou divergência entre provider canonizado pelo `PermissionEngine` e comparação literal no `SkillExecutor`. O caminho foi unificado com `canonicalizeProvider`.
3. A revisão detectou que arrays não vazios ainda poderiam conter placeholders sem conteúdo. O validador foi endurecido e recebeu regressão dedicada.
4. Foundation `31460923993` no HEAD `47a627011e85c0933104a932930dc7e3fe4fd841` expôs que o `SkillRegistryLoader` não alcançava `skills/registry.yaml` a partir do CWD do pacote server. O loader foi corrigido em `404f0bc294f5a0f92c5847e443d58491fb4b1af5`.

Os SHAs anteriores são evidência histórica de descoberta/correção e não contam como gate do candidato final.

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
Executar Foundation e Container Smoke no SHA exato do commit que contém esta sincronização PRF. Somente após PASS no mesmo HEAD o candidato pode avançar para revisão técnica, auditoria independente e gate de Léo.
