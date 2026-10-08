---
name: mcf-dsh-browser-operate
description: Ensina o agente a usar o dsh-builtin-browser como ferramenta primária para navegar, interagir e verificar páginas web em um navegador real, com fallback controlado para Computer Use.
whenToUse: Use quando a tarefa exigir abrir, navegar, clicar, digitar, selecionar, inspecionar ou verificar uma página web interativa; não use para leitura estática quando uma skill web de leitura for suficiente.
metadata:
  mcf_skill_id: MCF-DSH-BROWSER-OPERATE
  version: 1.0.0
  owner: Mestre
  risk_class: SENSITIVE_POSSIBLE
user-invocable: true
disable-model-invocation: false
---

# MCF DSH Browser Operate

## Regra principal

Quando a tarefa exigir interação com uma página web, o **dsh-builtin-browser é a ferramenta primária**.

Não substitua o Browser por `curl`, `wget`, `requests`, scraping por shell, Playwright, Selenium ou outra automação de navegador quando o objetivo for testar ou operar o fluxo pelo Browser do DSH.

## Fluxo operacional

1. Classifique a tarefa:
   - leitura simples de conteúdo: prefira uma skill de web-fetch/search;
   - interação com interface web: use esta skill.
2. Valide o escopo e as ações autorizadas antes de alterar estado externo.
3. Carregue esta skill antes da primeira ação de navegador.
4. Use `dsh-builtin-browser` como ferramenta primária.
5. Abra a URL e confirme que a página correta foi carregada.
6. Observe a página pelo mecanismo fornecido pelo Browser; prefira alvos semânticos e estado observado em vez de coordenadas físicas.
7. Execute somente as ações necessárias para o objetivo.
8. Depois de cada ação relevante, verifique o resultado usando estado da página, leitura da interface ou screenshot.
9. Ao concluir, produza evidência verificável: URL, ações realizadas, resultado observado e eventual side effect.
10. Se a ação falhar, tente recuperação segura; não alegue sucesso sem evidência.

## Seleção de ferramenta

- **Primária:** `dsh-builtin-browser`
- **Visão complementar:** `dsh-vision-router` ou `dsh-vision-toolkit` quando a interpretação visual for necessária.
- **Computer Use:** `dsh-tool-computer` somente quando a tarefa exigir interação fora das capacidades semânticas do Browser ou uma superfície do desktop que o Browser não consiga operar.
- **Shell/rede:** não use para substituir o Browser.

## Regras de segurança

Nunca:
- capture ou revele senhas, tokens, cookies ou outros segredos;
- contorne CAPTCHA, 2FA ou controles de acesso;
- use credenciais encontradas na tela ou no ambiente para automatizar autenticação sem autorização;
- faça pagamentos, compras, exclusões, alterações de conta ou outras ações irreversíveis sem o gate aplicável;
- publique conteúdo publicamente apenas porque a navegação funciona.

Quando houver:
- login;
- 2FA;
- CAPTCHA;
- alteração de conta;
- publicação pública;
- compra/pagamento;
- ação irreversível;

pare antes do efeito protegido e classifique como **HUMAN_GATE** conforme as regras do MCF.

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

A capacidade de navegar a interface **não concede autorização para publicar, comprar, alterar conta ou executar qualquer ação de produção**. A autorização permanece determinada pelo escopo da missão e pelos gates do MCF.

Para publicação social, mantenha a separação:
**agente cria/prepara → humano aprova → sistema publica somente quando o gate permitir**.

## Verificação obrigatória

Considere a tarefa concluída somente quando houver evidência de que:

- a ferramenta correta foi usada;
- a página/instância correta foi selecionada;
- as ações pedidas foram executadas;
- o resultado esperado foi observado;
- os side effects foram identificados;
- nenhuma credencial ou segredo foi exposto.

Se o Browser estiver indisponível, registre o bloqueio. Use Computer Use somente como fallback autorizado, e nunca silenciosamente.

## Anti-erro de ferramenta

Se houver várias ferramentas parecidas, escolha nesta ordem:

1. `dsh-builtin-browser`;
2. ferramentas de visão do DSH para compreender a página;
3. `dsh-tool-computer` para superfície de desktop quando o Browser não for suficiente;
4. fallback de leitura web somente quando a tarefa for realmente apenas leitura.

Nunca escolha uma ferramenta alternativa apenas porque ela parece mais rápida.

## Smoke test canônico

Para testar a skill sem side effect externo:

1. abrir `https://example.com`;
2. confirmar o título **Example Domain**;
3. confirmar que o navegador está visível;
4. registrar sucesso somente após essa verificação.

## Evidência mínima

Registre:
- `provider_used: dsh-builtin-browser`;
- URL-alvo;
- ações realizadas;
- resultado observado;
- timestamp;
- side effects;
- estado do HUMAN_GATE, quando aplicável.

