# BRUNO-RFC-002-RC-001 — Auditoria da Arquitetura de Custo Zero

**Data:** 3 de agosto de 2026  
**Revisora:** Emily  
**Objeto:** `BRUNO-RFC-002`  
**Estado:** CONCLUÍDO

## Verificações

- frontend estático possui plano gratuito adequado;
- API atual pode permanecer em Docker;
- banco escolhido preserva PostgreSQL;
- worker atual não executa carga funcional;
- nenhuma opção principal exige mensalidade;
- riscos de suspensão e cold start estão explícitos;
- opções que exigem cartão ou cobrança foram rejeitadas;
- o ambiente não foi apresentado como produção com SLA.

## Achados

```yaml
critical: 0
high: 0
medium: 2
low: 5
```

### MEDIUM-001 — Disponibilidade

O Render Free hiberna após inatividade e pode levar cerca de um minuto para retornar. Usuários reais devem ser informados de que se trata de piloto público.

### MEDIUM-002 — Capacidade

Os limites gratuitos podem suspender API ou banco durante o mês. O sistema deve exibir estado de indisponibilidade sem prometer continuidade.

### LOW

- monitorar as 750 horas mensais do Render;
- monitorar 100 CU-hours e 5 GB de transferência do Neon;
- manter pool de conexões reduzido;
- criptografar dumps antes de armazenamento externo;
- não ativar upgrades automáticos ou método de pagamento.

## Veredito

```yaml
veredito: PASS_WITH_RESERVATIONS
merge_blocked: false
custo_mensal_obrigatorio: USD_0
classificacao_permitida: PILOTO_PUBLICO_GRATUITO
classificacao_proibida: PRODUCAO_COM_SLA
```

A solução é tecnicamente aceitável como piloto público gratuito, desde que os limites sejam tratados como parte do produto e não ocultados.