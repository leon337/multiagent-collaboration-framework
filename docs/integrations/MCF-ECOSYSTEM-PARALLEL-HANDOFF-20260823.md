# Handoff paralelo — integração do ecossistema MCF

Data do checkpoint: 2026-08-23

## Objetivo e limite

Integrar os quatro repositórios até laboratório/staging comprovado:

- MCF como orquestrador, Registry e Context Fabric;
- Cognitive Ledger como memória read-only com caminho padrão sem API paga;
- TriView como cockpit read-only;
- Cloud Infrastructure como autoridade da infraestrutura e dos Control Bridges.

Este checkpoint **não autoriza** produção, NODE-01/VPS, SSH, mutação externa, API paga ou
reparo do banco de objetos Git compartilhado. Push e PR de branches isoladas são permitidos. Um
merge futuro deve respeitar o target específico de cada repositório e continuar sem produção.

## Analogia operacional

- O **MCF é o mestre de obras**: identifica o projeto, lê os contratos e escolhe a ferramenta.
- O **Registry é a lista telefônica**: diz quem é cada projeto e onde está sua Capsule.
- A **Capsule é a ficha na porta**: resume estado, próximo passo, bloqueios e fontes canônicas.
- O **Cognitive Ledger é a biblioteca**: devolve memória, mas não decide nem escreve por conta
  própria.
- O **TriView é o painel de instrumentos**: exibe evidência; não vira fonte de verdade.
- A **Cloud é a sala de máquinas**: somente bridges governados podem chegar perto dela.
- O **Capability Registry é o quadro de chaves**: `IMPLEMENTED`, `CONNECTED`, `AUTHORIZED` e
  `VERIFIED` são chaves diferentes. Código existente não significa sistema ligado.

## Branches e targets

| Repositório | Branch de checkpoint | Target futuro seguro | Estado no checkpoint |
| --- | --- | --- | --- |
| MCF | `codex/ecosystem-context-integration` | `main` | enviada ao GitHub; HEAD mínimo `d03f1b3` |
| Cognitive Ledger | `codex/cognitive-ledger-zero-cost-lab` | `design/cognitive-ledger-foundation` | enviada ao GitHub; HEAD `b882d2808af74858a6ba351fb755bb3843e33ab2` |
| TriView | `codex/triview-capability-registry-lab` | `release/1.0.0a4` | cockpit implementado; checkpoint/push final da frente em andamento |
| Cloud | `codex/context-bridge-reconcile-20260823` | `mcf/mission-001-control-bridge-g1` | enviada ao GitHub; HEAD `aeb58beeb294e4bf05574695957745bb55eec514` |

Não apontar Cloud para `main`. Não apontar TriView diretamente para `main`: o workflow de `main`
publica release. Não ativar o workflow mutante G2-B.

## O que já está comprovado

### MCF

- CF-0/CF-1 mínimo já foi revisado e mergeado no PR #153.
- quatro projetos registrados com identidade estável;
- Capsule cross-repository e provenance qualificada;
- freshness local Git read-only e fail-closed;
- `GET /v1/mcf/context/recovery`;
- `GET /v1/mcf/context/capabilities`;
- token dedicado `x-mcf-context-token`, separado do runtime;
- endpoints desabilitados sem configuração explícita;
- Capability Registry distingue implementação, conexão, autorização, runtime e verificação;
- preparação G2-B incorporada, mas sem transporte/registro de adapter mutante;
- correção `d03f1b3`: a API pública não vaza `resolved_path` interno em `sources`.

O full `pnpm verify` passou antes das integrações mais recentes. Ele deve ser repetido depois que
os adapters finais forem integrados.

### Cognitive Ledger

- embeddings pagos são opt-in explícito e ficam `disabled` por padrão;
- busca textual local via PostgreSQL/`pg_trgm`;
- quatro operações MCP read-only: `ler_diario`, `buscar_eventos`, `recuperar_contexto` e
  `ler_fonte_bruta`;
- OAuth/JWT e capability por operação;
- E2E real já observado: cliente MCP → MCP real → Edge Function local → GoTrue/JWKS →
  PostgREST → PostgreSQL/pgvector;
- 4 leituras, 4 auditorias esperadas, 3 eventos sintéticos, 0 embeddings e 0 chamadas pagas;
- fingerprint dos eventos permaneceu idêntico antes/depois.
- matrizes concluídas: 29 testes Deno, 10 Node legado/exportação e 14 MCP;
- auditorias npm, Capsule, workflow e scan de segredos aprovados;
- contrato de handoff: `documentacao/integracao/mcf-mcp-readonly-lab.md`.

