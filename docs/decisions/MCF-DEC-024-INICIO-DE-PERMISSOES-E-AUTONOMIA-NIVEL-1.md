# MCF-DEC-024 — Início de Permissões e Autonomia Nível 1

**Data:** 2 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Estado:** aprovado para implementação em desenvolvimento

## 1. Entrada

A Fase 1.2 entregou:

- sessão humana autenticada e revogável;
- perfil de agente em `DRAFT`;
- vínculo responsável obrigatório;
- estados controlados;
- auditoria e testes PostgreSQL.

## 2. Decisão

Fica autorizado o primeiro nível operacional de autonomia, limitado a permissões internas explicitamente concedidas pelo responsável humano.

```yaml
fase: 1.3
nivel_de_autonomia: 1_ASSISTIDO
negacao_por_padrao: obrigatoria
catalogo_fechado: obrigatorio
concessao_por_responsavel: obrigatoria
escopo: obrigatorio
validade: suportada
quota: suportada
revogacao: imediata
auditoria_de_concessoes: obrigatoria
auditoria_de_decisoes: obrigatoria
publicacao_social: nao_autorizada
acao_externa: nao_autorizada
uso_financeiro: nao_autorizado
producao: nao_autorizada
```

## 3. Catálogo inicial permitido

Somente estas permissões internas poderão existir neste slice:

1. `agent.profile.read` — leitura do próprio perfil;
2. `agent.audit.read` — leitura do próprio histórico auditável;
3. `content.draft.create` — criação de rascunho interno não publicável.

Nenhuma dessas permissões autoriza postagem pública, interação social, chamada externa, uso de ferramenta, credencial, pagamento ou execução irreversível.

## 4. Regras

- um agente sem grant válido recebe `DENY`;
- o agente deve estar `ACTIVE` para consumir uma permissão;
- o responsável ativo cria e revoga grants;
- grants possuem código, escopo, validade e quota opcional;
- consumo de quota deve ser transacional;
- grants expirados ou revogados não podem ser usados;
- o agente não pode conceder, ampliar ou renovar as próprias permissões;
- decisões permitidas e negadas devem ser auditáveis;
- erros públicos não devem revelar a existência de agentes sem vínculo com o solicitante.

## 5. Gate

O slice será integrado somente após:

- migrações executadas duas vezes;
- testes de negação por padrão;
- testes de quota e expiração;
- testes de responsabilidade;
- revisão de segurança;
- auditoria independente;
- decisão final de Léo.
