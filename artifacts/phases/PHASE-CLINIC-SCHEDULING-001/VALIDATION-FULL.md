# VALIDATION-FULL

O backend R2 foi executado contra PostgreSQL local. Foram exercitados criação, sobreposição, reagendamento, cancelamento, disponibilidade e auditoria.

Appointment criado para 2026-10-05 09:00 America/Recife retornou 201.
Sobreposição em 09:15 retornou 409 SCHEDULE_CONFLICT.
Reagendamento para 10:00 retornou 200.
Cancelamento retornou 200 e preservou o registro como CANCELLED.
Audit events registrados: APPOINTMENT_CREATED, APPOINTMENT_RESCHEDULED, APPOINTMENT_CANCELLED.
UPDATE direto em audit_events foi rejeitado pelo trigger append-only.
Appointment fora da disponibilidade retornou 409 AVAILABILITY_VIOLATION.
ScheduleBlock PROFESSIONAL foi criado com 201.

Limitação: não houve teste A/B concorrente simultâneo nem E2E visual completo. A evidência não equivale ao aceite final.
