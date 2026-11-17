# ADR — Isolamento PostgreSQL do staging do MissionRuntime

**Estado:** implementado e validado em staging, 17/11/2026.
**Autoridade:** LEANDRO; orquestração: MESTRE; gates operacionais LÉO/HDF ainda pendentes.

## Problema
O serviço Render mcf-runtime-staging-api não iniciava por DNS de um PostgreSQL antigo (getaddrinfo ENOTFOUND). O código da main estava sem a rota isolada de leitura proposta no PR #538.

## Decisão aplicada
1. Não alterar o Neon main nem restaurar dados de produção.
2. Neon projeto rede-social-agentes-ia, ID silent-sun-03230384. Foi criada branch separada staging-mcf-runtime-isolated-20261117, ID br-snowy-haze-ay3gmnxk, derivada de br-red-mud-ayakv7ue.
3. Dentro da nova branch, criar um banco NOVO, vazio, mcf_runtime_staging. A branch clona o neondb do parent, mas o novo banco não compartilha as tabelas nem os dados. O papel do runtime não consegue ler neondb.public.mcf_missions.
4. Usar identidade mcf_staging_migrator como proprietária do banco e MIGRATION_DATABASE_URL somente para migrações; identidade mcf_staging_runtime com DATABASE_URL e privilégios SELECT/INSERT/UPDATE/DELETE nas tabelas públicas, USAGE/SELECT nas sequences, sem CREATE ou acesso à tabela privada _rsa_migrations.
5. Garantir privilégios padrão para tabelas/sequências futuras criadas por mcf_staging_migrator. Essas permissões são específicas do novo banco.
6. No serviço Render mcf-runtime-staging-api (srv-d9p1r6vlk1mc73a7gtj0, workspace tea-d2u2msje5dus73eb6ehg), atualizar somente essas duas variáveis em merge, preservando todas as outras.
7. Manter MCF_MISSION_CONTROL_READ_TOKEN distinto do dispatch. Chave armazenada no Render e no arquivo privado local (0600), nunca no Git.
8. Não promover nem executar por voz: PermissionEngine, LÉO e HDF continuam sendo gates independentes; não declarar preflight remoto aprovado sem teste.

## Restrições reais da conta Neon
A criação de um projeto separado foi recusada pela organização Free com erro de projeto HIPAA, inclusive após hipaa=false. Uma tentativa de customizar timeout de suspensão de branch também foi recusada. Criar branch com configurações padrão e banco totalmente novo foi a alternativa viável. Não foram apagadas branches nem modificada a branch principal.

## Evidências verificadas
- 32 migrações, 29 tabelas públicas, 0 contas, 0 missões no novo banco.
- Papel do runtime consegue ler/inserir em mcf_missions, não cria objetos e não lê _rsa_migrations nem mcf_missions no neondb clonado.
- Render deploy dep-dbtsllh42hec73at7l40 ficou live no commit e5c0abf60a2e85adc0dee30340a64bf30cc20ec9 em 2026-11-17T03:34:32Z.
- GET /health/live e /health/ready: HTTP 200.
- GET /v1/mcf/mission-control/read/latest: HTTP 404 esperado — feature ainda não integrada do PR #538; token pronto não é rota implantada.
- Codex P2 PR #538 corrigido: primeiro reutilizar handoff persistido de mesmo proposalId/version, independentemente do cache com TTL. 122 testes Python OK; replay HTTP do mesmo recibo/SHA com 3 handoffs e sem duplicata.
- Backup local da instalação do Pet: /home/leo/.local/share/mcf-service-hub/backups/mcf-pet-live-20261117T033707Z/.

## Recuperação, isolamento e gates
- Não fazer fallback para neondb ou para o host de banco antigo com DNS inválido.
- Manter o histórico/snapshots Neon, sem exclusão automática da branch.
- O clonamento da parent inclui um snapshot do neondb; credenciais do estágio ficam limitadas ao banco novo. Para isolamento físico completo, reavaliar um projeto Neon exclusivo quando o plano permitir.
- Antes de ligar leitura canônica: reconciliar/validar PR #537 e #538, integrar em ordem seguindo a governança, fazer deploy apenas em staging, testar credencial só de leitura e prova negativa de dispatch.
- Antes de criação real: SessionAuthGuard e preflight v1.1 remoto com PIP e alinhamento verificados.
- Antes de execução reversível: prova verificável do PermissionEngine, gate de LÉO/HDF e auditoria. Nenhuma ferramenta executora foi liberada nesta recuperação.
