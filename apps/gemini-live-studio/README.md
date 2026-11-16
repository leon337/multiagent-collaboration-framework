# Gemini Live Studio · F1 / V1.1 (Audio Reliability)

> **Fase experimental isolada:** `MCF-GEMINI-LIVE-EVOLUTION-20261116-001 / PHASE-01-AUDIO-RELIABILITY`.
> **Não é release de produção, não substitui o runtime MCF.** Ver [Issue #527](https://github.com/leon337/multiagent-collaboration-framework/issues/527).

## O que existe no código

- Captura **AudioWorklet** PCM 16 kHz mono, blocos de 640 amostras / 40 ms, resampling contínuo 44,1/48 kHz → 16 kHz. Sem `ScriptProcessorNode`.
- VAD **automático no Gemini** por padrão com parâmetros configuráveis; modo alternativo com detecção local por RMS, pré-roll e eventos de atividade.
- Reação ao `interrupted` do servidor e ao indício local de fala (barge-in): interrompe reprodução pendente.
- Reprodução PCM 24 kHz ordenada e sem descarte do backlog; a interrupção só ocorre por evento confirmado ou ação explícita.
- Retomada quando o provedor fornece `sessionResumptionUpdate.newHandle`; reconexão limitada com backoff, proteção contra reenvio automático de turnos; eventos `GoAway` e `generationComplete`.
- Telemetria **só em memória**, whitelist de metadados, sem áudio ou tokens no dashboard.
- Mantém o servidor em `127.0.0.1`, `/api/token` efêmero e permissão do navegador para mídia.

## Executar localmente

Requer Node.js 24+, Chrome/Chromium com AudioWorklet e uma API key Gemini cadastrada localmente pela UI. Os testes automatizados sem rede não exigem chave.

```bash
cd apps/gemini-live-studio
PORT=18372 node server.js
```

Abra `http://127.0.0.1:18372`. O serviço original pode continuar em `18371`. A pasta `.private/` nunca deve ser incluída em Git, logs nem relatórios. **Não exponha este servidor ao público** sem identidade/TLS. A credencial anteriormente compartilhada foi explicitamente adiada pelo usuário e sua rotação continua pendente — isso não autoriza produção.

## Testes reproduzíveis

```bash
node --test tests/gemini-live-f1/capture-worklet.test.mjs tests/gemini-live-f1/telemetry.test.mjs
node --check apps/gemini-live-studio/public/app.js
```

O teste E2E opcional `tests/gemini-live-f1/browser-e2e.cjs` requer Puppeteer, Chrome, serviço local ativo e credencial local válida. Use `F1_STUDIO_URL` e `PUPPETEER_MODULE` para definir o ambiente. O teste usa **microfone e câmera virtuais e tela simulada**, não grava mídia pessoal.

## Limites conhecidos

- Sem benchmark estatístico de p95 com microfone/headset físico, rede degradada ou sessões de 10+ minutos; `GoAway` real de limite de conexão não foi observado no teste curto.
- A retomada por handle foi exercitada apenas como reconexão com handle disponível; equivalência integral do contexto anterior requer teste adicional.
- Interrupção de áudio local por RMS pode gerar falsos positivos; calibrar com eco real e perfis de dispositivo na F1.5.
- O modo de VAD local não é substituto de um detector treinado de fala. `silenceDurationMs` controla o modo automático no servidor.
- Chave persistente no armazenamento local ainda não está criptografada, autenticação local própria ausente; sem uso público.

## Governança

Este pacote de código acompanha a F1 em uma branch baseada na branch draft da F0. F0.8 permanece sem gate. Implementar e testar localmente **não equivale a liberar F1**. A promoção requer PRF, auditoria Emily e decisão LÉO; merge e deploy exigem autorização separada.

Hotfix de áudio F1: toda resposta é reproduzida na ordem recebida. Interrupção local imediata está desligada por padrão para evitar eco do alto-falante.
