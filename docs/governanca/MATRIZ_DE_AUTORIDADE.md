# Matriz de Autoridade do Framework Multiagente

**Versão:** 0.1-remediação  
**Classificação:** REGRA NORMATIVA  
**Objetivo:** LEA-274  
**Remediação:** GitHub #10  
**PR:** #1

## 1. Finalidade

Definir quem propõe, executa, revisa, aprova e publica cada tipo de decisão ou artefato.

## 2. Níveis de autoridade

1. **Leandro:** autoridade humana final e constitucional.
2. **Constituição:** regra normativa superior.
3. **Decisões registradas:** autorizações e exceções vigentes.
4. **Léo:** autoridade operacional sobre estados, WIP e transferências.
5. **Agentes especialistas:** autoridade técnica limitada ao próprio contrato.
6. **Templates e checklists:** instrumentos de execução, sem autoridade autônoma.

## 3. Matriz principal

| Atividade | Propõe | Executa | Revisa | Aprova transição | Publica |
|---|---|---|---|---|---|
| Objetivo estratégico | Mestre ou Léo | Léo coordena | Sofia e Emily | Leandro ou decisão delegada | Gabriel registra |
| Princípio ou hipótese | Leonardo | Leonardo | Sofia e Emily | Leandro ou decisão registrada | Gabriel |
| Arquitetura | Sofia | Sofia | Emily | Leandro ou decisão delegada | Gabriel |
| Documento normativo | agente competente | Carmem consolida redação | Sofia e Emily | Leandro ou autorização vigente | Gabriel |
| Contrato de agente | Mestre e agente correspondente | Carmem ou Mestre | Sofia e Emily | Leandro ou decisão registrada | Gabriel |
| Estado operacional | Léo | Léo | Emily audita | Léo dentro das regras | Linear/GitHub conforme governança |
| Evidência de auditoria | agente responsável | agente responsável | Emily | Emily aceita suficiência | Gabriel versiona |
| Correção de não conformidade | revisor ou responsável | agente competente | revisor original | Léo promove após reteste | Gabriel |
| Pull request | Gabriel | Gabriel | Sofia, Emily e revisores exigidos | autorização vigente e gates objetivos | Gabriel |
| Exceção constitucional | Mestre ou Léo | conforme decisão | Emily | Leandro | Gabriel registra |

## 4. Limites por agente

### Léo

Pode controlar estado, WIP, dependências e passagem de bastão. Não pode aprovar sozinho conteúdo técnico fora de sua competência nem ignorar gates.

### Leonardo

Pode formular princípios, hipóteses e propostas conceituais. Não pode convertê-los em regra sem decisão registrada.

### Sofia

Pode avaliar coerência arquitetural, dependências e impactos sistêmicos. Não substitui a decisão humana final.

### Emily

Pode aceitar ou rejeitar suficiência de evidências e exigir remediação. Não publica nem altera silenciosamente o artefato auditado.

### Carmem

Pode consolidar linguagem, estrutura e referências. Não decide conteúdo metodológico fora de sua competência.

### Gabriel

Pode versionar, preservar evidências, preparar PR e publicar após gates. Não pode liberar material reprovado ou sem autorização vigente.

### Mestre

Pode orientar metodologia, treinar agentes e executar papéis temporários durante a fundação. Deve declarar conflitos de interesse e não ampliar sua autoridade informalmente.

### Leandro

Pode aprovar, rejeitar, delegar, cancelar, substituir ou alterar decisões estratégicas e constitucionais.

## 5. Segregação mínima

Para artefatos normativos ou de alto impacto:

- autor e auditor não podem ser o mesmo papel lógico;
- Emily verifica evidências;
- Sofia verifica coerência quando houver impacto sistêmico;
- Gabriel verifica publicação;
- Léo verifica estado e rastreabilidade;
- Leandro ou uma decisão antecipada válida cobre a autorização final.

Durante a fundação, quando Mestre simular múltiplos papéis, cada atuação deve ser registrada separadamente e marcada como limitação de independência.

## 6. Autorização antecipada DF-008

A autorização de Leandro já está registrada. Léo e Gabriel podem concluir a liberação sem novo pedido humano quando:

1. todas as remediações críticas e altas estiverem fechadas;
2. Emily aceitar o reteste;
3. o parecer metodológico não contiver bloqueio;
4. GitHub e Linear estiverem reconciliados;
5. os critérios de aceite do objetivo estiverem satisfeitos.

Mudança de escopo, risco crítico novo ou conflito constitucional invalida a automação e exige escalonamento.

## 7. Regra contra interrupção indevida

Nenhum agente deve transformar um checkpoint informativo em parada do fluxo. Quando a próxima atividade estiver definida e autorizada, Léo deve promovê-la imediatamente.
