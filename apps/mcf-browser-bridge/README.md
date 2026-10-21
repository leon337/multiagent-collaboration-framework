# MCF Browser Bridge — PHASE-02 MVP

Protótipo local, reversível, zero dependências externas. Autorização desta fase: implementar/testar arquivos no workspace. **Não instalado, não integrado ao runtime, sem E2E Brave/Chrome realizado.** As restrições históricas de implementação da PHASE-01 são superadas somente pela missão PHASE-02 do humano, dentro deste escopo local.

## Executar verificações locais

Node >=22 (validado com v24.22.0). Não exige `npm install`.

```bash
cd apps/mcf-browser-bridge
npm test
npm run check
npm run smoke:host
```

`test` usa `node:test --test-isolation=none`: evita criação de subprocessos pelo runner neste ambiente restrito, sem alterar o sandbox. Testes sintéticos cobrem frames parciais/múltiplos, limites, JSON/UTF-8 inválidos, schema estrito, default deny WRITE/ações desconhecidas, prazo, replay/actionId, troca de contexto, identidade do chamador, sanitização e worker com APIs simuladas. `check` verifica sintaxe JS, permissões MV3 e JSON do template. Não é validação oficial do Chromium nem teste de DOM real.

`smoke:host` preserva a regressão de processo: cópia temporária allowlist, config sintética somente nessa cópia, timeout de 5 s por processo e limpeza ao sair. Verifica host sem config, origem incorreta, hello válido e click negado usando frames nativos uint32 LE. Falha de launcher/sandbox não conta como negação válida: se bloqueado, registrar NOT_RUN e executar separadamente pelo MESTRE sob autorização, sem enfraquecer o sandbox. Nunca escreve no host/config do repositório ou em NativeMessagingHosts.

## Componentes e contrato

- `extension/`: MV3, popup visível, service worker de módulo e função fixa de snapshot em mundo isolado; nenhuma execução de código fornecido por mensagens. Sem content script automático, host permissions ou `<all_urls>`.
- `host/`: Node built-ins, stdio Native Messaging (comprimento uint32 LE), máximo 32 KiB por frame, UTF-8 estrito, sessão de até 60 s/128 ações. Sem shell, eval, listener, CDP, rede, persistência ou logs de conteúdo.
- `extension/contract.js`: contrato v1 com JSDoc, validação e decisão pura reutilizável. Vincula missionId/phaseId/actionId, tabId/documentId/URL/origin, sessão, prazo e orçamento. Só aceita `hello`, `capabilities`, `read-summary`. Pedido extra/desconhecido é negado.
- `host/session.js`: hello vincula alvo e fornece ID aleatório de sessão; requisições seguintes exigem este ID, alvo idêntico e actionId novo. Nova sessão/reinício exige novo hello; não há replay automático. Não é pareamento criptográfico persistente.
- Resultado estruturado: protocolVersion/actionId, state VALIDATED ou DENIED, failureCode, retryable=false; sucesso inclui sessionId, observedTarget, prazo, capabilities e effects=NONE. VALIDATED significa validação local do pedido, **não** receipt canônico MCF nem prova de leitura do browser.
- O host autoriza metadados antes da leitura; **o DOM não passa pelo host**. Só o popup recebe o resumo. O host confia nos metadados da extensão e não observa diretamente a aba.

Reutiliza os princípios de PermissionEngine, ExternalActionDispatcher, AdapterRegistry e browser-actions/evidence, sem importar dependências nem criar MissionRuntime/Registry/Ledger. Futuro adapter poderá mapear contexto para ExternalActionRequest e gerar McfToolReceipt através do dispatcher/evidence canônicos; esta fase não registra provider, skill ou adapter. Sem writes, retries automáticos ou alegação de durable execution.

## Fluxo e limites de consentimento

