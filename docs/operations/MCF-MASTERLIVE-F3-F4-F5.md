# MCF — MasterLive: navegação governada, Tailscale e evidência F3–F5

**Missão:** `MCF-MASTERLIVE-F3F4F5-20261119-001`
**Status:** `LAB_VERIFIED / PRODUCTION_PRESERVED / PENDING_PHYSICAL_AUDIO_AUDIT`
**Fonte de verdade:** repositório MCF, GitHub ao vivo e recibos locais datados; não inferir estado do host de documentação histórica.

## Contexto e limites

MasterLive é uma UI/gateway local Gemini Live/DSH. É diferente do seletor nativo DSH. A experiência de voz e ferramenta usa API Live, Playwright/CDP isolado, websockets e Tailscale Serve **privado à tailnet**. O ambiente de laboratório é independente da versão operacional; nenhum arquivo da versão operacional precisa ser sobrescrito para testar. O modelo padrão da UI não foi alterado.

## F3 — Ferramentas e governança

A navegação e inspeção de páginas públicas passam por resolução DNS + filtro de endereços privados. O navegador da instância de laboratório utiliza CDP, pasta de perfil e processo separados da instância existente. Navegação/inspeção podem executar sem gate de clique. `browser_click` e `browser_fill` exigem alvo semântico inequívoco, preflight e aprovação explícita da sessão; não repetem automaticamente ações incertas. O fluxo reporta resultado de ferramenta, não sucesso presumido da tarefa externa.

**E2E com Gemini Live real (7/7):** websocket conectado; navegação pública; inspeção do título/conteúdo; pedido de confirmação antes de clicar; clique recusado permanece bloqueado; endereço loopback/privado recusado; CDP e perfil separados comprovados.

**Limite importante:** solicitação de autorização pode ser apresentada durante conversa por voz, mas a autorização efetiva continua exigindo interação humana explícita na UI. **Reconhecer a palavra “sim” por transcrição de áudio NÃO é autorização autenticada.** Qualquer evolução para confirmação verbal requer identidade, consentimento, escopo de ação, anti-replay e ensaio de falsos positivos. A F3 não deve declarar esse gate concluído por voz.

## F4 — Acesso remoto resiliente

- Serviço `systemd --user`, `Restart=on-failure`, `enabled`; a sessão de usuário estava com `linger=yes` (verificado no host em 2026-11-19).
- Tailscale Serve com HTTPS em porta de laboratório separada; publicar **somente na tailnet**, nunca usar Funnel como fallback silencioso.
- Hospedar em loopback na porta de laboratório e aplicar lista explícita de Host/Origin; controlar acesso aos endpoints internos, diagnóstico e credenciais.
- Testar TLS, HTTP, WSS, browser E2E por URL HTTPS e recuperação após `systemctl --user restart`, preservando a porta da instalação anterior.
- Resultado observado: HTTPS 200 com TLS validado; WSS Live produziu 8 blocos de áudio, 2 transcrições e turno completo; browser headless por HTTPS apresentou microfone simulado, conexão, transcrição, reprodução e encerramento, 5/5; reinício trocou PID e recuperou HTTP 200.

**Limites:** testes HTTPS/WSS foram feitos a partir do host autorizado, pela rota Tailscale. Não equivalem a testes físicos no celular nem ao teste de qualidade do headset do usuário. Nem a persistência após um reboot completo foi medida nesta rodada (foi testado o restart do serviço).

## F5 — Auditoria, rastreabilidade e integração

- Suíte local do estágio: 35/35 testes automatizados, zero falhas.
- Navegação F3: 7/7 controles E2E.
- Gateway de voz: quatro modelos de conversação validaram turnos com áudio; dois modelos especializados passaram apenas pelo handshake.
- Acesso remoto: endpoint de diagnóstico e onboarding de credencial retornaram HTTP 403 pelo endereço tailnet, enquanto o health HTTP 200 permaneceu disponível.
- Integridade: quatro arquivos críticos da versão operacional conferidos por SHA-256 sem alteração, baseline mantida e rollback local disponível.
- Dados: nenhuma chave, transcrição humana ou gravação de áudio publicada neste repositório. Evidências brutas e backup permanecem em armazenamento privado no host autorizado.

### Checklist antes de qualquer promoção

1. Auditar risco e comportamento de consentimento no telefone real; confirmar identidade do aprovador e não confiar em textos de terceiros/áudio sintetizado.
2. Ouvir uma conversa longa no headset físico: clipping, jitter, eco, sobreposições, latência e interrupções; medir a qualidade com critérios definidos.
3. Verificar plano de continuidade após **reboot real** em janela aprovada; testar rede móvel Android conectada à tailnet.
4. Checar quota atual do projeto e IDs dos modelos Live (sucesso de conexão não implica quota ilimitada).
5. Comparar patch com versão operacional, exigir revisão independente, SHA exato, gates MCF/HDF e aprovação de promoção antes de merge/deploy.

## Execução e retorno seguro

Consultar `ops/masterlive/check-readiness.sh` para inspeção não destrutiva. Recuperação de laboratório: consultar serviço e logs, não reiniciar nem publicar a versão operacional automaticamente. Se for necessário remover apenas a exposição de laboratório, o operador autorizado poderá usar `tailscale serve --https=<porta-de-laboratorio> off`; se necessário, `systemctl --user disable --now <servico-de-laboratorio>`. Conferir os valores reais antes de executar; nunca aplicar `tailscale serve reset` indiscriminadamente.

**Autoridade:** LEANDRO é humano e autoridade final; MESTRE coordena; LÉO é agente distinto. Documentação/PR draft não comprovam deploy da aplicação nem autorização para promover produção.
