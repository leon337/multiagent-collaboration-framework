# RC-001 — MCF-PROP-005 Cartão de Continuidade Acionável

**Data:** 2 de agosto de 2026  
**Revisora:** Emily  
**Objeto:** `MCF-PROP-005 — Cartão de Continuidade Acionável`  
**PR:** #15  
**Commit revisado:** `0e13ad2c1ca60cbed295f3816333fbd1523bc167`

## 1. Escopo

A revisão verificou se a proposta:

- reduz a necessidade de leitura integral;
- distingue decisão do Léo, continuidade da equipe e bloqueio;
- fornece ação objetiva;
- mantém o Mestre como ponte;
- preserva rastreabilidade e artefatos;
- evita bastões extensos;
- evita autorização humana desnecessária.

## 2. Achados positivos

### 2.1 Ação imediatamente visível

O cartão aparece no topo e permite identificar a próxima ação antes da análise detalhada.

### 2.2 Três estados suficientes

Os tipos `AÇÃO DO LÉO`, `CONTINUIDADE AUTOMÁTICA` e `FLUXO BLOQUEADO` cobrem os estados de continuidade necessários sem criar taxonomia excessiva.

### 2.3 Recomendação do Mestre

Quando existe gate humano, o Mestre precisa recomendar uma opção, evitando transferir ao Léo o trabalho de interpretar toda a análise.

### 2.4 Resposta exata

O campo `Responda apenas` torna a decisão operacional e reduz mensagens ambíguas.

### 2.5 Continuidade entre agentes

Quando nenhuma decisão humana é necessária, o cartão encaminha diretamente o próximo agente, a ação e o artefato essencial.

## 3. Ressalvas

### L-01 — Limite visual

O cartão deve permanecer curto. Recomenda-se no máximo três linhas de conteúdo, além do título.

### L-02 — Linguagem imperativa

A ação deve começar com verbo de execução, por exemplo: `Revise`, `Versione`, `Aprove`, `Corrija` ou `Aguarde`.

## 4. Contagem

```yaml
critical: 0
high: 0
medium: 0
low: 2
```

## 5. Veredito

```text
PASS_WITH_MINOR_RESERVATIONS
```

A proposta é mais eficiente que o bastão extenso da MCF-DEC-004 e está apta para decisão do Léo.

## 6. Gate

A proposta ainda não está aprovada. O merge permanece não autorizado.
