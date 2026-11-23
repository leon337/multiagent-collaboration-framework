# MCF Google Drive Bridge — Runbook operacional

**Classificação:** `CURRENT_IMPLEMENTED` para os testes locais listados; não equivale a uma skill executável do MissionRuntime.  
**Última verificação:** 2026-11-23.  
**Host de referência:** notebook Linux autorizado `leo-N43SM`.  
**Objetivo:** tornar a recuperação e a validação da conexão Google Drive reproduzíveis, sem repetir discovery manual nem expor credenciais.

## 1. Componentes e boundaries

| Componente | Função | Estado observado |
|---|---|---|
| MCF Google Bridge | Adaptador Node.js para OAuth Google e operações Drive | status OAuth conectado; CRUD real aprovado |
| MCF Google Drive Agent (DSH preset) | Agente conversacional que usa a ponte autenticada do DSH | preset e sessão reportados como `ready: true` |
| MCF Google Drive Mobile | UI móvel local em loopback, encaminhando status/mensagens ao DSH | serviço ativo; `GET /api/status` respondeu HTTP 200 |
| Tailscale | Transporte privado para callback e UI móvel | usar configuração live do host; nunca presumir hostname/porta a partir deste documento |

O Mobile Agent não deve ser confundido com o adaptador OAuth direto. O servidor móvel consulta o DSH Bridge em loopback, autenticado por token local. O token local de acesso ao DSH é distinto do refresh token OAuth Google.

## 2. Autenticação e escopos

- O Bridge usa OAuth Web Client, Authorization Code + PKCE S256, `state` aleatório e refresh token.
- O refresh token do Bridge é armazenado cifrado em `~/.config/mcf-google-bridge/workspace-tokens.enc`; a chave fica em `~/.config/mcf-google-bridge/key`.
- O arquivo de ambiente `~/.config/mcf-google-bridge/bridge.env` contém configuração privada e deve permanecer com modo `0600`. Nunca copiar seu conteúdo para Git, logs ou mensagens.
- O escopo observado no Bridge foi `https://www.googleapis.com/auth/drive` (acesso amplo aos arquivos que a conta autorizada pode acessar, sujeito às políticas Google e permissões da conta).
- Atenção: o agente legado possui armazenamento OAuth separado em `~/.config/mcf-google-drive-agent/tokens.enc` e o callback histórico registrou o escopo `drive.file`. **Não assumir que o token do agente e o token do Bridge são o mesmo token ou têm escopos idênticos.** A sessão DSH/Mobile estava pronta, mas a equivalência de identidade/token entre os dois armazenamentos não foi provada nesta validação.
- Não publicar e-mail, client ID/secret, refresh token, state, PKCE verifier, bearer token, hostname Tailscale privado ou conteúdo de arquivos.

## 3. Callback remoto

O callback remoto já registrado no OAuth Web Client deve ser comparado com a configuração live do Tailscale Serve/Funnel e com o listener local antes de qualquer autorização.

Procedimento:
1. Confirmar o device autorizado e a conta Remote Desktop Commander correta.
2. Ler `tailscale serve status` e identificar o destino exato do callback.
3. Confirmar listener local e processo OAuth.
4. Fazer probe externo com `state` inválido: a resposta esperada do handler é `400 Invalid state`, não `502` e não sucesso OAuth.
5. Só então iniciar uma nova sessão OAuth e entregar o link recém-gerado. Nunca reutilizar URL antiga: state e PKCE são de uso único.
6. Depois do consentimento, verificar token cifrado, identidade e uma chamada real da API Drive.

Não iniciar OAuth remoto com processo efêmero de terminal. Usar serviço/daemon persistente e logs sem segredos. Um HTTP 502 indica falha entre Funnel e listener; um HTTP 404/Not found indica path/proxy incompatível; um HTTP 400 Invalid state no probe controlado indica que a requisição chegou ao handler, mas não prova consentimento.

## 4. Procedimento de verificação do Bridge

No checkout autorizado do Bridge:
1. Executar `npm run check` e `npm test`.
2. Consultar `invoke('google.status', {})`; exigir `oauthConnected: true`.
3. Consultar `google.drive.search` com query válida e limite pequeno.
4. Criar um arquivo temporário com prefixo único `MCF-AUDIT-TEMP-`.
5. Atualizar nome/descrição do arquivo; reler via `google.drive.get`.
6. Excluir somente o arquivo criado pelo próprio teste.
7. Pesquisar o nome exato e confirmar zero resultados não excluídos.
8. Conferir audit log por trace IDs e outcomes; não registrar tokens nem conteúdo privado.

