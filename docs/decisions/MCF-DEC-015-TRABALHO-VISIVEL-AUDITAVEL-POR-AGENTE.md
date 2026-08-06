# MCF-DEC-015 — Trabalho Visível e Auditável por Agente

**Estado:** APROVADA PELA AUTORIDADE HUMANA  
**Autoridade:** Léo  
**Data:** 2 de agosto de 2026  
**Escopo:** todas as missões operacionais do Multiagent Collaboration Framework

## 1. Decisão

O trabalho dos agentes não pode ser silencioso.

Todo agente selecionado para uma missão deve produzir conteúdo visível e auditável que demonstre a atividade efetivamente executada.

Um agente não pode ser apresentado como participante quando não realizou ação verificável.

## 2. Contrato obrigatório por agente

Cada agente participante deve apresentar, na mesma resposta operacional:

```yaml
entrada_recebida:
consulta_ou_acao:
evidencia_obtida:
analise:
decisao:
entrega:
passagem_interna:
```

Os campos devem refletir trabalho real e não podem ser preenchidos com frases genéricas apenas para aparentar participação.

## 3. Evidências aceitas

A evidência pode ser:

- arquivo criado ou atualizado;
- commit ou SHA;
- pull request, issue, review ou comentário;
- resultado de ferramenta;
- consulta de banco;
- migração aplicada;
- execução de teste ou CI;
- log de runtime ou build;
- parecer técnico assinado pelo agente;
- decisão documentada;
- captura fornecida pelo usuário;
- comparação objetiva entre estado anterior e posterior.

Quando a evidência possuir identificador, ele deve ser informado.

## 4. Proibição de participação fictícia

É proibido:

- listar agente que não executou atividade;
- atribuir pesquisa que não foi realizada;
- afirmar que houve revisão sem parecer verificável;
- declarar teste sem execução ou resultado;
- dizer que algo foi publicado, criado ou configurado sem evidência;
- usar uma passagem de bastão para encerrar antes de mostrar o próximo agente já autorizado.

## 5. Execução em uma única resposta

As passagens entre agentes são transições internas.

Quando o trabalho já estiver autorizado, o Mestre deve continuar na mesma resposta até ocorrer:

- conclusão do ciclo;
- bloqueio externo real;
- novo gate humano indispensável.

## 6. Papel do Mestre

O Mestre deve:

1. abrir o contrato da missão;
2. selecionar agentes por competência;
3. exigir o contrato de evidência de cada participante;
4. apresentar os agentes em sequência;
5. verificar se a evidência corresponde à atividade declarada;
6. impedir crédito a agentes sem ação real;
7. consolidar estado, pendências e próximo responsável;
8. entregar links, caminhos, commits e resultados relevantes.

## 7. Privacidade, segurança e limites

Visibilidade não autoriza exposição de:

- senhas;
- tokens secretos;
- chaves administrativas;
- dados pessoais sensíveis;
- conteúdo privado de terceiros;
- raciocínio interno protegido.

Nesses casos, a evidência deve ser apresentada de forma redigida ou resumida, preservando identificadores não sensíveis e o resultado verificável.

Chaves explicitamente publicáveis podem ser usadas pelo sistema, mas não precisam ser repetidas na mensagem.

## 8. Mensagens simples

Em mensagens simples sem missão operacional, pode ser usado registro reduzido.

Em mensagens operacionais, o contrato completo é obrigatório para cada agente selecionado.

## 9. Critérios de conformidade

Uma resposta está conforme quando:

- todos os agentes listados executaram atividade real;
- cada atividade possui evidência;
- a sequência de passagem foi concluída na mesma resposta;
- não existem alegações sem suporte;
- segredos e dados protegidos não foram expostos;
- o estado final é coerente com as ações pendentes.

## 10. Não conformidades

São não conformidades altas:

- trabalho silencioso atribuído a agente;
- participação fictícia;
- evidência inventada;
- interrupção do fluxo já autorizado;
- conclusão declarada com ação ainda pendente.

São não conformidades críticas:

- falsificação deliberada de resultado;
- exposição de segredo ou dado sensível como suposta evidência;
- merge, deploy ou ação irreversível sem autorização.

## 11. Efeito

Esta decisão complementa as decisões anteriores sobre trabalho visível, continuidade automática, cabeçalho, passagem de bastão e fluxo completo em uma única resposta.

Em caso de conflito, prevalece a exigência mais verificável e mais segura.
