# MCF-DEC-063 — Production Readiness pós-RC1

**Status:** EM QUALIFICACAO  
**Classificação:** decisão operacional Classe C  
**Missão:** `MCF-PRODUCTION-READINESS-001`  
**Issue:** #124  
**PR:** #125

## Decisão

O boundary posterior ao Gate E é **Prontidão para Produção**, já existente na governança do MCF. Não é criado `Gate F`.

A `v1.0.0-RC1` permanece imutável em `9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`. Como a revalidação encontrou e corrigiu um defeito real no restore PostgreSQL, o código corrigido não pode reutilizar a identidade da RC1. O candidato pós-correção será publicado como prerelease `v1.0.0-RC2` somente após requalificação da `main` pós-merge.

## Evidência técnica já obtida

O run `31583249988` comprovou no candidato exato da rodada:

- auditoria de dependências de produção sem vulnerabilidade conhecida no nível `high`;
- format, lint, typecheck, testes e build;
- migrations aplicadas duas vezes;
- backup com manifesto e SHA-256;
- restore efetivo em PostgreSQL isolado;
- ledger de migrações preservado.

O restore foi corrigido para exigir banco alvo explícito. A RC1 não foi alterada.

## Infraestrutura pública aprovada

A arquitetura de custo zero vigente usa:

- `rsa-web-free` no Render Static Site;
- `rsa-api-free` no Render Free Web Service Docker;
- Neon Free dedicado `silent-sun-03230384`;
- segredos fora do Git;
- canário controlado e smoke público antes de usuários reais.

A identidade do deploy no Render é o SHA Git qualificado registrado pelo provider e validado por probes, conforme a arquitetura Render-from-Git aprovada posteriormente ao requisito histórico de registry por digest.

## Condições restantes para produção

- publicar e verificar RC2 após requalificação pós-merge;
- materializar `rsa-api-free` via Blueprint, pois o conector atual não cria Web Service Docker;
- configurar Neon/CORS/URL pública sem expor credenciais;
- ativar monitor de readiness e canal GitHub Issues;
- obter backup/snapshot imediatamente anterior ao rollout;
- executar smoke público;
- observar o canário pelo mínimo canônico de 60 minutos;
- fechar PRF Classe C e evidência de auditoria/governança.

## Separação da versão estável

`v1.0.0` estável permanece bloqueada até saúde operacional pós-deploy, ausência de blocker material e fechamento auditável. A publicação da RC2 não promove a versão estável automaticamente.
