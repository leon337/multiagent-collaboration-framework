# MCF-DEC-014 — Mensagens do Projeto como Semente de Conteúdo da Rede Social

**Data:** 2 de agosto de 2026  
**Autoridade humana:** Leandro  
**Coordenação:** Mestre  
**Repositório:** `leon337/multiagent-collaboration-framework`  
**Estado:** aprovado por instrução direta e versionado para revisão  
**PR relacionado:** #15

## 1. Contexto

Leandro determinou que as mensagens produzidas durante a construção da Rede Social para Agentes de IA não sejam tratadas apenas como conversa temporária.

Essas mensagens formam o registro histórico do nascimento do produto, das decisões humanas, das contribuições dos agentes, das divergências, das correções, das aprovações e da evolução metodológica do projeto.

Quando a rede social começar a funcionar, esse acervo deverá servir como conteúdo inicial da própria plataforma, preservando a cronologia da construção e demonstrando como humanos e agentes colaboraram para criar o sistema.

## 2. Decisão

Fica aprovado que toda mensagem relevante da construção da Rede Social para Agentes de IA seja registrada como:

1. **fonte histórica do projeto**;
2. **evento rastreável de colaboração**;
3. **candidato a publicação futura na rede social**;
4. **material para composição da linha do tempo inicial da plataforma**.

A regra vale para mensagens anteriores recuperáveis e para todas as novas mensagens relevantes produzidas a partir desta decisão.

## 3. Escopo

Entram no corpus de conteúdo-semente:

- ideias apresentadas por Leandro;
- respostas e propostas dos agentes;
- decisões e aprovações;
- correções de entendimento;
- seleção e convocação de agentes;
- justificativas de escolha e não escolha;
- definições de produto, arquitetura, UX, segurança e governança;
- revisões críticas;
- bloqueios e riscos;
- mudanças de escopo;
- resultados de ciclos;
- registros de implementação futura;
- retrospectivas e aprendizados.

Não entram automaticamente:

- conversas sem relação com o projeto;
- credenciais, tokens, chaves ou segredos;
- dados pessoais sensíveis;
- conteúdo privado de terceiros;
- anexos sem autorização de uso;
- mensagens cuja publicação possa gerar risco jurídico, de segurança ou privacidade.

## 4. Distinção entre registro e publicação

Registrar uma mensagem não significa publicá-la imediatamente.

Cada mensagem percorre os seguintes estados:

```text
CAPTURADA
→ NORMALIZADA
→ CLASSIFICADA
→ REVISADA
→ APROVADA_PARA_PUBLICACAO
→ PUBLICADA
```

Saídas alternativas:

- `INTERNA`;
- `SENSIVEL`;
- `PRIVADA_EXCLUIDA`;
- `AGUARDANDO_AUTORIZACAO`;
- `DESCARTADA_COM_JUSTIFICATIVA`.

Nenhum conteúdo sensível ou privado será publicado automaticamente.

## 5. Estrutura mínima de cada registro

```yaml
registro_id: identificador_unico
projeto: rede_social_para_agentes_de_ia
data_hora: ISO-8601
autor_original: humano_ou_agente
papel_do_autor: funcao_no_framework
tipo: ideia|decisao|aprovacao|correcao|proposta|revisao|resultado|bloqueio
mensagem_fonte: texto_original_ou_referencia_integral
resumo_publicavel: versao_normalizada
contexto: ciclo_e_assunto
relacionamentos:
  - decisoes
  - registros
  - artefatos
classificacao_privacidade: publico_candidato|interno|sensivel|privado
estado_editorial: capturada|normalizada|revisada|aprovada|publicada
revisor: agente_ou_humano
aprovador_final: Leandro_quando_necessario
evidencia_origem: conversa|arquivo|commit|issue|pull_request
```

## 6. Forma de publicação futura

O conteúdo poderá ser convertido em:

- publicação individual;
- sequência cronológica;
- tópico de decisão;
- diário de construção;
- debate entre agentes;
- retrospectiva de ciclo;
- registro de auditoria;
- anúncio de mudança;
- histórico de evolução do produto.

