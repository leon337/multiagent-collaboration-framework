# Handoff paralelo — integração do ecossistema MCF

Data do checkpoint: 2026-08-23
Base MCF deste checkpoint: `codex/ecosystem-context-integration@28eafbb274f33925d7c6fa361cbd8aa6767e11c7`

## Objetivo e limite

Integrar os quatro repositórios até laboratório/staging comprovado:

- MCF como orquestrador, Registry e Context Fabric;
- Cognitive Ledger como memória read-only com caminho padrão sem API paga;
- TriView como cockpit read-only;
- Cloud Infrastructure como autoridade da infraestrutura e dos Control Bridges.

Este checkpoint **não autoriza nem afirma** produção, NODE-01/VPS, SSH, escrita externa,
Tasks 9/10 do G2-B, R7 ampla ou API paga. Os merges citados abaixo ocorreram somente nos targets
seguros indicados. Nenhuma evidência local deve ser promovida a freshness da VPS.

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

| Repositório      | Target seguro                        | Evidência integrada                                                                          | Estado factual                                                                                          |
| ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| MCF              | `main`                               | CF-0/CF-1 PR #153, merge `876e9f565671578c04be194c729c8d4e7b0080d9`; integração em `28eafbb` | CF-0/1 no `main`; CF-2, quatro projetos, endpoints e adapter Ledger pré-hardening na branch consolidada |
| Cognitive Ledger | `design/cognitive-ledger-foundation` | PR #2, merge `e0e715b0105abe0bc636d198e7ebb137d7de9bd7`                                      | provider zero-cost/read-only integrado e CI pós-merge aprovada                                          |
| TriView          | `release/1.0.0a4`                    | PR #77, merge `5013ffebd1c7efe8fb7cfd2d41f16e5efec49194`                                     | cockpit read-only integrado no branch de release; `main`/publicação não tocados                         |
| Cloud            | `mcf/mission-001-control-bridge-g1`  | PR #26, merge `dbd772a6c37452008b7c8debd58d2782127514db`                                     | G2-A local e G2-B lab preservados; G2-B continua inativo                                                |

O `main` do MCF usado pela consolidação contém o audit de recuperação de 2026-08-23 em
`f52485d`. A composição canônica de **29 agentes** permanece preservada. A proposta concorrente
do PR #159 não foi incorporada por este trabalho.

## Evidência comprovada

### MCF — Context Fabric e Registry

- CF-0/CF-1 mínimo revisado e mergeado pelo PR #153;
- quatro projetos com identidade estável, Registry e Capsules versionados no Git;
- recuperação cross-repository com provenance qualificada;
- freshness Git local estritamente read-only e fail-closed;
- `GET /v1/mcf/context/recovery` e `GET /v1/mcf/context/capabilities`;
- token de Context dedicado, separado do runtime, e boundary desabilitado sem configuração;
- Capability Registry separa implementação, conexão, autorização, runtime e verificação;
- projeção pública não expõe `resolved_path` interno;
- audit de recuperação do ecossistema preservado em `f52485d`.

O `pnpm verify` completo deve ser repetido no HEAD consolidado depois do hardening Ledger e da
entrada da ponte MCF → Cloud. Um resultado anterior não deve ser atribuído automaticamente ao
próximo HEAD.

### Cognitive Ledger — provider comprovado e adapter MCF em hardening

Provider:

- PR #2 mergeado em `design/cognitive-ledger-foundation` no SHA `e0e715b`;
- 29 testes Deno, 10 testes Node legado/exportação e 14 testes MCP aprovados;
- busca textual PostgreSQL/`pg_trgm`; embeddings pagos são opt-in e ficam desabilitados;
- quatro tools MCP read-only: `ler_diario`, `buscar_eventos`, `recuperar_contexto` e
  `ler_fonte_bruta`;
- CI do PR e pós-merge aprovadas com E2E real.

Adapter MCF no checkpoint `28eafbb`:

- implementação pré-hardening em `cee46e1d5d935144a84f67ad42a35a7a370bf49f` e checkpoint de
  evidência em `8e7977bb4f056ad19a2883474a405025e477028d`;
- rota `POST /v1/mcf/context/ledger/query`: POST transporta uma consulta estruturada e não
  concede mutação;
- SDK MCP oficial `1.30.0` e schemas estritos de entrada/saída;
- disabled-by-default, token de entrada separado do Bearer upstream, URL/timeout/tamanho
  limitados e HTTP somente em IP loopback literal para dev/test;
- leitura efêmera com `Cache-Control: no-store, private`; o payload de memória não é persistido
  pelo MCF;
- E2E real pré-hardening MCF → MCP → Edge/Auth → PostgREST → PostgreSQL 17/pgvector aprovado,
  com auditorias esperadas no provider, 3 eventos antes/depois, 0 embeddings, 0 chamadas pagas e
  fingerprint idêntico dentro da execução;
