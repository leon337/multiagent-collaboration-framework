# Decisão de execução

Inicio da F2.1 em branch isolada e staging loopback em resposta à instrução atual de LEANDRO.
Não considerar isto encerramento de gates F0/F1 nem autorização de deploy.
MediaPolicy isolada da implementação de voz. Um stream visual por vez, consentimento separado para cada ativação e nenhuma aquisição automática.
Próximas entregas F2.2-F2.6 requerem validação específica por capacidade/custo/privacidade.

## F2.2/F2.3
Análise em pipeline separado da sessão Live, com consentimento por mídia. Apenas texto analisado é compartilhável por segundo clique e como dado externo não confiável. Router sem fallback, selecionando modelo explicitamente no catálogo da chave. Budgets de tamanho e tokens, sem valor monetário estimado. Nenhum gate formal alterado por testes ou CI.

## Security review of F2.2
Reject redirects from Google endpoints to avoid egress escalation. Report cleanup uncertainty and proactively attempt file deletion whenever a valid uploaded file ID exists. Require explicit model selection. Revoke results and sharing on Live session change. Preserve prior external reviewer as RETURN, no silent gate promotion.
