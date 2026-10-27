# MCF — Mecanismo A: Subagentes nativos verificáveis

**Estado:** protocolo operacional; fonte: Issue #478; autoridade humana: LEANDRO; orquestração: MESTRE.  
**Escopo:** todas as missões em interfaces ChatGPT que realmente exponham a capacidade nativa de delegação. Este protocolo não instala, cria nem garante capacidades indisponíveis.

## 1. Regra de ativação

O MESTRE deve fazer capability discovery na própria atividade e verificar que a interface oferece criação e acompanhamento de subagentes. Se a capacidade estiver disponível, pode convocar subagentes nativos reais, atribuindo uma entrega concreta a cada contrato MCF. Somente a resposta confirmada de convocação, seguida de identificador verificável e estado contemporâneo, permite afirmar **AGENTE_ATIVO**.

**Nunca** confundir: (a) subagente nativo delegado nesta atividade, (b) persona escrita no prompt, (c) processo externo `codex exec`/worktree, (d) pane ou conversa do MCF Dual Browser Cockpit, (e) bot GitHub. Uma tabela de nomes não prova execução. Se a ferramenta não estiver disponível, registrar `AGUARDANDO_EXECUTOR_NATIVO`, mantendo missão/etapa recuperáveis; não inventar spawns ou estados.

## 2. Procedimento para todo MESTRE — leitura a frio

1. Recuperar Issue, PRs, SHAs, contratos em `docs/agentes/`, checkpoint e protocolo operacional vigente; consultar GitHub live para estado volátil.
2. Verificar exposição real de ferramentas de delegação nativa da atividade. Conforme a superfície, podem existir `spawn_agent`, `list_agents`, `send_message`, `followup_task` e `wait_agent` **ou equivalentes disponibilizados**. São nomes de capacidades, não comandos universais garantidos.
3. Selecionar agentes por competência, risco, isolamento e resultados esperados. Reservar auditoria independente (EMILY) e gate (LÉO); LEANDRO permanece autoridade final.
4. Convocar por ferramenta nativa com missão, etapa, papel, contrato, entrada, escopo, proibições, orçamento/tempo, saída exigida, branch/artefato e critério de aceite. Registrar resultado real, identificador e status.
5. Consultar estados reais; distinguir `requested`, `running`, `completed`, `failed` e `unknown`. Nenhum retorno anterior comprova atividade atual. Registrar ações/entregas por agente na ordem ESEV.
6. Para delegações paralelas, definir isolamento de arquivos/branches, dependências e handoffs. O MESTRE orquestra, não implementa nem aprova tecnicamente seu próprio trabalho.
7. Receber resultados concretos; verificar artefatos/commits/CI. Falhas seguem CAF; ausência de evidência significa NÃO REALIZADO. Retomar ou reatribuir sem afrouxar os gates.
8. EMILY audita independentemente o SHA candidato; LÉO decide gate interno com justificativa e evidências; LEANDRO mantém decisões reservadas. Merge e produção são gates diferentes.
9. Preservar checkpoint persistente no GitHub/ledger MCF para o próximo chat. Subagentes de outra conversa **não são assumidos vivos**; reavaliar disponibilidade e estado.

## 3. Recibo mínimo da delegação

```yaml
mechanism: NATIVE_SUBAGENT_A
mission_id:
phase_id:
agent_contract:
surface:
native_tool:
invocation_reference:
agent_id_or_task_path:
invocation_status: requested|running|completed|failed|unknown
scope:
isolation_boundary:
inputs: []
prohibitions: []
expected_output:
actual_outputs: []
github_evidence: []
tool_result_reference:
handoff_to:
independent_review:
gate:
checkpoint:
```

Nunca registrar segredos, conteúdo médico real ou raciocínio privado. Referências de execução não devem ser reconstruídas artificialmente.

## 4. Aceite e teste de conformidade

- Caso positivo: capacidade nativa exposta, convocação real com ID, inspeção de estado, resultado verificável e handoff registrado.
- Negativo: apenas nome/persona → NÃO ATIVO.
- Negativo: Codex CLI/worktree/pane Cockpit → NÃO NATIVO, mesmo com testes aprovados.
- Negativo: quota/ausência/erro de ferramenta → FALHA registrada e `AGUARDANDO_EXECUTOR_NATIVO`; zero entregas atribuídas.
- Retomada em novo chat: recuperar GitHub, verificar capacidades novamente e não reutilizar presença passada.
- Alteração clínica, produção, credenciais e merges protegidos continuam sujeitos a gates e às autoridades preexistentes.

## 5. Evidência inaugural e limites

A Issue #478 e a missão Vital Família F02 ([Issue #2](https://github.com/leon337/vital-familia-pwa/issues/2)) registram convocação e handoff por subagentes nativos nesta atividade. Isso **não** comprova que toda futura conversa disponha dessa capacidade nem autentica um processo externo como subagente. O mecanismo é um modo de execução dentro do protocolo MCF, não um runtime concorrente, e segue ESEV, CAF, PRF, HDF, STOP e `MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`.

**Gate documental:** o aceite da Issue #478 ocorre exclusivamente quando a documentação e as referências forem integradas e verificadas na `main` do MCF, por PR sujeito a ruleset e revisão. Publicar documentação não autoriza deploy de produção.
