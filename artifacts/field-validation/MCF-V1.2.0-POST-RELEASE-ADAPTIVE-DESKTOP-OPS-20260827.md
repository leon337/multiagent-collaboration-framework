# MCF v1.2.0 — Post-release Field Validation: Adaptive Desktop Operations

```yaml
artifact: MCF_V1_2_0_POST_RELEASE_ADAPTIVE_DESKTOP_FIELD_VALIDATION
status: FIELD_EVIDENCE
validated_date: 2026-08-27
authority_human: Leandro
coordinator: Mestre
baseline_release: v1.2.0
new_release_claimed: false
```

## Objetivo

Preservar como evidência de campo o comportamento adaptativo observado durante operações autorizadas no notebook, sem convertê-lo prematuramente em nova capacidade de release.

## F01 — configuração iterativa de displays

A automação inspecionou conectores e modos com `xrandr`, testou diferentes modos em HDMI/VGA, verificou o estado depois de cada alteração e restaurou configurações quando um teste piorou a saída.

O estado final registrado manteve o notebook (`LVDS-1`) como primary e o monitor HDMI como superfície secundária estendida.

**Classificação:** PASS como evidência de execução iterativa/reversível; não é prova isolada de AGDO normativa.

## F02 — correção de superfície XFCE

Após identificar que o painel XFCE não estava vinculado ao monitor desejado, a automação descobriu o ambiente DBus da sessão e definiu `/panels/panel-1/output-name = LVDS-1`. O estado foi relido depois da alteração.

**Classificação:** PASS para inspect → act → verify.

## F03 — ajuste visual incremental

O monitor HDMI recebeu ajustes digitais graduais de brilho/gamma. Cada alteração foi seguida por leitura de `xrandr --verbose`, permitindo comparar efeito e evitar uma alteração única irreversível.

**Classificação:** PASS para mudança incremental verificável.

## F04 — falha real de áudio e adaptação

A primeira tentativa de `pactl` retornou:

```text
Connection failure: Connection refused
pa_context_connect() failed: Connection refused
```

Em vez de declarar falha do áudio, a execução inspecionou a sessão do usuário, encontrou `/run/user/1000/pulse/native`, repetiu a operação com `PULSE_SERVER` explícito e verificou volume e mute. O volume foi confirmado em 40% e depois ajustado em novos passos conforme solicitado.

**Classificação:** PASS para error → inspect → adapt → verify.

## F05 — movimentação preservativa de navegadores

`wmctrl` identificou três janelas de navegador em posição correspondente ao monitor secundário. Antes da movimentação, o estado de maximização foi removido; depois as três janelas foram reposicionadas para coordenadas da região do notebook.

A leitura posterior confirmou coordenadas `x >= 1920` para Firefox e duas janelas Brave, preservando as janelas e suas sessões em vez de fechá-las.

**Classificação:** PASS para ação de baixo impacto com verificação posterior.

## F06 — verdade sobre mecanismo

As operações foram executadas por comandos/automação X11 e ferramentas de sistema. O MCF não deve descrever esses efeitos como clique humano, digitação manual ou percepção visual humana.

**Classificação:** invariant da v1.2.0 preservado.

## F07 — privacidade

Nenhuma senha, API key, cookie ou token é necessário para comprovar os casos acima. Receipts são estados, códigos, coordenadas e efeitos.

**Classificação:** invariant da v1.2.0 preservado.

## Conclusão

A sessão demonstra um padrão real de adaptação operacional. O padrão é suficientemente relevante para abrir a candidata **Adaptive Governed Desktop Operations**, mas a evidência atual permanece classificada como **FIELD_EVIDENCE** até existir contrato, suíte e qualificação repetida.
