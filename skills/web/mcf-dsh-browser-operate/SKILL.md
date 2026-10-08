---
name: mcf-dsh-browser-operate
description: Ensina o agente a usar o dsh-browser-agent como ferramenta primária para navegar, interagir e verificar páginas web com uma política rápida, orientada ao objetivo e com recuperação limitada.
whenToUse: Use quando a tarefa exigir abrir, navegar, clicar, digitar, selecionar, inspecionar ou verificar uma página web interativa; não use para leitura estática quando uma skill web de leitura for suficiente.
metadata:
  mcf_skill_id: MCF-DSH-BROWSER-OPERATE
  version: 1.2.0
  owner: Mestre
  risk_class: SENSITIVE_POSSIBLE
user-invocable: true
disable-model-invocation: false
---

# MCF DSH Browser Operate

## Regra principal

Quando a tarefa exigir interação com uma página web, o dsh-browser-agent é a ferramenta primária.

A navegação deve ser orientada ao objetivo: escolher o menor caminho observável até o resultado, minimizar chamadas de ferramenta e verificar somente o que é necessário.

Não substitua o Browser por curl, wget, requests, scraping por shell, Playwright, Selenium ou outra automação de navegador quando o objetivo for testar ou operar o fluxo pelo Browser do DSH.

# Fast Navigation Policy

## 1. Escolha a rota mais curta

Antes da primeira ação, identifique mentalmente:

- qual é o estado final esperado;
- qual página precisa ser alcançada;
- qual é a menor sequência de ações para chegar lá.

Preferências:

1. URL conhecida → browser_open direto.
2. URL conhecida em histórico → browser_visited e reabrir diretamente.
3. Link/ação visível na página → usar alvo semântico.
4. Só procurar em menus quando não houver rota direta.

Não volte à página inicial para repetir uma rota que já pode ser alcançada por URL, histórico ou link observado.

## 2. Não duplique observação

browser_open já devolve um snapshot da página carregada.

Portanto:

- não chame browser_snapshot imediatamente depois de browser_open sem motivo;
- use o resultado do browser_open para decidir a próxima ação;
- use browser_a11y quando precisar compreender estrutura, papéis, nomes ou estados;
- use browser_snapshot quando refs/elementos interativos forem suficientes;
- não faça browser_a11y + browser_snapshot em sequência por rotina.

Regra prática:

1 observação → 1 ou mais ações → 1 verificação, salvo quando uma mudança de página tornar a observação antiga inválida.

## 3. Reutilize seletores

Quando browser_a11y ou browser_snapshot entregar:

