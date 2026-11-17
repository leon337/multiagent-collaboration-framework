# MCF — Manual operacional Gemini no Dual Browser Cockpit

**Identificador:** MCF-GEMINI-COCKPIT-OPERATING-MANUAL/v1  
**Data de evidência:** 2026-11-17  
**Classificação:** procedimento de leitura individual verificado em laboratório; integração automática ao runtime MCF **não implementada**  
**Papéis:** LEANDRO — autoridade humana; MESTRE — orquestrador; Gemini — agente executor/analisador; ChatGPT — agente executor quando convocado. LÉO não é LEANDRO.

## Objetivo e descoberta obrigatória

Este manual registra os procedimentos que novas sessões do MESTRE devem consultar **antes de operar Gemini Web no painel Workspace do Dual Browser Cockpit**. O usuário não deve precisar reexplicar conta, pane, modelo, upload, validação, recuperação de mensagens ou limites de GitHub.

**Entradas canônicas:** [AGENTS.md](../../AGENTS.md), [MCF-UI-OPERATING-MANUAL](MCF-UI-OPERATING-MANUAL.md), [MCF-GOOGLE-MODEL-ROUTING](MCF-GOOGLE-MODEL-ROUTING.md) e [estado atual do MCF](../MCF-CURRENT-STATE.md).

O manual **não** altera contratos de permissão, ferramentas disponíveis ou HUMAN_GATE; o fato de uma interface mostrar um botão não autoriza seu acionamento. IDs de browser, tokens, caminhos de perfil e seletores concretos devem ser descobertos em tempo real, não publicados como vínculos persistentes.

## Topologia operacional observada

| Superfície | Função | Observação |
| --- | --- | --- |
| Cockpit — painel `chat` | ChatGPT executor | Sessão persistente independente |
| Cockpit — painel `workspace` | Gemini Web / navegador operacional | Sessão e cookies próprios; não herda os do Brave |
| MESTRE | Orquestração, validação, handoff, gates | Confirma postcondição antes de relatar sucesso |
| Agent Bridge | Transporte local autenticado do Cockpit | Destino definido por instanceId e pane, somente loopback |
| GitHub | Repositórios, diffs e PRs | Leitura/edição de código deve ser comprovada pelo resultado; conexão OAuth não é prova de acesso |

**Instância testada:** `monitor` no Cockpit v0.7.6; pane `workspace`. É uma referência histórica de laboratório, não um identificador que novas sessões devam usar sem descobrir a instância ativa.

**Contas do navegador:** no teste o URL `/u/2` aberto do Brave redirecionou para `/u/0` no Cockpit; confirme identidade da conta no próprio Workspace. **Nunca infira que perfis, contas Google ou OAuth são compartilhados entre navegadores.** Não registre e-mails, tokens ou cookies no repositório público.

## Fluxo canônico: leitura individual de arquivo no Gemini

1. Descobrir a instância online do Cockpit e confirmar o painel `workspace`, o URL do Gemini, a conta Google correta e a ausência de envio pendente. Validar que a ponte não está pausada.
2. Abrir **Nova conversa** e confirmar que a conversa começa vazia. Preservar chats anteriores; não apagar histórico.
3. Confirmar o modelo pelo seletor **no próprio Gemini Web**. Durante a investigação de 17/11/2026, **Hydrogen** foi o perfil com respostas válidas. É nome de exibição do Gemini Web, **não é ID da Gemini API nem preferência universal do DSH**. Se o modelo mudar, registrar o modelo observado e repetir o teste.
4. Buscar o arquivo desejado no repositório real (GitHub ou worktree autorizada). Confirmar URL/ref, conteúdo esperado e, quando possível, SHA-256; não usar memória ou trechos inventados.
5. Preparar somente os arquivos autorizados para leitura. Para anexar localmente, usar o fluxo visível de **Envio e ferramentas → Arquivos/Enviar arquivos**. No Cockpit, a rota de upload exige que o arquivo esteja sob o diretório local `approved-uploads` da instância. Não enviar segredos ou arquivos de repositórios privados sem autorização específica.
6. Confirmar a presença do **anexo individual** no campo de composição. **Um arquivo por conversa de teste** para que os resultados sejam isoláveis. O anexo não é prova de leitura; o modelo precisa extrair campos exclusivos dele.
7. Enviar pergunta curta e verificável: “Leia exclusivamente o arquivo anexado, extraia estes campos/trechos, não consulte web ou memória, declare ausência de acesso em vez de inventar”. A confirmação HTTP de envio comprova apenas transporte, não conteúdo de resposta.
8. Aguardar término da geração e ler a resposta. Comparar **cada campo** com o arquivo-fonte recuperado independentemente do GitHub/worktree. Registrar PASS apenas para valores exatos. Uma explicação plausível sem confronto com a fonte = **UNVERIFIED**.
9. Registrar data, instância, modelo exibido, repo/ref, nome e hash do arquivo, URL/ID da conversa **somente em evidência privada**, comparação esperada/observada, erro se houver e decisão de fallback. Preservar a origem.
10. Para um segundo arquivo, criar **outra conversa limpa** e repetir. Não interpretar resultados de um ZIP/importação de repositório como equivalentes a leitura individual de texto.

