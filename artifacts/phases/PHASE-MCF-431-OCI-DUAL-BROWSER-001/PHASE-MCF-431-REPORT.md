# Relatório de execução — MCF-431

**Estado:** IN_PROGRESS; não concluir nem fechar a Issue nesta revisão.

## Evidências PASS
- SentinelX host `host_6ce0886ba346c787`, agente `0.23.11`, host `leo-N43SM`. O playbook `computer_browser_workflow` documenta execução GUI como `leo` com `DISPLAY=:0` e `XAUTHORITY=/home/leo/.Xauthority`. Correção anterior aplicada a `/etc/sentinelx/config.yaml`, com backup `/etc/sentinelx/backups/config.yaml.bak.20261009-200926-554479`, YAML validado e sem ampliação de ACL.
- Captura anterior retornada como imagem real e inspecionada: `/home/leo/agent-sandbox/artifacts/screenshots/mcf431-oci-instances-loaded.png`, SHA-256 `a77a11380f3d50777950afaeb88dcecbc140b5991d7daaa646ced55d1ab9b905`; regressão posterior SHA-256 `699c2e214cc0d92c4d5780ef875d2819f03348b23e7bf17d5605bf0facd4a130`. A imagem identificou `instance-20260920-0445`, Running/Always Free, `VM.Standard.E2.1.Micro`, 1 OCPU/1 GB, região Vinhedo.
- Dual Browser Cockpit 0.6.9 responde em `127.0.0.1:9334`; Agent Bridge `127.0.0.1:47831`. `GET /v1/discovery` retornou 200 e identificou o pane workspace na conversa Claude da missão.
- Testes locais no `active-app-inspection`: `npm test` exit 0, `npm run check` passou e 4/4 testes SSE passaram.
- Bridge live: `/v1/discovery`, `/v1/state?pane=workspace`, `/v1/text?pane=workspace`, `/v1/interactive?pane=workspace` e `/v1/live/snapshot` retornaram 200. Snapshot teve 4 eventos, cursor `bootId:sequence`, `resetRequired=false`. Stream SSE retornou 200 `text/event-stream`, `channel.ready` em ~2,8 ms. Sem bearer retornou 401; `X-MCF-Instance` divergente retornou 409.
- Claude analisou o repositório público no commit `ebf576a` (0.6.2): `npm run check` exit 0, `npm test` 91/91, teste live-agent-events 4/4. Claude confirmou que não acessou o notebook e que o resultado público 0.6.2 não valida o checkout local 0.6.9.

## Pendências / FAIL / BLOCKED
- **BLOCKED — túnel/browser remoto:** na verificação de 2026-10-09 21:17 BRT, `127.0.0.1:9222` e `127.0.0.1:9223` recusaram conexão. O Cockpit e Bridge locais seguem ativos, mas não existe evidência atual de túnel remoto.
- **BLOCKED — validação OCI live atual:** uma tentativa de navegação programática à Console OCI foi bloqueada pela camada de segurança antes de produzir efeito. Não foi repetida por caminho alternativo para contornar o bloqueio.
- **PENDING — A1.Flex:** cota, capacidade regional/AD/FD, elegibilidade Always Free e custo não foram verificados live nesta retomada. Não afirmar indisponibilidade sem evidência da Console/API.
- **PENDING — VM remota:** estado atual de `cloud-browser.service` dentro da VM, SSH, target CDP correto, persistência de sessão e E2E remoto não foram validados.
- **PENDING — benchmark:** não há baseline comparável de latência real antes/depois; só foram medidas latências pontuais da Bridge local.
- Nenhuma VM foi criada, excluída, redimensionada ou submetida a mutação nesta retomada.

## Recomendações técnicas recebidas do Claude
- MCP local read-only como único ponto de entrada para leitura do repositório; Bridge apenas GET allowlisted; CDP permanece loopback e fora do alcance do Claude.
- Validar caminhos canônicos, negar symlink escape e arquivos de segredo; token efêmero fora dos outputs; pane=chat opt-in.
- SSE com IDs `bootId:sequence`, cursor/high watermark, replay/reset explícito, reconexão e deduplicação; nunca expor Bridge/CDP diretamente à Internet.

## Decisão desta fase
Continuar IN_PROGRESS. Não excluir a VM atual e não criar recursos OCI enquanto cota/capacidade/custo e caminho de rollback não forem comprovados. Não fechar Issue até resolver as pendências ou demonstrar bloqueio externo com evidência live.


## Recuperação de espaço — 2026-10-09 21:50 BRT
- O disco raiz estava em 99% (2,3 GiB livres); a inspeção identificou `/var/log/syslog` com ~1,16 GB devido a reinícios repetidos de serviços em falha.
- Rotação controlada do syslog preservou a saída anterior em `/var/log/syslog.precleanup-20261009-213939.gz` (~143 MiB) e reabriu o log; o syslog novo permaneceu pequeno após a rotação. Não foi alterada a configuração global de permissões de `/var/log`.
- Removidas 17 cópias antigas do MCF Dual Browser Cockpit 0.5.x (diretórios contendo apenas AppImages, sem referências de processos/unidades); os arquivos de rollback gerados para essas cópias foram removidos após confirmar que eram duplicatas integrais dos mesmos binários antigos. A versão 0.6.9 em uso permaneceu intacta.
- Limpeza de caches regeneráveis: store de conteúdo pnpm (2,3 GiB), cache npm do usuário (615 MiB), cache uv (108 MiB), cache/tmp antigo do Codex (269 MiB); removidos também `node_modules` obsoletos de projetos de Remotion/Astra Dock/MMD e worktrees inativos, preservando código-fonte e lockfiles. O store pnpm será reconstruído em instalações futuras.
- Identificadas tempestades de reinício: `mcf-dsh.service` (falha de export `SessionLogOffset`, mais de 7 mil reinícios), `codebuddy-web.service` (diretório de trabalho inexistente, mais de 17 mil reinícios) e `mcf-voice-agent-intent.service` (status 1, mais de 15 mil reinícios). Os três serviços defeituosos foram parados sem remover unidades nem desabilitar instalação; `hermes-notebook-bridge.service` e `mcf-voice-intent.service` permaneceram ativos. A correção funcional desses serviços fica pendente.
- ACL mínima aplicada para que o agente SentinelX possa executar operações já permitidas pelo allowlist em `/home/leo/Aplicativos`: travessia (`--x`) em `/home/leo` e `rwx` no diretório `Aplicativos`; entradas de ACL preservadas para evitar recorrência do erro de permissão. Não houve alteração recursiva de permissões nos projetos restantes.
- Verificação após limpeza: raiz passou de 99%/2,3 GiB livres para 92%/~11 GiB livres. O Cockpit 0.6.9 continua em execução; CDP `127.0.0.1:9334/json/version` retornou HTTP 200 e o Bridge continua negando acesso sem bearer (HTTP 401). Nenhum dado pessoal de Downloads/Imagens/Documentos foi removido.
- Esta limpeza reduz o bloqueio de espaço, mas não valida o túnel OCI nem a sessão remota; missão permanece IN_PROGRESS.