- {#id};
- {[name=x]};
- alvo semântico por texto;

reutilize esse seletor diretamente na ação seguinte.

Não recalcule coordenadas e não procure novamente o mesmo elemento sem evidência de que a página mudou.

## 4. Use espera apenas quando necessário

browser_open e as navegações já aguardam a carga básica do documento.

Use browser_wait somente quando houver evidência de conteúdo assíncrono, por exemplo:

- lista carregada depois do documento;
- componente XHR/API;
- seletor ainda ausente;
- página conhecida por carregar conteúdo depois do HTML inicial.

Preferência:

- espere pelo URL esperado;
- ou espere por um seletor específico;
- comece com orçamento curto e amplie somente se houver evidência de lentidão.

Não faça sleep arbitrário nem repita browser_snapshot rapidamente esperando mudança.

## 5. Ações em lote

Para formulários:

- vários campos → browser_fill;
- um campo → browser_set_value, browser_check, browser_select ou browser_clear;
- verificação → browser_get_value.

Para listas, resultados e tabelas:

- prefira browser_scrape;
- não abra item por item para coletar dados que já estão presentes na lista.

## 6. Navegação por página

Quando uma ação levar para outra página:

1. execute a ação;
2. deixe a navegação completar;
3. use o novo resultado fornecido pelo Browser;
4. se o conteúdo for assíncrono, use browser_wait;
5. continue pela próxima ação.

Não reabra a URL anterior para confirmar que a ação aconteceu.

## 7. Verificação mínima suficiente

Verifique o resultado que importa, não toda a página.

Exemplos:

- objetivo = abrir página → confirme URL/título;
- objetivo = clicar botão → confirme o novo estado;
- objetivo = preencher campo → confirme o valor;
- objetivo = selecionar opção → confirme a opção;
- objetivo = navegar → confirme a página destino;
- objetivo = obter lista → confirme contagem/conteúdo relevante.

Screenshot só quando pixels forem realmente necessários: layout, gráfico, posição visual, design ou decisão visual.

## 8. Limite de recuperação

Uma ação que falhou deve seguir esta política:

- primeira falha → analisar a mensagem e corrigir o método;
- segunda falha da mesma abordagem → mudar a abordagem;
- nunca repetir o mesmo clique/coordenada indefinidamente.

Ordem de recuperação:

novo seletor → alvo semântico → nova observação → visão/coordenada, quando permitido.

Uma falha de configuração ou permissão não deve ser contornada por outra ferramenta.

## 9. Abas

Use uma aba nova apenas quando houver ganho real:

- duas páginas independentes;
- comparação;
- preservar a página atual como referência.

Para trabalho sequencial, mantenha a aba atual.

Feche abas que deixaram de ser necessárias.

## 10. Memória de navegação

Para voltar a páginas visitadas:

- prefira browser_visited para localizar uma URL conhecida;
- use browser_back/browser_forward para navegação curta dentro da sessão;
- não refaça uma sequência longa de cliques quando o destino já é conhecido.

## 11. Proibição de desperdício

Não:

- tirar screenshot para ler texto;
- chamar snapshot duas vezes sem mudança de estado;
- chamar a11y e snapshot por hábito;
- esperar 30 segundos por padrão;
- repetir a mesma ação porque talvez agora funcione;
- voltar ao início de um site quando o destino já é conhecido;
- abrir múltiplas abas sem necessidade;
- navegar manualmente por menus quando uma URL observada resolve o destino.

## 12. Regra de velocidade

Para cada etapa, prefira:

URL direta > seletor conhecido > alvo semântico > nova observação > visão > coordenadas.

E prefira:

uma chamada que resolve vários itens > várias chamadas unitárias.

## Seleção de ferramenta

- Primária: dsh-browser-agent
- Estrutura: browser_a11y ou browser_snapshot
- Extração em lote: browser_scrape
- Formulários em lote: browser_fill
- Espera: browser_wait
- Visão complementar: dsh-vision-router ou dsh-vision-toolkit quando pixels forem necessários.
- Computer Use: dsh-tool-computer somente quando o Browser não for suficiente.
- Shell/rede: não use para substituir o Browser.

## Disponibilidade global

Esta skill é model-invocable no perfil global do DSH. Agentes e novas sessões devem reconhecer o Browser compartilhado automaticamente a partir do catálogo de skills, sem depender de explicação manual do usuário.

## Fluxo operacional

1. Classifique a tarefa.
2. Carregue esta skill antes da primeira ação de navegador.
3. Defina o estado final e a rota mais curta.
4. Use dsh-browser-agent.
5. Abra diretamente a URL conhecida.
6. Aproveite o snapshot já devolvido.
7. Quando necessário, obtenha uma única estrutura semântica por etapa.
8. Execute ações com seletores reutilizáveis.
9. Espere somente por conteúdo assíncrono.
10. Verifique o estado final mínimo necessário.
11. Registre evidência e side effects.
12. Pare assim que o objetivo estiver comprovadamente concluído.

## Regras de segurança

Nunca:

- capture ou revele senhas, tokens, cookies ou outros segredos;
- contorne CAPTCHA, 2FA ou controles de acesso;
- use credenciais encontradas na tela ou no ambiente para automatizar autenticação sem autorização;
- faça pagamentos, compras, exclusões, alterações de conta ou outras ações irreversíveis sem o gate aplicável;
- publique conteúdo publicamente apenas porque a navegação funciona.

Quando houver login, 2FA, CAPTCHA, alteração de conta, publicação pública, compra/pagamento ou ação irreversível, pare antes do efeito protegido e classifique como HUMAN_GATE conforme as regras do MCF.

## Redes sociais e plataformas comerciais

Esta skill pode operar a interface de:

- YouTube;
- Instagram;
- Facebook;
- LinkedIn;
- X;
- TikTok;
- Meta Business;
- TikTok Shop.

A capacidade de navegar a interface não concede autorização para publicar, comprar, alterar conta ou executar qualquer ação de produção.

Para publicação social:

agente cria/prepara → humano aprova → sistema executa somente quando o gate permitir.

## Verificação obrigatória

Considere a tarefa concluída somente quando houver evidência de que:

- a ferramenta correta foi usada;
- a página/instância correta foi selecionada;
- as ações pedidas foram executadas;
- o resultado esperado foi observado;
- os side effects foram identificados;
- nenhuma credencial ou segredo foi exposto.

## Anti-erro

Se houver várias ferramentas parecidas, escolha:

1. dsh-browser-agent;
2. estrutura semântica;
3. ação semântica;
4. visão quando pixels forem necessários;
5. Computer Use apenas como fallback autorizado.

Duas falhas da mesma abordagem exigem mudança de abordagem.

## Smoke test canônico

Para testar a skill sem side effect externo:

1. abrir https://example.com;
2. usar o snapshot retornado pelo próprio browser_open;
3. confirmar Example Domain;
4. não tirar screenshot;
5. registrar sucesso somente após a confirmação.

## Evidência mínima

Registre:

- provider_used: dsh-browser-agent;
- URL-alvo;
- ações realizadas;
- resultado observado;
- timestamp;
- side effects;
- estado do HUMAN_GATE, quando aplicável;
- quantidade aproximada de chamadas de navegador quando disponível.
