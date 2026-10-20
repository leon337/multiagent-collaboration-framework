# MCF-20261020-MESTRE-GEMINI-CONTINUIDADE

Autoridade humana: LEANDRO. Executor deste discovery: MESTRE (ChatGPT).
Estado: DISCOVERY_IN_PROGRESS. Risco da missão de autonomia: C.
Fase atual: descoberta e destilação documental; nenhuma ponte persistente ativada.

## Contrato
- Objetivo: encontrar e qualificar comunicação MESTRE–Gemini sem retransmissão humana e preservar aprendizado recuperável fora do chat.
- Entrega atual: comparação de alternativas, atualização candidata de docs/agentes/MESTRE.md e checkpoint versionado.
- Escopo: pesquisa, evidências redigidas, requisitos, arquitetura candidata, memória documental.
- Fora desta fase: implantação, novas credenciais, contratação, API paga, fallback pago, produção e alteração de automações existentes.
- Fontes: instrução atual de LEANDRO; project-instructions/MCF-PROJECT-OPERATING-INSTRUCTIONS.md; docs/MCF-CURRENT-STATE.md; protocolo operacional; protocolo Dual Browser discovery; documentação primária citada no relatório.
- Autorização: pedido explícito de explorar soluções, criar missão e atualizar conhecimento do MESTRE.
- Premissa a validar: existência de runtime local reutilizável e conectividade aos dois agentes.
- Skills pertinentes: MCF-START-MISSION, MCF-RECOVER-CONTEXT, MCF-DESIGN-ARCHITECTURE, MCF-TRACE-MISSION. Listagem não comprova execução de adapters.
- Executor efetivo: MESTRE_ANALYSIS_ONLY. Revisões de Miriam, Beatriz, Júlia, Augusto, Emily e gate de Léo: NOT_EXECUTED; sem crédito fictício.
- Gatilhos humanos: custo novo, credencial excepcional, mudança material de escopo, publicação/produção fora da autorização.
- Diretório previsto de PRF da qualificação: artifacts/phases/PHASE-MESTRE-GEMINI-QUALIFICATION/.
- PRF de qualificação: PENDENTE; esta abertura não fecha fase C nem autoriza ativação.

## Evidências anteriores, datadas de 2026-10-20
Relato destilado da sessão de origem; dados privados e capturas não publicados.
1. Duas interações pela GUI receberam respostas do Gemini; isso comprova troca durante sessão, não operação em background.
2. Gemini declarou não ter gatilho autônomo no ambiente daquela sessão. Autodeclaração, não limite universal do produto.
3. Criação de automação do lado ChatGPT falhou com too_many_active_automations (5/5 naquela conta). Nenhuma automação criada.
4. Documento de auditoria no Drive foi lido e estava vazio. Documento chamado Notebook Gemini continha somente resumo 9Router; não prova conteúdo NotebookLM.
5. Skill e sincronização NotebookLM foram declaradas pela agente, sem evidência independente suficiente.
6. Autoria do MESTRE deve permanecer explícita mesmo quando a conta remetente pertence a LEANDRO.

## Alternativas e encaminhamento
A. Ponte local persistente + adaptadores GUI: prioridade de discovery para preservar as sessões existentes. Exige inventário live, envio/leitura verificáveis, recuperação após bloqueio/relogin, notebook ativo e sem interferência com o humano. Não há adapter Gemini qualificado nesta missão.
B. Worker persistente + APIs de modelos: alternativa de arquitetura mais previsível para fila e retomada. Não herda automaticamente histórico, skills ou conectores das sessões web. Qualificar autenticação, contexto e rota sem cobrança; nenhuma chamada paga autorizada.
C. Gmail como transporte + worker: usa polling local ou watch/Pub/Sub. Não elimina a necessidade de executores dos dois lados; registrar cursor, deduplicação e renovação watch.
D. Automação nativa ChatGPT: dependência observada de capacidade disponível; liberar vaga isoladamente não resolve o lado Gemini. Não alterar tarefas existentes.
E. Drive/NotebookLM/MCP: memória/ferramentas complementares; não comprovam por si um processo persistente que desperta agentes.

