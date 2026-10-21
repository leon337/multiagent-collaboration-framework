# PHASE-03 — correção de regressão GUI e governança, 2026-10-21

O MESTRE relatou duas execuções reais bloqueadas em `SUMMARY_ENABLED_TIMEOUT` após CONNECTED. Causa confirmada: o reset inicial emitia REVOKED e o popup desmarcava o consentimento humano. Essa evidência é FAIL para o diff anterior PHASE-03; não altera a evidência histórica PHASE-02.

Correção: connect invalida a lease/generation, limpa timer, desliga delegação e desconecta o port antigo, mas notifica `SESSION_RESET`. O popup limpa/desabilita controles de leitura durante o reset sem desmarcar o consentimento humano. STOP, fechamento, drift, erro e expiração continuam em REVOKED. `tests/popup.test.js` executa o código real de popup em VM ligado ao worker real com APIs Chrome simuladas: consentimento → connect → resumo habilitado → leitura; opt-in seguido de reconexão desconecta o host anterior e elimina delegação; STOP e troca de aba desmarcam consentimento/desabilitam leitura. Não houve alteração do harness para ignorar disabled.

Governança adicional: `agent_read_denied` tem schema estrito e enum de códigos, sem mensagens arbitrárias. Broker encaminha negação correspondente para IPC sem encerrar stdio; respostas válidas stale/duplicadas são ignoradas. Resposta no limite do deadline vira TIMEOUT. Callback do timer verifica identidade do pending para não limpar outro pedido. Worker só envia negação se a lease ainda é a atual; depois de revogação já processada não envia resposta. Revogação do broker nega pedido pendente, limpa token/socket próprios e permite flush de saída limitada antes de fechar clientes, sem manter listener ativo. Mensagens malformadas/desconhecidas continuam fail-closed.

Resultados após correção:

- `npm test`: PASS, **18 testes: 17 PASS, 1 skipped NOT_RUN**, 0 falhas. Inclui testes negativos de denial schema/código, stale/duplicate, timeout/revoke, drift com negação tipada e supressão após revogação.
- `npm run check`: PASS.
- `npm run smoke:host`: NOT_RUN, exit 1 por `spawnSync /usr/bin/node EPERM` antes de executar o host.
- Probe isolado `Xvfb -displayfd 1 -screen 0 800x600x24 -nolisten tcp`: setup não qualificado, `spawnSync` retornou `ENOBUFS`, status null, SIGTERM. Não se atribui causa sem diagnóstico adicional. `e2e:brave` e `e2e:agent`: **NOT_RUN nesta correção**, conforme orientação de só tentar após Xvfb permitido/funcional. MESTRE deve reexecutar ambos fora deste ambiente.
- IPC real: continua NOT_RUN por negação do listen Unix no sandbox. Testes reais adicionais de negação, duplicação e timeout foram acrescentados mas não são contados como executados.

Arquivos desta correção: `extension/background.js`, `extension/popup.js`, `extension/agent-contract.js`, `host/agent-broker.js`, `tests/agent.test.js`, `tests/worker.test.js`, novo `tests/popup.test.js`, `README.md`, `VALIDATION.md`. Sem instalação, conta/perfil pessoal, commit ou push. Aceitação GUI PHASE-03 permanece pendente até novo PASS real do MESTRE.

---

# PHASE-03 — validação atual, 2026-10-21

Branch `feat/mcf-browser-bridge-001-local-agent`, base informada `c343069343259b03165340101b5ba73d897beb99`. Alterações limitadas a `apps/mcf-browser-bridge`. Sem commit, push, instalação, alteração de perfil/manifesto pessoal ou dependências/lockfile. A evidência histórica real Brave/CI da PR #458 abaixo é preservada; **não qualifica este diff PHASE-03**.

| Comando / prova | Resultado desta execução Codex |
| --- | --- |
| `npm test` | PASS: 16 testes, 15 PASS, 0 falhas, 1 skipped explicitamente NOT_RUN |
| `npm run check` | PASS: sintaxe JS/CJS, permissões MV3 e template JSON |
| Unix IPC real em `tests/agent.test.js` | NOT_RUN: sandbox negou `listen` em socket Unix (EPERM/EACCES); não é prova de transporte |
| `npm run smoke:host` | NOT_RUN: `spawnSync /usr/bin/node EPERM`, exit 1 no primeiro caso |
| `npm run e2e:brave` | NOT_RUN: `OPTIONAL_PUPPETEER_CORE_UNAVAILABLE`, exit 1, checks vazios |
| `npm run e2e:agent` | NOT_RUN: mesma dependência opcional indisponível, exit 1, checks vazios |
| Qualificação externa PHASE-03 / revisão independente | PENDENTE, reservada ao MESTRE |

