# MCF WhatsApp DSH — Meta número de teste (ciclo 4)
Data: 2026-10-25 · Estado: AGUARDANDO_PROVISIONAMENTO_META

## Prova real de progressão após aceite do titular
- LEANDRO informou que clicou em **Continuar** na tela que apresentava os termos da Meta.
- Meta for Developers, app legado tipo Empresa **Caldinho da Lu**, App ID **282011559918249**, portfólio autorizado **Cheap Delivery**, Business ID **117417843155171**.
- A tela abriu **Etapa 1. Experimente** no caminho /whatsapp-business/api-testing-v2. A Meta disponibilizou o controle **Reivindicar número de teste** (até 5 destinatários após provisionar).
- O assistente clicou em **Reivindicar número de teste** e a Meta mostrou literalmente **Ocorreu um erro ao criar a conta de teste. Tente novamente.**
- Uma segunda tentativa pelo botão também falhou. Após recarregar a página, **Nenhum número de telefone disponível para este app** e o comando de provisionamento continuaram visíveis. Não apareceu Phone Number ID, remetente de teste, WABA test ID nem token.

## Investigações
- A app teve seu acesso restaurado após desativação por inatividade superior a 90 dias e está em modo de desenvolvimento.
- No portfólio Cheap Delivery, a conta Meta pessoal administradora está restrita desde 2021; essa restrição pode ser relevante para o provisionamento, mas a mensagem de erro não informa a causa técnica exata.
- Existem dois administradores completos: o perfil autenticado Leandro Carlos ativo e outro identificador IG Leandro Carlos (@leonpcsn) marcado como inativo. Não se presumiu elegibilidade do segundo perfil nem se tentou obter sessões de terceiros.
- O app alternativo **teladeloginsocial** (477855353993652) teve acesso por inatividade restaurado para comparação; é tipo **Nenhum** e não lista o produto WhatsApp, portanto não resolveu o problema.
- A Etapa 2 (produção) solicita registrar telefone real e adicionar pagamento para mensagens iniciadas pela empresa. Essas etapas não foram executadas; a missão permanece em modo gratuito de teste.
- Ferramenta oficial de Relatar Bug da Meta aberta; seletor **Seus aplicativos ativos** não listou apps, impedindo associar o relato corretamente. Não foi enviado um bug report impreciso.
- Relatos independentes de 2026 descrevem falha semelhante de 'Claim test number' e divergência entre o painel e o WhatsApp Manager, mas não permitem concluir que isso explica o nosso caso. Fontes públicas: https://www.reclameaqui.com.br/whatsapp/bug-no-painel-de-desenvolvedor-do-whatsapp-business-api-impede-uso-de-numero-de-teste-e-canais-de-suporte_aK4P-ROujVQm6lr0/ ; https://www.reddit.com/r/WhatsappBusinessAPI/comments/1xevc7f/meta_whatsapp_cloud_api_test_number_cannot_be/

## Infraestrutura preservada
- Callback HTTPS **https://mcf-leo-n43sm.tail582305.ts.net/webhook**, token de verificação já criado localmente, desafio real externo aprovado. POST/bootstrap 503 em modo fail-closed até configurar Meta e IA.
- App Meta possui aba Webhooks > Whatsapp Business Account; a URL do callback pode ser inserida, mas salvar requer a verificação com token privado. Nenhum segredo foi publicado nem dados de chat enviados.
- DSH perfil dedicado selecionou **nvidia/stepfun-ai/step-5-preview** via 9Router; houve encaminhamento comprovado a NVIDIA, mas testes de inferência real excederam 60s/130s sem resposta final.
- A branch feature e PR #476 permanecem draft; os serviços de Nilton Bebidas e outros apps Meta anteriores preservados.

## Próximo passo verificável
1. Resolver a elegibilidade/provisionamento Meta com suporte do fabricante ou administração legítima elegível; confirmar um WABA de teste real e Phone Number ID em WhatsApp Manager antes de repetir tentativas em massa.
2. Registrar callback + verify token no app e assinar evento messages; validar GET oficial e POST HMAC real em endpoint isolado.
3. Registrar até um destinatário de teste autorizado e enviar/receber a primeira mensagem após confirmar Step 5 via 9Router. Não informar produção pronta antes do E2E PASS.

## Governaça e riscos
- Não criar perfis falsos, não cadastrar cartão ou telefone de produção sem autorização e não remover WABAs/números para 'destravar' UI.
- Não inferir sucesso de 15 testes simulados, do HTTP 200 público, nem da presença de rota Step5; nenhum destes comprova conversa WhatsApp real.