### Prompt modelo para teste de arquivo

> MCF — TESTE DE LEITURA: leia **somente** o arquivo individual anexado. Extraia os seguintes valores textuais e cite o nome do arquivo; não consulte web, memória ou outro repositório. Se não conseguir acessar os bytes de texto, declare a limitação sem adivinhar. Não escreva nem publique nada. Encerre com marcador de PASS **apenas** se obteve os valores do anexo.

O marcador não é, isoladamente, evidência de PASS; conferir valores no repositório.

## Evidências E2E, 17 de novembro de 2026

**Fonte externa usada no confronto:** repositório público [leon337/mcf-dual-browser-cockpit](https://github.com/leon337/mcf-dual-browser-cockpit), branch `main`, aplicação v0.7.6.

### TESTE A — `package.json` individual: PASS

Um arquivo JSON público foi copiado para área local de upload aprovada, teve seus hashes comparados com a origem local e foi anexado sozinho em chat novo do Gemini Hydrogen. Agent Bridge confirmou envio com HTTP 200, e a resposta do Gemini foi conferida contra o `package.json` real da `main`:

| Campo | Extração do Gemini | Confronto |
| --- | --- | --- |
| `name` | `mcf-dual-browser-cockpit` | PASS |
| `version` | `0.7.6` | PASS |
| `main` | `src/main/main.mjs` | PASS |
| `engines.node` | `>=22.12.0` | PASS |
| `devDependencies.electron` | `44.2.0` | PASS |
| `scripts.test` | `npm run check && node --test test/*.test.mjs` | PASS |

Marcador na resposta: `MCF_GEMINI_JSON_READ_PASS`. Geração terminou e não mostrou erro `(13)`.

### TESTE B — `README.md` individual: PASS

Um segundo chat novo recebeu apenas `README.md`. O Gemini Hydrogen identificou corretamente:
- H1: `MCF Dual Browser Cockpit`;
- catálogo canônico: `capabilities/control-catalog.v1.json`;
- painéis: `LEANDRO / ChatGPT` à esquerda e `MESTRE / Workspace` à direita;
- engine: `Electron 44.2.0 + Chromium 152 + WebContentsView`;
- comando de verificação de sintaxe: `npm run check`.

Marcador: `MCF_GEMINI_README_READ_PASS`. Confronto com o `README.md` na `main`: 5/5 PASS. Geração terminou sem erro `(13)`. **A primeira seção do README ainda diz “0.7.5”, embora o `package.json` atual indique “0.7.6”: registrar a divergência documental em vez de mascará-la.**

**Resultado:** 2/2 testes independentes de leitura de arquivo **PASS**. Isto prova leitura de arquivo individual **naquela sessão**, não acesso automático ao repositório GitHub ou escrita.

## Descobertas e limitações — classificar corretamente

| Caso | Observação verificável | Conclusão prudente |
| --- | --- | --- |
| Conector GitHub Gemini | Conta GitHub apareceu conectada na interface do Workspace | OAuth conectado; **não** prova leitura/commit/PR |
| Repositório privado um repositório privado de laboratório (nome omitido) | Formulário de importação exibiu erro `(13)` | Falha inesperada; permissão privada é **hipótese**, não causa confirmada |
| Importação de repositório público | O repositório virou anexo e Gemini identificou ZIP/commit, mas declarou não conseguir ler `README.md`/`package.json` internos | Anexação de ZIP ≠ leitura semântica dos arquivos |
| Hydrogen com arquivos individuais | Leitura verificável do JSON e Markdown | Fallback validado no experimento |
| Argon | Usuário relatou instabilidade; houve erro `(13)` em fluxo anterior | Não afirmar que Argon causa o erro; testar com outras variáveis controladas |
| Agent Bridge — upload | `POST /v1/upload-file` retornou `500 internal_error` no TESTE A | Rota de upload não validada; não considerar esta parte estável |
| Upload alternativo autorizado | Anexo local feito via navegador/CDP com `DOM.setFileInputFiles` no controle de arquivo existente, somente para arquivos públicos aprovados | Recuperação diagnóstica pontual; **não** promover seletor efêmero ou CDP arbitrário a contrato canônico |

Referência de Google para o erro `(13)`: [ajuda sobre erros Gemini](https://support.google.com/gemini/answer/18647528?hl=pt), que o classifica como erro inesperado de processamento. A documentação não atribui o código, por si só, à privacidade do GitHub nem a um modelo específico.

A conexão GitHub do Gemini Web **não concede escrita Git/commit/PR**. Para publicar contribuições editoriais do Gemini, utilizar canal de handoff autorizado (por exemplo, Drive → MESTRE → GitHub, com gates), mantendo identidade do autor editorial e do publicador distintas. Esse procedimento não concede ao Gemini credenciais do GitHub.

## Incidentes e recuperação segura

**Erro `(13)` no Gemini:** registrar modelo exibido, tipo de anexo, público/privado, conversa, ação e erro. Tentar chat novo, anexos individuais, modelo disponível alternativo e rede conforme suporte Google; comparar em teste isolado. Não concluir causa sem evidência adicional.

**`message_send_unconfirmed` / HTTP 422 no Agent Bridge:** após clique possivelmente efetivo, **não reenviar cegamente**. Inspecionar a conversa e `GET /v1/message-recovery?pane=workspace`. A confirmação de transporte ou a ausência da mensagem pode ser transitória. Acknowledge não comprova que envio não ocorreu; só liberar após revisão adequada da evidência.

**Gemini em “Pensando…”:** `GET /v1/generation-status?pane=workspace` permite amostrar estado. Suspeita de estagnação pressupõe pelo menos 90 s sem mudança de assinatura de resposta, não um timeout isolado. Recuperação via `POST /v1/generation/recover` exige confirmação explícita e fingerprint igual, podendo demandar confirmação “Sim, cancelar” na UI. **Nunca cancelar resposta ativa automaticamente.**

**Painel vazio/menus não hidratados:** esperar renderização, atualizar snapshot semântico e confirmar pós-condições; não assumir seletor CSS, posição de botão ou texto localizado como contrato estável. Uma tentativa de `find-click` sem elemento visível não deve disparar clique por coordenadas adivinhadas.

**Falha no anexo individual:** preservar arquivo-fonte e, quando autorizado, oferecer conteúdo em texto puro ou upload manual pela interface. Marcar o caso como `BLOCKED/UNVERIFIED`, jamais PASS. Não contornar controle de segurança da ferramenta.

## Requisitos de aceitação para novas missões

- Descobriu e validou instância, pane, identidade de sessão e modelo efetivamente selecionado.
- Usa um chat novo, com fonte rastreável e um arquivo individual.
- Registra se o arquivo foi realmente anexado, se o envio foi confirmado e se a resposta terminou.
- Compara detalhes extraídos com a fonte, com verificações independentes.
- Não confunde `CI_GREEN`, OAuth ativo, ZIP anexado e resposta do Gemini com entrega validada de código.
- Trata erros, timeout, entrega incerta e ações com efeito mediante gates existentes.
- Devolve recibo curto com `PASSED`/`FAILED`/`UNVERIFIED`, evidência e limitações.
- Se essa metodologia já existe, **não pedir novamente a LEANDRO instruções de operação básica**; reler os documentos e verificar apenas o estado volátil real.

## Evoluções separadas (não implementadas por este manual)

1. Consertar `/v1/upload-file` e testar anexos JSON/MD reais de ponta a ponta via API aprovada, sem CDP externo.
2. Adicionar IDs semânticos para fluxos Gemini ao contrato `MCF-UI-SEMANTIC-CONTRACT`, com validação de controles por pós-condição. Este documento **não cria** IDs canônicos executáveis.
3. Instrumentar resultados de importação GitHub ZIP e erro `(13)`, distinguindo rede, permissão do app, arquivo e modelo.
4. Disponibilizar habilidade executável no catálogo do MCF apenas após runtime, testes, permissões e auditoria; **documentação ≠ skill executável**.
5. Avaliar replay e segurança ao persistir estado de envio incerto entre reinícios do Cockpit; preservar isolamento de instâncias e dados.

**Repositório e documentação fonte de verdade:** https://github.com/leon337/multiagent-collaboration-framework
