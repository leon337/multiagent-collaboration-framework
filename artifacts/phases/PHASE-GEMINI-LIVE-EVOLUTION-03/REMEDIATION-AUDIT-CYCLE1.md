# Remediação F3 do parecer externo
Original SHA: d56d701e54bd26f460b6a76117a8e3863af74ee1
Original decision: RETURN_FOR_CORRECTION (2 HIGH e 6 MEDIUM).

1. HIGH startup cancel: epoch e startingClient; endSession antes de connect resolver
não permite posterior callTool. Teste de corrida adicionado e aprovado.
2. HIGH cancelamento de lote: mcpEpoch revoga modal, interrompe tools restantes
e descarta respostas tardias ao trocar de conexão.
3. Operações já despachadas podem ter efeito indeterminado. Sem replay automático,
resultado UNKNOWN e recibo, não falsa afirmação de sucesso.
4. TTL de aprovação abandonada é expirado no próximo prepare e gera EXPIRED.
5. Clique e digitação só TodoMVC pathname exato, alvo snapshot eN; revalidação
do URL real e do elemento atual antes de enviar a ferramenta ao MCP.
6. Teste Gemini real exige receipt de navigate; snapshot só é exigido quando chamado,
não uma fala contendo o domínio por acaso.
7. CI F1/F2 verifica manifesto corrente F3 quando o código F3 existe.
O manifesto F3 cobre código, testes F1/F2/F3, ops e os respectivos workflows.
8. Navegação para HTTPS público com aprovação por endereço e sem allowlist estática; sites autenticados,
autofill de credenciais, JS arbitrário e upload permanecem desabilitados.

Controles remanescentes: autenticação HDF nativa, egress/SSRF isolado, reconciliação
e gates F0/F1/F2/F3. Nenhum deploy público foi realizado.


## Seguimento da reauditoria
SHA 0f93855 recebeu PASS_WITH_RESERVATIONS para incorporação local em main,
mas NOT_APPROVED para deploy público. A reauditoria encontrou três problemas
corrigíveis: sessões revogadas podiam ser recriadas por prepare atrasado;
a documentação dizia allowlist mas o código aceitava qualquer URL HTTPS
pública validada com aprovação; e o teste real não exigia duas toolResponses.
Adicionado Set de IDs revogados (limite 512) validado por novo teste,
documentação corrigida e asserções que exigem navegação validada e reportam snapshot separadamente
com recibos distintos. As demais ressalvas (identidade HDF e egress/SSRF)
continuam pendentes.
