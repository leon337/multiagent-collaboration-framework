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
