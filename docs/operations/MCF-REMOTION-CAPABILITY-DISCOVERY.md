# MCF — Descoberta e reconciliação Remotion / Gemini

**Situação:** EXPERIMENTAL, DISCOVERABLE, LOCAL_VERIFIED; runner privado ONLINE; MissionRuntime ainda não executa operações de escrita. O PR #543 foi MERGED em `main` no SHA `97d79ee8152ead27564d2bf634ad63df5cc284e6`. A descoberta no GitHub NÃO instala um plugin do ChatGPT e NÃO concede permissões de escrita no MissionRuntime.

## Fontes e SHAs observados em 17/11/2026

| Papel | Repositório | SHA de referência | Visibilidade / observação |
|---|---|---|---|
| Governança | https://github.com/leon337/multiagent-collaboration-framework | main `97d79ee8152ead27564d2bf634ad63df5cc284e6` | PUBLIC; PR #543 merged |
| Composições | https://github.com/leon337/mcf-remotion-studio | main `433b9f75a0eeb70eaafa40f64310475101373e04` | PRIVATE; mesmo SHA no desktop e no GitHub |
| Worker MCP e Gemini | https://github.com/leon337/mcf-remotion-mcp | main `9b456ec95d16f42bb719734873f5f6343bb67e2e` | PRIVATE; mesmo SHA no desktop e no GitHub |
| Worker runner | https://github.com/leon337/mcf-remotion-mcp | runner ID `2`, `leo-N43SM-remotion-gpu` | PRIVATE; ONLINE observado às 05:45:46Z |

As referências acima são um snapshot verificável, não um estado futuro garantido. Consultar GitHub ao vivo e confirmar permissões de acesso aos repositórios privados em cada sessão.

## Como o MESTRE ChatGPT deve descobrir a capacidade

