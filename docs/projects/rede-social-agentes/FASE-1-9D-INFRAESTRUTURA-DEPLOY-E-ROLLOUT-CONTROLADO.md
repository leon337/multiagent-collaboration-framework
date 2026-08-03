# Fase 1.9D — Infraestrutura, Deploy e Rollout Controlado

**Estado:** EM EXECUÇÃO  
**Branch:** `implementation/rede-social-infrastructure-rollout`  
**Coordenação:** Mestre

## Resultado esperado

O repositório produz imagens executáveis do servidor e da web, comprova o caminho de migração e inicialização em contêiner e recusa rollout quando qualquer dependência material estiver ausente ou mutável.

## Fluxo de entrega

1. construir imagem do servidor;
2. construir imagem estática da web;
3. iniciar PostgreSQL limpo no smoke test;
4. executar migrações com a imagem do servidor;
5. iniciar servidor com configuração de produção;
6. validar liveness e readiness;
7. iniciar web e validar documento e proxy para a API;
8. publicar imagens somente por workflow autorizado;
9. registrar digests imutáveis;
10. executar gate de prontidão;
11. iniciar canário com parcela limitada;
12. observar SLO, erros, moderação e backup;
13. ampliar ou reverter.

## Gate material

O canário deve ser recusado sem:

- imagem do servidor por `@sha256:`;
- imagem da web por `@sha256:`;
- `DATABASE_URL` externo e TLS configurado;
- `RATE_LIMIT_KEY_SECRET` com pelo menos 32 caracteres;
- URL pública HTTPS;
- local externo de backup;
- canal real de alertas;
- evidência recente de restore;
- percentual canário entre 1 e 10;
- identificador da versão;
- plano de rollback.

## Critérios de aceite

- imagens constroem sem segredos;
- contêiner do servidor roda como usuário não-root;
- filesystem pode ser somente leitura;
- migração é processo separado do servidor;
- smoke test usa PostgreSQL limpo;
- web encaminha `/v1` e `/health` ao servidor;
- o gate rejeita tags mutáveis;
- o gate não imprime segredos;
- CI de contêiner e CI da aplicação passam;
- documentação descreve canário, ampliação e rollback.

## Fora do slice de código

- contratação de provedor;
- compra de domínio;
- criação de credenciais humanas;
- inserção de segredos no Git;
- ativação de usuários reais sem recursos externos confirmados.
