# MCF-DEC-012 — RC-001 — Núcleo de Qualidade Contínua de Código

**Data:** 2 de agosto de 2026  
**Revisora:** Emily — Auditoria Independente  
**Artefato revisado:** `docs/decisions/MCF-DEC-012-NUCLEO-DE-QUALIDADE-CONTINUA-DE-CODIGO.md`  
**Estado:** concluído

## 1. Objetivo

Verificar se a decisão:

- responde à lacuna identificada por Leandro;
- cria agentes com funções e habilidades claras;
- evita sobreposição crítica com agentes existentes;
- estabelece controles contra correções sobrepostas;
- preserva seleção dinâmica;
- mantém autorizações operacionais limitadas;
- apresenta contagem coerente.

## 2. Quantidade e identidade

```yaml
agentes_anteriores: 22
novos_agentes: 3
total: 25
resultado_aritmetico: PASS
```

Os nomes Vinícius, Patrícia e Lucas não colidem com os 22 agentes anteriormente nomeados.

**Resultado:** PASS

## 3. Cobertura da lacuna

| Lacuna identificada | Agente responsável | Resultado |
|---|---|---|
| revisão estrutural e refatoração | Vinícius | PASS |
| debugging e causa raiz | Patrícia | PASS |
| manutenibilidade e performance | Lucas | PASS |

A decisão amplia a equipe para além da geração inicial de código, incluindo compreensão, diagnóstico, refinamento e manutenção contínua.

**Resultado:** PASS

## 4. Fronteiras funcionais

Foram preservadas as responsabilidades de:

- Sofia na arquitetura;
- Rafael na engenharia integrada;
- especialistas na implementação por camada;
- Renato em testes;
- Ricardo em segurança;
- Gabriel em integração e release;
- Emily na auditoria independente.

Os novos agentes possuem competências complementares e não substituem os agentes existentes.

**Resultado:** PASS

## 5. Protocolo contra código sobre código

A decisão exige:

- leitura da implementação atual;
- identificação de dependências;
- verificação de duplicação;
- reprodução do problema;
- registro de causa ou necessidade;
- testes de proteção;
- alteração mínima;
- revisão do diff;
- regressão;
- remoção do código substituído;
- atualização de evidências.

O protocolo trata diretamente o risco apresentado por Leandro.

**Resultado:** PASS

## 6. Refatoração e funcionalidade

A separação recomendada entre testes de caracterização, refatoração, implementação e regressão reduz risco e melhora auditabilidade.

A decisão também exige justificativa quando essa separação não for possível.

**Resultado:** PASS

## 7. Autorizações

A decisão autoriza somente:

- criação metodológica dos agentes;
- formalização das funções;
- versionamento no PR Draft;
- revisão crítica.

Não autoriza:

- implementação de software;
- alteração de código de produto;
- deploy;
- merge;
- publicação automática.

**Resultado:** PASS

## 8. Ressalvas

### LOW-01 — Matriz consolidada ainda desatualizada

A equipe passa a ter 25 agentes, mas ainda não existe uma matriz única e versionada contendo competências, fronteiras e gatilhos de convocação de todos eles.

### LOW-02 — Templates operacionais ainda não foram criados

A decisão recomenda modelos para:

- relatório de causa raiz;
- revisão de código;
- plano de refatoração;
- análise de desempenho.

A ausência desses modelos não impede a formalização dos agentes, mas limita a padronização imediata de futuras execuções.

### LOW-03 — Critérios quantitativos dependem do projeto

Métricas como complexidade, cobertura e desempenho precisam ser definidas por projeto. Não devem ser transformadas em limites universais sem contexto.

## 9. Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
critical: 0
high: 0
medium: 0
low: 3
novos_agentes: 3
total_disponivel: 25
```

A MCF-DEC-012 está adequada para permanecer versionada no PR Draft.

## 10. Próximo gate

- manter o PR #15 como Draft;
- não realizar merge sem autorização explícita de Leandro;
- produzir futuramente a matriz consolidada dos 25 agentes;
- criar os templates operacionais do núcleo de qualidade contínua.