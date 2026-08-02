# Ciclo 2 — Log de Contribuições dos Agentes

**Projeto:** Rede Social para Agentes de IA  
**Ciclo:** Definição Detalhada do Produto  

## Mestre — Coordenação

**Entrada:** autorização de Leandro para continuidade.  
**Análise:** o projeto estava pronto para sair do posicionamento conceitual e detalhar o produto, sem autorização para código.  
**Decisão:** convocar 12 agentes adequados ao ciclo e dividir a entrega em definição, autonomia, backlog, conteúdo-semente e auditoria.  
**Entrega:** MCF-DEC-016 e estado operacional do ciclo.

## Leonardo — Produto e Requisitos

**Entrada:** posicionamento híbrido aprovado na MCF-DEC-013.  
**Achados:** o produto precisava transformar conceitos em tipos de usuário, problemas, jornadas, escopo, métricas e critérios verificáveis.  
**Decisão:** estruturar um MVP supervisionado com identidade, vínculo, conteúdo social, comunidades, supervisão, moderação e auditoria.  
**Entrega:** visão, proposta de valor, escopo e critérios de sucesso.

## Carlos — Inovação e Riscos Futuros

**Entrada:** necessidade de diferenciação sem antecipar complexidade.  
**Achados:** a vantagem não está apenas em permitir posts de agentes, mas em identidade persistente, colaboração, reputação explicável e autonomia progressiva.  
**Decisão:** manter níveis futuros fora do MVP, preservando a direção de evolução.  
**Entrega:** níveis 3 e 4 como horizontes não implementáveis neste ciclo e reputação baseada em eventos.

## Evelyn — Gestão de Design e Experiência

**Entrada:** múltiplos fluxos envolvendo humanos, agentes e supervisores.  
**Achados:** os estados de identidade, autonomia e moderação precisam ser compreensíveis em toda a experiência.  
**Decisão:** coordenar UX, UI e acessibilidade em um modelo único de estados.  
**Entrega:** requisitos de experiência para perfil, feed, aprovação, pausa e moderação.

## Laura — UX

**Entrada:** tipos de conta e ações sociais.  
**Achados:** os fluxos críticos são criar agente, aprovar publicação, atuar com autonomia limitada, pausar/revogar e participar de comunidade.  
**Decisão:** formalizar essas cinco jornadas antes da interface.  
**Entrega:** jornadas A a E no contrato de produto.

## Isabela — UI

**Entrada:** risco de confusão entre humano e agente.  
**Achados:** identidade e autonomia devem permanecer visíveis no perfil, feed e conteúdo.  
**Decisão:** exigir selo de IA, indicador de autonomia, indicação de conteúdo assistido/autônomo e estados explícitos.  
**Entrega:** requisitos conceituais de interface, sem produção visual neste ciclo.

## Marina — Acessibilidade

**Entrada:** fluxos críticos do MVP.  
**Achados:** cor, ícones ou animações isoladas não podem carregar informações essenciais.  
**Decisão:** tornar acessibilidade um épico P0 transversal.  
**Entrega:** navegação por teclado, foco visível, contraste, rótulos, textos alternativos, mensagens compreensíveis e suporte a zoom.

## Sofia — Arquitetura

**Entrada:** definição conceitual de produto.  
**Achados:** o domínio requer entidades próprias para identidades, vínculos, conteúdo, autonomia, permissões, moderação, auditoria e reputação.  
**Decisão:** separar os objetos principais sem escolher tecnologia física ainda.  
**Entrega:** mapa de objetos do domínio e gates arquiteturais anteriores à implementação.

## Tiago — IA e Machine Learning

**Entrada:** agentes com graus diferentes de autonomia.  
**Achados:** o nível isolado não é suficiente; a decisão depende também de ação, recurso, quota, comunidade, estado e política.  
**Decisão:** definir níveis 0, 1 e 2 no MVP e impedir autonomia irrestrita.  
**Entrega:** matriz de autonomia, concessões e regras de decisão.

## Ricardo — Segurança

**Entrada:** risco de abuso, spam, escalada de privilégio e exposição de segredos.  
**Achados:** o agente não pode alterar permissões próprias, remover vínculo ou acessar credenciais externas.  
**Decisão:** aplicar menor privilégio, regra mais restritiva, revogação imediata, quotas e auditoria de permissões.  
**Entrega:** controles de segurança, privacidade e moderação preventiva.

## Carmem — Documentação

**Entrada:** contribuições dos agentes e decisões anteriores.  
**Achados:** o ciclo precisava de contratos separados, mas coerentes.  
**Decisão:** consolidar três documentos centrais e este log.  
**Entrega:** definição detalhada, matriz de autonomia, backlog e rastreabilidade das contribuições.

## Emily — Auditoria Independente

**Entrada:** pacote consolidado do Ciclo 2.  
**Objetivo:** verificar cobertura, coerência, rastreabilidade, limites e ausência de autorização implícita para código.  
**Entrega:** revisão independente em artefato próprio.

## Resultado consolidado

```yaml
agentes_selecionados: 12
artefatos_centrais_de_produto: 3
log_de_trabalho_visivel: criado
implementacao: nao_iniciada
estado: AGUARDANDO_AUDITORIA
```
