# MCF-PET-SESSION-RECOVERY-001 — Plano da correção

**Data:** 2026-11-16. **Autoridade humana:** LEANDRO. **Orquestrador:** MESTRE.
**Origem:** feedback visual de LEANDRO com erro "Falha na transcrição: Sessão inválida".
**Escopo:** corrigir autenticação do módulo de conversa por turnos existente, sem mudar a execução de missões, o roteador Gemini Live ou o runtime MCF.

Requisitos:
- Sessões do Service Hub expiram em 3600 segundos e são armazenadas em memória.
- O navegador deve renovar a sessão antes da expiração quando estiver prestes a enviar uma requisição.
- HTTP 403 INVALID_SESSION durante transcrição, chat, síntese e expressão deve renovar token CSRF/cookie e repetir o mesmo pedido uma única vez.
- HTTP 403 ORIGIN_FORBIDDEN, falhas de rede, timeouts, 429 e 5xx não podem disparar reenvio automático.
- Preservar o mesmo Blob de áudio e o mesmo request_id de chat.
- Manter microfone opt-in, política de segurança, funcionamento Gemini Live, APIs read-only e rollback.
- Testar num navegador real com sessão invalidada por restart, confirmar renovação e transcrição HTTP 200.
- Publicar via branch isolada e PR após CI, sem deploy do MissionRuntime central.
