# F0 — Baseline e matriz de capacidades verificadas (2026-11-16)

**Missão:** `MCF-GEMINI-LIVE-EVOLUTION-20261116-001` · **Issue canônica:** [#527](https://github.com/leon337/multiagent-collaboration-framework/issues/527) · **Branch de evidência:** `mission/gemini-live-evolution-20261116-001`. Os resultados são um *snapshot observado*, não uma garantia permanente de API, qualidade nem quota.

## 1. Inventário real — F0.2

| Campo | Evidência local |
|---|---|
| Computador / usuário | `leo-N43SM` / `leo`, Remote Desktop Commander online; ID `709ab4d3-7b2f-497b-8e00-31ce395c2943` |
| OS | Linux `6.8.0-147-generic` |
| Node / Python / Chrome | `v24.22.2` / `3.12.3` / Google Chrome `156.0.8078.79` |
| Aplicação | `/home/leo/Projetos/gemini-live-studio` |
| Serviço | Node `server.js` · `127.0.0.1:18371` · `/api/status` respondeu `ok:true` |
| API key | arquivo `.private/api-key.json` existente, arquivo `0600` e diretório `0700`; valor nunca extraído em logs/relatórios |
| Código fonte | 8 arquivos e hashes SHA-256 no snapshot inicial; `0` valores de chave detectados por padrões na fonte pública varrida |
| Integridade do inventário inicial | SHA-256 do `SNAPSHOT.json` local: `af54e8a3d4ee64652e6b4ef9a1dc6ac8ce0bbee114a318834b9fcb63656b0162` |
| Baseline versionada | Git local recém-inicializado, `main@a33bdf9c4681ace0cb582621801bb6608415692a` (contém app + módulo F0 de telemetria; sem chave/log/media). **Commit local, não publicado remotamente** |
| Estado Git | 10 arquivos versionados; `.private/`, `server.log` e `f0/` protegidos por `.gitignore` |
| SDK | Aplicação usa `WebSocket`/HTTP nativos do navegador e Node; nenhum SDK Gemini instalado necessário para o código observado |

**Evidências locais (não publicadas):** `f0/SNAPSHOT.json`, `f0/MODEL-PROBE.json`, `f0/BASELINE-TESTS.json`, `f0/SECURITY-CHECKS.json`, scripts de repro em `f0/`. Os resultados no GitHub são somente resumos redigidos/expurgados.

## 2. Consulta de modelos com a chave configurada — F0.3

A API `GET /v1beta/models/{id}` foi consultada **sem revelar chave**, às `2026-11-16T18:58:59Z`. Todos abaixo retornaram **HTTP 200** e método `bidiGenerateContent`:

| Modelo | Catálogo API | Handshake real na F0 | Conteúdo/áudio/ferramentas |
|---|---|---|---|
| `gemini-2.5-flash-native-audio-preview-12-2025` | 200 / bidi | PASS | texto→resposta áudio/transcrição e `get_current_time` PASS |
| `gemini-3.8-live` | 200 / bidi | PASS | setup validado; sem avaliação independente de qualidade de áudio |
| `gemini-3.8-live-extended-thinking` | 200 / bidi | PASS | setup com thinking level obrigatório validado |
| `gemini-3.1-flash-live-preview` | 200 / bidi | NÃO TESTADO nesta F0 | não inferir paridade |
| `gemini-3.5-transcribe-live` | 200 / bidi | NÃO TESTADO nesta F0 | modo especializado, sem provar transcrição física |
| `gemini-3.5-live-translate-preview` | 200 / bidi | NÃO TESTADO nesta F0 | modo especializado, sem provar tradução real |

**Cuidado:** HTTP 200 + método listado ≠ feature disponível para cada modelo. Os endpoints especializados devem ter setup e roteamento próprios. Não é correto dizer que há seis experiências completas validadas.

## 3. E2E reproduzível — F0.5

Foi executado Chrome headless com **microfone e câmera virtuais**, tela simulada por `getDisplayMedia` mock, e WebSocket com chamada real à API Google. A última regressão terminou em **15/15 PASS / 0 FAIL**, cobrindo:

- status configurado, rejeição de `Origin` externo (HTTP 403), negação de arquivo privado (HTTP 404);
- handshake real de 2.5 Flash Live e 3.8 Live;
- pipeline PCM virtual, frame JPEG virtual da câmera e da tela simulada; desligamento correto;
- geração de resposta com transcrição, **1 chamada real** de `get_current_time` e `turnComplete`;
- conexão encerrada sem streams ativos; sem exceções JavaScript;
- módulo de telemetria local criado, amostra de setup e verificação que eventos não contêm chave, áudio ou texto do prompt.

**Sinais observados na regressão:** `toolCalls=1`, `turnComplete=1`, `outputTranscription=1`, `sessionResumptionUpdate=2`, `serverErrors=0`. O modelo 3.8 Extended também obteve `setupComplete` em teste separado, sem erro JavaScript.

**Limite central:** não foi feita nova captura do microfone físico, câmera física, áudio audível por alto-falante nem captura real da tela do usuário. Teste com dispositivo virtual prova pipeline/codificação e autorização, **não qualidade do hardware nem consentimento de mídia real**. A confirmação anterior do usuário de que testou a aplicação também não substitui uma evidência gravada desta fase.

## 4. Limites de uso — apenas observação separada

Em 2026-11-16 a aba aberta do Google AI Studio exibia **Nível gratuito**, janela de 28 dias, e para 2.5 Native Audio os campos `TPM 16.44K / 1M`, para 3.8 Live `15.86K / 65K`, e para 3.8 Extended `7.56K / 65K`. O painel mostrava `RPM Ilimitado` como valor exibido para modelos Live, mas **isso não garante requisições ilimitadas, custo zero, estabilidade ou disponibilidade**. A correspondência exata entre projeto selecionado na aba e chave local não foi comprovada; portanto tais números não são quota confirmada da aplicação.

## 5. Critérios e próximos gaps

| Critério | Resultado |
|---|---|
| Reconciliar dispositivo/serviço/versões e preservação de chave | **PASS** |
| Criar snapshot sanitizado e commit local rastreável | **PASS** |
| Verificar metadados dos seis modelos com credencial | **PASS** |
| Testar três handshakes reais | **PASS** |
| Testar texto→áudio/transcrição + função real 2.5 | **PASS** |
| Testar pipeline áudio/câmera/tela virtual e cleanup | **PASS** |
| Provar hardware físico, custo real, qualidade e estabilidade de sessão longa | **PENDENTE**, fase F1/aceite supervisionado |
| Confirmar aprovação independente de auditoria/gate | **PENDENTE**, F0.8 |

Fontes externas: [Live capabilities](https://ai.google.dev/gemini-api/docs/live-api/capabilities), [Session management](https://ai.google.dev/gemini-api/docs/live-api/session-management), [Ephemeral tokens](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens).

**Não houve merge, deploy nem integração do runtime de produção.**


## Adendo de correção — evidência primária para auditoria externa

A revisão externa no SHA `6a714e4` identificou que os logs/scripts locais não estavam disponíveis no PR. Foram incorporados **somente** os arquivos sanitizados `artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/repro/` (servidor, frontend, scripts F0, resultados JSON e hash manifest). A cópia não inclui credencial, tokens, mídia ou estado de navegador. Reproduzir testes de mídia/API em outro ambiente exige dispositivo sintético, Chrome e chave **do próprio auditor**, nunca uma chave publicada.

O histórico `15/15 PASS` corresponde à execução original local; código e resultados agora são inspecionáveis. Testes de dispositivo físico e rotação de chave seguem pendentes. Ver [parecer externo](../../artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/PHASE-00-EXTERNAL-REVIEW-CODEX.md).
