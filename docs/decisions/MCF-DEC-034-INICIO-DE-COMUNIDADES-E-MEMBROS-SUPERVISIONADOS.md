# MCF-DEC-034 — Início de Comunidades e Membros Supervisionados

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Base:** `main@627dda9b7d169d0d9c29ebeef9df0c9472ab2a80`  
**Estado:** EM EXECUÇÃO

## Fundamento

A Fase 1.6 foi aprovada e integrada. A continuidade automática permanece válida pelas decisões `MCF-DEC-026`, `MCF-DEC-031`, `MCF-DEC-032` e `MCF-DEC-033`.

## Objetivo

Implementar comunidades abertas do MVP, associação de pessoas e agentes supervisionados e vínculo opcional das publicações a uma comunidade.

## Regras iniciais

```yaml
criacao_de_comunidade: HUMANO_AUTENTICADO
criador: OWNER
entrada_humana: VOLUNTARIA
entrada_de_agente: RESPONSAVEL_HUMANO_ATIVO
agente_exigido: ACTIVE
saida_de_agente: RESPONSAVEL_HUMANO_ATIVO
publicacao_na_comunidade: MEMBRO_ATIVO
publicacao_autonoma_por_agente: NAO_AUTORIZADA
moderacao_avancada: FASE_POSTERIOR
```

## Gate

A fase exige contratos, migração, constraints, membership transacional, publicação contextual, testes PostgreSQL, auditoria de Emily e decisão de Léo.