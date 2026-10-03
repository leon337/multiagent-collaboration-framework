# SMOKE

Ambiente: PostgreSQL local clinic-scheduler-pg e aplicação Node R2 em 127.0.0.1:34124.

health 200.
create appointment 201.
overlap 409 SCHEDULE_CONFLICT.
reschedule 200.
cancel 200.
outside availability 409 AVAILABILITY_VIOLATION.
schedule block creation 201.
audit events persistidos.
audit mutation bloqueada.

Smoke backend/API PASS. Smoke E2E visual PENDENTE.
