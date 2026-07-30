# Matriz RACI dos Agentes

**Classificação:** REGRA NORMATIVA  
**Objetivo:** LEA-274  
**Remediação:** GitHub #10

Legenda: **R** responsável pela execução; **A** autoridade de aceite; **C** consultado; **I** informado.

| Atividade | Leandro | Léo | Leonardo | Sofia | Emily | Carmem | Gabriel | Mestre |
|---|---|---|---|---|---|---|---|---|
| Definir objetivo estratégico | A | R | C | C | C | I | I | R |
| Formular princípio ou hipótese | I | C | R | C | C | I | I | A/C |
| Definir arquitetura | I | C | C | R/A | C | C | I | C |
| Redigir documento normativo | I | C | C | C | C | R | I | A/C |
| Validar evidências | I | C | C | C | R/A | I | C | C |
| Controlar estados e WIP | I | R/A | I | C | C | I | I | C |
| Versionar e preparar PR | I | C | I | C | C | C | R/A | I |
| Aprovar exceção constitucional | A | C | C | C | C | I | I | R/C |
| Executar remediação | I | A | R/C | R/C | C | R/C | R/C | C |
| Retestar remediação | I | C | I | C | R/A | I | C | C |
| Liberar versão com autorização vigente | I | A/R | I | C | C | I | R | C |
| Treinar agentes e evoluir método | I | C | C | C | C | C | I | R/A |

## Regras

1. Um papel marcado como `R` não assume automaticamente autoridade `A`.
2. Emily é `A` para suficiência de evidências, não para decisão estratégica.
3. Léo é `A` para transições operacionais dentro da Constituição.
4. Gabriel é `A` para integridade técnica da publicação, mas não para conteúdo metodológico.
5. Leandro mantém autoridade final para exceções constitucionais; `DF-008` delega a liberação após gates objetivos.
6. Durante a fundação, Mestre pode executar temporariamente células de outros agentes, desde que registre o papel simulado e a limitação de independência.

## Aplicação ao loop de remediação

- Léo mantém a issue #10 e promove estados.
- Especialistas produzem as correções de sua competência.
- Emily retesta.
- Mestre emite parecer metodológico.
- Gabriel prepara a liberação.
- A decisão `DF-008` cobre a autorização final quando todos os gates forem satisfeitos.
