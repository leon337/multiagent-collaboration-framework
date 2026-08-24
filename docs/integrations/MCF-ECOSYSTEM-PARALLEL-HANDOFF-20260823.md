# Handoff paralelo — integração do ecossistema MCF

Data do closeout: 2026-08-24
Base MCF definitiva: `main@2dc4584c4be186b5cdf131105b810610a9cf620a`
Checkpoint de código testado: `e646527fcb098d22923d64021aefe4dea9993ed3`, agora ancestral do `main`
Estado: `CLOSEOUT_COMPLETE__PR_161_MERGED__STAGING_EXACT_SHA_DEPLOYED__RECOVERY_4_OF_4_PASS`

## Objetivo e limite

Integrar os quatro repositórios até laboratório/staging comprovado:

- MCF como orquestrador, Registry e Context Fabric;
- Cognitive Ledger como memória read-only com caminho padrão sem API paga;
- TriView como cockpit read-only;
- Cloud Infrastructure como autoridade da infraestrutura e dos Control Bridges.

Este closeout **não autoriza nem afirma** novo runtime de produção, NODE-01/VPS, SSH, escrita
externa, Tasks 9/10 do G2-B, R7 ampla ou API paga. Os merges citados abaixo ocorreram somente nos
targets seguros indicados. Nenhuma evidência local deve ser promovida a freshness da VPS. A página
estática pública na Vercel é classificada pela própria Vercel como deployment `Production`; ela
não contém runtime nem API do MCF e não altera esse limite operacional. A auditoria pós-merge
confirmou o runtime produtivo preservado em `439da7b6479718f6545144954937b8c4358d7c46`, zero novos
deploys de produção e zero acesso VPS/SSH.

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

| Repositório      | Target seguro                        | Evidência integrada                                                                                              | Estado factual                                                                                                                                                                                               |
| ---------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MCF              | `main`                               | checkpoint `e646527f`; PR #161, merge `2dc4584`; 7/7 checks; staging exact SHA `DEPLOYED` no run `32688775406`   | closeout concluído; recovery final 4/4 PASS; produção `439da7b` preservada e workflow produtivo com zero runs                                                                                                |
| Cognitive Ledger | `design/cognitive-ledger-foundation` | baseline PR #2/`e0e715b`; sync semântico PR #3, merge `a64cfc05f83567f624bbda70288310f56a7264e8`                 | provider zero-cost/read-only sincronizado, CI verde e runtime externo `DISCONNECTED/INACTIVE`                                                                                                                |
| TriView          | `release/1.0.0a4`                    | cockpit PR #77/`5013ffeb`; sync semântico PR #78, merge `09a361d761adf1e2e614d23718b84776c365cacc`               | Capsule reconciliada; cockpit continua GET-only/evidence-only e a R7 ampla permanece separada                                                                                                                |
| Cloud            | `mcf/mission-001-control-bridge-g1`  | baseline PR #26/`dbd772a6`; sync PR #27, merge `38cd22e0a814bdf4957edcf5bb30506a4810bda0`; local 21/21 + 396/396 | jobs remotos `NOT_EXECUTED_EXTERNAL_BILLING_GATE`/zero steps; G2-A remoto `NOT_AUTHORIZED/DISCONNECTED/UNKNOWN/LIVE_REQUIRED`; G2-B `NOT_AUTHORIZED/DISCONNECTED/BLOCKED/LIVE_REQUIRED`; Tasks 9/10 fechadas |

O `main` do MCF contém o audit de recuperação de 2026-08-23 em `f52485d`, a integração do PR #160
e o closeout do PR #161 em `2dc4584`. O PR #151 foi marcado automaticamente como `MERGED` pela
ancestralidade do PR #160. A composição canônica de **29 agentes** permanece preservada. A
proposta concorrente do PR #159 não foi incorporada por este trabalho.

## Evidência comprovada

### MCF — Context Fabric e Registry

- CF-0/CF-1 mínimo revisado e mergeado pelo PR #153;
- quatro projetos com identidade estável, Registry e Capsules versionados no Git;
- recuperação cross-repository com provenance qualificada;
- freshness Git local estritamente read-only e fail-closed;
- CF-2 recovery: `IMPLEMENTED_AND_VERIFIED_IN_BRANCH` no checkpoint testado `e646527f`, agora
  ancestral do `main@2dc4584`;
- baseline estrutural de recovery: **4/4 projetos recuperados com PASS** antes do sync semântico;
- `GET /v1/mcf/context/recovery` e `GET /v1/mcf/context/capabilities`;
- token de Context dedicado, separado do runtime, e boundary desabilitado sem configuração;
- Capability Registry separa implementação, conexão, autorização, runtime e verificação;
- projeção pública não expõe `resolved_path` interno;
- audit de recuperação do ecossistema preservado em `f52485d`.

O baseline 4/4 comprova que Registry, contratos, proveniência, freshness e as Capsules anteriores
ao sync eram estruturalmente recuperáveis. Depois do sync semântico e do closeout MCF, o recovery
estrutural final repetiu essa prova contra as quatro Capsules atuais e passou 4/4.

