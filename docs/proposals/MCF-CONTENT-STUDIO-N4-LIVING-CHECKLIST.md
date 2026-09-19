# MCF Content Studio N4 — Checklist Vivo da Engine Audiovisual

**Mission:** `MCF-CONTENT-STUDIO-N4-COURSE-SCALE-001`  
**Issue:** #277  
**PR:** #278  
**Validated code head:** `1ebe29ed95f95f87e7c7c7c178b55bb15ec15181`

## Legenda

- **[x] FECHADO** — implementação funcional + evidência.
- **[!] BLOQUEADO EXTERNO** — dependência verificável fora do runtime atual; não é pendência silenciosa.
- Não restam itens `PENDENTE` ou `PARCIAL` na engine dentro do escopo desta missão.

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

## 1 — Templates e componentes

- [x] template e componente separados no modelo;
- [x] registries independentes;
- [x] templates referenciam pools de componentes;
- [x] aula data-driven sem TSX bespoke por aula.

**Estado:** FECHADO.

## 2 — Biblioteca de componentes editáveis

- [x] biblioteca multi-família;
- [x] props editáveis;
- [x] 9:16 e 16:9;
- [x] reduced-motion;
- [x] matriz visual de QA;
- [x] expansão de 35 para **45 componentes aprovados**;
- [x] Comparison, Callout, Tree Diagram, Bar Chart, Video Clip e Sound Cue dedicados.

**Evidência:** registry v0.8.0; Validation #111 PASS.

## 3 — Templates parametrizados

- [x] `TechnicalLessonTemplate`;
- [x] `TechnicalLessonSpec`;
- [x] lesson / chapters / scenes / narration / visuals / theme / assets / timings;
- [x] mesma engine com payloads distintos;
- [x] Scale Proof sem composição bespoke por aula.

**Estado:** FECHADO.

## 4 — Importação governada

- [x] revision pin, licença, dependências, segurança, performance, adaptação e testes;
- [x] prova real RenderComp/BounceInHeadline → `BounceHeadlineN4`;
- [x] catálogo/adapters explícitos para `single-component`, `remotion-project` e `remotion-elements-package`.

**Estado:** FECHADO NO ESCOPO DA MISSÃO.

## 5 — GitHub como catálogo

- [x] registry versionado;
- [x] category, supportedAspects, editableProps, supportsAudioSync, complexity, tags, intents, status, origin/license;
- [x] busca por intenção/metadados.

**Estado:** FECHADO.

## 6 — Adobe Express como fonte visual preferencial

- [x] connector real utilizado;
- [x] design 9:16 real derivado;
- [x] `AdobeExpressBridgeSpec`;
- [x] provenance;
- [x] snapshot intermediário de tokens N4;
- [x] primeira prova Express → target N4 aprovado;
- [x] Figma preservado como OPTIONAL/LEGACY;
- [x] não reivindicar node/token introspection nem pixel-perfect parity.

**Estado:** BRIDGE GOVERNADO FECHADO; paridade pixel-perfect continua explicitamente fora do claim.

## 7 — Asset Library

- [x] schema + registry + busca semântica + authoring;
- [x] **15 assets aprovados** no registry v0.3.0;
- [x] famílias: icon, avatar/personagem, background, texture, mockup, screenshot, logo, diagram, video, sound e music;
- [x] materialização procedural determinística para mídia de teste;
- [x] versionamento, `dedupeKey`, fingerprint `contentHash` e política de substituição;
- [x] provenance/license preservados.

**Estado:** FUNDAÇÃO DE ESCALA FECHADA.

## 8 — Motion Design System

- [x] 12 presets de estilo executáveis: fade, slide, scale, zoom, focus, blur, dim, highlight, reveal, stagger, camera-pan, camera-zoom;
- [x] 7 presets semânticos executáveis: underline, draw-arrow, connector, morph, typewriter, counter, progress;
- [x] **19/19 presets = IMPLEMENTED**;
- [x] decisão semântica automática `focusIntent` para model, relation, sequence, metric e text-entry.

**Estado:** FECHADO.

## 9 — Componentes pedagógicos

- [x] ActiveRecall, Quiz, Definition, ErrorVsCorrect, ProgressiveConcept, BuildArchitecture e Checkpoint;
- [x] fundação LX suficiente para escala controlada;
- [x] novas peças futuras ficam vinculadas a necessidade real de aula, não como blocker aberto.

