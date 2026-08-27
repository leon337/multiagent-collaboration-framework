# Protocolo de Sucessão Cross-Chat e Controle de Janelas — MCF

**Classificação:** REGRA NORMATIVA CANDIDATA  
**Estado:** HUMAN_AUTHORIZED_FOR_IMPLEMENTATION — NOT_RELEASED  
**Origem:** `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`  
**Autoridade humana:** LEANDRO  
**Aplicação candidata:** missões de sucessão cross-chat que usem GUI/superfície de janela autorizada

## 1. Finalidade

Separar continuidade lógica de sessão de continuidade visual de superfície e tornar a copresença predecessor/sucessor verificável, sem reescrever retrospectivamente evidências produzidas antes deste invariante existir.

A classificação retrospectiva consolidada da experiência original é:

```text
CROSS_CHAT_SUCCESSION historical result = PASS
GUI/window surface invariant coverage = GAP / NOT TESTED IN ORIGINAL RUN
classification = MAINTAIN_WITH_GAP
```

`MAINTAIN_WITH_GAP` preserva o PASS histórico contra os critérios então vigentes e registra que a dimensão GUI/window não foi testada naquele run.

## 2. Invariante de identidade

Sessão, chat e janela do sistema operacional são identidades diferentes.

```text
SUCCESSOR_SESSION_CREATED != SUCCESSOR_WINDOW_CREATED
OPEN_NEW_CHAT != OPEN_NEW_WINDOW
```

Quando a missão declarar copresença visual predecessor/sucessor no escopo, `OPEN_NEW_CHAT` e `OPEN_NEW_WINDOW` devem ser operações explícitas e observáveis. Criar um novo chat dentro da janela do predecessor não satisfaz o requisito de superfície sucessora distinta.

## 3. Preservação da superfície predecessora

A superfície autorizada do predecessor deve permanecer aberta, identificável e não substituída desde antes do boot do sucessor até que ambas as condições abaixo estejam satisfeitas:

```text
SUCCESSION_EQUIVALENCE = PASS
EXPLICIT_HANDOFF = true
```

O trace deve registrar:

```text
PREDECESSOR_SURFACE_PRESERVED = PASS
```

Fechar, reutilizar, substituir ou destruir a superfície predecessora antes dessas condições constitui falha do gate de copresença, mesmo que a recuperação persistente lógica tenha sido bem-sucedida.

## 4. Fechamento do predecessor é ação separada

`PREDECESSOR_CLOSE` não é efeito implícito do handoff lógico.

Depois de `SUCCESSION_EQUIVALENCE = PASS` e `EXPLICIT_HANDOFF = true`, qualquer fechamento ou substituição do predecessor deve ser tratado como ação governada separadamente e registrado em evidência própria.

O handoff não concede, por si só, autorização para fechar a superfície predecessora.

## 5. Human Control continua soberano

O comando independente `HUMANO NO CONTROLE` mantém precedência suspensiva imediata sobre este protocolo.

Ao receber o gate humano, nenhuma nova ação de abertura, movimentação, tiling, fechamento, boot ou envio deve começar. O estado deve ser preservado/checkpointado e a retomada deve depender de autorização humana explícita.

Este protocolo não cria enforcement universal de runtime onde ele não existe; ele define governança, trace e critérios de aceite.

## 6. Verdade sobre o mecanismo de input

Eventos em níveis diferentes não podem ser descritos como equivalentes sem evidência.

```text
X11_SYNTHETIC_EVENT != DEVICE_LEVEL_INPUT_EVENT
DEVICE_LEVEL_INPUT_EVENT != PHYSICAL_INPUT_EVENT
```

O trace deve identificar o mecanismo real usado:

- `X11_SYNTHETIC_EVENT` — evento sintético injetado na camada X11/aplicação;
- `DEVICE_LEVEL_INPUT_EVENT` — evento emitido por dispositivo virtual ou caminho de dispositivo reconhecido pelo sistema;
- `PHYSICAL_INPUT_EVENT` — entrada produzida por dispositivo físico autorizado.

É proibido afirmar que `xdotool`, evento sintético X11 ou automação de janela foi digitação física/manual. Quando houver device-level input, a evidência deve registrar explicitamente essa camada.

## 7. Posicionamento MONITOR_AWARE

Qualquer helper de posicionamento/tiling deve determinar o monitor que contém a janela alvo e calcular geometria relativa àquele monitor.

```text
MONITOR_AWARE = required
```

O trace deve registrar ao menos:

