# Decisões de arquitetura e segurança

1. Não aumentar duração de sessão indefinidamente ou remover cookie/CSRF para contornar o erro.
2. Diferenciar cookies por instância de página: tabId aleatório gerado ao carregamento, reduzindo colisão inclusive quando abas são duplicadas. Não persistir tabId em localStorage.
3. Enviar X-MCF-Pet-Tab em GET session e POSTs. Verificar cookie HttpOnly correspondente, CSRF, Host e Origin no backend.
4. Compatibilidade temporária com clientes antigos no cookie mcfpet_session; nenhum enfraquecimento das exigências existentes.
5. Usar único fluxo authenticatedFetch também no ticket Gemini Live, em vez de obter token diretamente e produzir falso "serviço indisponível".
6. Aceitar estado do Pet desktop somente se script, executável, dono, PID e telemetria forem verificáveis. Não inferir presença do mascotinho pelo modelo cognitivo nem forçar outro processo.
7. Não matar nem reiniciar a janela gráfica do usuário. Reportar corretamente service_active=false com process_source=desktop.
8. Testar simultaneidade de abas e áudio real do provedor via Playwright antes do merge.
9. Manter ferramentas de execução e HUMAN_GATE desabilitados na sessão Gemini Live.
10. Reusar o instalador reversível do componente, sem alterar MissionRuntime, Vercel, Google Cloud, firewall ou Tailscale.
