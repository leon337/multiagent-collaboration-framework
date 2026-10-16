# MCF-ORACLE-001 — Decisões rastreáveis P0

1. **Boundary P0:** autenticação/instalação de ferramenta e execução de testes isolados; proibir modificação constitucional e produção sem gate.
2. **Runner escolhido:** GitHub Actions com PostgreSQL efêmero, para reduzir dependência do notebook e respeitar estratégia cloud-first.
3. **Agentes cognitivos:** não atribuir autoria independente aos oito processos determinísticos do LocalAgentTeamAdapter; todos marcam `cognitiveIndependenceProven: false`.
4. **Patches limitados:** compilar branch corrigindo falhas já registradas em #427 (tipo registry e fechamento de teste).
5. **P0 adapter:** usar `AgentExecutionService` real e provider determinístico apenas de teste; nenhum modelo não autenticado será invocado.
6. **Registro de skills:** corrigir dois contratos EXPERIMENTAL de web events sem `fallback` e `handoff_to`; adotar fail-closed sem ativar ações.
7. **CAPTURAR/CORRIGIR/VALIDAR:** separar falhas de shell, cwd e schema por evidência do runner antes de nova tentativa.
8. **Status após job 117134792530:** fase técnica P0 verificada, 25 testes PASS e PostgreSQL E2E PASS; ORÁCULO permanece não autenticado e não implementado.
9. **Autoridade:** nenhuma decisão estratégica de GPT-6 Astra nem auditoria cognitiva independente foi tomada nesta fase; LÉO/LEANDRO reservados.
10. **Custo:** nenhuma chamada à API comercial OpenAI; usar apenas recursos preexistentes.
