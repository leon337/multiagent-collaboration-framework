# Integração MCF — Dual Browser Cockpit 0.7.4

Registro de 12/10/2026. O Dual Browser Cockpit é uma superfície de execução/fallback para ChatGPT e Workspace isolados, não um segundo runtime nem fonte de verdade do MCF.

Issues:
- Produto: https://github.com/leon337/mcf-dual-browser-cockpit/issues/23
- Reconciliação MCF: https://github.com/leon337/multiagent-collaboration-framework/issues/439
- Migração futura: https://github.com/leon337/multiagent-collaboration-framework/issues/381

## Fatos observados
- Agent Bridge local usa loopback e token efêmero.
- Estado pausado bloqueia ações POST com HTTP 423 `automation_paused`.
- Pausa/retomada é controle operacional do Cockpit.
- Painel de Configurações observado persiste cinco preferências: iniciar bridge, porta preferencial, layout padrão, intervalo de atualização e limite de eventos.
- Observabilidade expõe estados resumidos, eventos, agentes, missões e receipts; não deve substituir a verdade canônica do runtime MCF.

## Próximos gates
1. Provar correspondência entre fonte, tag e binário 0.7.4.
2. Completar guia e catálogo de configurações.
3. Implementar/testar controles apenas quando houver semântica funcional no backend.
4. Preservar tokens, cookies, sessões e governança de ações externas.
5. Manter Dual Browser como fallback durante a migração para Agent Workspace; sem migração automática de cookies ou remoção de instâncias antes de paridade demonstrada.

Este registro não afirma que o código, build, navegação Meta Business ou testes finais estejam concluídos.
