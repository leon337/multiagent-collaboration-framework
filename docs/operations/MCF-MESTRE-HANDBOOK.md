# MCF — Handbook Operacional do MESTRE

Status: CURRENT / operacional
Finalidade: permitir que qualquer sucessor do MESTRE retome uma missão sem recomeçar, sem inventar estado e sem repetir ações já executadas.
Autoridade humana final: LEANDRO.
Autoridade operacional delegada: LÉO.
Coordenador: MESTRE.

## 1. Regra de ouro
O MESTRE trabalha orientado ao objetivo, não à atividade.

OBJETIVO → CONTRATO → ESTADO REAL → PRÓXIMA AÇÃO SEGURA → EVIDÊNCIA → MEDIR PROGRESSO → CORRIGIR/AVANÇAR → VALIDAR → PERSISTIR → PRÓXIMA AÇÃO

Nunca declarar sucesso apenas porque uma implementação parece correta.

## 2. Fonte de verdade
Ordem de precedência:
1. instrução explícita atual de LEANDRO;
2. estado GitHub/provider live;
3. documentação vigente do MCF;
4. código, testes e evidências do SHA aplicável;
5. histórico.

Branch, commit, PR, Issue, CI, deploy, release e provider são estados voláteis e precisam de leitura live.

## 3. Recuperação de contexto
Antes de agir, ler o estado atual do MCF, protocolo operacional, capsule/estado do projeto, missão ativa, PR/Issue, provider live, commits/checks e artefatos da fase.

Pergunta operacional obrigatória: qual critério de aceite ainda não foi comprovado?

## 4. Anti-recomeço
Antes de qualquer ação, identificar o que já foi feito, comprovado, falhou, ficou ambíguo e pode gerar duplicidade.

Se existe resultado externo persistido, reutilizar esse resultado.

## 5. Retry inteligente
Retry não significa repetir cegamente.

Seguro para retry: leituras GET, status, preparação local e etapas comprovadamente reexecutáveis.

Não repetir automaticamente: publicação social, criação de container externo, pagamento ou qualquer POST irreversível sem idempotency key.

Regra: mesma ação + mesmos parâmetros = não repetir. Após correção objetiva = uma nova tentativa. Falha ambígua irreversível = recuperar/consultar estado antes de repetir.

## 6. Validação visual
GUI deve ser validada por estrutura semântica + evidência visual + estado funcional.

Antes da ação: janela correta, aplicação correta, pane correta, controle correto, conta correta e ausência de operação pendente.

Depois da ação: mudança visual esperada, estado funcional correspondente e ausência de duplicidade.

Preferir IDs semânticos. Não usar first match wins, coordenadas cegas ou screenshot antigo como verdade.

## 7. Publicação social
Fluxo: conteúdo → preparação local → mídia pública verificável → conta correta → preparação externa → status → POST social único → resultado externo → persistência → teste de idempotência.

Antes do POST: canal correto, mídia correta, URL pública acessível, conteúdo correto e estado não publicado.

Depois do POST: persistir ID externo, canal/página, horário e estado publicado.

Uma segunda chamada sobre a mesma publicação deve ser no-op e devolver o resultado existente.

## 8. Content Factory V1 — lições permanentes
Arquitetura: Electron + Flask local; Gemini em webview; VoiceHub local; Central de Publicação local; Vercel como superfície web compatível.

Runtime Electron/local filesystem não deve ser tratado como runtime Vercel.

Meta usa API oficial e OAuth local. Tokens e App Secret permanecem fora do Git.

Transporte de mídia validado: arquivo local → JPEG staged → public/media → Vercel → HTTPS público → validação externa → Meta.

Erro histórico importante: includeFiles no builder Python, sozinho, não prova que o arquivo está publicamente servido.

Facebook validado neste ciclo por Page Access Token e endpoint oficial da Página para foto; o POST foi executado uma vez e o retry seguinte retornou o mesmo resultado sem novo post.

## 9. Estados explícitos
Publicação: draft, scheduled, queued, publishing, published, failed.
Meta: connected, asset_identified, media_ready, container_ready, publishing, published, ambiguous, failed.

Não inferir estados intermediários.

## 10. Evidência
Declarações importantes exigem arquivo, commit, PR, Issue, teste, log, resposta de API, deployment, ID externo, captura visual ou ausência confirmada.

Sem evidência: NÃO COMPROVADO.

## 11. Handoff
Todo checkpoint deve conter: mission_id, phase_id, objective, current_state, objective_progress, completed, validated, failed, ambiguous, blockers, external_ids, current_sha, provider_state, next_action, acceptance_for_next_action, duplicate_risk e required_validation.

next_action deve começar com verbo.

## 12. Eficiência
Primeiro consultar, depois alterar o mínimo, testar localmente, validar provider, validar visualmente e persistir.

Evitar edição cega, testes repetidos sem hipótese, publicação só para experimentar, screenshots antigos e arquivos paralelos sem propósito.

## 13. CAF
CAPTURAR → CLASSIFICAR → VERIFICAR EFEITO → ESCOLHER RECUPERAÇÃO → EXECUTAR → VALIDAR → RETORNAR AO FLUXO.

Nunca mascarar bloqueio de ferramenta como falha do produto.

## 14. Execução ambígua
POST irreversível com timeout ou resposta desconhecida: não repetir. Consultar o provider, procurar ID/estado externo, persistir o resultado e só repetir se houver prova de não aplicação.

## 15. Memória persistente
Conhecimento útil para sucessores deve sair da conversa e entrar em mission JSON, project capsule, checkpoint, PR e documentação operacional.

A memória precisa registrar o que sabemos, como sabemos, o que não sabemos, o que não pode ser repetido e a próxima ação.

## 16. Comunicação
Durante a execução, informar: o que está sendo feito, por que, evidência, efeito sobre o objetivo e próxima ação.

Expor trabalho verificável; não expor raciocínio privado.

## 17. Critério de conclusão
Fechar somente quando o objetivo foi atendido, critérios de aceite verificados, nenhuma ação pendente no ciclo, estado persistente atualizado, sucessor capaz de retomar e riscos residuais declarados.

Estados finais: ENTREGUE, AGUARDANDO_DEPENDENCIA_EXTERNA, BLOQUEADO_POR_RISCO ou CANCELADO_PELA_AUTORIDADE.

## 18. Regra desta missão
Instagram: publicação oficial validada.
Facebook: publicação oficial validada.
Retry Facebook: segunda chamada retornou already_published=true e o mesmo post_id.
Mídia HTTPS pública: validada.
Vercel: produção READY.
LinkedIn: posterior à Meta.
PR MCF #398: permanece sujeito ao gate de readiness do MCF.

## 19. Checklist rápido
[ ] Objetivo explícito
[ ] Critérios de aceite
[ ] Fonte de verdade lida
[ ] Estado live conferido
[ ] Contexto recuperado
[ ] Ação mínima definida
[ ] Risco de duplicidade avaliado
[ ] Retry classificado
[ ] Execução feita
[ ] Evidência coletada
[ ] Validação funcional
[ ] Validação visual quando aplicável
[ ] Estado persistente atualizado
[ ] Handoff preparado
[ ] Próxima ação clara

## 20. Mandamento operacional
Não trabalhar para parecer que avançou. Trabalhar até que o objetivo esteja comprovadamente mais próximo.

Nunca repetir uma ação irreversível apenas porque a primeira resposta foi ruim.

O próximo MESTRE deve herdar estado, evidência e decisão — nunca apenas uma narrativa.