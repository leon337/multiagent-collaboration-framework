# F0 — Modelo de ameaças, controles e riscos residuais

**Escopo:** Gemini Live Studio local em `127.0.0.1:18371`, `server.js`, frontend `public/`, chave local e conexão com o Google via token efêmero. **Classificação:** Classe C pela evolução futura para ferramentas e autonomia. **Observação:** diagnóstico técnico MESTRE, não auditoria independente Emily.

## Ativos, fronteiras e fluxos

```text
Navegador (permissões de microfone/câmera/tela)
  ├── HTTP loopback 127.0.0.1:18371
  │     ├── /api/key  [chave permanente, POST, validação Google]
  │     ├── /api/token [token de sessão temporário]
  │     └── arquivos públicos allowlisted
  └── WebSocket TLS para generativelanguage.googleapis.com
         [token efêmero em query access_token, áudio/imagem/texto]
```

- **Chave API permanente:** não entra no bundle público. Está em `.private/api-key.json`, permissão `0600`, diretório `0700`, mas é **texto em claro**.
- **Token de sessão:** provisionado com `uses:1`, expiração de início de conexão ~1 minuto e de uso ~30 minutos; o token trafega em parâmetro de URL do WebSocket, conforme protocolo oficial, sujeito a vazamento por traces/telemetria indevidos.
- **Rede local:** servidor vinculado somente a `127.0.0.1`, sem TLS local ou autenticação de usuários. Não deve ser colocado atrás de reverse-proxy público sem nova fronteira de identidade.
- **Dados pessoais:** o navegador pode enviar voz, frames e transcrições ao Google; por padrão não deve salvar nem publicar mídias sem consentimento. Exportação JSON é explícita pelo usuário e pode conter texto pessoal.

## Testes de segurança executados

`f0/security-check.cjs` gerou `f0/SECURITY-CHECKS.json`: **12 controles PASS, 3 lacunas intencionais/conhecidas**.

| Controle observado | Resultado |
|---|---|
| Host/porta vinculados a loopback | PASS |
| Servir somente paths allowlisted: `.private/api-key.json`, `server.log`, `server.js`, `.git/config` retornaram 404 | PASS |
| `Origin: https://external.invalid` em rotas /api/status GET e POST retornou HTTP 403 | PASS |
| Content-Security-Policy restritiva e `Referrer-Policy: no-referrer` | PASS |
| Chave arquivo 0600; diretório 0700 | PASS |
| `.gitignore` ignora `.private/` e logs | PASS |
| Autenticação própria do backend local | **FALHA CONHECIDA** (somente loopback/Origin) |
| Tokens temporários vinculados a modelo/configuração específica | **FALHA CONHECIDA** |
| Cofre com criptografia da chave em repouso | **FALHA CONHECIDA** |

A origem HTTP não é controle de autenticação de processo local. O fato de `Origin` estar ausente em clientes não-browser permite chamadas por software local. O navegador usuário pode inspecionar seu próprio token temporário. **Não há autorização para exposição pública do serviço.**

## Riscos priorizados e controles exigidos

| Risco | Severidade | Evidência / mitigação |
|---|---|---|
| Credencial publicada anteriormente em chat | **Alta** | Recomendar rotação no Google AI Studio e cadastro da nova chave somente na UI local; não publicar valor |
| Chave persistente não cifrada em `.private` | **Alta** | planejar Secret Service/libsecret ou cofre compatível, permissões restritas, migração e teste de rollback |
| Backend sem login/CSRF integrado para acesso via proxy | **Alta se remoto** | manter `127.0.0.1`; autenticação por usuário e sessão, validação Host/Origin, TLS e anti-CSRF antes de qualquer exposição |
| Token efêmero não limitado ao modelo/setup | **Alta** | usar `liveConnectConstraints` quando compatível; testar fallback e erros sem abrir uso irrestrito |
| URLs com `access_token` em DevTools/proxy/log | **Alta** | impedir logging de URLs/query e tokens; rotação/TTL mínimo; não exportar trace bruto |
| Envio de câmera/tela sem controle visível | Alta | opt-in individual e indicador sempre visível; validar permissão real e `stop tracks` após desconexão |
| Custos/quota da API e fallback | Alta | limitar rate por sessão, budget antes do request, 429/backoff; não interpretar RPM “ilimitado” como custo zero |
| Prompt injection via mídia/tela/transcrição | **Crítica após F3** | separar dados não confiáveis do comando; executor MCF com HDF/receipts, sem shell direto |
| Duplicação de função em timeout | **Crítica após F3** | idempotency key, reconsulta de receipt antes de retry; não executar a mesma ação duas vezes |
| Conteúdo pessoal em export local | Média | aviso explícito de privacidade, retention/delete, sanitização de diagnósticos |
| Dependência de preview e mudança de esquema | Média | matriz real por modelo, testes contratuais, feature flags, fallback autorizado |

## Requisitos de bloqueio / gates

- [x] Não publicar credencial, token, áudio, screenshot privado, transcrição ou dump de rede nos PRFs.
- [x] Garantir loopback e impedir paths privados via HTTP.
- [x] Testes de Origin/CSP e modos do arquivo/diretório.
- [ ] Migrar chave a cofre cifrado/rotacionar credencial anteriormente compartilhada.
- [ ] Restringir token efêmero a setup/modelo; verificar segurança por modelo.
- [ ] Teste real de permissões do usuário em câmera, mic e compartilhamento.
- [ ] Identidade/autorização completas antes de proxy externo.
- [ ] Política de budget/custos antes de autonomia prolongada.
- [ ] Revisão independente por Emily e gate operacional por LÉO.

**Gate atual:** `EM_REVISAO / GATE_PENDENTE`, sem evidência de decisão Emily/LÉO. Os três gaps de segurança não impedem inspeção local limitada, mas **bloqueiam expansão remota/autônoma** sem mitigação/decisão governada.

**Fontes:** [Google ephemeral tokens](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens), [Session management](https://ai.google.dev/gemini-api/docs/live-api/session-management), [Protocolo MCF](../../protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md).
