# Runbook — continuidade de missões MCF na VPS

## Escopo

Este runbook opera o coordenador definido em `MCF-DEC-066`. A fonte de verdade
é o PostgreSQL. Histórico de chat, PID, terminal, tmux, GitHub Actions e arquivo
de log não determinam se uma etapa pode ser repetida.

## Invariantes antes de iniciar

```text
policy.json                 root:root 0644 ou mais restrito
/var/lib/mcf-continuity/*   mcf-worker:mcf-worker 0700
codex-home/auth.json        mcf-worker:mcf-worker 0600
worker replicas             1 por auth.json
Docker socket no worker     ausente
checkout humano             nunca montado no worker
repositório do worker       cópia dedicada allowlisted
```

O arquivo de ambiente real fica fora do Git. Não executar comandos que imprimam
seu conteúdo, o ambiente do container ou `auth.json`.

## Bootstrap controlado

1. criar o usuário/grupo de serviço fixo `mcf-worker` com UID/GID 1901;
2. instalar a unidade e o tmpfiles root-owned;
3. criar os diretórios com `systemd-tmpfiles`;
4. colocar uma cópia dedicada do repositório sob
   `/var/lib/mcf-continuity/repositories`;
5. instalar a política revisada em `/etc/mcf-continuity/policy.json`;
6. instalar `/etc/mcf-continuity/continuity.env` como `0640`;
7. construir e fixar a imagem do worker por digest;
8. realizar `codex login` como o usuário do worker e verificar somente o estado
   do login, nunca os tokens;
9. iniciar `mcf-continuity.service`.

Toda criação de usuário, instalação root-owned e login ChatGPT é HUMAN_GATE.

## Iniciar uma missão

O spec não contém shell, executável, cwd, sudo ou segredo. Ele seleciona somente
repositório, SHA e profiles existentes na política root-owned.

```text
mcf mission start --spec /caminho/allowlisted/mission.json --json
```

Guardar `mission.id`, `stateVersion`, `specDigest` e o último `event.sequence`.
Repetir o mesmo `dispatchId` com o mesmo digest devolve a missão existente;
payload diferente é conflito.

## Descoberta por uma nova sessão

Uma nova sessão começa sempre por consulta, sem presumir o que a sessão anterior
concluiu:

```text
mcf mission active --project <project-key> --json
mcf mission status <mission-id> --json
mcf mission events <mission-id> --after <last-sequence> --json
mcf mission artifacts <mission-id> --json
```

`active` deve localizar a missão mesmo que não exista histórico local do chat.
`status` inclui etapas, tentativas, versão, checkpoint e próxima ação. Artefatos
são referenciados por path relativo e SHA-256; a interface nunca retorna seu
path host absoluto nem credenciais.

## Retomar uma missão pausada

Somente estados explicitamente retomáveis aceitam `continue`:

```text
mcf mission continue <mission-id> \
  --expected-version <state-version-observada> \
  --request-id <id-unico> \
  --actor MESTRE_MCF \
  --reason <motivo-revisado> \
  --json
```

Versão antiga é recusada. Replay do mesmo request id devolve o resultado
anterior. Nunca corrigir conflito repetindo com a versão nova sem antes ler os
eventos que causaram a mudança.

## Crash e recuperação

Depois de queda do worker:

1. `systemd`/Docker reinicia o processo;
2. o processo executa recovery antes de novos claims;
3. lease ainda válida não é roubada;
4. lease expirada recebe novo fencing token;
5. marker de resultado válido conclui a etapa sem executar novamente;
6. sem marker, o mesmo worktree é reutilizado e o checkpoint anterior é passado
   à nova tentativa;
7. um processo antigo não consegue gravar com fencing ou versão obsoletos.

Diagnóstico seguro:

```text
systemctl status mcf-continuity.service
journalctl -u mcf-continuity.service --since -30min
mcf mission status <mission-id> --json
mcf mission events <mission-id> --after <sequence> --json
```

Não usar `docker inspect`, dump de environment ou leitura de `auth.json` como
diagnóstico compartilhável.

## Estados bloqueados

- `WAITING_GATE`: aguarda decisão humana ligada ao digest atual;
- `BLOCKED_AUTH`: requer login/reseed humano;
- `RETRY_WAIT`: falha transitória com backoff finito;
- `BLOCKED_POLICY`: o pedido ou diff saiu da allowlist;
- `FAILED`: estado terminal comprovado;
- `CANCELLED`: nenhuma nova etapa pode ser reivindicada.

Rate limit ou indisponibilidade da OpenAI pausa a execução; não apaga checkpoint
nem converte a missão em sucesso.

## G2-B

A etapa Codex não recebe sudo. Uma ação piloto privilegiada é submetida ao
adapter G2-B root-owned, com request id, grant de 24 horas, receipt, replay,
rollback e revogação. O grant SSH usa o principal POSIX real `ubuntu/<uid>`;
ele não presume que esse usuário seja o ator GitHub `leon337/25374535`.

## Parada e rollback operacional

Parar o serviço impede novos claims, mas preserva banco, checkpoints, worktrees
e artefatos:

```text
systemctl stop mcf-continuity.service
```

Não remover worktrees ou artefatos com missão ativa. Uma desinstalação não apaga
tabelas nem receipts. Revogar G2-B antes de remover o adapter privilegiado.

## Evidência mínima de aceite

- IDs da missão e das etapas;
- versões antes/depois e fencing tokens monotônicos;
- eventos desde enqueue até terminal;
- heartbeat observado após o cliente original desaparecer;
- checkpoint recuperado após kill/restart;
- replay sem segunda tentativa material;
- conflito de duas retomadas concorrentes;
- digests dos patches e artefatos;
- testes allowlisted;
- prova de que o checkout humano permaneceu no SHA e status originais;
- receipt G2-B, rollback, revoke e recusa pós-revogação.
