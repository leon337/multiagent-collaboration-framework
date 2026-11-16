# Decisões — Session Recovery

- Recuperar a autenticação no cliente, não afrouxar segurança ou prorrogar indefinidamente sessões no servidor.
- Renovação com uma única Promise compartilhada para impedir corridas entre pedidos concorrentes.
- Apenas 403 INVALID_SESSION permite repetição: validação de autorização acontece antes do processamento no backend.
- A reexecução reutiliza exatamente o mesmo corpo, Blob e request_id.
- Network errors e timeouts não são repetidos, pois uma operação pode ter sido executada sem resposta.
- Não usar polling de sessão em segundo plano, nem deixar o microfone ativo fora da interação.
- Versionar a interface clássica do Pet no mesmo pacote do gateway Gemini Live, incluindo testes no workflow existente.
- O Service Hub permanece com APIs de missão e infraestrutura somente leitura.
