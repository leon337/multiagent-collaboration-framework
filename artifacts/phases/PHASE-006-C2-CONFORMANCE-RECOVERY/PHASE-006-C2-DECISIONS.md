# PHASE-006-C2 — Registro de Decisões

| Seq. | Ciclo | Autoridade/agente | Entrada | Evidência | Decisão | Efeito | Próximo destinatário |
|---:|---:|---|---|---|---|---|---|
| 1 | 1 | Mestre | reclamação de perda de continuidade | Protocolo Operacional Unificado | tratar como falha de conformidade, não como estilo | inicia CAF | Miriam |
| 2 | 1 | Miriam | protocolo + issue #79 + PR #80 | issue #79 | recuperar contrato original antes de julgar o diff | escopo congelado | Sofia |
| 3 | 1 | Sofia | 31 arquivos alterados + checkpoint | PR #80 / checkpoint C2 | preservar hardening ligado ao aceite; bloquear nova expansão funcional | código preservado | Carmem |
| 4 | 1 | Carmem | protocolo PRF | ausência de artifacts/phases na branch | não fabricar ESEV retroativa; criar fase de recuperação | issue #81 + PRF | Augusto |
| 5 | 1 | Augusto | HEAD e workflows | e9250b79 + runs 31258225885/898/908 | congelar HEAD funcional e prosseguir só com rastreabilidade | recuperação estabilizada | Renato |
| 6 | 1 | Renato | logs Foundation | 83/83 arquivos, 351/351 testes, migrations 0020-0025, build PASS | base técnica apta para recuperação documental | PASS técnico | Carmem |
| 7 | 1 | Mestre | ausência de PRF histórico | protocolo proíbe síntese retrospectiva como substituto | abrir PHASE-006-C2-CONFORMANCE-RECOVERY | rastreabilidade daqui em diante | Gabriel |

## Gates

### Emily — Auditoria

```yaml
verdict: PENDENTE
findings: []
condition: revisar HEAD exato após materialização e CI do PRF
```

### Léo — Decisão operacional

```yaml
decision: PENDENTE
justification: aguardar PRF + CI + auditoria
next_state: AGUARDANDO_AUDITORIA
next_action: auditar HEAD exato da recuperação
responsible: Emily
escalate_to_leandro: false
```

### Leandro — Autoridade humana

```yaml
invoked: false
reason: nenhuma matéria reservada surgiu nesta recuperação
decision: NAO_APLICAVEL
```
