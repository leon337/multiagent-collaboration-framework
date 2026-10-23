# Agent Studio — Evidências da integração real

Missão: https://github.com/leon337/multiagent-collaboration-framework/issues/467
PR: https://github.com/leon337/multiagent-collaboration-framework/pull/468
Ambiente: Linux Mint, DeepSeek Harness Web 127.0.0.1:3080, Agent Studio 127.0.0.1:4317

## Ensaios reais no DeepSeek Harness

| Cenário | Evidência | Resultado |
| --- | --- | --- |
| Mudar o comportamento real | Studio publicou nova resposta, nova sessão DSH Hello World Agent, mensagem oi | MCF Agent Studio integrado! — aprovado |
| Adicionar ferramenta | Preset publicado com modo instructed e calculadora | DSH registrou tool call agent_studio_calculator, retorno 30 para (8+7)*2, resposta final 30 — aprovado |
| Bloquear acesso indevido | Usuário pediu uso de list_agents, fora da allowlist | Runtime negou execução: Agent Studio: ferramenta nao autorizada neste preset — aprovado |
| Publicar com backup | SHA256 do perfil prévio e do backup conferidos | Mudança restrita ao preset Hello World — aprovado |
| Reverter e republicar | Frontend via CDP, sem cliques por coordenada | Reversão de arquivo confirmada, nova prévia e nova publicação aprovadas |
| Confirmar publicação | Texto de confirmação incorreto | Recusado sem publicar |
| UI tablet/celular | CDP 768, 390 e 320 px | Sem overflow horizontal nem exceptions JavaScript |
| Inicialização persistente | Serviço systemd mcf-agent-studio.service | Ativo; health HTTP 200 |
| Consulta 9Router | GET local /v1/models através do Studio | 129 modelos listados |

## Imagens comprobatórias (recortadas para não expor conversas paralelas)

- [Resposta real alterada no DSH](evidence/agent-studio-real/dsh-fixed-response.png)
- [Chamada de calculadora no DSH](evidence/agent-studio-real/dsh-calculator-tool.png)
- [Ferramenta global recusada no DSH](evidence/agent-studio-real/dsh-tool-denial.png)
- [Interface de confirmação real](evidence/agent-studio-real/studio-publish-confirm.png)
- [Estado publicado na interface móvel](evidence/agent-studio-real/studio-publish-mobile.png)

## Arquitetura de execução

Studio: chat/painel visual → proposta validada → rascunho versionado → plano de publicação → confirmação explícita → backup + escrita atômica e hash no bloco permitido do perfil Web DSH → nova sessão DSH → runtime de ferramentas sob guard.

O adapter usa a API nativa de registro de ferramentas do DeepSeek Harness. Ferramentas permitidas nesta versão: calculadora e relógio. Outras ferramentas globalmente visíveis podem ser solicitadas pelo modelo, mas o guard em escopo impede a execução. O modo fixo e o modo eco também são suportados.

O armazenamento das versões e backups fica no diretório .data, que é ignorado pelo Git. A reversão compara SHA256 antes de restaurar para evitar sobrescrever edições feitas por terceiros. Sessões DSH antigas não são modificadas.

## Limites e pendências

O 9Router respondeu à lista de modelos, mas a chamada de geração sem chave retornou HTTP 401. A funcionalidade opcional de interpretar pedidos com IA no próprio Studio ainda exige chave inserida pelo usuário na interface (guardada só em memória do servidor), e não foi testada com uma credencial real. A sessão do DSH já executou resposta e ferramentas usando seu modelo configurado.

O MVP não é um IDE irrestrito, nem escreve código arbitrário sugerido por LLM, nem faz deploy público. Não houve teste WCAG formal com leitor de tela. A cópia no sandbox ChatGPT /mnt/data não foi possível devido a bloqueio de acesso externo; os testes reais foram feitos em navegador de QA e no DSH do notebook.

**Status de aceite:** publicação/reversão, alteração real de comportamento, ferramenta funcional e guarda de permissão aprovadas. Teste de geração pelo 9Router através do Studio e WCAG formal não aprovados.
