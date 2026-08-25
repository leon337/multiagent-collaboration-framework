# MCF-CONTENT-LAB-001 — Checklist Cronológico

## Legenda

- `[ ]` — pendente
- `[~]` — em execução
- `[x]` — concluído com evidência
- `[!]` — bloqueado

## Regra obrigatória

Nenhum item do `ROADMAP.md` é considerado concluído antes da atualização deste checklist no mesmo checkpoint operacional, com:

- estado;
- evidência;
- validação;
- próxima ação.

Se o roadmap mudar, este checklist deve ser atualizado antes da continuidade da missão.

---

## R01 — Preparar e governar a missão

**Estado:** `[~] EM EXECUÇÃO — VALIDAÇÃO CONCLUÍDA, AGUARDANDO FECHAMENTO NO ROADMAP`

- [x] Release pública vigente consultada: `MCF v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`.
- [x] `main` live consultado antes da branch: `85ccf418740e78b5e1e3eeb7742baf6f869978c1`.
- [x] Branch exclusiva criada: `mission/mcf-video-gemini-content-lab-20260825`.
- [x] Contrato da missão criado: `MISSAO.md` — commit `5070c583aa0722e5292471d0b0bd1701d6c5737e`.
- [x] Roadmap cronológico criado: `ROADMAP.md` — commit `ef2c1277a8be14e10f8b13c71606987a3cf18523`.
- [x] Checklist cronológico criado: `CHECKLIST.md` — commit `7eb063c54f4536ddebc743099a15953e10c96a4b`.
- [x] `MISSAO.md` relido diretamente na branch e validado como legível/coerente.
- [x] `ROADMAP.md` relido diretamente na branch e validado como legível/coerente.
- [x] `CHECKLIST.md` relido diretamente na branch e validado como legível/coerente.
- [x] Contrato, roadmap e checklist reconciliados sem divergência material identificada neste checkpoint.
- [ ] Atualizar R01 no `ROADMAP.md` para `CONCLUÍDO`.
- [ ] Atualizar este checklist com o commit de fechamento do roadmap e então marcar R01 como `CONCLUÍDO`.

**Evidência de validação:** leitura direta dos três arquivos na branch após criação.

**Próxima ação:** fechar R01 no `ROADMAP.md` e registrar o fechamento aqui antes de iniciar R02.

---

## R02 — Concluir a auditoria integral do vídeo

**Estado:** `[ ] PENDENTE`

- [ ] Consolidar timeline visual.
- [ ] Resolver a dependência da transcrição/narração ou registrar limitação verificável.
- [ ] Extrair afirmações relevantes.
- [ ] Confrontar cada afirmação com a fonte canônica aplicável.
- [ ] Classificar fidelidade e gravidade.
- [ ] Registrar correções recomendadas e limitações.
- [ ] Atualizar este checklist antes de concluir R02.

## R03 — Investigar o processo verificável do Gemini/NotebookLM

**Estado:** `[ ] PENDENTE`

- [ ] Preparar questionário de proveniência e processo verificável.
- [ ] Registrar respostas como auto-relato, sem alegar acesso a raciocínio privado.
- [ ] Comparar respostas com vídeo e fontes disponíveis.
- [ ] Atualizar este checklist antes de concluir R03.

## R04 — Diagnosticar a apresentação atual do MCF

**Estado:** `[ ] PENDENTE`

- [ ] Avaliar clareza para humanos.
- [ ] Avaliar legibilidade para IAs.
- [ ] Mapear jargão, mistura de idiomas, ambiguidades e duplicidades.
- [ ] Definir política de português na superfície e rastreabilidade técnica no núcleo.
- [ ] Atualizar este checklist antes de concluir R04.

## R05 — Executar experimentos repetidos e comparação A/B

**Estado:** `[ ] PENDENTE`

- [ ] Repetir gerações sobre a documentação atual.
- [ ] Registrar métricas comparáveis.
- [ ] Preparar variante documental controlada.
- [ ] Repetir geração sobre a variante.
- [ ] Comparar resultados.
- [ ] Atualizar este checklist antes de concluir R05.

## R06 — Derivar e amadurecer o protocolo de validação de conteúdo

**Estado:** `[ ] PENDENTE`

- [ ] Derivar versão inicial a partir das evidências.
- [ ] Testar contra os casos observados.
- [ ] Auditar e revisar.
- [ ] Atualizar este checklist antes de concluir R06.

## R07 — Projetar o repositório de conhecimento e a fábrica de conteúdo

**Estado:** `[ ] PENDENTE`

- [ ] Definir arquitetura independente do repositório canônico do MCF.
- [ ] Definir proveniência e direitos.
- [ ] Definir suporte a múltiplos motores de IA.
- [ ] Definir pipeline editorial em português.
- [ ] Atualizar este checklist antes de concluir R07.

## R08 — Desenhar e validar a skill `ALINHAR`

**Estado:** `[ ] PENDENTE`

- [ ] Especificar contrato e gatilhos.
- [ ] Testar contra casos reais da missão.
- [ ] Auditar comportamento de não execução antes da confirmação.
- [ ] Decidir integração canônica.
- [ ] Atualizar este checklist antes de concluir R08.

## R09 — Desenhar e validar a skill `ESTRUTURAR MISSÃO`

**Estado:** `[ ] PENDENTE`

- [ ] Derivar contrato da execução manual de R01.
- [ ] Definir critérios para branch dedicada.
- [ ] Definir geração de contrato, roadmap e checklist.
- [ ] Testar sincronização roadmap ↔ checklist.
- [ ] Testar mudança de escopo/roadmap.
- [ ] Decidir integração canônica.
- [ ] Atualizar este checklist antes de concluir R09.

## R10 — Consolidar resultados e plano de integração

**Estado:** `[ ] PENDENTE`

- [ ] Reconciliar roadmap e checklist.
- [ ] Consolidar evidências e decisões.
- [ ] Separar histórico de material canônico.
- [ ] Registrar pendências e riscos residuais.
- [ ] Preparar decisão de integração/PR.
- [ ] Atualizar este checklist antes de concluir R10.
