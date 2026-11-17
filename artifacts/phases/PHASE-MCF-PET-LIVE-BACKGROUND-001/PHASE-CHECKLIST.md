# Checklist MCF-PET-LIVE-BACKGROUND-001

- [x] Conferir código real e estado dos PRs #533/#534.
- [x] Criar branch/worktree isolada sobre PR #534.
- [x] Remover encerramento da sessão no evento visibilitychange.
- [x] Manter WebSocket com microfone silenciado por padrão em fundo.
- [x] Adicionar opt-in explícito de microfone ativo em segundo plano.
- [x] Revogar consentimento ao encerrar e preservar pagehide/Stop.
- [x] Preservar as três modalidades de permissão de ferramentas.
- [x] Validar testes Python, Node e navegador com Gemini real.
- [x] Validar Chrome e Brave com visibilitychange simulado.
- [x] Validar layout móvel e instalação local reversível.
- [ ] Usuário confirmar mudança física de abas no Brave.
- [ ] Abrir PR e validar CI; revisão independente antes do merge.
- [ ] Testar cenários de navegador ou SO suspenso, se necessários.
- [x] Resolver P2 Codex: áudio pendente finalizado ao silenciar aba.
