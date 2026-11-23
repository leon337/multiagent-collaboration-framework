# MCF Google Drive Agent

Preset DSH dedicado: `mcf-google-drive-agent`.

## Permissões

- OAuth Desktop + PKCE.
- Escopo único: `drive.file`.
- Identidade da conta validada antes de cada operação.
- O agente só acessa arquivos criados por este aplicativo ou explicitamente abertos/selecionados pelo usuário.
- Ferramentas: status, busca por nome, criação de pastas, criação de arquivos de texto e leitura de arquivos de texto.
- Sem exclusão, sobrescrita, movimentação, compartilhamento ou alteração de permissões.
- Tokens cifrados com AES-256-GCM em `~/.config/mcf-google-drive-agent`; diretório 0700 e arquivos 0600.

## Preparar OAuth

O script de instalação copia a configuração de um cliente OAuth Desktop para o cofre privado do agente; nenhum segredo é impresso ou versionado. Por padrão, ele procura o cliente local em `~/.config/estudio-binaural/google-drive-oauth-client.json`. Se o arquivo estiver em outro local, defina `MCF_GOOGLE_DRIVE_SOURCE_OAUTH_CLIENT` antes de executar o script.

```bash
MCF_GOOGLE_DRIVE_SOURCE_OAUTH_CLIENT="$HOME/.config/estudio-binaural/google-drive-oauth-client.json" node install-oauth-client.mjs
MCF_GOOGLE_DRIVE_EXPECTED_EMAIL=conta-autorizada@exemplo.com node oauth.mjs
```

O navegador abrirá a tela do Google. O titular deve confirmar a conta Google indicada e conceder o escopo `drive.file`. O agente verifica a identidade retornada pelo Google e rejeita outra conta.

## Validar

```bash
npm run check
npm test
```

Para conferir a conexão sem criar arquivos:

```bash
node --input-type=module -e "import('./drive-api.mjs').then(async m=>console.log((await m.invoke('google_drive.status',{},process.env.MCF_GOOGLE_DRIVE_EXPECTED_EMAIL)).result))"
```

## Uso responsável

Para projetos Git, mantenha o repositório Git real no computador/GitHub. Use o Drive para documentos, exportações e cópias. Não mantenha o diretório `.git` ativo dentro de uma pasta sincronizada pelo Drive.

O agente não cria nada automaticamente. LEANDRO deve solicitar a criação e informar o nome/local do projeto. Arquivos existentes nunca são sobrescritos.