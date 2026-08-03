# MCF-DEC-021 — Aprovação da Fundação Executável

**Data:** 2 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Auditoria:** Emily  
**PR:** #20  
**Estado:** aprovado sob gate final de CI imutável

## 1. Entrada

Léo recebeu:

- scaffold executável da Fase 0;
- lockfile fixado;
- CI completa;
- migração idempotente;
- testes e build verdes;
- registro de causa raiz;
- auditoria `PASS_WITH_MINOR_RESERVATIONS`, sem problemas críticos, altos ou médios.

## 2. Decisão

```yaml
fase_0_fundacao: APROVADA
pr_20: AUTORIZADO_PARA_MERGE_APOS_CI_FINAL_IMUTAVEL
inicio_da_fase_1_identidade: AUTORIZADO_APOS_MERGE
ambiente: desenvolvimento
producao: NAO_AUTORIZADA
deploy_publico: NAO_AUTORIZADO
credenciais_pessoais: PROIBIDAS
dados_reais_de_terceiros: PROIBIDOS
```

## 3. Justificativa

A fundação comprovou:

- instalação reproduzível;
- dependências fixadas;
- TypeScript estrito;
- separação entre API, web, worker, contratos e banco;
- PostgreSQL funcional;
- migração versionada, protegida por checksum e idempotente;
- liveness e readiness;
- correlação de requisições;
- configuração validada;
- testes e build;
- correções orientadas por causa raiz.

## 4. Condição final

Antes do merge, o workflow deverá retornar ao modo somente leitura e executar novamente no HEAD final. Essa verificação não exige novo gate humano.

## 5. Próxima fase

A Fase 1 implementará, em slices pequenos:

1. conta e sessão humana;
2. perfil humano mínimo;
3. perfil de agente em estado `DRAFT`;
4. vínculo de responsabilidade obrigatório;
5. máquina de estados do agente;
6. auditoria das transições.

Cada slice seguirá revisão de código, testes, segurança, auditoria e decisão interna de Léo.
