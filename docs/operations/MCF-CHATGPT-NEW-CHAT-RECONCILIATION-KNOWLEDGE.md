# MCF — Conhecimento Operacional: reconciliação de novo chat no ChatGPT

**Status:** conhecimento operacional obrigatório para continuidade  
**Missão:** `MCF-CHATGPT-NEW-CHAT-RECONCILIATION-001`  
**Issue:** #372  
**Data do achado:** 24 de setembro de 2026  
**Autoridade humana:** LEANDRO  
**Orquestrador:** MESTRE

## 1. Por que este documento existe

Este arquivo preserva um defeito observado em produção durante testes reais do cockpit ChatGPT com seis agentes MCF.

O objetivo é impedir que Mestres futuros repitam uma conclusão incorreta:

> `message_send_unconfirmed` não significa necessariamente que a mensagem não foi enviada.

Quando a confirmação local expira, o ChatGPT ainda pode concluir o efeito externo depois. O runtime precisa reconciliar essa possibilidade antes de reenviar.

## 2. Evidência observada

No teste de criação de novos chats para seis agentes:

- Emily, Patrícia, Rafael, Renato e Eduardo concluíram normalmente com `READY` e `handshakeVerified=true`;
- Sofia retornou `message_send_unconfirmed`;
- o estado interno ficou `ERROR` e `handshakeVerified=false`;
- o pane estava no projeto correto `SOPHIA`;
- uma nova conversa foi efetivamente criada;
- o user turn ficou visível;
- uma resposta válida do ChatGPT foi observada;
- mesmo assim o estado interno não foi promovido para `READY`.

Isso prova uma divergência entre:

1. **estado do efeito externo**, que ocorreu;
2. **estado persistido do runtime**, que permaneceu em erro.

Os identificadores privados de conversa e sessão não são versionados neste repositório público. A reprodução estrutural acima é suficiente para o contrato técnico.

## 3. Invariante para todos os próximos Mestres

### RECONCILE BEFORE RETRY

Sempre que um envio puder ter produzido efeito externo, mas a confirmação local for inconclusiva:

1. não assumir falha;
2. não reenviar imediatamente;
3. preservar a atribuição do attempt original;
4. procurar evidência correlacionada;
5. recuperar o attempt original se a evidência for suficiente;
6. reenviar somente depois de provar que o efeito original não ocorreu.

## 4. Evidência mínima para recuperação positiva

Para recuperar um bootstrap inicialmente incerto, a implementação deve correlacionar evidências do mesmo attempt, incluindo quando disponíveis:

- pane e projeto esperados;
- nova conversa pertencente ao projeto esperado;
- user turn original ou delivery anchor equivalente;
- agent/session identity esperada;
- marker `MCF_AGENT_READY` correspondente;
- ausência de evidência conflitante de outro attempt.

Somente uma nova URL `/c/...` não é prova suficiente.

Somente silêncio ou passagem de tempo não é prova suficiente.

## 5. Regra contra duplicação

É proibido resolver `message_send_unconfirmed` com retry cego.

Um retry cego pode produzir:

- duas conversas;
- dois bootstrap prompts;
- dois handshakes;
- state attribution incorreta;
- evidência impossível de auditar.

A reconciliação deve acontecer antes de qualquer resend.

## 6. Concorrência observada

Também foi observado que o Bridge usa um lock operacional no nível da instância.

Consequência:

- dois panes da **mesma instância** disparados simultaneamente podem competir e um receber `automation_busy`;
- instâncias distintas podem operar em paralelo.

Até que o runtime implemente fila/serialização interna mais robusta, a estratégia operacional segura é:

```text
notebook:       Emily -> Sofia
notebook-team2: Patrícia -> Rafael
notebook-team3: Renato -> Eduardo

As três linhas podem executar em paralelo.
Dentro de cada linha, os dois panes devem ser serializados.
```

`automation_busy` não deve ser tratado como conclusão da missão. Deve ser enfileirado ou reexecutado deterministicamente após o lock da mesma instância ser liberado.

## 7. Smoke obrigatório após a correção

O smoke final deve criar um chat novo para cada agente:

1. Emily;
2. Sofia;
3. Patrícia;
4. Rafael;
5. Renato;
6. Eduardo.

O resultado aceito é:

```text
6 conversas novas
6 projetos corretos
6 READY
6 handshakeVerified=true
0 duplicate sends
0 manual intervention
0 terminal automation_busy
```

## 8. Projetos que devem ser preservados

O teste não deve retirar os agentes de seus projetos ChatGPT configurados.

Em especial, o Team3 deve preservar:

- Renato -> `RENATO - MCF`;
- Eduardo -> `EDUARDO - MCF`;
- memória configurada como **Memória somente no projeto**.

## 9. Relação com Issue #365

Este achado é relacionado ao problema maior de lifecycle/reconciliation do cockpit, mas tem um caso de uso específico: **identity bootstrap + fresh chat**.

A correção não deve enfraquecer os gates fail-closed já construídos para:

- recovery;
- late result;
- delivery uncertainty;
- identity canonical binding;
- contract digest;
- startup revalidation.

## 10. Critério para remover este conhecimento do estado de "known issue"

Somente depois de existir teste determinístico e smoke real que comprovem:

- late positive evidence recupera o attempt original;
- restart reconcilia antes de resend;
- inexistência de efeito mantém fail-closed;
- seis agentes completam 6/6 sem intervenção;
- zero duplicação.

Até lá, este documento deve ser considerado conhecimento operacional ativo para MESTRE e agentes de engenharia/qualidade.

## 11. Referências canônicas

- `context/missions/mcf-chatgpt-new-chat-reconciliation-001.json`
- Issue #372
- `LEO-DEC-006 — Aprovação do Bootstrap de Chats`
- `MCF-DEC-007 — Protocolo de Inicialização de Novo Chat e Novo Projeto`
- parent mission `MCF-CHATGPT-UI-LIFECYCLE-RACE-001`
