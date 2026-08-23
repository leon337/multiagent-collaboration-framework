# Plano de implementação — continuidade do MCF/Codex na VPS

**Decisão:** `MCF-DEC-065`  
**Branch isolada:** `codex/mcf-vps-continuity`  
**Estado:** em execução local; rollout na VPS permanece HUMAN_GATE

## Resultado verificável

Um job enviado por CLI sobre SSH deve:

1. ser persistido idempotentemente no PostgreSQL;
2. sobreviver a reinício do worker e queda do computador local;
3. ser reivindicado uma única vez com lease e heartbeat;
4. usar o SHA fixado em um Git worktree próprio;
5. executar `codex exec` com autenticação ChatGPT persistente e sandbox
   `workspace-write`;
6. modificar somente paths autorizados;
7. produzir diff, digests, JSONL e resultado duráveis;
8. recuperar tentativa abandonada sem duplicar um sucesso já comprovado;
9. parar em gate antes de qualquer efeito privilegiado ou externo;
10. não depender de GitHub Actions, API paga, Docker socket ou checkout humano.

## Lote 1 — contratos e persistência

Arquivos:

- `packages/database/migrations/0030_mcf_durable_work_queue.sql`;
- `packages/contracts/src/mcf-work-queue.ts`;
- `packages/contracts/src/mcf-work-queue.test.ts`;
- `packages/contracts/src/index.ts`;
- novo pacote `packages/mcf-work-queue`.

Entregar:

- jobs, attempts, gates e eventos;
- `dispatchId` idempotente e conflito quando o digest divergir;
- estados `WAITING_GATE`, `QUEUED`, `RUNNING`, `RETRY_WAIT`,
  `BLOCKED_AUTH`, `BLOCKED_POLICY`, `SUCCEEDED`, `FAILED`, `DEAD` e
  `CANCELLED`;
- claim com `FOR UPDATE SKIP LOCKED`;
- lease token obrigatório para heartbeat e término;
- recovery de lease expirado;
- gate vinculado ao digest imutável do spec;
- retry finito com classificação de auth, policy e falha transitória.

Testes obrigatórios:

- enqueue repetido igual retorna o mesmo job;
- mesmo dispatch com payload diferente retorna conflito;
- duas claims concorrentes não recebem o mesmo job;
- lease antigo não pode concluir depois de expirar;
- aprovação antiga não libera spec alterado;
- recovery leva a retry ou dead;
- eventos são causais e idempotentes;
- migração roda duas vezes.

## Lote 2 — política, worktrees e processo

Arquivos sob `apps/worker/src`:

- `config.ts`;
- `policy.ts`;
- `command-runner.ts`;
- `worktree-manager.ts`;
- `artifact-store.ts`;
- `git-evidence.ts`.

Entregar:

- policy root-owned baseada em nomes, nunca comandos vindos do job;
- resolução por `realpath` e recusa de `/`, path relativo, traversal ou
  symlink escape;
- `git worktree add --detach` no SHA esperado;
- nenhum reset, checkout ou limpeza no worktree humano;
- execução com `spawn(file, args, { shell: false })`;
- timeout, output limitado e ambiente mínimo;
- patch, paths modificados, `git diff --check` e SHA-256 independentes;
- cleanup separado, explícito e confinado à raiz de worktrees.

Testes obrigatórios:

- repositório ou profile desconhecido é recusado;
- metacaracteres não se tornam shell;
- dois jobs não colidem;
- avanço da branch não muda o SHA do job;
- checkout humano sujo permanece intocado;
- path fora do escopo ou sensível falha fechado.

## Lote 3 — runner Codex

Arquivos:

- `apps/worker/src/codex-runner.ts`;
- `apps/worker/src/codex-output.ts`;
- `apps/worker/src/prompt-builder.ts`;
- `apps/worker/schemas/codex-job-result.schema.json`.

Invocação fixa:

```text
codex -a never exec
  --sandbox workspace-write
  --ephemeral
  --json
  --cd <worktree-validado>
  --output-schema <schema-root-owned>
  -
```

