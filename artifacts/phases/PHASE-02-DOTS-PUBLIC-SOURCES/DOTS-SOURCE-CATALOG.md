# Dots — Catálogo de fontes primárias e evidências

**Consulta:** 2026-10-13 UTC. Os links podem mudar.
**Regra:** fonte primária oficial para claims de produto; system card para resultados de avaliação; Help Center para controle de dados e uso. Não especular sobre código não divulgado.

## S1 — Introducing dots
URL: https://openai.com/index/introducing-dots/
Data mostrada: 2026-09-29.
Seções lidas: Dots can work on their own; Dots are an extension of you; channels; safeguards; access/permissions; approvals; specialist dots.
Fatos suportados:
- dots são descritos como agentes always-on baseados em GPT-6 Astra.
- cada dot tem computador na nuvem e browser próprios, connected apps/tools e trabalho contínuo.
- usuário pode acompanhar o computador, conectar computador pessoal com permissão e ver progresso via Activity View.
- pesquisa proativa usa ferramentas read-only; não envia mensagens, não modifica conteúdo e não controla browser/computer.
- permissões e Custom Rules controlam ações; Auto-review verifica ações importantes; tarefas sensíveis podem exigir approval/handoff.
Limite: é overview de produto, não source code nem interface API completa.

## S2 — How we build safety, security, and privacy into dots
URL: https://openai.com/index/how-we-build-safety-security-and-privacy-into-dots/
Data mostrada: 2026-09-29.
Seções lidas: workspace protegido; secure sign-ins; context/memory; proactive research; ação e Auto-review.
Fatos suportados:
- sandbox restringe code/tools na workspace do dot e ambientes cloud dos usuários são isolados.
- execução do dot é separada dos sistemas que coordenam trabalho e aplicam salvaguardas; dot não pode desligar checks obrigatórios.
- credenciais em login suportado são encaminhadas ao browser environment sem entrar no contexto do modelo; segredos em texto legível não ganham essa proteção automaticamente.
- Activity View deixa o usuário acompanhar, corrigir, redirecionar ou parar.
- Auto-review é um sistema separado que permite/bloqueia certas ações; checks obrigatórios não podem ser removidos por aprovação ou Custom Rules.
Limite: topologia interna, tecnologia de isolamento específica e código de enforcement completos não estão publicados no post.

## S3 — Dots privacy, security, and safety FAQs
URL: https://help.openai.com/en/articles/20001529-dots-privacy-security-and-safety-faqs
Atualização mostrada no fetch: quatro dias antes da consulta de 2026-10-13.
Fatos suportados:
- permissões de plugins compartilhadas entre dots, ChatGPT, ChatGPT Work e Codex; identidade própria de Slack pode coexistir.
- dot pode receber memories e contexto recente; conversas com dot podem contribuir para ChatGPT Memory.
- desligar Memory interrompe compartilhamento futuro, mas não elimina o contexto recebido anteriormente.
- excluir dot remove o contexto dele, mas não os arquivos/conversas armazenados em outros locais nem memórias que já foram transferidas para ChatGPT Memory.
- usuário não pode editar/apagar diretamente uma memória individual do dot pela interface descrita no FAQ.
- salvaguardas incluem proteção de modelo, permissões, Custom Rules, Auto-review e safety monitoring; prompt injection continua sendo risco reduzido, não eliminado.
Limite: FAQ é fonte de produto e privacidade; condições completas de todos os planos/mercados podem variar.

## S4 — GPT-6 Astra System Card, apêndice Dots
URL: https://deploymentsafety.openai.com/gpt-6-astra/change-log
Data mostrada: 2026-09-03.
Seções lidas: Introducing dots, Prompt Injection Automated Red-teaming, Manual Red-teaming, Alignment for dots, changing permissions, chained tasks, Auto-review e safeguards.
Fatos e métricas como publicados:
- 100 bulk rollouts válidos, 500 emails simulados por rollout; 50.000 emails incluindo 16.600 ataques, zero sucessos marcados no score.
- 100 cadeias de ataque iterativo, 2.638 tentativas válidas, zero sucessos marcados.
- mudança de escopo/permissão: 91,8% de pass (45/49 episódios), todos os 17 casos com mudança explícita de permissão passaram.
- tarefas encadeadas: sem incidente de severidade alta reportado nessa avaliação; violações moderadas foram vistas; flags de 8,6% com cinco tarefas intermediárias e 19,7% com dez.
- Auto-review testado sobre disclosure, ações destrutivas, compromisso financeiro, acesso/segurança, comunicação não autorizada e autorização ambígua; dataset sintético de 30 exemplos/categoria e replay de 5.000 pedidos não editados.
Advertências expressas pelo card:
- algumas avaliações isolam comportamento sem a stack completa de produção;
- as amostras são finitas e resultados não são garantia universal;
- ambiguidades de autorização e violações moderadas persistem.
Limite: não é o código-fonte completo de Dots; inclui resumo público de avaliações e salvaguardas.

## S5 — Mapa de confiança
- Produto/uso/canais: S1.
- Isolamento/enforcement/Auto-review: S2 + S4.
- Fluxo de contexto e deleção: S3.
- Robustez, amostras e residual risks: S4.
- Arquitetura interna de scheduler, schemas, mensagens de subagentes, DB, distribuição de serviços e implementação completa de Auto-review: UNKNOWN.