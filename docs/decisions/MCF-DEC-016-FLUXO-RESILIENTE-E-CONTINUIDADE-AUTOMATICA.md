# MCF-DEC-016 — Fluxo Resiliente e Continuidade Automática

## Estado

`PROPOSTA_APROVADA_PARA_RC`

## Autoridade

Léo determinou que falhas de ferramenta, parâmetros inválidos, tentativas duplicadas ou erros recuperáveis não podem interromper o fluxo entre os agentes.

## Problema

O fluxo multiagente pode parar indevidamente quando:

- uma ferramenta rejeita uma ação;
- um PR já existe;
- um arquivo já foi criado;
- um parâmetro é inválido;
- uma integração não oferece a função necessária;
- um agente conclui sua mensagem sem deixar recuperação explícita;
- o estado é marcado como encerrado apesar de existir ação pendente.

O incidente que motivou esta decisão foi uma tentativa de abrir um novo pull request para uma branch que já possuía o PR #12. O GitHub respondeu com HTTP 422. Nenhum PR adicional foi criado e nenhuma branch foi alterada. O fluxo continuou usando o PR existente.

## Decisão

Adotar o **Protocolo CAF — Continuidade Automática de Fluxo** como regra obrigatória do MCF.

Uma falha de ação não encerra a missão. A missão só pode ser bloqueada quando existir dependência externa real, risco irreversível ou ausência comprovada de recuperação segura.

## Máquina de estados

```text
PLANEJADO
→ EM_EXECUCAO
→ SUCESSO_PARCIAL
→ RECUPERANDO
→ EM_EXECUCAO
→ ENTREGUE
```

Estados excepcionais:

```text
AGUARDANDO_DEPENDENCIA_EXTERNA
BLOQUEADO_POR_RISCO
CANCELADO_PELA_AUTORIDADE
```

`ENCERRADO` só pode ser usado quando não existir ação pendente.

## Classes de falha

### 1. RECUPERÁVEL

Exemplos:

- PR duplicado;
- arquivo já existente;
- parâmetro inválido;
- referência desatualizada;
- timeout transitório;
- tentativa de usar uma ação incompatível.

Procedimento:

1. registrar a falha;
2. confirmar se houve efeito parcial;
3. corrigir o parâmetro ou usar o recurso existente;
4. repetir no máximo uma vez pelo mesmo caminho;
5. usar caminho alternativo seguro quando necessário;
6. continuar o fluxo na mesma resposta.

### 2. DEGRADADA

Exemplos:

- integração sem escrita de variáveis;
- ferramenta sem função específica;
- serviço temporariamente indisponível;
- limitação de API.

Procedimento:

1. registrar a limitação;
2. buscar operação equivalente;
3. preservar a intenção e as evidências;
4. usar fallback autorizado e reversível;
5. continuar o fluxo;
6. declarar o que não foi executado.

### 3. BLOQUEANTE EXTERNA

Exemplos:

- confirmação manual do usuário;
- credencial ausente;
- autorização financeira pendente;
- permissão negada;
- serviço externo que exige configuração humana.

Procedimento:

1. não fingir sucesso;
2. publicar o estado atual;
3. informar o gate exato;
4. passar o bastão ao Léo;
5. manter a missão em `AGUARDANDO_DEPENDENCIA_EXTERNA`.

### 4. IRREVERSÍVEL OU DE RISCO

Exemplos:

- merge;
- deploy em produção;
- cobrança real;
- perda de dados;
- alteração destrutiva;
- exposição de segredo.

Procedimento:

1. interromper antes do efeito;
2. registrar o risco;
3. solicitar autorização explícita;
4. não aplicar fallback que aumente o risco.

## Ciclo obrigatório de recuperação

```text
CAPTURAR
→ CLASSIFICAR
→ VERIFICAR EFEITO
→ ESCOLHER RECUPERAÇÃO
→ EXECUTAR
→ VALIDAR
→ CONTINUAR
```

