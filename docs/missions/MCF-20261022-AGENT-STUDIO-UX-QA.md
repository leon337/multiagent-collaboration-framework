# MCF Agent Studio — Auditoria de UI, UX e acessibilidade (2026-10-22)

**Missão:** [Issue #467](https://github.com/leon337/multiagent-collaboration-framework/issues/467)
**Branch:** `feat/mcf-agent-studio-mvp-001`
**Alvo testado:** código real do MVP servido por Node.js; navegador Brave/Chromium 155 conectado via Chrome DevTools Protocol (CDP).
**Método de interação:** seletores semânticos por IDs e formulários (`promptForm`, `proposalPanel`, `applyBtn`, `testForm`), sem cliques por coordenadas.
**Isolamento:** QA final na porta 4318 com `AGENT_STUDIO_DATA` isolado em `/tmp`. A aplicação de usuário na porta 4317 foi restaurada ao comportamento Hello World! e o perfil ativo DSH não foi modificado.

## Objetivo do usuário

Avaliar como um usuário realiza o ciclo **pedido em linguagem natural → proposta de mudança → comparação visual → aplicação ao rascunho → teste de resposta**, em computador, tablet e celular, com baixo atrito e evidência real.

## Testes executados

| Verificação | Evidência/resultado | Estado |
|---|---|---|
| Desktop 1440x900 | `docWidth=1425`, sem overflow horizontal | PASS |
| Tablet 768x1024 | `docWidth=753`, navegação responsiva ativa | PASS |
| Mobile 390x844 | `docWidth=390`, sem overflow horizontal | PASS |
| Mobile 320x700 | `docWidth=320`, sem overflow horizontal | PASS |
| Fluxo completo de proposta | `proposal.shown=true`; diff de Hello World! para Bom dia! | PASS |
| Mensagem de confirmação | Após correção, comunica **1 alteração**, não 5 campos | PASS |
| Aplicar alteração | Rascunho r1 → r2, resposta salva Bom dia! | PASS |
| Teste imediato | Input `oi` → preview `Bom dia!` | PASS |
| Regras de segurança | `npm test` passou; suíte cobre bloqueio de ferramenta desconhecida, host/origin, rollback, não publicação | PASS |
| JS/sintaxe | `npm run check` passou | PASS |
| Segurança do DSH ativo | Perfil DSH original não alterado pelos testes de rascunho | PASS |
| 9Router com credencial real | Chave válida não fornecida para QA | NÃO TESTADO |
| Publicação no DSH | Fora do MVP, exige fluxo separado de gate | NÃO IMPLEMENTADO |
| Teste em cloud ChatGPT /mnt/data | Rede externa do container sem acesso ao GitHub; transferência direta bloqueada | BLOQUEADO |

## Problemas observados e correções

1. **Navegação móvel desaparecia.** Antes: sidebar oculta abaixo de 900px, sem alternativa. Depois: navegação semântica Estúdio, Versões, Testes no topo em tablet/celular.
2. **Primeira ação muito distante no celular.** Adicionado link `Começar a editar` na abertura, com âncora para o editor sem necessidade de rolagem longa.
3. **Tipografia pequena em textos auxiliares.** Legibilidade ampliada em campos, descrições, controles e mensagens.
4. **Alvos táteis reduzidos.** Ações rápidas, navegação móvel e botões de histórico receberam altura mínima de 44px.
5. **Feedback de alteração enganoso.** Texto antes dizia 5 campos mesmo quando apenas 1 mudava. Agora informa a quantidade real de diferenças.
6. **Contexto de integração ambíguo.** `Agente conectado` alterado para `Agente de referência`, evitando sugerir publicação do rascunho no DSH.
7. **Modo conversacional sem aviso de dependência.** Ajuda inline indica necessidade de modelo no 9Router.
8. **Suporte a teclado/leitores de tela.** Foco visível explícito; chat com `role=log`, `aria-live=polite` e nome acessível.

## Capturas de evidência

- [Desktop após melhorias](./evidence/agent-studio-qa/desktop.png)
- [Mobile 390px após melhorias](./evidence/agent-studio-qa/mobile-390.png)
- [Mobile 320px após melhorias](./evidence/agent-studio-qa/mobile-320.png)
- [Proposta com diff e ações](./evidence/agent-studio-qa/proposal.png)

## Autoavaliação — eu aceitaria e validaria?

| Pergunta | Resposta |
|---|---|
| Um usuário consegue encontrar a ação principal sem instruções? | **Sim**, com CTA Começar a editar no mobile e formulário aberto no desktop |
| É óbvio que alterações são propostas e não publicadas? | **Sim**, rascunho, diff, confirmação e avisos persistentes |
| O layout quebra em tamanhos pequenos? | **Não nos quatro tamanhos testados**; ausência de overflow horizontal confirmada |
| O fluxo principal é executado no navegador real? | **Sim**, CDP com IDs semânticos, atualização de DOM e preview testados |
| Posso dizer que acessibilidade WCAG está totalmente certificada? | **Não**; melhorias e checagens parciais, sem auditoria completa com leitores de tela ou axe-core |
| Posso dizer que o ChatGPT Cloud Sandbox executou o código? | **Não**; isolamento de rede impediu download do GitHub e o sandbox Vercel solicitou projeto externo, que não foi criado |
| Posso garantir integração real com modelos 9Router? | **Não**; falta teste com credencial válida |
| Entregaria para revisão de MVP local? | **Sim**, para laboratório de rascunhos; **não** como versão pronta para produção ou publicação no DSH |

## Evidências e limitações de ambiente

O sandbox Python/Node fornecido nesta conversa (`/mnt/data`) estava disponível e possuía Chromium/Playwright, mas sem conectividade externa com GitHub. Tentativas de clone, acesso raw e download falharam. Uma tentativa alternativa de Vercel Sandbox falhou com `missing required property projectId`; não foi criado projeto externo apenas para contornar a rede. Assim, o teste de renderização com código completo ocorreu em um **perfil temporário de navegador com CDP**, separado do perfil normal, no notebook conectado.

Estes testes não dependem de posições absolutas e são reproduzíveis pelo script CDP de auditoria. O teste não expôs credenciais do usuário nas capturas.

## Decisão

**QA local de UI/UX: APROVADO COM RESSALVAS.** O MVP funciona nas interações e resoluções inspecionadas. Ainda há pendências de QA cloud e integração com IA real; a revisão visual automatizada NÃO equivale a certificação formal WCAG.