1. Futuro teste humano em perfil **descartável e separado**, após gate de instalação: abrir `fixtures/bridge-fixture.html` como arquivo local. Nunca usar perfil pessoal/logado nesta fase.
2. Abrir popup, marcar consentimento e clicar **Selecionar aba atual e conectar**. Executa apenas uma sondagem fixa da fixture na frame principal, seguida de hello/capabilities. Não lê o resumo automaticamente.
3. Clicar **Ler resumo**: host valida pedido, worker revalida aba ativa, URL e documentId, executa snapshot fixo na frame principal e revalida antes de entregar resultado.
4. Parar/desconectar, desmarcar consentimento ou fechar popup revoga a sessão. Troca de aba, navegação/loading, remoção da aba, perda de permissão, erro/timeout do host ou reset do worker falha fechado. Expiração de 60 s exige conexão nova. Não há reconexão automática.

P0 aceita somente `file:` sem host, query, fragmento ou credenciais, caminho terminando em `/fixtures/bridge-fixture.html`, com marcador `data-mcf-synthetic-fixture` no documento. Essa restrição é uma convenção de escopo, **não autenticação da página**: outro arquivo pode imitar nome/marcador. Nunca selecionar conteúdo privado. Sites HTTP/HTTPS, páginas internas e lojas de extensões são recusados.

O snapshot percorre até 2000 nós, retorna até 4000 caracteres e título até 160. Exclui forms, inputs, passwords, textarea/select, botões, iframes, scripts, hidden/inert, aria-hidden, contenteditable e ancestrais marcados data-sensitive/data-private/autocomplete; ignora CSS invisível. Limita inspeção de ancestrais a 64 níveis. Reduz padrões comuns de e-mail, números e tokens; URL de evidência é `file:///[LOCAL_FIXTURE]`. Não lê cookies, atributos de valores, armazenamento, shadow DOM ou documentos de iframe. Texto adversarial é rotulado `untrusted`, nunca executado. Não há navegação, click/fill/select/press, screenshot ou upload. Screenshot está **não implementado**, pois captura visual pode expor dados que o DOM não revela.

## Empacotar e carregar futuramente (não realizado)

A pasta `extension/` já é o pacote unpacked, incluindo contract.js e sanitizer.js. Não carregar a raiz do projeto como extensão. Opcionalmente gerar ZIP só dessa pasta, sem host/config/tests:

```bash
cd apps/mcf-browser-bridge/extension
zip -r /tmp/mcf-browser-bridge-extension.zip .
```

ZIP não é instalação unpacked: extrair para diretório dedicado. No futuro perfil descartável Brave: abrir `brave://extensions`, habilitar Developer mode e usar **Load unpacked / Carregar sem compactação** selecionando `extension/`. Anotar o ID exato mostrado; não há ID fixo embutido. Em Details, habilitar **Allow access to file URLs** somente nesse perfil de teste. Sem essa permissão a injeção falha fechada. Não habilitar incognito. Compatibilidade Chrome é intenção MV3, não certificação ou teste executado.

Essas etapas modificam perfil e são **gate humano futuro**, não operações autorizadas/executadas nesta sessão.

## Configurar host manualmente no futuro (não instalar agora)

1. Manter projeto em caminho absoluto estável e somente de confiança. `host/host.js` precisa ser executável (modo Git esperado 100755); conferir ou aplicar `chmod +x apps/mcf-browser-bridge/host/host.js` a partir da raiz do repositório antes de uma instalação futura autorizada. Nenhuma instalação foi realizada. Shebang usa `/usr/bin/env node`: verificar Node >=22 no PATH do processo Brave; para instalação controlada pode-se trocar a primeira linha por shebang com caminho absoluto real do Node. Nunca interpolar código ou comandos recebidos.
2. Criar `host/config.local.json` (ignorado pelo Git) com apenas `{"extensionId":"ID_EXATO_DE_32_LETRAS_a_ATE_p"}`. O host recusa iniciar sem config/ID válido ou sem argumento de origem exato passado pelo browser.
3. Copiar `host/com.mcf.browser_bridge.json.template` para arquivo temporário e substituir `path` pelo caminho absoluto de `host/host.js`, e allowed_origins por **uma** origem exata `chrome-extension://<ID>/`. Não usar wildcard. Nome do host deve continuar `com.mcf.browser_bridge`.
4. Após gate humano, no Linux, colocar esse manifesto como `com.mcf.browser_bridge.json` em `~/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts/` (ou diretório de configuração efetivo do Brave conforme distribuição). Chrome futuro usa `~/.config/google-chrome/NativeMessagingHosts/`. Confirmar diretório com documentação da instalação antes de copiar; não sobrescrever manifesto existente.
5. Reiniciar/recarregar apenas a extensão de teste conforme necessário. Abrir fixture e executar fluxo explícito. Host ausente/config inválida produz DENIED e diagnóstico genérico no popup. Não mostrar paths, URLs integrais ou mensagens arbitrárias de erro.

