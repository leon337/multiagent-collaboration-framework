# Decisões e fronteiras

1. visibilitychange deixa de chamar end(false).
2. Sem consentimento: MediaStreamTrack.enabled=false e micFrame bloqueado.
3. Com consentimento por sessão: trilha habilitada e PCM enviado em fundo.
4. O checkbox é desligado por padrão, bloqueado durante a sessão e
   desmarcado em qualquer encerramento.
5. pagehide ou Stop continuam encerrando a sessão e liberando tracks.
6. Retorno à aba reativa áudio e tenta retomar AudioContext se suspenso.
7. Limite de 300 segundos, identidade do Pet e ticket HMAC não alterados.
8. Permissões de leitura e proposta não são ampliadas nem executadas.
9. O navegador pode manter o recurso físico do microfone alocado,
   mesmo com track.enabled=false; Stop libera o track.
10. Suspensão do SO/navegador não é tratada como garantia de continuidade.