### CAPTURAR

Registrar:

- ação tentada;
- ferramenta;
- código ou mensagem de erro;
- horário lógico da missão;
- agente responsável.

### CLASSIFICAR

Selecionar uma das quatro classes de falha.

### VERIFICAR EFEITO

Nunca presumir que uma operação falhou por completo. Confirmar:

- recurso criado ou não;
- alteração parcial ou não;
- custo gerado ou não;
- branch, arquivo, banco ou deploy alterado ou não.

### ESCOLHER RECUPERAÇÃO

Ordem de preferência:

1. corrigir a mesma ação;
2. reutilizar recurso existente;
3. usar operação equivalente;
4. transferir para agente com competência adequada;
5. solicitar ação externa apenas quando inevitável.

### EXECUTAR

A recuperação deve ser feita dentro da mesma resposta sempre que tecnicamente possível.

### VALIDAR

Confirmar o novo estado por evidência objetiva.

### CONTINUAR

Repassar o bastão ao próximo agente do fluxo original, não ao erro e não a um estado abstrato.

## Checkpoint obrigatório do bastão

Toda passagem após sucesso, falha ou recuperação deve conter:

```yaml
objetivo: identificador_da_missao
estado: estado_atual
ultimo_sucesso: ultima_entrega_confirmada
falha_atual: nenhuma_ou_descricao
classe_da_falha: nenhuma_RECUPERAVEL_DEGRADADA_BLOQUEANTE_RISCO
efeito_confirmado: descricao_objetiva
recuperacao_escolhida: nenhuma_ou_acao
proxima_acao: acao_executavel
destinatario: agente_ou_Leo
artefatos:
  - caminho
  - commit
  - PR
  - teste
```

## Regras do Mestre

O Mestre deve:

1. manter o mapa da missão;
2. detectar quando uma passagem perdeu o destinatário;
3. impedir passagem para `ENCERRADO` quando houver ação pendente;
4. acionar recuperação automaticamente;
5. selecionar agente substituto quando a falha sair da competência atual;
6. continuar a apresentação dos agentes na mesma resposta;
7. retornar ao Léo somente em conclusão, decisão, risco ou dependência externa real.

## Agente substituto

Quando o agente atual não puder recuperar:

```text
Agente atual
→ registra a falha e o efeito
→ Mestre identifica a competência necessária
→ agente substituto recebe o checkpoint
→ fluxo continua
```

O substituto não reinicia a missão. Ele recebe o estado já alcançado.

## Limites de repetição

Para evitar loops infinitos:

- mesma ação com os mesmos parâmetros: zero repetições;
- mesma ação após correção objetiva: uma repetição;
- caminho alternativo seguro: uma tentativa;
- depois disso, classificar como dependência externa ou bloqueio técnico real.

## Critérios de conformidade

Uma execução está conforme quando:

- toda falha fica visível;
- o efeito real é confirmado;
- a recuperação é explícita;
- o bastão possui destinatário válido;
- o fluxo retorna ao plano original;
- não existe estado `ENCERRADO` com ação pendente;
- nenhum sucesso é inventado;
- nenhum segredo é exposto;
- ações irreversíveis continuam exigindo autorização.

## Cenário de referência — PR duplicado

```text
Gabriel tenta criar PR
→ GitHub retorna 422: PR já existe
→ classe: RECUPERÁVEL
→ efeito confirmado: nenhum novo PR
→ recuperação: reutilizar PR existente
→ validar estado do PR
→ registrar o incidente no PR
→ passar o bastão ao próximo agente
```

## Relação com trabalho visível e auditável

O CAF complementa a regra de trabalho visível. Cada recuperação deve produzir evidência, mas uma falha não gera crédito de sucesso ao agente.

## Governança

```yaml
merge: exige_autorizacao_do_Leo
producao: nao_afetada
aplicacao_operacional: imediata
publicacao_na_main: depende_de_merge
```