Em 2026-11-23, a validação real no host concluiu:
- `google.status`: `oauthConnected: true`;
- `google.drive.search`: sucesso;
- `google.drive.create`: sucesso;
- `google.drive.update`: sucesso;
- `google.drive.get` após atualização: sucesso;
- `google.drive.delete`: sucesso;
- pesquisa posterior pelo nome exato: zero resultados;
- `npm test`: 16/16 aprovados;
- `node --check` / `npm run check`: aprovados em execução anterior da mesma sessão de trabalho.

O primeiro script de CRUD interpretou incorretamente o envelope `{trace_id, operation, result}` e reportou `CREATE_NO_FILE_ID`, embora a criação tivesse sido efetivada. O arquivo foi localizado por pesquisa, atualizado, relido, excluído e sua ausência foi confirmada. Ao usar `invoke`, sempre ler `response.result`; nunca repetir uma criação por causa de erro do script consumidor sem reconciliar primeiro por nome/trace ID.

## 5. Estado do agente DSH/Mobile observado

- DSH `/google-drive/status`: `ready: true`, preset `mcf-google-drive-agent`, sessão contabilizada.
- Mobile `GET /api/status`: HTTP 200 e mesmo preset/session ID.
- O agente possui histórico próprio de `google_drive.status` e `google_drive.search` com outcomes `ok`; há também registros históricos de `google_drive.read_text_file` com HTTP 404. Portanto, status pronto e busca bem-sucedida não provam que todo tipo de arquivo (especialmente Google Docs exportados) possa ser lido por qualquer operação.
- A equivalência de conta/token entre agente e Bridge ainda exige uma chamada de identidade em cada boundary e comparação segura; não imprimir e-mails nos logs ou neste documento.

## 6. Segurança e limites

- Escopo OAuth amplo não significa acesso a arquivos sem permissão, Shared Drives bloqueados por política, contas externas ou dados administrados por terceiros.
- Operações destrutivas devem ser limitadas a arquivos de teste criados pela própria missão, salvo autorização explícita adicional.
- O MCF Bridge declara política `read-only-default`, embora registre operações CRUD. A existência de uma operação no código não equivale a autorização genérica para executá-la em qualquer arquivo.
- Não ativar envio de Gmail, Calendar, geração paga ou outras APIs por inferência. OAuth Drive-only deve continuar com escopo mínimo necessário.
- A documentação pública descreve procedimentos e placeholders; configuração local, credenciais e endereços privados permanecem fora do Git.

## 7. Checklist de recuperação para futuras sessões

- [ ] Descobrir device e link remoto autorizado; não reutilizar IDs antigos sem confirmação live.
- [ ] Ler o status do serviço Bridge, do DSH preset e do Mobile Agent.
- [ ] Verificar permissões de `bridge.env`, chave e token cifrado; nunca imprimir valores.
- [ ] Verificar Tailscale Serve/Funnel, callback path e listener.
- [ ] Se OAuth já conectado, não solicitar consentimento novamente antes de testar `google.status` e uma leitura real.
- [ ] Distinguir o token do Bridge do token legado do Agent; comparar identidade/escopos de forma segura.
- [ ] Executar CRUD apenas com arquivo temporário próprio e confirmar remoção.
- [ ] Executar testes automatizados e guardar trace IDs/outcomes.
- [ ] Atualizar este runbook somente com evidência nova; nunca transformar snapshot de host em garantia universal.

## 8. Evidência técnica desta execução

- Host: `leo-N43SM`.
- Checkout: `/home/leo/Projetos/mcf-google-cloud-autonomy-20261121/mcf-google-bridge`.
- Audit traces Bridge:
  - search/create: `926d3a41-6184-43d0-81b6-d38d37b678aa`, `644a2c01-9b0a-4801-9485-73a9dc696e0a`;
  - search do arquivo criado: `e58026d0-7b83-43f4-8f8f-b9ceb2d7c702`;
  - update/get/delete/verify: `ea305717-8354-43f9-a0df-f5ba1a0c28ff`, `b23c4cba-b20b-45ea-bd9f-542ee9111e58`, `677a820d-a304-4728-ba2c-bab684b87d36`, `ae394974-75a9-4a1c-9a61-3f16a43a46c9`.
