# MCF CHECKPOINT — CONTENT FACTORY V1

**Mission ID:** `MCF-CONTENT-FACTORY-V1-NOTEBOOK-INDEPENDENCE-001`
**Data:** 2026-10-04
**Estado:** `P8_AUTHENTICATED_E2E_PENDING_REAL_EMAIL`

## Objetivo
Concluir a independência total do Content Factory V1 em relação ao notebook, mantendo o runtime de produção na nuvem e provando o fluxo ponta a ponta real:

`login real → claim idempotente → conteúdo novo → mídia → publicação Meta via worker durável → retry sem duplicidade → E2E final com notebook fora do caminho`

## O que já está comprovado

- Produção pública ativa: `https://content-factory-v1.vercel.app/`
- Deployment canônico verificado: `dpl_B27mPoRqwBw7q1fNrEQpvYrCCXn8`
- Supabase projeto: `ypocndnfbujvxwglrnzc` (`sa-east-1`)
- API `content-factory-api` v11 ACTIVE
- Worker durável `content-factory-worker` v4 ACTIVE
- Renderer v2 ACTIVE
- Web v1 ACTIVE
- Web Publisher v1 ACTIVE
- pg_cron ativo: `content-factory-worker-every-minute`
- Security Advisors: `0 lints`
- Storage privado: `content-factory-media`
- Migração staged preservada: 13 arquivos / 7 itens de biblioteca / 6 publicações
- Migration batch: `648f735d-4be6-4c97-97c6-ad72044bcb2f`
- Credenciais Meta e token previamente validado estão armazenados no Vault
- Geração de cartão em Canvas no navegador comprovada, sem Gemini WebView/Electron
- Produção validada em navegador independente
- Não há requisições para `localhost`/`127.0.0.1` na aplicação pública
- Backend local do Content Factory está desligado
- `127.0.0.1:8765` está livre
- Processos Electron/Content Factory não estão rodando
- VoiceHub em `127.0.0.1:8788` foi preservado por ser serviço compartilhado do MCF
- Conta temporária usada no teste de autenticação foi removida
- `auth.users = 0`
- Nenhum conteúdo novo nem nova publicação social foi criado pelo teste de autenticação que falhou

## Gate atual

### BLOQUEADOR ÚNICO
`AUTH-BOOTSTRAP-001 — REAL_USER_AUTHENTICATION`

A aplicação usa Supabase Magic Link com `mailer_autoconfirm=false`. O teste com e-mails descartáveis falhou por bloqueios/limitações dos provedores. Portanto, **não devemos tentar contornar a autenticação nem usar identidade inventada**.

Existe uma sessão de configuração do perfil TinyFish, mas a última leitura ainda mostrava:

`signed_in_sites = []`

A sessão precisa ser realmente autenticada e salva antes de executar automação autenticada.

## Próxima sequência EXATA

1. Abrir a sessão de setup do perfil TinyFish para o domínio `content-factory-v1.vercel.app`.
2. Fazer login no Content Factory usando um e-mail real/permanente e concluir o Magic Link.
3. Salvar o perfil autenticado.
4. Verificar que o perfil passa a aparecer como autenticado para o domínio.
5. Retomar automaticamente em `claim migration`.
6. Verificar que o claim é idempotente: primeira execução assume o lote; repetição não duplica nem corrompe.
7. Criar **novo** item de conteúdo para o E2E. Não reutilizar IDs históricos de publicação.
8. Gerar/salvar a nova mídia.
9. Enfileirar a publicação Meta.
10. Worker durável executa a publicação uma única vez.
11. Persistir o ID externo retornado pela Meta.
12. Executar retry controlado com a mesma idempotency key e provar ausência de duplicidade.
13. Fazer validação visual/funcional final no host público.
14. Confirmar novamente que o notebook continua sem runtime local do Content Factory.
15. Fechar P8/P9 somente com evidência suficiente e registrar a conclusão no MCF Handbook + mission JSON + documentação do projeto.

## Regras críticas para a retomada

- NÃO tentar outro e-mail descartável.
- NÃO enfraquecer Supabase Auth.
- NÃO inventar identidade.
- NÃO reutilizar publicação histórica para o novo E2E.
- NÃO repetir POST Meta quando o resultado estiver ambíguo; primeiro reconciliar.
- Retry social deve ser idempotente.
- Notebook não volta a ser backend do Content Factory.
- VoiceHub `8788` compartilhado permanece preservado.
- Manter atualizados os registros persistentes no MCF.

## Estado persistente já registrado

### MCF
- `docs/operations/MCF-MESTRE-HANDBOOK.md`
- `context/missions/mcf-content-factory-v1-notebook-independence-001.json`
- PR #406 mesclada no MCF
- merge SHA: `c58fbafd4c66fd0765bc6380f1af1381b324aa08`

### Content Factory V1
- `docs/migration/NOTEBOOK-INDEPENDENCE-CURRENT-STATE.md`
- PR #7 mesclada
- merge SHA: `f92f92e6ef3b96441666852167cd1a142ad05e69`

## Frase de retomada

> **CONTINUE DO CHECKPOINT MCF-CONTENT-FACTORY-V1-NOTEBOOK-INDEPENDENCE-001. ESTADO P8_AUTHENTICATED_E2E_PENDING_REAL_EMAIL. NÃO REFAÇA O QUE JÁ FOI COMPROVADO. RETOME NO GATE DE AUTENTICAÇÃO REAL; DEPOIS EXECUTE CLAIM → NOVO CONTEÚDO → META → RETRY SEM DUPLICIDADE → E2E FINAL SEM NOTEBOOK.**
