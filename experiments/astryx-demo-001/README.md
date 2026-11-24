# MCF × Astryx — experimento isolado

**Missão:** MCF-ASTRYX-EXPERIMENT-001  
**Status técnico:** demo construída e smoke test aprovado.  
**Status de governança:** missão demo encerrada; parecer arquitetural por função Sofia e decisão de gate interno por função Léo executados pelo MESTRE, conforme solicitação explícita de LEANDRO. Não são mensagens ou receipts autenticados dos agentes canônicos.  
**Ambiente:** sandbox fora de produção.

## Objetivo

Avaliar Astryx como camada visual para uma interface React do MCF, sem integrar pacotes ao frontend principal e sem alterar runtime, governança, banco de dados, permissões, deploy ou produção.

## Compatibilidade e versões

- Frontend MCF identificado: React 19.2.8 e Vite 8.1.5.
- Sandbox: React 19.2.8 e Vite 8.1.5.
- Pacotes fixados: `@astryxdesign/core@0.7.16`, `@astryxdesign/theme-neutral@0.7.16`, `@astryxdesign/cli@0.7.16`, `@stylexjs/stylex@0.19.1`.
- Theme Neutral declara peer dependency exata `@astryxdesign/core@0.7.16`; por isso Core e Theme foram alinhados na mesma versão publicada.
- O caminho adotado usa CSS pré-compilado do Astryx. Não foi ativado o plugin StyleX de build.
- Node utilizado no host: v24.22.2.
- Os scripts `postinstall` de Core e CLI foram inspecionados. Eles apenas verificam se o projeto está configurado para o prompt de agentes e podem exibir a orientação `astryx init`. A permissão foi registrada para essas duas versões exatas no `allowScripts` local.

## Execução local

```bash
npm ci
npm run astryx -- component Button
npm run build
npm run dev
```

O sandbox escuta exclusivamente em `127.0.0.1:41782`.

## Escopo funcional

1. Visão geral da missão com métricas e entregáveis.
2. Estado explícito dos agentes, separado entre identidade e gate.
3. Linha do tempo de eventos de demonstração.
4. Alternância de tema claro/escuro.
5. Checkpoint local que acrescenta um evento à linha do tempo.

Os eventos exibidos são estado local React. Não são persistidos e não são receipts assinados pelo runtime MCF.

## Resultado

Build, instalação limpa, CLI e smoke test de browser foram aprovados. Os números e limites estão em [benchmark.md](./benchmark.md); evidências em [evidence.md](./evidence.md); revisão arquitetural em [sofia-architecture-review.md](./sofia-architecture-review.md); decisão de gate interno em [leo-gate-decision.md](./leo-gate-decision.md).

## Limitações e gates

- `mcf-gpu-x99` estava offline quando a missão foi executada. O sandbox foi construído em `leo-N43SM`, sob `/tmp/mcf-astryx-demo-001`. Não houve uso de GPU nem alterações em outros projetos.
- O Agent Bridge `mestre-conversas-teste-001` respondeu HTTP 200, mas Sofia apareceu como `UNBOUND`, sem handshake verificado e sem sessão canônica.
- O binário `~/.local/bin/mcf-agent-session`, exigido pelo cockpit para listar agentes canônicos e executar bootstrap, não foi encontrado no host. O registry devolveu `canonicalAgents=[]` e `agentSessions=[]`.
- A função de arquitetura de Sofia e a função de gate interno de Léo foram exercidas pelo MESTRE por solicitação de LEANDRO e registradas em documentos separados. A identidade canônica/assinatura dos agentes não foi simulada. A missão demo foi encerrada dentro do escopo autorizado.
- A compatibilidade React/Vite é estrutural. Não foi feita integração no frontend MCF, build comparativo baseline, auditoria WCAG completa ou teste de performance em produção.
- Não foi criado PR nem realizada integração na branch principal.

## Critérios para avançar à integração

1. Restaurar o broker `mcf-agent-session` e confirmar handshake de identidade de Sofia.
2. Obter parecer arquitetural de Sofia sobre composição, CSS, temas, acessibilidade e estratégia de migração.
3. Obter decisão de gate de LÉO sobre escopo, evidências e continuidade.
4. Comparar o baseline real do frontend MCF com uma branch de integração dedicada, sem alterar produção.
5. Executar regressão visual, acessibilidade e performance em ambiente controlado.
6. Solicitar autorização humana específica antes de qualquer integração, PR de produto, deploy ou alteração de produção.

## Rollback

Remover somente o diretório temporário `/tmp/mcf-astryx-demo-001` e, quando o experimento for encerrado, a branch `experiment/astryx-demo-001`. Não há alteração ou migração a desfazer no frontend principal.
