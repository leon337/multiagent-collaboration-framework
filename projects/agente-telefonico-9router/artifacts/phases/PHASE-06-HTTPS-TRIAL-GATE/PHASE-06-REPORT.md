# Execução real Phase06 em 2026-10-19
1. Releitura do protocolo MCF v1.2 e Issue #449; navegador da Twilio já autenticado anteriormente.
2. Cloudflared v2026.10.1 presente, sem necessidade de conta ou contratação, Tailscale tailnet-only inadequado à Twilio pública.
3. Ajustado timeout 9Router no FastAPI de 12s para 3s com connect 1s em razão do limite trial TwiML fetch 5s. Suite local agora 44/44.
4. Script tools/temporary_https_smoke.py iniciou loopback 127.0.0.1:18949, tunnel trycloudflare HTTPS e token HMAC aleatório de TESTE; local /health 200 e público /health 200.
5. POST /voice/incoming sem assinatura -> HTTP 403; com assinatura HMAC produzida independentemente por Twilio Python SDK -> HTTP 200 e TwiML Gather language=pt-BR; POST falso /voice/respond sem assinatura -> HTTP 403.
6. O script terminou e matou TODOS os processos novos: EPHEMERAL_TUNNEL_AND_APP_STOPPED True; verificação de ss confirma porta 18949 fechada. Nenhuma chamada ou uso de modelo/pagamento.
7. GUI Cinnamon passou a bloqueio de tela: org.cinnamon.ScreenSaver.GetActive -> true (loginctl LockedHint é falso e não contradiz estado real do screensaver). Não obtido TWILIO_AUTH_TOKEN verdadeiro. Não contornar a tela bloqueada.
8. Fonte oficial Twilio Try out Voice 2026: no Trial, Create a Call REST aceita somente 4 templates Twilio especificados; custom TwiML sob restrições, 5s para buscar TwiML e Gather/Say suportados. Portanto teste do trial anterior não integra webhook FastAPI do MCF.
9. Fase pública testada com assinatura sintética mas NÃO configurada na Twilio real. Serviço público permanece desligado até token real e validação da configuração inbound Custom.

10. Colab CPU Potiguar `mcf449-p06-https44-cpu` completou **44 passed** em 0.98s, marcador MCF449_V2_CPU_COLAB_PASS, exit 0, sessão terminada. Nenhuma transcrição real ou inferência paid neste teste.
