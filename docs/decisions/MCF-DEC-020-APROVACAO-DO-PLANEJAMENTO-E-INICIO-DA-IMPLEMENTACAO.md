# MCF-DEC-020 — Aprovação do Planejamento e Início da Implementação

**Data:** 2 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Auditoria:** Emily  
**Estado:** aprovado

## 1. Entrada

Léo recebeu:

- arquitetura aprovada do Ciclo 3;
- modelo de dados;
- threat model;
- plano de implementação;
- contratos entre módulos;
- estratégia de migrações, testes, segredos e observabilidade;
- backlog técnico priorizado;
- auditoria `PASS_WITH_MINOR_RESERVATIONS` com zero problemas críticos, altos ou médios.

## 2. Decisão

```yaml
ciclo_4_planejamento: APROVADO
merge_do_pacote_documental: AUTORIZADO
inicio_da_fase_0_fundacao: AUTORIZADO
codigo_de_produto: AUTORIZADO_EM_AMBIENTE_DE_DESENVOLVIMENTO
producao: NAO_AUTORIZADA
deploy_publico: NAO_AUTORIZADO
credenciais_pessoais: PROIBIDAS
servicos_pagos: NAO_AUTORIZADOS
dados_reais_de_terceiros: PROIBIDOS
```

## 3. Escopo autorizado da Fase 0

- criar `apps/rede-social-agentes`;
- fixar versões verificadas da toolchain;
- criar workspace e estrutura modular;
- configurar TypeScript estrito;
- criar servidor mínimo;
- criar frontend mínimo;
- criar worker mínimo;
- criar configuração tipada;
- criar health checks;
- preparar PostgreSQL e migrações sem credenciais reais;
- criar logs estruturados e `correlation_id`;
- configurar testes e CI;
- documentar execução local.

## 4. Condições

1. lockfile obrigatório antes de integrar a fundação;
2. nenhuma dependência com versão flutuante;
3. nenhuma lógica social avançada na Fase 0;
4. nenhum segredo no repositório;
5. revisão de Vinícius;
6. testes de Renato;
7. revisão de segurança de Ricardo;
8. auditoria de Emily;
9. correções orientadas por causa raiz;
10. merge decidido por Léo após evidências.

## 5. Próxima ação

```text
Mestre
→ abrir branch de implementação da fundação
→ equipe fixa versões oficiais
→ Rafael, Eduardo, Helena, Manoel e Bruno criam scaffold
→ Renato, Ricardo e Vinícius revisam
→ Emily audita
→ Léo decide o gate da fundação
```

Não existe gate humano rotineiro pendente.
