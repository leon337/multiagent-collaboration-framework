# MCF-DEC-063 — Production Readiness pós-RC1

**Status:** CONCLUÍDA  
**Classificação:** decisão operacional Classe C  
**Missão:** `MCF-PRODUCTION-READINESS-001`  
**Issue:** #124  
**PRs:** #125, #126

## Decisão

O boundary posterior ao Gate E é **Prontidão para Produção**, já existente na governança do MCF. Não foi criado `Gate F`.

A `v1.0.0-RC1` permanece imutável em `9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`. A correção operacional pós-RC1 recebeu identidade separada `v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719`.

## Qualificação final

Head qualificado para o closeout:

`cf6cf42bdff923e44ccc7603058edc66f079f369`

Evidência pós-merge:

- Production Readiness run `31602905916`: PASS;
- staging deploy run `31602905900`: PASS;
- container smoke: PASS;
- dependency audit, format, lint, typecheck: PASS;
- migrations duas vezes, full tests, build: PASS;
- backup + restore isolado: PASS;
- staging exact-SHA deploy `dep-d9u7o3m417fc73fudeqg`: PASS.

## Infraestrutura pública materializada

- `rsa-web-free` no Render Static Site: LIVE;
- `rsa-api-free` no Render Free Web Service Docker: LIVE;
- Neon dedicado `silent-sun-03230384`;
- segredos fora do Git;
- CORS e configuração protegida materializados no provider.

Deploy final da API:

```yaml
service: srv-d9u5vnijobas73ecvlo0
deploy: dep-d9u7ponmnsvc73a75atg
sha: cf6cf42bdff923e44ccc7603058edc66f079f369
status: LIVE
```

## Canário e smoke público

A política funcional de cadastro controlado entrou em produção em `cce371417308b92409131c5b40bb4968d0d5ba85`, deploy `dep-d9u6f3jncjis7385cdvg`, e permaneceu live por aproximadamente 90 minutos (`2026-08-12T12:32:33Z`–`2026-08-12T14:02:38Z`), excedendo o mínimo canônico de 60 minutos.

Nesse intervalo, a consulta de logs `error` do provider retornou zero erros de aplicação. A política funcional de cadastro não foi alterada nos commits posteriores até `cf6cf42...`; foram adicionados validação de boot, testes, configuração Render, smoke e formatação. O head final também foi implantado e apresentou `/health/ready` HTTP 200 repetidamente sem erro de aplicação no intervalo pós-deploy verificado.

O finding de cadastro público irrestrito foi corrigido antes do closeout com allowlist obrigatória de produção e testes de convidado/não convidado.

## Observabilidade e recovery

- logs estruturados + correlation IDs ativos;
- métricas Render disponíveis;
- monitor de `/health/ready` a cada cinco minutos com alerta por GitHub Issues habilitado no closeout;
- snapshot/branch Neon pré-rollout preservado;
- backup + checksum + restore isolado comprovados;
- recovery por SHA validado em staging;
- nenhum restore destrutivo foi executado contra produção.

## Resultado

```yaml
readiness_dimensions: 16/16_PASS
canary_minimum_60_minutes: PASS
post_deploy_smoke: PASS
material_blockers: 0
production: COMPLETE
stable_v1_0_0: NOT_PROMOTED
```

## Separação da versão estável

`v1.0.0` estável continua sendo um milestone separado. O fechamento desta decisão conclui a fase de produção, mas não promove automaticamente a versão estável.
