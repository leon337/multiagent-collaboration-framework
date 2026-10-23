# MCF Agent Lab — Chat real do Hello World Agent

**Data:** 23/10/2026
**Missão:** [#467](https://github.com/leon337/multiagent-collaboration-framework/issues/467)
**PR draft:** [#468](https://github.com/leon337/multiagent-collaboration-framework/pull/468)
**Aplicação:** http://127.0.0.1:4317/lab, serviço local `mcf-agent-studio.service`.

## Plano

Entregar um chat web para testar o **preset real publicado** do Hello World Agent, sem chave adicional do 9Router e sem interferir na sessão de planejamento do Agent Studio. Persistir a conversa, oferecer nova sessão real e mostrar a distinção entre rascunho e configuração publicada. Exigir confirmação para limpar histórico.

## Arquitetura implementada

A UI responsiva `lab.html`, `lab.css`, `lab.js` está integrada ao servidor existente. O navegador só acessa as rotas `/api/lab/status`, `/api/lab/message`, `/api/lab/reset`. O plugin Cordis `dsh-session-bridge-v3.mjs` usa o serviço interno `sessionController` para enviar mensagens ao `hello-world-agent` em uma **sessão dedicada**, distinta do planejador `mcf-studio-brain`. O DSH mantém modelo e autenticação. O token da ponte permanece exclusivamente no backend e a porta 4319 é restrita a localhost.

O identificador e até 80 mensagens ficam em `.data/dsh-trainee-session.json` com permissão 0600 (não versionado). A interface recupera o histórico após refresh e a sessão após reinício do processo DSH. Uma nova conversa descarta o histórico deste laboratório e só então cria outro ID.

## ESEV e verificações reais

1. MESTRE inspecionou Studio e DSH ativos, preservando o rascunho principal r6.
2. Criou a ponte v3, novas rotas e aplicativo independente no mesmo serviço do Studio.
3. Montou a ponte no perfil Web do Harness com backup e fez reinicialização controlada.
4. **Sessão real persistente:** cálculos `(8+7)*2` → **30** e `9*3` → **27**, com o mesmo ID DSH. Histórico confirmado na ponte.
5. **UI no Brave:** terceiro cálculo `5*8` → **40**. Recarregar preservou conversa e sessão. Novo chat criou outro ID e retornou `2*3` → **6**. Após o teste, histórico limpo para o usuário.
6. **UX:** viewports desktop, 768, 390 e 320 px sem overflow horizontal, nenhum erro JavaScript.
7. **Reinício real do DSH:** sessão de teste preexistente retomada com o mesmo ID e cálculo `6*7` → **42**.
8. **Segurança:** acesso não autenticado à ponte retornou HTTP 403; rascunho do Studio permaneceu r6, sem publicação automática.
9. **Regressão:** `npm test` 7/7 aprovados; `npm run check` aprovado.

## Evidências

- [QA estruturado do navegador](evidence/agent-lab-20261023/browser-e2e.json)
- [Conversa desktop](evidence/agent-lab-20261023/desktop-chat-real.png)
- [Conversa celular](evidence/agent-lab-20261023/mobile-chat-real.png)
- [Conversa em 320 px](evidence/agent-lab-20261023/small-mobile-chat.png)

## Contrato e limites

O Laboratório conversa com o comportamento **publicado no Harness**. Mudanças no editor só chegarão a uma **nova sessão** após a publicação explícita. Configuração de prompt/ferramentas não constitui fine-tuning dos pesos do LLM.

**Aceite:** aplicativo local funcionando e testado ponta a ponta, com atalho de área de trabalho. PR permanece draft, sem merge em main. Nenhuma auditoria independente Emily/Beatriz ou gate delegado de Léo é afirmado como executado.
