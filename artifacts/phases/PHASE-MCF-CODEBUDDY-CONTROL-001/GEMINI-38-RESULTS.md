# MCF-CODEBUDDY-CONTROL-001 — Gemini 3.8 (13/11/2026)

**Escopo local:** `leo-N43SM`; branch isolada `feat/mcf-codebuddy-control-001`; nenhuma credencial, merge ou deploy de produção.

**Cadastro aplicado:** três modelos em `~/.codebuddy/models.json` e serviço `codebuddy-web.service` configurado para carregar credenciais de `~/.config/codebuddy/mcf-gemini38.env` (0600). Backups privados com manifesto SHA-256.

**Google modelo discovery (API autenticada):** IDs `gemini-3.8-flash`, `gemini-3.8-live`, `gemini-3.8-live-extended-thinking` presentes. Flash: `generateContent`. Live e Extended: `bidiGenerateContent`.

**Testes diretos (sem expor chave):** Live e Extended `HTTP 200`, marcador esperado; Flash `TimeoutError` por endpoint native e OpenAI-compatible.

**Primeiro E2E CodeBuddy:** a chamada Flash excedeu 80 s; Live e Extended devolviam saudação genérica ou timeout, embora retornassem `is_error=false` em alguns casos. Não marcar como sucesso sem validação semântica.

**Diagnóstico sanitizado:** requisição real do CodeBuddy para o adaptador continha `messages[].content` com 13.604 caracteres e marcador no payload. A implementação recortava sempre os primeiros 6.500 caracteres, perdendo comandos recentes. Corrigido para conservar a cauda das mensagens de usuário usando `clipMessage`.

**Após correção:** `custom-local:gemini-3.8-live` e `custom-local:gemini-3.8-live-extended-thinking` retornaram `VALIDACAO_GEMINI_38_OK`, `ok=true`, exit 0, `session_id` presente. O adaptador reiniciou e `GET /health` respondeu `ok:true`. O CodeBuddy Web respondeu `HTTP 200`, `mcf-codebuddy doctor` confirmou `ready:true`.

**Testes locais:** 20/20 Python no controlador e 11/11 Node no adaptador, sem instalar dependências externas novas.

**Rollback do modelo:** `python3 tools/mcf-codebuddy-control/gemini38_models.py rollback --backup /home/leo/.codebuddy/backups/mcf-codebuddy-gemini38/20261113T033059Z`, depois recarregar/reiniciar a unidade `codebuddy-web.service`.

**Rollback do adaptador:** `python3 tools/mcf-codebuddy-control/rollback-live-window.py --backup /home/leo/.local/share/mcf-gemini38-agent/backups/mcf-codebuddy-live-window-20261113T035315Z`.

**Status de aceite:** LIVE_PASS / EXTENDED_PASS / FLASH_REGISTERED_BUT_PROVIDER_TIMEOUT. Não homologar Flash como funcional nem fazer fallback silencioso; deixar `fast-model` como padrão até disponibilidade comprovada.
