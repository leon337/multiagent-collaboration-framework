# MCF-DEC-044 — Início de Infraestrutura, Deploy e Rollout Controlado

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Base:** `main@8c1c2743d04889b6ba396e9366b4d614bffca8ba`  
**Estado:** EM EXECUÇÃO

## Fundamento

Os slices de segurança, privacidade e operação foram integrados. O próximo passo é produzir artefatos imutáveis, validar execução em contêiner e transformar as dependências externas do primeiro rollout em um gate verificável.

## Escopo do Slice D

```yaml
imagens:
  server: OBRIGATORIA
  web: OBRIGATORIA
  identificacao_por_digest_no_rollout: OBRIGATORIA
container_smoke:
  postgres_limpo: OBRIGATORIO
  migracao: OBRIGATORIA
  liveness: OBRIGATORIA
  readiness: OBRIGATORIA
  web: OBRIGATORIO
deploy:
  banco_externo: OBRIGATORIO
  segredo_rate_limit: OBRIGATORIO
  url_https: OBRIGATORIA
  backup_externo: OBRIGATORIO
  alertas_reais: OBRIGATORIOS
  restore_test_evidence: OBRIGATORIA
rollout:
  estrategia: CANARIO
  rollback: OBRIGATORIO
  usuarios_reais_iniciais: LIMITADOS
```

## Limites

```yaml
registry_real: AINDA_NAO_CONFIRMADO
banco_externo_real: AINDA_NAO_CONFIRMADO
dominio_e_dns: AINDA_NAO_CONFIRMADOS
armazenamento_de_backup: AINDA_NAO_CONFIRMADO
canal_de_alerta: AINDA_NAO_CONFIRMADO
segredos_reais: NAO_REGISTRADOS_NO_REPOSITORIO
primeiro_deploy_publico: NAO_EXECUTADO
novo_gate_humano_rotineiro: NAO
```

A equipe deve continuar até CI, auditoria e integração dos artefatos. O primeiro deploy público só pode avançar quando o gate material confirmar todos os recursos externos e segredos necessários.