**Estado:** FECHADO NO ESCOPO.

## 10 — UI real + primitives

- [x] Browser/Terminal/GitHub/VSCode/Chat/Mobile;
- [x] CursorCue e HighlightCue;
- [x] TypingCue;
- [x] ScrollCue;
- [x] SelectionCue;
- [x] ClickCue;
- [x] zoom/focus semântico integrado via `focusIntent`.

**Estado:** FECHADO.

## 11 — Pipeline de aprovação de imports

- [x] inspeção, licença, dependências, segurança, performance, responsividade, adaptação, testes, preview e registry promotion gate;
- [x] APPROVED separado de download/import.

**Estado:** FECHADO.

## 12 — MCF Video Lab / Template Lab

- [x] catálogo, categorias, preview Remotion, 9:16/16:9, reduced-motion, prop editor;
- [x] template inputs, asset picker, motion picker;
- [x] scene list, duração, reorder, replacement;
- [x] JSON export/apply-back;
- [x] browser smoke desktop/mobile.

**Estado:** VIDEO LAB V3 FECHADO.

## 13 — Editor visual direto

- [x] drag no canvas;
- [x] resize;
- [x] rotate;
- [x] snap;
- [x] alinhamento horizontal/vertical;
- [x] nudge fino;
- [x] reset;
- [x] posicionamento visual persistido no `TechnicalLessonSpec`;
- [x] multi-track timeline: scenes, motion, narration e assets;
- [x] boundary de manipulação avançada desta missão fechado com transform + alignment + nudge.

**Estado:** FECHADO NO ESCOPO.

## 14 — Instavar

- [x] boundary e preflight local;
- [x] contrato real `VideoSpec 1.0` verificado via Instavar;
- [x] adapter bidirecional controlado N4 ↔ Instavar para 9:16;
- [x] prova end-to-end `InstavarBridgeProof` renderizada no Scale Proof;
- [x] limitação real documentada: o contrato verificado não expõe 16:9 nativo, portanto não é reivindicado.

**Estado:** FECHADO NO CONTRATO VERIFICADO.

## 15 — Template Registry inteligente

- [x] search por text/component/aspect/status/intent/tag/type/nodes/learning;
- [x] famílias arquiteturais registradas;
- [x] ranking semântico/score com razões de match.

**Estado:** FECHADO.

## 16 — Quatro fases originais

- [x] N4 Component Library;
- [x] Template Registry;
- [x] Video Lab;
- [x] Template Importer.

**Estado:** FECHADO.

## 17 — Resíduos dos chats-fonte

- [x] StickRig SVG/React com joints, poses e actions;
- [x] família de personagens reutilizável: agent / operator / reviewer / human;
- [x] text-fit + tamanho mínimo;
- [x] SFX/music/ambient/narration + ducking reutilizáveis;
- [x] executor FFmpeg genérico de mix;
- [x] presença de stream de áudio + loudness/peak QA;
- [x] fallback TTS local **explícito** com capability doctor + espeak smoke; a voz principal aprovada não é alterada implicitamente;
- [x] Explain como saída educacional paralela; companion do piloto finalizado;
- [x] adapters do ecossistema Remotion/Elements;
- [x] concorrência controlada: workflows cancelam runs obsoletos e matrix QA usa worker pool limitado;
- [!] Canvas Capture/high-fidelity UI capture — **BLOCKED_ENVIRONMENT**: dependência Apple Silicon registrada na própria fonte; não bloqueia Linux/bubble;
- [!] currículo exato das dez aulas — **BLOCKED_SOURCE_DEPENDENCY**, tratado no checklist de course-scale; não é blocker da engine.

## Evidência CI do último head com mudança de runtime

`1ebe29ed95f95f87e7c7c7c178b55bb15ec15181`:

- Documentation validation #1400 — PASS;
- N4 Pilot Render #60 — PASS;
- N4 Scale Proof #53 — PASS, incluindo `InstavarBridgeProof`;
- N4 Audio Review #63 — PASS, incluindo local TTS fallback, asset materialization, mix/ducking, stream de áudio e loudness;
- N4 Validation #111 — PASS, incluindo verify, matriz completa, browser smoke, auditorias, stress stills e benchmark.

**Conclusão:** não há item executável de engine permanecendo como PENDENTE/PARCIAL. Os dois itens [!] são bloqueios externos explícitos e separados.
