# Decisões
MESTRE: usar Cloudflare Quick Tunnel só em homologação não-prod; Twilio assinaturas HMAC, sem Cloudflare email auth que impediria webhook. Não registrar corpo ou transcrição.
MESTRE: usar token sintético para provar HTTPS e encerrar tudo; sem chave real da Twilio não configurar chamada real.
MESTRE: não contornar lockscreen; solicitar desbloqueio do notebook como único gate necessário para continuação.
MESTRE: teto R$0 e voz de usuário não persistida, sem chamadas adicionais.
