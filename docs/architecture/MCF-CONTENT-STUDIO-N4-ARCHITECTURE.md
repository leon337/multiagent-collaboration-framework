# MCF Content Studio N4 — Arquitetura

**Mission:** `MCF-CONTENT-STUDIO-N4-001`  
**Phase:** `PHASE-CONTENT-STUDIO-N4-FOUNDATION-001`  
**Status:** `PROPOSED_FOR_BRANCH_IMPLEMENTATION`

## 1. Objetivo arquitetural

Criar uma fundação audiovisual modular em que roteiro, pedagogia, visual, movimento e render sejam desacoplados o suficiente para:

- reutilizar componentes em múltiplas aulas;
- testar visualmente antes do master;
- importar componentes externos com governança;
- produzir 9:16 e 16:9 a partir dos mesmos contratos;
- manter Instavar, Remotion e Explain com responsabilidades distintas.

## 2. Fronteiras

```text
FACT PACKET / FONTE REAL
          │
          ▼
      INSTAVAR
storyboard / VideoSpec / preflight editorial
          │
          ▼
   LESSON / SCENE SPEC
          │
          ▼
┌───────────────────────────────┐
│ MCF N4 VIDEO ENGINE           │
│                               │
│ design tokens                 │
│ motion tokens                 │
│ component registry            │
│ template registry             │
│ asset references              │
│ component props               │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
  VIDEO LAB          REMOTION
  @remotion/player   composition/render
  preview/props      master/stills
        │                │
        └───────┬────────┘
                ▼
              QA
                │
       ┌────────┴────────┐
       ▼                 ▼
    MASTER            EXPLAIN
 audiovisual      educational branch
```

Explain não consome automaticamente a composição Remotion; ambos podem nascer da mesma evidência e do mesmo storyboard.

## 3. Localização do MVP

O MVP será isolado em:

`experimentos/mcf-content-studio-n4/`

Motivos:

1. o repositório não possui hoje uma app Remotion canônica;
2. o Content Studio não deve se tornar dependência do runtime da rede social;
3. o experimento precisa poder evoluir ou ser descartado sem regressão de produção;
4. promoção para `apps/` será decisão posterior ao piloto.

## 4. Camadas

### 4.1 Domain contracts

Sem dependência de React:

- `ComponentManifest`
- `TemplateManifest`
- `ImportManifest`
- `AspectRatio`
- `MotionPreset`
- `DesignTokenSet`
- `SceneSpec`

### 4.2 Component Library

React + Remotion:

- FocusConcept
- ProgressiveDiagram
- AnimatedTimeline
- ActiveRecall
- ErrorVsCorrect
- ArchitectureNode
- AnimatedArrow
- ChapterProgress
- BrowserWindow
- TerminalWindow

### 4.3 Registry

Registry estático e versionado no MVP.

Funções:
- listar;
- buscar;
- filtrar;
- resolver componente;
- verificar compatibilidade;
- expor preview defaults;
- registrar origem/licença/status.

Não será banco de dados no MVP.

### 4.4 Video Lab

App de desenvolvimento/validação.

Responsabilidades:
- selecionar componente/template;
- editar propriedades permitidas;
- alternar 9:16/16:9;
- reproduzir via Remotion Player;
- exibir metadados, licença e status;
- mostrar falhas por Error Boundary;
- gerar configuração copiável.

Não edita código-fonte arbitrário.

### 4.5 Render

Remotion Composition é separada do Player.

```text
Player = preview interativo
Composition = entrada canônica de render
```

Ambos recebem a mesma props model.

## 5. Contrato de componente

Todo componente N4 precisa declarar:

- id único;
- versão;
- categoria;
- descrição pedagógica;
- aspect ratios suportados;
- default props;
- propriedades editáveis;
- safe-area behavior;
- reduced-motion behavior;
- duração mínima/recomendada;
- dependências;
- origem;
- licença;
- status.

## 6. Contrato de movimento

Movimento é semântico.

Presets iniciais:

- `reveal`
- `focus`
- `dim-others`
- `connect`
- `progressive-build`
- `recall-pause`
- `compare`
- `camera-soft-zoom`

Cada preset deve ter:

- duração;
- easing/spring;
- intensidade;
- fallback reduced-motion.

Nada deve depender de aleatoriedade não determinística.

## 7. Design tokens

Tokens não codificam uma aula específica.

Famílias:
- typography;
- spacing;
- radius;
- shadow;
- opacity;
- z-index;
- safe-area;
- motion;
- layout.

Cores ficam parametrizáveis por theme.

## 8. Aspect ratio

Dois targets iniciais:

```yaml
portrait:
  width: 1080
  height: 1920
  fps: 30

landscape:
  width: 1920
  height: 1080
  fps: 30
```

Componentes recebem `layoutContext`, não coordenadas absolutas como contrato público.

## 9. Safe areas

Cada componente deve permanecer dentro de um `SafeFrame`.

O engine diferencia:

- content safe area;
- captions area;
- controls/player area;
- bleed/decorative area.

Texto essencial nunca entra em bleed.

## 10. Acessibilidade

Mínimo:

- contraste legível;
- tamanho mínimo configurável;
- sem informação somente por cor;
- `prefers-reduced-motion` no Video Lab;
- `reducedMotion=true` no render para variante acessível;
- foco/teclado no Lab;
- labels dos controles.

## 11. Lifecycle do registry

```text
DISCOVERED
→ REVIEWED
→ ADAPTED
→ APPROVED
→ DEPRECATED
```

Somente `APPROVED` pode ser escolhido automaticamente pela engine para produção.

## 12. Import boundary

Nenhum código externo entra direto na biblioteca.

```text
source
→ license
→ dependency inventory
→ security review
→ performance review
→ adaptation
→ tests
→ preview
→ registry APPROVED
```

Status `DISCOVERED` e `REVIEWED` não autorizam execução em produção.

## 13. Erros

Erros de componente devem ser localizados:

- component id;
- props usadas;
- frame;
- aspect ratio;
- stack sanitizada;
- fallback visual no Lab.

Erro de um componente não deve derrubar toda a galeria.

## 14. Testabilidade

Piramide inicial:

1. schemas/contracts;
2. funções puras de layout/timing;
3. render React estático;
4. stills por componente;
5. smoke do Player;
6. piloto completo.

## 15. Performance budgets iniciais

Metas, não fatos de baseline:

- interação de props no Lab: perceptivelmente imediata;
- preview sem reload integral;
- componente sem rede obrigatória;
- assets locais/cacheáveis;
- zero fetch externo no render canônico;
- nenhum componente terceiro aprovado sem inventário de dependências.

Os budgets serão calibrados no G7.

## 16. Dependências externas

No MVP, dependências permitidas somente quando justificadas.

Core esperado:
- React;
- Remotion;
- @remotion/player;
- TypeScript;
- validação de schema escolhida pelo módulo.

Evitar framework de UI grande no primeiro ciclo.

## 17. Promoção futura

`experimentos/mcf-content-studio-n4` só pode ser promovido a app canônica depois de:

- piloto aprovado;
- QA;
- benchmark;
- auditoria;
- decisão de escala.

## 18. Invariantes

- `CONTENT != PRESENTATION`
- `COMPONENT != TEMPLATE`
- `PLAYER_PREVIEW != MASTER_RENDER`
- `DISCOVERED != APPROVED`
- `IMPORT_SUCCESS != TRUST`
- `ANIMATION != PEDAGOGICAL_VALUE`
- `CI_GREEN != VISUAL_ACCEPTANCE`
