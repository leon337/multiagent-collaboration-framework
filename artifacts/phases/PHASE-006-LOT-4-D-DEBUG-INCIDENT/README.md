# PHASE-006-LOT-4-D-DEBUG-INCIDENT

Phase Traceability Pack Classe C da missão `MCF-RUNTIME-006-LOT-4-D-DEBUG-INCIDENT`, Issue `#103`, PR técnico `#104`.

## Conteúdo

- `PHASE-006-LOT-4-D-DEBUG-INCIDENT-PLAN.md` — objetivo, boundary, agentes e critérios;
- `PHASE-006-LOT-4-D-DEBUG-INCIDENT-REPORT.md` — implementação e evidência observada;
- `PHASE-006-LOT-4-D-DEBUG-INCIDENT-VALIDATION.txt` — resumo verificável;
- `PHASE-006-LOT-4-D-DEBUG-INCIDENT-VALIDATION-FULL.txt` — ESEV, CAF e validação detalhada;
- `PHASE-006-LOT-4-D-DEBUG-INCIDENT-SMOKE.txt` — evidência histórica de Container Smoke;
- `PHASE-006-LOT-4-D-DEBUG-INCIDENT-CHECKPOINT.yaml` — checkpoint estruturado;
- `PHASE-006-LOT-4-D-DEBUG-INCIDENT-DECISIONS.md` — decisões do boundary;
- `PHASE-006-LOT-4-D-DEBUG-INCIDENT-ARTIFACT-MANIFEST.sha256` — hashes SHA-256 dos artefatos deste pack.

## Estado

O candidato pré-PRF `933c8f72dd19219eea6112adfdd8db7c43112f2c` passou Foundation `31477171098` e Container Smoke `31477171096`. O primeiro candidato PRF `9ebedbaa85bfa92d52f199df064382e075adb1d3` também passou Foundation `31477910252` e Container Smoke `31477910266`, porém foi corretamente marcado como `SUPERSEDED_BY_REVIEW_CAF` depois que Vinicius identificou que `blind_retry: false` isolado era apenas uma afirmação booleana.

A correção exige agora `retry_evidence` semanticamente significativo. Como o código e o PRF mudaram depois desses runs, o estado voltou para `CANDIDATE_PRF_AWAITING_EXACT_HEAD_REVALIDATION` até a regeneração do manifesto e a execução de Foundation + Container Smoke no novo SHA exato.

Nenhum review aprovado, auditoria, gate, merge ou canonical sync é declarado concluído por este README.
