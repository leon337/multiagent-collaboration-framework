# R6 — Inventário forense da worktree do Codex

**Fonte primária:** host `leo-N43SM`  
**Worktree:** `/home/leo/Documentos/GitHub/multiagent-collaboration-framework-nextgen-reconciliation-20260824`  
**Modo:** read-only; nenhum reset/clean/rebase/checkout/edit executado.

## Identidade Git

```yaml
branch: docs/mcf-nextgen-reconciliation-f14-plan-20260824
head: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
upstream: origin/main
ahead: 0
behind: 0
origin_fetch: https://github.com/leon337/multiagent-collaboration-framework.git
origin_push: https://github.com/leon337/multiagent-collaboration-framework.git
```

## Estado porcelain v2

- 8 arquivos tracked apenas modificados no working tree (`.M`);
- 4 arquivos novos staged e depois modificados (`AM`);
- 1 diretório untracked contendo 8 arquivos;
- total do payload atual observado: **20 paths de arquivo**.

### Tracked — 12 paths

1. `.mcf/project-capsule.yaml`
2. `CHANGELOG.md`
3. `README.md`
4. `apps/rede-social-agentes/apps/server/src/mcf-context/context-recovery.service.test.ts`
5. `apps/rede-social-agentes/apps/server/src/mcf-context/mcf-context-fixtures.test.ts`
6. `docs/MCF-CURRENT-STATE.md`
7. `docs/MCF-NEXTGEN-RECONCILIATION-ROADMAP.md` (`AM`)
8. `docs/README.md`
9. `docs/architecture/MCF-NEXTGEN-FORMAL-TARGET-ARCHITECTURE-001.md` (`AM`)
10. `docs/proposals/MCF-NEXTGEN-ROUND-2-DISPOSITION-001.md` (`AM`)
11. `docs/proposals/MCF-V1.1-PREIMPLEMENTATION-RESUME-CARD.md`
12. `docs/superpowers/plans/2026-08-24-mcf-nextgen-reconciled-implementation-plan.md` (`AM`)

### Untracked — 8 paths

1. `artifacts/phases/PHASE-NEXTGEN-RECONCILIATION-F14-001/PHASE-NEXTGEN-RECONCILIATION-F14-001-CHECKPOINT.yaml`
2. `...-DECISIONS.md`
3. `...-PLAN.md`
4. `...-REPORT.md`
5. `...-SMOKE.txt`
6. `...-VALIDATION-FULL.txt`
7. `...-VALIDATION.txt`
8. `artifacts/phases/PHASE-NEXTGEN-RECONCILIATION-F14-001/README.md`

## Diff por camada

```text
git diff --cached --stat
  4 files changed, +1721 / -0

git diff --stat
  12 files changed, +1261 / -213

git diff HEAD --stat
  12 files changed, +2811 / -42
```

A soma aritmética de staged + unstaged **não** deve ser usada para reconstruir o diff final, porque os quatro arquivos `AM` aparecem nas duas camadas. `git diff HEAD` representa o conteúdo tracked final versus HEAD; untracked não entra nesse diff.

## Reconciliação com o snapshot histórico do Codex UI

Snapshot visual anterior:

```text
19 files changed
+1759 / -318
```

Estado Git diretamente medido agora:

```text
12 tracked paths
8 untracked paths
20 total payload paths
tracked final vs HEAD: +2811 / -42
unstaged layer: +1261 / -213
```

**Classificação:** `HISTORICAL_UI_TELEMETRY_NOT_DIRECTLY_COMPARABLE`.

A evidência visual do Codex e as métricas Git medem superfícies diferentes. O card do Codex não é uma prova de `git diff HEAD`, e o Git atual mostra staged + unstaged + untracked separadamente. A diferença de **19 visual vs 20 paths Git atuais** é preservada como `NAO_VERIFICADO`; não há evidência suficiente para afirmar qual path o card visual não contabilizou. Nenhum arquivo será removido para “forçar” a contagem histórica.

## Hashes do payload

Arquivo canônico do manifesto:

`artifacts/phases/PHASE-01-CODEX-WORK-RECOVERY/R6-WORKTREE-MANIFEST.sha256`

```yaml
payload_files: 20
payload_total_bytes: 279844
manifest_sha256: e41b7f478ec46f2156c4af2e58eb27c4b97a60f426fe7cb041229e3446d91992
```

## Fingerprints dos patches tracked

Gerados diretamente da worktree, sem gravação nela:

```yaml
tracked_final_patch:
  command: git diff HEAD --binary
  bytes: 173902
  sha256: d32b7f238a25bafd744704bbe92676c4de6281bbbc3a53b4811ae21d1397c6e0
staged_patch:
  command: git diff --cached --binary
  bytes: 99276
  sha256: 1d01824f1971aa1811707b49865b631f0a432a21624bf00dc8e1d6d2eb9d8671
unstaged_patch:
  command: git diff --binary
  bytes: 143313
  sha256: bfea863b76aa1da75798025748700c486c64c58fea954f5f814e0cf0e9d9f775
```

Esses hashes permitem provar se um patch regenerated posteriormente é byte-equivalente. O checkpoint remoto em R7 deve preservar **os arquivos finais atuais** + provenance; não deve tentar reconstruir o payload a partir do card visual.

## Critério de saída R6

- branch/HEAD/remotes/status: `PASS`;
- staged/unstaged/untracked separados: `PASS`;
- 20 paths e hashes: `PASS`;
- discrepância histórica preservada sem invenção: `PASS`;
- fingerprint de patch binário: `PASS`;
- mutação da worktree durante R6: `NÃO EXECUTADA`.

**Próxima ação:** R7 — criar checkpoint remoto forense dos bytes finais observados, validando contra o manifesto SHA-256.