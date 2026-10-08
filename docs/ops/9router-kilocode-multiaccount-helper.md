# Helper — Kilo Code multi-conta no 9Router

O helper fica em `tools/ops` e não altera o contrato do MCF v1.4.0. Ele usa o suporte nativo do 9Router para múltiplas conexões e OAuth.

## Uso

`./tools/ops/9router-kilocode-account-helper.sh --self-test`

Executa diagnóstico do 9Router local, integridade do SQLite, conexões Kilo e estratégia de roteamento.

`./tools/ops/9router-kilocode-account-helper.sh --add-one`

Solicita somente UMA conta Gmail, abre a tela do Kilo Code no 9Router e aguarda a conclusão do OAuth. Depois valida que a nova conexão ficou ativa.

## Roteamento

Para Kilo Code o helper garante `fallbackStrategy=round-robin` e `stickyRoundRobinLimit=3`. Com várias contas ativas, o 9Router distribui chamadas entre as contas pela estratégia nativa e evita depender de uma única conta.

## Segurança

O helper nunca solicita nem imprime senha, access token, refresh token, API key ou cookie. O login da conta Gmail ocorre no OAuth oficial dentro do navegador.

## Alinhamento ao MCF v1.4.0

O MCF continua como camada de governança. O helper não cria provider adapter, não altera o execution contract e não ativa produção dentro do core do MCF; ele apenas opera a infraestrutura externa 9Router.
