# MCF-DEC-042 — Início de Operação, Backup, Restauração e Observabilidade

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Base:** `main@d39906d6ad8b00e929c825e4a9d23df588886c57`  
**Estado:** EM EXECUÇÃO

## Fundamento

Segurança básica e direitos de privacidade foram integrados. Antes da infraestrutura pública, a equipe precisa provar que consegue observar falhas, produzir backup verificável, restaurar com confirmação explícita e operar incidentes sem improvisação.

## Escopo do Slice C

```yaml
observabilidade:
  logs_http_estruturados: OBRIGATORIOS
  corpo_query_token_ip: PROIBIDOS
  correlation_id: OBRIGATORIO
  duracao_status_rota_template: OBRIGATORIOS
backup:
  formato: POSTGRESQL_CUSTOM
  checksum_sha256: OBRIGATORIO
  manifesto: OBRIGATORIO
  escrita_atomica: OBRIGATORIA
restauracao:
  checksum_antes_de_restaurar: OBRIGATORIO
  confirmacao_destrutiva: OBRIGATORIA
  validacao_do_ledger: OBRIGATORIA
runbooks:
  - incidente
  - backup_e_restore
  - rollback
  - alertas_e_slo
```

## Limites

```yaml
backup_gerenciado_por_provedor: PENDENTE_DE_INFRAESTRUTURA
armazenamento_externo_de_backup: NAO_CONFIGURADO
alertas_reais: NAO_CONECTADOS
primeiro_deploy_publico: NAO_EXECUTADO
usuarios_reais: NAO_ATIVADOS
novo_gate_humano_rotineiro: NAO
```

A implementação deve permanecer independente do provedor e continuar automaticamente até CI, auditoria, decisão de Léo e integração.
