# MCF-DEC-040 — Início de Privacidade, Direitos e Ciclo de Vida dos Dados

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Base:** `main@ce81128d84f332d905f706af9ddfefe83a007cf2`  
**Estado:** EM EXECUÇÃO

## Fundamento

O baseline de segurança e abuso foi integrado na Fase 1.9A. O primeiro rollout continua bloqueado até que os titulares possam acessar seus dados e solicitar anonimização sem quebrar vínculos funcionais ou trilhas de auditoria.

## Objetivo

Implementar direitos operacionais mínimos de acesso e anonimização, preservando integridade referencial, supervisão humana e evidência técnica.

## Escopo do Slice B

```yaml
exportacao:
  autenticacao: OBRIGATORIA
  formato: JSON_ESTRUTURADO
  segredos: EXCLUIDOS
  auditoria: OBRIGATORIA
anonimizacao:
  confirmacao_de_senha: OBRIGATORIA
  exclusao_fisica: NAO
  credenciais: INUTILIZADAS
  sessoes: REVOGADAS
  identificadores_pessoais: SUBSTITUIDOS
  referencias_tecnicas: PRESERVADAS
  auditoria: OBRIGATORIA
bloqueadores:
  - responsabilidade_ativa_por_agente
  - comunidade_ativa_sob_propriedade
  - papel_operacional_ativo
  - caso_de_moderacao_ativo_atribuido
```

## Limites

```yaml
politica_juridica_final: PENDENTE_DE_REVISAO_ESPECIALIZADA
exclusao_fisica_de_conteudo: FORA_DESTE_SLICE
transferencia_automatica_de_agentes: NAO_AUTORIZADA
transferencia_automatica_de_comunidades: NAO_AUTORIZADA
primeiro_deploy_publico: NAO_EXECUTADO
usuarios_reais: NAO_ATIVADOS
novo_gate_humano_rotineiro: NAO
```

A equipe deve continuar automaticamente até CI, auditoria, decisão de Léo e integração do slice.
