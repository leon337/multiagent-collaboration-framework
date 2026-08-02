# MCF-DEC-013 — RC-001 — Posicionamento Híbrido da Rede Social para Agentes de IA

**Data:** 2 de agosto de 2026  
**Revisora:** Emily — Auditoria Independente  
**Artefato revisado:** `docs/decisions/MCF-DEC-013-POSICIONAMENTO-HIBRIDO-DA-REDE-SOCIAL-DE-AGENTES.md`  
**Estado:** concluído

## 1. Objetivo

Verificar se a decisão:

- registra corretamente a aprovação de Leandro;
- define o posicionamento híbrido de forma objetiva;
- diferencia MVP supervisionado de autonomia futura;
- preserva segurança, governança e rastreabilidade;
- reafirma a obrigação de registro por mensagem;
- não autoriza implementação, deploy ou merge indevidamente.

## 2. Aprovação humana

A decisão registra Leandro como autoridade humana e identifica sua aprovação direta do posicionamento híbrido.

**Resultado:** PASS

## 3. Coerência do posicionamento

O documento estabelece:

- supervisão humana no MVP;
- vínculo obrigatório entre agente e responsável;
- autonomia limitada, configurável e revogável;
- evolução futura condicionada a identidade, reputação, permissões e auditoria;
- ausência de autonomia automática para ações externas ou irreversíveis.

A distinção entre estado inicial e evolução futura está clara.

**Resultado:** PASS

## 4. Cobertura de riscos

Foram tratados os riscos principais:

- agente sem responsável;
- conteúdo de IA não identificado;
- autonomia irrestrita;
- impossibilidade de revogação;
- ações externas não autorizadas;
- perda de rastreabilidade;
- promoção de autonomia sem critérios.

**Resultado:** PASS

## 5. Registro por mensagem

A decisão não cria uma regra isolada nova sem referência metodológica. Ela reafirma o princípio já adotado de que mensagens com decisão, aprovação, correção, mudança de escopo, bloqueio ou resultado devem gerar artefato rastreável.

O próprio arquivo revisado constitui o registro da mensagem atual.

**Resultado:** PASS

## 6. Autorizações

A decisão autoriza somente:

- posicionamento conceitual;
- documentação;
- pesquisa conceitual;
- arquitetura conceitual;
- início do Ciclo 2 de definição detalhada.

Não autoriza:

- implementação de software;
- alteração de código de produto;
- deploy;
- merge na `main`;
- publicação automática.

**Resultado:** PASS

## 7. Ressalvas

### LOW-01 — Níveis de autonomia ainda não possuem critérios quantitativos

A decisão define princípios e condicionantes, mas os níveis, limites e critérios objetivos de promoção ou redução de autonomia deverão ser formalizados no Ciclo 2.

### LOW-02 — Responsabilidade jurídica e termos de uso permanecem fora do detalhamento atual

O MVP deverá futuramente esclarecer responsabilidades entre plataforma, responsável humano, organização e agente, especialmente para conteúdo, moderação e uso de ferramentas externas.

Estas ressalvas não bloqueiam o posicionamento conceitual.

## 8. Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
critical: 0
high: 0
medium: 0
low: 2
posicionamento_hibrido: aprovado
registro_por_mensagem: atendido
proximo_ciclo: autorizado
```

A MCF-DEC-013 está adequada para permanecer versionada no PR Draft.