Auditoria é o único efeito esperado das leituras; não persistir memória bruta no ledger de ações
externas do MCF.

### TriView

- recuperação Context Fabric anterior já foi mergeada em `release/1.0.0a4` pelo PR #76;
- cockpit do Capability Registry usa GET-only e token dedicado;
- parser estrito, limites, fallback para repositório e falha fechada;
- teste físico Linux Mint 22.3/X11 comprovou layout, scroll, fechamento e ausência de mutação;
- a interface mostra explicitamente `IMPLEMENTED ≠ CONNECTED ≠ AUTHORIZED ≠ VERIFIED`.

O primeiro E2E real encontrou o campo interno `resolved_path` no MCF e caiu corretamente no
fallback. O MCF foi corrigido em `d03f1b3`; repetir o E2E contra esse SHA antes de declarar PASS.

### Cloud / Control Bridge

- reconciliação G1/G2-A/G2-B preservada em branch isolada;
- G2-B Task 8 passou no Docker Ubuntu 24.04 descartável, sem rede, com 13/13 marcadores;
- suíte Cloud final anterior: 381/381;
- lifecycle honesto: `LAB_VALIDATED_INACTIVE`;
- Tasks 9/10, transporte mutante MCF, NODE-01 e produção continuam fechados;
- G2-A histórico permanece read-only e exige freshness live antes de uso operacional.
- adapter local stdio `context.get` está implementado, disabled-by-default e ainda com E2E
  pendente; checkpoint `IMPLEMENTED_LOCALLY_DISABLED_BY_DEFAULT_UNIT_PASS_E2E_PENDING`;
- validações do checkpoint: 9/9 focadas, 17/17 adapter+Context, 390/390 unitárias e 62 YAML.

O `scripts/test.sh` local é bloqueado antes dos testes por dois loose objects Git zero-byte
preexistentes no object DB compartilhado. Não reparar, apagar ou substituir esse object DB. A CI
em clone limpo deve ser usada para separar o problema ambiental do candidato.

## Divisão recomendada para quatro equipes

As equipes devem trabalhar em worktrees/branches próprias e publicar checkpoints pequenos. Não
compartilhar o mesmo arquivo entre duas equipes.

### Equipe A — adapter MCF → Cognitive Ledger

Base: `origin/codex/ecosystem-context-integration`. Ledger provider fixado em
`b882d2808af74858a6ba351fb755bb3843e33ab2`.

1. Criar cliente MCF para o MCP oficial do Ledger usando `@modelcontextprotocol/sdk` fixado na
   versão usada pelo Ledger.
2. Permitir somente as quatro ferramentas conhecidas e exigir annotations read-only.
3. Configuração disabled-by-default, Bearer dedicado, timeout, limite de resposta e URL exata.
4. Permitir HTTP somente em loopback para dev/test; fora disso exigir HTTPS. Recusar URL com
   credencial, query ou fragmento.
5. Expor uma boundary read-query estrita; POST pode transportar consulta, mas não representa
   mutação. Nunca gravar conteúdo recuperado no External Action Ledger.
6. Normalizar erros sem ecoar token, consulta privada ou resposta bruta em logs.
7. Provar E2E MCF → MCP → API → Postgres no harness descartável do Ledger, com 0 chamada paga e
   fingerprint imutável, exceto auditoria esperada.

Aceite: configuração ausente = 503/fail-closed; operação desconhecida = 400 sem rede; sucesso
real nas operações autorizadas; segredo não aparece em processo, log, Receipt ou Git.

### Equipe B — adapter local MCF → Cloud G2-A

Base: `origin/codex/context-bridge-reconcile-20260823` em
`aeb58beeb294e4bf05574695957745bb55eec514`.

1. Consumir o CLI/stdio local disabled-by-default com allowlist fixa G2-A já implementado em
   `platform/control-bridge/mcf-cloud-context-read`.
2. Validar request/result por JSON Schema estrito, paths repo-relative e sem symlink/traversal.
3. Não aceitar shell, comando arbitrário, SSH, URL ou path vindo livremente do cliente.
4. Criar o cliente-fixture MCF e provar MCF → adapter → estado Cloud em fixture descartável. O
   request exato usa protocolo `MCF_CLOUD_CONTEXT_READ_V1`, projeto `cloud-infrastructure`,
   operação `context.get` e `arguments: {}`.
5. Comparar Git e filesystem antes/depois; qualquer diferença material falha o teste.
6. Manter lifecycle inativo até o E2E; não confundir lab local com freshness da VPS.

Aceite: E2E local PASS, saída limitada com provenance/freshness, zero rede, zero write, testes de
negação e Capsule/mapping atualizados honestamente.

