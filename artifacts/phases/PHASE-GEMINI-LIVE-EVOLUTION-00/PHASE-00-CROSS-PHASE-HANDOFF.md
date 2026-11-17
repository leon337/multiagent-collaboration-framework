# Proposta de handoff F0 -> F1/F2 (sem gate presumido)

## F0.2
Inventario e fonte de repro com SHA oferecem baseline documental. Requer reconciliacao formal.
## F0.3
Metadata de seis modelos e tres handshakes, mas quota, custo e capacidades completas nao comprovados.
## F0.4
Threat model e checagens de seguranca, com lacunas: chave plaintext, falta login e constraints de token. Manter somente loopback e nao expor producao.
## F0.5
Smoke 13/13 usou dispositivos VIRTUAIS. F1 posterior tem microfone fisico, audio percebido como funcional por LEANDRO e sessao de 632 segundos, todos com SHAs proprios. Proposta de transferencia formal de parte do aceite para F1, sujeita a decisao LEO. F0.5 NAO esta totalmente validado.
## F0.6
Contrato de telemetria memoria-only + whitelist e p50/p95 implementado parcialmente; faltam correlacao sessao/requisicao, consentimento e custos. F1 adiciona eventos, sem resolver custo/consentimento da F2.
## F0.7
MVP comment-only e testes de falsos positivos reforcados. Cobertura ampla de gates/eventos permanece fora do MVP, exige decisao formal de escopo.
## F0.8
PRF e revisoes externas entregues, sem identidade Emily/LEO autenticada nativa. Gate ainda pendente.

Proposta LEO: considerar APROVAR_COM_RESSALVAS apenas para continuidade LOCAL, nunca fechamento integral F0 ou deploy. Registrar explicitamente pendencias e responsaveis. O usuario autorizou sincronizacao e prosseguir rumo a F2, sem renuncia automatica aos gates.
A chave antiga permanece sem rotacao por decisao anterior de LEANDRO. Restricao local 127.0.0.1 continua.