No HEAD consolidado `e646527f`, o gate completo passou: migrations 2x PASS com 30 registros;
`pnpm verify` exit 0; format/lint/typecheck/build PASS; 38 ops + 16 contracts + 5 web + 884
server = **943 testes aprovados**, 3 real-Cloud E2E pulados por design e 0 falhas. O
`pnpm audit` de produção em nível high passou com 0 vulnerabilidades conhecidas. Esse checkpoint
de código é ancestral do `main@2dc4584`; a evidência específica de integração e ambiente vem dos
PRs #160/#161, dos checks e dos gates pós-merge abaixo, não do teste local isolado.

### MCF — closeout, staging e boundaries pós-merge comprovados

- PR #161 mergeado no `main` em `2dc4584c4be186b5cdf131105b810610a9cf620a` após **7/7 checks**;
- Production Readiness e Documentation Validation pós-merge PASS;
- staging fez checkout do SHA exato e terminou `DEPLOYED`, com readiness/version PASS, no run
  `32688775406`;
- o roadmap público Vercel correspondeu ao arquivo de `main@2dc4584` pelo SHA-256
  `0ac09ccd2ead8fb592a51e9407def07d5edafc6e43dbaee892915a4497728d47`;
- runtime de produção preservado em `439da7b6479718f6545144954937b8c4358d7c46`, workflow produtivo
  com zero runs e zero acesso VPS/SSH;
- workflows RC2 `32688887618` e RC3 `32688887658` concluíram como NOOP, sem mover as identidades
  imutáveis;
- PR #151 ficou `MERGED` automaticamente por ancestry do PR #160.

Esses fatos comprovam `main`, staging e a publicação documental estática. Eles não conectam Ledger
ou Cloud a runtime externo, não promovem o MCF para produção e não autorizam VPS, SSH, escrita,
Tasks 9/10, G2-B ativo ou R7 ampla.

### Recovery estrutural final pós-sync

Entre `2026-08-24T04:14:24.044Z` e `2026-08-24T04:14:24.195Z`, o recovery definitivo terminou
**4/4 `RECOVERED`**:

| Projeto          | Revisão recuperada | Claims | Sources | Warnings | Boundary                                            |
| ---------------- | ------------------ | -----: | ------: | -------: | --------------------------------------------------- |
| MCF              | `2dc4584`          |     17 |       6 |        0 | read_only/evidence_only true; material_action false |
| Cognitive Ledger | `a64cfc`           |     17 |       6 |        0 | read_only/evidence_only true; material_action false |
| TriView          | `09a361`           |     17 |       6 |        0 | read_only/evidence_only true; material_action false |
| Cloud            | `38cd22e`          |     17 |       6 |        0 | read_only/evidence_only true; material_action false |

Cada revisão correspondeu ao HEAD esperado, com worktree limpa e referência live exata. O PASS
não altera autoridade: Ledger e Cloud local continuam `DISCONNECTED/INACTIVE`; G2-A remoto segue
`NOT_AUTHORIZED/DISCONNECTED/UNKNOWN/LIVE_REQUIRED`; G2-B segue
`NOT_AUTHORIZED/DISCONNECTED/BLOCKED/LIVE_REQUIRED`. A evidência completa está em
[`MCF-ECOSYSTEM-RECOVERY-4OF4-20260824.md`](evidence/MCF-ECOSYSTEM-RECOVERY-4OF4-20260824.md).

### Cognitive Ledger — provider e adapter MCF comprovados em laboratório

Provider:

- PR #2 mergeado em `design/cognitive-ledger-foundation` no SHA `e0e715b`;
- sincronização semântica pós-main mergeada pelo PR #3 no SHA
  `a64cfc05f83567f624bbda70288310f56a7264e8`, com os dois jobs de CI verdes;
- 29 testes Deno, 10 testes Node legado/exportação e 14 testes MCP aprovados;
- busca textual PostgreSQL/`pg_trgm`; embeddings pagos são opt-in e ficam desabilitados;
- quatro tools MCP read-only: `ler_diario`, `buscar_eventos`, `recuperar_contexto` e
  `ler_fonte_bruta`;
- CI do PR e pós-merge aprovadas com E2E real.

Adapter MCF final na branch histórica `f3ba9a0` (núcleo de hardening em `43ba406`), incorporado ao
checkpoint `e646527f` e, por ancestry, ao `main@2dc4584`:

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
  state: LAB_E2E_PASS_MERGED_TO_MCF_MAIN
  allowed_operations:
    - ler_diario
    - buscar_eventos
    - recuperar_contexto
  prohibited_operation: ler_fonte_bruta_BLOCKED_BEFORE_MCP
  ingress_token: DEDICATED_AND_PAIRWISE_DISTINCT
  e2e: REAL_APPMODULE_TO_LEDGER_LAB_PASS
  allowed_local_effect: ABUSE_PROTECTION_TECHNICAL_COUNTER_WITHOUT_PAYLOAD
  main_status: CLOSEOUT_MERGED_PR_161_AT_2DC4584
  external_connection: DISCONNECTED
  activation: INACTIVE
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
- sincronização semântica pós-main mergeada pelo PR #78 no SHA
  `09a361d761adf1e2e614d23718b84776c365cacc`, com CI verde.

