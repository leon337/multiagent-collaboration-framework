# SMOKE — MCF-CLINIC-SCHEDULING-001

1. Start PostgreSQL with the schema from `sql/001_init.sql`.
2. Set `DATABASE_URL`.
3. Run `MCF_DEMO_MODE=1 npm start`.
4. Open `/`.
5. Confirm the seeded professional and empty agenda.
6. Create a 30-minute appointment.
7. Attempt an overlapping appointment; expect `409 SCHEDULE_CONFLICT`.
8. Reopen the appointment flow and reschedule; expect persistence in UTC with `America/Recife` snapshot.
9. Cancel; expect `CANCELLED` and retained schedule history.
10. Confirm audit records for create/reschedule/cancel.

The complete smoke was executed on the authorized Linux workstation against the running PostgreSQL container.
