# F1 — Parecer técnico externo, primeira revisão

Executor externo Codex CLI (não é Agent Session Emily autenticada no runtime MCF).
SHA revisado: `0e33e5333b4e360e5459c18b146ba7ccfd35c4e5`.
Thread: `01a1e610-f61c-7312-b13b-c47d0e543daf`.
Decisão técnica: **RETORNAR_PARA_CORRECAO**; não é gate oficial LÉO.

---

**Parecer externo: RETORNAR_PARA_CORRECAO.** Identifiquei dois achados P1 e três P2, reproduzidos offline. Não identifiquei P0 no escopo examinado. Este parecer não constitui auditoria oficialmente autenticada de Emily nem gate LÉO.

**1. SHA e verificações executadas**

HEAD confirmado: `0e33e5333b4e360e5459c18b146ba7ccfd35c4e5`.

Em Node.js `v24.22.2`:

- Suítes fornecidas: **12/12 PASS**, confirmados com `node --test --test-isolation=none --test-reporter=tap …`.
- Manifesto de fontes: **9/9 OK**. Manifesto de artefatos: **10/10 OK**.
- Conferência independente dos cinco hashes de fontes e do hash do harness no JSON E2E: **PASS**.
- Sondagens adicionais de senoide a 44,1/48 kHz, continuidade, saturação PCM16 e parada após captura ativa: **2/2 PASS**.
- Cinco sondagens com funções reais do aplicativo e dependências simuladas confirmaram os defeitos abaixo.

Uma tentativa de executar sondagens por `/dev/stdin` com `--test` falhou no carregamento. Outra teve um stub incompleto; corrigido o stub, a reprodução passou. Essas falhas instrumentais não foram contabilizadas como testes do produto.

Não executei E2E conectado, Google, servidor local nem acesso ao computador original. Não li segredos nem alterei arquivos. O estado atual de draft/CI no GitHub não foi consultado; o objeto deste parecer é o SHA fornecido.

**2. Achados por prioridade**

**P1 — Ativação concorrente do microfone deixa captura ativa após desligar.**  
Referências: [app.js:180](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/app.js:180), [app.js:204](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/app.js:204), [app.js:236](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/app.js:236).

Dois cliques enquanto `getUserMedia()` está pendente iniciam duas capturas. Não há trava de inicialização; a segunda sobrescreve as referências globais da primeira. `stopMic()` encerra apenas os recursos ainda referenciados. A reprodução terminou com `state.micStream === null`, mas **uma track e um contexto permaneciam ativos**. Isso compromete privacidade e limpeza de recursos.

Correção: serializar a ativação, invalidar inicializações canceladas e liberar os recursos locais de toda tentativa ultrapassada.

**P1 — Cancelar e reconectar permite sockets concorrentes de tentativas diferentes.**  
Referências: [app.js:48](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/app.js:48), [app.js:228](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/app.js:228).

Sequência: iniciar A → encerrar enquanto `/api/token` está pendente → iniciar B → respostas de A e B chegam. A consulta apenas o booleano compartilhado `wantConnected`, novamente verdadeiro, e também cria um socket. A reprodução confirmou **dois sockets criados**, com apenas o último referenciado.

`onopen` e `onmessage` não verificam se pertencem à tentativa vigente; a proteção de identidade aparece somente em `onclose`. Mensagens antigas podem alterar estado e executar ferramentas locais.

Correção: identificar cada tentativa por geração, cancelar o fetch anterior e ignorar/fechar sockets ultrapassados em todos os callbacks.

**P2 — Alterar VAD durante a sessão muda o protocolo sem renegociar.**  
Referências: [app.js:34](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/app.js:34), [app.js:159](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/app.js:159), [index.html:71](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/index.html:71).

O setup fixa o modo do servidor, mas cada frame consulta o checkbox ainda editável. Desmarcá-lo após conectar em automático passa a emitir `activityStart/End` sem novo setup. No sentido inverso, o cliente abandona a sinalização explícita exigida pelo modo manual. A sondagem confirmou a mudança imediata de mensagens.

Correção: congelar a configuração por conexão ou exigir reconexão ao alterar o modo; aplicar o mesmo modo congelado ao encerramento do microfone.

**P2 — Backpressure descarta controles e avança o estado VAD como se fossem enviados.**  
Referências: [app.js:17](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/app.js:17), [app.js:165](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/app.js:165), [app.js:174](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/app.js:174).

