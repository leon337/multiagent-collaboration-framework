# PHASE-STABLE-RELEASE-001 — DECISIONS

## D1 — Boundary

Não criar Gate F. Usar a missão `MCF-STABLE-RELEASE-001` para materializar o milestone já exigido por MCF-DEC-063.

## D2 — Identidade do candidato

RC2 não é suficiente para stable porque o estado produtivo atual contém mudanças materiais posteriores. Exigir RC3 final.

## D3 — Disponibilidade

O timeout de 20s era do monitor, não do runtime. O monitor passou a usar 20s + 10s de espera + tentativa de recuperação de até 75s. A política foi comprovada em execução real e fechou #129 automaticamente.

## D4 — Infraestrutura

Manter Render Free nesta missão, conforme decisão canônica vigente. Migração de infraestrutura é evolução separada.

## D5 — Autoridade

A publicação de RC3 pode ocorrer após gate técnico interno e requalificação. A criação de `v1.0.0` exige HUMAN_GATE explícito de LEANDRO imediatamente antes do efeito público imutável.
