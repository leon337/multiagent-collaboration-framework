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
- O host autoriza metadados antes da leitura; **no modo manual PHASE-02 o DOM não passa pelo host**. Só o popup recebe o resumo. O host confia nos metadados da extensão e não observa diretamente a aba.

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

Native Messaging é transporte **local**, não permite que um serviço cloud envie comandos ao notebook. allowed_origins e argumento de origem conferido são necessários, mas um atacante local capaz de executar Node/ler arquivos pode falsificar argv e executar o host. O token de sessão limita mistura/replay na conexão; **não autentica contra atacante local**. Autenticação forte/chaves/rotação e integração MCF continuam pendentes. No modo padrão, nenhuma fonte externa independente de comandos é exposta pelo host. A exceção opt-in fixture-only PHASE-03 está descrita abaixo.

## Privacidade, ameaças e limitações

Minimização heurística não garante remoção de PII/segredos em texto livre ou título; marcação maliciosa/ausente pode enganar o filtro. Por isso o único alvo permitido é fixture sintética. URL local completa aparece nos metadados enviados ao host para binding, apenas em memória, sem logs/persistência. Conteúdo aparece no popup e não é retido pela aplicação após fechá-lo; não há garantia de apagamento de memória do browser/OS. O usuário não deve copiar resumos sensíveis para issues/logs.

Injeção é read-only em termos do código do bridge, mas observação de DOM não é transação atômica: página pode mudar durante coleta. documentId/URL são checados antes/depois; mudança de conteúdo no mesmo documento não é detectada. Orçamento de 5 s limita RPC; não há preempção absoluta de chamada síncrona DOM; travamento do renderer pode atrasar execução. STOP invalida retorno e futuros pedidos; não desfaz coleta já iniciada. O código não usa observadores persistentes nem executa ações em page load.

Testes de sanitizer usam DOM sintético mínimo em VM; APIs Chromium, activeTab real, documentIds, lifecycle MV3, validação de manifesto pelo navegador e framing nativo completo de browser **NOT_RUN**. O processo host sem configuração foi chamado diretamente e recusou início; a tentativa original via subprocesso não retornou stderr esperado no ambiente gerenciado. A cobertura de processo foi restabelecida em `npm run smoke:host`, separada dos nove testes unitários; o resultado e a evidência independente do MESTRE estão em VALIDATION.md. Nenhuma proteção foi alterada. Isso não é E2E. Não houve instalação, acesso a contas, rede, publish, commit ou push.

## Rollback futuro

Clicar Parar, fechar popup e remover apenas extensão de teste no perfil descartável. Remover somente manifesto `com.mcf.browser_bridge.json` criado para este projeto no diretório NativeMessagingHosts e `host/config.local.json` correspondente. Não apagar diretório de perfil, outros manifests ou arquivos existentes. Processo stdio termina ao desconectar/EOF ou em até 60 s. Sem serviços, portas, bancos, registro do runtime ou dependências para desfazer.

Referências locais obrigatórias: `../../docs/architecture/MCF-BROWSER-BRIDGE-001-ARCHITECTURE.md`, `../../docs/security/MCF-BROWSER-BRIDGE-001-THREAT-MODEL.md`, `../../docs/superpowers/plans/2026-10-21-mcf-browser-bridge-mvp-plan.md` e `../../artifacts/phases/PHASE-01-BROWSER-BRIDGE-DISCOVERY/`. Não foram consultados GitHub/rede nesta execução.

## PHASE-02B — E2E Brave descartável e opcional

`npm run e2e:brave` executa `scripts/e2e-brave-disposable.cjs`, fora da suíte unitária/CI. Requer Linux, Node 24, Brave com suporte a extensão unpacked, Xvfb com `-displayfd`, Metacity, wmctrl e Python3 com Xlib/XTest. `puppeteer-core` é dependência **opcional já existente**, resolvida por `PUPPETEER_CORE_PATH` (caminho para módulo exportado/instalado) ou `require('puppeteer-core')`. O projeto não instala pacotes nem adiciona dependências de produção. Defina `BRAVE_EXECUTABLE_PATH` se o executável não estiver em `/usr/bin/brave-browser`.

Exemplo, usando uma instalação previamente autorizada do módulo:

```bash
cd apps/mcf-browser-bridge
PUPPETEER_CORE_PATH=/caminho/para/node_modules/puppeteer-core \
BRAVE_EXECUTABLE_PATH=/caminho/para/brave npm run e2e:brave
```

O harness cria exclusivamente uma árvore `mkdtemp` em `/tmp`: perfil Brave novo, HOME e diretórios XDG isolados, clones da extensão/fixture/host, configuração de ID e manifesto Native Messaging em `XDG_CONFIG_HOME/BraveSoftware/Brave-Browser/NativeMessagingHosts`. O ID exato é obtido do service worker real. Não copia config.local.json do repositório e não toca perfis ou manifests pessoais. O clone do host usa shebang com o Node atual. Xvfb reserva atomicamente um display livre, com TCP desabilitado; Metacity e a simulação de teclas usam apenas esse DISPLAY. O script fecha browser, encerra os processos próprios e remove a árvore temporária em sucesso/falha/sinais tratáveis. SIGKILL, queda do host ou energia não permitem garantir cleanup; não há opção de preservar perfil. Prazo global: 90 s, mais cleanup limitado; processos auxiliares e etapas têm timeouts próprios. Nenhum flag de desativação do sandbox é utilizado.

