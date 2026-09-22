# PHASE-MCF-ARCHIPELAGO-V1-001

## Contrato

- **missão:** materializar a V1 do MCF Archipelago sem alterar produção;
- **objetivo:** transformar chats/projetos/agentes em ilhas navegáveis de um grafo persistente;
- **boundary:** branch isolada `feat/mcf-archipelago-v1-20260922`;
- **produção:** fora de escopo;
- **autoridade humana final:** LEANDRO;
- **coordenação:** MESTRE.

## Critérios de aceite

- [x] pan/zoom e arraste;
- [x] criação de chat/projeto;
- [x] conexões e agrupamento;
- [x] busca;
- [x] minimapa;
- [x] persistência local;
- [x] painel de conversa local;
- [x] export/import;
- [x] fallback HTML;
- [x] testes automatizados e CI.

## Evidência de fechamento da V1

- sandbox isolado / Node 24: 7/7 testes PASS + syntax checks PASS;
- Windows Revision-PC: 7/7 testes PASS + `index.html` e `src/app.js` HTTP 200 em `127.0.0.1:4173`;
- PR draft: #315;
- SHA funcional inicial: `34a0482cfe056a1fe2c6dc9d625593666222cb9c`;
- correção responsiva/modal: `788a83d41a3803d33ae76d824fc28320bc1ff927`;
- GitHub Actions `MCF Archipelago CI`: run 35719572746 = SUCCESS;
- produção: não alterada;
- integração OpenAI/ChatGPT: explicitamente fora desta V1.

A V1 está qualificada como MVP local/branch para iteração visual. Merge e produção permanecem fora deste boundary.
