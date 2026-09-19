# MCF Content Studio N4 — Checklist Vivo da Engine Audiovisual

**Mission:** `MCF-CONTENT-STUDIO-N4-COURSE-SCALE-001`  
**Issue:** #277  
**PR:** #278  
**Purpose:** fonte operacional viva para marcar a evolução da visão arquitetural definida por LEANDRO.

## Legenda

- [x] FECHADO — implementação funcional + evidência
- [~] PARCIAL — fundação existe, mas a visão ainda não foi concluída
- [ ] PENDENTE — ainda não implementado
- [!] EXTERNO/BLOQUEADO — depende de alvo ou capacidade externa verificável

## Visão alvo

```text
ROTEIRO
  ↓
ENGINE
  ├─ templates
  ├─ componentes
  ├─ motion presets
  ├─ diagramas
  ├─ personagens
  ├─ assets
  ├─ áudio / FX
  └─ design tokens
       ↓
     VÍDEO
```

## 1 — Templates e componentes são entidades diferentes

- [x] separar template de componente no modelo
- [x] component registry independente
- [x] template registry independente
- [x] templates podem referenciar conjuntos de componentes
- [x] composição de aula não exige um TSX bespoke por aula

**Estado:** FECHADO.

## 2 — Biblioteca de componentes editáveis

- [x] biblioteca multi-família criada
- [x] props editáveis por componente
- [x] suporte 9:16 e 16:9 no núcleo
- [x] reduced-motion onde aplicável
- [x] matriz visual de QA
- [~] ampliar de 35 componentes para biblioteca de escala maior
- [ ] preencher lacunas como Comparison, Callout, Tree, charts, VideoClip e SoundCue dedicados

**Evidência atual:** 35 componentes aprovados no registry v0.6.0.

## 3 — Templates parametrizados

- [x] `TechnicalLessonTemplate`
- [x] `TechnicalLessonSpec`
- [x] lesson / chapters / scenes / narration / visuals / theme / assets / timings
- [x] mesma engine comprovada com payloads distintos
- [x] Scale Proof sem composição bespoke para cada aula

**Estado:** FECHADO.

## 4 — Importação de templates/componentes externos

- [x] importer governado
- [x] pin de revision
- [x] licença
- [x] dependências
- [x] security review
- [x] performance review
- [x] adaptação N4
- [x] testes/preview antes de APPROVED
- [x] importação real: RenderComp/BounceInHeadline → `BounceHeadlineN4`
- [~] ampliar adapters/catalog de fontes externas

**Estado:** MVP FECHADO / ESCALA PARCIAL.

## 5 — GitHub como catálogo de componentes

- [x] `registry/registry.json`
- [x] category
- [x] supportedAspects
- [x] editableProps
- [x] supportsAudioSync
- [x] complexity
- [x] tags
- [x] intents
- [x] status
- [x] origin/license
- [x] busca por intenção/metadados

**Estado:** FECHADO.

## 6 — Design source: Adobe Express no lugar do Figma

**Decisão de missão (LEANDRO):** Adobe Express passa a ser a ferramenta visual preferencial para substituir o Figma no fluxo operacional do Content Studio.

- [x] Adobe Express connector disponível na sessão
- [x] capacidade de buscar designs/templates
- [x] capacidade de preencher texto
- [x] capacidade de substituir imagens
- [x] capacidade de alterar background
- [x] capacidade de animar designs
- [x] capacidade de exportar PDF
- [x] definir `AdobeExpressBridgeSpec` para handoff governado ao N4
- [x] definir snapshot intermediário governado de tokens N4 quando a ferramenta não expuser introspecção
- [x] provar primeiro design Adobe Express → spec intermediário → componente React/Remotion N4
- [x] registrar provenance/evidence do design fonte no bridge spec
- [x] manter Figma Bridge como OPTIONAL/LEGACY após a primeira prova Adobe Express

**Nota técnica:** o connector Adobe Express atual não expõe, de forma verificável, a mesma introspecção estrutural de nós/tokens que o Figma Bridge foi desenhado para consumir. Portanto Adobe Express substitui o **papel de ferramenta visual**, mas ainda precisa de um bridge/handoff intermediário próprio para substituir o Figma **arquiteturalmente** sem perder rastreabilidade.

**Estado:** BRIDGE GOVERNADO IMPLEMENTADO / PARIDADE VISUAL PIXEL-PERFECT NÃO REIVINDICADA.

## 7 — Asset Library

- [x] asset schema
- [x] registry
- [x] busca por metadados/uso
- [x] integração com authoring
- [x] 3 assets aprovados iniciais
- [~] ampliar personagens/ícones/mockups/backgrounds/screenshots/logos
- [ ] biblioteca de vídeo
- [ ] biblioteca de textura
- [ ] biblioteca de sons
- [ ] biblioteca de música
- [ ] políticas de deduplicação/versionamento de assets em escala

**Estado:** PARCIAL.

## 8 — Motion presets

Implementados:
- [x] fade
- [x] slide
- [x] scale
- [x] zoom
- [x] focus
- [x] blur
- [x] dim
- [x] highlight
- [x] reveal
- [x] stagger
- [x] camera-pan
- [x] camera-zoom

Declarados, ainda não executáveis como presets finais:
- [ ] underline
- [ ] draw-arrow
- [ ] connector
- [ ] morph
- [ ] typewriter
- [ ] counter
- [ ] progress

