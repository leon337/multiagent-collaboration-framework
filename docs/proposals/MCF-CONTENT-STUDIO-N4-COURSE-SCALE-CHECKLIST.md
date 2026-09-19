# MCF Content Studio N4 Course Scale — Checklist

**Mission:** `MCF-CONTENT-STUDIO-N4-COURSE-SCALE-001`  
**Issue:** #277  
**PR:** #278  
**Validated engine code head:** `1ebe29ed95f95f87e7c7c7c178b55bb15ec15181`

> Checklist-mãe da engine: `docs/proposals/MCF-CONTENT-STUDIO-N4-LIVING-CHECKLIST.md`.

## Regra de resolução

Nesta missão, um item está resolvido quando está:
- **[x] fechado com evidência**, ou
- **[!] bloqueado por dependência real e explicitamente documentada**.

Não há itens silenciosamente pendentes.

## C0 — Curriculum inventory / predecessor recovery

- [x] pesquisar Project sources acessíveis, screenshots de continuidade e linhagem MCF/GitHub;
- [x] LEANDRO identificou o chat predecessor como localização canônica do currículo;
- [x] confirmar piloto: Aula 3.1 / Runtime Agêntico Moderno — Nível 4;
- [x] confirmar escopo: piloto + nove aulas restantes;
- [x] classificar exemplos Runtime / Context Engineering / MCP / Agents / Realtime / Evals como **não canônicos** para ordem/títulos;
- [x] rejeitar `leon337/curso-instavar` como substituição silenciosa;
- [x] executar worker determinístico de esgotamento de fontes: cinco chats/fontes materializados, única numeração encontrada = `Aula 3.1`;
- [x] buscar GitHub por `Aula 3.2`, `Aula 3.3` e `Aula 3.10`: sem inventário canônico encontrado;
- [!] recuperar o transcript integral do predecessor — **BLOCKED_SOURCE_DEPENDENCY**: não está exposto nas fontes/Library acessíveis desta sessão;
- [!] resolver ordem, títulos e objetivos das outras nove aulas — dependem do mesmo transcript, portanto não podem ser inferidos.

**C0 state:** `BLOCKED_SOURCE_DEPENDENCY`.  
**HUMAN_GATE:** não. É dependência de fonte, não pedido de aprovação.

## S0 — Residual source-chat engine improvements

- [x] materializar e reconciliar todos os chats-fonte acessíveis;
- [x] workers determinísticos com receipts;
- [x] StickRig + family variants;
- [x] text-fit/readability;
- [x] encoded-audio fail-closed;
- [x] reusable narration/SFX/music/ambient mix + ducking executor;
- [x] loudness/peak QA;
- [x] local/materializable TTS fallback explícito;
- [x] 19 motion presets executáveis;
- [x] semantic focus composition;
- [x] UI primitives typing/scroll/selection/click;
- [x] editor visual direto + alignment/nudge + multi-track;
- [x] Asset Library ampliada + versionamento/dedupe;
- [x] character family ampliada;
- [x] adapters/catalog externos;
- [x] template semantic ranking;
- [x] Adobe Express Bridge + primeira prova governada;
- [x] integração nativa Instavar VideoSpec 1.0 + render proof;
- [x] Explain companion output do piloto;
- [x] exact code-bearing head CI green em Validation #111, Scale Proof #53, Pilot #60 e Audio Review #63.

**S0 state:** `CLOSED`.

## C1–C6 — Produção por aula

Como o inventário canônico não está disponível, não existe autorização factual para criar nomes, ordem, objetivos ou conteúdo das outras nove aulas.

- [!] content pack — BLOCKED_BY_C0;
- [!] TechnicalLessonSpec — BLOCKED_BY_C0;
- [!] template/component discovery por aula — BLOCKED_BY_C0;
- [!] preflight por aula — BLOCKED_BY_C0;
- [!] narration PT-BR por aula — BLOCKED_BY_C0;
- [!] captions por aula — BLOCKED_BY_C0;
- [!] 9:16 render por aula — BLOCKED_BY_C0;
- [!] mobile QA por aula — BLOCKED_BY_C0;
- [!] Review Lab por aula — BLOCKED_BY_C0;
- [!] factual/content QA por aula — BLOCKED_BY_C0;
- [!] lesson gate das aulas desconhecidas — BLOCKED_BY_C0.

O piloto existente continua sendo evidência da engine, não substituto para as nove aulas cujo currículo não foi recuperado.

## C7 — Course gate

- [!] todas as aulas canônicas reconciliadas — BLOCKED_BY_C0 porque o inventário não está materializado;
- [x] nenhum structural/silent proof é rotulado como aula final;
- [x] bloqueio e condição de retomada documentados;
- [x] auditoria final desta execução registrada;
- [x] merge/deploy/publicação continuam separados e não inferidos.

**C7 result:** `COURSE_SCALE_BLOCKED_SOURCE_DEPENDENCY`.

## Condição automática de retomada

Quando o transcript/fonte canônica do chat predecessor ficar acessível, retomar em C0 e extrair exatamente:
1. ordem;
2. numeração;
3. títulos;
4. objetivos;
5. conteúdo factual por aula.

Somente depois iniciar C1–C6. Nenhum preenchimento por inferência.