O prompt entra somente por stdin. `CODEX_HOME`, binário, cwd, sandbox, schema e
ambiente são configuração do supervisor. O runner persiste JSONL incremental,
extrai thread id e resultado, encerra por timeout e classifica auth, rate limit,
policy, schema e falhas internas. Tokens e headers Bearer são redactados antes
de qualquer log.

## Lote 4 — executor, loop e CLI

Arquivos:

- `apps/worker/src/job-executor.ts`;
- `apps/worker/src/worker-loop.ts`;
- `apps/worker/src/shutdown.ts`;
- `apps/worker/src/healthcheck.ts`;
- `apps/worker/src/cli.ts`;
- atualização de `apps/worker/src/main.ts` e `apps/worker/package.json`.

Fluxo:

```text
claim
→ iniciar heartbeat
→ preflight de auth
→ criar ou recuperar worktree
→ executar Codex
→ validar paths e diff
→ executar verificações allowlisted
→ gravar attempt-result.json atomicamente
→ concluir usando o lease token atual
```

CLI inicial:

```text
mcf-work enqueue --spec <arquivo-json>
mcf-work status <job-id>
mcf-work list
mcf-work approve <job-id> --digest <sha256> --actor <nome> --reason <texto>
mcf-work reject <job-id> ...
mcf-work cancel <job-id>
mcf-work auth-status
```

JSON vai para stdout e diagnóstico para stderr. Nenhum comando imprime
`auth.json`, variáveis ou tokens.

## Lote 5 — empacotamento da VPS

Arquivos:

- `deploy/worker.Dockerfile` ou unidade systemd equivalente;
- `deploy/mcf-worker.policy.json`;
- `deploy/compose.rollout.yaml`;
- `deploy/compose.smoke.yaml`;
- exemplos de ambiente sem segredos;
- runbook de bootstrap, login, revoke, recovery e rollback.

Invariantes de rollout:

- Node e Codex em versões fixas;
- usuário não-root dedicado;
- uma concorrência por `auth.json`;
- restart automático;
- filesystem root read-only;
- volumes separados para auth, worktrees, artifacts e state;
- nenhum Docker socket;
- auth não montada em server ou web;
- repositórios montados somente no worker;
- G2-B é a única ponte para a mutação privilegiada do piloto.

## Lote 6 — prova local descartável

Antes da VPS:

1. subir PostgreSQL descartável;
2. rodar migrações duas vezes;
3. usar um binário Codex fake para provar argv, JSONL, timeout e recovery;
4. enfileirar uma alteração Classe A em repositório Git temporário;
5. matar o worker durante a tentativa;
6. expirar o lease e reiniciar;
7. comprovar uma única conclusão e checkout humano intocado;
8. executar format, lint, typecheck, testes e build.

## Lote 7 — HUMAN_GATE e canary na VPS

Intervenção humana será solicitada somente quando todos os testes locais
passarem. Leandro deverá:

1. desbloquear a chave SSH local;
2. digitar sudo diretamente quando o Ansible solicitar;
3. autorizar o device login do Codex na conta Plus;
4. aprovar a emissão do grant G2-B de 24 horas;
5. aprovar expansão de qualquer allowlist além do arquivo piloto.

Canary:

- enqueue de job Classe A em fixture descartável;
- alteração somente no arquivo permitido;
- restart do worker com estado preservado;
- resultado e diff consultáveis;
- write G2-B piloto;
- leitura independente;
- replay idempotente e conflito por request id;
- rollback;
- revogação;
- tentativa pós-revogação recusada;
- estado final restaurado.

## Gates de conclusão

```yaml
local_test_suite: PASS
migrations_twice: PASS
fake_codex_crash_recovery: PASS
real_codex_auth_preflight: PASS
vps_worker_restart_recovery: PASS
g2b_pilot_write: PASS
g2b_pilot_rollback: PASS
g2b_revoke: PASS
post_revoke_refusal: PASS
checkout_f1_2c_untouched: PASS
human_final_acceptance: PENDING
```
