# MCF — Correção: Workspace nativo do DeepSeek Harness
Data: 2026-10-23
Missão: MCF-20261023-AGENT-BUILDER-GUIDED-001
PR: #468 (draft)

## Falha observada
O usuário mostrou sessões do Agent Studio em Ungrouped no DSH. O Phase-08 criou workspaces locais para arquivos, mas não os registrou no Workspace Registry do Harness. Esse registro exige path canônico igual ao cwd da Session e o identificador da Session presente na lista de membros.

## Correção
- Auditei pela interface nativa de Session Controller: 15 sessões com cwd do Studio, zero delas vinculadas, e 36 sessões de outros diretórios.
- Registrei o próprio diretório já usado pelo Studio via Workspace Controller create({path: HOME}); a operação criou o workspace.
- Nomeei MCF Agent Studio — Agentes, id d1f80e29-577c-4e87-a38c-9954c3c1f44c.
- Anexei 15 sessões cuja cwd canônica era igual ao path do workspace, pela função nativa attachSession. Nenhum header ou histórico foi reescrito.
- A ponte dsh-session-bridge-v3.mjs agora injeta workspaceController e workspaceRegistry e usa workspaceId para criar ou retomar as sessões do Studio, inclusive Lab e prévias.
- Se o Workspace for excluído do DSH, as próximas sessões falharão explicitamente em vez de reaparecer silenciosamente em Ungrouped.
- Rotas locais protegidas pelo token nativo do Bridge: GET /workspace/status para auditoria e POST /workspace/ensure para recuperar registro/associação. Não expostas no proxy Tailscale móvel.

## Validação
- Workspace registrado, 15 sessões anexadas, zero sessões Studio em Ungrouped, 36 sessões de outros cwd mantidas sem alterações.
- Repetição da operação nativa: created=false, sem duplicações.
- Reinício do DSH oficial: membership persistiu (15, zero desconectadas), MainPID gerenciado pelo systemd, NRestarts=0.
- Brave GUI real, DSH em 127.0.0.1:3080: workspace visível na barra lateral, com Oi - Sessão de Codificação e JSON com resposta Olá DSH dentro dele.
- npm test: 9/9; npm run check: aprovado.
- Hash SHA-256 do perfil web DSH preservado: 9a9585f3edf915a2e515b79ac97a22e1b8fed5b443f151bfb095932f828922b0.
- Hash SHA-256 do rascunho principal: ae4d8d91a95c29daf2a484351e551d23c806f5911ca2f213a2b90a8b6329deab.
- Lab continua acessível com histórico de 60 mensagens e mesma sessionId; seu arquivo de estado pode mudar em uso normal.

## Incidente operacional adjacente
Uma instância órfã do DSH ocupava a porta 3080 e o serviço oficial estava reiniciando continuamente. A instância órfã foi terminada de forma limpa e o DSH passou a funcionar sob mcf-dsh-runtime.service. Reinício posterior confirmado, sem loop.

## Escopo e governança
Correção limitada a sessões do cwd do Studio. Não alterou outras sessões, não criou novo preset nem modificou o agente publicado. A auditoria independente e o gate de merge do MCF continuam pendentes. Screenshot privada de verificação só no notebook, em /tmp/mcf-dsh-sidebar-native-verification.png, não publicada no GitHub por conter dados de conversas.
