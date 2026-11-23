# MCF-20261123-GOOGLE-DRIVE-AGENT-001 — Relatório de implementação

**Data:** 2026-11-23  
**Coordenador:** MESTRE  
**Autoridade humana:** LEANDRO  
**Estado:** IMPLEMENTADO NO DSH / AGUARDANDO CONSENTIMENTO OAuth  
**Risco:** B — OAuth e criação limitada de arquivos

## Resultado

Foi criado e registrado no DSH o preset **MCF Google Drive Agent** (`mcf-google-drive-agent`) com workspace isolado. Os agentes e presets anteriores foram preservados; o Agent Studio Brain continua como planner e permanece sem ferramentas operacionais.

O agente possui um conector Google Drive dedicado com OAuth Desktop + PKCE, verificação de identidade e escopo mínimo `drive.file`. O código não implementa operações de excluir, sobrescrever, mover, compartilhar ou alterar permissões.

## Ferramentas expostas

1. `mcf_google_drive_status` — estado OAuth e identidade.
2. `mcf_google_drive_search` — busca por nome nos arquivos acessíveis ao aplicativo.
3. `mcf_google_drive_create_folder` — criação de pastas, sem duplicar nomes no mesmo local.
4. `mcf_google_drive_create_text_file` — criação de arquivos UTF-8, sem sobrescrever.
5. `mcf_google_drive_read_text_file` — leitura de arquivos de texto suportados.

O guard do preset nega ferramentas não listadas. O acesso fica restrito aos arquivos criados pelo aplicativo ou explicitamente abertos/selecionados pelo usuário.

## Segurança

- OAuth Desktop com PKCE e validação da conta esperada antes das operações.
- Escopo solicitado: `drive.file`; escopos amplos `drive` e `drive.readonly` são rejeitados.
- Refresh token cifrado com AES-256-GCM.
- Diretório privado com permissão 0700; arquivos de credencial/token com 0600.
- Auditoria registra operação, resultado, trace ID e duração, sem conteúdo de arquivos ou tokens.
- Credenciais e configuração de conta permanecem fora do repositório.
- O agente não cria conteúdo sem solicitação explícita de LEANDRO.
- Para projetos Git, GitHub/repositório local permanece como fonte de verdade; não criar um diretório `.git` ativo em pasta sincronizada pelo Drive.

## Evidências de validação

- Agent Studio: `npm run check` aprovado; **9/9 testes**.
- Google Drive Agent: `npm run check` aprovado; **9/9 testes**.
- Verificação DSH: **4 presets isolados**, IDs e diretórios distintos; 17 sessões legadas preservadas e zero sessões sem associação.
- Smoke test no DSH: sessão do novo preset criada e a ferramenta de status invocada. Resultado `OAUTH_REQUIRED`, conforme esperado antes do consentimento.
- O cliente OAuth foi copiado para o cofre privado local; nenhum segredo foi exibido ou versionado.

## Pendências / próximo gate

1. LEANDRO deve concluir o consentimento OAuth no Brave do computador, confirmando a conta Google pretendida e o escopo `drive.file`.
2. Após o callback, validar `mcf_google_drive_status` e confirmar a identidade.
3. Somente depois, LEANDRO informa o nome e a localização do projeto que deseja criar no Drive.
4. Não houve criação de pastas ou arquivos no Drive nesta missão.

**Observação:** a primeira tentativa de consentimento expirou sem callback; a conexão permanece desligada. Nenhum acesso foi concedido pelo agente.