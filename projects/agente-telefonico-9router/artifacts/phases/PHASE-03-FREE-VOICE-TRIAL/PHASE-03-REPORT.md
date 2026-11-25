# MCF #449 — Free Voice Trial e segurança financeira
Data: 2026-10-19. Conta Potiguar ADM 23. Orçamento total autorizado: R$ 0.

## Evidência de telefonia REAL
Twilio Voice Trial 30 dias e 75/75 minutos disponíveis confirmados na interface oficial.
Em 19/10/2026 às 19:20:03 GMT-3, uma chamada outbound foi iniciada via Try out Voice no cenário Speech Recognition, para o único telefone brasileiro verificado na conta (número omitido deliberadamente do relatório).
O log de Voice mostrou Ringing e em seguida **No answer**, duração **0 segundos**. O serviço de telefonia realmente recebeu um pedido de chamada, mas não houve conexão áudio nem STT/TTS comprovados.
Não foi iniciada segunda chamada nem efetuado upgrade. Segundo documentação Twilio, calls no-answer não são cobradas; conferir o contador de free units antes de nova tentativa.

## Evidência 9Router
Proxy local GET http://127.0.0.1:20128/api/health -> 200 (ok=true), GET /v1/models -> 200 (824 entradas incluindo deepseek/deepseek-chat).
SQLite interna (metadata-only, sem revelar segredos): providerConnections=0; usageHistory=0.
O catálogo NÃO comprova provedor configurado ou inferência disponível. Não foi enviada inferência paga nem copiada chave de API.

## Gate financeiro e correção
ZERO_COST_ONLY=1 (default) impede TODAS as chamadas externas LLM, mesmo havendo credencial no ambiente. Sem aprovação separada de rota gratuita validada, resposta segura não-IA. Duas novas provas unitárias: chamada de modelo proibida por default, resposta TwiML assinada sem HTTP externo.
Suite local 32/32 passou. Colab CPU ainda pendente de revalidação desta nova versão na escrita deste relatório.

## Próximas dependências humanas indispensáveis
1. Disponibilidade do titular para atender UMA nova chamada de teste ou confirmar recebimento. Não executar repetidamente sem coordenação.
2. Habilitar provedor de IA genuinamente gratuito com comprovação de custo R$0 (9Router com 0 providers configurados).
3. Configurar webhook HTTPS assinado público apenas com autorização de exposição e revisão LGPD.
4. Sem gastos, upgrades, compra de número ou publicação de produção.
