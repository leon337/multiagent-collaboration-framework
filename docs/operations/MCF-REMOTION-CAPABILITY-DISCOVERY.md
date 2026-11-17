# MCF — Descoberta e reconciliação Remotion / Gemini

**Situação:** EXPERIMENTAL, DISCOVERABLE, LOCAL_VERIFIED. PR #543. A descoberta no GitHub NÃO instala um plugin do ChatGPT e NÃO concede permissões de escrita no MissionRuntime.

## Fontes e SHAs observados em 17/11/2026

| Papel | Repositório | SHA de referência | Visibilidade / observação |
|---|---|---|---|
| Governança | https://github.com/leon337/multiagent-collaboration-framework | branch feat/mcf-remotion-video-engine-f4, PR #543 | Candidato; main não alterada |
| Composições | https://github.com/leon337/mcf-remotion-studio | main 433b9f75a0eeb70eaafa40f64310475101373e04 | PRIVATE; mesmo SHA no desktop e no GitHub |
| Worker MCP e Gemini | https://github.com/leon337/mcf-remotion-mcp | main 9b456ec95d16f42bb719734873f5f6343bb67e2 | PRIVATE; mesmo SHA no desktop e no GitHub |

As referências acima são um snapshot verificável, não um estado futuro garantido. Consultar GitHub ao vivo e confirmar permissões de acesso aos repositórios privados em cada sessão.

## Como o MESTRE ChatGPT deve descobrir a capacidade

1. Ler AGENTS.md do repositório oficial e verificar GitHub ao vivo.
2. Encontrar MCF-REMOTION-VIDEO-PRODUCE no catálogo skills/registry.yaml e abrir skills/video/mcf-remotion-produce/SKILL.md.
3. Ler context/capabilities/remotion-video-engine-local.yaml. Distinguir allowed_operations de candidate_write_operations e verificar o estado de conexão e o gate HDF.
4. No computador autorizado realmente ONLINE, executar uma inspeção read-only: systemctl --user is-active remotion-mcp.service; abrir localhost:4777/health; no checkout MCF com dependências instaladas, executar npm run discover na pasta tools/remotion-mcf-adapter. O diagnóstico não imprime token nem chave API.
5. No mesmo diretório do adaptador, executar npm run reconcile para conferir os três origin remotos sem fetch, checkout ou alteração de arquivos. Divergências exigem comparação, nunca reset automático. Checar se o Studio localhost:3001 está ativo, quais ferramentas MCP estão anunciadas, disco, acesso ao modelo e hardware. Só criar projeto, sintetizar voz ou renderizar quando a autorização para ações com efeito cobrir o escopo. No runtime central, escrita continua bloqueada sem HDF.
6. Para um vídeo autorizado, usar remotion_enqueue_job com idempotencyKey e voiceTrackId; acompanhar remotion_job_status; verificar checksum, streams de vídeo/áudio, resolução e duração do arquivo.

## Fronteiras da recuperação em outro computador

GitHub privado guarda código e assets versionados, mas NÃO guarda:
- remotion-mcp/.secrets/mcp-token;
- ~/.config/remotion-mcp/gemini_api_key (arquivo/symlink local com permissão 0600);
- remotion-mcp/data/queue.sqlite, voice-quota.json e histórico dos jobs;
- remotion-mcp/projects e remotion-mcp/outputs; arquivos ~/Vídeos;
- binário VA-API isolado em remotion-mcp/vendor/ffmpeg;
- serviços systemd locais e configurações privadas de Chromium/driver.

Portabilidade verificável exige: clonar os dois privados com GitHub autorizado, npm ci em Studio e MCP, Node, Chromium/Remotion, FFmpeg com suporte VA-API caso o host tenha GPU compatível, verificar permissões de /dev/dri/renderD128 e provisionar credenciais por caminho privado em cada máquina. Para reproduzir trabalhos antigos é necessário backup seguro separado de projetos e banco. O uso de outra máquina não deve presumir Radeon RX 580, host leo-N43SM ou UID 1000.

Portas locais existentes no host de prova: 127.0.0.1:4777/mcp (Bearer token), 127.0.0.1:4777/health (somente leitura) e 127.0.0.1:3001 (Studio). Não são URLs remotas públicas.

## Capacidade funcional comprovada

- Gemini Live: gemini-2.5-flash-native-audio-preview-12-2025, voz Charon em português do Brasil.
- Alternative Gemini TTS no catálogo, ainda NÃO validada.
- 14 ferramentas MCP declaradas, inclusive remotion_voice_providers, remotion_voice_synthesize e remotion_voice_build_track.
- Render: pipeline Remotion -> JPEG -> FFmpeg AMD VA-API -> H.264 + mux áudio AAC.
- Evidência local: vídeo mcf-cinematic-gemini-003, 42,00s, 1260 quadros, 720x1280, áudio estéreo. Job c80ca8fa-c61d-42cf-ab6a-306a8e2b37ff, SHA256 fdc2be341094a75f4bc20ba05e74204142214a963e15e1838044bcdd04fd713e.

## Gate ainda não finalizado

Este incremento cria descoberta por documentação e uma skill EXPERIMENTAL. NÃO modifica o tipo executável McfExecutableSkillId nem conecta o PermissionEngine/ExternalActionDispatcher à escrita. O adapter MCF continua fail-closed sem HDF. A conexão nativa do ChatGPT a um servidor MCP remoto continua NÃO configurada. Para concluir a F4 governada, exigir revisão independente, provas de permissão/autorização e integração no runtime real. Não realizar merge/deploy apenas porque o GitHub tem arquivos.

## Critérios da reconciliação

- Paridade de commits remoto/local comprovada para Studio e MCP nos SHAs acima;
- Nenhuma pasta .secrets, chave Gemini, SQLite, outputs ou token rastreada pelo Git;
- Repositórios privados; não pressupor acesso irrestrito;
- Skill e manifesto oficiais encontrados a partir de AGENTS.md;
- Testes de discovery read-only e falha segura; health e listagem de modelos testados no host;
- Código, estado operacional e permissões descritos separadamente para evitar falsa conclusão de portabilidade completa.
