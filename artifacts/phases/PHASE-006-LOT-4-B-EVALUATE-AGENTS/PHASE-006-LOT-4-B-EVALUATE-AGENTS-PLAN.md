# PHASE-006-LOT-4-B-EVALUATE-AGENTS — Plano

## Identidade
- Missão: `MCF-RUNTIME-006-LOT-4-SKILLS`
- Fase: `PHASE-006-LOT-4-B-EVALUATE-AGENTS`
- Issue: `#97`
- Pull Request: `#98`
- Classe de risco: `C`
- Orquestrador: `Mestre`
- Owner da skill: `Beatriz` / `Tiago`
- Handoff esperado: `Emily`
- Base verificada: `main@5a03c443ff3e4d80755b8bd0b8c6bd3cf350f6a3`

## Objetivo
Converter `MCF-EVALUATE-AGENTS` de contrato documental em capacidade executável pelo runtime governado, preservando o perfil `READ_ONLY`, critérios reproduzíveis e proibição de autoaprovação sem evidência.

## Escopo
- expandir `McfExecutableSkillId`;
- adicionar planejamento `READY_AGENT` para avaliação explícita/inferida;
- executar via provider `internal` com operação de leitura `inspect-agent-evaluation`;
- validar semanticamente `test_cases`, `scores` e `regressions`;
- permitir `regressions: []` somente quando a coleção estiver explicitamente presente;
- preservar owners Beatriz/Tiago e handoff Emily;
- provar persistência/versionamento pelo `MissionRuntime`;
- atualizar documentação da skill;
- validar o SHA exato após o PRF.

## Fora do escopo
- `MCF-SECURITY-REVIEW`;
- `MCF-DEBUG-INCIDENT`;
- `MCF-CLOSE-PHASE`;
- produção;
- ativação live do staging adapter;
- escrita externa C1/C2.

## Critérios de aceite
1. O candidato passa a 13 skills executáveis e 3 documentais após integração.
2. `MCF-EVALUATE-AGENTS` permanece `READY_AGENT`; o bridge não fabrica avaliação.
3. `test_cases` é coleção não vazia de itens significativos.
4. `scores` é coleção/mapa não vazio com valores significativos.
5. `regressions` é obrigatório e pode ser vazio.
6. Evidência ausente, incompleta ou placeholder resulta em `RECOVERING`, sem handoff.
7. Beatriz e Tiago são owners válidos; não-owner é bloqueado.
8. `READ_ONLY`, `PermissionEngine` e HDF permanecem intactos.
9. `MissionRuntime` persiste recibo, evidência, handoff para Emily, eventos e versão.
10. Foundation e Container Smoke passam no SHA exato do commit PRF.
11. Revisões especialistas, auditoria independente e gate de Léo precedem merge.
12. Produção continua bloqueada.

## Ordem
`IMPLEMENTAR → VALIDAR → REVISAR → AUDITAR → LÉO DECIDE → FECHAR FASE → TRANSFERIR CHECKPOINT`
