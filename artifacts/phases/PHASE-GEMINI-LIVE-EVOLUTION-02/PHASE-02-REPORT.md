# F2.1 — Consentimento visual (primeira implementação)

Missão: MCF-GEMINI-LIVE-EVOLUTION-20261116-001
Estado: EM_EXECUCAO_LOCAL, branch isolada, sem deploy/merge de produção.

LEANDRO pediu explicitamente avançar o desenvolvimento para a F2, evitando novos ciclos redundantes de F1. A aprovação externa anterior de LÉO foi restrita à continuidade local com ressalvas: não foi gate formal completo da F0/F1. Esta nova branch é desenvolvimento local autorizado, sem marcar os gates como aprovados.

## Implementado
- Controlador isolado de MediaStream com consentimento por ativação para câmera e tela.
- Diálogo informa envio de JPEG ao provedor e limite de até 1 FPS. Permissão nativa do navegador é adicional, nunca substituída.
- Indicador persistente de câmera/tela ativa e botão Parar câmera/tela.
- Uma única fonte visual por vez. Troca só encerra anterior após a nova permissão ser concedida.
- Fechamento de tracks e timer ao parar, desconectar, ao navegador finalizar captura, ao sair da página e durante queda de WebSocket.
- Promises tardias de permissão não reativam mídia após desconectar/stop. Reconexão jamais reacquire visual automaticamente.
- Frame de vídeo só é enviado se houver stream ativa com track vivo e srcObject esperado.
- Servidor local fornece media-policy.js via allowlist explícita.

## Evidência
- 11/11 testes unitários Node, incluindo promessas atrasadas, acesso negado, troca de fonte e reconexão.
- 11/11 casos Puppeteer com DOM real de consentimento e MediaStreams visuais simulados. Sem conexão à API Gemini nem armazenamento de frames. JSON com hashes de app.js, media-policy.js e index.html.
- Durante os testes foi detectado um bug real de closure no evento onended, que deixava o indicador ativo após o sistema encerrar compartilhamento. Corrigido e validado.
- Correção de rota 404 para o arquivo JS novo incluída e retestada.

## Limites
Não há teste com câmera/tela física operada por LEANDRO nem comprovação de quadros ingeridos pelo Google Live neste commit. É F2.1 implementada em staging de desenvolvimento local, não gate concluído de F2.
F2.2-F2.6 ainda não executadas. Gate F0/F1 permanece aberto; chave compartilhada anteriormente não rotacionada por adiamento humano: não expor publicamente nem implantar produção.
Original 18371, F1 testada 18372 preservados. F2 staging 18374.

## F2.2/F2.3 — análise especializada e router
O pacote F2-2-F2-3-QA.md cobre Gemini generateContent para imagem e vídeo (Files API), exclusão de arquivos, consentimento, trace ID, tokens e núcleo do roteador por modelos.list. Sucesso real com arquivos sintéticos (HTTP 200 imagem e vídeo). Modelos adicionais, preço, cotas, vídeos >24MiB e gates continuam pendentes.

## F2 audit remediation
External Code CLI review on a1a51d5 returned RETURN_FOR_CORRECTION for 5 issues. Local fixes include reject HTTP redirects, remote deletion uncertainty warnings, explicit model selection, single-flight catalog and session-local analysis results. Post-fix QA: 17/17 vision Node, 14/14 vision Chrome, 92/92 combined Node; provider synthetic image/video retested. Details in REMEDIATION-AUDIT-CYCLE1.md. Formal F2.6 gate remains pending.
