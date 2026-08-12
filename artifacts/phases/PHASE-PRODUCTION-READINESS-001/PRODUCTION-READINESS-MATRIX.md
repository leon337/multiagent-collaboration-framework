# Production Readiness Matrix — MCF-PRODUCTION-READINESS-001

**Baseline de abertura:** `main@e46de554f1340edc3bd842e28f17bab5aaec7e6c`  
**RC1 imutável:** `v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`  
**Candidato corrigido:** boundary `v1.0.0-RC2`, publicado somente após requalificação pós-merge.  
**Regra:** `PASS` exige evidência verificável; produção e versão estável são milestones separados.

| # | Dimensão | Estado atual | Evidência / condição |
|---:|---|---|---|
| 1 | Integridade / artefatos imutáveis | PASS | RC1 continua em `9b4a759...`; workflow de readiness verifica a tag; RC2 não retargeta RC1 |
| 2 | CI / Foundation / Container Smoke | PASS | run exato `31583249988` green; Foundation e Container Smoke permanecem gates do PR e serão exigidos no head final |
| 3 | Segurança | PASS | `pnpm audit --prod --audit-level high` sem vulnerabilidades conhecidas; baseline MCF-DEC-039; testes de security/HDF no full test |
| 4 | Configuração / secrets | PARTIAL_EXTERNAL | `render.yaml` mantém secrets fora do Git e gera secrets locais; URLs/DB/CORS de produção precisam ser materializados no Blueprint |
| 5 | Infraestrutura | PARTIAL_EXTERNAL | Neon dedicado `silent-sun-03230384` existe; `rsa-web-free` existe; `rsa-api-free` ainda não existe no inventário Render |
| 6 | Staging / pré-produção | PASS | staging Render separado e RC1 exact-SHA já qualificado; refresh obrigatório imediatamente antes do rollout RC2 |
| 7 | Migração / DB | PASS | migrations duas vezes no run `31583249988`; restore preservou `_rsa_migrations` |
| 8 | Observabilidade | PARTIAL_EXTERNAL | logs/métricas Render e runbook SLO existem; monitor GitHub Issues foi preparado e fica desabilitado até existir API pública |
| 9 | Backup / recovery | PASS_PRE_ROLLOUT | backup + manifesto SHA-256 + restore real em DB isolado no run `31583249988`; snapshot/backup do Neon será coletado imediatamente antes do rollout |
| 10 | Rollback / recuperação | PASS_PRE_ROLLOUT | MCF-DEC-058 prova recovery por SHA em staging; RSA-ROLLBACK define limites; versão anterior será fixada antes do canário |
| 11 | Health / readiness / liveness | PASS | endpoints e testes atuais; staging saudável; container smoke cobre probes |
| 12 | Estratégia de deploy | PASS_PRE_ROLLOUT | canário 1–10%, 60 min, critérios de rollback em RSA-CANARY-ROLLOUT; Render gratuito aprovado em LEO-DEC-002 |
| 13 | Release / versão / tag | PASS_PRE_MERGE | RC1 preservada; mudança operacional pós-RC1 exige nova prerelease `v1.0.0-RC2`; publicação idempotente condicionada a readiness pós-merge |
| 14 | Resposta a incidente | PASS | RSA-INCIDENT-RESPONSE + RSA-SLO-AND-ALERTS + RSA-ROLLBACK vigentes |
| 15 | Smoke pós-deploy | BLOQUEADO_ATE_ROLLOUT | somente evidência real após criação/sincronização da API pública |
| 16 | Aprovação / auditoria | EM_FECHAMENTO | PRF Classe C, trace, governança e revisão final precisam ser vinculados ao head final e depois ao SHA pós-merge |

## Achados tratados nesta missão

### PRD-001 — ordem incorreta do readiness CI

A suíte de integração era executada antes das migrations em PostgreSQL limpo, produzindo falhas por tabelas inexistentes. Corrigido: migrations precedem testes.

### PRD-002 — restore sem banco alvo explícito

`pg_restore` herdava `PGDATABASE` do ambiente, mas não recebia `--dbname`; o ensaio isolado revelou a falha real. Corrigido com banco alvo obrigatório e teste de regressão. O ensaio posterior restaurou com sucesso em `rsa_restore` e validou o ledger.

## Dependência material restante

O conector Render não cria Web Service Docker/Blueprint. A API pública `rsa-api-free` deve ser materializada pelo Blueprint já aprovado, no workspace `Leandro's workspace`, somente quando o SHA pós-merge/RC2 estiver qualificado. Esse é o único efeito externo que não pode ser executado integralmente pelo conector atual.

## Regra de fechamento

Após o rollout, as linhas 4, 5, 8, 9, 10, 12, 15 e 16 devem receber evidência material do ambiente público antes de `production: COMPLETE`. A tag estável `v1.0.0` só pode ser avaliada após observação operacional e não é consequência automática deste matrix.
