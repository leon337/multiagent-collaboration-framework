# MCF-ORG-049 — Runtime Gap das Novas Skills

**Status:** DOCUMENTADO / NÃO IMPLEMENTADO  
**Data:** 2026-08-23

MCF-DEC-053 adiciona seis skills especializadas ao registry com `runtime_status: DOCUMENTAL_ONLY`:

- `MCF-DESIGN-SPECIALIST`
- `MCF-DESIGN-SYSTEM`
- `MCF-RADAR-MODELS`
- `MCF-DISCOVER-FREE-API`
- `MCF-ROUTE-MODELS`
- `MCF-EVALUATE-MODEL`

O runtime atual mantém uma allowlist explícita de 16 IDs em `skill-executor.ts`. Portanto, carregar o YAML com essas seis entradas **não** as torna executáveis.

## Para promover cada skill a executável

A fase futura deve, conforme o boundary da skill:

1. adicionar o ID ao executor somente após desenho do evidence contract;
2. definir provider/boundary permitido;
3. implementar ou reutilizar evidence collector/validator compatível;
4. atualizar permission tests;
5. adicionar planner/routing quando necessário;
6. executar testes positivos, negativos e de recuperação;
7. atualizar `registered/executable/documental_only` somente após evidência verde.

## Invariante

`REGISTRY_ENTRY != EXECUTABLE_RUNTIME_CAPABILITY`

Nenhum documento do MCF deve declarar as seis skills como executáveis antes desse trabalho.