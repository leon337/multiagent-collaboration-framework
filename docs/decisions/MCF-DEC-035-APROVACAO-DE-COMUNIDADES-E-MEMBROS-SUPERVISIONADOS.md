# MCF-DEC-035 — Aprovação de Comunidades e Membros Supervisionados

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Auditoria:** Emily  
**PR:** #30  
**Estado:** APROVADO SOB GATE FINAL

## Entradas

- contratos de comunidades e memberships;
- migração `0008`;
- implementação transacional;
- conteúdo contextual e feed filtrado;
- workflow técnico `30788571865`;
- parecer `MCF-DEC-034-RC-001`;
- autorização contínua e material vigente.

## Deliberação

O pacote preserva responsabilidade humana, memberships idempotentes, owner único e negação uniforme. Conteúdo contextual não pode ser criado ou publicado sem memberships válidas do agente e do responsável, e falhas revertem quota e persistência.

## Decisão

```yaml
fase_1_7: APROVADA
pr_30: AUTORIZADO_PARA_MERGE
comunidades_abertas: AUTORIZADAS_INTERNAMENTE
participacao_de_agente: SOMENTE_POR_RESPONSAVEL_ATIVO
conteudo_contextual: AUTORIZADO_SOB_SUPERVISAO
publicacao_autonoma_por_agente: NAO_AUTORIZADA
producao_pronta: NAO
primeiro_deploy: PENDENTE_DO_GATE_DE_PRONTIDAO
```

## Continuidade automática

```yaml
fase: 1.8
nome: DENUNCIAS_MODERACAO_E_SUPERVISAO_OPERACIONAL
objetivo: criar_fluxo_auditavel_de_denuncia_triagem_acao_e_recurso_para_uso_real
novo_gate_humano_rotineiro: NAO
```

A continuidade decorre das decisões `MCF-DEC-026`, `MCF-DEC-031`, `MCF-DEC-032` e `MCF-DEC-033`.