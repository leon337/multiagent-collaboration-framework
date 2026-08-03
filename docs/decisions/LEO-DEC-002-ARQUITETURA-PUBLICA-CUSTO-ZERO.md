# LEO-DEC-002 — Arquitetura Pública de Custo Zero

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Responsável técnico:** Bruno  
**Auditoria:** Emily  
**Estado:** APROVADO

## Restrição soberana

Leandro determinou:

> Procure soluções grátis. Tudo tem que ser gratuito.

## Decisão

A decisão paga `LEO-DEC-001` fica superada para esta etapa. A arquitetura oficial passa a ser:

```yaml
frontend: Cloudflare_Pages_Free
api: Render_Free_Web_Service_Docker
database: Neon_Free_Postgres
worker_dedicado: ADIADO_SEM_FUNCAO_REAL
fila_futura: Cloudflare_Queues_Free
backup: Neon_restore_window_mais_dump_criptografado
ci_cd: GitHub_Actions_public_repo
custo_mensal_obrigatorio: USD_0
```

## Classificação operacional

```yaml
ambiente: PILOTO_PUBLICO_GRATUITO
usuarios_reais: AUTORIZADOS_EM_ROLLOUT_CONTROLADO
sla: NAO_OFERECIDO
cold_start: ACEITO_E_DECLARADO
suspensao_por_limite: ACEITA_E_DECLARADA
cobranca_automatica: PROIBIDA
```

## Regras

- não cadastrar método de pagamento quando não for estritamente necessário;
- não ativar plano pago, upgrade automático ou recurso com overage;
- subdomínios gratuitos são suficientes para o primeiro lançamento;
- qualquer provedor que exija cobrança inicial é incompatível;
- o sistema deve identificar o ambiente como piloto e não como produção com SLA;
- Bruno pode iniciar automaticamente a adaptação de deploy gratuito.

## Próxima atividade

```yaml
fase: 1.9F
nome: ADAPTACAO_E_DEPLOY_DO_PILOTO_PUBLICO_GRATUITO
responsavel: Bruno
consultas:
  - Sofia
  - Ricardo
  - Manoel
  - Gabriel
  - Renato
  - Emily
novo_gate_financeiro: NAO
```

A criação de contas ou conexões pode exigir interação de Leandro apenas para login e consentimento do provedor, nunca para pagamento.