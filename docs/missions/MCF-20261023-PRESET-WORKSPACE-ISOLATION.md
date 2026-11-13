# PHASE-10 — Isolamento nativo de workspace por preset

## Diagnóstico verificado
A ponte do Agent Studio usa um único HOME como cwd de Hello World Agent, MCF Agent Studio Brain e MCF Agent Studio Preview. O DSH considera Workspace pela correspondência exata da cwd persistida. Associar várias sessões no mesmo diretório mistura os presets. O SessionController nativo proíbe reassociar um sessionId salvo a outro cwd.

## Checklist de implementação e aceite
- [x] Preservar arquivos de histórico, perfil DSH e rascunho principal e gerar hashes antes/depois.
- [x] Criar três pastas físicas diferentes, sem credenciais compartilhadas por arquivo.
- [x] Registrar cada pasta com WorkspaceController; validar ids, nomes, paths exclusivos.
- [x] Criar/retomar sessões usando o workspaceId do preset correspondente.
- [x] Gerenciar sessões legadas sem reescrever cwd/históricos, com rotulagem clara.
- [x] Diagnóstico pela aplicação: exibir associação preset → workspace → sessionId.
- [x] Bloquear criação de sessão em grupo genérico/errado.
- [x] Testes unitários + integração real DSH por preset e verificação após reinício.
- [x] Validação visual da barra lateral do DSH e UI do Agent Studio.
- [x] Registrar PRF e evidências no MCF, sem merge/publicação de alterações do agente.

## Escopo e governança
A separação dos workspaces não instala presets adicionais nem modifica as instruções do Hello World Agent. Comunicação entre agentes ocorre pela API de orquestração, sem compartilhamento implícito dos diretórios de trabalho. PR permanece draft.


## Execução — diagnóstico e correção

**Causa comprovada:** o backend anterior usava uma única função sessionLocation() ligada a HOME, encaminhando os três presets para o mesmo workspaceId. O DSH associa a sessão pelo cwd imutável do seu header, não pelo nome do preset. A solução anterior agrupava sessões, mas misturava os agentes.

**Correção:** um mapeamento autorizado de três presets foi introduzido em dsh-session-bridge-v3.mjs. Para cada preset existe uma pasta física diferente, um Workspace Controller registry entry e workspaceId distinto. Todas as criações e retomadas por Agent Studio usam o workspaceId da identidade de preset correspondente, sem fallback ao cwd genérico.

## Workspaces DSH efetivamente registrados

| Preset | Workspace ID | Sessões próprias no aceite |
|---|---|---|
| Hello World Agent | f7ce7536-16a6-4def-b84e-16f61f36d282 | 2 |
| Agent Studio Brain | f8016dcd-1d15-4d61-a15a-056746e3037a | 2 |
| Agent Studio Preview | 0aad07dc-effc-4e5d-969a-e177b9d17856 | 1 |

Os diretórios são subpastas exclusivas de apps/mcf-agent-studio/.data/dsh-preset-workspaces/, com nomes iguais aos ids de preset. Nenhuma chave de API foi copiada para as pastas.

**Legado:** 17 sessões anteriores permanecem com seus headers imutáveis no grupo MCF Agent Studio — Legado (sessões anteriores). O histórico do Lab preservou 64 mensagens, mas iniciou um novo sessionId e, por isso, o frontend exibe claramente que o contexto da LLM não inclui a conversa antiga. A sessão antiga e seus dados persistidos não foram reescritos.

## ESEV: testes reais e validação visual

- Pela nossa aplicação GET /api/dsh/workspaces: três ids distintos, três paths distintos e isolationValid=true.
- Pela nossa aplicação POST /api/dsh/workspaces/probe: criada uma sessão DSH nativa em cada um dos três workspaces, confirmada no respectivo sessionIds, não no Legado.
- Browser Brave CDP: três cartões da aplicação mostrando IDs, pastas e estado nativo, em desktop (1360px), Android (390px) e Android pequeno (320px). Nenhum overflow horizontal; zero exceções JS.
- GUI real DSH: barra lateral expandida confirmou MCF • Agent Studio Preview, MCF • Agent Studio Brain, MCF • Hello World Agent e grupo Legado. Captura privada em /tmp/mcf-preset-isolation-qa/dsh-sidebar-after-toggle.png, não enviada ao GitHub porque contém conteúdo de conversas.
- Reinício gerenciado mcf-dsh-runtime.service: NRestarts=0, os mesmos ids e associações reapareceram. npm run verify:workspaces passou antes e depois.
- npm test: 9/9; npm run check: aprovado. Nenhuma segunda chave de modelo.
- Hash do perfil web DSH conservado: 9a9585f3edf915a2e515b79ac97a22e1b8fed5b443f151bfb095932f828922b0.
- Hash do rascunho principal Studio conservado: ae4d8d91a95c29daf2a484351e551d23c806f5911ca2f213a2b90a8b6329deab.
- O estado privado do Lab mudou legitimamente para armazenar a nova sessão; suas 64 mensagens estão preservadas.

## Limite explícito e governança

A associação automática se aplica às sessões criadas pelo Studio/ponte MCF. Na interface geral do DSH, um usuário pode escolher manualmente outro workspace; não foi implementado interceptador global para as sessões manuais. O MCF continua podendo orquestrar comunicação explícita entre agentes pelos fluxos existentes, não por compartilhamento implícito de pastas. Nenhum sistema novo de mensagens entre agentes ou novo preset foi criado nesta fase. Sem publicação de agente e sem merge na main. Auditoria independente pendente.

Evidências sem conversas privadas em docs/missions/evidence/phase10-preset-workspaces.
