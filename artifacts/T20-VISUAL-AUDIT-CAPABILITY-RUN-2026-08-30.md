# T20 — Visual Desktop Audit Capability — Live Repeatability Evidence

**Date:** 2026-08-30
**Branch head:** `6066dc116cf8d2141dfa2693149780a86d864241`
**Skill:** `MCF-AUDIT-VISUAL-DESKTOP`
**Adapter:** `apps/rede-social-agentes/ops/visual-desktop-audit.mjs`

## Objective

Demonstrate that the reusable MCF visual-desktop audit capability can identify three authorized Brave surfaces, capture and annotate observable content, open the annotated result on the selected surface, and verify that opening without human desktop operation.

## Live acceptance result

- Comparable executions: **5**
- Passing executions: **5/5**
- Expected/observed surfaces on every run: **3/3**
- `openVerified=true` on every run: **5/5**
- Critical failures: **0**
- Timing: **min 3319 ms / median 3416 ms / max 3917 ms**
- Time budget: **8000 ms**; every run remained within budget.
- Interpretation mode: OCR fallback over a content band below browser chrome.

## Run matrix

| Run | Verdict | Elapsed | Surfaces | Open verified | Raw SHA-256 | Annotated SHA-256 | Verification SHA-256 |
| ---: | --- | ---: | ---: | --- | --- | --- | --- |
| 1 | PASS | 3319 ms | 3 | true | `3925a7dae720f703…` | `7fbb03ac6c8248e3…` | `467d96eea07bc76e…` |
| 2 | PASS | 3416 ms | 3 | true | `96cad88f6173f390…` | `c494adc2e80f29d1…` | `c308fcfad2fd354e…` |
| 3 | PASS | 3404 ms | 3 | true | `96cad88f6173f390…` | `c494adc2e80f29d1…` | `c308fcfad2fd354e…` |
| 4 | PASS | 3917 ms | 3 | true | `96cad88f6173f390…` | `c494adc2e80f29d1…` | `c308fcfad2fd354e…` |
| 5 | PASS | 3638 ms | 3 | true | `cb5181470c836600…` | `c494adc2e80f29d1…` | `c308fcfad2fd354e…` |

## Artifact references

