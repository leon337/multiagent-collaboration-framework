# MCF-CONTENT-LAB-001 — Contrato da Missão

## Estado

- **Missão:** `MCF-CONTENT-LAB-001`
- **Estado:** `ATIVA`
- **Branch:** `mission/mcf-video-gemini-content-lab-20260825`
- **Base da branch:** `main@85ccf418740e78b5e1e3eeb7742baf6f869978c1`
- **Release pública verificada na abertura:** `MCF v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`
- **Continuidade:** incorpora a trilha anterior `MCF-VIDEO-AUDIT-001` sem apagar seu histórico.

## Objetivo

Estudar de forma verificável como o Gemini/NotebookLM lê e interpreta o repositório do MCF e transforma esse conhecimento em vídeo e outros conteúdos, usando o caso atual para:

1. concluir a auditoria técnica do vídeo já gerado;
2. identificar lacunas de apresentação do MCF para humanos e IAs;
3. investigar o processo verificável usado pelo Gemini para selecionar, simplificar e organizar o conteúdo;
4. testar melhorias de documentação por experimentos repetidos e comparativos;
5. amadurecer, somente após evidência suficiente, um protocolo de validação de conteúdo gerado por IA;
6. estudar uma arquitetura de repositório de conhecimento e futura fábrica de conteúdo em português para o público brasileiro;
7. formalizar padrões operacionais recorrentes como skills do MCF, incluindo `ALINHAR` e `ESTRUTURAR MISSÃO`;
8. mapear e construir um App/connector próprio NotebookLM ↔ ChatGPT para recuperar, com autorização e proveniência, o máximo possível de fontes, conversas, citações, prompts, transcrições, artefatos e exportações oficialmente acessíveis.

## Fonte de verdade

Ordem de precedência para esta missão:

1. instrução explícita atual de LEANDRO;
2. estado verificável live do GitHub/provider quando aplicável;
3. código, testes, workflows e evidências do SHA aplicável;
4. protocolos e decisões vigentes do MCF;
5. documentação histórica;
6. documentação oficial do Google/OpenAI para capacidades mutáveis de NotebookLM, Gemini Notebook Enterprise e Apps SDK;
7. saídas do Gemini/NotebookLM tratadas como objeto de análise, nunca como fonte canônica do MCF.

## Escopo

Incluído:

- vídeo `MCF: Execução Real de IA` e seus artefatos derivados;
- conteúdo visual, narração/transcrição quando disponível, terminologia, arquitetura, governança e qualidade didática;
- leitura do repositório por humanos e IAs;
- apresentação pública em português;
- experimentos repetidos e A/B;
- desenho de protocolo após evidência suficiente;
- desenho da futura fábrica de conteúdo e do repositório de conhecimento;
- desenho e validação das skills recorrentes identificadas durante a missão;
- inventário de capacidades do NotebookLM pessoal e Gemini Notebook Enterprise;
- projeto e MVP de App ChatGPT/MCP para integração com NotebookLM por mecanismos permitidos;
- uso de exportações oficiais para Google Docs/Sheets/Drive quando aplicável;
- avaliação de uma extensão de navegador companheira multiplataforma caso a UI pessoal não disponha de API pública suficiente.

## Fora do escopo por enquanto

- alterar identificadores técnicos ou APIs apenas para eliminar termos em inglês;
- publicar protocolo definitivo antes dos experimentos e da auditoria completa;
- tratar explicação do Gemini sobre sua própria linha de raciocínio como evidência de raciocínio interno;
- criar dependência arquitetural obrigatória de um único fornecedor de IA;
- coletar senha, cookie, token de sessão ou credencial do usuário para automatizar NotebookLM;
- contornar autenticação, paywall, controle de acesso ou limite comercial;
- depender de endpoints privados/ocultos não documentados sem análise explícita de termos, risco e necessidade;
- merge em `main`, release ou deploy de produção sem os gates aplicáveis.

## Invariante de controle da missão

**Nenhum item do `ROADMAP.md` pode ser considerado concluído enquanto o `CHECKLIST.md` não tiver sido atualizado no mesmo checkpoint operacional com estado, evidência e próxima ação.**

Forma operacional:

```text
ITEM DO ROADMAP
      ↓
EXECUÇÃO
      ↓
EVIDÊNCIA
      ↓
VALIDAÇÃO
      ↓
ATUALIZAÇÃO DO CHECKLIST
      ↓
CONCLUÍDO
```

Se o roadmap mudar, a alteração deve ser refletida também no checklist antes de continuar a execução.

## Critérios de aceite da missão

A missão só poderá ser encerrada quando:

- a auditoria do vídeo estiver concluída com evidência e limitações explícitas;
- o processo verificável do Gemini tiver sido investigado sem alegar acesso a raciocínio privado;
- houver diagnóstico da apresentação atual do MCF para humanos e IAs;
- os experimentos planejados tiverem resultados comparáveis;
- o protocolo de validação de conteúdo tiver sido derivado dos achados e revisado;
- a estratégia de português para conteúdo público estiver definida sem quebrar rastreabilidade técnica;
- a arquitetura inicial da fábrica/repositório de conhecimento estiver documentada;
- as skills `ALINHAR` e `ESTRUTURAR MISSÃO` estiverem desenhadas, avaliadas e com decisão explícita sobre integração ao registro canônico;
- a matriz de capacidades do NotebookLM estiver documentada distinguindo API oficial, exportação oficial, UI visível e itens não verificados;
- houver um MVP ou uma decisão técnica fundamentada sobre o App/connector NotebookLM ↔ ChatGPT, com fronteiras de segurança explícitas;
- `ROADMAP.md` e `CHECKLIST.md` estiverem reconciliados;
- pendências, riscos e decisões futuras estiverem explicitamente registradas.

## Artefatos de controle

- `MISSAO.md` — contrato, escopo e critérios;
- `ROADMAP.md` — plano cronológico e entregas;
- `CHECKLIST.md` — estado operacional, evidências e próximo passo.
