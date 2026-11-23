# MCF-20261123-GOOGLE-DRIVE-AGENT-001 — Relatório de implementação

**Data:** 2026-11-23
**Coordenador:** MESTRE
**Autoridade humana:** LEANDRO
**Estado:** OPERACIONAL — OAuth, preset DSH e chat Agent Studio verificados
**Risco:** B — escrita e exclusão em conta Google; confirmação obrigatória para exclusão

## Resultado executivo

O preset **MCF Google Drive Agent** (mcf-google-drive-agent) está montado no DSH com workspace nativo isolado. O OAuth foi reautorizado e o próprio agente confirmou a conta potiguaradm23@gmail.com, accountMatches=true, escopo drive e error=null.

A integração foi verificada em uma sessão DSH nova. A sessão antiga preservava a composição anterior do preset; por isso foi criada uma nova sessão após corrigir o schema das ferramentas e reiniciar o runtime proprietário da ponte.

## Ferramentas expostas

1. mcf_google_drive_status — estado OAuth, identidade e escopo.
2. mcf_google_drive_search — busca por nome em todo o Drive acessível à conta.
3. mcf_google_drive_create_folder — criação idempotente de pastas.
4. mcf_google_drive_create_text_file — criação de arquivos UTF-8 sem sobrescrever.
5. mcf_google_drive_read_text_file — leitura de texto UTF-8, exportação de Google Docs para text/plain e Google Sheets para text/csv.
6. mcf_google_drive_update_text_file — atualização de texto UTF-8 e conteúdo de Google Docs via Docs API.
7. mcf_google_drive_rename_file — renomeação de arquivos, inclusive Google Docs.
8. mcf_google_drive_delete_file — exclusão somente após confirmação explícita de LEANDRO para o alvo exato.

O escopo OAuth drive dá acesso de API aos arquivos e pastas que a conta pode acessar. A superfície de ferramentas continua limitada às operações listadas; PDFs/OCR, apresentações, escrita em planilhas, cópia/movimentação, compartilhamento e gestão de permissões ainda não estão expostos.

## Segurança e governança

- OAuth Desktop + PKCE; identidade revalidada antes de cada operação.
- Refresh token cifrado com AES-256-GCM.
- Diretório privado com permissão 0700; arquivos de credencial/token com 0600.
- Auditoria registra operação, resultado, trace ID e duração, sem conteúdo ou tokens.
- Criação de arquivo não sobrescreve item existente; limites textuais de 200 KB.
- Exclusão exige confirmação de LEANDRO para o arquivo-alvo.
- O Agent Studio Bridge só é habilitado no processo DSH proprietário da porta 4319 por MCF_AGENT_STUDIO_BRIDGE=1. Isso evita disputa entre instâncias DSH pelo token local da ponte.
- HMR do perfil observa o diretório do Agent Studio; sessões antigas preservam a composição antiga e precisam ser substituídas por sessão nova após alterações de preset.

## Interfaces entregues

Com Tailscale ativo no dispositivo cliente:

- DSH: https://<tailnet-host>:8472/ — gateway privado com autenticação nativa e sem token DSH exposto na URL.
- Chat direto: https://<tailnet-host>:8492/google-drive — interface MCF Agent Studio, proxy tailnet-only e rotas allowlisted.

O botão Nova conversa cria uma sessão DSH nova e mantém a sessão anterior no histórico nativo do DSH.

## Evidências verificadas

- OAuth no próprio DSH: configured=true, connected=true, conta potiguaradm23@gmail.com, accountMatches=true, scope=drive, error=null.
- O preset informou as oito ferramentas disponíveis em sessão DSH nova.
- Pesquisa DSH encontrou 10 itens preexistentes relativos ao MCF v3.0.0 no Drive.
- Leitura real pelo DSH de mcf-v3.0.0-live-agent-resilient-spec.md, tipo application/vnd.google-apps.document, exportada como text/plain; conteúdo inicial conferido e documento não alterado.
- Interface Agent Studio local: /google-drive HTTP 200.
- Proxy móvel local: /google-drive HTTP 200.
- API do chat pelo proxy móvel: HTTP 200; o agente confirmou conta e escopo.
- Reset de conversa pelo proxy: HTTP 200 e nova sessão DSH confirmada.
- Gateway DSH: fluxo de autenticação nativa testado localmente; resposta autenticada HTTP 200.
- Google Drive Agent: npm run check aprovado; 14/14 testes.
- Agent Studio: npm run check aprovado; 9/9 testes.

## Limites conhecidos

A autorização OAuth é ampla, mas nem todos os endpoints do Google Drive foram transformados em ferramentas. Permanecem fora do escopo atual operações binárias/OCR, apresentações, escrita em planilhas, cópia/movimentação, compartilhamento e permissões. Não declarar cobertura integral da API até implementar e testar essas operações.

## Encerramento da missão atual

Pendências desta integração — OAuth, ativação do preset DSH, sessão nova, exportação de Google Docs, chat gráfico e acesso tailnet — verificadas como concluídas. A superfície operacional entregue está documentada acima; os limites restantes são evolução funcional, não bloqueios da autenticação ou do chat.
