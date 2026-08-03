# Runbook — SLO e Alertas Operacionais

**Responsável primário:** Bruno  
**Qualidade:** Renato  
**Coordenação:** Mestre

## Indicadores mínimos

- disponibilidade de `/health/ready`;
- proporção de respostas `5xx`;
- duração por template de rota;
- volume de respostas `429`;
- falhas de autenticação sem identificar a conta;
- falhas de migração;
- idade do último backup válido;
- resultado do último teste de restauração;
- backlog de casos de moderação por prioridade.

## SLO provisório do piloto

```yaml
disponibilidade_mensal: 99.5_PERCENT
p95_rotas_de_leitura: 1500_MS
p95_rotas_de_mutacao: 2500_MS
backup_valido_max_age: 30_HORAS
restore_test_max_age: 8_DIAS
caso_urgente_sem_claim: 15_MINUTOS
```

Esses valores são provisórios. Devem ser revisados com dados do piloto, sem serem tratados como compromisso comercial definitivo.

## Alertas iniciais

### Readiness

- **SEV-1:** readiness indisponível continuamente por 5 minutos;
- **SEV-2:** duas ou mais interrupções de readiness em 30 minutos.

### Erros HTTP

- **SEV-1:** `5xx` acima de 20% por 5 minutos com pelo menos 20 requisições;
- **SEV-2:** `5xx` acima de 5% por 10 minutos com pelo menos 50 requisições.

### Latência

- **SEV-2:** p95 acima do dobro do SLO por 10 minutos;
- **SEV-3:** p95 acima do SLO por 30 minutos.

### Abuso

- **SEV-2:** respostas `429` acima de 30% do tráfego por 10 minutos;
- **SEV-3:** aumento de cinco vezes sobre a linha de base do mesmo período.

### Backup e restauração

- **SEV-2:** nenhum backup válido dentro de 30 horas;
- **SEV-1:** checksum inválido no único backup dentro do RPO;
- **SEV-2:** nenhum teste de restore válido dentro de 8 dias.

### Moderação

- **SEV-2:** caso urgente sem claim por 15 minutos;
- **SEV-3:** crescimento contínuo do backlog por 60 minutos.

## Resposta

Todo alerta deve gerar:

1. identificador;
2. indicador, janela e limiar;
3. versão da aplicação;
4. correlações amostrais sem conteúdo sensível;
5. confirmação ou descarte por operador;
6. vínculo com incidente quando aplicável.

## Anti-ruído

- exigir volume mínimo antes de alertar por porcentagem;
- agrupar alertas iguais por serviço e janela;
- não incluir corpo, query, token, IP ou e-mail;
- manter limiares sob controle de versão;
- revisar falsos positivos após o piloto.
