# MCF-DEC-065 — Controle Humano Imediato, Copresença Visível e GUI Autorizada

```yaml
decision_id: MCF-DEC-065
status: APPROVED_FOR_V1_2_0
date: 2026-08-27
authority_human: Leandro
authority_operational: Leo
coordinator: Mestre
scope:
  - mcf_agent_orchestration
  - authorized_local_gui_surfaces
  - visible_execution
  - human_control_gate
```

## 1. Evidência que originou a decisão

Durante a estabilização do DSH local, Leandro solicitou trabalho visível e auditável. O Mestre abriu terminais de auditoria/status e passou a distinguir explicitamente execução via SentinelX daquilo que o humano via na GUI.

Leandro então emitiu `humano no controle` como teste deliberado. O Mestre interrompeu a missão, preservou o estado, marcou o próximo passo como `HUMAN_GATE` e aguardou nova instrução. Leandro confirmou que essa interrupção era exatamente o comportamento planejado.

Na mesma sessão, uma superfície ChatGPT em modo app foi organizada junto ao terminal de auditoria. Sob autorização explícita, o Mestre controlou a janela por automação: primeiro digitou `hello word` sem enviar; depois repetiu e enviou. A mensagem apareceu como novo turno no próprio chat, fechando o round-trip operacional.

## 2. Decisão

O MCF v1.2.0 oficializa dois invariantes complementares:

1. **HUMAN CONTROL** — a autoridade humana pode suspender imediatamente novas ações;
2. **VISIBLE COPRESENCE** — quando solicitado e tecnicamente disponível, a execução deve ser acompanhável por superfícies reais de GUI/terminal/log, sem transformar Leandro em operador técnico.

```text
HUMANO NO CONTROLE
→ SUSPENDER NOVAS AÇÕES
→ PRESERVAR ESTADO E EFEITOS CONCLUÍDOS
→ INTERROMPER O QUE ESTIVER EM CURSO APENAS NO PONTO SEGURO
→ REGISTRAR CHECKPOINT
→ HUMAN_GATE
→ RETOMAR SOMENTE POR ORDEM EXPLÍCITA DE LEANDRO
```

## 3. Semântica do gate

O comando canônico é `HUMANO NO CONTROLE`. Para reconhecimento, usar `trim`, colapso de whitespace e comparação case-insensitive quando a mensagem for um comando independente de Leandro.

Citações em documentação, código, logs ou narrativa não viram gate automaticamente. Terceiros não adquirem a prerrogativa por repetir a frase.

O gate prevalece sobre TEAM_FIRST, standing authorization, plano já aprovado e próxima ação já preparada.

## 4. Copresença e GUI autorizada

Quando a GUI estiver disponível e coberta por autorização humana:

- o Mestre pode operar a interface por ferramenta/automação aprovada;
- a ação deve ser verificável na superfície ou por receipt/log correspondente;
- terminal/log visível deve ser preferido quando Leandro pedir auditoria;
- o mecanismo real deve ser nomeado quando relevante;
- é proibido afirmar ação manual ou percepção visual que não ocorreu;
- `HUMANO NO CONTROLE` suspende também clique, digitação e envio futuros.

A GUI é uma superfície operacional adicional, não uma exceção à governança.

## 5. Privacidade e segurança

Visibilidade nunca autoriza exposição de:

- senha;
- token;
- API key;
- cookie de sessão;
- segredo de provider;
- dado sensível não necessário.

A prova preferida é `configured=true`, status, hash, receipt, HTTP code, evento ou efeito observado — não o valor secreto.

## 6. Verdade operacional

O MCF distingue:

```text
AÇÃO REAL NA GUI
!=
AÇÃO MANUAL HUMANA
!=
PERCEPÇÃO VISUAL DO MODELO
```

Se `SentinelX`, `xdotool`, script ou conector executou a interação, essa é a descrição correta. O efeito pode ser visualmente auditável pelo humano sem que o Mestre alegue uma modalidade que não possui.

## 7. Limite do MissionRuntime de referência

Esta decisão governa o comportamento dos agentes e superfícies operacionais do MCF. O `MissionRuntime` da aplicação de referência possui HDF executável e a v1.2.0 adiciona um primitive testável de reconhecimento/checkpoint (`human-control-policy.ts`), mas na data desta decisão **não possui uma API genérica persistente de pause/resume acionada por mensagem textual humana**.

Portanto a v1.2.0 não deve afirmar enforcement universal do gate dentro de qualquer processo já em voo no runtime de referência. Essa capacidade requer design e implementação próprios antes de ser declarada `IMPLEMENTED`.

## 8. Testes obrigatórios

- `project-instructions/MCF-HDF-TESTS.md` T09–T12;
- `project-instructions/MCF-VISIBLE-EXECUTION-GUI-TESTS.md` V01–V08;
- validação de campo versionada;
- `git diff --check` e validações documentais;
- suite do repositório sem regressão antes da publicação.

## 9. SemVer

A combinação de um gate operacional explicitamente reconhecido e uma superfície de execução GUI autorizada/visível constitui capacidade nova retrocompatível. O marco recomendado é **v1.2.0**.

## 10. Autoridade de publicação

Leandro autorizou nesta missão a oficialização na `main` e o versionamento/release após validação. A publicação permanece condicionada à evidência verde da candidata exata e à ausência de achado crítico/alto bloqueante.
