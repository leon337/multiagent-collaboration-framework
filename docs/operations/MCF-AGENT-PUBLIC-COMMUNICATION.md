# MCF — Identidade Institucional e Comunicação Externa dos Agentes (v1)

**Missão:** MCF-AGENT-PUBLIC-IDENTITY-001
**Classificação:** B (rascunhos reversíveis e política externa; execução externa sujeita ao boundary existente)
**Estado:** implementação candidata em branch/PR; sem ativação automática ou deploy.

## Objetivo

Uniformizar a apresentação pública dos agentes em WhatsApp, e-mail e outros canais, preservando transparência de automação, responsabilidade humana e governança MCF.

## Identidade

- MESTRE: **MESTRE — Agente Digital de Operações do Leandro**.
- Especialistas: **NOME — Agente Digital — FUNÇÃO CANÔNICA do Leandro**.
- A função é derivada do contrato canônico do agente, não de um segundo registry. A matriz de 29 agentes e os contratos individuais continuam sendo a fonte da verdade.
- LEANDRO é o humano com autoridade final. LÉO é um agente distinto; uma assinatura externa nunca transfere poderes ou permite que agente se passe por pessoa humana.
- A nomenclatura pública não cria vínculo empregatício, cargo jurídico, representação legal, identidade de conta ou permissão de ferramenta.
- Identificar claramente o agente como digital; jamais inventar cargos, autenticação ou relações comerciais.

## Contrato do MVP

**Componente:** apps/rede-social-agentes/apps/server/src/mcf-runtime/agent-public-communication.ts

O compositor recebe o contrato de agente já existente (AgentRoleContract), responsável humano, destinatário, canal, finalidade, data e referência de e-mail eventualmente enviado. Produz somente texto e metadados de rascunho.

- Política: MCF-AGENT-PUBLIC-COMMUNICATION/v1
- Estado de saída sempre: DRAFT_ONLY
- Autorização de envio: sempre false
- Fuso padrão da saudação: America/Recife, independentemente do fuso do servidor
- Sem dependências externas, segredos, acesso à rede ou efeitos colaterais

Ao anunciar envio prévio, o integrador DEVE consultar e verificar no provedor a mensagem enviada e conferir messageId, conta remetente, destinatário, assunto e anexo. Um objeto preenchido com esses valores não é evidência suficiente por si só. Nunca afirmar sucesso só porque o compositor retornou um texto.

## Antes de qualquer envio real

1. Identificar agente canônico, missão e autoridade humana vigente.
2. Validar o destinatário e a conta remetente para o canal selecionado.
3. Confirmar escopo de autorização no HDF/Permission Engine, incluindo gates apropriados.
4. Minimizar dados pessoais; não enviar segredos ou conteúdo fora do escopo.
5. Revisar o texto e o anexo efetivo (hash/versão, quando aplicável).
6. Enviar uma única vez, registrar prova externa, evitar duplicatas e reconciliar qualquer resultado ambíguo antes de repetir.
7. Manter comunicação oficial e preferências de marca por organização apenas mediante autorização, não presumidas.

## Exemplo de apresentação

“Boa tarde, Robson! Sou o MESTRE, Agente Digital de Operações do Leandro. A pedido dele, entro em contato sobre o Romaneio de Embarque nº 002.”

Se o comprovante de envio tiver sido confirmado, a mensagem pode mencionar a conta para a qual o e-mail foi enviado, solicitando confirmação de recebimento. Um rascunho não prova envio.

## Agentes e revisão

MESTRE coordena. Rafael implementa; Júlia e Ricardo revisam identidade, reputação e segurança; Beatriz/Renato validam; Emily audita independentemente; LÉO decide gates internos aplicáveis; LEANDRO mantém a autoridade final. Esta distribuição é o **plano de responsabilidades**, não alegação de execução independente já realizada por esses agentes.

## Aceite e fronteiras

- [x] Contrato e compositor sem transporte definidos.
- [x] Testes de unidade adicionados para identidade, saudação, referência de e-mail, validações e não envio.
- [ ] CI de branch e revisão independente por agente real concluídos.
- [ ] Gate e merge autorizados pelo fluxo vigente.
- [ ] Integração E2E de canais (WhatsApp/Gmail) aprovada como fase futura.

Fora do MVP: adapter de envio, agendamento, CRM, persistência de receipts e mudança de todas as superfícies de chat. Nenhum provider, banco, schema, endpoint, ambiente ou deployment é alterado por esta mudança.

**Rollback:** fechar o PR sem merge ou reverter estes arquivos e a referência em AGENTS.md.
