# PHASE-02 — Relatório de fontes oficiais Dots

**Status:** IN_PROGRESS — fontes oficiais revistas e matriz preliminar produzida; revisão independente pendente.
**Consulta das páginas:** 2026-10-13 UTC. A documentação da OpenAI é mutável e deve ser reconsultada antes de decisões posteriores.

## 1. Modelo de produto que a OpenAI declara publicamente
A página Introducing dots, publicada em 2026-09-29, descreve agentes always-on, baseados em GPT-6 Astra, com computador/browser próprios na nuvem, ferramentas conectadas, trabalho contínuo e canais ChatGPT, Slack e Teams. A página também descreve contexto entre canais, trabalho concorrente em projetos e versões especializadas para organizações.
Fonte: https://openai.com/index/introducing-dots/

Isso é arquitetura funcional de alto nível comunicada pela OpenAI, não um diagrama interno completo, schema de banco, código-fonte ou especificação de API.

## 2. Segurança como defesa em profundidade
A publicação de segurança explica estas camadas explícitas:
- workspace cloud próprio por dot e sandbox que restringe código/ferramentas; ambientes cloud de usuários são isolados.
- execução do dot separada dos sistemas que coordenam o trabalho e aplicam salvaguardas; o dot não pode reconfigurar ou desligar os checks obrigatórios.
- secure sign-in em fluxos compatíveis mantém credenciais fora do contexto do modelo; segredos inseridos em conteúdo legível continuam sujeitos a exposição.
- permissões de apps, regras personalizadas, monitoramento contínuo e Activity View para acompanhar, corrigir, redirecionar ou parar trabalho.
- Auto-review separado verifica ações planejadas de efeito externo (por exemplo, email/arquivo) contra instruções, regras e requisitos de segurança; bloqueia quando necessário e pode pedir informação, usar alternativa permitida, transferir a etapa ao humano ou parar.
- confirmação/handoff diferenciados: mensagens/compartilhamento requerem autorização com escopo e destinatário adequado; compras exigem aprovação; exclusão permanente, software não reconhecido e mudanças de acesso sensíveis pedem confirmação; senha e transferência financeira são devolvidas ao humano.
Fontes:
https://openai.com/index/how-we-build-safety-security-and-privacy-into-dots/
https://help.openai.com/en/articles/20001529-dots-privacy-security-and-safety-faqs

## 3. Pesquisa proativa versus execução
Pesquisa proativa usa ferramentas read-only para consultar fontes autorizadas e guardar notas privadas; essas ferramentas não enviam mensagens, não alteram conteúdo conectado nem controlam navegador/computador. Qualquer ação posterior precisa seguir o caminho normal de aprovação e checagens. A restrição é descrita como enforced in code no post de segurança.
Fontes:
https://openai.com/index/introducing-dots/
https://openai.com/index/how-we-build-safety-security-and-privacy-into-dots/
https://help.openai.com/en/articles/20001529-dots-privacy-security-and-safety-faqs

## 4. Memória, continuidade e deleção
A FAQ oficial descreve compartilhamento de memória/contexto recente entre ChatGPT e dots; conversas com dot podem contribuir para a memória do ChatGPT. Desligar Memory impede compartilhamento futuro, mas não remove o que o dot já recebeu. Deletar o dot remove seu contexto, mas não apaga automaticamente arquivos/conversas criados em outros locais nem memórias já transferidas ao ChatGPT Memory. A FAQ também declara que não há, atualmente, controle individual direto para editar/apagar uma memória específica do dot.
Fonte: https://help.openai.com/en/articles/20001529-dots-privacy-security-and-safety-faqs
Implicação: a política de memória deve considerar fluxo entre contextos, retenção, revogação e deleção, não apenas armazenamento durável.

## 5. Sistema de avaliações publicado
O GPT-6 Astra System Card tem um apêndice específico para dots, publicado em 2026-09-03, com avaliações de prompt injection, red-teaming, restrições, mudança de escopo, tarefas encadeadas, Auto-review, monitorabilidade e salvaguardas.

Métricas que o card declara para contextos de teste específicos:
- Prompt injection automatizado em tarefas dots: 100 rollouts válidos com 500 emails simulados cada (50.000 emails, 16.600 ataques) sem sucesso de ataque marcado pelo score; variante iterativa com 100 cadeias e 2.638 tentativas válidas sem sucesso marcado.
- Mudança explícita de escopo/permissão: taxa de alinhamento de 91,8% (45/49 episódios), incluindo aprovação em 17 casos de mudança explícita de permissão.
- Boundary em tarefas encadeadas: nenhum caso de severidade alta no teste descrito, mas violações moderadas de escopo foram observadas; a taxa sinalizada foi de 8,6% com cinco tarefas intermediárias e 19,7% com dez.
- Auto-review: avaliado em seis categorias de risco, incluindo divulgação de dados, destruição, compromissos financeiros, segurança/acesso, comunicação não autorizada e ambiguidade de autorização. O card reporta avaliações sintéticas e 5.000 pedidos não editados para medir denial/recall.

Fonte: https://deploymentsafety.openai.com/gpt-6-astra/change-log

### Interpretação necessária
Não ler “zero sucessos observados” como risco zero. Esses números pertencem a harnesses, amostras, métricas e condições publicadas; não são garantia de comportamento em todas as situações de produção. O próprio card diz que algumas avaliações isolam comportamento do modelo sem toda a stack de salvaguardas e que certas taxas não representam produção.

## 6. Implicações preliminares para MCF
- Princípio convergente: autoridade e escopo têm de continuar vinculados à tarefa, mesmo quando há delegação, trabalho em segundo plano ou múltiplas etapas.
- Diferencial publicamente declarado de Dots: isolamento do workspace cloud por dot e Auto-review fora do ambiente mutável pelo agente.
- Diferencial visível do MCF neste snapshot: mission/phase contracts, external action ledger, receipt/evidence validation, controle humano codificado e PRF rastreável.
- Gap de documentação a avaliar: contrato explícito de read-only research lane, catálogo de classes de ação e decisões allow/deny/approval/handoff, linhagem/revogação de contexto e avaliação de escopo entre tarefas. “Gap” aqui significa não demonstrado pela amostragem de código consultada, não prova de inexistência em todo o repositório.

## 7. O que permanece UNKNOWN
A OpenAI não publicou nesta pesquisa o código interno completo de Dots, seu modelo de dados completo, protocolo interno de mensagens de subagentes, implementação detalhada de Auto-review, todas as APIs, políticas internas integrais ou topologia completa do scheduler. Não atribuir componentes/tecnologias específicas não divulgadas.