# VALIDATION

Aplicação local: PASS.
Persistência PostgreSQL real: PASS.
Criação de appointment: HTTP 201 PASS.
Conflito: HTTP 409 SCHEDULE_CONFLICT PASS.
Disponibilidade fora da janela: HTTP 409 AVAILABILITY_VIOLATION PASS.
Reagendamento: HTTP 200 PASS.
Cancelamento/histórico: HTTP 200 e status CANCELLED PASS.
Auditoria: CREATED, RESCHEDULED e CANCELLED persistidos PASS.
Append-only: UPDATE rejeitado pelo trigger PASS.
Testes automatizados: 14/14 PASS.
Smoke E2E visual: PENDENTE.
Gate Rafael: PENDENTE.
Auditoria final Emily: PENDENTE.
