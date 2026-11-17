# Gemini Live Studio · MCF Lab
Aplicação de experimentação multimodal Gemini Live para execução local em Linux.

## Como iniciar
Abra o atalho **Gemini Live Studio** na área de trabalho, ou execute:
bash /home/leo/Projetos/gemini-live-studio/start.sh

URL: http://127.0.0.1:18371

## Chave API
Clique em "Configurar chave API", cole sua chave do Google AI Studio, e clique em "Validar e salvar".
O backend valida a chave e salva em .private/api-key.json (somente dono, permissão 0600; não criptografada em repouso).
O frontend nunca recebe a chave; recebe somente tokens temporários criados para cada sessão.
Não envie sua chave em conversas, GitHub ou screenshots.

## Recursos
- Modelos Gemini 2.5 Flash Live, 3.8 Live e 3.8 Live Extended Thinking
- Áudio bidirecional nativo 16kHz (entrada) e 24kHz (saída)
- Câmera e compartilhamento de tela 1 frame/s, além de envio de imagem por arquivo
- Texto e legendas de entrada/saída
- Seleção de voz e configurações específicas por modelo
- Detecção de interrupção; ferramentas demonstrativas seguras e Pesquisa Google
- Compressão de contexto, retomada de sessões, métricas e exportação de eventos
- Chave API via painel separado, validada e salva localmente

## Segurança / limitações
Acesso exclusivamente em 127.0.0.1, sem autenticação de usuários: não publique a porta nem faça bind em 0.0.0.0.
O token temporário (com validade curta) permite que o navegador converse diretamente com o Google.
Áudio e vídeo são enviados à API do Google apenas depois de você ativar cada permissão.
A API pode cobrar pelo uso conforme seu projeto/conta; o painel mostra tokens, não valores.
A compatibilidade final dos modelos depende da chave/cota/permissões na API.
As ferramentas demonstrativas não executam comandos do sistema, não alteram arquivos e não integram o runtime MCF.
Clonagem de voz e geração de imagens não são recursos desse endpoint Live; exigem outros modelos/serviços.
Termos/versões: https://aistudio.google.com/docs/live-api

## Verificação
node --check server.js
node --check public/app.js
curl http://127.0.0.1:18371/api/status
