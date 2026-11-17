# F1 — Resposta por voz, correção pós-auditoria

Em uma auditoria externa read-only no SHA 3aa67ab, foram reproduzidos quatro defeitos de implementação: alerta falso de silencio após audio/terminal precoce; eventos de resposta antiga interferindo em novo turno; falta de validacao de mime/alinhamento PCM16; e botao de recuperacao visivel após audio tardio. O parecer inicial foi RETURN_FOR_CORRECTION.

## Correcoes subsequentes
1. Voz exige >=3 frames RMS acima do limiar para iniciar episodio, reseta contagem por energia intermediaria e reconhece audio ou terminal recebidos antes do fim de silencio. Isso evita armar watchdog após resposta já concluida.
2. Um unico turno por vez: impede enviar texto durante mic ativo, fonte de playback ainda tocando ou geracao sem terminal; um curto intervalo apos termino protege reuso imediato. Como a API Live nao fornece identificador de turno em cada chunk, correlação perfeita de pacotes de geracoes sobrepostas é impossivel; em caso de timeout, o usuario deve confirmar **reinicio da sessao** e fazer a pergunta novamente. Nenhum retry/replay automatico e nenhum contexto antigo assumido no novo WebSocket.
3. Valida mime audio/pcm;rate=24000 e alinhamento PCM16 antes de considerar resposta recebida, contando pacotes invalidos como metadados numericos.
4. Esconde botao de reinicio após PCM valido, mesmo que turno anterior tenha terminado sem resposta.
5. Mantém audio já recebido drenando ate o fim, sem apagar trechos ao processar generationComplete. Mute e cancelamento continuam por comando explicito.

## Novos ensaios
13/13 browser adversarial PASS (incluindo formato WAV, tamanho impar, resposta precoce, texto sobre voz pendente, reinicio explicito) e 23/23 offline, mais 17/17 E2E com API Gemini real (mídia virtual) no codigo revisado.
Captura fisica de 60s mantém SHA do Worklet, mas foi executada antes da ultima mudança no app.js; não é prova de QA do codigo final.

## Pendencias de gate
F0.8 original permanece aberta, classe C e chave anteriormente exposta sem rotacao por decisão de LEANDRO. Nao temos medicao supervisonada de 30 turnos fisicos voz→som ouvido, comparacao de headset/alto-falantes, calibracao de barge-in/eco. O watchdog informa atraso e o usuario reinicia por escolha; nao prova que o provedor nunca falha. Sem merge main/deploy e sem F2 implementada antes dos gates.
