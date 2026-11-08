# MCF — Instruções de inicialização para agentes (AGENTS.md)

> Escopo: todo o repositório. Entrada concisa para novos chats/sessões do **MESTRE** e agentes do MCF. Não substitui os contratos de governança nem altera o papel de LEANDRO como autoridade humana final.

## Identidade e precedência

- **LEANDRO**: humano e autoridade final. **MESTRE**: orquestrador responsável. **LÉO**: agente distinto de LEANDRO.
- Fonte de verdade: este repositório, especialmente [docs/MCF-CURRENT-STATE.md](docs/MCF-CURRENT-STATE.md). Para branches, CI, PRs, deploys e releases, consultar o GitHub ao vivo; não afirmar estado atual a partir de documentação histórica.
- Em conflitos: instrução explícita atual de LEANDRO > estado real do GitHub > documentação vigente > conversa > lembranças antigas.
- Nenhuma alteração em produção, ação destrutiva ou contorno de gate decorre da seleção de modelos.

## Memória reutilizável: seleção de modelos

**Antes de selecionar modelo/provedor para uma missão nova**, ler:
[docs/operations/MCF-GOOGLE-MODEL-ROUTING.md](docs/operations/MCF-GOOGLE-MODEL-ROUTING.md).

Padrões iniciais **condicionais à disponibilidade e ao tipo de tarefa**:

- **Agente executor, código, raciocínio e ferramentas:** `gemini-3.8-flash`; fallback compatível previamente validado.
- **Conversa de voz em tempo real (MESTRE/DSH de LEANDRO):** `gemini-3.1-flash-live-preview` (rótulo “Gemini 3 Flash Live” do AI Studio); alternativa `gemini-2.5-flash-native-audio-preview-12-2025`. 3.8 Live não é padrão nesse projeto.
- **Voz com planejamento e raciocínio mais profundo:** `gemini-3.8-live-extended-thinking`, somente por escolha explícita após verificar quota.
- **Transcrição ao vivo:** `gemini-3.5-transcribe-live`.
- **Tradução de voz ao vivo:** `gemini-3.5-live-translate-preview`.
- **Experimentação com Gemma, música Lyria ou APIs Live legadas:** somente quando a tarefa justificar e o endpoint estiver confirmado.

**Não interpretar o painel do Google AI Studio como prova de que qualquer chave, projeto ou SDK suporta todos esses modelos.** Descobrir modelos, modalidades, quotas, custos e contratos de ferramentas no momento da execução. Nunca incluir uma chave de API no Git, em logs ou em prompts.

Se a fonte de verdade estiver indisponível, declarar a limitação; não inventar um modelo, ID, disponibilidade ou fallback.

## Operação governada

Seguir os contratos de permissão, handoff, HUMAN_GATE, memória, validação e evidências do MCF. Para navegação no ChatGPT/Cockpit, consultar também [MCF-UI-OPERATING-MANUAL](docs/operations/MCF-UI-OPERATING-MANUAL.md).

**Alcance desta mudança:** documenta uma preferência durável e seu ponto de leitura; não implementa roteamento automático no runtime, não provisiona quota e não substitui instruções de um sistema externo que não carregue este arquivo.