A única alteração no clone da extensão é o comando `_execute_action` com `Alt+Shift+M`; o código da extensão de produção permanece intacto. Um marcador visível `FORM_SECRET` é acrescentado somente dentro do form da fixture clonada para testar exclusão. Se necessário, o harness habilita explicitamente acesso a file:// na tela de detalhes da extensão **nesse perfil descartável**; recusa continuar se não conseguir comprovar a permissão. Mudanças de UI Chromium podem exigir atualizar esse seletor de teste.

O popup deve ser aberto pelo atalho real via XTest com a janela Brave em foco. `chrome.action.openPopup()` programático **não concede activeTab** e não é usado como prova de E2E. Como Target.page() pode retornar null, o script usa `target.createCDPSession()` e `Runtime.evaluate` para operar o DOM do popup. CDP é ferramenta exclusiva deste harness de teste (transporte Puppeteer por pipe, sem listener CDP); não é adicionado ao bridge/host. Nenhuma URL HTTP é navegada/fetched pelo teste; a fixture é file:// e não há login, conta, screenshot ou upload. Flags reduzem tráfego de background do browser, sem alegação de isolamento de rede do sistema operacional.

O sucesso exige CONNECTED, resumo VALIDATED com título/texto público sintético, `[REDACTED_EMAIL]`, ausência de todos os marcadores privados e STOPPED com resumo desabilitado/consentimento desmarcado. A saída é JSON com estados e nomes de checks, sem DOM integral, segredos ou logs arbitrários de subprocessos. `PASS` só após todas as asserções e cleanup; dependência ausente/permissão de processo negada produz NOT_RUN e exit nonzero; falha de setup/asserção produz FAIL e exit nonzero. Casos de política e entrada inválida permanecem em `npm test`/`npm run smoke:host`, separadamente.

O MESTRE informou sucesso real prévio em Brave 155 com harness de referência e perfil efêmero; isso é evidência atribuída ao MESTRE, não execução deste novo script. Consulte VALIDATION.md para o resultado local atual e não confunda sucesso anterior com qualificação automática de versões futuras. As afirmações NOT_RUN das seções PHASE-02 anteriores descrevem a execução original, antes desta continuação autorizada.


## PHASE-03 — LOCAL MESTRE IPC, fixture-only (protótipo)

Esta seção descreve a implementação local atual. As instruções e evidências PHASE-02 acima são históricas. Não é um adapter aprovado de produção, não registra ExternalActionAdapter e não altera PermissionEngine, Agent Registry, runtime, ledger ou receipts. O token concede somente leitura do snapshot fixo da fixture, sem scripts, URLs ou comandos fornecidos pelo agente. Não há HTTP/TCP/transporte remoto, elevação, shell, writes de browser ou screenshot. A única persistência do protocolo é o arquivo temporário de capacidade, sem texto da página.

Estados: `DISCONNECTED → PAIRED → AGENT_ALLOWED → READING → AGENT_ALLOWED`; STOP, fechamento do popup, troca/navegação/remoção da aba, desconexão, erro de protocolo, reinício do worker ou expiração levam a `REVOKED`. A lease continua limitada aos 60 s da sessão original, sem renovação. O opt-in separado **Autorizar leitura local pelo MESTRE nesta fixture** inicia desmarcado e só fica disponível depois do pareamento ordinário; o popup precisa permanecer aberto. O estado `agent read allowed` e sua revogação são visíveis no popup. Desmarcar a autorização revoga a sessão toda. Reabrir/reiniciar exige novo pareamento e novo opt-in.

Sem `MCF_BRIDGE_AGENT_SOCKET_DIR`, o host mantém somente stdio e a leitura manual. Mesmo com a variável definida, nenhum socket nem arquivo de token é criado antes do opt-in. A variável deve apontar para diretório absoluto existente, normalizado, de caminho curto (até 70 bytes UTF-8), pertencente ao UID atual e com modo exatamente 0700. Componentes symlink são recusados; o inode do diretório é conferido antes de criar/limpar arquivos. Os ancestrais podem incluir `/tmp`; a exigência 0700 é para o diretório privado final. São reservados `mcf-agent.sock` e `mcf-agent-capability.json`; qualquer entrada existente nesses nomes impede a ativação, sem overwrite ou recuperação automática de socket antigo. Socket e arquivo são criados 0600, com token aleatório de 256 bits somente durante a lease. Cleanup explícito só remove entradas cujos device/inode correspondem aos criados pelo broker. Após SIGKILL/queda podem sobrar arquivos: usar outro diretório descartável, sem apagar entradas desconhecidas.

