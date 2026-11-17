# F0.7 - Ciclo 3: seguranca de recibos e publicacao

Missao MCF-GEMINI-LIVE-EVOLUTION-20261116-001; PR F0 #528; Issue #527.
A auditoria externa Codex CLI do SHA a8ffca392ba24dd1202866da1c24ece2f75b6a49 retornou F0 para correcao.

## Defeito
O sincronizador comment-only poderia aceitar um comentario de terceiros citando um marker como recibo, bem como publicar apos mudanca de HEAD durante paginacao de comentarios. Execucoes simultaneas do workflow podiam publicar duas vezes.

## Correcao
- isTrustedReceipt verifica autor por allowlist de conta oficial leon337 ou github-actions[bot] e exige corpo de comentario completo e correspondente, permitindo apenas mudanca do timestamp de consulta.
- Releitura da PR apos paginar comentarios, e da Issue antes do POST. Qualquer alteracao/fechamento bloqueia a escrita.
- Reconciliacao de timeout so reconhece recibo confiavel. Nunca faz um segundo POST cegamente.
- GitHub Actions publish_signal tem concurrency group cancel-in-progress=false, serializando dispatches do workflow.
- Permanecem bloqueadas edicao de checkboxes/gates/estado, escrita sem token/opt-in e inferencia de aceite por CI.

## Evidencias
36/36 testes Node PASS: 27 casos de sincronizador, incluindo seis casos adversariais novos, mais nove casos de privacidade da telemetria. Node check PASS. PRF F0 original 8/8 hashes PASS. O manifesto de suplemento inclui hashes de codigo, testes, workflow e estas decisoes.

## Limites remanescentes
GitHub API nao fornece transacao atomica de check HEAD/POST de comentario. Um CLI paralelo fora do workflow pode gerar comentario duplicado na janela residual, mas nunca gate falso: so comentarios de observacao. Sincronizador ainda nao consome todos os eventos check_suite/workflow_run nem receipts de gate. F0.7 segue MVP de comentario opt-in, nao cobertura completa de governanca Classe C.
F0.4 de seguranca, F0.5 fisico, F0.6 de contrato amplo e F0.8 de gate continuam pendentes. Credencial antiga nao foi lida nem rotacionada, conforme decisao de LEANDRO. Nenhum merge/deploy de producao.