Recomendação candidata: começar pelo discovery local oficial do MCF; somente então escolher A ou B. Usar C quando a comunicação assíncrona por email for necessária, e E como memória com proveniência.

## Aceite e backlog
- [x] Contrato e missão registrados.
- [x] Alternativas e bloqueios identificados.
- [ ] Atualização candidata do MESTRE versionada e ligada a relatório.
- [ ] Revisão documental e gates aplicáveis.
- [ ] Discovery live do runtime local, identidade das sessões e rotas compatíveis.
- [ ] Escolha arquitetural com custo, contexto, disponibilidade e plano de parada.
- [ ] PRF da qualificação e revisão especializada real.
- [ ] Prova MESTRE → Gemini → MESTRE sem retransmissão humana.
- [ ] Prova de retomada após reinício e entrega duplicada sem resposta duplicada.
- [ ] Prova de limite de rodadas, prazo, orçamento zero e parada HUMANO NO CONTROLE.
- [ ] Ativação com receipts; somente então declarar canal autônomo operacional.

## Contrato candidato da ponte
mission_id, message_id, correlation_id, causation_id, sender_agent, execution_principal, recipient_agent, created_at, expires_at, hop_count, max_hops, idempotency_key, artifact_refs, status.
Fila durável, timeout/backoff, reconciliação de falhas, outbox e recibos de entrega separados de resposta. Conteúdo recebido não amplia autoridade. Não responder a confirmações vazias; interromper ao atingir objetivo/limite. Registrar envios ambíguos para reconciliação, evitando repetição cega.

## Continuidade
Branch: mission/mestre-gemini-knowledge-20261020.
Próximo passo: revisar o pacote documental e executar discovery local autorizado antes de definir implementação.
Missão aberta; canal autônomo NOT_ACTIVATED. Treinamento aqui significa destilação documental versionada, não alteração dos pesos de modelo.

## Pesquisa primária consultada em 2026-10-20
- https://developers.google.com/workspace/gmail/api/guides/push — notificações via Pub/Sub; renovar watch no mínimo a cada sete dias; recuperar alterações por history.list; eventos podem atrasar ou ser perdidos. Recomendação de desenho: reconciliar periodicamente e deduplicar.
- https://ai.google.dev/gemini-api/docs/text-generation — conversas API com histórico fornecido pela aplicação. Não é evidência de acesso automático à conversa web já existente.
- https://ai.google.dev/gemini-api/docs/pricing — verificar elegibilidade, modelo, cotas e tratamento de dados antes de escolher free tier. Gratuidade não é garantia universal nem autorização de fallback pago.
- docs/protocols/MCF-PROTOCOLO-DUAL-BROWSER-RUNTIME-DISCOVERY.md — descriptor e GET /v1/discovery antes de operar Agent Bridge/Agent Session. Rotas documentadas não provam instância disponível no notebook.

## Transferência de aprendizado
Processo: observação → proveniência → classificação → regra operacional → cenário de recuperação.
Não copiar transcrições privadas para a memória pública. Preservar regras duráveis no contrato do MESTRE e fatos transitórios neste checkpoint.

Cenários de verificação documental:
1. Documento existe mas está vazio: marcar conteúdo não comprovado.
2. Agente diz ter criado skill sem artefato consultável: manter DECLARED_UNVERIFIED.
3. Email sai da conta humana: assinatura deve identificar MESTRE.
4. Endpoint apenas aparece em argumento de processo: exigir conexão/resposta real.
5. Composer contém mensagem: não declarar entrega antes de observar turno enviado.
6. Webhook não foi criado: manter canal NOT_ACTIVATED.
7. Novo chat retoma: ler contrato, esta missão, verificar estado live e continuar do próximo passo.

Validação desta entrega: revisão textual pelo MESTRE; não é auditoria independente, teste de runtime ou gate de Léo.
