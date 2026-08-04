# MCF-DEC-053 — RC-001 — Bootstrap de Chats do Projeto

**Data:** 4 de agosto de 2026  
**Revisora por papel:** Emily — Auditoria Independente  
**Branch:** `docs/mcf-dec-053-project-bootstrap`  
**Estado:** concluída

## 1. Escopo

Auditar:

- decisão MCF-DEC-053;
- instrução curta para o projeto ChatGPT;
- arquivo canônico;
- checklist de startup;
- testes em chat totalmente novo;
- instruções de instalação;
- precedência e limites de autoridade;
- compatibilidade com MCF-DEC-050, 051 e 052.

## 2. Evidências examinadas

- `docs/decisions/MCF-DEC-053-INICIALIZACAO-AUTOMATICA-DE-CHATS-DO-PROJETO.md`;
- `project-instructions/MCF-CHATGPT-PROJECT-INSTRUCTIONS.txt`;
- `project-instructions/MCF-PROJECT-OPERATING-INSTRUCTIONS.md`;
- `project-instructions/MCF-STARTUP-CHECKLIST.yaml`;
- `project-instructions/MCF-CHAT-BOOTSTRAP-TESTS.md`;
- `project-instructions/README.md`.

## 3. Identidade e governança

O pacote registra corretamente:

- Leandro como autoridade humana;
- Léo como agente separado e autoridade operacional;
- Mestre como coordenador;
- 29 agentes oficiais;
- escalonamento humano restrito às matérias reservadas.

**Resultado:** PASS.

## 4. Execução e continuidade

A instrução curta preserva:

- ESEV;
- trabalho verificável;
- passagens intercaladas;
- loop orientado a objetivo;
- resposta única cronológica;
- CAF;
- gate de Léo;
- documentação por fase.

**Resultado:** PASS.

## 5. Skills e ferramentas

O pacote exige consulta ao registro de skills, à matriz dos agentes e à política de permissões antes de executar ferramenta.

A instrução também diferencia ferramenta instalada, conectada, aprovada e autorizada.

**Resultado:** PASS.

## 6. Precedência

A ordem documental é explícita e evita que documentos históricos substituam decisões vigentes.

**Resultado:** PASS.

## 7. Testabilidade

Foram definidos 14 cenários, scorecard, falhas críticas e registro de execução. Os testes cobrem identidade, seleção, ESEV, skills, ferramentas, fallback, CAF, PRF, gates e auditoria externa.

**Resultado:** PASS.

## 8. Limitações confirmadas

### LOW-01 — Instalação no ChatGPT permanece manual

O repositório não altera automaticamente o campo de Instruções do projeto nem adiciona arquivos ao projeto ChatGPT.

### LOW-02 — Aplicação ainda não comprovada em chat novo

O pacote está pronto, mas o bootstrap somente será comprovado depois da instalação e da execução dos testes.

### LOW-03 — Acessibilidade dos arquivos depende do contexto

Um chat pode não conseguir acessar automaticamente todos os caminhos do GitHub. O pacote exige declarar a limitação e não inventar leitura.

### LOW-04 — Atualizações exigem sincronização entre duas superfícies

Mudanças na `main` não atualizam automaticamente a cópia adicionada ao projeto ChatGPT.

### LOW-05 — Limites do campo de instruções podem variar

A instrução curta foi mantida compacta, mas a interface deve aceitar seu conteúdo integral. Caso haja limite, a redução deve preservar invariantes críticas e referência ao arquivo canônico.

## 9. Não conformidades

```yaml
critical: 0
high: 0
medium: 0
low: 5
merge_blocked: false
```

## 10. Veredito

```text
PASS_WITH_MINOR_RESERVATIONS
```

## 11. Recomendação

```yaml
decision_recommended: APROVAR_COM_RESSALVAS
merge_reversivel: AUTORIZAR_APOS_CI
installation_step: MANUAL_REQUIRED
new_chat_tests: REQUIRED_AFTER_INSTALLATION
human_gate_for_documental_merge: false
```