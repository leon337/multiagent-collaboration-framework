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

## Checkpoint UX no celular — captura real de 07:08

O usuário compartilhou captura do Android com Agent Lab carregado por Tailscale HTTPS, botão Novo chat, status DSH conectado, input funcional e conversação de estudo preservada. A tela prova que a conexão móvel foi estabelecida e que o agente respondeu a perguntas reais.

Falha visual identificada: o renderer anterior usava `textContent` puro e mostrava marcadores Markdown `**...**` e fórmula LaTeX `\(...\)` literalmente. O Lab foi corrigido para apresentar **negrito e expressões aritméticas legíveis**, com criação exclusiva de nós DOM e `textContent` (sem aceitar HTML/JavaScript gerado pelo agente). Exemplo reproduzido: `123 dias × 15 h/dia = 1 845 horas`, negrito correto e HTML malicioso preservado como texto. Teste Brave CDP: 12 mensagens reais carregadas, `strong` e `.lab-math` presentes, nenhuma tag `img` executada, zero exceções JS, viewports 390 e 320 sem overflow horizontal. Regra restrita a mensagens do agente, preservando o texto digitado pelo usuário.

O rótulo secundário de publicação foi retirado apenas da interface remota mobile para a faixa informativa não comprimir o texto em largura estreita; APIs administrativas continuam bloqueadas. `npm test`: **8/8 aprovados**; ambos os serviços locais ativos. Nenhuma sessão de usuário foi alterada durante o teste de formatação.
