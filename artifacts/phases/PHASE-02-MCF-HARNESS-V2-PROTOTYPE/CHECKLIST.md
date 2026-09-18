# CHECKLIST FINAL — MCF Harness V2 2.0.0

Mission ID: `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`  
Autoridade: `LEANDRO`  
Estado: `ENTREGUE`

Legenda: `[x]` validado · `[~]` parcial/hardening futuro · `[-]` deferido e aceito.

## A. Governança
- [x] A01–A09 missão, autoridade, boundary, anti-simulation e evidência.
- [~] A10 verificação criptográfica forte de autoridade por evento — hardening futuro.

## B. Engenharia reversa
- [x] B01–B09 DeepSeek Harness + Agent Teams estudados e padrões classificados.

## C. Journal / Projection
- [x] C01–C07 WAL, sequência, idempotência, replay, hash-chain/tamper.
- [~] C08 anchor externo/assinatura — hardening futuro.
- [~] C09 migração de schema além do registry — futuro.
- [~] C10 compaction/snapshot auditável — futuro.

## D. DAG / Concorrência
- [x] D01–D11 IDs, CAS, DAG, readiness, lease, expiry, heartbeat.
- [~] D12 fairness.
- [~] D13 backpressure.
- [~] D14 priority/preemption.

## E. Mailbox
- [x] E01–E04 durable queue/delivered/reopen/target validation.
- [~] E05–E08 dispatcher dedicado, ordem sob carga e limites — hardening futuro.

## F. Lifecycle / Sessões
- [x] F01–F04 provisioning/active/failed e transições.
- [~] F05 provisioning reconcile ampliado.
- [x] F06 session ID durável.
- [x] F07 pause/resume após reopen.
- [x] F08 interrupt sem perda de mailbox.
- [x] F09 reassignment via recovery.

## G. Executor
- [x] G01–G07 interface e lifecycle do executor.
- [-] G08 backend cognitivo bubble-native — deferido e aceito.
- [-] G09 dois agentes cognitivos independentes — depende de G08.
- [-] G10 model/tool receipts cognitivos — depende de G08.
- [x] G11 crash do executor não destrói Mission Journal.

## H. Capabilities / Segurança
- [x] H01–H05 allowlist, fail-closed, expiração, narrowing, no widening.
- [~] H06 tool-output sanitation.
- [~] H07 confused-deputy hardening.
- [~] H08 política ampla de secrets.
- [~] H09 threat model adicional.

## I. Workspace
- [x] I01–I07 isolamento, path ownership, conflito, reconciliation gate e rollback.

## J. Receipts / Evidence
- [x] J01–J09 execution/tool lifecycle, digest, artifacts e usage.
- [~] J10 schema dedicado de receipt — registry atual cobre domínios principais.
- [~] J11 attestation externa quando suportada.
- [-] J12 accounting de agentes cognitivos — depende de G08.

## K. Time local
- [x] K01–K12 fan-out/fan-in, receipts, manifest, notebook=false, Brainbase=false, no fake cognitive claim.
- [-] K13 conversão para time cognitivo — depende de G08.

## L. Auditoria adversarial
- [x] L01 auditor técnico.
- [-] L02 auditor cognitivo independente — deferido com G08.
- [x] L03–L09 false green, forgery, poisoning, escalation, stale lease, crash e parecer separado.

## M. Recovery
- [x] M01–M08 checkpoint, persistência, materialização, replay, sessions e reassign.
- [-] M09 segunda conversa ChatGPT real — deferido e aceito; exige ação da superfície humana/produto.

## N. Testes
- [x] N01–N14 CAS, mailbox, leases, capabilities, DAG, tamper, SIGKILL, storage failure, artifact failure, executor swap, 6-process fan-out e soak/reopen.

## O. Métricas
- [x] O01–O07 wall/queue/tool time, retries, failure, concurrency e audit rejection.
- [-] O08 model/context usage — depende de G08.
- [-] O09 seleção adaptativa de modelo — depende de G08.
- [x] O10 política adaptativa de team size + probe 6 processos.

## P. Release
- [x] P01 schema versionado.
- [x] P02 API/runtime documentada.
- [x] P03 recovery runbook.
- [x] P04 rollback documentado/testado.
- [-] P05 V1→V2 — deferido e aceito; schema V1 canônico não localizado.
- [x] P06 unit tests verdes.
- [x] P07 integration tests verdes.
- [x] P08 auditoria técnica independente verde.
- [x] P09 zero dependência obrigatória notebook/Brainbase/VPS.
- [x] P10 HUMAN_GATE — **APROVADO por LEANDRO em 2026-09-18**.

## Q. History Pipeline
- [x] Q01–Q10 append-only, lock, idempotência, hash-chain, projection e cockpit E2E.

## Resultado

`ENTREGUE — MCF Harness V2 2.0.0 — deferimentos preservados e aprovados.`