- [~] evoluir decisão semântica `focus: model` → combinação automática de motion/layout

**Estado:** 12 IMPLEMENTADOS / 7 PENDENTES.

## 9 — Componentes pedagógicos

- [x] ActiveRecall
- [x] Quiz
- [x] Definition
- [x] ErrorVsCorrect
- [x] ProgressiveConcept
- [x] BuildArchitecture
- [x] Checkpoint
- [~] expandir componentes LX conforme uso real das aulas

**Estado:** FUNDAÇÃO FECHADA / EXPANSÃO CONTÍNUA.

## 10 — Componentes de UI reais

- [x] BrowserWindow
- [x] TerminalWindow
- [x] GitHubWindow
- [x] VSCodeWindow
- [x] ChatWindow
- [x] MobileWindow
- [x] CursorCue
- [x] HighlightCue
- [ ] typing primitive reutilizável
- [ ] scroll primitive reutilizável
- [ ] selection primitive reutilizável
- [ ] click/mouse primitive reutilizável
- [~] zoom/focus em UI como comportamento semântico

**Estado:** NÚCLEO FECHADO / INTERAÇÕES PARCIAIS.

## 11 — Pipeline de aprovação de imports

- [x] inspeção
- [x] licença
- [x] dependências
- [x] segurança
- [x] performance
- [x] responsividade
- [x] adaptação N4
- [x] testes
- [x] preview
- [x] registry promotion gate
- [x] APPROVED separado de download/import

**Estado:** FECHADO.

## 12 — MCF Video Lab / Template Lab

- [x] catálogo de componentes
- [x] categorias
- [x] preview Remotion
- [x] 9:16 / 16:9
- [x] reduced-motion
- [x] prop editor
- [x] template inputs
- [x] asset picker
- [x] motion picker
- [x] scene list
- [x] timeline visual
- [x] duração por cena
- [x] reorder
- [x] component replacement
- [x] JSON export/apply-back
- [x] browser smoke desktop/mobile

**Estado:** VIDEO LAB V3 FECHADO.

## 13 — Editor visual tipo mini-Canva/Figma/CapCut

Já existe:
- [x] preview
- [x] seleção de componentes
- [x] edição de props
- [x] timeline de cenas
- [x] reorder
- [x] duração
- [x] troca de componente
- [x] JSON round-trip

Ainda falta:
- [ ] drag no canvas
- [ ] resize
- [ ] rotate
- [ ] snap/alignment
- [ ] posicionamento visual direto
- [ ] multi-track timeline
- [ ] manipulação visual avançada

**Estado:** EDITOR ESTRUTURAL FECHADO / EDITOR VISUAL DIRETO PENDENTE.

## 14 — Papel do Instavar

- [x] boundary documentado
- [x] preflight local
- [x] payload neutro
- [x] regras de densidade/variedade/narração/timeline/labels
- [ ] integração nativa com contrato real do Instavar quando disponível
- [ ] prova end-to-end Instavar → N4 → render

**Estado:** PARCIAL.

## 15 — Template Registry inteligente

- [x] `TemplateRegistry.search(...)`
- [x] text
- [x] componentId
- [x] aspect
- [x] status
- [x] intent
- [x] tag
- [x] type
- [x] nodes
- [x] learning
- [x] ProgressiveArchitecture
- [x] LayerStack
- [x] HubAndSpoke
- [x] SequenceFlow
- [x] ControlExecutionSplit
- [~] evoluir seleção para ranking semântico/score quando necessário

**Estado:** FECHADO NA FUNDAÇÃO.

## 16 — Quatro fases originais

- [x] Fase 1 — N4 Component Library
- [x] Fase 2 — Template Registry
- [x] Fase 3 — Video Lab
- [x] Fase 4 — Template Importer

**Estado:** FUNDAÇÃO DAS 4 FASES FECHADA.

---

# Pendências prioritárias atuais

- [ ] recuperar currículo exato do chat predecessor
- [ ] concluir os 7 motion presets ainda DECLARED
- [~] SFX/music/ducking reutilizáveis — contrato e testes implementados; runtime/media registry pendentes
- [ ] ampliar Asset Library
- [ ] ampliar família de personagens a partir do StickRig
- [ ] primitives de UI (typing/scroll/selection/click)
- [x] Adobe Express Bridge + primeira prova governada Express → N4
- [ ] editor visual direto (drag/resize/rotate/snap)
- [ ] integração nativa Instavar
- [ ] Explain companion output por aula quando aplicável

# Regra de atualização

Este arquivo é o checklist operacional vivo da missão.

Ao fechar qualquer ponto:
1. atualizar o checkbox;
2. registrar evidência concreta (arquivo/commit/workflow/artefato);
3. atualizar o checkpoint da fase;
4. não promover PARCIAL para FECHADO sem evidência;
5. não inferir merge, deploy, publicação ou HUMAN_GATE.


## Evidência da onda Adobe Express + áudio

- Adobe Express real: template 9:16 selecionado e documento derivado criado via connector.
- `AdobeExpressBridgeSpec`: implementado com provenance, flags de capacidade e non-claims explícitos.
- primeira prova: Express visual reference → bridge JSON → target `title` aprovado no N4.
- audio mix contract: narration/SFX/music/ambient + gain/fades/ducking + validação determinística.
- runtime genérico de mixagem e biblioteca de mídia permanecem pendentes.
