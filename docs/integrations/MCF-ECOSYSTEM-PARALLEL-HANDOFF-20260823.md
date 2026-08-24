# Handoff paralelo — integração do ecossistema MCF

Data do checkpoint: 2026-08-23
Base MCF deste checkpoint: `codex/ecosystem-context-integration@e646527fcb098d22923d64021aefe4dea9993ed3`
Estado no `main`: `NOT_MERGED`

## Objetivo e limite

Integrar os quatro repositórios até laboratório/staging comprovado:

- MCF como orquestrador, Registry e Context Fabric;
- Cognitive Ledger como memória read-only com caminho padrão sem API paga;
- TriView como cockpit read-only;
- Cloud Infrastructure como autoridade da infraestrutura e dos Control Bridges.

Este checkpoint **não autoriza nem afirma** runtime de produção, NODE-01/VPS, SSH, escrita
externa, Tasks 9/10 do G2-B, R7 ampla ou API paga. Os merges citados abaixo ocorreram somente nos
targets seguros indicados. Nenhuma evidência local deve ser promovida a freshness da VPS. A página
estática pública na Vercel é classificada pela própria Vercel como deployment `Production`; ela
não contém runtime nem API do MCF e não altera esse limite operacional.

## Analogia operacional

- O **MCF é o mestre de obras**: identifica o projeto, lê contratos e escolhe a ferramenta.
- O **Registry é a lista telefônica**: diz quem é cada projeto e onde está sua Capsule.
- A **Capsule é a ficha na porta**: resume estado, próximo passo, bloqueios e fontes canônicas.
- O **Cognitive Ledger é a biblioteca**: devolve memória sem o MCF copiar o livro para seu
  próprio ledger.
- O **TriView é o painel de instrumentos**: exibe evidência; não vira fonte de verdade.
- A **Cloud é a sala de máquinas**: somente bridges governados podem se aproximar dela.
- O **Capability Registry é o quadro de chaves**: `IMPLEMENTED`, `CONNECTED`, `AUTHORIZED` e
  `VERIFIED` são estados independentes. Código existente não significa sistema ligado.

## Snapshot dos repositórios

| Repositório      | Target seguro                        | Evidência integrada                                                                                                       | Estado factual                                                                                              |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| MCF              | branch isolada                       | integração `e646527f`; recovery estrutural 4/4 PASS; Ledger `f3ba9a0`; Cloud `e5ae1f9`                                    | CF-2 e pontes read-only verificados em lab; branch ainda `NOT_MERGED` no `main`                             |
| Cognitive Ledger | `design/cognitive-ledger-foundation` | feature `b882d28`; PR #2, merge `e0e715b0105abe0bc636d198e7ebb137d7de9bd7`                                                | provider zero-cost/read-only integrado e CI pós-merge aprovada                                              |
| TriView          | `release/1.0.0a4`                    | feature `a072cf9`; PR #77, merge `5013ffebd1c7efe8fb7cfd2d41f16e5efec49194`                                               | cockpit read-only integrado no branch de release; `main`/publicação não tocados                             |
| Cloud            | `mcf/mission-001-control-bridge-g1`  | feature `cb97df4`; PR #26, merge `dbd772a6c37452008b7c8debd58d2782127514db`; cliente MCF em `54fadec` + closure `425e258` | G2-A local comprovado com MCF real; G2-B, Tasks 9/10 e capability remoto continuam inativos/não autorizados |

O `main` do MCF usado pela consolidação contém o audit de recuperação de 2026-08-23 em
`f52485d`. A composição canônica de **29 agentes** permanece preservada. A proposta concorrente
do PR #159 não foi incorporada por este trabalho.

## Evidência comprovada

### MCF — Context Fabric e Registry

