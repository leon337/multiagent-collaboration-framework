# MCF 449 — Agente Telefônico v0.2.0

MVP demonstrativo em português brasileiro. Não publicar em produção. Implementação própria baseada na missão MCF #449.
## Arquitetura

Fluxo: telefone Twilio -> webhook HTTPS FastAPI -> Gather/STT pt-BR -> resposta do 9Router/DeepSeek -> Say/TTS pt-BR. Até seis turnos por chamada. No modo de demonstração, não existe contato com serviços externos.

## Teste local

1. python3 -m venv .venv
2. source .venv/bin/activate
3. pip install -r requirements.txt
4. DEMO_MODE=1 uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log
5. python -m pytest -q tests

GET /health, POST /voice/incoming e POST /voice/respond compõem o contrato. O mock do 9Router e as assinaturas são verificados pelos testes.
## Homologação real

Para conexão real, configurar PUBLIC_BASE_URL (HTTPS), TWILIO_AUTH_TOKEN, NINEROUTER_API_KEY e DEMO_MODE=0. Modelo padrão deepseek/deepseek-chat, URL base https://api.9router.com/v1.

Não reutilizar chave anteriormente exposta. Os custos de telefonia, STT e TTS exigem aprovação. A voz Polly.Ricardo é masculina, pt-BR, listada na Twilio. Colab não é servidor persistente nem produção.

O contexto é desabilitado por padrão. Quando ENABLE_CALL_CONTEXT=1, retém até três pares de mensagens por chamada em RAM por 15 minutos, no máximo 50 chamadas. Não contém banco nem histórico persistente.
## Segurança e lacunas

Validação de assinatura do Twilio no webhook de produção, corpo de até 12 KB, rejeição de duplicados, validação UTF-8 e limite de entrada. Nunca ativar DEMO_MODE em endpoint público.

Antes da produção: HTTPS público seguro, proteção contra replay, limitação de requisições, consentimento e política de privacidade, testes reais de STT/TTS e retorno de áudio, contas Twilio e 9Router autorizadas. A voz Alice foi descontinuada em 2023; o projeto usa Polly.Ricardo.

Fonte: https://www.twilio.com/docs/voice/twiml/gather
Vozes: https://www.twilio.com/docs/voice/twiml/say/text-speech
Missão: https://github.com/leon337/multiagent-collaboration-framework/issues/449
