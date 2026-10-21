# Validação local — 2026-10-21

Ambiente Codex: Node v24.22.0; branch `feat/mcf-browser-bridge-001-mvp`.

## Codex — testes locais

- `npm test`: PASS, 9 testes unitários/simulados, 0 falhas, 0 skipped. Reexecutado após as correções de aceitação.
- `npm run check`: PASS — sintaxe JavaScript (incluindo scripts/smoke-host.js), permissões MV3 e JSON do template. Reexecutado após as correções.
- `node --check scripts/smoke-host.js`: PASS.
- `npm run smoke:host`: **NOT_RUN — bloqueado pelo sandbox**, comando terminou com exit 1 no primeiro caso: `spawnSync /usr/bin/node EPERM`. Nenhum dos quatro casos de processo é contabilizado como PASS pelo Codex. Nenhuma proteção foi desabilitada. O script permanece disponível como cobertura de regressão para execução autorizada separada pelo MESTRE.
- O smoke exige que o host realmente execute: além de exit nonzero/stdout vazio, verifica diagnóstico específico nas negações de startup. EPERM, timeout ou outro erro de launcher falha, não gera falso verde. Usa uma cópia temporária explícita dos arquivos necessários, ID sintético, config só na cópia, frames uint32 LE, timeout de 5 s/processo e limpeza ao sair. Nenhum config do repositório ou manifesto do usuário é criado/alterado.
- Worker test usa APIs simuladas, incluindo negação sem consentimento, troca de tab/document, falta de permissão, mudança durante coleta, fechamento do popup, STOP, origem insegura, sender forjado e reinício volátil.
- `host/host.js`: permissões de arquivo 0755 (bit executável presente; modo Git esperado 100755 quando o MESTRE adicionar o arquivo). Não foi feito staging/commit para registrar esse modo no índice.

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
