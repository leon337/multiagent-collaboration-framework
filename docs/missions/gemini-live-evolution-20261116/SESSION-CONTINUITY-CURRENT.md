# Continuidade entre sessões — Gemini Live Studio / MCF

**Última reconciliação verificável:** 2026-11-17T05:12:23Z · **Missão:** `MCF-GEMINI-LIVE-EVOLUTION-20261116-001` · **Estado:** `EM_EXECUCAO_LOCAL / GATES_PENDENTES`.

**LEANDRO = autoridade humana final · MESTRE = orquestrador · LÉO = agente distinto.** Este documento é um checkpoint narrativo de engenharia para uma próxima sessão, **não** substitui a [Issue #527](https://github.com/leon337/multiagent-collaboration-framework/issues/527), que é o **único checklist com checkboxes**, nem constitui aprovação LÉO/Emily ou liberação de produção. O repositório GitHub e seus HEADs verificáveis prevalecem sobre registros anteriores.

## Recuperação fria — ordem obrigatória de leitura

1. [Issue canônica #527](https://github.com/leon337/multiagent-collaboration-framework/issues/527), incluindo o **checkpoint de 17/11/2026 no início** e os checkboxes F0.1–F4.7.
2. [Este documento de continuidade](./SESSION-CONTINUITY-CURRENT.md) e o registro estruturado [STATE-RECONCILIATION-20261117.json](./STATE-RECONCILIATION-20261117.json).
3. [CHECKLIST-LIVE.md](./CHECKLIST-LIVE.md), [ROADMAP.md](./ROADMAP.md) e [protocolo MCF de sucessão entre chats](../../protocols/MCF-PROTOCOLO-SUCESSAO-CROSS-CHAT-E-CONTROLE-DE-JANELAS.md).
4. PRs #528, #529, #539, #540 e #544, com checks e diffs atuais. A leitura de branches é **read-only** antes de qualquer nova alteração.
5. [PRF F3](../../../artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-03/README.md), [PRF F2](../../../artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-02/README.md), [PRF F1](../../../artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/README.md) e PRF F0.
6. Inspecionar localmente as worktrees somente se o computador estiver conectado; não inferir disponibilidade local do GitHub.

## Fotografia verificada de Git e PRs

| Escopo | Branch / PR | SHA confirmado | Estado e dependência |
|---|---|---|---|
| Main | `main` | `ca84c9132459e37ecd8ba79a965b33e554f6200a` | MERGED PR #544: Studio F0-F3 integrado; faltam os recursos de voz com desafio do PR #540. Local atualizado por fast-forward. |
| F0 | PR #528 | `b573121715f55f2275ef671f50119436cd8f9ea1` | MERGED conforme GitHub em 17/11/2026 05:06:13 UTC; gate F0.8 ainda aberto. |
| F1 | `feat/gemini-live-audio-f1-20261116`, PR #529 | `8cffb50f00175443d7954b039d908b26a6f26650` | Draft, base F0; gate F1.6 aberto. |
| F2 | `feat/gemini-live-f2-multimodal-consent-20261116`, PR #539 | `4579c35d8b8138e3b2c285e800539c3708539831` | Draft, base F1; F2.1–F2.3 piloto, F2.4/F2.5 não completos, F2.6 aberto. |
| F3 voz + MCP | `feat/gemini-live-playwright-mcp-gateway-20261117`, PR #540 | `5e0118b6a4b8f6047a9b19eddc8c8236abfb9545` | **Ramo principal de trabalho F3**; draft, base F2; gate F3.7 aberto. |
| Integração em main | PR #544 | `55538d198795a1b45a2f100c3613bcb9796ac39c` | MERGED por leon337 às 05:06:11 UTC no merge ca84c91. Não inclui voice-approval.js da F3 do PR #540. |
| Salvamento F1 | `wip/gemini-live-f1-response-20261117` | `142cd99f7519512849c43ded619ee63b884ee87e` | 15 arquivos antes apenas locais, versionados separadamente após testes; **WIP, não gate/merge**. |

**Verificação atualizada:** main local alinhada por fast-forward ao merge remoto ca84c91, feito pela conta leon337. PR #544 e PR #528 estão MERGED; PRs #529, #539 e #540 permanecem abertos/draft. O merge já ocorreu independentemente desta reconciliação. Deploy publico não foi verificado; existe apenas serviço systemd local 18377.

### Conflito de linhas de desenvolvimento que a sessão seguinte DEVE resolver

PR #544 JÁ ENTROU EM MAIN: inclui Studio e navegação pública HTTPS sob permissão, guards de sessão revogada e leitura Playwright. PR #540 contém separadamente Web Speech opcional, desafio falado de quatro dígitos e quarentena de áudio/câmera/tela. MAIN NÃO CONTÉM a camada de voz. Comparar os diffs em branch nova com base na main antes de portar o diferencial; a auditoria de #544 PASS_WITH_RESERVATIONS era de SHA anterior 0f93855, não certificou produção.

## Estado de execução que pode ser afirmado

**F0:** baseline, ameaça, telemetria e sync de checklist têm código/evidência, mas F0.2–F0.8 permanecem sem aceitação canônica final. F0.1 é o único checkbox fechado com documentação inicial. Credencial antes compartilhada teve rotação adiada por LEANDRO: não expor API, credenciais ou portas publicamente.

**F1:** captador AudioWorklet, VAD, playback PCM, guard de turnos, reconexão e benchmark local. LEANDRO reportou funcionamento audível; não há certificação física completa de 30 medições/eco/barge-in no SHA final nem gate formal. **Salvamento remoto WIP `142cd99`** preserva remediações posteriores de watchdog, barreira até `turnComplete`, tratamento da interrupção e guard de imagem/texto. Verificado: 18/18 browser Chrome com WebSocket sintético, 31/31 hashes fonte F1 e 54/54 hashes artefato F1; não foi incorporado à F1 #529.

**F2:** câmera/tela consentidas e limitadas; análise especializada de imagem e vídeo via Google (testes reais com mídia **sintética** no Gemini 3.5 Flash, upload de vídeo e exclusão Files API), roteador parcial de capacidades sem fallback silencioso. Não há prova de suporte audiovisual de todos os modelos, custos, quota, vídeos acima de 24 MiB ou hardware câmera/tela humano; F2.4 memória e F2.5 transcrição/tradução sem conclusão.

**F3:** Playwright MCP oficial `@playwright/mcp@0.0.85` + SDK `1.32.2`; Chrome headless isolado e 7 aliases expostos ao Live (navigate/snapshot/find/tabs/click/type/close). **Navegação por HTTPS público exige aprovação por destino**. `click/type` ficam restritos ao TodoMVC de demonstração. A aprovação por voz usa Web Speech API opcional PT-BR com frase `autorizo` + 4 dígitos, além de botões. Câmera/tela e áudio do modelo são interrompidos durante esse gate; não religar captura visual automaticamente. Confirmação falada **não autentica biometricamente LEANDRO**. Pode envolver serviço remoto de ASR do navegador.

**Testes atualizados no SHA F3 `5e0118b`:** 118/118 offline Node F0/F1/F2/F3 (reexecutados nesta reconciliação); manifestos F3 55/55 fontes e 14/14 artefatos **antes deste checkpoint**; histórico browser 8/8 simulação Web Speech, 9/9 interface do agente, 2/2 HTTP MCP real (inclui Python.org e negações), e prova anterior de chamada do Gemini Live com o MCP. O navegador do usuário e o microfone físico **não** foram validados por voz neste SHA; ver PRF e a diferença entre mocks/provedor. Os checks GitHub `f2-visual` e `f3-playwright-mcp` do PR #540 passaram; dois checks Vercel falharam por limite de build de OUTROS projetos, não por teste funcional do MCP. O CI `production-candidate-readiness` do #544 passou, sem significar gate ou deploy público.

**F4:** fluxo voz→missão→executor MCF governado, gate de produção, monitoramento e recovery formal **não implementados** nesta missão.

## Computador local — portas inspecionadas, NÃO URLs públicas

| Porta loopback | Conteúdo observado | `/api/status` | Observação |
|---|---|---|---|
| `18371` | Studio original `/home/leo/Projetos/gemini-live-studio` | ok/configurado | Preservado |
| `18372` | F1 staging `/home/leo/Projetos/gemini-live-studio-f1` | ok/configurado | Áudio original F1 |
| `18373` | Testes F1 watchdog em `/tmp/mcf-f1-response-gate` | ok/**não configurado** | Browser com mídia sintética; não é teste Google real nesta porta |
| `18374` | F2 em `/tmp/mcf-gemini-live-f2` | ok/configurado | Multimodal local |
| `18375` | F3 em `/tmp/mcf-gemini-playwright-bridge` | ok/configurado | **Piloto de voz e Playwright** |
| `18376` | Worktree da versão integrada pelo PR #544 | ok/configurado | Sem desafio de voz |
| `18377` | Serviço systemd local mcf-gemini-live-playwright.service | ok/configurado | Ativo e habilitado, bind localhost; não é serviço público |

Todas as portas escutavam em `127.0.0.1` no host `leo-N43SM`. Essas rotas não funcionam em outro computador/celular sem túnel explicitamente autorizado, autenticação e critérios de segurança. Runtime local e chave **não são transferidos pelo Git**. Instalações sob `/tmp` são potencialmente efêmeras: clonar os refs remotos e reinstalar as dependências no dispositivo sucessor.

**Pendência física no host:** `/tmp/mcf-gemini-f0-review-527` preserva **13 arquivos de revisão temporários não versionados** (briefs, logs e eventos) que não integram o histórico público; não foram apagados nem enviados porque podem conter material de auditoria. As conclusões sanitizadas relevantes constam dos PRFs. Fora do host, esses arquivos não são recuperáveis apenas pelo Git.

## Riscos e gates que NÃO podem ser marcados como concluídos

- F0.8, F1.6, F2.6, F3.7 e F4.6 permanecem abertos; auditorias externas Codex CLI com perfil não são sessão oficial de Emily/LÉO; CI verde não encerra gate.
- `Origin` HTTP e cabeçalhos customizados não são identidade humana HDF; Web Speech valida palavras e código, mas não biometria nem resistência a replay por terceiro local.
- Navegação pública por Playwright sem sandbox/firewall de egress não é barreira completa contra SSRF, DNS rebinding, redirects e subrecursos. **Não publicar o gateway na Internet**.
- MAIN agora contém Studio F0-F3 via merge PR #544 (ca84c91), sem camada de voz. PR #528 também MERGED. PRs #529/#539/#540 seguem abertos/draft; não executar merge novamente sem reconciliar ancestrais, diferenças e gates.
- A branch F1 WIP `142cd99` é **material preservado para revisão**, não fica automaticamente na F3 nem nas PRs existentes.
- Rotações de credenciais e custeio explícito são necessários antes de exposição/produção.

## Próximo ciclo — sequência orientada a objetivo

1. **Comparar** MAIN ca84c91 com PR #540 e criar branch reversível a partir de MAIN para portar só o diferencial de voz/quarentena, preservando os fixes de navfix já integrados.
2. **Revisar** o WIP F1 `142cd99` e testes de barreira/resposta frente à F3 integrada; aplicar em branch específica, com QA e sem perder os recursos multimodais.
3. **Executar** testes negativos de sessão, cancelamento, tool calling e navegação; atualizar manifestos e obter auditoria externa independente sobre o **SHA final**, sem confundir com agente MCF nativo.
4. **Validar** fisicamente com LEANDRO no host: voz real + aprovação de 4 dígitos, recusa, falhas ASR, pausa/retomada do microfone, câmera/tela e áudio, além de segurança da origem final.
5. **Integrar** autorização HDF/PermissionEngine e isolamento de rede auditável do runtime MCF antes de ferramentas em sites autenticados ou produção.
6. **Consolidar** checklist único na Issue #527 com provas, encaminhar gate para LÉO (agente) e decisão humana a LEANDRO nos pontos reservados. Merge/deploy somente após a verificação e decisão aplicáveis.

Critério para continuar: ler este checkpoint, verificar refs/CI atuais, não reiniciar F1/F2 do zero, não reabrir perguntas já respondidas e declarar incerteza quando o ambiente físico não estiver disponível.

## Continuidade de chat versus sucessão formal

Este arquivo entrega **CONTEXTO PERSISTENTE**, não afirma execução de sucessão de GUI. Nenhuma janela predecessor foi fechada ou substituída; nenhuma nova janela/chat sucessor foi criada/validada neste run. Conforme protocolo `MCF-PROTOCOLO-SUCESSAO-CROSS-CHAT-E-CONTROLE-DE-JANELAS.md`, `SUCCESSION_EQUIVALENCE=NOT_TESTED`, `EXPLICIT_HANDOFF=false`, `PREDECESSOR_CLOSE=NOT_PERFORMED`. A próxima sessão pode executar uma **recuperação fria lógica** por Issue+Git sem fingir copresença de janelas.

**Prompt portátil para nova sessão:** MESTRE, leia Issue #527 e este checkpoint no PR #540. Main ca84c91 já recebeu PR #544 com Studio e Playwright, SEM autorização por voz com código. PR #540 mantém voz; WIP F1 142cd99 foi salvo no remoto. Reconcile o diferencial de voz desde main, sem reiniciar F0/F1/F2 e sem presumir gates.