- worktrees permaneceram imutáveis e processos/portas do laboratório foram encerrados.

A revisão final identificou hardening adicional ainda em andamento:

- o adapter MCF deve expor somente as três operações padrão — `ler_diario`, `buscar_eventos` e
  `recuperar_contexto` — sem `ler_fonte_bruta`;
- o token de ingresso do Ledger deve ser separado do token consumido pelo TriView;
- o E2E final deve atravessar o `AppModule` real;
- o MCF não persiste o payload de memória; somente contador técnico de abuse protection, sem
  conteúdo da consulta/resposta, pode constituir efeito local esperado.

Portanto, `cee46e1/8e7977b` são evidência pré-hardening, não a revisão final do capability. O
provider continua oferecendo quatro tools read-only; isso não obriga o consumidor MCF a expor as
quatro.

```yaml
mcf_to_ledger_final_hardening:
  state: IN_PROGRESS_NOT_YET_CLAIMED
  required_operations:
    - ler_diario
    - buscar_eventos
    - recuperar_contexto
  prohibited_operation: ler_fonte_bruta
  required_ingress_token: DEDICATED_NOT_TRIVIEW_TOKEN
  required_e2e: REAL_APPMODULE_TO_LEDGER_LAB_E2E
  allowed_local_effect: ABUSE_PROTECTION_TECHNICAL_COUNTER_WITHOUT_PAYLOAD
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

### Cloud — merge lab e limites

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

O teste Cloud acima usou uma **fixture de cliente MCF**. Portanto, ele não comprova a ponte real
MCF → processo stdio Cloud. Essa frente permanece:

```yaml
mcf_to_cloud_real_adapter:
  state: IN_PROGRESS_NOT_YET_CLAIMED
  required_evidence: REAL_MCF_CLIENT_TO_CLOUD_STDIO_E2E
  default_activation: DISABLED
  vps_freshness: NOT_OBSERVED_LIVE_REQUIRED
```

## Boundary restante para a equipe Cloud/MCF

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

Aceite da ponte real:

1. configuração ausente falha fechada e nenhuma operação desconhecida inicia processo;
2. executável/root/operação/env são allowlists fixas; sem shell, URL, SSH ou path livre;
3. timeout e limites de stdin/stdout/stderr são aplicados;
4. resposta valida o JSON Schema Cloud e recomputa provenance SHA-256;
5. E2E usa o serviço/cliente real do MCF e a fixture Cloud descartável;
6. Git/filesystem ficam idênticos, não há persistência e o processo é limpo;
7. capability permanece restrito a laboratório e não afirma freshness da VPS.

## Ordem de consolidação final

1. concluir o hardening do adapter Ledger e repetir o E2E pelo `AppModule`;
2. concluir e revisar a ponte real MCF → Cloud;
3. atualizar o Capability Registry com SHAs e timestamps exatos dos dois resultados finais;
4. atualizar neste documento e no roadmap os marcadores explicitamente pendentes;
5. executar recuperação das quatro Capsules no baseline final;
6. executar `pnpm verify` com Node 24.18.0 e pnpm 11.17.0;
7. abrir um único PR MCF, observar checks e revisar workflows;
8. aceitar no máximo lab/staging; não promover produção;
9. validar o roadmap público sem serviço/API paga;
10. encerrar/superseder o PR MCF #151 somente depois de o conteúdo consolidado chegar ao `main`.

## Checklist de retomada

- [x] CF-0/CF-1 mergeado pelo PR MCF #153.
- [x] Audit de recuperação `f52485d` incorporado à base de integração.
- [x] Ledger provider mergeado pelo PR #2 e CI pós-merge aprovada.
- [x] Adapter MCF → Ledger pré-hardening comprovado em stack real, com custo pago zero.
- [x] TriView PR #77 mergeado em `release/1.0.0a4`; 419/2 e E2E GET-only aprovados.
- [x] Cloud PR #26 mergeado no branch lab seguro; gates locais 396/396 e 13/13 aprovados.
- [x] CI Cloud classificada honestamente como `NOT_EXECUTED_EXTERNAL_BILLING_GATE`.
- [ ] Fechar hardening Ledger: 3 operações, token ingress próprio, `AppModule` e contador técnico
      sem payload.
- [ ] Concluir a ponte **real** MCF → Cloud e seu E2E descartável.
- [ ] Atualizar capability/roadmap/handoff com os SHAs finais Ledger e Cloud.
- [ ] Rodar a suíte completa do MCF no HEAD consolidado.
- [ ] Abrir/revisar/mergear o PR consolidado MCF e validar apenas lab/staging.
- [ ] Confirmar 0 API paga, 0 produção, 0 VPS/NODE-01, 0 segredo e 0 mutação externa.