Nenhum safeguard foi desabilitado e nenhum pacote foi instalado para contornar os bloqueios. Testes de schema/gate sintético usam a mesma função de autorização chamada pelo receptor real. Cobrem ausência/revogação do grant, token forjado, replay, expiração, concorrência, writes e campos extras. Testes de diretório cobrem modo inseguro, symlink, caminho não normalizado, ausência de arquivos antes de allow e preservação de entrada existente. Framing cobre JSON/UTF-8 inválidos, oversize e truncamento. O teste real de socket contém asserções de modo 0600, roteamento, token/replay/busy/expiry, payload malformado/oversize e cleanup, mas não executou essas asserções neste sandbox.

Worker simulado: testes controlados suspendem sondagem de contexto e retorno de snapshot, revogam via STOP/fechamento/troca de aba e só depois liberam a Promise. Antes de agendar: zero snapshots; após agendar: resultado suprimido. Incluem pedido antes de opt-in, consentRef falso, prazo vencido, replay, concorrência, schema extra e sucesso sintético. RPC é testado separadamente: mensagem espontânea tipada não resolve/rejeita RPC pendente; tipo desconhecido, schema malformado e origem HTTP são rejeitados. Os dez testes anteriores continuam na suíte sem remoção de safeguards.

Arquivos novos: `extension/agent-contract.js`, `host/agent-broker.js`, `scripts/agent-read-fixture.cjs`, `tests/agent.test.js`. Arquivos modificados: `extension/background.js`, `extension/contract.js`, `extension/popup.html`, `extension/popup.js`, `host/host.js`, `package.json`, `scripts/e2e-brave-disposable.cjs`, `scripts/smoke-host.js`, `tests/worker.test.js`, `README.md`, `VALIDATION.md`.

Revisão necessária: lifecycle real de popup/MV3/Native Messaging, startup/EOF durante bind, permissões e cleanup de Unix socket no sistema real, roteamento e deadlines com CLI real. Mesmo UID malicioso fora de escopo; symlink/inode checks não garantem ausência de todas as corridas de pathname. SIGKILL/energia podem deixar artefatos e não há stale-socket recovery automática. Não há autenticação forte de host contra processo local do mesmo UID. Resumo é não confiável, redação heurística e 4000 caracteres referem-se ao campo text; título/metadados são separados. STOP não desfaz snapshot já agendado. Sem autorização para contas reais, produção, transporte remoto ou registro no runtime.

MESTRE deve executar todos os comandos da seção PHASE-03 do README fora do sandbox, revisar todos os diffs e só então preparar PR draft; este trabalho não cria PR. A CLI e o harness opcional estão implementados, **a prova E2E PHASE-03 ainda não foi obtida**.

---

# Validação local — 2026-10-21

Ambiente Codex: Node v24.22.0; branch `feat/mcf-browser-bridge-001-mvp`.

## Codex — testes locais

- `npm test`: PASS, 10 testes unitários/simulados, 0 falhas, 0 skipped. Reexecutado após a correção P2 de revogação; os nove testes anteriores permanecem verdes.
- `npm run check`: PASS — sintaxe JavaScript (incluindo scripts/smoke-host.js), permissões MV3 e JSON do template. Reexecutado após as correções.
- `node --check scripts/smoke-host.js`: PASS.
- `npm run smoke:host`: **NOT_RUN — bloqueado pelo sandbox**, comando terminou com exit 1 no primeiro caso: `spawnSync /usr/bin/node EPERM`. Nenhum dos quatro casos de processo é contabilizado como PASS pelo Codex. Nenhuma proteção foi desabilitada. O script permanece disponível como cobertura de regressão para execução autorizada separada pelo MESTRE.
- O smoke exige que o host realmente execute: além de exit nonzero/stdout vazio, verifica diagnóstico específico nas negações de startup. EPERM, timeout ou outro erro de launcher falha, não gera falso verde. Usa uma cópia temporária explícita dos arquivos necessários, ID sintético, config só na cópia, frames uint32 LE, timeout de 5 s/processo e limpeza ao sair. Nenhum config do repositório ou manifesto do usuário é criado/alterado.
- Worker test usa APIs simuladas, incluindo negação sem consentimento, troca de tab/document, falta de permissão, mudança durante coleta, fechamento do popup, STOP, origem insegura, sender forjado e reinício volátil.
- `host/host.js`: permissões de arquivo 0755 (bit executável presente; modo Git esperado 100755 quando o MESTRE adicionar o arquivo). Não foi feito staging/commit para registrar esse modo no índice.

