# BRUNO-RFC-001-RC-001 — Auditoria da Arquitetura Pública

**Data:** 3 de agosto de 2026  
**Revisora:** Emily  
**Artefato auditado:** `BRUNO-RFC-001-ARQUITETURA-PUBLICA-E-RUNTIME.md`  
**Estado:** CONCLUÍDO

## Escopo

- compatibilidade com a arquitetura existente;
- disponibilidade regional;
- suporte a Docker e worker persistente;
- compatibilidade de conexão com Supabase;
- estimativa de custo;
- riscos, fallback e limites de autorização.

## Evidências confirmadas

```yaml
flyio_regiao_sao_paulo_gru: CONFIRMADA
railway_regiao_brasil: NAO_DISPONIVEL
render_regiao_brasil: NAO_DISPONIVEL
flyio_docker_e_healthchecks: CONFIRMADOS
railway_docker_healthchecks_restart: CONFIRMADOS
render_docker_worker_healthchecks: CONFIRMADOS
supabase_pooler_session_para_backend_ipv4: CONFIRMADO
supabase_direct_para_backend_persistente_e_operacoes: CONFIRMADO
vercel_hobby_uso_pessoal_nao_comercial: CONFIRMADO
```

## Avaliação

A seleção de Fly.io como runtime principal é tecnicamente coerente devido à região `gru`, preservação da arquitetura Docker e proximidade dos usuários e do banco em São Paulo. Railway é um fallback adequado pela simplicidade operacional, embora com maior distância regional. Render não oferece vantagem material sobre Railway para este caso.

A estimativa de aproximadamente US$ 60,16/mês é uma referência razoável para a configuração inicial descrita, mas não constitui cotação contratual. Egress, domínio, backups externos, suporte e observabilidade podem elevar o valor.

## Achados

```yaml
critical: 0
high: 0
medium: 0
low: 5
```

- **LOW-001:** custo final depende de cotação e consumo real em cada conta;
- **LOW-002:** disponibilidade de capacidade na região `gru` deve ser confirmada durante a criação;
- **LOW-003:** duas máquinas da API aumentam disponibilidade, mas não eliminam falha regional;
- **LOW-004:** armazenamento externo de backup ainda não possui provedor definido;
- **LOW-005:** domínio e política de DNS ainda não foram definidos.

## Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
recomendacao_principal: APROVADA
fallback: APROVADO
criacao_de_recursos: AINDA_DEPENDE_DE_GATE_MATERIAL
merge_blocked: false
```