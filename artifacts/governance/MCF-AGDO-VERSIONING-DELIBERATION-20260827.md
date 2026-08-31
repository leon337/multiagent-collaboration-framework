# MCF — Deliberação sobre autonomia operacional e versionamento

Data: 2026-08-27
Autoridade humana final: Leandro
Baseline: v1.2.0 — Human Control + Visible Copresence
Status: DELIBERATED / HUMAN_DECISION_REQUIRED

## Questão
O conjunto de operações reais executadas hoje no notebook autorizado constitui nova capacidade suficiente para nova release, ou validação de campo das capacidades já formalizadas em v1.2.0?

## Participantes e rotas desta rodada
- LEO — kr/claude-sonnet-4.5
- RENATO — kr/minimax-m2.5
- BEATRIZ — kr/glm-5 (fallback; DSH headless oficial teve timeout e foi encerrado)
- AUGUSTO — kr/qwen3-coder-next
- EMILY — kr/deepseek-3.2

## Resultado
- 5/5: FIELD_EVIDENCE, não nova capacidade já implementada.
- 4/5: manter v1.2.0 sem bump.
- 1/5: NONE; admite v1.2.1 apenas se documentação/testes forem formalmente publicados.
- 0/5: recomendar v1.3.0 agora.
- 0/5: recomendar v2.0.0.

## Consenso técnico
As operações de hoje demonstram maior profundidade, adaptação e proficiência dentro do contrato já introduzido por v1.2.0: GUI autorizada, execução governada/auditável, controle humano, verdade sobre o mecanismo e preservação de segredos.

O avanço é real como maturidade operacional e evidência de campo, mas o time não encontrou ainda uma nova fronteira normativa de capacidade, API ou governança que justifique SemVer minor.

## Caminho para v1.3.0
v1.3.0 torna-se tecnicamente defensável se o MCF primeiro definir e testar uma nova subcapacidade normativa, por exemplo Adaptive Governed Desktop Operations / Autonomous GUI Debugging, com contrato, invariantes, testes e limites explícitos. A release viria depois da implementação/qualificação, não apenas da demonstração atual.

## Gate
NO_MERGE=TRUE
NO_TAG=TRUE
NO_RELEASE=TRUE
HUMAN_RELEASE_GATE=LEANDRO

Nenhuma publicação deve ocorrer antes de decisão explícita de Leandro.

## Decisão humana posterior

Leandro selecionou a opção 1: manter v1.2.0 como baseline, registrar FIELD VALIDATION e abrir a missão AGDO para possível v1.3.0 após qualificação.
