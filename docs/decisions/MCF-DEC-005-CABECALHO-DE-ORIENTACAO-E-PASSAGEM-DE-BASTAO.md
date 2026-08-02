# MCF-DEC-005 — Cabeçalho de Orientação e Passagem de Bastão

**Data:** 2 de agosto de 2026  
**Autoridade da decisão:** Léo  
**Estado:** aprovado para versionamento e revisão crítica  
**Relacionadas:** `MCF-DEC-002`, `MCF-DEC-003`

## 1. Decisão

Fica aprovado o padrão obrigatório para mensagens operacionais composto por três partes:

1. cabeçalho de orientação no início;
2. trabalho visível, evidências e artefatos no corpo;
3. passagem de bastão no final.

O padrão substitui a proposta de cartão único e a regra anterior de bastão isolado.

## 2. Cabeçalho de orientação

Toda mensagem operacional deve começar com:

```text
╭─ CABEÇALHO DE ORIENTAÇÃO ───────────────
│ Objetivo: [o que esta mensagem resolve]
│ Estado: [análise, execução, revisão, bloqueio ou conclusão]
│ Responsável atual: [agente]
│ Decisão necessária: [nenhuma ou ação do Léo]
╰──────────────────────────────────────────
```

Finalidade:

- permitir compreensão antes da leitura integral;
- informar o objetivo;
- mostrar o estado do fluxo;
- identificar o responsável atual;
- indicar imediatamente se Léo precisa decidir algo.

## 3. Corpo da mensagem

O corpo mantém, quando aplicável:

- contrato da missão;
- trabalho visível dos agentes;
- pesquisas e consultas;
- achados;
- análises;
- decisões;
- artefatos;
- evidências;
- RC;
- decisão do Mestre.

O cabeçalho não substitui o detalhamento.

## 4. Passagem de bastão

Toda mensagem operacional deve terminar com:

```text
╭─ PASSAGEM DE BASTÃO ────────────────────
│ De: [agente atual]
│ Para: [próximo agente ou Léo]
│ Entrega: [resultado ou artefato]
│ Próxima ação: [verbo + ação objetiva]
╰──────────────────────────────────────────
```

Finalidade:

- indicar quem concluiu a etapa;
- identificar quem recebe o trabalho;
- apontar qual material foi entregue;
- definir uma próxima ação inequívoca.

## 5. Regras

- cabeçalho e bastão são obrigatórios em mensagens operacionais;
- o cabeçalho aparece antes de qualquer conteúdo extenso;
- o bastão aparece após a decisão e os artefatos;
- o cabeçalho orienta a leitura e não resume todo o corpo;
- o bastão orienta a continuidade e não repete toda a mensagem;
- a próxima ação deve começar com verbo direto;
- quando a ação for de Léo, deve ser apresentada de modo claro;
- quando a equipe puder continuar, o próximo agente deve ser nomeado;
- mensagens simples podem usar versão reduzida, preservando objetivo e continuidade;
- nenhuma mensagem operacional pode terminar sem próximo responsável e próxima ação.

## 6. Fluxo visual

```text
CABEÇALHO DE ORIENTAÇÃO
↓
TRABALHO VISÍVEL DOS AGENTES
↓
ARTEFATOS E EVIDÊNCIAS
↓
DECISÃO DO MESTRE
↓
PASSAGEM DE BASTÃO
```

## 7. Estado normativo

```text
CABECALHO_NO_INICIO=OBRIGATORIO
CORPO_DETALHADO_NO_MEIO=OBRIGATORIO_QUANDO_OPERACIONAL
PASSAGEM_DE_BASTAO_NO_FINAL=OBRIGATORIA
CARTAO_UNICO_ANTERIOR=SUBSTITUIDO
BASTAO_ISOLADO_ANTERIOR=SUBSTITUIDO
PROXIMO_RESPONSAVEL=OBRIGATORIO
PROXIMA_ACAO=OBRIGATORIA
```

## 8. Autorizações

```yaml
registro_metodologico: autorizado
versionamento_em_branch: autorizado
revisao_critica: autorizada
merge_na_main: nao_autorizado
implementacao_de_software: nao_autorizada
```
