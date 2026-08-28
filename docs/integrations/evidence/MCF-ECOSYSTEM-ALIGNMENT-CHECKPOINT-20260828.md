# MCF Ecosystem — checkpoint auditável de alinhamento

**Janela:** 2026-08-28  
**Classificação:** `REPOSITORY_AND_GITHUB_EVIDENCE_ONLY`  
**Resultado:** `PASS_WITH_PROVIDER_PROMOTIONS_BLOCKED`

## Escopo observado

Esta evidência consolida o estado Git/GitHub dos quatro repositórios, a preservação de trabalho
local-only e a reconciliação documental do MCF. Não é um Receipt de provider live e não afirma
freshness de VPS, conexão externa, execução de agente, release ou produção.

## Preservação remota concluída

| Conteúdo                          | Branch remota                                  | SHA exato                                  | Estado                               |
| --------------------------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| Cloud G2-B SSH local-only         | `recovery/g2b-ssh-local-preservation-20260828` | `7fa9ab996be6cdffd4ea3913c082e3da7090fff4` | preservado; não é candidato de merge |
| MCF continuidade VPS local-only   | `recovery/codex-mcf-vps-continuity-20260823`   | `2e8d22894fbe533d108301f6731236e0fbacac1d` | preservado; sem acesso VPS           |
| artefatos históricos de auditoria | `recovery/ecosystem-audit-artifacts-20260823`  | `673a23eca6bf2c444c868a930263caf79c02f259` | preservado; evidência histórica      |

### Validação da preservação Cloud SSH

- 13/13 testes SSH: PASS;
- 7/7 testes bootstrap: PASS;
- scan dirigido de segredos: nenhum valor sensível encontrado;
- Ansible não estava instalado; 4 syntax checks continuam pendentes;
- nenhum SSH, VPS, write ou execução remota ocorreu.

## Reconciliação MCF

| Evento           | SHA/PR                                           | Resultado                              |
| ---------------- | ------------------------------------------------ | -------------------------------------- |
| PR #180          | `a8e2372925a512eeaf856b16b4eb82546d9bc0d2`       | protocolo GUI/window reconciliado      |
| PR #184          | `2a264b283d976bd1b392052fa928d076debfc7fb`       | gate autenticado de chat pré-bootstrap |
| branch candidata | `afa7f099ce7ed11e7a0d355f4a4fce75e1849aed`       | documentação/testes reconciliados      |
| PR #185          | merge `0b900ee03a05153e2e4a795fce7b457f5b4bb812` | MERGED; todos os checks verdes         |

Validação local do candidato pós-PR #184:

- 43/43 testes focados PASS;
- migrations PostgreSQL executadas duas vezes PASS;
- servidor: 165 arquivos PASS, 1 arquivo real-Cloud skipped por design;
- 904 testes PASS, 3 skipped por design;
- Prettier, ESLint, typecheck e build dos cinco pacotes PASS;
- PostgreSQL local descartável removido;
- nenhum runtime/provider foi alterado pelo delta documental.

Checks remotos do PR #185:

- Documentation validation: PASS;
- MCF Production Readiness: PASS;
- MCF v1.1 Qualification: PASS;
- Rede Social Container Smoke: PASS;
- Rede Social Foundation: PASS;
- Vercel e Preview Comments: PASS.

## Auditoria de promoção provider-side

### Cloud Infrastructure

- `main@ce829067a9a04eceaa6eaefd9553899b2ce14da1`;
- `mcf/mission-001-control-bridge-g1@38cd22e0a814bdf4957edcf5bb30506a4810bda0`;
- integração `+370/-81` contra `main`;
- recovery SSH `7fa9ab9` é `+218/-81` contra `main` e `+2/-154` contra a linha MCF;
- PR #21 continua aberta; checks GitHub relevantes não estão verdes;
- decisão: `NO_DIRECT_MERGE`.

### Cognitive Ledger

- `main@f95bcddd165afa34708c682d5ce11f810375dc04`;
- `design/cognitive-ledger-foundation@a64cfc05f83567f624bbda70288310f56a7264e8`;
- design `+171/-9` contra `main`;
- PR #1 é draft, `DIRTY/CONFLICTING` e conflita em `README.md`;
- embeddings zero-cost são compatíveis somente com provider disabled; caminho OpenAI continua
  versionado e não pode ser ativado;
- decisão: `RECONCILE_ON_CLEAN_MAIN`.

### TriView Workspace

- `main@60b7e86dc738e1dc285e942951c67e41ac82b018`;
- `release/1.0.0a4@09a361d761adf1e2e614d23718b84776c365cacc`;
- release `+117/-0` contra `main`;
- PR #74 é draft, `CLEAN`, com teste remoto verde;
- R7 físico, LEA-197, smoke MCF, update/rollback, Issue #26 e HUMAN_GATE continuam bloqueados;
- decisão: `WAIT_R7_AND_HUMAN_GATE`.

## Invariantes preservados

- `ZERO_PAID_AI_API`;
- `CAPABILITY != AUTHORITY`;
- `MERGE != RELEASE != DEPLOY`;
- recovery e Capsules são evidência, não estado live;
- nenhuma branch de recovery é promovida por merge cego;
- nenhum provider foi conectado ou ativado;
- nenhum segredo foi incluído nesta evidência;
- nenhuma ação na VPS foi executada.

## Próxima prova

Depois que as atualizações documentais/Capsules forem incorporadas nos targets seguros, executar um
novo recovery estrutural read-only 4/4, congelar os quatro SHAs e registrar Receipts sem persistir
payload de memória ou estado live.