Native Messaging é transporte **local**, não permite que um serviço cloud envie comandos ao notebook. allowed_origins e argumento de origem conferido são necessários, mas um atacante local capaz de executar Node/ler arquivos pode falsificar argv e executar o host. O token de sessão limita mistura/replay na conexão; **não autentica contra atacante local**. Autenticação forte/chaves/rotação e integração MCF continuam pendentes. Nenhuma fonte externa independente de comandos é exposta pelo host.

## Privacidade, ameaças e limitações

Minimização heurística não garante remoção de PII/segredos em texto livre ou título; marcação maliciosa/ausente pode enganar o filtro. Por isso o único alvo permitido é fixture sintética. URL local completa aparece nos metadados enviados ao host para binding, apenas em memória, sem logs/persistência. Conteúdo aparece no popup e não é retido pela aplicação após fechá-lo; não há garantia de apagamento de memória do browser/OS. O usuário não deve copiar resumos sensíveis para issues/logs.

Injeção é read-only em termos do código do bridge, mas observação de DOM não é transação atômica: página pode mudar durante coleta. documentId/URL são checados antes/depois; mudança de conteúdo no mesmo documento não é detectada. Orçamento de 5 s limita RPC; não há preempção absoluta de chamada síncrona DOM; travamento do renderer pode atrasar execução. STOP invalida retorno e futuros pedidos; não desfaz coleta já iniciada. O código não usa observadores persistentes nem executa ações em page load.

Testes de sanitizer usam DOM sintético mínimo em VM; APIs Chromium, activeTab real, documentIds, lifecycle MV3, validação de manifesto pelo navegador e framing nativo completo de browser **NOT_RUN**. O processo host sem configuração foi chamado diretamente e recusou início; a tentativa original via subprocesso não retornou stderr esperado no ambiente gerenciado. A cobertura de processo foi restabelecida em `npm run smoke:host`, separada dos nove testes unitários; o resultado e a evidência independente do MESTRE estão em VALIDATION.md. Nenhuma proteção foi alterada. Isso não é E2E. Não houve instalação, acesso a contas, rede, publish, commit ou push.

## Rollback futuro

Clicar Parar, fechar popup e remover apenas extensão de teste no perfil descartável. Remover somente manifesto `com.mcf.browser_bridge.json` criado para este projeto no diretório NativeMessagingHosts e `host/config.local.json` correspondente. Não apagar diretório de perfil, outros manifests ou arquivos existentes. Processo stdio termina ao desconectar/EOF ou em até 60 s. Sem serviços, portas, bancos, registro do runtime ou dependências para desfazer.

Referências locais obrigatórias: `../../docs/architecture/MCF-BROWSER-BRIDGE-001-ARCHITECTURE.md`, `../../docs/security/MCF-BROWSER-BRIDGE-001-THREAT-MODEL.md`, `../../docs/superpowers/plans/2026-10-21-mcf-browser-bridge-mvp-plan.md` e `../../artifacts/phases/PHASE-01-BROWSER-BRIDGE-DISCOVERY/`. Não foram consultados GitHub/rede nesta execução.
