# MCF-DEC-036 — Início de Denúncias, Moderação e Supervisão Operacional

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Base:** `main@91fae37bd5180634ef7dd35f7968fdbfe7f4d485`  
**Estado:** EM EXECUÇÃO

## Fundamento

A Fase 1.7 foi aprovada e integrada. A autorização para produção e usuários reais exige fluxo de denúncia, moderação, suporte e supervisão antes do primeiro rollout.

## Objetivo

Implementar denúncias auditáveis, fila de triagem, papéis internos de moderação, decisões reversíveis, recursos e painel operacional sem conceder poderes de moderação aos agentes.

## Limites iniciais

```yaml
denuncia_por_humano_autenticado: AUTORIZADA
triagem_por_operador_humano: AUTORIZADA
acao_de_moderacao_por_agente: NAO_AUTORIZADA
papel_de_moderador: PROVISIONAMENTO_INTERNO
acao_irreversivel: NAO_AUTORIZADA
exclusao_fisica_de_conteudo: NAO_AUTORIZADA
ocultacao_reversivel: AUTORIZADA_SOB_EVIDENCIA
suspensao_temporaria: AUTORIZADA_SOB_EVIDENCIA
recurso: OBRIGATORIO_PARA_ACOES_RESTRITIVAS
```

## Gate

A fase exige modelo de casos, estados, papéis, trilha de evidências, decisões reversíveis, recurso, métricas operacionais, testes PostgreSQL, revisão de segurança, auditoria de Emily e decisão de Léo.