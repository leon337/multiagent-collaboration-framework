---
name: mcf-remotion-produce
description: Descobre e orienta o uso governado da infraestrutura local de vídeos Remotion com renderização AMD VA-API e narração Gemini 2.5 Flash Native Audio Dialog.
whenToUse: Quando LEANDRO solicitar vídeo, conteúdo animado, narração Gemini, Remotion Studio, GPU AMD, F2/F3/F4 ou continuidade da produção de vídeos do MCF.
metadata:
  mcf_skill_id: MCF-REMOTION-VIDEO-PRODUCE
  version: 0.1.0
  owner: Mestre
  status: EXPERIMENTAL
  risk_class: SCOPED_EXTERNAL_EFFECTS
user-invocable: true
disable-model-invocation: false
---

# MCF — Remotion Video Engine / Discovery

Contrato documental de descoberta. A presença desta skill no GitHub NÃO significa que o ChatGPT instalou um plugin, que uma sessão possui acesso direto à engine ou que a skill está habilitada como executável no MissionRuntime.

## Rota para qualquer sessão do MESTRE

1. Consultar o GitHub AO VIVO: leon337/multiagent-collaboration-framework, ler AGENTS.md, verificar SHA de main, branch e PR #543.
2. Localizar a capability context/capabilities/remotion-video-engine-local.yaml e a documentação docs/operations/MCF-REMOTION-CAPABILITY-DISCOVERY.md. Verificar também o registro EXPERIMENTAL em skills/registry.yaml.
3. Consultar os dois repositórios PRIVADOS, desde que o GitHub conectado tenha acesso: leon337/mcf-remotion-mcp (worker e Gemini) e leon337/mcf-remotion-studio (templates React e áudio original). Conferir commits remotos, locais e alterações pendentes com npm run reconcile no adapter; nunca reset/force-push automaticamente.
4. Selecionar máquina por ID real e estado ONLINE via Remote Desktop Commander; hostname sozinho é insuficiente. Na máquina verificada, consultar systemctl --user is-active remotion-mcp.service, http://127.0.0.1:4777/health e executar npm run discover na pasta tools/remotion-mcf-adapter do checkout oficial. O Studio usa localhost:3001.
5. Para criar vídeo autorizado: identificar briefing e roteiro, verificar API/quota de voz, escolher o template, gerar clipes WAV, montar voiceTrackId, submeter remotion_enqueue_job com idempotencyKey, consultar remotion_job_status e validar MP4 (ffprobe/FFmpeg, duração, trilhas, SHA-256).
6. Escrita pelo adapter do MissionRuntime central está BLOQUEADA sem PermissionEngine/HDF canônico. Autorização de LEANDRO para operação local via Desktop Commander não ativa automaticamente a escrita no runtime central. Sem ferramenta, host ou gate, apenas descrever plano: não alegar execução.
7. Não publicar chaves/tokens, não abrir a porta 4777 na Internet, não efetuar merge/deploy de produção por descoberta e não supor que o modelo Live respeita o roteiro literalmente. Revisar transcrição.

## Tool catalog (conferir em runtime)

Somente leitura: remotion_health, remotion_list_compositions, remotion_get_project, remotion_job_status, remotion_list_jobs, remotion_voice_providers.

Efeitos/execução: remotion_create_project, remotion_edit_scene, remotion_preview, remotion_render, remotion_enqueue_job, remotion_cancel_job, remotion_voice_synthesize, remotion_voice_build_track.

Modelo testado localmente: gemini-2.5-flash-native-audio-preview-12-2025, Charon em pt-BR. Alternativa gemini-2.5-flash-preview-tts cadastrada, mas NÃO validada. A API pode gerar cobrança.

## Portabilidade e limites

Git contém código, composições e audios versionados; NÃO contém o token MCP, chave Gemini, SQLite, projetos locais, vídeos MP4 ou FFmpeg VA-API instalado. A máquina de destino exige verificação real de GPU/driver/dispositivos, Node/npm, Chromium e credenciais configuradas de modo seguro.

Evidência MCF: https://github.com/leon337/multiagent-collaboration-framework/pull/543
Repositórios privados: https://github.com/leon337/mcf-remotion-mcp e https://github.com/leon337/mcf-remotion-studio.
