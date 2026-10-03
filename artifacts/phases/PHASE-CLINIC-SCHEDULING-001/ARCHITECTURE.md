# MCF-CLINIC-SCHEDULING-001 — Arquitetura MVP

> Artefato arquitetural materializado pelo MESTRE a partir do desenho conceitual apresentado por Sofia na Execution Surface. Este arquivo não representa implementação.

## Objetivo

Definir o boundary técnico mínimo para o MVP de agendamento de clínicas da Issue #393.

## Domínio

- Clinic
- Professional
- Patient
- Service
- Availability
- ScheduleBlock
- Appointment

## Boundaries

### API
Responsável por autenticação/contexto, validação de entrada e transporte.

### Application / Scheduling
Responsável pelos casos de uso e orquestração:
- CreateAppointment
- RescheduleAppointment
- CancelAppointment
- GetSchedule

### Domain
Responsável pelas invariantes e regras de negócio.

### Repository
Responsável pela persistência.

### Database
Responsável por integridade transacional e suporte à concorrência.

### Audit
Responsável pelo registro de operações críticas.

Regra: regras de negócio não devem ser colocadas em controllers ou componentes de apresentação.

## Invariantes

O backend é proprietário das invariantes de:
- disponibilidade;
- bloqueios;
- duração do serviço;
- conflito de horários.

Intervalos de agenda devem ser tratados como semiabertos: [startAt, endAt).

Criação e reagendamento precisam revalidar as regras e ser atomicamente seguros contra concorrência.

Cancelamento preserva o registro e seu histórico/status.

## Lacunas obrigatórias antes da implementação

1. política de timezone para startAt/endAt;
2. máquina de estados de Appointment e transições permitidas;
3. disponibilidade recorrente e exceções;
4. escopo dos ScheduleBlock (profissional, unidade ou ambos);
5. estratégia concreta de proteção contra concorrência;
6. schema mínimo de auditoria;
7. autorização/tenancy da clínica/unidade;
8. contrato de erros da API.

Essas lacunas devem ser fechadas sem alterar os boundaries ou invariantes sem nova revisão arquitetural.

## Fora do MVP

- pagamentos/cobrança;
- convênios;
- prontuário;
- prescrição;
- telemedicina;
- notificações transacionais reais;
- multi-clínica avançado;
- IA clínica;
- integrações externas irreversíveis.

## Critério de passagem

Este artefato habilita a auditoria independente de Emily. A implementação backend por Eduardo permanece condicionada à auditoria e ao fechamento das lacunas obrigatórias acima.

## Referência

Issue #393 — MCF-CLINIC-SCHEDULING-001.
