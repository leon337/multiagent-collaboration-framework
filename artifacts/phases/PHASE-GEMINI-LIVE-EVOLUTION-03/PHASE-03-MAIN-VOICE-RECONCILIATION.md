# F3 — Reconciliação seletiva da autorização por voz com main

**Missão:** `MCF-GEMINI-LIVE-EVOLUTION-20261116-001` · Issue #527  
**Base:** `main` em `97d79ee8152ead27564d2bf634ad63df5cc284e6`  
**Origem do diferencial:** PR #540, código de voz no commit `5e0118b6a4b8f6047a9b19eddc8c8236abfb9545`; HEAD atual do PR `76f86b09c254e5fb3adf5b127c1d1ed8e2e2b36a`.  
**Candidato:** `reconcile/gemini-live-voice-approval-main-20261117` — branch criada da main, sem merge.

## Escopo portado

A integração é seletiva e mantém o código atual do PR #544 como base:

- parser de frase de aprovação PT-BR e nonce de quatro dígitos gerado por `crypto.getRandomValues`;
- opt-in de voz limitado à navegação `playwright_navigate`;
- comparação exata da transcrição final com `autorizo + quatro dígitos`; recusa explícita e fallback manual por botões;
- TTS do destino solicitado e reconhecimento Web Speech separados do áudio do Gemini;
- quarentena de áudio, câmera e tela antes de exibir o desafio;
- cancelamento de inicialização pendente do microfone e retomada condicional somente na mesma sessão/geração/época;
- expiração do desafio, limpeza do código da interface e descarte do listener ao concluir;
- rota local do helper, interface, estilos, testes e workflow F3.

## Segurança preservada da main

O arquivo `apps/gemini-live-studio/mcp-playwright-gateway.cjs` **não foi substituído** pela versão do PR #540. Permanecem os controles integrados pelo PR #544 para sessão revogada, cancelamento e redirecionamento. O arquivo `public/playwright-tools.js` foi mesclado seletivamente: a lógica de voz veio do PR #540, enquanto as verificações de resultado obsoleto e o texto da política de navegação permanecem da main.

Não houve cherry-pick de commits empilhados do PR #540, cópia de sua gateway ou alteração do branch `main`.

## Limites explícitos

- Web Speech API não é biometria nem autenticação de LEANDRO; pode processar áudio por serviço online do navegador.
- O código de desafio não é enviado ao Gemini; é apresentado na interface local.
- A captura de câmera/tela não é reativada automaticamente após o gate.
- A retomada do microfone Gemini só ocorre se ele estava ativo antes, e a sessão, geração e época continuam iguais.
- HTTPS público ainda requer aprovação por destino; clique e digitação permanecem limitados ao TodoMVC.
- Falta sandbox real de egress de rede contra SSRF/DNS rebinding e identidade HDF/PermissionEngine nativa.
- O WIP F1 `142cd99f7519512849c43ded619ee63b884ee87e` permanece intacto em sua branch própria; não foi incorporado nem reescrito.

## Estado de validação

O PR #540 teve quatro workflows Actions concluídos com sucesso no HEAD `76f86b0`. Isso não transfere a aprovação ao candidato. A branch atual precisa executar novamente os workflows e validar seus próprios manifestos. O harness de browser é uma prova simulada; não representa teste físico de microfone.

**Gates ainda pendentes:** F0.8, F1.6, F2.6, F3.7 e F4.6. CI verde ou merge de código não fecha gates MCF. Sem deploy público, exposição de loopback ou promoção automática.