- CF-0/CF-1 mínimo revisado e mergeado pelo PR #153;
- quatro projetos com identidade estável, Registry e Capsules versionados no Git;
- recuperação cross-repository com provenance qualificada;
- freshness Git local estritamente read-only e fail-closed;
- CF-2 recovery: `IMPLEMENTED_AND_VERIFIED_IN_BRANCH`;
- baseline estrutural de recovery: **4/4 projetos recuperados com PASS** na branch;
- `GET /v1/mcf/context/recovery` e `GET /v1/mcf/context/capabilities`;
- token de Context dedicado, separado do runtime, e boundary desabilitado sem configuração;
- Capability Registry separa implementação, conexão, autorização, runtime e verificação;
- projeção pública não expõe `resolved_path` interno;
- audit de recuperação do ecossistema preservado em `f52485d`.

O baseline 4/4 comprova que Registry, contratos, proveniência, freshness e as Capsules atuais são
estruturalmente recuperáveis. Ele **não** comprova que o resumo semântico de cada Capsule já
descreve os adapters após o futuro merge no `main`. Essa sincronização ocorre depois do merge;
então o recovery estrutural 4/4 será repetido contra as Capsules pós-sync.

No HEAD consolidado `e646527f`, o gate completo passou: migrations 2x PASS com 30 registros;
`pnpm verify` exit 0; format/lint/typecheck/build PASS; 38 ops + 16 contracts + 5 web + 884
server = **943 testes aprovados**, 3 real-Cloud E2E pulados por design e 0 falhas. O
`pnpm audit` de produção em nível high passou com 0 vulnerabilidades conhecidas. Esse resultado
vale para a branch; não é evidência de `main`, staging ou produção.

### Cognitive Ledger — provider e adapter MCF comprovados em laboratório

Provider:

- PR #2 mergeado em `design/cognitive-ledger-foundation` no SHA `e0e715b`;
- 29 testes Deno, 10 testes Node legado/exportação e 14 testes MCP aprovados;
- busca textual PostgreSQL/`pg_trgm`; embeddings pagos são opt-in e ficam desabilitados;
- quatro tools MCP read-only: `ler_diario`, `buscar_eventos`, `recuperar_contexto` e
  `ler_fonte_bruta`;
- CI do PR e pós-merge aprovadas com E2E real.

Adapter MCF final na branch `f3ba9a0` (núcleo de hardening em `43ba406`), incorporado ao
checkpoint `e646527f`:

- rota `POST /v1/mcf/context/ledger/query`: POST transporta uma consulta estruturada e não
  concede mutação;
- SDK MCP oficial `1.30.0` e schemas estritos de entrada/saída;
- somente `ler_diario`, `buscar_eventos` e `recuperar_contexto`; `ler_fonte_bruta` é bloqueada
  antes de iniciar chamada MCP;
- disabled-by-default, token de ingresso próprio e credenciais pairwise distintas do token
  TriView/Context, do ingresso Cloud e do Bearer upstream;
- URL/redirect/timeout/tamanho/concurrency limitados e HTTP somente em IP loopback literal para
  dev/test;
- leitura efêmera com `Cache-Control: no-store, private`; o payload de memória não é persistido
  pelo MCF;
- E2E real pelo `AppModule`: MCF → MCP → Edge/Auth → PostgREST → PostgreSQL 17/pgvector;
- 3/3 operações e 3 auditorias, raw bloqueada, 0 embeddings, 0 chamadas pagas, payload não
  persistido e fingerprint `953cf4f346240c029c3bcd584d02eed0` idêntico antes/depois;
- somente o contador técnico de abuso, sem conteúdo, chegou a 7;
- postflight removeu recursos descartáveis e preservou o PostgreSQL compartilhado.

```yaml
mcf_to_ledger_final_hardening:
  state: LAB_E2E_PASS_IN_UNMERGED_BRANCH
  allowed_operations:
    - ler_diario
    - buscar_eventos
    - recuperar_contexto
  prohibited_operation: ler_fonte_bruta_BLOCKED_BEFORE_MCP
  ingress_token: DEDICATED_AND_PAIRWISE_DISTINCT
  e2e: REAL_APPMODULE_TO_LEDGER_LAB_PASS
  allowed_local_effect: ABUSE_PROTECTION_TECHNICAL_COUNTER_WITHOUT_PAYLOAD
  main_status: NOT_MERGED
```

