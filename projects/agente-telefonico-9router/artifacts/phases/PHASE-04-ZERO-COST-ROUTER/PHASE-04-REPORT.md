# Execução da fase 04 — cronologia real
1. Revalidou issue #449, PR #450 e instruções vigentes do MCF (GitHub); notebook Predix online.
2. 9Router local v0.5.104 active, health 200, admin API 401 sem login, providerConnections 0; provedor OpenCode Free opera com conexão virtual noAuth.
3. Auditou 20 registros anteriores: modelos mimo-v2.6-flash-free, longcat-2.5-preview-free e nemotron-3.5-lightning-free tiveram custo 0; modelos DeepSeek v4.1 Flash, GLM 5.3 Flash e MiniMax M3.1 Flash exibiram custo contabilizado POSITIVO, apesar de nome free. Não adicioná-los à allowlist.
4. Documentação oficial OpenCode Zen confirma preços gratuitos para MiMo V2.6 Flash, LongCat 2.5 Preview e Nemotron 3.5 Lightning.
5. Preservou ZERO_COST_ONLY=1, implementou allowlist exata de 3 IDs e exigência de localhost:20128; modelo pago default bloqueado. 8 testes adicionais de seleção/contrato.
6. Uma chamada real de inferência ao gateway local para MiMo-V2.6 Flash retornou HTTP 200 e usageHistory +1, cost_delta=0.0; não retornou conteúdo textual utilizável com limite de 14 tokens. Tentativa adicional foi bloqueada pela ferramenta: não contornada.
7. Implementou fallback explícito para conteúdo vazio/null, 3 testes extras. Total local = 43 passing; Colab CPU pendente antes da próxima execução.
8. Sem gastos financeiros demonstrados; o campo 'cost' pode ser contabilidade interna e não fatura: não alegar saldo de cobrança.
9. Testes locais reexecutados: 43/43 passed, 1 warning. Google Colab CPU Potiguar sessão mcf449-p04-free43-cpu: 43/43 passed, MCF449_V2_CPU_COLAB_PASS, exit 0, encerrada automaticamente.
10. Rejeição explícita do modelo paid e fallback para resposta sem conteúdo comprovados em testes. Última tentativa de chamada real de diagnóstico foi bloqueada por proteção da ferramenta: não repetida.
