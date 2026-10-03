# MCF-CLINIC-SCHEDULING-001 — Arquitetura MVP

> Remediação arquitetural do desenho apresentado por Sofia e dos gaps identificados pela auditoria independente de Emily. Define o contrato necessário para Eduardo implementar o MVP sem preencher lacunas estruturais por suposição.

## 1. Objetivo e escopo
MVP local de agendamento para uma clínica/unidade, cobrindo Clinic, Professional, Patient, Service, Availability, ScheduleBlock e Appointment; criação, consulta, reagendamento e cancelamento.

Fora do MVP: pagamentos, convênios, prontuário, prescrição, telemedicina, notificações transacionais reais, multi-clínica avançado, IA clínica e integrações externas irreversíveis.

## 2. Domínio
Clinic: identidade e timezone operacional da unidade.
Professional: pertence a uma Clinic e possui agenda própria.
Patient: pertence ao contexto da Clinic.
Service: define duração positiva.
Availability: janela recorrente ou exceção de disponibilidade de um Professional.
ScheduleBlock: bloqueio aplicável a um Professional ou à Clinic.
Appointment: reserva um Service para um Patient com um Professional.

## 3. Boundaries
API: autenticação/contexto, autorização, validação, serialização e transporte.
Application/Scheduling: CreateAppointment, RescheduleAppointment, CancelAppointment e GetSchedule; orquestra transação e domínio.
Domain: proprietário das invariantes de disponibilidade, duração, bloqueios, conflito e transições.
Repository: persistência e consultas.
Database: integridade, constraints e proteção contra corrida.
Audit: registro imutável das operações críticas.
Controllers não contêm regras de negócio.

## 4. Tempo e timezone
- startAt/endAt representam instantes absolutos.
- Persistência usa UTC/timestamps com timezone.
- Cada Clinic possui timezone IANA.
- Entrada aceita ISO-8601 com offset ou UTC explícito.
- Visualização converte para o timezone da Clinic.
- Disponibilidade recorrente é interpretada no timezone da Clinic antes de virar instantes.
- Horários inexistentes por DST são rejeitados; horários ambíguos exigem offset explícito.
- Duração é calculada em minutos sobre [startAt, endAt).

## 5. Estados de Appointment
Estados MVP: SCHEDULED, CANCELLED, COMPLETED.
Transições:
- inexistente -> SCHEDULED na criação;
- SCHEDULED -> SCHEDULED no reagendamento, com auditoria;
- SCHEDULED -> CANCELLED no cancelamento;
- SCHEDULED -> COMPLETED na conclusão;
- CANCELLED e COMPLETED são terminais.
Não editar silenciosamente Appointment terminal.

## 6. Availability
- Recorrência: dia da semana + janela local.
- Exceções: data local que abre ou fecha janela.
- Exceção prevalece sobre regra recorrente.
- start < end.
- Appointment deve estar integralmente coberto pela disponibilidade efetiva.
- Intervalos são semiabertos [startAt, endAt).

## 7. ScheduleBlock
Escopos: PROFESSIONAL ou CLINIC.
Appointment é recusado quando intersecta qualquer bloqueio aplicável.

## 8. Concorrência e dupla reserva
Criação/reagendamento ocorrem em transação.
Estratégia de referência para persistência relacional PostgreSQL:
- instantes UTC;
- range temporal [startAt,endAt);
- constraint de exclusão por Professional para impedir sobreposição entre Appointments não cancelados;
- disponibilidade e ScheduleBlock validados na mesma transação;
- em corrida, uma transação confirma e a concorrente recebe conflito sem estado parcial.
A constraint do banco é a última barreira; a regra de domínio permanece obrigatória.

## 9. Persistência
IDs estáveis.
Cancelamento não remove Appointment; histórico permanece.
Integridade mínima:
- Service.duration > 0;
- startAt < endAt;
- Professional pertence à Clinic;
- Patient pertence ao contexto da Clinic;
- referências válidas;
- estado terminal não retorna a SCHEDULED;
- não sobreposição conforme seção de concorrência.

## 10. Auditoria
Registro imutável com auditId, occurredAt, clinicId, actorId, action, entityType, entityId, before, after e correlationId.
Eventos mínimos: AppointmentCreated, AppointmentRescheduled, AppointmentCancelled, AppointmentCompleted e AppointmentConflictRejected.

## 11. Autorização e tenancy
Todo request autenticado carrega contexto de Clinic.
O usuário só lê/modifica dados da Clinic autorizada.
Professional, Patient, Service, Availability, ScheduleBlock e Appointment são filtrados por clinicId.
Operações administrativas exigem permissão administrativa; operações de agenda exigem permissão de agendamento.
Sem contexto/autorização: negar acesso, nunca retornar dados de outra Clinic.

## 12. Contrato de erros
Payload uniforme com code, message e correlationId.
Códigos mínimos:
VALIDATION_ERROR=400; UNAUTHORIZED=401; FORBIDDEN=403; NOT_FOUND=404; APPOINTMENT_CONFLICT=409; OUTSIDE_AVAILABILITY=409; SCHEDULE_BLOCKED=409; INVALID_STATE_TRANSITION=409; CONCURRENT_BOOKING_CONFLICT=409.
Não expor stack trace ou detalhes internos.

## 13. Contratos de aplicação
CreateAppointment: clinic context, professionalId, patientId, serviceId, startAt -> Appointment SCHEDULED; valida tenancy, duração, timezone, disponibilidade, bloqueios e conflito.
RescheduleAppointment: appointmentId, novo startAt -> Appointment SCHEDULED; revalida todas as regras na mesma transação.
CancelAppointment: appointmentId/context -> Appointment CANCELLED; preserva histórico e audita.
GetSchedule: professionalId + intervalo -> appointments e bloqueios no timezone da Clinic.

## 14. Verificabilidade
Testes obrigatórios: conflito simples e concorrente; duração; disponibilidade recorrente e exceção; bloqueio profissional e clínico; DST/offset; transições de estado; cancelamento preservando histórico; tenancy; erros; auditoria.

## 15. Proveniência
Este artefato deriva do desenho conceitual apresentado por Sofia e foi remediado pelo MESTRE para fechar os gaps explicitamente apontados por Emily.
A reauditoria independente deve ocorrer sobre este SHA antes da liberação de Eduardo.

## 16. Critério de passagem
Eduardo só implementa quando Emily confirmar, por artefato versionado e SHA vinculável, que os gaps estão suficientemente fechados.
Nenhuma implementação amplia escopo ou altera boundary/invariantes sem nova revisão arquitetural.
