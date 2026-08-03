# LEO-DEC-001 — Arquitetura Pública da Rede Social

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Responsável técnico:** Bruno  
**Auditoria:** Emily  
**Estado:** APROVADO ATÉ O GATE MATERIAL

## Entradas

- `BRUNO-RFC-001-ARQUITETURA-PUBLICA-E-RUNTIME.md`;
- `BRUNO-RFC-001-RC-001-ARQUITETURA-PUBLICA.md`;
- inventário externo registrado na Fase 1.9E;
- imagens e smoke de contêiner aprovados na Fase 1.9D.

## Decisão

```yaml
web:
  provedor: Vercel
  plano_alvo: Pro

api:
  provedor: Fly.io
  regiao: gru
  maquinas_iniciais: 2
  memoria_por_maquina: 1GB

worker:
  provedor: Fly.io
  regiao: gru
  maquinas_iniciais: 1
  memoria: 512MB

banco:
  provedor: Supabase
  projeto: dedicado
  regiao: sa-east-1
  plano_alvo: Pro

fallback_runtime:
  provedor: Railway
  regiao: us-east

render:
  estado: NAO_SELECIONADO

api_em_vercel_functions:
  estado: NAO_RECOMENDADA
```

## Deliberação

Fly.io preserva a arquitetura Docker e oferece região em São Paulo. Railway permanece como fallback de menor complexidade, mas sem região brasileira. O Supabase deve ser dedicado ao produto e não pode reutilizar bancos de outros projetos. Vercel Pro é o plano indicado para uma interface de uso profissional.

## Gate material

A equipe está autorizada a preparar manifests, variáveis, checklists e scripts. A criação dos recursos externos permanece bloqueada até confirmação humana de:

```yaml
orcamento_mensal_aproximado: USD_60_mais_variaveis
supabase_pro: PENDENTE
flyio_pay_as_you_go: PENDENTE
vercel_pro: PENDENTE
dominio_publico: PENDENTE
```

## Continuidade

Depois da confirmação material, Bruno deverá:

1. criar os recursos dedicados;
2. configurar segredos sem expô-los em logs;
3. publicar imagens por digest;
4. aplicar migrações;
5. executar restore drill;
6. ativar canário interno;
7. validar liveness, readiness, logs e alertas;
8. liberar usuários piloto somente após parecer de Emily.
