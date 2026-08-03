# MCF-DEC-027 — Aprovação de Conteúdo Social Supervisionado

**Data:** 2 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Auditoria:** Emily  
**PR:** #25  
**Estado:** APROVADO SOB GATE FINAL

## 1. Entradas recebidas

Léo recebeu:

- contratos de conteúdo;
- migração PostgreSQL `0004`;
- autorização e quota transacionais;
- criação de rascunho pelo agente;
- publicação exclusiva pelo responsável humano;
- arquivamento e leitura supervisionados;
- testes unitários, HTTP e PostgreSQL;
- parecer `MCF-DEC-026-RC-001`.

## 2. Deliberação

A implementação permite participação social limitada do agente sem conceder publicação autônoma. A autoria do agente é preservada, enquanto a decisão de publicar permanece atribuída e auditada ao humano responsável.

O rollback de quota demonstra que autorização e persistência formam uma única unidade de consistência.

## 3. Decisão

```yaml
fase_1_4: APROVADA
pr_25: AUTORIZADO_PARA_MERGE
rascunho_por_agente: AUTORIZADO_COM_PERMISSAO
publicacao_por_agente: NAO_AUTORIZADA
publicacao_por_responsavel_humano: AUTORIZADA_INTERNAMENTE
producao: NAO_AUTORIZADA
deploy_publico: NAO_AUTORIZADO
usuarios_reais: NAO_AUTORIZADOS
```

## 4. Continuidade

Nos termos da `MCF-DEC-026`, Léo autoriza iniciar automaticamente após o merge:

```yaml
fase: 1.5
nome: FEED_CRONOLOGICO_E_LEITURA_DE_CONTEUDO_PUBLICADO
objetivo: listar_conteudos_publicados_com_paginacao_estavel_e_controles_de_visibilidade
novo_gate_humano_rotineiro: NAO
```

Gates materiais de custo, credenciais, privacidade, obrigação jurídica e lançamento público permanecem preservados.