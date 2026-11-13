# MCF-GOOGLE-BRIDGE-001 — Fase 02: OAuth e validação real

Data: 2026-11-13
Operação: MESTRE sob autorização de LEANDRO
Projeto Google Cloud: mcf-potiguar-gemini-261109
PR de origem: #523 (draft)

## Configuração
- Google Auth Platform: configurado com aplicativo MCF Bridge, público externo e status "Testando".
- Google OAuth Client Desktop: criado; cliente exibido no Google Cloud Console.
- Usuário de teste: 1 conta própria autorizada no projeto.
- APIs habilitadas: drive.googleapis.com, gmail.googleapis.com, calendar-json.googleapis.com.
- Google OAuth PKCE: consentimento concluído no navegador autenticado.
- Credenciais e tokens: somente no diretório ~/.config/mcf-google-bridge/ sob permissões 0600.
- Nenhuma chave ou valor de token foi copiado para o Git, logs de teste ou este relatório.

## Testes reais (HTTP via Bridge)
- google.status: HTTP 200; oauthConnected=true; oauthClientConfigured=true.
- google.gmail.search, query de janela de 7 dias, limit=3: HTTP 200; retornou 3 referências.
- google.drive.search, filtro trashed=false, limit=3: HTTP 200; retornou 3 referências.
- google.calendar.events, limit=3: HTTP 200; retornou 3 referências.
- Conteúdo pessoal obtido nas chamadas não foi exibido ou gravado neste documento.

## Persistência e reteste
- Reinício explícito de mcf-google-bridge.service: PASS.
- systemd de usuário: ActiveState=active, SubState=running, UnitFileState=enabled.
- Porta: exclusiva no loopback 127.0.0.1:8755.
- GET /healthz: HTTP 200.
- google.status após reinício: HTTP 200, oauthConnected=true.
- gmail.search, drive.search, calendar.events após reinício: HTTP 200 cada.
- npm test: 10/10 PASS, 0 FAIL.

## Limites e riscos remanescentes
- O app OAuth permanece em modo de teste e não foi publicado ou verificado pelo Google.
- Renovação de tokens após expiração efetiva ainda não foi exercitada em teste real.
- A autenticação cobre a conta consentida e os escopos autorizados, não outras contas.
- Endpoints de escrita Google não foram habilitados.
- Integração com dispatcher/ledger/HUMAN_GATE central do MCF permanece como evolução separada.
- Não houve merge, publicação pública ou deploy de produção.
