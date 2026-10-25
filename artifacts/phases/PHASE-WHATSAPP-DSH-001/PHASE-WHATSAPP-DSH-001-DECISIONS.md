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
