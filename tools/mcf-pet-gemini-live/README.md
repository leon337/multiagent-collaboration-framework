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


## MCF Pet tools READ_ONLY — 2026-11-16

This is a governed extension of the existing MESTRE Agent and Pet. It does not
create a new agent, bypass MissionRuntime or authorize privileged operations.
Official sources: AGENTS.md, MCF-DEC-052 (tool permissions),
MCF-DEC-055 (Human Delegation Firewall) and
docs/operations/MCF-GOOGLE-MODEL-ROUTING.md.

Capabilities:
- mcf_system_status: sampled CPU, RAM, disk, swap and GPU from the local Hub.
- mcf_service_status: fixed allowlist of eight MCF services, process status and port.
- mcf_pet_status: validated Pet state and presence.
- mcf_mission_status: canonical mission observer state; never invent success
  when it is disconnected (actual observer returned AUTH_NOT_CONFIGURED).
- mcf_tool_catalog: available permission profile and capabilities.

The user must check the read-only tools option before starting Gemini Live.
Unchecked is the default; the checkbox is locked during the session. A tool
scope is HMAC-bound into each one-time 30-second ticket. Legacy tickets are
accepted for conversation only and cannot escalate to READ_ONLY.

All tools read five fixed local GET endpoints on 127.0.0.1:8898, with strict
parameter and service allowlists. No shell, filesystem editing, write API,
generic network access, browser operation, email, deployment, HUMAN_GATE
approval, payments or credential read. Limits: 12 calls/session, four
calls/message, bounded result and timeout. Errors fail closed. When a Google
Live tool-call turn ends silently, a maximum of three speech continuation
prompts may be used; no execution privilege is gained.

Audit receipts are written to
~/.local/state/mcf-pet-tools/read-only-receipts.jsonl, private mode 0600.
Only tool name, time, status, duration and receipt ID are recorded, not user
prompts, raw arguments, response bodies or audio. Full/unwritable logs block
the tool result.

Privacy: audio goes to Google Gemini while Live is active. When tools are
enabled, a filtered infrastructure snapshot also goes to Google to support
a spoken answer. Existing MESTRE Agent SQLite continues to store conversation
text. The tool registry does not store audio or duplicate chat memory.

Tests: 67/67 Python tests and 5/5 session tests. Real Gemini tool calling
executed mcf_system_status, produced receipt, returned 34 audio chunks and
completed. Chrome Playwright: opt-in, UI receipt, audio, mic released, 390px
layout, zero HTTP/JS errors. Conversation-only mode: 12 audio chunks, zero
tool calls. The human's physical microphone and external Tailnet access
were not retested in this phase.

Local backup:
~/.local/share/mcf-service-hub/backups/mcf-pet-live-20261116T222738Z/
No canonical MCF production deployment or merge authorization is implied.
A separate phase is needed to design READ_AND_PROPOSE, SCOPED_WRITE and
HUMAN_GATE through MCF PermissionEngine and HDF.

## Pet READ_AND_PROPOSE — revisão de propostas (2026-11-16)

Nova capacidade experimental, separada do perfil READ_ONLY do PR #533.

A interface Gemini Live apresenta duas opções não persistentes por sessão:
- Consultas de infraestrutura (permite ferramentas somente leitura).
- Salvar propostas para revisão (disponível apenas com consultas habilitadas).

A opção de propostas é desligada por padrão. Um ticket HMAC v2 com scope
read_and_propose vincula a permissão ao WebSocket; o modo conversation não
carrega funções e o modo read_only não declara mcf_prepare_proposal.

Quando o humano pede um plano, o mesmo MESTRE Gemini Live pode chamar
mcf_prepare_proposal para armazenar em SQLite privado um rascunho estruturado:
título, objetivo, justificativa, 2-6 etapas, riscos, rollback, prioridade e
IDs dos recibos de observação da sessão (se houver). Cada rascunho inicia em
pending_review, com executable=false e human_gate=false.

O painel mostra a seção Propostas do Pet MESTRE em
http://127.0.0.1:8898/#petProposalZone. Com a sessão Pet autenticada
(HttpOnly/CSRF/Origin), o usuário pode ler rascunhos e apenas registrá-los
como reviewed_for_planning ou rejected. Ambos são estados de documentação,
não constituem aprovação de execução, autorização de LÉO nem HUMAN_GATE.

A persistência é local em ~/.local/state/mcf-pet-proposals/proposals.sqlite3
(diretório 0700 e arquivo 0600). São aceitos até quatro rascunhos por sessão
e 300 no total, com idempotência por session_id + call_id. Há validação
de payload, limites de tamanho, atualização otimista por version e rejeição
de valores que parecem conter credenciais. O conteúdo continua não confiável
por ser gerado por IA. Não há ação externa, fila de execução nem sync
automático para o MissionRuntime.

Apenas a modalidade Gemini Live cria propostas nesta fase. O chat clássico
segue funcional, mas sem criação de rascunhos. A próxima integração com
PermissionEngine e Capability Registry exige revisão e gates separados.

Testes: 82 Python, 5 JS, resposta real do Gemini com mcf_prepare_proposal,
rascunho persistido e 23 chunks de áudio, testes HTTP de CSRF, UI Playwright
Chrome com consentimento cancelado e UI mobile sem overflow.
O microfone físico do usuário e a rota externa Tailnet não foram
revalidados nesta missão. Um pedido complexo de duas ferramentas atingiu
timeout em teste inicial; o pedido de proposta isolado foi validado.

### P2 review remediation (PR #534)

- The review queue is paginated (max 40 per API page, 25 in UI) with pending
  proposals shown first and explicit pending_count/total values.
  Earlier pending drafts remain available via Carregar mais propostas.
- Priority validation checks the Python type before enum membership; malformed
  arrays/maps from Gemini cannot raise an uncaught TypeError in the tool turn.