Esse gate focado e o sync da Capsule não equivalem a uma declaração de R7 ampla. O cockpit
permanece GET-only/evidence-only, sem connect, authorize, execute, revoke ou write. A promoção do
TriView e a R7 física completa continuam fora desta missão.

### Cloud — provider e cliente MCF comprovados em laboratório

- PR #26 mergeado no target seguro `mcf/mission-001-control-bridge-g1`, SHA `dbd772a6`;
- sincronização semântica pós-main mergeada pelo PR #27 no SHA
  `38cd22e0a814bdf4957edcf5bb30506a4810bda0`;
- adapter stdio Cloud `context.get` disabled-by-default;
- E2E Cloud com fixture MCF descartável: **13/13 marcadores**;
- gates focados pós-sync: **21/21**;
- gate local: **396/396** unitários, 16 shell syntax, 9 Ansible syntax, 16 ShellCheck e scan de
  segredos do candidato `--revision HEAD` aprovados;
- fingerprints Git/filesystem idênticos antes/depois e cleanup aprovado;
- sem rede, shell, escrita interna, SSH, VPS ou subprocesso iniciado pelo adapter;
- G2-B Task 8 continua `LAB_VALIDATED_INACTIVE`; Tasks 9/10 continuam fechadas.

Os jobs GitHub-hosted dos PRs #26/#27 tiveram zero steps: o GitHub os bloqueou antes da execução
com a mensagem de cobrança/limite da conta. A classificação correta é
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
  state: REAL_MCF_CLIENT_TO_CLOUD_STDIO_LAB_E2E_PASS_MERGED_TO_MCF_MAIN
  branch_revision: e5ae1f9
  code_revision: 54fadec
  evidence_closure: 425e258
  default_activation: DISABLED
  vps_freshness: NOT_OBSERVED_LIVE_REQUIRED
  main_status: CLOSEOUT_MERGED_PR_161_AT_2DC4584
  activation: INACTIVE
  remote_capability:
    id: cloud.workspace.g2a.read
    authorization: NOT_AUTHORIZED
    connection: DISCONNECTED
    runtime_state: UNKNOWN
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

## Consolidação final concluída

Todos os gates desta missão passaram na ordem prevista:

1. **Concluído:** migrations 2x, `pnpm verify` e audit prod/high no checkpoint `e646527f`;
2. **Concluído:** PR #160 integrou o ecossistema; PR #161 fechou o MCF em `2dc4584` após 7/7
   checks; PR #151 auto-mergeado por ancestry;
3. **Concluído:** staging exact-SHA `DEPLOYED` no run `32688775406`, readiness/docs PASS, runtime
   prod/VPS intactos, RC2/RC3 NOOP e roadmap estático Vercel com hash correspondente;
4. **Concluído:** sync semântico das Capsules dos providers pelos PRs Ledger #3, TriView #78 e
   Cloud #27;
5. **Concluído:** closeout da Capsule/documentação MCF pelo PR #161;
6. **Concluído:** recovery estrutural **4/4 pós-sync**, com 17 claims/6 sources/0 warnings por
   projeto e todos os boundaries read-only preservados.

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
- [x] PR MCF #161 mergeado em `2dc4584` após 7/7 checks; PR #151 auto-mergeado por ancestry do
      PR #160.
- [x] Staging exact-SHA `DEPLOYED` no run `32688775406`; readiness/docs PASS; produção preservada
      em `439da7b`, workflow produtivo com 0 runs, 0 VPS/SSH e RC2/RC3 NOOP.
- [x] Roadmap estático Vercel conferido por hash contra `main@2dc4584`.
- [x] Capsules dos providers sincronizadas: Ledger PR #3/`a64cfc05`, TriView PR #78/`09a361d7` e
      Cloud PR #27/`38cd22e0`.
- [x] Cloud pós-sync: jobs remotos `NOT_EXECUTED_EXTERNAL_BILLING_GATE`/zero steps; local 21/21 +
      396/396.
- [x] Ledger/provider Cloud local `DISCONNECTED/INACTIVE`; G2-A remoto
      `NOT_AUTHORIZED/DISCONNECTED/UNKNOWN/LIVE_REQUIRED`; G2-B
      `NOT_AUTHORIZED/DISCONNECTED/BLOCKED/LIVE_REQUIRED`; Tasks 9/10, VPS/SSH, produção e R7 ampla
      permanecem fechados.
- [x] Closeout da Capsule/documentação MCF concluído pelo PR #161.
- [x] Recovery final 4/4 pós-sync: todos `RECOVERED`, 17 claims/6 sources/0 warnings por projeto,
      `read_only`/`evidence_only` true, `material_action` false e HEAD/clean/live exatos.
