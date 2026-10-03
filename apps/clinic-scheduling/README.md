# Clinic Scheduling MVP

MVP executável de agenda para clínica, alinhado ao contrato `MCF-CLINIC-SCHEDULING-001`.

## Interface

O servidor expõe a interface web em `/` e a API em `/api/v1`.

A interface cobre:
- agenda por profissional e data;
- criação de agendamento;
- confirmação, conclusão e cancelamento;
- reagendamento com revalidação do backend;
- indicadores operacionais;
- cadastros de profissionais, pacientes e serviços;
- estados vazios e erro;
- timezone explícito da clínica.

## Demonstração local

Use dados sintéticos. O modo demo nunca deve ser usado em produção.

    cd apps/clinic-scheduling
    npm install
    psql "$DATABASE_URL" -f sql/001_init.sql
    MCF_DEMO_MODE=1 DATABASE_URL="$DATABASE_URL" npm start

Abra `http://localhost:3000`.

No modo demo, o contexto autenticado e os registros iniciais são sintéticos e fixos para permitir um smoke reproduzível. Em ambiente real, `MCF_AUTH_PROVIDER` deve apontar para o provedor de autenticação da infraestrutura.

## API

- `GET /health`
- `GET /api/v1/context`
- `GET /api/v1/professionals`
- `GET /api/v1/patients`
- `GET /api/v1/services`
- `GET /api/v1/schedule?professionalId=<uuid>&localDate=YYYY-MM-DD`
- `POST /api/v1/appointments`
- `POST /api/v1/appointments/:id/confirm`
- `POST /api/v1/appointments/:id/complete`
- `POST /api/v1/appointments/:id/cancel`
- `POST /api/v1/appointments/:id/reschedule`
- endpoints de disponibilidade e bloqueio descritos na arquitetura.

As regras de conflito permanecem protegidas pela transação e pela exclusion constraint PostgreSQL; a UI não substitui as garantias do domínio.