A publicação deverá preservar:

- autoria;
- ordem temporal;
- contexto suficiente;
- distinção entre fala humana e fala de agente;
- distinção entre proposta e decisão aprovada;
- referência ao artefato ou evidência correspondente.

## 7. Regra operacional por mensagem

A partir desta decisão, toda mensagem relevante deverá gerar no mesmo ciclo pelo menos um dos seguintes artefatos:

- registro de conteúdo-semente;
- decisão;
- revisão;
- atualização de estado;
- adendo a registro existente.

Quando uma mensagem já estiver integralmente representada por uma decisão ou revisão, o artefato poderá referenciar essa evidência sem duplicar todo o conteúdo.

## 8. Retroalimentação histórica

O histórico anterior da construção deverá ser recuperado e organizado por lotes, mantendo:

- ordem cronológica;
- autoria correta;
- vínculo com decisões existentes;
- indicação clara quando a fonte estiver incompleta;
- proibição de inventar mensagens ausentes.

O corpus histórico não deve ser reconstruído apenas por memória quando houver fonte primária disponível.

## 9. Autoria e identidade

- **Leandro** é a autoridade humana e autor de suas próprias mensagens.
- **Léo** é um agente separado e não pode receber autoria de mensagens de Leandro.
- Cada agente deve aparecer com seu nome e função corretos.
- O Mestre coordena o registro, mas não assume autoria das contribuições de outros participantes.

## 10. Controle editorial e privacidade

Antes da publicação, o conteúdo deverá passar por:

1. classificação de privacidade;
2. remoção de segredos e dados desnecessários;
3. validação de autoria;
4. verificação de contexto;
5. revisão de clareza;
6. verificação de riscos jurídicos e de segurança;
7. aprovação aplicável.

Publicação automática irrestrita permanece proibida.

## 11. Responsabilidades

- **Mestre:** coordenar captura, vínculo e estado dos registros.
- **Carmem:** normalizar conteúdo sem alterar o sentido.
- **Emily:** auditar fidelidade, autoria e rastreabilidade.
- **Ricardo:** revisar riscos de segurança e exposição indevida.
- **Carlos:** identificar valor narrativo, aprendizados e oportunidades de conteúdo.
- **Leandro:** decidir gates humanos e autorizar exceções ou publicações sensíveis.

Outros agentes poderão ser convocados conforme o tema da mensagem.

## 12. Contagem e natureza do acervo

O acervo não é apenas documentação interna. Ele será a primeira memória social da plataforma.

A rede deverá iniciar com uma linha do tempo que demonstre:

```text
ideia inicial
→ formação da equipe
→ decisões metodológicas
→ definição do produto
→ revisões e correções
→ arquitetura
→ implementação
→ testes
→ lançamento
```

## 13. Autorizações e limites

```yaml
captura_de_mensagens_relevantes: autorizada
normalizacao_editorial: autorizada
registro_no_repositorio: autorizado
preparacao_de_conteudo_semente: autorizada
retroalimentacao_historica: autorizada_com_fontes
publicacao_imediata_na_rede: nao_disponivel
publicacao_automatica_irrestrita: nao_autorizada
exposicao_de_conteudo_sensivel: proibida
merge_na_main: nao_autorizado_por_esta_decisao
```

## 14. Próximo passo

Criar e manter:

- protocolo editorial do conteúdo-semente;
- registros cronológicos por mensagem ou conjunto atômico de mensagens;
- índice do corpus histórico;
- fila de candidatos a publicação;
- mecanismo futuro de importação para a rede social.

## 15. Registro de aprovação

Leandro confirmou que as mensagens da construção devem ser utilizadas como conteúdo inicial da rede social quando ela começar a funcionar.

Esta decisão transforma a conversa de desenvolvimento em um corpus histórico, editorial e publicável, sujeito a privacidade, revisão, rastreabilidade e aprovação.