O limite de `bufferedAmount` vale para todas as mensagens. `activityStart` pode retornar `false`, mas `manualVadStarted` passa a verdadeiro. Após a rede drenar, PCM é enviado sem o início correspondente — comportamento reproduzido. Perder `activityEnd` produz o problema complementar de atividade aberta no servidor.

Correção: tratar controles separadamente dos frames descartáveis e somente avançar estado após envio bem-sucedido, com recuperação limitada e explícita.

**P2 — Falha transitória ao obter token interrompe definitivamente a reconexão.**  
Referências: [app.js:65](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/app.js:65), [app.js:75](/tmp/mcf-gemini-f0-review-527/apps/gemini-live-studio/public/app.js:75).

O retry é agendado por `onclose`, mas qualquer falha de `/api/token` cai no `catch`, que limpa `wantConnected` sem reagendar. A sondagem com HTTP 502 confirmou a interrupção, mesmo restando tentativas. Uma indisponibilidade curta impede a recuperação automática.

Correção: integrar obtenção de token à política limitada de retry, preservando distinção entre falhas transitórias, credenciais inválidas e cancelamento voluntário.

**3. Suficiência de F1.1–F1.6**

| Item | Avaliação | Fundamentação |
|---|---|---|
| F1.1 — Captura/resampling | **Parcial** | Continuidade e quantização verificadas a 44,1/48 kHz; concorrência de ativação falha. Faltam bloqueio prolongado da UI e avaliação espectral/anti-alias. |
| F1.2 — VAD/interrupção | **Parcial** | Caminho sintético básico funciona; troca de modo e perda de controles falham. Pré-roll não é verificado por conteúdo; false triggers e eco físico permanecem abertos. |
| F1.3 — Playback/turnos | **Parcial** | Limpeza e descarte de backlog têm testes sintéticos. Faltam jitter audível, reconciliação de transcrições e deduplicação observada no protocolo. |
| F1.4 — Resiliência | **Parcial** | Há registro de reconexão real e handle disponível. Persistem corrida entre tentativas, falha de token, ausência de sessão longa e retomada semântica não comprovada. |
| F1.5 — Hardware/benchmark | **Insuficiente** | Sem microfone/headset físico, comparação antes/depois ou latências estatisticamente sustentadas. |
| F1.6 — PRF/auditoria/gate | **Parcial** | Pacote íntegro e limitações explícitas; auditoria oficial, gate e requisitos anteriores continuam pendentes. |

Os **17/17 E2E registrados** são coerentes com o harness e seus hashes, mas representam uma mistura de simulações locais e conectividade real. Em particular:

- GoAway é injetado; a asserção verifica o contador. O teste encerra a sessão logo depois, sem comprovar a renovação preventiva.
- “Sem duplicação” compara quantidade de entradas visuais do usuário, sem reconciliar IDs de turnos no servidor.
- Reprodução usa PCM sintético; envio pelo worklet não comprova resposta audível real.
- Handle presente não comprova preservação semântica do contexto.

O PRF declara essas limitações com boa transparência. Os manifestos comprovam integridade dos arquivos fornecidos, sem constituir receipt independente da execução.

O [workflow:23](/tmp/mcf-gemini-f0-review-527/.github/workflows/mcf-gemini-live-f1.yml:23) executa unitários, sintaxe, scanner e manifestos; não executa E2E. Seus caminhos correspondem à estrutura examinada, e as permissões são somente leitura. Portanto, CI verde nesse workflow não equivale a 17/17 E2E.

Na segurança, observei loopback, lista explícita de arquivos públicos, CSP restritiva e whitelist de telemetria. O export completo inclui conversa e notas; a garantia de ausência de conteúdo pessoal aplica-se à telemetria, não ao JSON inteiro. Rotação da chave e autenticação local continuam riscos documentados, sem comprovação de remediação nesta revisão.

**4. Correções e autoridade pendente**

Prioridade recomendada:

1. Corrigir as duas corridas P1 de captura e conexão.
2. Congelar VAD por sessão e garantir entrega coerente dos controles.
3. Cobrir falhas transitórias de token no retry limitado.
4. Acrescentar regressões desses cenários e executar qualificação física, sessão longa, falhas de rede e retomada contextual.

Aplicando o método de suficiência do [contrato Emily](/tmp/mcf-gemini-f0-review-527/docs/agentes/EMILY.md), a entrega sustenta **implementação experimental parcialmente validada**, ainda insuficiente para fechar F1.

A aceitação formal das evidências continua exigindo Emily com identidade oficial e receipt verificável; o gate operacional continua reservado a LÉO. Este parecer externo pode integrar essas entradas, sem substituí-las.