- identificador do monitor predecessor;
- identificador do monitor sucessor;
- resultado do posicionamento;
- geometria ou referência verificável quando disponível.

Assumir origem única de desktop em ambiente multi-monitor não satisfaz o critério.

## 8. VISUAL_ASSERTION e copresença

A validação de sucessão com GUI deve demonstrar simultaneamente:

```text
PREDECESSOR_SURFACE_PRESERVED = PASS
SUCCESSOR_WINDOW_SURFACE_DISTINCT = PASS
VISUAL_ASSERTION = PASS
SIMULTANEOUS_COPRESENCE_REGRESSION = PASS
```

A assertion deve estar vinculada a identificadores de sessão e de superfície, e não apenas a títulos de chat potencialmente reutilizáveis.

## 9. Trace mínimo obrigatório

A estrutura machine-readable candidata é `mcf_gui_window_succession_trace/v1`, formalizada em:

`schemas/mcf-gui-window-succession-trace-v1.schema.json`

Campos mínimos:

```yaml
trace_version:
mission_id:
classification:
predecessor:
  session_id:
  window_surface_id:
  surface_preserved_through_equivalence_and_handoff:
successor:
  session_id:
  window_surface_id:
handoff:
  successor_equivalence:
  explicit_handoff:
  predecessor_close_governed_separately:
window_control:
  open_new_window:
  open_new_chat:
  visual_assertion_two_windows:
  monitor_aware_placement:
  predecessor_monitor_id:
  successor_monitor_id:
input_evidence:
  mechanism:
  claimed_equivalent_to_physical_input:
  shortcut:
  observed_effect:
observability:
  shortcut_execution_logged:
  simultaneous_copresence_regression:
  evidence_refs: []
```

O JSON Schema valida estrutura; o qualificador MCF valida relações que o schema padrão não expressa diretamente, como desigualdade entre IDs predecessor/sucessor.

## 10. Sequência candidata de execução

```text
CHECKPOINT_PREDECESSOR
→ OPEN_NEW_WINDOW
→ OPEN_NEW_CHAT
→ IDENTIFY_SUCCESSOR_SESSION
→ IDENTIFY_SUCCESSOR_WINDOW_SURFACE
→ PLACE_WINDOWS_MONITOR_AWARE
→ VISUAL_ASSERTION
→ BOOT_SUCCESSOR
→ COLD_RECOVERY
→ SUCCESSION_EQUIVALENCE
→ EXPLICIT_HANDOFF
→ OPTIONAL_SEPARATELY_GOVERNED_PREDECESSOR_CLOSE
```

Durante todo o intervalo anterior ao `EXPLICIT_HANDOFF`, `PREDECESSOR_SURFACE_PRESERVED` deve permanecer `PASS`.

## 11. Semântica de falha e classificação

Para runs executados depois da adoção deste invariante:

- recuperação lógica/persistente pode ser avaliada separadamente;
- copresença GUI não recebe PASS se a superfície predecessora foi substituída, se a superfície sucessora não for distinta ou se a assertion não estiver evidenciada;
- mecanismo de input não documentado ou descrito incorretamente é não conformidade de evidência;
- monitor placement sem identificação do monitor é cobertura insuficiente.

A experiência histórica que originou este protocolo permanece `MAINTAIN_WITH_GAP`; esta regra não altera retrospectivamente o contrato de aceite daquele run.

## 12. Regressões obrigatórias candidatas

1. novo chat na mesma janela deve ser rejeitado como prova de janela sucessora distinta;
2. mesma `window_surface_id` para predecessor e sucessor deve falhar;
3. predecessor não preservado até equivalência+handoff deve falhar;
4. `X11_SYNTHETIC_EVENT` alegado como equivalente a input físico deve falhar;
5. ausência de monitor IDs/placement deve falhar;
6. duas superfícies distintas + preservação + equivalência + handoff + trace observável deve passar;
7. teste de copresença simultânea deve passar antes de um eventual fechamento governado do predecessor.

## 13. Limites de governança desta candidata

A existência deste documento em branch candidata não implica publicação.

```text
PROTOCOL_RULE_OFFICIAL = NO_UNTIL_MERGED_UNDER_FUTURE_GATE
MAIN_MUTATION = NONE
MERGE = NOT_AUTHORIZED_BY_FORMALIZATION_GATE
TAG = NOT_AUTHORIZED
RELEASE = NOT_AUTHORIZED
VERSION_NUMBER = NOT_DECIDED
```

Qualificação técnica e auditoria devem ocorrer antes de qualquer novo HUMAN_GATE relacionado a merge, tag, versão ou release.
