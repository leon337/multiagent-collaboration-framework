# F1 — Correções decorrentes da segunda auditoria externa

Missão MCF-GEMINI-LIVE-EVOLUTION-20261116-001. PR #529 em draft.
A segunda revisão Codex CLI externa sob perfil de Emily detectou quatro defeitos ainda presentes no candidato 2344cdf (houve drift somente de manifests para 8cff durante a inspeção). Parecer RETURN_FOR_CORRECTION.

## Mudanças no candidato posterior
1. generationComplete não libera a barreira awaitingTerminal: apenas turnComplete termina o turno. Uma nova mensagem textual ou imagem não pode ser enviada enquanto ainda possam chegar chunks/terminal do turno anterior.
2. VAD manual usa três frames de fala para iniciar activityStart e redefine o estado de resposta da fala anterior. Silence-end arma monitor de voz apenas sem terminal de geração anterior pendente.
3. A API sinalizar interrupted não comprova que a nova fala já recebeu resposta; o estado voiceResponseSeen é limpo, permitindo reconhecer o fim da fala nova.
4. O guard canStartClientTurn bloqueia clientContent de texto e imagem durante micStarting, mic ativo, resposta pendente, output na fila ou ausência do terminal. O handler de imagem também revalida esse guard após decodificação assíncrona e arma monitor para imagens.
5. MIME PCM16 24kHz e alinhamento de bytes devem ser válidos antes de desarmar qualquer watchdog. O botão de reinício é ocultado quando chega áudio válido.
6. Recuperação exige confirmação e ENCERRAMENTO de sessão sem repetir automaticamente a solicitação. O usuário abre outra sessão e repete manualmente.

## Evidências atuais
18/18 browser adversarial PASS (inclui regressões das quatro falhas e handler real de imagem), 17/17 E2E API Google real com mídia virtual, 23/23 Node offline. Hashes de fonte/HTML/telemetria e harness vinculados aos resultados.
A captura de microfone 60s anterior teve 1493 frames e 0 drops e Worklet SHA idêntico; o app SHA era anterior e o RMS máximo não validou detecção de fala.

## Limites ainda abertos
A API não fornece ID de resposta independente em cada chunk de áudio; por isso o UI serializa turnos em vez de tentar execução simultânea insegura.
Ausentes pelo menos 30 medidas físicas fim da fala humana até som ouvido, QA acústica de 30–60s, barge-in natural/eco e confirmação no SHA final.
F0.8 e requisitos Classe C continuam sem gate; credencial previamente compartilhada segue sem rotação por decisão de LEANDRO. Não foi feito merge na main, deploy de produção ou início de implementação F2.
