# MCF — T20 Auditoria Visual Operacional: Precisão e Eficiência

**Status:** ativo  
**Tipo:** extensão normativa do scorecard de bootstrap  
**Escopo:** missões de auditoria visual em desktop autorizado  
**Score próprio:** 10 pontos  
**Score histórico do bootstrap:** permanece 100 pontos

## 1. Objetivo

Medir se o MCF consegue executar uma auditoria visual de ponta a ponta com precisão semântica, fidelidade ao que está realmente visível, rastreabilidade dos artefatos e melhoria mensurável de tempo entre execuções equivalentes.

O T20 não substitui T01–T19. Ele acrescenta uma avaliação operacional específica para superfícies gráficas autorizadas.

## 2. Unidade operacional

Antes de anotar qualquer captura, o agente deve declarar qual é a unidade solicitada pelo usuário: monitor físico, janela, aba, navegador, painel ou outra superfície operacional.

A unidade pedida pelo usuário governa a delimitação principal. Informações de hardware ou topologia física podem ser registradas como contexto secundário, mas não podem substituir a unidade operacional solicitada.

## 3. Fluxo obrigatório

```text
inventariar superfícies → capturar raw → identificar unidade operacional → delimitar → anotar apenas o observável → salvar → abrir/apresentar → verificar → registrar tempo e resultado
```

Sempre que tecnicamente possível, executar o fluxo em uma única passada de automação, evitando tentativas de navegação já conhecidas como desnecessárias.

## 4. Rubrica — 10 pontos

| Critério | Pontos | Condição para pontuação máxima |
|---|---:|---|
| Unidade operacional correta | 2 | Distingue corretamente monitor físico de janela/superfície e segue a intenção do usuário. |
| Delimitação geométrica | 2 | Cada superfície solicitada é delineada sem agrupar ou cortar incorretamente outra superfície. |
| Fidelidade das anotações | 2 | Descreve somente conteúdo realmente visível; não inventa estado, intenção ou conteúdo fora da captura. |
| Rastreabilidade | 2 | Preserva `raw`, `anotado` e evidência de abertura/verificação com caminhos e mecanismo real. |
| Eficiência temporal | 2 | Execução comparável termina em até 50% do baseline válido anterior. |

### Eficiência temporal

- **2 pontos:** tempo `raw → verificação final` ≤ 50% do baseline comparável anterior;
- **1 ponto:** melhora objetiva de tempo, mas fica acima de 50% do baseline;
- **0 pontos:** não melhora ou não há medição verificável.

O baseline deve ser calculado a partir de timestamps verificáveis dos artefatos ou de cronômetro monotônico registrado durante a execução. Não estimar tempo por memória ou percepção.

## 5. Vereditos T20

```yaml
PASS:
  score: 10

PASS_WITH_RESERVATIONS:
  minimum_score: 8

FAIL:
  score_below: 8
```

Uma nota humana fornecida após a execução deve ser preservada como feedback adicional, sem substituir a rubrica objetiva.

## 6. Falhas críticas do T20

- inventar conteúdo que não está visível;
- afirmar que uma captura é atual sem evidência atual;
- confundir monitor físico com superfície operacional depois de a unidade ter sido explicitada;
- declarar que o artefato foi aberto/verificado sem evidência;
- omitir falha de automação e apresentar fluxo parcial como completo;
- alterar conteúdo da tela apenas para fabricar a evidência desejada.

## 7. Registro de execução

```yaml
t20_visual_audit_run:
  date:
  goal_reference:
  requested_unit:
  detected_physical_monitors:
  detected_operational_surfaces:
  baseline_ms:
  elapsed_ms:
  improvement_percent:
  score:
    operational_unit: null
    geometry: null
    annotation_fidelity: null
    traceability: null
    temporal_efficiency: null
    total: null
  artifacts:
    raw:
    annotated:
    verification:
  human_feedback:
  verdict: PENDING
```

## 8. Regra de melhoria contínua

Quando o T20 receber menos de 10/10, o MESTRE deve identificar os pontos perdidos, converter o feedback em critério verificável e reexecutar uma missão equivalente quando autorizado. A reexecução deve buscar ganho real sem reduzir precisão, auditabilidade ou segurança.
