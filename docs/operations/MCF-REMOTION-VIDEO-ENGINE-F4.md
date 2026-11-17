# MCF — Remotion Video Engine F4 (candidate)

## Missão

Integrar uma engine de vídeo local GPU AMD através do MCP sem criar runtime paralelo nem contornar autorização humana.

## Escopo entregue

- F2: fila SQLite durável, IDs UUID, idempotência, cancelamento e revisão do projeto.
- F3: renderização gráfica ANGLE e codificação AMD VA-API usando FFmpeg Ubuntu isolado.
- F4: adapter local de leitura no MCF, negação explícita de escrita sem HDF/PermissionEngine, recibos com SHA-256, ferramenta MCP validada via smoke.
- Acesso: localhost e token 0600. Não existe exposição remota oficial a esta engine nesta fase.
- Vídeo de prova: `primeiro-video-mcf`, 720×1280, 8s, 240 frames, SHA-256 `546e053909d78106750b4acaab5b6459ce17aa325819890fad0e82b7f71790c5`.

## Limites

O adapter não foi registrado no ExternalActionDispatcher de produção. A conexão direta entre a conta ChatGPT e o MCP local não foi configurada; ações do MESTRE neste teste usaram a conexão Remote Desktop Commander como transporte de controle. A interface local tem biblioteca de reprodução e o arquivo MP4 permanece na máquina.

## Critérios para a promoção

1. Integrar adapter ao ExternalActionDispatcher/SkillRegistryLoader no runtime central de forma nativa e versionada.
2. Exigir autorização canônica e validação real do PermissionEngine para operações com efeitos; não aceitar booleanos fornecidos pelo modelo.
3. E2E de tentativa de escrita sem gate, gate inválido, idempotência após timeout, cancelamento, retomada e recibo íntegro.
4. PR e revisão independente, sem merge/deploy automático.

## Demonstração 002 — composição cinematográfica com áudio (2026-11-17)

A engine local demonstrou `CinematicMCF`: vídeo vertical de 30 segundos, 900 quadros, 720×1280, H.264 High (AMD VA-API), áudio AAC-LC estéreo e trilha musical original com narração neural pt-BR. A renderização foi submetida por cliente MCP moderno e persistida na fila SQLite.

- Projeto: `mcf-cinematic-002`
- Job: `3ee28041-1f1a-4f56-9a5a-e3a4ae2b948b`
- Estado: `completed`, 100%, 1 tentativa
- SHA-256: `e6c04091eab40300f86a5ab9b240dc85b4da33c873c28788d8eb53794c3b6634`
- Arquivo local: `~/Vídeos/MCF_Cinematic_002_30s_Narrado.mp4`
- Verificação: ffprobe confirmou quadros, duração, dois fluxos e a decodificação completa por FFmpeg passou sem erros; inspeção visual de seis cenas concluída

Isto é **evidência do worker local**, não prova de registro como ferramenta nativa do ChatGPT nem de autorização de escrita pelo PermissionEngine do MCF central. O PR continua em draft.

## Gemini Native Audio Dialog — provedor adicional (2026-11-17)

- Modelo Live: gemini-2.5-flash-native-audio-preview-12-2025.
- Credencial: arquivo local com permissao 0600, somente no host, nunca adicionado ao repositorio.
- Capacidade local: geracao de clipes WAV 24 kHz com voz pt-BR, transcricao de saida, composicao de trilha WAV com timestamps e fundo musical original; fila de renderizacao aceita voiceTrackId pinado em hash.
- MCP: remotion_voice_providers (leitura), remotion_voice_synthesize e remotion_voice_build_track (escrita e consumo de API).
- Gates: no adaptador MCF, ferramentas de voz com efeitos permanecem BLOQUEADAS sem PermissionEngine/HDF. Nenhum deploy, registro em producao ou liberacao remota e implicito.
- O modelo Live e generativo: transcricoes devem ser comparadas com o roteiro. Para leitura estritamente literal, avaliar Flash TTS separadamente.
- Um teste E2E local autenticado ja substituiu audio de um MP4 pelo Gemini com VA-API, preservando hashes e jobs.
