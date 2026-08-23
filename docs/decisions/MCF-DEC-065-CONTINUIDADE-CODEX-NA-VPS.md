# MCF-DEC-065 — Continuidade do MCF com Codex na VPS

## Estado

```yaml
status: SUPERSEDIDA_PARCIALMENTE_POR_MCF_DEC_066
decision_owner: Leo
human_final_authority: Leandro
orchestrator: MESTRE
execution_surface: Codex CLI na VPS
github_actions_required: false
private_mcp_write_on_chatgpt_plus: false
vps_rollout: HUMAN_GATE
```

## 1. Problema

O runtime do MCF já persiste missões, fases, handoffs, eventos e evidências, mas
não possui um trabalhador cognitivo persistente. As fases que dependem de um
agente externo ficam em `WAITING_EXTERNAL`, e o worker atual apenas registra a
inicialização e termina.

O transporte anterior usava GitHub Actions. Ele não serve como motor da nova
operação porque a conta está sem cota de workflows e porque uma indisponibilidade
do GitHub não pode interromper o trabalho interno na VPS.

Há também uma restrição do produto: uma conta pessoal ChatGPT Plus não pode
conectar um MCP privado com ações de escrita no ChatGPT web. O Codex incluído no
Plus, porém, pode executar localmente na VPS, usar autenticação gerenciada pelo
ChatGPT e ser acionado sem interface por `codex exec`.

O objetivo desta decisão é permitir que uma missão já aceita continue na VPS
mesmo quando o computador de Leandro desligar, sem entregar shell root ao MCF e
sem confundir persistência operacional com uso ilimitado do plano Plus.

## 2. Decisão

> **Atualização de 2026-08-22:** a fila, o worker e os controles desta decisão
> permanecem válidos como fundação. O modelo de job único foi substituído pelo
> coordenador de missões multi-etapas definido em `MCF-DEC-066`; em conflito,
> prevalece a decisão 066.

Adicionar um plano de execução persistente ao runtime existente:

```text
ChatGPT/Codex (controle humano)
        |
        | Remote SSH, API autenticada ou CLI local
        v
MissionRuntime + mcf_work_items (PostgreSQL)
        |
        | claim transacional + lease + heartbeat
        v
worker mcf-codex (systemd, uma execução por credencial)
        |
        | worktree isolado + sandbox workspace-write
        v
codex exec --json
        |
        +--> resultado, eventos e evidências persistidos
        +--> gate humano para ações externas ou privilegiadas
```

O ChatGPT permanece como interface de decisão e o MESTRE permanece como
orquestrador. O processo que garante continuidade é o worker na VPS, não uma
aba do navegador.

## 3. Canal compatível com ChatGPT Plus

O canal de escrita inicial será o Codex, usando uma destas superfícies:

1. ChatGPT desktop/Codex conectado ao projeto da VPS por SSH;
2. Codex CLI interativo na VPS;
3. fila persistente executada com `codex exec`.

O MCP privado do MCF poderá ser acrescentado quando o workspace possuir um
plano que autorize full MCP/write. Ele não é requisito para este recorte e não
será exposto anonimamente para contornar limitação de plano.

Referências oficiais:

- <https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt>
- <https://learn.chatgpt.com/docs/non-interactive-mode>
- <https://learn.chatgpt.com/docs/auth/ci-cd-auth>
- <https://learn.chatgpt.com/docs/remote-connections>

## 4. Autenticação do Codex

O worker usa autenticação ChatGPT gerenciada pelo próprio Codex em uma VPS
privada e confiável. O bootstrap exige um login humano único e armazena
`auth.json` fora dos repositórios.

Invariantes:

1. o diretório da credencial possui modo `0700`;
2. `auth.json` possui modo `0600`;
3. o arquivo nunca entra em Git, log, receipt, artefato ou payload de missão;
4. existe uma cópia por VPS e por fluxo serializado;
5. dois processos não podem usar a mesma cópia simultaneamente;
6. o arquivo atualizado pelo refresh do Codex é preservado entre execuções;
7. falha de refresh bloqueia novas execuções e solicita novo login, sem fallback
   para credencial desconhecida.

A assinatura Plus continua sujeita a janelas e limites de uso. A fila garante
durabilidade e retomada; ela não promete capacidade ilimitada nem ignora os
limites do produto.

## 5. Fila durável

A migração cria `mcf_work_items` com, no mínimo:

```yaml
id: uuid
mission_id: uuid | null
account_id: uuid
repository_key: string
base_ref: string
objective: string
acceptance_criteria: string[]
status: READY | RUNNING | WAITING_GATE | RETRY | COMPLETED | FAILED | CANCELLED
dedupe_key: string
attempt: integer
max_attempts: integer
next_run_at: timestamptz
lease_owner: string | null
lease_expires_at: timestamptz | null
heartbeat_at: timestamptz | null
worktree_path: string | null
codex_thread_id: string | null
result: jsonb | null
error_code: string | null
created_at: timestamptz
updated_at: timestamptz
```

`dedupe_key` é único dentro da conta. Missão, repositório, referência base,
objetivo e critérios são imutáveis depois do primeiro claim.

## 6. Claim, lease e recuperação

