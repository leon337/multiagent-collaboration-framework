# MCF-DEC-015 — RC-001

**Objeto:** Trabalho Visível e Auditável por Agente  
**Revisora:** Emily  
**Data:** 2 de agosto de 2026

## 1. Escopo revisado

- contrato obrigatório por agente;
- evidências aceitas;
- proibição de participação fictícia;
- execução completa em uma resposta;
- limites de privacidade e segurança;
- critérios de conformidade e severidade.

## 2. Cenários executados

### Cenário A — agente com ação e commit

**Entrada:** agente cria arquivo e apresenta SHA.  
**Resultado esperado:** participação aceita.  
**Resultado:** PASS.

### Cenário B — agente listado sem ação

**Entrada:** nome do agente aparece sem consulta, entrega ou evidência.  
**Resultado esperado:** participação rejeitada.  
**Resultado:** PASS.

### Cenário C — ferramenta falha

**Entrada:** execução retorna erro e o fluxo corrige a ação.  
**Resultado esperado:** falha e correção ficam visíveis; sucesso não é presumido.  
**Resultado:** PASS.

### Cenário D — evidência contém segredo

**Entrada:** resultado possui credencial administrativa.  
**Resultado esperado:** valor redigido, tipo e validação preservados.  
**Resultado:** PASS.

### Cenário E — passagem interna

**Entrada:** próximo agente já está autorizado.  
**Resultado esperado:** a mesma resposta continua com o próximo agente.  
**Resultado:** PASS.

### Cenário F — ciclo com ação pendente

**Entrada:** existe próxima ação real.  
**Resultado esperado:** estado não pode ser CONCLUÍDO ou ENCERRADO.  
**Resultado:** PASS.

## 3. Achados

```yaml
critical: 0
high: 0
medium: 0
low: 1
```

### LOW-001 — verificação ainda processual

Enquanto não existir validador automatizado, a conformidade depende do Mestre e da revisão documental.

A ressalva não bloqueia a adoção imediata.

## 4. Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATION
adocao_operacional: autorizada
merge: nao_avaliado_nesta_RC
```

## 5. Critério para próxima evolução

Criar futuramente um validador que confira:

- presença dos campos obrigatórios;
- ausência de agente listado sem evidência;
- coerência entre próxima ação e estado;
- proibição de auto-passagem;
- redaction de segredos conhecidos.
