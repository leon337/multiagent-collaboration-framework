# MCF Agent Lab — Correção de fidelidade visual DSH → celular

**Data:** 23/10/2026
**Missão:** #467 — **PR:** #468 (branch isolada, sem merge).

## Evidência e defeito

O usuário comparou duas capturas da mesma resposta do agente sobre horas de trabalho: no DSH do notebook a mensagem exibia títulos, listas, fórmulas e uma observação em citação, enquanto o Laboratório móvel mostrava literalmente marcadores `###`, `-`, `>` e escapes `R\$`.

A sessão real do DSH estava correta; o erro estava apenas na apresentação do conteúdo no frontend `public/lab.js`.

## Correção

- Renderizador seguro estruturado de Markdown: títulos hierárquicos, parágrafos, listas ordenadas e não ordenadas, citações, blocos de código, negrito, itálico e código inline.
- Expressões matemáticas inline e delimitadas por `\[ ... \]` ou `$$ ... $$` são apresentadas como texto matemático legível, com símbolos e moeda sem barras invertidas. Não há alegação de suporte integral a LaTeX.
- Conteúdo dinâmico do LLM é montado com nós DOM e `textContent`, **sem `innerHTML`**, sem executar tags, eventos ou scripts.
- Estilos responsive sem posições absolutas; hierarquia tipográfica e espaçamentos refinados em `lab.css`.
- Histórico existente permanece armazenado no DSH; renderização refeita na abertura da página, sem modificar conversa nem preset.

## Teste E2E com histórico real

No Brave controlado pelo CDP, a resposta preservada no DSH produziu:

| Verificação | Resultado |
|---|---|
| Conexão ao DSH | Ativa |
| Mensagens recuperadas | 20 |
| Títulos convertidos | 4 |
| Listas convertidas | 3 |
| Citações convertidas | 1 |
| Fórmulas formatadas | 4 |
| Texto de moeda | `R$40,00 × 5 dias = R$200,00` |
| Larguras testadas | 1360, 390 e 320 px |
| Rolagem horizontal | Nenhuma |
| Exceções JS | Zero |
| HTML malicioso simulado | Permaneceu como texto, zero imagens DOM |
| `npm test` | 8/8 |
| `npm run check` | Aprovado |

**Evidências:** [390 px](evidence/agent-lab-rich-format/mobile-390.png), [320 px](evidence/agent-lab-rich-format/mobile-320.png), [QA machine-readable](evidence/agent-lab-rich-format/qa-results.json).

**Limites:** não implementa processamento completo de LaTeX, tabelas Markdown avançadas ou diagramas; o objetivo desta correção é a fidelidade visual dos elementos comprovadamente presentes na resposta real do DSH.

**Estado:** frontend corrigido e ativo no mesmo Tailscale HTTPS privado. Não houve mudança de chaves, rascunho, perfil, histórico, servidor DSH ou configuração de ferramentas. Gate independente do MCF ainda é requisito antes de merge.
