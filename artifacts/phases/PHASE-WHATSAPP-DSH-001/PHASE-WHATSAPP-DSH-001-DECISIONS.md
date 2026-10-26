# Decisões cronológicas — MCF WhatsApp DSH

1. **MESTRE:** Usar DSH nativo em vez de recriar o motor IA; manter 9Router existente.
2. **MESTRE:** Perfil exclusivo headless com ferramentas modelo desabilitadas; CLI `--json` e `--session-id` sustentam conversas.
3. **MESTRE:** Canal oficial WhatsApp Cloud API, autenticação por HMAC, allowlist, sem serviço público antes da configuração externa.
4. **MESTRE:** Criar branch/worktree isolada originada da `main`, não alterar Nilton nem serviços DSH ativos.
5. **MESTRE:** Corrigir referência de plugin inexistente e exigir inspeção da composição efetiva como bloqueio da inicialização.
6. **MESTRE:** Recusar fallback pago após 429 da rota gratuita selecionada.
7. **MESTRE:** Gate operacional `APROVAR_COM_RESSALVAS` exclusivamente para protótipo local; `BLOQUEAR` qualquer publicação/merge/produção sem revisão externa e teste real.
8. **LEANDRO:** Não foi pedido fornecimento de credenciais pelo chat; configuração deve ocorrer em arquivo privado e ambiente autorizado no notebook.
9. **Emily, LÉO e especialistas independentes:** revisões externas NÃO executadas; nenhuma decisão atribuída falsamente.

**Próximo gate:** envio/recebimento WhatsApp real após configuração Meta e quota/modelo, com evidência e privacidade.

10. **LEANDRO:** autorizou explicitamente a utilização do número de teste da Meta para este agente. Sem autorização de número remetente real, publicação pública ou gasto.
11. **MESTRE:** confirmação a partir do ledger local DSH: sessão iniciada, `turn_end` de provedor `QUOTA` e `INVALID_REQUEST`; corrigir parser de razão final, sem pagar e sem mascarar erro.
12. **MESTRE:** configurar arquivo privado modo teste com token de verificação e preservar Funnel existente sem novas rotas públicas.

13. **LEANDRO:** determinou Step 5 Preview via 9Router, acesso à Meta pelo navegador Cockpit e Funnel HTTPS.
14. **MESTRE:** perfil DSH WhatsApp isolado usa Step 5, enquanto o perfil web e Nilton continuam inalterados; timeout não constitui aprovação de modelo.
15. **MESTRE:** expor publicamente só /webhook com handshake; portal privado em Tailscale Serve, nunca o Cockpit.
16. **MESTRE:** impedir ativação do chat até presença de credenciais Meta, número de teste verificado e inferência real Step 5.

17. **MESTRE:** reclassificar Step5 como REAL_INFERENCE_PASS depois de output terminal `final OK`, sem confundir com WhatsApp E2E ou prometer latência curta.
18. **MESTRE:** oferecer Vonage Messages API Sandbox como rota principal temporária (100 msgs/mês), Twilio Sandbox como segundo recurso; ambos dependem de cadastro/opt-in legítimo, sem pagamentos automáticos.
19. **MESTRE:** OAuth da Meta MCP autorizado em cliente isolado; usar somente descobertas READ-ONLY até evidenciar titular e elegibilidade; nenhum fluxo de pagamento ou de número real por conta própria.
