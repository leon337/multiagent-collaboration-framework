# MCF-PET-TAB-SESSION-PRESENCE-001 — Plano

Origem: duas capturas de tela apresentadas por LEANDRO com Pet aparentemente offline, Gemini Live "indisponível" e chat clássico com "Sessão inválida".
Autoridade: LEANDRO. Orquestração: MESTRE.
Fonte canônica: leon337/multiagent-collaboration-framework.
Branch isolada: fix/mcf-pet-tab-session-live-presence-20261116, base main@9df4e7d4e7ab61b7e321aa617da822ee2950f7c9.

Objetivos:
1. Evitar que duas abas compartilhem e sobrescrevam o mesmo cookie HttpOnly/CSRF.
2. Autenticar o ticket do Gemini Live pelo mesmo mecanismo de renovação e isolamento já usado no chat por turnos.
3. Identificar o Pet real aberto manualmente pelo desktop, sem criar nova instância e sem forçar encerramento da janela.
4. Preservar o runtime MCF, o controle de HUMAN_GATE, os serviços do MESTRE, o Google API key e a rede inalterados.
5. Testar login por aba, autenticação, Pet, transcrição clássica, Gemini Live com áudio real, regresso, backup e implantação local.

Fora do escopo:
- Deploy da base/runtime central MCF; configuração do Tailnet; gravação contínua sem clique; capacidades de execução; novo agente; mudança nas chaves API.
- Validação de microfone físico na sessão real do Brave, ou conexão Tailscale a partir do celular.

Critérios:
- 48/48 testes Python, 5/5 testes JavaScript.
- Playwright duas abas: tickets e state POST 200; Live recebe áudio e não invalida segunda aba; classic chat recebe HTTP 200.
- Pet observado online com UID/PID/caminhos de processo verificados; serviço systemd corretamente indicado como inativo.
- Rollback com backup e serviços saudáveis.
