# PHASE-006-LOT-4-A-INTERNAL-CORE-SKILLS — Plano

## Identidade
- Missão: `MCF-RUNTIME-006-LOT-4-SKILLS`
- Fase: `MCF-RUNTIME-006-LOT-4-A-INTERNAL-CORE-SKILLS`
- Issue: `#94`
- Pull Request técnico: `#95`
- Classe de risco: `C`
- Orquestrador: `Mestre`
- Autoridade técnica de decisão: `Léo`
- Base técnica: `main@8a6d0673afdb4892983cb03d52d3d176b23252f9`
- Candidato validado: `e3e70fbbd2c940ee66a8de9c418e0e8d32a4c668`
- Merge técnico: `67d20e24fd136f6334bfd835cb775426f6514403`

## Objetivo
Converter `MCF-RECOVER-CONTEXT`, `MCF-DEFINE-PRODUCT`, `MCF-DESIGN-EXPERIENCE` e `MCF-DESIGN-ARCHITECTURE` em capacidades executáveis e governadas pelo runtime, com evidência semântica verificável e persistência pelo `MissionRuntime`.

## Critérios de aceite finais
1. 12 skills executáveis e 4 documentais após integração.
2. Quatro novas skills com evidência semântica específica.
3. Evidência ausente/inválida produz `RECOVERING`, sem handoff de sucesso.
4. Provider interno tratado de forma canonizada.
5. `PermissionEngine` e HDF preservados.
6. Persistência/versionamento, recibo, eventos e handoff provados pelo `MissionRuntime`.
7. Foundation e Container Smoke PASS no SHA candidato exato.
8. Revisões especialistas + auditoria independente sem P0/P1/P2.
9. Gate técnico de Léo PASS antes do merge.
10. Produção e live staging adapter continuam bloqueados.

## Resultado
Todos os critérios técnicos foram atendidos. O candidato e o squash merge possuem a mesma tree `def5edf77be8bdc32939d2b4bd5b1fcbcca649ec`, preservando byte-equivalência do conteúdo validado. O boundary seguinte é `MCF-RUNTIME-006-LOT-4-B-EVALUATE-AGENTS`.
