# PHASE-006-LOT-4-A-INTERNAL-CORE-SKILLS — Plano

## Identidade
- Missão: `MCF-RUNTIME-006-LOT-4-SKILLS`
- Fase: `MCF-RUNTIME-006-LOT-4-A-INTERNAL-CORE-SKILLS`
- Issue: `#94`
- Pull Request: `#95`
- Classe de risco: `C`
- Orquestrador: `Mestre`
- Autoridade técnica de decisão: `Léo`
- Base verificada: `main@8a6d0673afdb4892983cb03d52d3d176b23252f9`

## Objetivo
Converter `MCF-RECOVER-CONTEXT`, `MCF-DEFINE-PRODUCT`, `MCF-DESIGN-EXPERIENCE` e `MCF-DESIGN-ARCHITECTURE` de contratos documentais em capacidades executáveis e governadas pelo runtime, com evidência semântica verificável e persistência pelo `MissionRuntime`.

## Escopo
- expandir o contrato tipado `McfExecutableSkillId`;
- expandir `SkillExecutor`;
- introduzir validação semântica específica por skill;
- distinguir trabalho `READY_AGENT` de bootstrap `PLANNED_INTERNAL`;
- integrar planner e chat bridge sem fabricação de conteúdo;
- preservar `PermissionEngine` e Human Delegation Firewall;
- provar persistência/versionamento através do `MissionRuntime`;
- atualizar documentação de executabilidade;
- validar o SHA exato do candidato antes de qualquer gate.

## Fora do escopo
- `MCF-EVALUATE-AGENTS`;
- `MCF-SECURITY-REVIEW`;
- `MCF-DEBUG-INCIDENT`;
- `MCF-CLOSE-PHASE`;
- produção;
- escrita externa C1/C2;
- alteração do live staging adapter;
- resolução antecipada do conflito `MCF-CLOSE-PHASE -> handoff_to: Leandro`.

## Critérios de aceite
1. O candidato passa a reconhecer 12 IDs executáveis, sendo quatro novos nesta fase.
2. As quatro novas skills exigem `execution_evidence` semanticamente válida.
3. Evidência ausente, incompleta ou vazia resulta em `RECOVERING`, sem handoff de sucesso.
4. O provider interno é tratado de forma canonizada e consistente.
5. `PermissionEngine` e HDF permanecem obrigatórios.
6. `MissionRuntime` persiste recibo, validação, handoff, eventos e incremento de versão.
7. O chat bridge não fabrica contexto, produto, UX ou arquitetura.
8. Foundation e Container Smoke passam no SHA exato do commit PRF candidato.
9. Revisão técnica, auditoria independente e gate de Léo ocorrem antes de qualquer merge.
10. Produção permanece bloqueada.

## Ordem de execução
`IMPLEMENTAR → VALIDAR → REVISAR → AUDITAR → LÉO DECIDE → FECHAR FASE → TRANSFERIR CHECKPOINT`
