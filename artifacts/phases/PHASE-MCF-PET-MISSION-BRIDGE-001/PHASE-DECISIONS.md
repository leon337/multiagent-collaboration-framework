# Limites de autoridade

1. source=MCF_MISSION_CONTROL_READ_ONLY, status=READY, repositório exato,
   frescor de até 120 segundos e ID da missão são necessários para declarar
   observação canônica.
2. AUTH_NOT_CONFIGURED, timeout, HTTP 401/403, fonte discordante ou resposta
   velha não geram afirmações de que não há missões.
3. Rascunho local nasce somente de proposta previamente reviewed_for_planning
   por um humano com acesso ao painel; versão otimista é obrigatória.
4. Rascunho local NÃO é missão criada, NÃO emite HUMAN_GATE e NÃO autoriza ação.
5. Payload é formatado segundo contrato do controller canônico (schema v1.1),
   classe de risco provisória C e fonte rastreável da proposta.
6. O endpoint /v1/mcf/missions exige SessionAuthGuard; o Pet não tenta
   fabricar ou reutilizar credenciais de identidade humana.
7. Entrada Capability Registry é versionada, mas rotulada
   authorization_state=NOT_AUTHORIZED e connection_state=DISCONNECTED
   enquanto não houver conexão comprovada.
8. Nenhuma importação automática, serviço novo ou deploy central.
