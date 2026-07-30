# Loop Orientado a Objetivo

**Versão:** 0.1-remediação  
**Classificação:** REGRA NORMATIVA  
**Objetivo:** LEA-274  
**Remediação:** GitHub #10  
**PR:** #1

## 1. Finalidade

Definir o ciclo contínuo pelo qual um objetivo é iniciado, executado, revisado, remediado e liberado sem depender de sequência informal de mensagens.

## 2. Unidade de controle

A unidade de controle é o objetivo verificável, não a conversa. Todo objetivo deve possuir:

- identificador;
- resultado esperado;
- estado;
- responsável operacional;
- critérios de aceite;
- artefatos esperados;
- evidências;
- dependências;
- autoridade de aprovação;
- próximo estado previsto.

## 3. Ciclo padrão

1. **Definir:** registrar objetivo, escopo, critérios, responsável e evidências.
2. **Preparar:** resolver dependências e confirmar WIP.
3. **Executar:** produzir o artefato na fonte de verdade adequada.
4. **Entregar:** registrar caminho, versão, commit e vínculo.
5. **Revisar:** verificar critérios, coerência, riscos e suficiência.
6. **Remediar:** corrigir não conformidades e devolver para reteste.
7. **Reconciliar:** alinhar GitHub, Linear e decisões registradas.
8. **Liberar:** publicar somente quando todos os gates estiverem satisfeitos.
9. **Aprender:** registrar achados e mudanças propostas sem reabrir silenciosamente o escopo.

## 4. Continuidade automática

Ao concluir uma etapa, Léo deve verificar imediatamente:

- existe próximo estado definido?
- há autorização vigente?
- há capacidade dentro do WIP?
- existe bloqueio registrado?
- o agente receptor está definido?

Quando as respostas forem favoráveis, a próxima etapa inicia sem solicitar nova confirmação conversacional.

## 5. Pontos legítimos de parada

O loop somente pode parar quando:

1. há `BLOCKED` com causa e condição de desbloqueio;
2. uma decisão de Leandro é indispensável e não foi previamente delegada;
3. surgiu risco crítico novo;
4. há conflito entre fontes de verdade;
5. o trabalho alcançou estado terminal;
6. houve cancelamento ou substituição formal.

Relatórios, resumos e mensagens de checkpoint não constituem pontos de parada.

## 6. Execução paralela

Agentes podem trabalhar na mesma etapa quando:

- os artefatos são distintos;
- as fronteiras de responsabilidade estão registradas;
- não há escrita concorrente no mesmo arquivo;
- a consolidação possui responsável definido;
- todos permanecem vinculados ao mesmo loop estrutural ativo.

## 7. Revisão e reteste

O autor não pode ser o único validador de uma entrega de alto impacto. Emily verifica suficiência de evidências e não conformidades. Sofia verifica coerência arquitetural quando aplicável. Carmem verifica consistência documental. Gabriel verifica integridade de versionamento e publicação.

## 8. Remediação

Cada não conformidade deve possuir:

- identificador;
- gravidade;
- artefato afetado;
- correção esperada;
- responsável;
- evidência de correção;
- revisor;
- resultado do reteste.

## 9. Fechamento

O loop só encerra quando o estado final, as evidências e a decisão estão reconciliados em todas as fontes oficiais. Uma auditoria concluída pode encerrar um loop de auditoria sem liberar o produto auditado.

## 10. Aplicação atual

A auditoria v0.1 encerrou como `PASS_AUDITED`. O objetivo LEA-274 permanece ativo e o loop corrente é a remediação registrada na issue GitHub #10. A autorização `DF-008` elimina a necessidade de nova aprovação humana ao final, desde que todos os gates objetivos sejam satisfeitos.
