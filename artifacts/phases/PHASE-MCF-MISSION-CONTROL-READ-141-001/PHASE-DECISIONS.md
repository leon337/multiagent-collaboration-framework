# PHASE DECISIONS — MCF-MISSION-CONTROL-READ-141-001

1. Preservar o MissionRuntime e o ledger PostgreSQL como únicos escritores e fonte de verdade.
2. Não conectar o painel por acesso direto ao PostgreSQL nem duplicar dados em Neon.
3. Introduzir um endpoint GET novo com credencial separada, sem romper a rota legacy de consulta.
4. Quando não há credencial, responder sem dados (fail closed), nunca apresentar simulação como missão.
5. Limitar a UI atual à última missão até existir contrato de listagem canônica governado.
6. Na UI usar textContent para conteúdo vindo da origem; não devolver payload bruto, idempotency key ou recibo integral.
7. A configuração rejeita segredo igual aos tokens de execução e demais segredos principais.
8. Não criar PostgreSQL vazio nem executar pg_restore --clean em ambiente canônico sem dump+manifesto verificados e destino isolado.
9. Manter Issue #141 no discovery até alinhamento próprio; esta autorização refere-se a uma implementação isolada e reversível, não à promoção.
10. Não fazer merge, release ou deploy de produção nesta etapa.