1. Ler `AGENTS.md` do repositório oficial e verificar GitHub ao vivo.
2. Encontrar `MCF-REMOTION-VIDEO-PRODUCE` no catálogo de skills e abrir `skills/video/MCF-REMOTION-VIDEO-PRODUCE.yaml`.
3. Ler `context/capabilities/remotion-video-engine-local.yaml` e `docs/operations/MCF-REMOTION-GPU-WORKER.md`. Distinguir `allowed_operations` de `candidate_write_operations`, runner online de runtime executável e verificar o gate HDF.
4. Consultar, com credencial GitHub autorizada, `GET /repos/leon337/mcf-remotion-mcp/actions/runners`. Confirmar repositório PRIVATE, runner ID/nome/labels/status e horário de observação. Sem acesso ao privado, estado é `PRIVATE_DEPENDENCY_UNAVAILABLE` ou `UNKNOWN`, não presumir online/offline.
5. No computador autorizado realmente ONLINE, executar inspeção read-only: `systemctl --user is-active remotion-mcp.service`; abrir `localhost:4777/health); no checkout MCF com dependências instaladas, executar `npm run discover` em `tools/remotion-mcf-adapter`. O diagnóstico não imprime token nem chave API.
6. Conferir separadamente composição por GPU e codificação: o estado atual desativa aceleração de hardware do Chrome/Remotion (`--hardware-acceleration=disable`) e reporta WebGL/WebGPU desativados; FFmpeg anuncia `h264_vaapi` e `hevc_vaapi`, e jobs anteriores registraram encoder `vaapi`. Isso comprova codificação VA-API, não renderização de frames por GPU.
7. O workflow privado de health check está proposto no PR #1 do repositório worker. Só disparar depois que o workflow existir em `main`, por `workflow_dispatch` e branch `main`. Ele é read-only, sem checkout, inputs, secrets, render ou quota Gemini.
8. No mesmo diretório do adaptador, executar `npm run reconcile` para conferir os três origin remotos sem fetch, checkout ou alteração de arquivos. Divergências exigem comparação, nunca reset automático. Checar se o Studio localhost:3001 está ativo, ferramentas MCP anunciadas, disco e disponibilidade de voz. Só criar projeto, sintetizar voz ou renderizar quando a autorização para ações com efeito cobrir o escopo. No runtime central, escrita continua bloqueada sem HDF.
9. Para um vídeo autorizado, usar `remotion_enqueue_job` com `idempotencyKey` e `voiceTrackId`; acompanhar `remotion_job_status`; verificar checksum, streams de vídeo/áudio, resolução e duração do arquivo.

## Runner privado — escopo e segurança

- Runner self-hosted registrado exclusivamente no repositório privado `leon337/mcf-remotion-mcp`; nunca no repositório público MCF.
- Nome `leo-N43SM-remotion-gpu`, ID `2`, versão `2.338.2`; labels `mcf-remotion-gpu`, `amd-rx580`, `remotion` e labels padrão.
- Serviço `systemd --user` enabled; `Linger=yes` confirmado.
- O processo roda como usuário Linux `leo`, não como conta de sistema isolada. Não é sandbox e herda as permissões desse usuário.
- No registro observado, apenas `leon337` era colaborador do repositório privado. A API de branch protection respondeu HTTP 403: plano atual não habilita proteção de branch para este repositório privado.
- Até existir isolamento por conta dedicada, workflows devem ser somente `workflow_dispatch` no branch `main`, sem gatilhos de PR/terceiros, sem inputs de shell/path/comandos, sem secrets nos logs e com permissões mínimas.
- O workflow de health check está em PR privado #1 (DRAFT); ainda não existe execução GitHub Actions comprovada. Runner ONLINE via API não é o mesmo que workflow E2E concluído.

**Nunca instalar ou registrar esse runner no repositório público MCF.** O repositório público contém somente o conhecimento, o contrato e a governança para descoberta reutilizável. Outros chats só podem operar o worker se tiverem acesso GitHub autorizado ao repositório privado e acesso real ao host autorizado.

## Fronteiras da recuperação em outro computador

GitHub privado guarda código e assets versionados, mas NÃO guarda:
- `remotion-mcp/.secrets/mcp-token`;
- `~/.config/remotion-mcp/gemini_api_key` (arquivo/symlink local com permissão 0600);
- `remotion-mcp/data/queue.sqlite`, `voice-quota.json` e histórico dos jobs;
- `remotion-mcp/projects` e `remotion-mcp/outputs`; arquivos `~/Vídeos`;
- binário VA-API isolado em `remotion-mcp/vendor/ffmpeg`;
- serviços systemd locais e configurações privadas de Chromium/driver.

Portabilidade verificável exige: clonar os dois privados com GitHub autorizado, `npm ci` em Studio e MCP, Node, Chromium/Remotion, FFmpeg com suporte VA-API caso o host tenha GPU compatível, verificar permissões de `/dev/dri/renderD128` e provisionar credenciais por caminho privado em cada máquina. Para reproduzir trabalhos antigos é necessário backup seguro separado de projetos e banco. O uso de outra máquina não deve presumir Radeon RX 580, host leo-N43SM ou UID 1000.

Portas locais existentes no host de prova: `127.0.0.1:4777/mcp` (Bearer token), `127.0.0.1:4777/health` (somente leitura) e `127.0.0.1:3001` (Studio). Não são URLs remotas públicas.

## Capacidade funcional comprovada

- Gemini Live: `gemini-2.5-flash-native-audio-preview-12-2025`, voz Charon em português do Brasil.
- Alternative Gemini TTS no catálogo, ainda NÃO validada.
- 14 ferramentas MCP declaradas, inclusive `remotion_voice_providers`, `remotion_voice_synthesize` e `remotion_voice_build_track`.
- Pipeline de saída: Remotion -> JPEG -> FFmpeg AMD VA-API -> H.264 + mux áudio AAC. A codificação é acelerada; a composição de frames permanece software no perfil atual.
- Evidência local: vídeo `mcf-cinematic-gemini-003`, 42,00s, 1260 quadros, 720x1280, áudio estéreo. Job `c80ca8fa-c61d-42cf-ab6a-306a8e2b37ff`, SHA256 `fdc2be341094a75f4bc20ba05e74204142214a963e15e1838044bcdd04fd713e`.

## Gate ainda não finalizado

Este incremento cria descoberta documental e uma skill EXPERIMENTAL. O runner privado adiciona capacidade de execução de workflow, mas NÃO conecta as operações de escrita ao `ExternalActionDispatcher`. O adapter MCF continua fail-closed sem HDF. A conexão nativa do ChatGPT a um servidor MCP remoto continua NÃO configurada. Para concluir a F4 governada, exigir adapter no MissionRuntime, revisão independente, provas de autorização, idempotência/reconciliação/receipts e gates de produção aplicáveis. Não realizar merge/deploy apenas porque o runner está online ou há arquivos no GitHub.

## Critérios da reconciliação

- Paridade de commits remoto/local comprovada para Studio e MCP nos SHAs atuais;
- Nenhuma pasta `.secrets`, chave Gemini, SQLite, outputs ou token rastreada pelo Git;
- Repositórios worker/Studio privados; não presumir acesso irrestrito;
- Runner privado confirmado via API, sem registro no repositório público;
- Skill e manifesto oficiais encontrados a partir de `AGENTS.md`;
- Discovery read-only e health local verificados;
- Workflow de health só conta como E2E depois de execução bem-sucedida na `main`;
- Código, estado operacional e permissões descritos separadamente para evitar falsa conclusão de portabilidade ou runtime completo.
