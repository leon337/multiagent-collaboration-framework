# Continuidade entre sessões — Gemini Live Studio / MCF

**Missão:** `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`  
**Atualizado:** 2026-11-17 UTC  
**Estado:** `EM_EXECUCAO_LOCAL / GATES_PENDENTES`

A [Issue #527](https://github.com/leon337/multiagent-collaboration-framework/issues/527) permanece como **único checklist canônico**. Este documento registra reconciliação técnica; não aprova gates, não substitui auditoria e não autoriza produção.

## Estado de fases preservado

- F0.1 é o único checkbox validado; F0.8 permanece aberto.
- F1 segue em revisão técnica/desenvolvimento; F1.6 permanece aberto.
- PR #539 continua aberto/draft, baseado na branch F1 e com F2.1 e partes de F2.2/F2.3; F2.4–F2.6 continuam pendentes.
- PR #540 continua aberto/draft sobre a base F2; não foi fechado ou integrado.
- F3.7 e F4.6 permanecem abertos; F4 não está implementada.
- A Issue #527 contém trechos narrativos de checkpoints diferentes. Os gates/checkboxes explícitos são preservados; não inferir fechamento a partir de texto histórico.

## Estado Git verificado

- `main`: `97d79ee8152ead27564d2bf634ad63df5cc284e6` — merge do PR #543.
- O Studio foi integrado anteriormente pelo PR #544 no commit `ca84c9132459e37ecd8ba79a965b33e554f6200a`; o PR #543 não alterou arquivos em `apps/gemini-live-studio`.
- PR #540 permanece aberto/draft, branch `feat/gemini-live-playwright-mcp-gateway-20261117`, HEAD `76f86b09c254e5fb3adf5b127c1d1ed8e2e2b36a`. A implementação de voz/quarentena está no commit `5e0118b6a4b8f6047a9b19eddc8c8236abfb9545`.
- WIP F1 preservado sem rebase/cherry-pick: `wip/gemini-live-f1-response-20261117`, commit `142cd99f7519512849c43ded619ee63b884ee87e`, baseado em `8cffb50f00175443d7954b039d908b26a6f26650`.
- Candidato de reconciliação criado a partir da main: `reconcile/gemini-live-voice-approval-main-20261117`. O candidato não foi integrado à main. O PR draft #546 está aberto contra main; a CI F0/F1/F2/F3 e a validação documental passaram no HEAD submetido. O workflow Production Readiness permanece em execução.

## Estratégia de integração

Portar somente a camada de autorização por voz e a quarentena necessária, mantendo como base os arquivos já integrados pelo PR #544. Não fazer merge integral do PR #540 nem cherry-pick de sua cadeia empilhada.

Arquivos do candidato:
- `public/voice-approval.js`: parser PT-BR estrito e desafio aleatório de quatro dígitos via `crypto.getRandomValues`.
- `public/playwright-tools.js`: opt-in de voz apenas para `playwright_navigate`; confirmação exata `autorizo + código`, recusa explícita, expiração e fallback manual por botões.
- `public/app.js`: bloqueio de áudio do Gemini, início de microfone, câmera e tela durante a janela de confirmação; cancelamento de inicialização assíncrona do microfone.
- `public/index.html`, `public/style.css`, `server.js`: controles, aviso de privacidade, ordem dos scripts e allowlist local do helper.
- Testes de parser e harness de browser; workflow F3 ampliado para validar o helper.

**Preservado da main:** o arquivo `mcp-playwright-gateway.cjs` não foi substituído pelo PR #540. Permanecem os guards de sessão revogada, cancelamento e validação de redirecionamento da linha integrada pelo PR #544. O código de UI da main também mantém as verificações de resultado obsoleto e a mensagem de política de navegação existentes.

## PR de reconciliação

[PR #546 — portabilidade seletiva da autorização por voz](https://github.com/leon337/multiagent-collaboration-framework/pull/546). Branch criada a partir da main atual; não foi feito merge. No SHA de código `93cba8b2ef7ccaa5be370aacd30e1b57194f9cab`, os workflows F0, F1, F2.1, F3 e Documentation validation passaram. O F3 executou 25 testes (25 PASS, 0 FAIL), incluindo a regressão de hostname com ponto final. Production Readiness ainda está em execução. Os checks Vercel de dois projetos externos falharam por limite diário de deploys e não representam falha de teste do Studio.

## Limites e segurança

- Web Speech API não é biometria nem prova de identidade de LEANDRO; o reconhecimento pode usar serviço online do navegador.
- A frase falada não é recebida do Gemini: o desafio é apresentado localmente e comparado com transcrição final exata.
- Câmera/tela e áudio do Gemini são interrompidos durante a autorização; não há retomada automática de câmera/tela.
- O microfone do Gemini só pode ser retomado na mesma sessão/geração/época, se estava ativo antes e se a sessão continua conectada.
- A navegação continua limitada a HTTPS público com aprovação por destino; clique/digitação permanecem restritos ao TodoMVC.
- Não há sandbox de egress de rede contra SSRF/DNS rebinding nem identidade HDF/PermissionEngine nativa. Não usar navegador autenticado, credenciais pessoais ou ações comerciais.
- Nenhuma mudança em `main`, deploy público ou exposição de porta foi feita por esta reconciliação.

## Validação e gates

A branch PR #540 tinha Actions concluídas com sucesso no SHA observado, mas isso não transfere aprovação ao candidato novo. O candidato precisa executar seus próprios workflows e receber auditoria independente sobre o SHA final.

Pendências canônicas: **F0.8, F1.6, F2.6, F3.7 e F4.6**. O WIP F1 tem evidência técnica preservada (18/18 browser, 31/31 hashes de fonte e 54/54 artefatos no checkpoint anterior), mas não é gate aprovado e não foi incorporado nesta branch.

Próximos passos: validar CI e manifestos do candidato; reauditar o SHA final; executar teste físico de microfone/voz com LEANDRO; implementar isolamento de rede e identidade HDF/PermissionEngine antes de qualquer liberação de produção. Não marcar checkboxes sem evidência e decisão formal.
