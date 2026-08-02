# Ciclo 4 — Log de Contribuições Técnicas

## Agentes selecionados

### Mestre — Coordenação
- **Entrada:** continuidade automática após o Ciclo 3.
- **Análise:** organizou o gate técnico e a ordem dos artefatos.
- **Decisão:** planejamento deve terminar antes do primeiro scaffold.
- **Entrega:** pacote consolidado do Ciclo 4.

### Léo — Autoridade Delegada
- **Entrada:** arquitetura, dados e threat model aprovados.
- **Análise:** avaliará o gate após auditoria independente.
- **Entrega:** decisão formal no encerramento do ciclo.

### Sofia — Arquitetura
- **Achado:** o monólito modular deve permanecer uma única base de domínio, com API/web e worker como processos controlados.
- **Decisão:** contratos publicados e proibição de acesso direto entre módulos.

### Rafael — Engenharia Integrada
- **Achado:** a fundação precisa preceder qualquer vertical de produto.
- **Decisão:** slices verticais pequenos, TypeScript estrito e gates reproduzíveis.

### Eduardo — Backend
- **Achado:** autorização, idempotência, outbox e erros públicos precisam nascer na fundação.
- **Decisão:** NestJS e contratos explícitos de comando/evento.

### Helena — Frontend
- **Achado:** frontend precisa compartilhar contratos, mas não importar domínio interno do servidor.
- **Decisão:** React/Vite, componentes acessíveis e API versionada.

### Manoel — Dados
- **Achado:** migrações destrutivas precoces aumentariam risco de reescrita.
- **Decisão:** SQL versionado, expand-and-contract e PostgreSQL real nos testes de integração.

### Renato — Qualidade
- **Achado:** cobertura percentual isolada não protege regras críticas.
- **Decisão:** testes explícitos por risco, contrato, concorrência, idempotência e E2E.

### Bruno — Plataforma
- **Achado:** CI deve reproduzir instalação, migrações e testes sem segredos pessoais.
- **Decisão:** lockfile obrigatório, ambientes separados e deploy ainda bloqueado.

### Ricardo — Segurança
- **Achado:** negação por padrão, segredo fora do código e revogação imediata são P0.
- **Decisão:** testes de bypass, replay, enumeração, quota e adulteração de autoria.

### Gabriel — Integração
- **Achado:** grandes PRs dificultam auditoria e rollback.
- **Decisão:** branches curtas, ordem de PRs e integração controlada.

### Vinícius — Revisão e Refatoração
- **Achado:** duplicação será evitada por contratos e análise prévia obrigatória.
- **Decisão:** nenhuma correção sem revisão do diff e remoção do código substituído.

### Patrícia — Debugging
- **Achado:** falhas devem produzir caso reproduzível antes de patch.
- **Decisão:** causa provável/comprovada registrada antes da correção.

### Lucas — Manutenibilidade e Performance
- **Achado:** cache e otimizações sem métrica seriam prematuros.
- **Decisão:** instrumentar primeiro e otimizar somente com evidência.

### Carmem — Documentação
- **Entrega:** plano, contratos, estratégia técnica e backlog rastreáveis.

### Emily — Auditoria Independente
- **Entrada:** pacote completo do Ciclo 4.
- **Entrega:** RC formal antes da decisão de Léo.

## Agentes não selecionados

Leonardo, Carlos, Evelyn, Laura, Isabela, Marina, Tiago, Daniela e André não foram convocados para a autoria principal deste recorte porque produto, UX, UI, acessibilidade, IA, dados analíticos e mobile já possuem requisitos estabelecidos ou pertencem a fases posteriores. Seus contratos permanecem válidos e eles serão chamados quando os respectivos slices forem iniciados.
