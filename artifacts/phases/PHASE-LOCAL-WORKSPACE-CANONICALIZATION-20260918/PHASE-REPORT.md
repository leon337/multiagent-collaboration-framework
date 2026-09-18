# Report

A reconciliação identificou quatro árvores locais do MCF com funções distintas. O `main` de todas foi alinhado ao `main` GitHub observado, preservando branches de teste, feature e recovery.

Depois de correção de execução, a continuidade desta fase foi movida para o boundary canônico do Harness V2: `CHATGPT_BUBBLE_LOCAL_SANDBOX`.

No sandbox da bolha, cinco workers locais foram executados em paralelo: Miriam, Gabriel, Augusto, Carmem e Renato. Cada worker gerou evidência e receipt em processo separado. O auditor local fez fan-in.

Resultado observado:
- 5 workers;
- 5 PIDs distintos;
- 5/5 PASS;
- auditor local PASS;
- notebook_used=false;
- brainbase_used=false;
- cognitive_agents_claimed=false.

O schema do Project Registry foi consultado antes da decisão documental. Como não aceita propriedades extras e não define caminho local, a regra foi registrada em `docs/operations/`.
