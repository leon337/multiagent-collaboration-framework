# MCF Content Studio N4 — Roadmap de Implantação

**Mission:** `MCF-CONTENT-STUDIO-N4-001`  
**Phase:** `PHASE-CONTENT-STUDIO-N4-FOUNDATION-001`  
**Tracker:** #254  
**State:** `PLANEJADO / IMPLEMENTAÇÃO AUTORIZADA EM BRANCH ISOLADA`  
**Baseline:** `main@19731f281126c1360e33732dd74b82a85e9e7f7a`

## Objetivo

Implantar a fundação modular do Content Studio N4 para produção audiovisual educacional:

```text
FONTE REAL
   ↓
INSTAVAR
storyboard / VideoSpec / preflight
   ↓
MCF N4 VIDEO ENGINE
components + templates + registry + assets
   ↓
REMOTION
produção / preview / render
   ├──────────────→ EXPLAIN
   │               compreensão interativa
   ↓
QA / BENCHMARK
   ↓
HUMAN_GATE
```

## Roadmap por gates

### G0 — Baseline e contrato
**Saída:** missão rastreável e ambiente de trabalho seguro.

- registrar missão;
- criar branch isolada;
- versionar roadmap/checklist;
- criar PLAN/CHECKPOINT;
- preservar #251 como benchmark e #248 como referência visual relacionada.

**Gate de saída:** G0 documental completo.

### G1 — Arquitetura N4
**Saída:** contratos e schemas antes de código visual em escala.

Entregas:
- design tokens;
- motion tokens;
- contrato de componente;
- schema do Template Registry;
- schema de import;
- fronteira Instavar ↔ Remotion ↔ Explain;
- política de assets e dependências.

**Gate de saída:** arquitetura revisada por Sofia/Rafael + UX/UI por Evelyn/Laura/Isabela.

### G2 — N4 Component Library
**Saída:** 10 componentes reutilizáveis.

MVP:
1. FocusConcept
2. ProgressiveDiagram
3. AnimatedTimeline
4. ActiveRecall
5. ErrorVsCorrect
6. ArchitectureNode
7. AnimatedArrow
8. ChapterProgress
9. BrowserWindow
10. TerminalWindow

Requisitos transversais:
- props tipadas;
- 9:16 e 16:9;
- reduced-motion;
- safe area;
- exemplos e stills.

### G3 — Template Registry
**Saída:** catálogo descobrível e governado.

Metadados mínimos:
- id;
- versão;
- categoria;
- aspect ratios;
- editabilidade;
- dependências;
- origem;
- licença;
- compatibilidade;
- risco;
- preview;
- status de aprovação.

Estados:
`DISCOVERED → REVIEWED → ADAPTED → APPROVED → DEPRECATED`.

### G4 — MCF Video Lab
**Saída:** playground visual para testar sem render master.

MVP:
- galeria;
- busca;
- preview;
- edição de props;
- presets;
- stills;
- seleção de aspect ratio;
- mobile + desktop smoke.

Não-MVP:
- timeline completa estilo editor profissional;
- colaboração multiusuário;
- Figma round-trip.

### G5 — Importer governado
**Saída:** fluxo seguro para componentes externos.

Pipeline:
```text
ORIGEM
→ LICENÇA
→ DEPENDÊNCIAS
→ SEGURANÇA
→ PERFORMANCE
→ ADAPTAÇÃO N4
→ QA
→ REGISTRY
```

Prova mínima:
- 1 componente externo estudado;
- licença registrada;
- dependências auditadas;
- adaptação N4;
- preview funcional;
- nenhuma importação automática não revisada.

### G6 — Piloto Aula 3.1
**Saída:** prova de uso real da biblioteca.

Critérios:
- roteiro usa componentes N4;
- leitura guiada;
- diagramas progressivos;
- active recall;
- áudio/visual sincronizados;
- nenhum erro sintático de animação;
- validação em mobile 9:16.

### G7 — QA e benchmark
**Saída:** qualidade mensurável.

Medir:
- task success do render/preview;
- tempo até preview;
- tempo de render;
- overflow;
- legibilidade;
- safe area;
- reduced-motion;
- falhas de componente;
- comparação com #251.

Regra:
`PREVIEW_PASS != MASTER_PASS`.

### G8 — Auditoria e decisão de escala
**Saída:** decisão fundamentada de continuar ou corrigir.

- Renato: QA;
- Lucas: performance;
- Augusto: trace/eficiência;
- Emily: auditoria independente;
- LÉO: gate interno;
- LEANDRO: HUMAN_GATE quando merge/publicação exigir.

Somente após G8 decidir:
- migrar ou não as outras 9 aulas;
- ampliar a biblioteca;
- iniciar fase de editor visual avançado.

## Marcos

| Marco | Resultado verificável |
|---|---|
| M0 Foundation | contratos + schemas |
| M1 Reusable Motion | 10 componentes |
| M2 Discoverability | registry |
| M3 Experimentation | Video Lab |
| M4 Ecosystem | importer governado |
| M5 Proof | Aula 3.1 N4 |
| M6 Quality | QA + benchmark |
| M7 Scale Decision | decisão sobre 9 aulas |

## Riscos principais

| Risco | Controle |
|---|---|
| biblioteca virar coleção inconsistente | design tokens + contracts |
| importar código/licença problemática | importer governado |
| preview divergente do master | validação em duas etapas |
| texto/elemento cortado | safe-area + overflow tests |
| animação inválida | testes + preview por cena |
| performance degradar | benchmark e budget |
| dependência excessiva do Explain | bifurcação Remotion/Explain |
| tentar construir editor grande cedo demais | escopo MVP explícito |

## Definition of Done da fase

- 10 componentes reutilizáveis;
- registry pesquisável;
- Video Lab funcional;
- 1 importação governada;
- piloto Aula 3.1 validado;
- QA e benchmark registrados;
- phase pack completo;
- auditoria sem blocker material;
- nenhuma publicação/merge inferida sem gate.
