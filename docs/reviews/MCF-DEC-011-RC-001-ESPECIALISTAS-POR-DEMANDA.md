# MCF-DEC-011 — RC-001 — Especialistas por Demanda

**Data:** 2 de agosto de 2026  
**Revisora:** Emily — Auditoria Independente  
**Artefato revisado:** `docs/decisions/MCF-DEC-011-NOMEACAO-DOS-ESPECIALISTAS-POR-DEMANDA.md`  
**Estado:** concluído

## 1. Objetivo da revisão

Verificar se a decisão:

- nomeia os cinco especialistas anteriormente mantidos sem identidade;
- define função, responsabilidades e habilidades;
- preserva fronteiras com os 17 agentes do núcleo permanente;
- mantém a seleção dinâmica por competência;
- apresenta contagem coerente;
- não amplia autorizações operacionais indevidamente.

## 2. Verificações

### 2.1 Quantidade

```yaml
agentes_do_nucleo: 17
novos_agentes_por_demanda: 5
total: 22
resultado_aritmetico: PASS
```

Leandro permanece fora da contagem por ser a autoridade humana.

### 2.2 Identidade

Os nomes Eduardo, Helena, André, Tiago e Daniela não colidem com os 17 agentes já nomeados.

**Resultado:** PASS

### 2.3 Cobertura das especialidades

| Especialidade prevista | Agente nomeado | Resultado |
|---|---|---|
| Backend | Eduardo | PASS |
| Frontend | Helena | PASS |
| Mobile | André | PASS |
| IA e Machine Learning | Tiago | PASS |
| Dados | Daniela | PASS |

### 2.4 Funções e habilidades

Cada agente possui:

- função declarada;
- responsabilidades operacionais;
- habilidades técnicas;
- fronteiras com agentes existentes;
- condições de acionamento.

**Resultado:** PASS

### 2.5 Sobreposição de responsabilidades

As principais fronteiras foram explicitadas:

- Eduardo versus Rafael, Sofia, Manoel e Ricardo;
- Helena versus Evelyn, Laura, Isabela, Marina e Rafael;
- André versus Rafael, Bruno e Gabriel;
- Tiago versus Sofia, Rafael, Ricardo e Renato;
- Daniela versus Manoel, Tiago e Ricardo.

Não foi identificada sobreposição crítica sem tratamento.

**Resultado:** PASS

### 2.6 Autorizações

A decisão cria identidades e competências, mas não autoriza implementação, alteração de código, credenciais, deploy, merge ou consumo pago.

**Resultado:** PASS

## 3. Ressalvas

### LOW-01 — Perfis comportamentais ainda não definidos

A decisão define identidade profissional, função e habilidades, mas não define personalidade, estilo de comunicação ou instrução-base de cada novo agente.

Isso não bloqueia sua disponibilidade funcional. Esses elementos podem ser formalizados em uma decisão posterior caso o framework passe a executar instâncias independentes desses agentes.

### LOW-02 — Matriz geral de competências precisa ser atualizada

A decisão contém as novas competências, mas ainda não existe uma matriz única consolidando os 22 agentes.

Isso não invalida a nomeação, porém a matriz consolidada deverá ser produzida para reduzir ambiguidades futuras de roteamento.

## 4. Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
critical: 0
high: 0
medium: 0
low: 2
agentes_nomeados: 5
total_disponivel: 22
```

A MCF-DEC-011 está adequada para permanecer versionada no PR Draft.

## 5. Próximo gate

- manter o PR #15 como Draft;
- não realizar merge sem autorização explícita de Leandro;
- considerar como trabalho futuro a matriz consolidada dos 22 agentes e os perfis comportamentais dos cinco novos especialistas.
