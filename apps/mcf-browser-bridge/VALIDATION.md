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
