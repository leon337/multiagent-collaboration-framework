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

## Correção multissessão e observabilidade do Pet (2026-11-16)

Motivação: duas abas da Central MCF sobrescreviam o mesmo cookie HttpOnly. O modo Gemini Live usava o token antigo diretamente ao solicitar um ticket e exibia "Gemini Live está indisponível" mesmo com o modelo saudável. O modo de conversa por turnos também podia exibir "Sessão inválida" sob concorrência entre abas.

Correção:
- Cada instância da página gera identificador aleatório de aba (hexadecimal, 32 caracteres, não persistido). Um cookie HttpOnly mcfpet_tab_<id> fica isolado do restante das abas, mantendo SameSite=Strict, CSRF e validação de origem. O cookie legado mcfpet_session continua compatível até que abas antigas sejam recarregadas.
- GET /api/pet-voice/session recebe X-MCF-Pet-Tab e emite cookie com nome segregado; endpoints autenticam pelo par cookie+CSRF+id da aba, sem enfraquecer autorização.
- Gemini Live obtém ticket e envia estados usando window.McfPetAuth.request, a mesma renovação segura por 403 INVALID_SESSION, sem repetição em falhas de rede, 429/5xx ou Origin inválida.
- O Pet pode ser iniciado pelo desktop em vez do systemd. A observabilidade reconhece somente o processo que combina UID local, executável autorizado, caminho exato do script, PID do arquivo 0600, telemetria recente e UDP loopback. A interface informa "Pet aberto manualmente" quando systemd está inativo, sem criar segundo mascote nem encerrar processo legítimo.
- O código de observação continua somente leitura; não captura transcrições ou áudio.

Verificações: 48 testes Python do pacote, 5 testes JS de renovação e Playwright real com duas abas: cookies diferentes, ambos POST de estado HTTP 200, Gemini Live ticket HTTP 200 com áudio, segunda aba continua autorizada e microfone liberado ao encerrar. Chat clássico com outra aba aberta também respondeu HTTP 200 e não apresentou falha de sessão.

Deploy/rollback: instalador python3 install_local.py --apply guarda backup de arquivos tocados em ~/.local/share/mcf-service-hub/backups/mcf-pet-live-<timestamp>/. Nesta correção reiniciou-se apenas Service Hub, sem alterar MissionRuntime, credenciais Google, rede ou outros serviços.

Gates externos: testes automatizados usam microfone simulado; a conversa física com LEANDRO no Brave real não foi reexecutada. A rota Tailscale remota pelo celular continua sem verificação externa.
