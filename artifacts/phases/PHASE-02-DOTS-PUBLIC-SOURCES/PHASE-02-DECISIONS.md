# PHASE-02 — Decisões e questões abertas

## Decisões
- D-201: usar fontes primárias OpenAI para afirmações sobre Dots; cobertura secundária não substitui a fonte oficial.
- D-202: classificar como UNKNOWN detalhes internos de Dots não publicados, inclusive scheduler completo, schemas internos e topologia de subagentes.
- D-203: distinguir descrição de produto, métrica de system card e inferência arquitetural.
- D-204: métricas de avaliações finitas não significam risco zero nem generalização para toda produção.
- D-205: comparar contratos e responsabilidades, não alegar que MCF precisa reproduzir a arquitetura proprietária da OpenAI.
- D-206: nenhuma ação live no produto Dots e nenhuma escrita/implantação MCF foram executadas nesta fase.

## Respondidas
- Dots é só um chatbot? Não conforme descrição oficial: há workspace/computer/browser próprios, trabalho persistente, ferramentas conectadas, canais e salvaguardas específicas.
- Proatividade e mutação são a mesma capacidade? Não; a pesquisa proativa é descrita como read-only e ações subsequentes seguem gates normais.
- Existe controle independente da execução do agente? A OpenAI declara que Auto-review e controles obrigatórios ficam fora do ambiente que o dot pode alterar.
- A memória apaga por completo quando o dot é excluído? Não; contexto do dot, arquivos/conversas e memórias transferidas têm comportamentos de deleção distintos.
- O sistema card prova segurança absoluta? Não; ele relata resultados finitos, com violações moderadas de escopo observadas em testes encadeados.

## Em aberto
1. Completar a matriz Dots × MCF com grau de evidência para cada domínio.
2. Comparar requisitos propostos com protocolos, code/tests atuais completos, incluindo se o read-only lane e o policy gateway existem em outros diretórios.
3. Propor DEP novo para o Manual em branch separada e revisar a numeração no banco/seed, sem publicar até validação autorizada.
4. Realizar revisão independente e um gate de qualidade do PRF.