### Equipe C — TriView Capability Cockpit

Base: `origin/codex/triview-capability-registry-lab` depois de confirmar o HEAD remoto.

1. Repetir o E2E real contra MCF `d03f1b3` ou sucessor que preserve a projeção pública.
2. Confirmar 200, filtro `triview-workspace-linux` e ausência de `resolved_path`.
3. Confirmar refresh GET-only, digests de Registry/Capsule/YAML iguais e zero token em log/UI.
4. Rodar suíte completa e gate físico Linux Mint/X11.
5. Abrir PR para `release/1.0.0a4`; não fazer merge direto em `main`.

Aceite: endpoint real exibido sem fallback, fallback ainda funciona em falha, janela fecha com
processo exit 0 e nenhuma mutação de repositório.

### Equipe D — consolidação, CI e publicação do roadmap

Começar somente depois dos checkpoints A/B/C.

1. Adicionar/atualizar Capability Registry central com os SHAs exatos das evidências.
2. Só usar `CONNECTED/AUTHORIZED/VERIFIED/ACTIVE` quando todos os respectivos gates forem reais.
3. Executar recuperação das quatro Capsules com roots e revisões explícitos.
4. Rodar full verify do MCF com Node 24.18.0 e pnpm 11.17.0.
5. Abrir um único PR consolidado MCF para reduzir acionamentos de staging.
6. Revisar workflows antes do merge. Merge em MCF `main` pode acionar staging, autorizado nesta
   missão; produção continua proibida.
7. Atualizar `docs/MCF-ECOSYSTEM-INTEGRATION-ROADMAP.html` com fatos e gates atuais.
8. Verificar a publicação `https://mcf-ecosystem-roadmap.vercel.app` sem criar serviço pago.
9. Encerrar/superseder o PR MCF #151 após o conteúdo consolidado chegar ao `main`.

## Comandos de validação

### MCF

Use exatamente Node 24.18.0 e pnpm 11.17.0:

```bash
cd apps/rede-social-agentes
pnpm verify
```

Para iteração curta, execute o Vitest diretamente no pacote server e depois `pnpm typecheck`.

### Cognitive Ledger

Siga o README da branch e execute, no mínimo:

```bash
deno fmt --check supabase/functions/cognitive-ledger-api
deno check supabase/functions/cognitive-ledger-api/index.ts
deno test --allow-env supabase/functions/cognitive-ledger-api/testes
npm --prefix mcp ci --ignore-scripts --no-audit --no-fund
npm --prefix mcp test
```

Use apenas o harness lab descartável documentado para o E2E real. Ele deve gerar credenciais
sintéticas e limpar os arquivos temporários.

### Cloud

Execute primeiro os testes focados do adapter e schemas, depois as suítes documentadas na
evidência da branch. O lifecycle G2-B descartável exige Docker privilegiado e deve permanecer
`--network none`; não substituí-lo por NODE-01.

### TriView

Execute a suíte indicada pelo `pyproject.toml`/README da branch, o E2E com MCF local e o gate
físico X11 documentado. Não execute workflow de publicação.

## Ordem de integração final

1. preservar todos os branches remotos;
2. concluir os E2E Ledger e Cloud sem dependência um do outro;
3. concluir o E2E TriView contra MCF corrigido;
4. revisar e fazer PR/merge de Ledger, Cloud e TriView nos targets indicados;
5. incorporar os adapters e SHAs finais na branch MCF;
6. full verify MCF;
7. PR MCF, checks, merge único e validação de staging;
8. atualizar e verificar o roadmap Vercel;
9. auditar: 0 API paga, 0 produção, 0 VPS/NODE-01, nenhum segredo.

## Checklist de retomada

- [ ] Confirmar que os quatro branches de checkpoint existem no GitHub e anotar seus HEADs.
- [ ] Ler os READMEs/evidências nas próprias branches; não confiar somente neste handoff.
- [ ] Verificar worktrees originais sujos antes de qualquer edição e não limpá-los.
- [ ] Criar uma branch/worktree nova por equipe.
- [ ] Equipe A concluir adapter Ledger e E2E real MCF.
- [ ] Equipe B concluir adapter Cloud G2-A e E2E local.
- [ ] Equipe C repetir E2E real TriView com a correção `d03f1b3`.
- [ ] Atualizar capabilities somente com evidência exata.
- [ ] Rodar as suítes completas.
- [ ] Abrir PRs para os targets corretos e observar toda a CI.
- [ ] Não fazer produção, VPS, SSH, API paga ou mutação externa.
- [ ] Atualizar roadmap e checklist público após os merges comprovados.
