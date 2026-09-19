# MCF N4 Design & Motion Tokens

## Princípios

- foco visual único;
- texto curto;
- movimento funcional;
- progressão pedagógica;
- mobile-first para 9:16;
- layout fluido para 16:9;
- sem coordenadas mágicas no contrato público.

## Tokens de layout

```yaml
spacing:
  xs: 8
  sm: 16
  md: 24
  lg: 40
  xl: 64
  xxl: 96

radius:
  sm: 12
  md: 20
  lg: 32

safeArea:
  portrait:
    top: 120
    right: 72
    bottom: 220
    left: 72
  landscape:
    top: 72
    right: 96
    bottom: 96
    left: 96

typeScale:
  portrait:
    display: 72
    h1: 58
    h2: 46
    body: 34
    label: 26
  landscape:
    display: 86
    h1: 68
    h2: 52
    body: 34
    label: 24
```

## Motion presets

### reveal
- entrada curta;
- opacity + translate pequeno;
- sem deslocamento se reduced-motion.

### focus
- realça item ativo;
- outros elementos reduzem ênfase;
- nunca depende somente de cor.

### progressive-build
- revela um bloco por vez;
- preserva itens anteriores em contexto;
- reduz opacidade do conteúdo já explicado.

### connect
- desenha relação entre dois elementos;
- seta/linha só aparece quando a relação é narrada.

### recall-pause
- mostra pergunta;
- reserva janela de reflexão;
- revela resposta depois.

### compare
- dois lados;
- entrada balanceada;
- destaque alternado.

### camera-soft-zoom
- zoom leve de foco;
- desativado em reduced-motion.

## Timing base a 30fps

```yaml
motion:
  micro: 6
  fast: 10
  normal: 16
  deliberate: 24
  recallPause: 45
```

São defaults; sincronização de narração prevalece.
