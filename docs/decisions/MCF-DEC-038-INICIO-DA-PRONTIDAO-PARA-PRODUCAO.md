# MCF-DEC-038 — Início da Prontidão para Produção

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Base:** `main@1db6cc9dd41afef732f579da25575c224f0a0234`  
**Estado:** EM EXECUÇÃO

## Fundamento

Leandro autorizou produção, deploy público e usuários reais na `MCF-DEC-031`. As fases funcionais de identidade, conteúdo, feed, interações, comunidades e moderação já foram integradas. O primeiro rollout continua condicionado ao gate de prontidão.

## Objetivo

Fechar controles técnicos, jurídicos e operacionais necessários para transformar a autorização material em um candidato verificável ao primeiro deploy público controlado.

## Trilhas obrigatórias

```yaml
seguranca_e_abuso:
  - headers_de_seguranca
  - rate_limiting
  - limites_de_payload
  - endurecimento_de_sessao
privacidade_e_direitos:
  - politica_de_privacidade
  - termos_de_uso
  - exportacao_de_dados
  - exclusao_ou_anonimizacao
operacao:
  - logs_metricas_alertas
  - runbook_de_incidentes
  - backup_e_restauracao
  - rollback
infraestrutura:
  - ambientes_separados
  - segredos
  - dominio_e_tls
  - smoke_test_publico
rollout:
  - equipe_interna
  - piloto_por_convite
  - cadastro_publico_controlado
```

## Primeira execução

O primeiro slice implementará proteção contra abuso e baseline de segurança sem depender de serviços externos ainda não configurados.

## Limites

```yaml
primeiro_deploy_publico: NAO_EXECUTADO
usuarios_reais_ativados: NAO
segredos_reais: NAO_DISPONIBILIZADOS
infraestrutura_final: AINDA_NAO_DEFINIDA
novo_gate_humano_rotineiro: NAO
```

A equipe deve continuar automaticamente até encontrar uma dependência material externa que não possa ser resolvida internamente.