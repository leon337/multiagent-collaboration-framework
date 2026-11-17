# F3 - HTTPS publico e autorizacao por voz

Missao MCF-GEMINI-LIVE-EVOLUTION-20261116-001. Autoridade: LEANDRO. Orquestracao: MESTRE. Ambiente: apenas staging local no computador autorizado, PR #540.

## Navegacao
Eliminada a lista estatica de dominios. A ferramenta Playwright_navigate aceita qualquer URL HTTPS publica sem credenciais, porta customizada, hosts reservados ou enderecos privados. Cada solicitacao cria um requestId de uso unico e exige decisao explicita do humano. Redirecionamentos entre www e dominio-base publico sao aceitos. Redirecionamentos inesperados para dominio diferente fazem o gateway fechar o Chrome e impedir retorno do conteudo, mas a verificacao posterior nao e uma barreira contra vazamento de rede. A chave Gemini e os cookies do Brave nao sao usados pelo Chrome isolado.

## Voz em portugues
- Ativacao voluntaria na interface. Por padrao, a voz esta desligada.
- Uma solicitacao de navegacao abre dialogo, mostra URL/destino e um codigo aleatorio de quatro digitos; o navegador pergunta por TTS o que precisa abrir, sem falar o codigo.
- O navegador usa Web Speech API separada do Gemini (PT-BR); a captura do microfone do Gemini e pausada enquanto ocorre a escuta e volta apos a decisao, quando a sessao continua valida.
- A confirmacao valida exige exatamente AUTORIZO seguido dos quatro digitos exibidos; frases erradas nao executam nada. RECUSO, NAO AUTORIZO e CANCELAR negam. O botao Ouvir novamente pode reiniciar captura se o navegador exigir interacao do usuario.
- O codigo e do frontend e nao faz parte do prompt do modelo nem de recibos persistidos. Expira juntamente com a solicitacao, e desconexao/retomada invalida a aprovacao antiga. Botao manual de autorizacao continua disponivel.
- Reconhecimento de fala nao comprova biometria ou identidade de LEANDRO. Chrome pode enviar voz ao proprio servico de reconhecimento de fala; a funcao nao tem suporte universal nos navegadores. O modo nao equivale a HUMAN_GATE/HDF normativo.

## Verificacao
25 testes Node de politica + parser de voz, 7 Chrome com reconhecimento de voz simulado e aprovacao/recusa, 9 Chrome fluxo do agente, 2 testes HTTP MCP real com site Python.org antes bloqueado por whitelist, bloqueio de IP privado e recusa. Total F0/F1/F2/F3 Node: 118 PASS. O reconhecimento de microfone fisico de LEANDRO ainda requer QA humano. Nao publicar em main/producao sem autenticacao, isolamento de egress e revisao independente.


## Auditoria externa e correcoes posteriores
A auditoria externa do SHA 7e38d7b obteve RETURN_FOR_CORRECTION:
- HIGH: codigo de voz poderia aparecer na captura de tela e audio de Gemini podia continuar tocando enquanto ASR escutava. Corrigido suspendendo toda captura visual e audio do modelo ANTES de gerar/exibir o codigo, impedindo reativacao visual durante dialogo e testando que PCM de Gemini nao toca enquanto o gate esta ativo. O codigo permanece apenas na interface local. Camera/tela devem ser reativadas manualmente depois.
- MEDIUM: microfone Gemini iniciando em paralelo poderia terminar setup enquanto ASR escutava; retomada era vinculada apenas a qualquer sessao. Corrigido: startMic recusa durante gate, micGeneration e invalidada inclusive durante inicializacao pendente; retomada condicionada ao mesmo sessionId, generation e mcpEpoch, com intencao de conexao ativa.
- MEDIUM: localhost. e service.internal. contornavam a checagem de sufixos. Corrigido removendo trailing dot antes da classificacao, com testes unitarios.
- MEDIUM: manifestos F3 nao cobriam fontes historicas F1/F2 que substituem. Corrigido com manifesto F3 ampliado ao conjunto de arquivos do modulo e dos testes F0/F1/F2/F3 e workflows.
A auditoria anterior permanece preservada, NAO sendo uma aprovacao do novo commit. Reconhecimento de voz fisico e isolamento de rede permanecem pendentes.