## Correção de segurança P2 — revogação durante current()

- Achado confirmado: a versão anterior podia agendar snapshot após STOP/fechamento do popup ocorrido enquanto a segunda checagem current() aguardava retorno. Rejeitar o resultado depois da coleta era insuficiente.
- `extension/background.js`: assertLease confere identidade da lease, geração e, após pareamento, presença de sessão e expiração. As verificações ocorrem após cada espera no fluxo de leitura/conexão e dentro de current(), inclusive após tabs.query e a sondagem de URL. Há uma verificação síncrona imediatamente antes do executeScript(snapshot), sem await intermediário. Revogação aborta o fluxo sem agendar nova coleta ou reconectar automaticamente.
- `tests/worker.test.js`: teste determinístico usa Promises controladas para suspender executeScript da checagem current(), revogar consentimento e só então liberar o retorno. Cobre STOP, fechamento do popup e troca de aba em ambos os current() anteriores à captura (seis combinações). Todas retornam DENIED, com **zero chamadas executeScript(snapshot)**, inclusive em nova tentativa sem consentimento.
- Evidência Codex: `npm test` PASS (10/10, 0 skipped); `npm run check` PASS. Sem timers de espera no teste de corrida; timeout de teste de 3 s limita eventual travamento.
- Limite preservado: não se alega cancelamento de uma operação já agendada antes da revogação, nem qualificação real Chromium. A correção impede novo agendamento após revogação processada pelo worker e descarta resultados de operações em andamento.
- Nenhuma extensão instalada, perfil real acessado, commit ou push realizado nesta correção. Smoke de processo não foi repetido por não haver alteração no host; seu bloqueio anterior permanece registrado acima.

## MESTRE — evidência independente informada

O MESTRE relatou no follow-up de governança que executou fora do sandbox do Codex um smoke de quatro casos em cópia descartável em /tmp, sem extensão real ou credenciais:

1. Host sem configuração: DENIED.
2. Origem incorreta: DENIED.
3. Frame nativo hello válido: VALIDATED.
4. Tentativa de click: ACTION_POLICY_DENIED.

Resultado informado: **4/4 PASS**. Atribuição: relato direto do MESTRE nesta conversa; não execução ou observação independente pelo Codex. Isso precede a criação de scripts/smoke-host.js e não constitui execução desse novo script. O MESTRE poderá repetir a regressão com `npm run smoke:host` via Desktop Commander autorizado. Nenhum desses testes é E2E de browser.

## Histórico e limites

- Na execução inicial, host chamado diretamente sem config recusou início com `Bridge configuration/caller denied.`, exit 1 e nenhum frame stdout.
- A tentativa inicial de `node --test` com isolamento padrão falhou no subprocesso sem diagnóstico útil. O teste original de processo do host também falhou porque stderr veio vazio e foi removido da suíte unitária. A cobertura de processo está agora restaurada como smoke separado, sem ocultar a limitação de execução local. O runner unitário em processo único passou; nenhuma proteção do sandbox foi desabilitada.
- Brave/Chrome UI, instalação, Native Messaging browser↔host e arquivo em DOM real: **NOT_RUN**, gate humano futuro.
- README exige explicitamente habilitar acesso a file:// na extensão Brave em futuro perfil de teste descartável. Screenshots estão fora do MVP/não implementados.
- Sem contas, rede, adaptação do runtime, instalação, commits ou push.

Leia README para riscos residuais e instalação/rollback manuais futuros. Não há alegação de certificação ou revisão independente do código.

## PHASE-02B — harness E2E Brave descartável