CLI → host: frame Native Messaging uint32 LE + JSON estrito, missionId `MCF-BROWSER-BRIDGE-001`, phaseId `PHASE-03`, actionId UUID novo, somente `read-summary`, token e prazo até 5 s. O host verifica capacidade, TTL, replay e single-flight, e envia `agent_read_request` no port existente com alvo exato, consentRef aleatório vinculado à capacidade e budget fixo (4000 caracteres/2000 nós). O worker separa mensagens espontâneas do RPC, rejeita mensagens desconhecidas/malformadas, exige `agentDelegation`, revalida lease/aba/documento/origem antes de agendar snapshot e após cada await, e retorna `agent_read_result`. O host aceita apenas o resultado correspondente, dentro do prazo e schema, e entrega à CLI. Não há replay automático, retry ou execução arbitrária. Leitura manual e delegada compartilham o bloqueio de captura; concorrência no worker revoga a sessão de forma conservadora.

A CLI usa apenas Node core, um pedido por conexão e prazo total de 5 s; imprime somente o resumo validado (`text` até 4000 caracteres, `untrusted=true`) em stdout. Falhas produzem diagnóstico genérico em stderr e exit 1. O token nunca deve ser impresso ou anexado a logs/issues. Conteúdo continua não confiável e a redação continua heurística. **Malware local do mesmo UID está fora do modelo de ameaça:** esse usuário pode ler a capacidade e interferir nos arquivos/processos. As verificações de inode/symlink não são uma garantia contra esse adversário nem uma implementação race-free de openat/openat2. O host e a extensão continuam sendo componentes locais confiáveis, e a identidade nativa não é autenticação forte contra processos do mesmo usuário.

Para a qualificação descartável pelo MESTRE, sem instalar dependências:

```bash
cd apps/mcf-browser-bridge
npm test
npm run check
npm run smoke:host
PUPPETEER_CORE_PATH=/caminho/existente/puppeteer-core npm run e2e:brave
PUPPETEER_CORE_PATH=/caminho/existente/puppeteer-core npm run e2e:agent
```

`e2e:agent` usa o mesmo Xvfb/Metacity/perfil/HOME/XDG descartáveis e shortcut real Alt+Shift+M. Configura um diretório IPC 0700 apenas na árvore temporária, pareia, confirma ausência de socket antes do opt-in, aciona o checkbox do popup, executa a CLI enquanto ele fica aberto e verifica texto sintético, redação e exclusões. Depois clica STOP, espera remoção dos arquivos e exige negação da próxima CLI. A saída do harness contém só nomes de checks; o resumo da CLI é capturado em memória e não impresso. O modo `e2e:brave` remove qualquer variável IPC herdada e mantém a qualificação manual original.

Para invocar uma leitura durante uma sessão **descartável** preparada pelo MESTRE (o host deve herdar a mesma variável antes do lançamento do Brave):

```bash
MCF_BRIDGE_AGENT_SOCKET_DIR=/tmp/diretorio-privado-descartavel \
  node scripts/agent-read-fixture.cjs
# Alternativamente: node scripts/agent-read-fixture.cjs /tmp/diretorio-privado-descartavel
```

O diretório precisa já existir 0700; isso não inicia host/browser nem concede consentimento. Abra a fixture no Brave descartável, pareie e marque a autorização separada no popup. O harness completo faz essas etapas e remove tudo ao terminar; não permite anexar a perfis pessoais.

Limites: revogação lógica no worker é síncrona quando o evento é processado; a remoção do socket acompanha a desconexão/EOF do transporte, não uma garantia de latência zero do sistema operacional. STOP descarta resultados de coleta em curso, sem alegar cancelamento de executeScript já agendado. Renderer travado/event loop suspenso pode atrasar timers, mas cada novo agendamento/resultado verifica o prazo. O prazo de 5 s da CLI não garante preempção do renderer. Mudanças no conteúdo do mesmo documento continuam sem detecção transacional. Qualificação real PHASE-03 e revisão independente são gates pendentes, detalhados em VALIDATION.md.


### Correção de conexão e falhas PHASE-03

`SESSION_RESET` invalida integralmente a sessão anterior ao reconectar, preservando apenas o checkbox humano recém-marcado; delegação nunca é herdada. `REVOKED` continua desmarcando consentimento em STOP/drift/fechamento/expiração. O teste de integração popup/worker carrega o popup real, incluindo a lógica de habilitação dos botões.

`agent_read_denied` retorna somente códigos enumerados (`CONSENT_REQUIRED`, `CONTEXT_CHANGED`, `EXPIRED`, `INVALID_RESULT`, `BUSY`, `TIMEOUT`). Broker encaminha a negação para o pedido IPC correspondente sem falhar stdio; respostas válidas atrasadas/duplicadas são ignoradas. Deadline vencido não aceita summary. Revogação do broker nega o pending e remove seus artefatos; mensagens inválidas continuam encerrando a sessão. Consulte a correção mais recente em VALIDATION.md: os testes locais passam, mas a regressão GUI relatada pelo MESTRE ainda exige nova qualificação real.
