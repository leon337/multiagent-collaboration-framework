# MCF Agent Studio — MVP 0.1

Editor conversacional e visual para o Hello World Agent do DeepSeek Harness. Missão oficial: https://github.com/leon337/multiagent-collaboration-framework/issues/467

## Executar no Linux Mint

Node.js >= 22. Sem instalação de dependências:

    cd "/home/leo/MCF MISSIONS/mcf-chatgpt-workspace/apps/mcf-agent-studio"
    npm start

Abra http://127.0.0.1:4317 no navegador.

Testes: npm test. Sintaxe: npm run check.

## Fluxo

1. Digite: Altere a resposta para "Bom dia!". Clique Gerar proposta.
2. Confira o Antes/Depois e clique Aplicar ao rascunho.
3. Teste com oi. A prévia responderá Bom dia!.
4. Peça: Adicione a ferramenta calculadora. Aplique. Teste com calcule 8*7.
5. Em Versões, restaure uma revisão anterior. É criada uma nova revisão, sem apagar o histórico.
6. Exporte o JSON do rascunho. Isso NÃO publica no Harness.

Você também pode editar nome, modo, resposta, instruções e ferramentas pelo painel visual.

## Modos de inteligência

Modo guiado offline: regras interpretam comandos em português para resposta fixa, modo eco, modo conversacional, calculadora e relógio. Não é um modelo de IA.

Modo IA via 9Router: em Configurar conexão informe modelo e chave, e marque Usar IA via 9Router. A chave fica somente na memória do servidor e não é salva nos arquivos. O 9Router é usado para propostas e modo conversacional, com validação do JSON retornado. Sem chave, o modo guiado continua funcional.

## Arquitetura

    UI (chat + painel visual + diff + testes)
             ↓
    Servidor Node.js / localhost:4317
             ↓
    Interpretador guiado OU modelo 9Router
             ↓
    Schema de alterações (campos e ferramentas permitidos)
             ↓
    Proposta → revisão → aceitar → histórico JSON / rollback
             ↓
    Simulação de resposta e ferramentas permitidas (sandbox)

O aplicativo não grava no agente original e não altera o perfil ativo DSH. Os caminhos AGENT_STUDIO_AGENT e AGENT_STUDIO_PROFILE são lidos para checagem de disponibilidade, apenas.

API: GET /health; GET /api/state; POST /api/provider; POST /api/propose; POST /api/apply; POST /api/restore; POST /api/preview; GET /api/export.

Variáveis de ambiente opcionais: AGENT_STUDIO_PORT (4317), AGENT_STUDIO_DATA (arquivo de estado), AGENT_STUDIO_AGENT, AGENT_STUDIO_PROFILE, AGENT_STUDIO_API_KEY, AGENT_STUDIO_MODEL.

## Limitações do MVP

- Não gera código JavaScript arbitrário nem instala automaticamente novos plugins;
- Permite somente calculadora e relógio no laboratório;
- O modo conversacional depende de modelo válido no 9Router;
- Não publica no DeepSeek Harness. Exportação é JSON de rascunho, NÃO bundle instalável;
- Sem login multiusuário ou hospedagem remota. Bind estrito a 127.0.0.1.

Segurança: allowlist de ferramentas e campos, sem eval, sem shell via prompt, CSP restritiva, Origin/Host checks, limite de requisição, persistência apenas do rascunho em .data/state.json (gitignore).

O projeto fica na branch feat/mcf-agent-studio-mvp-001 do MCF. Não há autorização implícita para merge ou deploy público.
