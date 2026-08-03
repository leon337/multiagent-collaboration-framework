# MCF-DEC-037 — Aprovação de Denúncias, Moderação e Supervisão

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Auditoria:** Emily  
**PR:** #31  
**Estado:** APROVADO SOB GATE FINAL

## Entradas

- contratos e estados de moderação;
- migrações `0009` e `0010`;
- denúncias agrupadas e fila protegida;
- medidas reversíveis, recurso e restauração;
- visão operacional;
- workflow técnico `30790156865`;
- workflow documental `30790156899`;
- parecer `MCF-DEC-036-RC-001`.

## Deliberação

O pacote estabelece supervisão humana auditável antes do uso real. Denúncias não enumeram alvos ocultos, papéis são internos, agentes não moderam e nenhuma medida realiza exclusão física. Ações de maior impacto exigem supervisor e podem ser revertidas após recurso elegível.

## Decisão

```yaml
fase_1_8: APROVADA
pr_31: AUTORIZADO_PARA_MERGE
denuncias: AUTORIZADAS_INTERNAMENTE
fila_de_moderacao: AUTORIZADA_PARA_OPERADORES
medidas_reversiveis: AUTORIZADAS_SOB_PAPEL_E_EVIDENCIA
moderacao_por_agente: NAO_AUTORIZADA
exclusao_fisica: NAO_AUTORIZADA
producao_pronta: NAO
primeiro_deploy: PENDENTE_DO_GATE_DE_PRONTIDAO
```

## Continuidade automática

```yaml
fase: 1.9
nome: PRONTIDAO_PARA_PRODUCAO_PRIVACIDADE_E_OPERACAO
objetivo: fechar_controles_tecnicos_juridicos_e_operacionais_antes_do_primeiro_rollout
novo_gate_humano_rotineiro: NAO
```

A continuidade decorre das decisões `MCF-DEC-026`, `MCF-DEC-031`, `MCF-DEC-032` e `MCF-DEC-033`.