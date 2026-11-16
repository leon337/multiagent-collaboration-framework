# MCF Pet MESTRE — conversação Gemini Live

Missão MCF-PET-GEMINI-LIVE-001. Integração local governada do Pet original com o MESTRE Agent, sem criar segundo agente. Fonte de verdade: leon337/multiagent-collaboration-framework.

## Arquitetura

O navegador no MCF Service Hub (127.0.0.1:8898 ou Tailscale HTTPS :8446) solicita um ticket HMAC de uso único e duração de 30 segundos com CSRF. O navegador abre WebSocket diretamente para o MESTRE Agent (127.0.0.1:8878 ou Tailscale WSS :8466), que reutiliza a chave Gemini do MESTRE e conecta ao modelo Gemini 3.8 Live. Entrada PCM16 16 kHz, saída PCM16 24 kHz e transcrições. As expressões do Pet original acompanham por UDP loopback 18765.

O novo endpoint NÃO declara ferramentas ao modelo, não pode controlar navegador, operar missões, aprovar HUMAN_GATE, executar comandos ou alterar MissionRuntime. Uso exclusivo da personalidade e do histórico SQLite do MESTRE Agent já instalado.

## Arquivos

- backend/pet_live_auth.py: ticket assinado, validação, expiração e prevenção de replay.
- backend/pet_live_ticket.py: verificação da rota segura e emissão de ticket.
- backend/pet_live_gateway.py: conexão bidirecional Gemini e segurança.
- frontend/pet-live.js e pet-live-worklet.js: captura por clique, resampling, WebSocket, áudio, transcrições e interrupção.
- frontend/pet-live.css: bloco visual responsivo.
- install_local.py: plano e instalação idempotente com backup e chave exclusiva 0600.
- tests/test_live_auth.py: testes de fronteira de autorização.

## Instalação

Executar python3 install_local.py --check para diagnóstico sem escrita e depois python3 install_local.py --apply apenas após validação. Reiniciar somente mestre-agent.service e mcf-service-hub.service e verificar os endpoints. A implantação local NÃO é promoção do MissionRuntime de produção. Nenhuma configuração de firewall ou Tailscale Serve é alterada.

## Uso e privacidade

Abra http://127.0.0.1:8898/#petLiveZone e clique Iniciar conversa contínua. Só então o navegador solicita o microfone; Encerrar ou mudar de aba interrompe a captura. Duração de até 5 minutos por sessão. O áudio da sessão é transmitido ao Google Gemini; a chave API nunca é enviada ao browser. Transcrições confirmadas são armazenadas no SQLite do MESTRE Agent existente. Áudio bruto não é persistido pelo Service Hub.

O backend aceita uma sessão Live por vez; origens estritamente allowlisted, ticket 30 segundos consumido uma vez, HMAC com chave exclusiva local 0600, limites para pacotes de áudio e rejeição de ferramentas. Custos e cotas Google se aplicam, sem rotação de chaves ou contorno de limites. Nenhuma escuta contínua ou wake word.

## Rollback

Backups em ~/.local/share/mcf-service-hub/backups/mcf-pet-live-<timestamp>/; restaurar somente arquivos alterados do backup verificado e reiniciar as duas unidades locais após confirmar que não houve outras alterações. Não alterar o ledger MCF nem deploy central. Testes e evidências são requisitos de merge e deploy.

## Correção de sessão de voz do Pet (2026-11-16)

A versão anterior criava a sessão do Pet somente no carregamento da página; o backend expira essa sessão em 3600 segundos e reinícios descartam sessões em memória. O navegador continuava usando o token expirado em /api/pet-voice/stt, recebendo HTTP 403 INVALID_SESSION.

Agora frontend/pet-conversation.js é parte versionada do pacote e da instalação reversível. A autenticação compartilhada renova a sessão antes da expiração ou, ao receber **exatamente** HTTP 403 INVALID_SESSION, faz uma renovação e **uma única repetição** do mesmo POST, incluindo o mesmo Blob de microfone ou request_id. Falhas de origem, rede, provedor, 429 e 5xx não são repetidas automaticamente. A mesma rotina atende transcrição, chat, TTS e estado do Pet, preservando CSRF/cookie e limites existentes. Sem microfone contínuo nem ferramentas adicionais.

Validar com node --test frontend/pet-session-recovery.test.mjs, testes Python e Playwright com página previamente carregada e servidor reiniciado. Correção restrita ao painel; o MissionRuntime permanece intocado. python3 install_local.py --apply guarda backup antes de instalar.
