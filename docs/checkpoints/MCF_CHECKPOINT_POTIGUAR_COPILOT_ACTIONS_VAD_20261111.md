# MCF — CHECKPOINT DE CONTINUIDADE: COPILOTO POTIGUAR

**Mission ID:** `POTIGUAR-COPILOT-ACTIONS-VAD-20261111`
**Phase:** `HML_ACTIVE_CHECKPOINT_AND_HANDOFF`
**Data:** 11/11/2026 (America/Recife)
**Estado:** `CURRENT_IMPLEMENTED_HML / PR_OPEN / OFFICIAL_PRODUCTION_BLOCKED`
**Human final authority:** LEANDRO. **Orquestrador:** MESTRE. **LÉO:** agente separado.

Este registro é uma ponte entre o MCF e o repositório do produto. **Não redefine a metodologia MCF, a missão NF-01 ou o project registry.** O próximo MESTRE deve consultar o GitHub e os provedores ao vivo, em vez de tratar o snapshot como estado permanente.

## Repositório do produto e documentos canônicos

- Produto: [leon337/reconhecimento_facial](https://github.com/leon337/reconhecimento_facial).
- [Checkpoint técnico completo do produto](https://github.com/leon337/reconhecimento_facial/blob/216c4295e2c46dbdec73bd69ad8c0dcb4cf0a20b/docs/copilot/checkpoints/2026-11-11-CHECKPOINT-COPILOTO-VAD-ACOES.md)
- [Handoff para outra sessão](https://github.com/leon337/reconhecimento_facial/blob/216c4295e2c46dbdec73bd69ad8c0dcb4cf0a20b/docs/copilot/checkpoints/2026-11-11-HANDOFF-PROXIMA-SESSAO.md)
- [Índice atual do Copiloto](https://github.com/leon337/reconhecimento_facial/blob/216c4295e2c46dbdec73bd69ad8c0dcb4cf0a20b/docs/copilot/CURRENT_CHECKPOINT.md)
- [PR #41 — cadastro assistido/VAD](https://github.com/leon337/reconhecimento_facial/pull/41)
- [ADR-002](https://github.com/leon337/reconhecimento_facial/blob/216c4295e2c46dbdec73bd69ad8c0dcb4cf0a20b/docs/copilot/ADR-002-ACOES-ASSISTIDAS-VAD.md) e [evidências](https://github.com/leon337/reconhecimento_facial/blob/216c4295e2c46dbdec73bd69ad8c0dcb4cf0a20b/docs/copilot/2026-11-11_ACTIONS_VAD_TESTS.md).

## Reconciliado nesta sessão

| Item | Evidência |
|---|---|
| Produto `main` | `d64326789092992c2357dc6f945546bb192bebbf` (antes do checkpoint; reler live) |
| PR #41 | ABERTO / NÃO MERGED em 11/11, target `main` |
| HEAD técnico de #41 antes do checkpoint | `94469e42b0a26d2ab306530744955c6c5d639ba8` |
| Commit do checkpoint no produto | `216c4295e2c46dbdec73bd69ad8c0dcb4cf0a20b` (reconferir checks deste SHA) |
| CI no HEAD técnico anterior | `CI`, `Production Validation`, `Copiloto Vue`, `Portal de Credenciais` — SUCCESS |
| Testes locais | Python **174 passed**; Node **12 passed**; Vite build passou |
| Homologação | `potiguar-copilot:hml-actions-vad-20261111` no notebook `leo-N43SM`, health HTTP 200 |
| Segurança externa | `trycloudflare.com` temporário atrás de HTTP Basic Auth + login Flask; anônimo HTTP 401 |
| MCF `main` no início deste checkpoint | `0bcea848934ada8593a9ff8be86ea3a41157e546` |

Os links de arquivo acima apontam para o commit imutável do checkpoint. O **commit documental** no PR #41 faz os checks daquele commit correrem novamente; **não reutilizar os 4 checks verdes do SHA anterior** como evidência suficiente para merge do novo HEAD.

## Decisões arquiteturais já tomadas

1. Gemini `gemini-3.8-live` só monta rascunho por `prepare_employee_registration`. A gravação de funcionário acontece **somente com confirmação humana**, RBAC/CSRF, validação e auditoria no backend.
2. Uma senha inicial aleatória é gerada no servidor e não enviada ao Gemini. Contas novas são `operator`; não há ferramenta para biometria, ponto ou folha.
3. Novo `vad.js` local modular detecta fala por energia adaptativa, periodicidade, cruzamento por zero e histerese; usa ainda VAD da Live API e oferece modo manual.
4. O Extended Thinking **não emitiu tool call** no teste real; cadastro conversacional limitado ao Live padrão, sem alegar suporte nativo a ferramentas no Extended.
5. As flags de ações são **OFF por padrão** no código; apenas a homologação sintética foi ativada. Nada foi liberado como registrador oficial de ponto.
6. O VAD do **assistente R** e o termo **“modulizing”** foram mencionados por LEANDRO, mas sua origem **não foi identificada com segurança**. Descobrir e comparar antes de declarar reaproveitamento.

## Próximas ações seguras

1. Abrir **AGENTS.md** e **docs/operations/MCF-MESTRE-HANDBOOK.md** do MCF, além deste arquivo e do handoff detalhado do produto.
2. Reconciliar GitHub live de `leon337/reconhecimento_facial`: PR #41 HEAD e checks **novos**, `main`, PRs paralelos #32, #34, #35, #38.
3. Preservar o checkout NF-01 `/home/leo/reconhecimento_facial`; usar o worktree isolado `/tmp/potiguar-actions-vad-20261111`, branch `feat/copilot-actions-vad-20261111`. Há um symlink não rastreado `frontend/copilot/node_modules`; **não versioná-lo**.
4. Validar VAD e cadastro assistido em **Chrome Android real**. Testar música, ventilação, barulho de rua, transcrição, rascunho, clique e persistência. Só dados sintéticos: nomes `de Teste`, usuários `.teste`, matrículas `TEST-`.
5. Verificar se a HML continua online; a URL Cloudflare **expira**. Não expor a chave Gemini (cofre SQLite em leitura) e não divulgar senhas/credenciais.
6. Auditar idempotência por `request_id` (ainda sem deduplicação durável); não repetir escritas sem reconciliar estado do banco.
7. Respeitar gates de revisão/merge. Nenhum novo deploy oficial sem PostgreSQL durável, backup/restore, operação/segurança, LGPD e requisitos trabalhistas.

**Outros contextos preservados:** NF-01 [PR #32](https://github.com/leon337/reconhecimento_facial/pull/32) com [PR #35](https://github.com/leon337/reconhecimento_facial/pull/35), CI PostgreSQL [#34](https://github.com/leon337/reconhecimento_facial/pull/34) e hospedagem Render draft [#38](https://github.com/leon337/reconhecimento_facial/pull/38). A entrada `context/projects/controle-ponto-frontend.yaml` continua descrevendo NF-01, não este Copiloto.

## Frase de retomada

> **MESTRE, retome a missão POTIGUAR-COPILOT-ACTIONS-VAD-20261111 pelo checkpoint MCF e pelo checkpoint/handoff do repo reconhecimento_facial. Consulte o estado real do PR #41 e do deploy HML; preserve NF-01, cofre, backups e dados sintéticos. Não reimplemente. Valide o VAD no Android real e localize o módulo R antes de avançar; não trate a homologação como produção oficial.**
