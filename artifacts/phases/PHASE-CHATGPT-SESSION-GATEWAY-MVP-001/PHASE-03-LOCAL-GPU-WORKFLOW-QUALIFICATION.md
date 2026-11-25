# PHASE-03 — Qualificação local com GPU e workflows

**Missão:** `MCF-CHATGPT-SESSION-GATEWAY-MVP-001`
**Data:** 2026-11-13 (America/Recife)
**Classificação:** EXPERIMENTAL / host local autorizado / sem deploy
**Autoridade:** LEANDRO autorizou continuidade, testes e uso da GPU; MESTRE orquestrou.
**PR principal:** https://github.com/leon337/multiagent-collaboration-framework/pull/520
**PR da correção:** https://github.com/leon337/mcf-dual-browser-cockpit/pull/28

## Hardware qualificado

- Host Linux Ubuntu, AMD Radeon RX 580 2048SP (Mesa radeonsi/RADV), 28 threads lógicas, 15 GiB RAM.
- `DISPLAY=:0 glxinfo -B`: renderização direta `Yes`, renderer AMD Radeon RX 580 2048SP, GL 4.6.
- `vulkaninfo --summary`: driver RADV / GPU AMD reconhecido (também listou llvmpipe como software separado).
- `EGL_PLATFORM=surfaceless python3 /tmp/mcf_amd_gpu_smoke_20261113.py`: contexto EGL 1.5/GLES 3.2 em renderer AMD, clear RGBA + glReadPixels `[51,102,153,255]`, `GL_ERROR=0x0`, **GPU_HARDWARE_OFFSCREEN_SMOKE=PASS**.
- O smoke acima executou trabalho gráfico real na AMD. Não representa aceleração da suíte Node.js, que permanece CPU-bound.

## Workflows locais

- `node --test tools/mcf-chatgpt-session-gateway/test/*.test.mjs`: **12/12 PASS**.
- `node .github/scripts/mcf-gui-window-control-qualification.mjs`: **PASS**.
- `node .github/scripts/mcf-gui-window-postmerge-consistency.mjs`: **PASS**.
- Cockpit v0.7.5+fix, `npm test` (inclui `npm run check`): **126/126 PASS**.
- Cockpit `test/electron-smoke.py` executado como app-fonte com Electron 44.2.0 sob Xvfb e `XDG_CONFIG_HOME` temporário: **PASS** duas instâncias, bridges isolados, bloqueio duplicado, filtro de senha, persistência e restauração após reinício.
- Primeira tentativa de smoke falhou por invocação de teste incorreta: `MCF_TEST_BINARY` foi configurado para o binário genérico Electron, sem caminho do projeto. O comando foi corrigido para `xvfb-run ... python3 test/electron-smoke.py` sem essa variável e passou.
- Importante: smoke Electron sob Xvfb **não utilizou comprovadamente a GPU AMD**. O hardware AMD foi validado separadamente por EGL e GLX.

## Erro adicional identificado e tratado

- Log de teardown em Xvfb registrou `Render frame was disposed before WebFrameMain could be accessed` em emissão de evento do renderer; outro aviso `GPU process isn't usable` surgiu no encerramento da tela virtual.
- Proteção adicionada no Cockpit: `safeRendererEventSend` suprime apenas perda de evento UI por frame/WebContents descartado; mantém exceção para erros inesperados. Quatro novos testes específicos.
- Fix incremental publicado na PR #28, commit GitHub `caddcc26e617fda677b860d1131eb727fdc7359c`. A PR segue draft, não mergeada.

## Escopo e limitações

- Trabalho executado no notebook do usuário; os processos gráficos de teste usaram perfil efêmero, sem tocar nas sessões autenticadas existentes.
- Nenhuma missão cognitiva real foi reenviada nesta fase; **Gateway → Agent Session → resposta canônica com receipt do MissionRuntime** permanece não qualificado.
- Não executamos benchmark de treinamento de modelos/IA na GPU, pois não existe workload de inferência/treinamento neste MVP.
- Nenhuma mudança em produção, merge, instalação, configuração global de GPU ou publicação de segredos.
- Próximos gates: validar build corrigido com autenticação de teste e semântica de response/receipt, auditoria independente e revisão de merge.

- Teste GPU reproduzível versionado em `tools/mcf-chatgpt-session-gateway/scripts/gpu-smoke-linux.py`, acionado opcionalmente por `npm run smoke:gpu-linux`.