### TriView — cockpit read-only

- Context Recovery já integrado pelo PR #76;
- Capability Cockpit integrado pelo PR #77 em `release/1.0.0a4`, merge `5013ffeb`;
- suíte local: **419 aprovados e 2 skips físicos previstos**;
- E2E real TriView → MCF fez exatamente dois GETs, recebeu 200, selecionou três capabilities
  read-only e excluiu G2-B;
- sem fallback no caminho de sucesso, sem `resolved_path`, credencial, POST ou mutação;
- digests observados permaneceram idênticos;
- gate físico focado Linux Mint 22.3/X11 aprovado.

Esse gate focado não equivale a uma declaração de R7 ampla. `main` e o workflow de publicação do
TriView não foram acionados por este merge no branch de release.

### Cloud — provider e cliente MCF comprovados em laboratório

- PR #26 mergeado no target seguro `mcf/mission-001-control-bridge-g1`, SHA `dbd772a6`;
- adapter stdio Cloud `context.get` disabled-by-default;
- E2E Cloud com fixture MCF descartável: **13/13 marcadores**;
- testes focados adapter+E2E: **12/12**;
- gate local: **396/396** unitários, 16 shell syntax, 9 Ansible syntax, 16 ShellCheck e scan de
  segredos do candidato `--revision HEAD` aprovados;
- fingerprints Git/filesystem idênticos antes/depois e cleanup aprovado;
- sem rede, shell, escrita interna, SSH, VPS ou subprocesso iniciado pelo adapter;
- G2-B Task 8 continua `LAB_VALIDATED_INACTIVE`; Tasks 9/10 continuam fechadas.

Os jobs GitHub-hosted do PR #26 tiveram zero steps: o GitHub os bloqueou antes da execução com
a mensagem de cobrança/limite da conta. A classificação correta é
`NOT_EXECUTED_EXTERNAL_BILLING_GATE`, **não** falha do candidato. A política de custo zero impede
comprar créditos ou usar NODE-01 como contorno.

O cliente real do MCF foi fechado na branch `e5ae1f9`, com código em `54fadec` e fechamento de
evidência em `425e258`:

- suíte focada do adapter: **6 arquivos/49 testes** aprovados;
- E2E real pelo `AppModule` aprovou **3/3 testes E2E** contra o processo stdio Cloud descartável;
- 11 Bearers do mesmo peer compartilharam o mesmo bucket de proteção contra abuso;
- 16 arquivos necessários à execução foram verificados por SHA-256 antes e depois;
- executable/root/operação/env usam allowlists; não há shell, URL, SSH ou path livre;
- postflight confirmou worktrees limpas, portas fechadas e banco descartável removido.

Limite de confiança: `python -I` e o audit hook não são uma sandbox do sistema operacional. O
runtime ainda confia no executável/stdlib Python, módulos dinâmicos e dependências locais do
ambiente verificado; a evidência não vincula toda a supply chain do sistema. Isso é aceitável
somente neste laboratório local disabled-by-default e bloqueia promoção remota/produção.

```yaml
mcf_to_cloud_real_adapter:
  state: REAL_MCF_CLIENT_TO_CLOUD_STDIO_LAB_E2E_PASS
  branch_revision: e5ae1f9
  code_revision: 54fadec
  evidence_closure: 425e258
  default_activation: DISABLED
  vps_freshness: NOT_OBSERVED_LIVE_REQUIRED
  main_status: NOT_MERGED
  remote_capability:
    id: cloud.workspace.g2a.read
    authorization: NOT_AUTHORIZED
    connection: DISCONNECTED
    verification: LIVE_REQUIRED
```

## Boundary de segurança preservado pela ponte Cloud

Consumir exclusivamente a interface fixa já publicada no Cloud:

