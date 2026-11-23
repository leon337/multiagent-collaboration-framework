# MCF Google Drive Agent

Preset DSH dedicado: `mcf-google-drive-agent`.

## OAuth e identidade

- OAuth Desktop com PKCE.
- Escopo concedido: `https://www.googleapis.com/auth/drive` (Drive completo da conta autorizada).
- Identidade Google verificada antes de cada operação de leitura/escrita.
- Conta esperada configurada no preset DSH: `potiguaradm23@gmail.com`.
- Tokens cifrados com AES-256-GCM em `~/.config/mcf-google-drive-agent`; diretório 0700 e arquivos 0600.
- Nenhum token ou segredo é impresso em respostas, logs ou documentação.

O escopo `drive` permite à aplicação operar sobre arquivos e pastas que a conta Google autorizada pode acessar. Isso não significa que todas as APIs do Drive estejam expostas como ferramentas: a superfície operacional é limitada às ferramentas descritas abaixo.

## Ferramentas disponíveis no preset

1. `mcf_google_drive_status` — verifica OAuth, identidade, escopo e conectividade.
2. `mcf_google_drive_search` — pesquisa arquivos e pastas pelo nome em todo o Drive acessível.
3. `mcf_google_drive_create_folder` — cria pasta; evita duplicação de nome no mesmo local.
4. `mcf_google_drive_create_text_file` — cria arquivo UTF-8 sem sobrescrever um existente.
5. `mcf_google_drive_read_text_file` — lê texto UTF-8, exporta Google Docs para `text/plain` e Google Sheets para `text/csv`.
6. `mcf_google_drive_update_text_file` — atualiza texto UTF-8 ou o corpo de um Google Docs pela Docs API.
7. `mcf_google_drive_rename_file` — renomeia arquivos, inclusive Google Docs.
8. `mcf_google_drive_delete_file` — exclui arquivo somente após confirmação explícita de LEANDRO para o alvo exato.

## Limites e proteção

- Conteúdo textual limitado a 200 KB por operação.
- IDs, nomes, consultas e payloads são validados antes de chamadas à API.
- Criação de arquivo não sobrescreve itens existentes.
- Criação de pasta é idempotente para o mesmo nome e pasta pai.
- Identidade da conta é revalidada em cada operação.
- Arquivos binários, PDFs/OCR, apresentações, escrita em planilhas, cópia/movimentação, compartilhamento e gestão de permissões ainda não são ferramentas deste preset.
- Exclusão não é automática: exige confirmação explícita do alvo por LEANDRO.

## Integração DSH

O perfil `web` declara o preset `mcf-google-drive-agent` e carrega `plugin.mjs`. O DSH valida os schemas das ferramentas na montagem; parâmetros presentes devem ser obrigatórios. Por isso, atualização de conteúdo e renomeação são ferramentas separadas.

O plugin de ponte do Agent Studio usa a variável `MCF_AGENT_STUDIO_BRIDGE=1` e deve ser montado somente no processo DSH proprietário da porta local 4319. Isso evita disputa pelo token da ponte quando há mais de uma instância DSH usando o mesmo perfil. O serviço `mcf-dsh-runtime.service` recebe essa variável por drop-in systemd.

O HMR do perfil deve observar o diretório do Agent Studio para que alterações nos módulos locais sejam recarregadas. Sessões já existentes preservam a composição antiga; após alterar ferramentas/preset, crie uma sessão DSH nova.

## Interfaces

Com Tailscale ativo no dispositivo cliente:

- DSH: `https://<tailnet-host>:8472/` (gateway privado com autenticação nativa; não expõe o token DSH na URL).
- Chat direto com o agente: `https://<tailnet-host>:8492/google-drive` (proxy tailnet-only com allowlist de rotas).

A interface gráfica mantém o contexto da sessão DSH e um histórico local do navegador. O botão “Nova conversa” cria uma nova sessão DSH; a sessão anterior permanece no histórico nativo do DSH.

## Preparar OAuth

O script de instalação copia a configuração de um cliente OAuth Desktop para o cofre privado do agente; nenhum segredo é impresso ou versionado. Por padrão, ele procura o cliente local em `~/.config/estudio-binaural/google-drive-oauth-client.json`. Se o arquivo estiver em outro local, defina `MCF_GOOGLE_DRIVE_SOURCE_OAUTH_CLIENT` antes de executar o script.

```bash
MCF_GOOGLE_DRIVE_SOURCE_OAUTH_CLIENT="$HOME/.config/estudio-binaural/google-drive-oauth-client.json" node install-oauth-client.mjs
MCF_GOOGLE_DRIVE_EXPECTED_EMAIL=conta-autorizada@exemplo.com node oauth.mjs
```

O titular confirma a conta Google e concede o escopo `drive`. O agente valida a identidade e rejeita outra conta.

## Validar

```bash
npm run check
npm test
```

A suíte do conector cobre armazenamento cifrado, identidade/escopo, busca, criação, leitura de texto, exportação Google Docs, atualização de Google Docs, renomeação, exclusão controlada, limites e falhas de autorização.

Para conferir a conexão sem criar arquivos:

```bash
node --input-type=module -e "import('./drive-api.mjs').then(async m=>console.log((await m.invoke('google_drive.status',{},process.env.MCF_GOOGLE_DRIVE_EXPECTED_EMAIL)).result))"
```

## Uso responsável

Para projetos Git, mantenha o repositório Git real no computador/GitHub. Use o Drive para documentos, exportações e cópias. Não mantenha o diretório `.git` ativo dentro de uma pasta sincronizada pelo Drive.

O agente não cria, altera, renomeia ou exclui nada sem solicitação explícita de LEANDRO. Arquivos existentes nunca são sobrescritos pela ferramenta de criação.
