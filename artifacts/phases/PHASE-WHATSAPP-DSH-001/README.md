# PHASE-WHATSAPP-DSH-001

**Missão:** MCF-WHATSAPP-DSH-001.

Estado final: `AGUARDANDO_DEPENDENCIA_EXTERNA`, não implantado nem integrado à main.

Ordem de leitura: PLAN → REPORT → VALIDATION → VALIDATION-FULL → SMOKE → DECISIONS → CHECKPOINT → MANIFEST.

Artefato funcional: [apps/mcf-whatsapp-dsh](../../../apps/mcf-whatsapp-dsh/README.md).

Todos os testes offline passaram; DeepSeek Harness alcançou 9Router mas quota free devolveu 429. Credenciais e webhook HTTPS da Meta não estão configurados. Não há prova de conversa WhatsApp real.

Continuity 2026-10-25: LEANDRO authorized Meta test sender only; private test env prepared. DSH error decoder corrected after durable log verification.

Ciclo 4: termos Meta aceitos, 2 tentativas reais de número teste falharam por erro do provedor. Veja PHASE-WHATSAPP-DSH-001-META-NUMERO-TESTE-20261025.md; nenhum número ou token recebido.

Ciclo 5: alternativa Vonage/Twilio documentada, MCP Meta OAuth autenticado (Cheap Delivery com zero Messaging Accounts) e TESTE REAL Step5 via DSH concluído em ~78s com resposta OK. Ainda não há remetente WhatsApp operacional; PR continua draft.

Ciclo 6: bridge própria `apps/mcf-wa-local` pareada ao WhatsApp do titular em 26/10/2026. Primeiro teste real PASS no nível do cliente (retorno de `sendMessage`); segundo comando falhou por timeout do Step 5, com mitigação de aviso após 12s e 18/18 testes. Detalhes e riscos em `MCF-LOCAL-WHATSAPP-20261026.md`. Sessão não oficial, revogável em Dispositivos conectados.

Ciclo 7: mensagens naturais após /mestre inicial corrigidas e persistentes; 7 respostas WhatsApp/DSH confirmadas, uma falha histórica, 21 testes locais, autoenvio diagnóstico não executado.

Ciclo 8: recuperação após reinício, Brave vinculado restaurado e autostart habilitado, 30 testes, aliases próprios PN/LID corrigidos e teste real de status no próprio WhatsApp Web aprovado. Inferência Step 5 após reinício não testada. Registro: `MCF-BOOT-RECOVERY-20261026.md`.