- Resultado CRUD: create/update/get/delete/absence-check = PASS.
- Testes: 16 passed, 0 failed.
- Mobile/DSH readiness: PASS.
- Pendência: provar que o agente DSH usa a mesma identidade/escopo amplo do Bridge; o log histórico do agente aponta `drive.file`, enquanto o Bridge usa `drive`.

## 9. Reconciliação DSH Agent x Bridge — verificação ao vivo (2026-11-23)

A consulta ao próprio preset DSH `mcf-google-drive-agent` confirmou:
- Conta Google reportada: `potiguaradm23@gmail.com`; identidade corresponde à conta esperada.
- Mecanismo: conector DSH gerenciado; o agente não manipula diretamente o token OAuth.
- Escopo efetivo do agente: `https://www.googleapis.com/auth/drive.file`.
- Bridge independente: escopo `https://www.googleapis.com/auth/drive`.
- Portanto, **mesma conta, mas tokens/escopos e limites diferentes**. Não afirmar que o agente herda a autorização ampla do Bridge.

Ferramentas efetivamente expostas pelo preset na auditoria:
`mcf_google_drive_status`, `mcf_google_drive_search`, `mcf_google_drive_read_text_file`, `mcf_google_drive_create_folder`, `mcf_google_drive_create_text_file`.

Limites confirmados do preset:
- Pesquisa e leitura limitadas ao universo visível por `drive.file`.
- Leitura apenas de texto UTF-8 suportado; não lê binários nem Google Docs pelo leitor atual.
- Não possui ferramentas de atualizar/sobrescrever, excluir, renomear, mover, compartilhar ou alterar permissões.

O código do conector local confirma que `drive.file` é intencional: `oauth.mjs` solicita esse escopo e rejeita `drive`/`drive.readonly`; `drive-api.mjs` exige o escopo mínimo; `plugin.mjs` registra somente cinco ferramentas. Isso não é uma falha de refresh token: é uma política explícita de least privilege.

**Ação pendente para satisfazer o requisito de LEANDRO:** alterar o conector para solicitar `drive`, implementar e testar operações de update/delete (além de leitura dos tipos de arquivo necessários), publicar/recarregar o plugin DSH e concluir novo consentimento OAuth para a conta verificada. O token atual `drive.file` não pode ser promovido por refresh; requer novo fluxo de consentimento. Não copiar o refresh token do Bridge para o DSH nem desativar a validação de conta. Após a mudança, repetir status, identidade, busca em arquivos preexistentes fora do conjunto criado pelo app e CRUD em arquivo temporário próprio.

Até a execução dessa ação, classificar o DSH Agent como **PARTIAL / LIMITED**, e o Bridge como **PASS / FULL DRIVE SCOPE**. A sessão DSH estar `ready: true` prova disponibilidade do preset, não amplitude de autorização.

## 10. Consentimento amplo concluído e CRUD verificado (2026-11-23)

Após LEANDRO concluir o consentimento Google para o escopo amplo, a verificação local do conector retornou:
- `configured: true`
- `connected: true`
- `account: potiguaradm23@gmail.com`
- `accountMatches: true`
- `scope: drive`
- `error: null`

O arquivo cifrado `~/.config/mcf-google-drive-agent/tokens.enc` foi atualizado durante o fluxo OAuth. O token permanece local e cifrado; nenhum segredo foi registrado neste documento.

Teste operacional contra a API real do Google Drive:
1. Busca de arquivos preexistentes retornou documentos MCF que não foram criados pelo teste.
2. Criação de arquivo temporário de verificação: PASS.
3. Leitura do conteúdo inicial: PASS.
4. Atualização de nome e conteúdo: PASS.
5. Leitura do conteúdo atualizado: PASS.
6. Exclusão do arquivo temporário de teste: PASS.

Resultado: **6/6 etapas operacionais PASS**. As operações disponíveis no módulo local incluem status, search, create_folder, create_text_file, read_text_file, update_text_file e delete_file.

**Limite remanescente:** esta evidência comprova o token amplo e o CRUD no conector local. Não comprova, por si só, que o runtime/preset DSH já recarregou a nova versão do plugin nem que as sete ferramentas estão visíveis na sessão ativa. Verificar o registro/montagem do plugin no DSH antes de declarar o agente DSH plenamente atualizado.