Evidência externa informada pelo MESTRE nesta continuação: E2E real bem-sucedido em Brave 155, Linux Mint leo-N43SM, Xvfb/Metacity, perfil efêmero e XDG_CONFIG_HOME temporário. O atalho de teste `_execute_action` Alt+Shift+M concedeu activeTab real; popup CONNECTED, resumo VALIDATED com catálogo/caderno sintético e e-mail redigido, seguido de STOPPED. Nenhum perfil ou manifesto pessoal foi alterado, conforme relato do MESTRE. O script `/home/leo/.cache/mcf-browser-e2e-v10.cjs` foi lido somente como referência; não foi alterado/executado pelo Codex. Este relato atualiza o histórico NOT_RUN de browser da PHASE-02, mas não prova execução do novo harness.

Implementação nova: `scripts/e2e-brave-disposable.cjs`, exposta por `npm run e2e:brave`, opcional e fora da suíte unitária/CI. Zero dependências de produção novas. Clones, perfil, HOME/XDG, host/config e manifesto ficam somente na árvore temporária. O script usa shortcut real e CDP do popup por pipe, sem modificar comportamento da extensão de produção. Testa CONNECTED → VALIDATED/redação/exclusões → STOPPED/resumo desabilitado. Timeout e cleanup de processos próprios/temporários estão implementados.

Tentativa Codex do novo comando com módulo Puppeteer já disponível (sem instalação): **setup FAIL**, exit 1, JSON `phase=isolated-display`, `reason=XVFB_EXITED`, checks vazios. Xvfb encerrou antes de fornecer o número de display; a segunda tentativa com captura/classificação de stderr também não forneceu diagnóstico de permissão. **Casos de browser do novo harness: NOT_RUN**; Brave não chegou a ser lançado. Não se afirma causa sandbox sem diagnóstico que a comprove, nem sucesso desta execução. Nenhuma proteção foi desabilitada. MESTRE poderá executar o comando documentado em seu ambiente autorizado externo ao sandbox.

Verificações locais após implementação: `npm test` PASS (10/10); `npm run check` PASS, agora incluindo sintaxe `.cjs`; `node --check scripts/e2e-brave-disposable.cjs` PASS. Nenhum workflow criado, pacote instalado, commit ou push feito pelo Codex.

## MESTRE — QUALIFICAÇÃO GUI REAL NO BRAVE (evidência pós-Codex, 21/10/2026)

O MESTRE executou diretamente no `leo-N43SM`, fora do sandbox do Codex, o script versionável novo `npm run e2e:brave` com `PUPPETEER_CORE_PATH` apontando para o `puppeteer-core` já disponível no notebook (nenhuma instalação nova). **Resultado executado: PASS / exit 0.**

Saída estruturada observada (identificador sintético, sem credenciais):
```json
{"test":"e2e-brave-disposable","status":"PASS","disposable":true,"checks":["CONNECTED","VALIDATED","SYNTHETIC_PUBLIC_TEXT","REDACTED_EMAIL","NO_SENSITIVE_SENTINELS","STOPPED","SUMMARY_DISABLED"],"browser":"Chrome/155.0.8059.80"}
```

* A execução usou o Brave (Chromium 155) de verdade, com display Xvfb dinâmico, Metacity, perfil e HOME/XDG/NativeMessagingHosts descartáveis; a extensão carregada foi um clone com atalho de teste para conceder `activeTab` por gesto real. O worker, a UI do popup e o processo Native Messaging do projeto foram exercitados. Nenhuma página autenticada, sessão pessoal, tunnel ou site externo foi acessado.
* As 7 verificações **PASS** referem-se apenas à fixture sintética. A mensagem adversarial apareceu como texto `untrusted`, sem execução; o endereço sintético foi redigido; conteúdo de formulário e marcadores privados não vazaram na resposta.
* O novo script encerrou os processos próprios e removeu seus dados temporários. Também foram eliminadas as dez árvores temporárias **criadas exclusivamente pelos testes diagnósticos anteriores do MESTRE**, após confirmação de propriedade e inexistência de instâncias em execução. Nenhum perfil pessoal foi apagado.
* A tentativa anterior do Codex com o mesmo harness sob sandbox, marcada `NOT_RUN` acima por encerramento prematuro do Xvfb, permanece registrada como evento histórico. **O teste real repetido fora do sandbox passou**. Não se deve confundir essas duas execuções.
* Limites: não há ainda receipt no ledger canônico, adapter habilitado, controle remoto cloud→host, homologação no perfil real do usuário ou autorização de produção. Este resultado não aprova automação em contas reais.
