# MCF Content Studio N4 — Component Contract

## ComponentManifest

```ts
type AspectRatio = '9:16' | '16:9';

type RegistryStatus =
  | 'DISCOVERED'
  | 'REVIEWED'
  | 'ADAPTED'
  | 'APPROVED'
  | 'DEPRECATED';

type ComponentCategory =
  | 'concept'
  | 'diagram'
  | 'timeline'
  | 'learning'
  | 'architecture'
  | 'progress'
  | 'ui'
  | 'code'
  | 'media'
  | 'motion';

interface ComponentManifest<Props extends Record<string, unknown>> {
  id: string;
  displayName: string;
  version: string;
  category: ComponentCategory;
  pedagogicalPurpose: string;
  supportedAspects: AspectRatio[];
  defaultProps: Props;
  editableProps: Array<keyof Props>;
  duration: {
    minFrames: number;
    recommendedFrames: number;
  };
  safeArea: 'required' | 'decorative-only';
  reducedMotion: 'supported' | 'not-applicable';
  origin: {
    kind: 'mcf' | 'external';
    source: string;
  };
  license: {
    id: string;
    evidence: string;
  };
  dependencies: string[];
  status: RegistryStatus;
}
```

## Regras

1. `id` é estável e não contém versão.
2. breaking change incrementa major.
3. `defaultProps` precisa produzir preview válido sem asset externo.
4. `editableProps` é allowlist do Video Lab.
5. props arbitrárias não são editáveis automaticamente.
6. componentes devem funcionar sem rede no render canônico.
7. strings essenciais devem possuir estratégia de overflow.
8. `reducedMotion=supported` exige comportamento verificável.
9. componente externo nunca nasce `APPROVED`.
10. manifest não executa código.

## TemplateManifest

Template orquestra componentes; não duplica sua implementação.

```ts
interface TemplateManifest {
  id: string;
  displayName: string;
  version: string;
  purpose: string;
  supportedAspects: AspectRatio[];
  componentIds: string[];
  slots: Array<{
    id: string;
    accepts: ComponentCategory[];
    required: boolean;
  }>;
  status: RegistryStatus;
}
```

## SceneSpec

```ts
interface SceneSpec {
  id: string;
  componentId: string;
  startFrame: number;
  durationInFrames: number;
  props: Record<string, unknown>;
  learningIntent?: 'introduce' | 'explain' | 'compare' | 'recall' | 'summarize';
}
```

## LayoutContext

```ts
interface LayoutContext {
  aspect: AspectRatio;
  width: number;
  height: number;
  fps: number;
  safeInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  reducedMotion: boolean;
}
```

## Regra de composição

```text
SceneSpec
  + ComponentManifest
  + LayoutContext
  + DesignTokens
  = deterministic visual component
```