```text
cwd: .../leon337/g2a-smoke/dev
env: MCF_CLOUD_CONTEXT_READ_ENABLE=DISPOSABLE_LOCAL_LAB_ONLY
command: python -I platform/control-bridge/mcf-cloud-context-read
protocol: MCF_CLOUD_CONTEXT_READ_V1
project_id: cloud-infrastructure
operation: context.get
arguments: {}
```

Controles comprovados da ponte real:

1. configuração ausente falha fechada e nenhuma operação desconhecida inicia processo;
2. executável/root/operação/env são allowlists fixas; sem shell, URL, SSH ou path livre;
3. timeout e limites de stdin/stdout/stderr são aplicados;
4. resposta valida o JSON Schema Cloud e recomputa provenance SHA-256;
5. E2E usa o serviço/cliente real do MCF e a fixture Cloud descartável;
6. Git/filesystem ficam idênticos, não há persistência e o processo é limpo;
7. capability permanece restrito a laboratório e não afirma freshness da VPS.

## Ordem de consolidação final

O baseline estrutural 4/4 e o full verify já passaram. A sequência de consolidação é:

1. **Concluído:** migrations 2x, `pnpm verify` e audit prod/high no HEAD consolidado;
2. abrir um único PR MCF, observar checks, revisar workflows e mergear no `main` somente após os
   gates verdes;
3. validar staging pelo SHA exato, provar runtime de produção e VPS/NODE-01 intactos e sincronizar
   o roadmap estático na Vercel; então encerrar/superseder o PR MCF #151;
4. sincronizar semanticamente as Capsules dos providers Cognitive Ledger, TriView e Cloud com o
   estado efetivamente integrado;
5. executar o closeout MCF, incluindo sua própria Capsule/documentação;
6. repetir o recovery estrutural **4/4 pós-sync** contra as quatro Capsules e registrar o
   resultado; este é o gate de recovery pós-sync que encerra esta missão.

## Checklist de retomada

- [x] CF-0/CF-1 mergeado pelo PR MCF #153.
- [x] Audit de recuperação `f52485d` incorporado à base de integração.
- [x] Baseline estrutural de recovery na branch: 4/4 projetos recuperados com PASS.
- [x] Ledger provider mergeado pelo PR #2 e CI pós-merge aprovada.
- [x] Adapter MCF → Ledger endurecido: 3 operações, ingresso próprio, `AppModule`, contador sem
      payload e E2E real com custo pago zero.
- [x] TriView PR #77 mergeado em `release/1.0.0a4`; 419/2 e E2E GET-only aprovados.
- [x] Cloud PR #26 mergeado no branch lab seguro; gates locais 396/396 e 13/13 aprovados.
- [x] CI Cloud classificada honestamente como `NOT_EXECUTED_EXTERNAL_BILLING_GATE`.
- [x] Ponte **real** MCF → Cloud comprovada em E2E descartável, com 16 arquivos vinculados e
      postflight limpo.
- [x] Capability/roadmap/handoff atualizados com os SHAs finais Ledger e Cloud na branch.
- [x] Gate completo no `e646527f`: migrations 2x/30 registros; verify exit 0; 943 aprovados,
      3 real-Cloud E2E skips por design, 0 falhas; audit prod/high com 0 vulnerabilidades.
- [ ] Abrir/revisar o PR consolidado, aguardar checks verdes e mergear no `main`.
- [ ] Validar staging pelo SHA; confirmar 0 API paga, 0 runtime de produção, 0 VPS/NODE-01,
      0 SSH, 0 segredo e 0 mutação externa; sincronizar o roadmap estático final na Vercel e
      encerrar/superseder o PR MCF #151.
- [ ] Sincronizar semanticamente as Capsules dos três providers após o merge no `main`.
- [ ] Executar o closeout MCF e atualizar sua Capsule/documentação.
- [ ] Repetir e registrar o recovery estrutural 4/4 pós-sync contra as quatro Capsules.
