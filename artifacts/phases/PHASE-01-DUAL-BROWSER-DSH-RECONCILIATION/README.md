# PRF — PHASE-01 Dual Browser ↔ DSH

- **Mission:** MCF-CUIDABEM-002
- **Issue:** https://github.com/leon337/multiagent-collaboration-framework/issues/434
- **Draft PR:** https://github.com/leon337/multiagent-collaboration-framework/pull/435
- **Phase:** PHASE-01-DUAL-BROWSER-DSH-RECONCILIATION
- **Result:** discovery autenticada concluída; reconciliação E2E ainda bloqueada.
- **Security:** token usado apenas em memória para GET autenticados; sem mensagens enviadas, mudanças de configuração ou reinícios.

## Ordem de leitura
1. PHASE-01-PLAN.md
2. PHASE-01-REPORT.md
3. PHASE-01-VALIDATION.txt
4. PHASE-01-VALIDATION-FULL.txt
5. PHASE-01-SMOKE.txt
6. PHASE-01-DECISIONS.md
7. PHASE-01-CHECKPOINT.yaml
8. PHASE-01-ARTIFACT-MANIFEST.sha256

## Resultado resumido
A bridge responde e a discovery autenticada confirma a instância `principal`. Porém, os panes Emily/chat e Sofia/workspace estão `UNBOUND`, o snapshot atual não contém missões e o helper canônico aponta para um caminho de repositório inexistente. O adapter de socket legado está sem listener. A UI DSH responde, mas nenhuma API externa de despacho foi confirmada. Não houve envio de prompts.

## Retomada
Determinar o checkout canônico atualizado sem tocar em working trees sujas/históricas. Definir a configuração do helper por mecanismo suportado e localizar o adapter parado, preservando o processo atual. Só depois executar teste neutro com evidência de turno real, identidade e conversation URL.
