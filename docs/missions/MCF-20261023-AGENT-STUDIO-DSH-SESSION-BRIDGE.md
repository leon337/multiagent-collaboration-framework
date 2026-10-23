# Agent Studio — Integração pela sessão do DeepSeek Harness

Missão MCF: https://github.com/leon337/multiagent-collaboration-framework/issues/467
PR: https://github.com/leon337/multiagent-collaboration-framework/pull/468
Data: 23/10/2026

## Decisão
O Agent Studio usa uma sessão dedicada do DSH como backend de IA para interpretar propostas, sem segunda chave API do 9Router.

## Implementação
- Plugin Cordis dsh-session-bridge.mjs utiliza o sessionController nativo.
- Sessão dedicada mcf-studio-brain, isolada das sessões pessoais existentes.
- Ponte 127.0.0.1:4319, autenticada por token efêmero privado, arquivo 0600 em .data, nunca exposto ao navegador.
- POST /api/propose com useAi:true aciona a sessão. GET /api/dsh/status exibe conectividade; checkbox IA/DSH vem marcado no frontend.
- O caminho direto 9Router permanece opcional. Publicação no preset real segue com revisão, confirmação, backup e rollback.

## Validação real
- Sessão DSH criada: session-e84abd98-935c-4f14-b842-727d54c51e9d, preset mcf-studio-brain.
- Chamada direta à sessão gerou mudanças JSON: resposta Olá do DSH, tempo 1,31s.
- Chamada através do Studio /api/propose: HTTP 200, resposta solicitada DSH conectado diretamente, tempo 1,09s; rascunho original mantido.
- Teste Brave via CDP sem coordenadas: Sessão DSH conectada, checkbox marcado, proposta e diff renderizados sem exceções JavaScript.
- Captura: evidence/agent-studio-real/studio-dsh-session-connected.png
- npm test: 5/5; npm run check: aprovado.
- Controle de acesso: 403 sem token; arquivo token 0600; futuras publicações preservam registros da ponte no perfil Web.

## Limites
- Esta sessão serve à INTERPRETAÇÃO de solicitações de edição. O agente modificado é validado em nova sessão DSH após publicação.
- A prévia local conversacional do modo instructed ainda usa o caminho opcional 9Router.
- O MVP não instala ferramentas arbitrárias nem executa código retornado pela IA.
- Nenhuma credencial 9Router foi lida, copiada ou publicada. A ponte e a aplicação permanecem limitadas a localhost.
