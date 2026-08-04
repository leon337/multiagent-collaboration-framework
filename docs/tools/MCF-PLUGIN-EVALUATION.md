# Protocolo de Avaliação de Plugins — MCF

**Versão:** 1.0  
**Responsáveis:** Beatriz, Júlia, Miriam e Emily  
**Gate:** Léo

## 1. Objetivo

Impedir que um plugin seja incorporado ao trabalho dos agentes apenas porque está instalado ou aparece no catálogo.

## 2. Estados

```yaml
DISCOVERED: encontrado no catálogo ou interface
CONNECTED: autenticação ou conexão concluída
AVAILABLE: ferramenta exposta no contexto atual
EXPERIMENTAL: uso permitido somente em testes controlados
APPROVED: aprovado para skills específicas
APPROVED_WITH_RESTRICTIONS: aprovado com limites adicionais
UNAVAILABLE: não exposto ou não conectável no contexto
REJECTED: risco, sobreposição ou ausência de benefício
DEPRECATED: substituído por outra ferramenta
```

## 3. Ficha obrigatória

```yaml
plugin_evaluation:
  plugin_name:
  canonical_id:
  observed_status:
  purpose:
  vendor:
  owner_agents: []
  candidate_skills: []
  data_read: []
  data_write: []
  external_actions: []
  sensitive_data: []
  overlap_with: []
  primary_or_alternative:
  permission_profile:
  required_evidence: []
  fallback:
  positive_tests: []
  negative_tests: []
  security_findings: []
  governance_findings: []
  score:
  verdict:
  reviewed_by: []
  leo_gate:
```

## 4. Critérios e pesos

| Critério | Peso |
|---|---:|
| finalidade clara | 10 |
| agente proprietário definido | 10 |
| skill associada | 10 |
| benefício sobre ferramentas existentes | 10 |
| acesso a dados proporcional | 10 |
| ações de escrita compreendidas | 10 |
| evidência verificável | 10 |
| fallback definido | 10 |
| teste positivo aprovado | 10 |
| teste negativo e contenção aprovados | 10 |

## 5. Vereditos

```yaml
APPROVED:
  minimum_score: 90
  critical_findings: 0

APPROVED_WITH_RESTRICTIONS:
  minimum_score: 75
  critical_findings: 0

EXPERIMENTAL:
  minimum_score: 60
  usage: isolated_tests_only

REJECTED:
  score_below: 60
  or_critical_finding: true
```

## 6. Falhas críticas

Independentemente da pontuação:

- acesso desproporcional sem controle;
- escrita externa irreversível sem gate;
- impossibilidade de identificar o que foi alterado;
- ausência de evidência verificável;
- comportamento diferente do declarado;
- exposição de segredos;
- exclusão ou publicação automática;
- identidade do fornecedor ou finalidade incerta;
- ferramenta que induz execução incompatível com as decisões MCF.

## 7. Teste mínimo

### Teste positivo

1. usar o plugin numa tarefa pequena e autorizada;
2. confirmar resultado;
3. registrar identificador e evidência;
4. verificar passagem de bastão;
5. comparar com ferramenta primária existente.

### Teste negativo

1. solicitar ação fora do escopo;
2. confirmar bloqueio ou pedido de autorização;
3. testar indisponibilidade;
4. verificar fallback;
5. confirmar que nenhuma execução foi inventada.

## 8. Sobreposição

Quando dois plugins têm a mesma finalidade:

```text
COMPARAR BENEFÍCIO
→ ESCOLHER PRIMÁRIO
→ DEFINIR ALTERNATIVA
→ REGISTRAR GATILHO DE SUBSTITUIÇÃO
→ PROIBIR USO DUPLO SEM HIPÓTESE
```

Exemplos:

- Granola, Fireflies e MeetGeek;
- PostHog, Amplitude e Mixpanel;
- Consensus e Sider Scholar;
- Figma, Canva e Product Design.

## 9. Auditoria

Emily deve verificar:

- se testes realmente ocorreram;
- se o acesso observado corresponde ao declarado;
- se o plugin possui proprietário;
- se o plugin foi incluído na matriz;
- se a permissão está documentada;
- se o fallback existe;
- se o veredito decorre das evidências.

## 10. Gate de Léo

```yaml
leo_gate:
  decisions:
    - APPROVE
    - APPROVE_WITH_RESTRICTIONS
    - KEEP_EXPERIMENTAL
    - REJECT
    - REQUEST_MORE_EVIDENCE
  required_output:
    decision:
    justification:
    owner_agents: []
    allowed_skills: []
    permission_profile:
    next_review_date:
```