O worker reivindica apenas um item por vez com `FOR UPDATE SKIP LOCKED` e muda
o estado para `RUNNING` na mesma transação. O claim registra owner, tentativa e
expiração do lease.

Durante uma execução, o worker renova o heartbeat. Depois de reinício:

- um item `RUNNING` com lease válido continua pertencendo ao worker anterior e
  não é duplicado;
- um item com lease expirado volta a `RETRY`, recebe backoff e pode ser
  reivindicado novamente;
- uma tentativa excedida termina em `FAILED`;
- resultados `COMPLETED` nunca voltam para a fila;
- cancelamento impede novos claims, mas não inventa rollback de uma mutação já
  confirmada.

## 7. Isolamento de repositório

`repository_key` não é um caminho fornecido pelo prompt. Ele referencia uma
allowlist root-owned que define:

- repositório canônico;
- diretório Git autorizado;
- referências base permitidas;
- raiz dos worktrees;
- comandos de validação permitidos;
- política de rede;
- classe máxima de risco sem gate.

Cada item recebe um worktree dedicado. O worker usa APIs de processo com argv,
sem interpolar objetivo, paths ou referências em shell. O worktree de uma
tarefa nunca é compartilhado com outra tarefa ativa.

## 8. Execução do Codex

O worker inicia o Codex no worktree autorizado com saída JSONL e sandbox
`workspace-write`. O prompt inclui o contrato da missão, critérios de aceite,
limites, ownership e proibições. Saída padrão, eventos, thread id, resultado e
status final são persistidos com limites de tamanho.

O recorte inicial não permite ao prompt escolher:

- usuário do sistema;
- caminho do repositório ou do worktree;
- localização do `CODEX_HOME`;
- nível de sandbox;
- executável chamado;
- variáveis de ambiente repassadas;
- comando privilegiado.

O processo recebe um ambiente mínimo e não recebe segredos de deploy. Ações de
produção, publicação, exclusão material, rede, systemd, Docker, pacote ou root
permanecem fora do sandbox e exigem um adapter autorizado e gate explícito.

## 9. Integração com Control Bridge G2-B

O G2-B continua sendo a fronteira para pequenas mutações privilegiadas e
allowlisted no NODE-01. O worker não recebe sudo amplo e não recebe Docker
socket. Quando uma fase precisar de capacidade G2-B, ela usa o executor
imutável, o grant de duração limitada, locks, receipts, rollback e revogação já
definidos pelo projeto `cloud-infrastructure`.

GitHub permanece opcional para sincronização, revisão ou publicação. Commit,
push, PR e deploy não são efeitos implícitos de um item concluído.

## 10. Gates

O worker pode concluir automaticamente apenas tarefas dentro do workspace e da
classe de risco autorizada. Ele muda para `WAITING_GATE` antes de:

- usar G2-B ou outra capacidade privilegiada;
- publicar ou enviar alterações;
- acessar produção;
- executar ação destrutiva ou irreversível;
- ampliar allowlist, sandbox, credenciais ou rede;
- resolver conflito de ownership com outra missão.

Somente Leandro decide o gate final. MESTRE prepara contexto, evidências e uma
recomendação; não falsifica aprovação.

## 11. Observabilidade e sigilo

Cada transição registra item, missão, tentativa, worker, timestamps e código de
resultado. Logs estruturados não incluem prompt integral, tokens, conteúdo de
credenciais, dumps de ambiente ou arquivos potencialmente secretos.

O resultado público contém resumo, arquivos modificados, validações executadas,
estado do worktree, risco residual e próxima ação. O JSONL bruto fica em
armazenamento privado com retenção e tamanho limitados.

## 12. Disponibilidade real

A garantia desta camada é:

- missão e fila sobrevivem a queda do navegador e do computador local;
- worker reinicia automaticamente na VPS;
- itens abandonados são recuperados por lease;
- execução nunca depende de GitHub Actions;
- estado pode ser consultado depois.

Não são garantidos:

- uso de modelo durante indisponibilidade da OpenAI;
- execução depois de esgotar a cota Plus;
- validade eterna do refresh token;
- progresso sem uma decisão humana quando um gate é alcançado.

Nesses casos a tarefa permanece persistida e retoma quando a condição externa
for resolvida.

## 13. Critérios de aceite

```yaml
github_actions_required: false
plus_api_billing_required: false
private_mcp_exposed_anonymously: false
single_auth_stream: PASS
durable_enqueue_and_dedupe: PASS
transactional_claim: PASS
heartbeat_and_expired_lease_recovery: PASS
restart_recovery: PASS
allowlisted_repository: PASS
isolated_worktree: PASS
workspace_write_sandbox: PASS
credential_not_logged: PASS
bounded_result: PASS
human_gate_for_privileged_effects: PASS
g2b_write_rollback_revoke: PASS
mestre_can_submit_and_observe: PASS
f1_2c_worktree_untouched: PASS
```

## 14. Rollback

Parar o serviço de worker impede novos claims. Itens e evidências permanecem no
PostgreSQL para diagnóstico. Worktrees só podem ser removidos depois de
confirmar que não há lease ativo e preservar diff/receipt necessários.

A migração não será apagada em produção. O componente pode ser desativado e as
rotas de enqueue removidas sem alterar as tabelas já existentes do
MissionRuntime.
