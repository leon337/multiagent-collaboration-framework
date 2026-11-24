# Livro de evidências — MCF-ASTRYX-EXPERIMENT-001

**Snapshot:** 24/11/2026  
**Branch isolada:** `experiment/astryx-demo-001`  
**Main de origem:** `310d6577d0144b406f72a0a07bd730ed81e22fc7`

## Evidências técnicas

- `npm ci` com lockfile: 166 pacotes instalados, 9,30 s, exit code 0.
- `npm ls --depth=0`: Core, Theme Neutral, CLI, StyleX, React, React DOM e Vite nas versões fixadas, exit code 0.
- CLI Astryx executou documentação de componentes `Button`, `Card`, `Stack`, `Badge`, `Heading` e `Text`.
- `npm run build`: 2.359 módulos, exit code 0.
- Preview local: HTTP 200.
- Playwright/Chrome: tema escuro, mudança de seção, adição de checkpoint e viewport móvel verificados.
- Rodada final: sem erros de console ou HTTP 4xx; sem overflow em 390 px.

## Evidência de arquitetura e agente

- O endpoint de descoberta do Agent Bridge `mestre-conversas-teste-001` retornou HTTP 200.
- Descoberta identificou a conversa de Sofia, mas seu estado canônico foi `UNBOUND`, `handshakeVerified=false`, sem `sessionId` e sem `traceId`.
- `canonicalAgents=[]` e `agentSessions=[]`.
- A tentativa de consultar o executável esperado `/home/leo/.local/bin/mcf-agent-session` retornou “Arquivo ou diretório inexistente”.
- O bootstrap de Sofia exige broker/cadastro canônico, envio do contrato e confirmação do marcador de handshake. Não foi contornado por mensagem textual comum.
- A função arquitetural de Sofia foi exercida pelo MESTRE em parecer explícito e não independente, registrado em sofia-architecture-review.md.
- A função de gate interno de Léo foi exercida pelo MESTRE, sob instrução de LEANDRO, e registrada em leo-gate-decision.md. A decisão encerra somente o escopo da demo.
- O broker/session dos agentes canônicos não foi autenticado; os artefatos não se apresentam como mensagens ou receipts dos agentes reais.

## Integridade do escopo

- Nenhuma dependência foi adicionada ao frontend principal do MCF.
- Nenhuma alteração foi feita em runtime, banco, permissões, autenticação ou produção.
- Nenhuma PR foi criada, nenhum merge foi executado e nenhum deploy foi disparado.
- O código da demo permanece no diretório isolado `/tmp/mcf-astryx-demo-001`; a branch do experimento contém somente artefatos do experimento.


## Fechamento do escopo por funções delegadas

- Parecer arquitetural por função Sofia: APROVADO PARA SANDBOX; integração principal não aprovada.
- Gate interno por função Léo: ACEITO PARA ENCERRAMENTO DO EXPERIMENTO EM SANDBOX.
- Estado terminal da missão experimental: ENTREGUE.
- A limitação de autenticidade das identidades canônicas foi preservada como dado, sem bloquear a conclusão do escopo expressamente autorizado por LEANDRO.
