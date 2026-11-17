# MCF F3 — remediação P1: eco de leitor de tela e falso consentimento

**Missão:** `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`, Issue #527.  
**Alvo auditado:** PR #546, commit `82d22c71a6e05de98b432db86fa9d32493955275`.  
**Fonte:** revisão Codex independente, [P1 em index.html:132](https://github.com/leon337/multiagent-collaboration-framework/pull/546#discussion_r4596122160).  
**Modo:** branch/PR empilhados e isolados, sem alteração de main ou PR #546.

## Falha

A interface exibia `autorizo ####` em `aria-live="polite"` e armava Web Speech após terminar TTS. Leitor de tela atrasado podia vocalizar a frase completa e ser reconhecido como autorização. O Codex registrou reprodução simulada; **não** há prova acústica física.

## Mudança

- Exibição somente dos dígitos, fora de região de anúncio automático (`aria-live="off"`); leitura acessível voluntária possível.
- TTS sem nonce e sem acionar automaticamente a escuta.
- Armar reconhecimento exige ativação confiável do controle `Iniciar escuta`.
- Mesmo frase correta por microfone **não executa** `allow:true` e apenas exibe estado `código conferido`. O usuário deve **clicar ou ativar pelo teclado o botão final** para efetivar a ação; eventos sintéticos são rejeitados.
- Recusa falada e fallback manual continuam disponíveis. Opt-in recebeu texto compatível com o novo contrato: **conferência por voz + confirmação por botão**, não aprovação somente vocal.

## Evidência e testes

A CI F3 executa `voice-echo-guard.test.cjs` com `node:vm`: sem listener automático, evento sintético não arma a escuta, eco da frase completa não envia decisão, botão sintético não autoriza, clique confiável libera uma vez, recusa falada rejeita e fallback manual continua. O harness de browser foi **executado** com Chrome 156 headless no host Linux autorizado, serviço temporário `127.0.0.1:18677`, com Web Speech **simulado**: 10/10 cenários PASS, sem erros de script. O teste físico simultâneo de alto-falante/leitor de tela/microfone humano permanece **NOT_TESTED**. A suíte Node F3 executou 28/28 PASS. Os logs sanitizados estão em `VOICE-ECHO-NODE-TESTS-20261117.txt` e o relato com SHA-256 das fontes em `VOICE-ECHO-BROWSER-E2E-20261117.json`. CI F3 #44034772454 e F2.1 #44034772392 finalizaram SUCCESS no commit `e82973e`.

## Bloqueios restantes

Esta mitigação deliberadamente **retira o fluxo somente por voz**: reconhecimento não autentica identidade; `isTrusted` não é biometria. HDF/PermissionEngine, recibos vinculados a identidade, egress de rede, IPv4/IPv6, SSRF e DNS rebinding ainda exigem implementação e validação de infraestrutura. Sem QA física, revisão Emily independente, decisão LÉO, F4, merge ou deploy. Os gates F0.8/F1.6/F2.6/F3.7/F4.6 seguem abertos.

## Próximo trabalho sem refazer o que foi feito

Auditar novo SHA da correção; implementar identidade HDF no runtime e sandbox de navegador com restrição de egress; testar interações físicas/acessibilidade no host autorizado; executar regressões e retestar security; somente depois solicitar gate formal e eventual publicação segundo autorização vigente.

