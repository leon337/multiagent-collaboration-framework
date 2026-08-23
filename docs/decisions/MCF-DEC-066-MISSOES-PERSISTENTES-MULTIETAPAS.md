# MCF-DEC-066 — Missões persistentes multi-etapas na VPS

## Estado

```yaml
status: EM_IMPLEMENTACAO
approved_by: Leandro
approved_at: 2026-08-22
supersedes_scope: job Codex único de MCF-DEC-065
canonical_mission_identity: mcf_missions.id
canonical_state_version: mcf_missions.version
github_actions_required: false
human_final_authority: Leandro
```

## Resultado exigido

Uma missão iniciada pelo MESTRE deve continuar na VPS por várias horas depois
que a janela de ferramentas que a iniciou deixar de existir. Outra sessão deve
descobrir a mesma missão no PostgreSQL, recuperar seu último checkpoint e
continuar sem repetir uma etapa ou efeito já confirmado.

Continuidade significa preservar o estado operacional da missão. Não significa
manter um único turno do ChatGPT aberto indefinidamente, ignorar limites do plano
ChatGPT ou executar através de uma indisponibilidade da OpenAI.

## Decisão

O MissionRuntime existente continua sendo a fonte canônica de identidade. Não
será criado um segundo tipo concorrente de missão. A continuidade é acrescentada
como extensão 1:1 de `mcf_missions`; cada unidade limitada de execução é um job
ordenado e cada término material produz checkpoint, eventos e artefatos.

```text
ChatGPT/Codex
      |
      | comando curto por SSH
      v
CLI/API MCF ───────────────> PostgreSQL
                              | mcf_missions + version
                              | mcf_mission_continuity
                              | mcf_work_jobs/attempts
                              | checkpoints/artifacts/events
                              v
                      coordenador persistente
                              |
                              v
                        worker Codex único
                              |
                    worktree persistente da missão
                              |
                     executor G2-B allowlisted
```

GitHub pode receber commits ou revisões depois de um gate, mas GitHub Actions não
participa do claim, heartbeat, checkpoint, recuperação ou conclusão.

## Modelo de estado

`mcf_missions.id` identifica a missão em todas as sessões. Sua coluna `version`
é o token público de compare-and-swap. A extensão de continuidade registra, no
mínimo:

- projeto e repositório allowlisted;
- digest imutável do contrato;
- SHA base e caminho lógico do worktree;
- estado de coordenação e próxima sequência;
- lease do coordenador, heartbeat e fencing token monotônico;
- último checkpoint e último evento observável;
- critérios concluídos, critérios restantes e próxima ação;
- timestamps de início, pausa e término.

Jobs usam uma chave idempotente única dentro da missão e uma sequência estável.
Uma nova tentativa do mesmo job não cria uma nova etapa. Tentativas recebem lease
token próprio e somente o dono atual pode gravar heartbeat ou resultado.

## Checkpoint atômico

Cada etapa segue o protocolo:

1. reivindicar missão e job com lease e fencing atuais;
2. reutilizar ou criar o worktree persistente da missão no SHA autorizado;
3. executar uma ação limitada;
4. coletar diff, paths, validações e resultado estruturado;
5. gravar `attempt-result.json` por arquivo temporário, `fsync` e rename;
6. em uma transação, inserir checkpoint e artefatos, concluir o job, incrementar
   `mcf_missions.version` e emitir os eventos causais;
7. somente depois liberar o claim ou criar a próxima etapa.

Se o processo cair entre 5 e 6, a recuperação valida o marker e seus digests e
conclui a mesma tentativa sem executar novamente. Se cair antes do marker, a
lease expira e a tentativa seguinte reutiliza o worktree e recebe o checkpoint
anterior mais o estado parcial explicitamente identificado.

## Descoberta e retomada entre sessões

A interface operacional estável é:

```text
mcf mission active --project <project-key> --json
mcf mission status <mission-id> --json
mcf mission events <mission-id> --after <sequence> --json
mcf mission artifacts <mission-id> --json
mcf mission continue <mission-id> --expected-version <version> --request-id <id>
```

`active` consulta o PostgreSQL, nunca histórico de chat ou PID. `continue` usa
compare-and-swap; versão antiga é recusada e request id repetido retorna o mesmo
receipt. Consultas são concorrentes, mas somente um coordenador pode avançar a
missão.

## Coordenação por várias horas

O coordenador é um daemon supervisionado. Ele não mantém uma invocação Codex
ilimitada: executa etapas limitadas, avalia o checkpoint e enfileira a próxima
etapa até que todos os critérios sejam comprovados, um gate seja alcançado ou
um orçamento finito de tentativas seja esgotado.

Processos longos allowlisted também pertencem ao worker, recebem output limitado
e são associados à tentativa. SIGTERM interrompe novos claims e preserva o
estado recuperável. `systemd` reinicia o daemon, mas PostgreSQL decide o que pode
ser retomado.

## Exclusão mútua

São obrigatórios:

- claim por `FOR UPDATE SKIP LOCKED`;
- lease com expiração e heartbeat;
- fencing token monotônico conferido em todo write;
- CAS por `mcf_missions.version` na retomada externa;
- chave idempotente de missão, etapa, tentativa e efeito;
- um worktree por missão e um lock de repositório;
- um único fluxo por cópia de `auth.json`;
- receipt antes de repetir qualquer efeito externo.

Um worker com lease antiga não pode concluir, mesmo que volte depois de uma
pausa de processo ou partição de rede.

## Segurança

- serviço sob usuário dedicado não-root;
- política root-owned mapeando nomes a paths, comandos e classes de risco;
- nenhuma string de shell vinda da missão;
- `spawn` com executável e argv fixos;
- sandbox `workspace-write`;
- nenhum Docker socket ou sudo genérico;
- credencial Codex fora do repositório com modos `0700/0600`;
- logs e artefatos com redaction e limites;
- gate antes de push, deploy, produção, ação destrutiva ou privilégio;
- G2-B como única fronteira sudo e somente para operações exatas do piloto;
- grant SSH ligado ao principal POSIX real, nunca a um ator GitHub presumido.

## Estados externos que pausam sem perder a missão

Autenticação inválida, rate limit, indisponibilidade da OpenAI e gate humano
produzem estados bloqueados persistentes. Eles não são classificados como
conclusão nem apagam lease, checkpoint, worktree, eventos ou próxima ação.

## Critério de aceite

```text
missão iniciada
→ etapa reivindicada
→ cliente original encerrado
→ worker continua e grava checkpoint
→ nova sessão descobre a missão
→ crash do worker
→ lease expira e supervisor reinicia
→ marker/checkpoint é recuperado
→ tentativa concorrente é recusada
→ etapas concluídas não são repetidas
→ critérios finais são comprovados
→ missão termina exatamente uma vez
```

A aprovação final exige evidência PostgreSQL, eventos monotônicos, digests dos
artefatos, checkout humano intocado, ausência de efeitos duplicados e teste real
de restart. Testes unitários ou a mera existência dos componentes não satisfazem
esta decisão.