### Run 1
- `raw`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-1/mcf_visual_audit_20260830200759_raw.png` — SHA-256 `3925a7dae720f703c57701adabad527bfffd9505d20b5288eec1074412760401`
- `annotated`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-1/mcf_visual_audit_20260830200759_annotated.png` — SHA-256 `7fbb03ac6c8248e31352ac586637c9de524ddb93bb508f58eb2e0d8ad5803584`
- `verification`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-1/mcf_visual_audit_20260830200759_verification.png` — SHA-256 `467d96eea07bc76ed9499452eadbac1d98386cba3587f1684c90b925aff14d98`
- Observable OCR labels: `© & GROK BOT Os dois commits já consolidados na branch são: & Compartilhar — ++ | (4 6e1d894... — governança/runtime da nova skill | Q 10698ee... — adapter reutilizável de uma chamada | XS Entao o estado correto é: | À di | = GROK BOT we | Chats Fontes | Branch - Saudação inicial | mm GROK BOT see | Chats Fontes | Branch - Saudação inicial 30 de ago | Ok! Entendi. Pode dar continuidade 99.`

### Run 2
- `raw`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-2/mcf_visual_audit_20260830200807_raw.png` — SHA-256 `96cad88f6173f390d6c8be1629c0f77dc028045b1b531e8626792db888c21201`
- `annotated`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-2/mcf_visual_audit_20260830200807_annotated.png` — SHA-256 `c494adc2e80f29d16eab240bd0ae8221b1b6612daf49162d1e643d8de2e23e95`
- `verification`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-2/mcf_visual_audit_20260830200807_verification.png` — SHA-256 `c308fcfad2fd354e1f76b4d1d9875368797a1cacfd5c86465c328c971dde9bd4`
- Observable OCR labels: `© & GROK BOT Os dois commits já consolidados na branch são: & Compartilhar — ++ | (4 6e1d894... — governança/runtime da nova skill | Q 10698ee... — adapter reutilizável de uma chamada | XS Entao o estado correto é: | À di | = GROK BOT we | Chats Fontes | Branch - Saudação inicial | mm GROK BOT see | Chats Fontes | Branch - Saudação inicial 30 de ago | Ok! Entendi. Pode dar continuidade 99.`

### Run 3
- `raw`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-3/mcf_visual_audit_20260830200816_raw.png` — SHA-256 `96cad88f6173f390d6c8be1629c0f77dc028045b1b531e8626792db888c21201`
- `annotated`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-3/mcf_visual_audit_20260830200816_annotated.png` — SHA-256 `c494adc2e80f29d16eab240bd0ae8221b1b6612daf49162d1e643d8de2e23e95`
- `verification`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-3/mcf_visual_audit_20260830200816_verification.png` — SHA-256 `c308fcfad2fd354e1f76b4d1d9875368797a1cacfd5c86465c328c971dde9bd4`
- Observable OCR labels: `© & GROK BOT Os dois commits já consolidados na branch são: & Compartilhar — ++ | (4 6e1d894... — governança/runtime da nova skill | Q 10698ee... — adapter reutilizável de uma chamada | XS Entao o estado correto é: | À di | = GROK BOT we | Chats Fontes | Branch - Saudação inicial | mm GROK BOT see | Chats Fontes | Branch - Saudação inicial 30 de ago | Ok! Entendi. Pode dar continuidade 99.`

### Run 4
- `raw`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-4/mcf_visual_audit_20260830200825_raw.png` — SHA-256 `96cad88f6173f390d6c8be1629c0f77dc028045b1b531e8626792db888c21201`
- `annotated`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-4/mcf_visual_audit_20260830200825_annotated.png` — SHA-256 `c494adc2e80f29d16eab240bd0ae8221b1b6612daf49162d1e643d8de2e23e95`
- `verification`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-4/mcf_visual_audit_20260830200825_verification.png` — SHA-256 `c308fcfad2fd354e1f76b4d1d9875368797a1cacfd5c86465c328c971dde9bd4`
- Observable OCR labels: `© & GROK BOT Os dois commits já consolidados na branch são: & Compartilhar — ++ | (4 6e1d894... — governança/runtime da nova skill | Q 10698ee... — adapter reutilizável de uma chamada | XS Entao o estado correto é: | À di | = GROK BOT we | Chats Fontes | Branch - Saudação inicial | mm GROK BOT see | Chats Fontes | Branch - Saudação inicial 30 de ago | Ok! Entendi. Pode dar continuidade 99.`

### Run 5
- `raw`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-5/mcf_visual_audit_20260830200834_raw.png` — SHA-256 `cb5181470c8366009a6e0d20fe7158baa8d3b669fbe6b850e5ba76a0f9cac640`
- `annotated`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-5/mcf_visual_audit_20260830200834_annotated.png` — SHA-256 `c494adc2e80f29d16eab240bd0ae8221b1b6612daf49162d1e643d8de2e23e95`
- `verification`: `/home/leo/Documentos/GitHub/caixadepandora/mcf-visual-audit-capability/repeatability-20260830/run-5/mcf_visual_audit_20260830200834_verification.png` — SHA-256 `c308fcfad2fd354e1f76b4d1d9875368797a1cacfd5c86465c328c971dde9bd4`
- Observable OCR labels: `© & GROK BOT Os dois commits já consolidados na branch são: & Compartilhar — ++ | (4 6e1d894... — governança/runtime da nova skill | Q 10698ee... — adapter reutilizável de uma chamada | XS Entao o estado correto é: | À di | = GROK BOT we | Chats Fontes | Branch - Saudação inicial | mm GROK BOT see | Chats Fontes | Branch - Saudação inicial 30 de ago | Ok! Entendi. Pode dar continuidade 99.`

## Independent visual inspection

- Inspected the final annotated PNG independently from the adapter result. It shows exactly three red-bounded operational surfaces, ordered left to right, with headers tied to the corresponding Brave windows.
- Inspected the final verification PNG independently. Surface 3 is visibly displaying the generated annotated PNG through a local file URL; surfaces 1 and 2 remain on GROK BOT content.
- No surface confusion or missing annotation was observed in the final run.
- OCR quality is materially improved after moving the OCR band below browser chrome. Small leading-glyph noise remains on narrow surfaces 2 and 3, but the labels remain grounded in visible page text and do not fabricate unseen content.

## Repeatability verdict

**PASS.** The capability satisfied the T20 live gate: 5/5 comparable runs completed within the requested time budget with 3/3 surfaces, all three artifacts present, `openVerified=true`, and no critical failures.

