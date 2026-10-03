# MCF-CLINIC-SCHEDULING-001 — Arquitetura MVP R2

> Artefato arquitetural versionado para a Issue #393. Define contratos e invariantes; não contém implementação backend.

## Proveniência e gate

- Missão: MCF-CLINIC-SCHEDULING-001
- Fonte funcional: Issue #393.
- Base arquitetural: `4551d8b3ea71616d00262155c6121939a3353f09`.
- Branch: `feat/clinic-scheduling-architecture-r2`.
- Estado: **PRONTO PARA REAUDITORIA DE EMILY**.
- Eduardo permanece **BLOQUEADO** até parecer independente de Emily.
- Esta revisão não implementa backend.
- Alterações posteriores de boundaries, invariantes ou contratos exigem nova revisão versionada.

## 1. Domínio

Entidades: `Clinic`, `Professional`, `Patient`, `Service`, `Availability`, `ScheduleBlock`, `Appointment`, `AuditEvent`.

`Clinic` é o tenant raiz. `Appointment` reserva um intervalo para profissional/paciente/serviço. `AuditEvent` é imutável e registra operações críticas.

Todos os intervalos de agenda são semiabertos: **[startAt, endAt)**.

## 2. Boundaries

### API
Transporte HTTP, autenticação, autorização/contexto de tenant, validação de entrada e mapeamento de erros.

### Application / Scheduling
Casos de uso: CreateAppointment, RescheduleAppointment, CancelAppointment, GetSchedule. Orquestra transações e políticas.

### Domain
Proprietário das invariantes de duração, estados, disponibilidade, bloqueios e conflito.

### Repository
Abstração de persistência; não define política de negócio.

### Database
Fonte de verdade para atomicidade, constraints e concorrência.

### Audit
Registro append-only de operações críticas.

## 3. Timezone e DST

1. Cada `Clinic` possui timezone IANA obrigatório.
2. Disponibilidade e bloqueios são definidos no timezone da clínica/unidade.
3. `Appointment` persiste `startAtUtc`, `endAtUtc` e `timezone` IANA como snapshot.
4. Comandos de criação/reagendamento aceitam RFC 3339 com offset explícito.
5. Timestamp sem offset retorna `INVALID_DATETIME`; timezone nunca é inferido.
6. Regras recorrentes locais são convertidas usando o timezone IANA da clínica.
7. Horário local inexistente por DST é inválido.
8. Horário local ambíguo por DST exige offset explícito.
9. Abreviações de timezone não são identificadores válidos.
10. Duração do serviço é nominalmente em minutos; DST não altera a duração contratada.

## 4. Appointment — estados e transições

Estados MVP:

- `SCHEDULED`
- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`

Transições:

| De | Para |
|---|---|
| SCHEDULED | CONFIRMED, CANCELLED, COMPLETED |
| CONFIRMED | CANCELLED, COMPLETED |
| COMPLETED | nenhuma |
| CANCELLED | nenhuma |

Reagendamento é comando, não estado, e só é permitido em `SCHEDULED` ou `CONFIRMED`. Deve revalidar todas as regras e a proteção concorrente.

Cancelamento preserva o registro. Toda transição registra timestamp, ator e motivo quando aplicável.

## 5. Availability — recorrência, exceções e precedência

`AvailabilityRule`:

- `professionalId`
- `weekday`
- `localStartTime`
- `localEndTime`
- `timezone`
- `validFrom`
- `validUntil` opcional

Não existe disponibilidade infinita implícita.

`AvailabilityException`:

- `professionalId`
- `localDate`
- `type = OPEN | CLOSED`
- `intervals`
- `reason`

Precedência determinística:

1. `ScheduleBlock` sempre vence disponibilidade.
2. Exceção da data vence regra recorrente.
3. `CLOSED` torna a data/intervalo indisponível.
4. `OPEN` define exclusivamente os intervalos disponíveis daquela data.
5. Sem exceção, usa-se a união das regras recorrentes aplicáveis.
6. Intervalos sobrepostos da mesma camada são normalizados; conflito de configuração não cria disponibilidade implícita.

Um agendamento precisa estar integralmente coberto pela disponibilidade efetiva e não sobrepor qualquer bloqueio aplicável.

## 6. ScheduleBlock — ownership e escopo

Dois escopos explícitos:

- `PROFESSIONAL`: bloqueia somente o profissional indicado.
- `CLINIC`: bloqueia todos os profissionais da clínica/unidade.

Campos mínimos:

`id`, `scopeType`, `clinicId`, `professionalId` (somente PROFESSIONAL), `startAtUtc`, `endAtUtc`, `reason`, `createdBy`, `createdAt`.

Invariantes:

- PROFESSIONAL pertence à `clinicId`.
- CLINIC não possui `professionalId`.
- Todo bloco aplicável torna o intervalo indisponível.

## 7. Concorrência — mecanismo concreto

A proteção possui duas camadas:

1. transação de banco;
2. **PostgreSQL exclusion constraint** sobre intervalo por profissional.

Modelo:

- `Appointment(professionalId, startAtUtc, endAtUtc, status)`;
- intervalo equivalente a `[startAtUtc,endAtUtc)`;
- exclusion constraint impede sobreposição entre appointments que ocupam agenda;
- criação/reagendamento ocorrem em uma única transação;
- violação da constraint é mapeada para `409 SCHEDULE_CONFLICT`.

Corrida A/B no mesmo profissional/intervalo:

1. ambas podem passar pela leitura preliminar;
2. a garantia final ocorre no banco;
3. somente uma efetiva o intervalo;
4. a outra falha atomicamente na constraint/transação;
5. cache ou leitura preliminar nunca pode declarar disponibilidade como garantia.

Se a persistência escolhida não suportar uma exclusion constraint equivalente, Eduardo deve retornar à arquitetura; não pode substituí-la silenciosamente por mecanismo mais fraco.

## 8. Audit — schema e eventos

`AuditEvent` é append-only.

Campos mínimos:

- `id` UUID
- `occurredAtUtc`
- `actorId`
- `actorType`
- `clinicId`
- `action`
- `entityType`
- `entityId`
- `correlationId`
- `requestId`
- `before` JSON nullable
- `after` JSON nullable
- `metadata` JSON
- `schemaVersion`

Eventos mínimos:

- `APPOINTMENT_CREATED`
- `APPOINTMENT_RESCHEDULED`
- `APPOINTMENT_CONFIRMED`
- `APPOINTMENT_CANCELLED`
- `APPOINTMENT_COMPLETED`
- `AVAILABILITY_CHANGED`
- `AVAILABILITY_EXCEPTION_CHANGED`
- `SCHEDULE_BLOCK_CREATED`
- `SCHEDULE_BLOCK_REMOVED`

Não registrar segredos, tokens ou dados desnecessários.

Para operações críticas, mutação de domínio e auditoria devem compartilhar a mesma transação quando suportado. Falha de auditoria não pode produzir sucesso silencioso.

## 9. Authorization e tenancy

`Clinic` é o tenant raiz.

Toda entidade operacional deve carregar ou derivar verificavelmente seu `clinicId`.

- Nenhuma requisição pode selecionar tenant fora do contexto autorizado.
- `professionalId`, `patientId`, `serviceId`, `appointmentId` e `scheduleBlockId` são resolvidos dentro do tenant.
- Referências cruzadas entre clinics são rejeitadas.
- Autorização ocorre antes da operação de domínio.
- Sem permissão: `403 FORBIDDEN`.
- Recurso fora do tenant não deve vazar existência.

Papéis MVP:

- `CLINIC_ADMIN`: gerencia dados e agenda da clínica.
- `STAFF`: opera agenda dentro da clínica conforme permissões.

O mecanismo concreto de autenticação fica fora deste artefato se não estiver definido pela infraestrutura existente; o contrato exige contexto verificável com `actorId`, `clinicId` e permissões.

## 10. Contrato de erros da API

Formato:

```json
{
  "error": {
    "code": "SCHEDULE_CONFLICT",
    "message": "The requested interval conflicts with an existing schedule.",
    "requestId": "uuid",
    "details": {}
  }
}
```

Códigos mínimos:

| HTTP | code | Uso |
|---|---|---|
| 400 | INVALID_REQUEST | shape/parâmetro inválido |
| 400 | INVALID_DATETIME | timestamp sem offset ou DST inválido/ambíguo |
| 401 | UNAUTHENTICATED | identidade ausente/inválida |
| 403 | FORBIDDEN | sem permissão |
| 404 | NOT_FOUND | recurso não encontrado no tenant |
| 409 | SCHEDULE_CONFLICT | conflito existente/concorrente |
| 409 | INVALID_STATE_TRANSITION | transição inválida |
| 409 | AVAILABILITY_VIOLATION | fora da disponibilidade |
| 409 | SCHEDULE_BLOCKED | intervalo bloqueado |
| 422 | VALIDATION_ERROR | validação semântica |
| 500 | INTERNAL_ERROR | falha inesperada |

`code` é estável para clientes; `message` é apenas legível.

## 11. Contratos de comando

### CreateAppointment
Entrada: `professionalId`, `patientId`, `serviceId`, `startAt` RFC3339 com offset. `clinicId` vem do contexto autorizado.

Sequência obrigatória: autorização/tenant → resolver entidades → converter para UTC → calcular duração/end → validar Availability → validar ScheduleBlock → efetivar transação/constraint → AuditEvent → resposta.

### RescheduleAppointment
Entrada: `appointmentId`, `newStartAt` RFC3339 com offset. Revalida todas as regras e a constraint concorrente.

### CancelAppointment
Entrada: `appointmentId`, `reason` opcional. Preserva registro e altera estado.

### GetSchedule
Filtros: `professionalId`, `localDate`. `localDate` é interpretada no timezone da clínica/unidade.

## 12. Critérios verificáveis para Emily

Emily deve conseguir verificar, sem backend:

- timezone IANA e política DST;
- estados/transições;
- recorrência/exceções/precedência;
- ownership de ScheduleBlock;
- mecanismo concreto de concorrência e corrida;
- schema/eventos de Audit;
- tenancy/autorização;
- contrato de erros;
- SHA de proveniência;
- ausência de implementação backend.

## 13. Handoff

**Eduardo: BLOQUEADO até reauditoria de Emily.**

Após aprovação independente, este documento passa a ser o contrato estrutural do backend. Divergência em boundary, invariantes, concorrência, tenancy ou contratos exige retorno à arquitetura.

## 14. Proveniência versionada

Base direta: `4551d8b3ea71616d00262155c6121939a3353f09`.

Arquivo: `artifacts/phases/PHASE-CLINIC-SCHEDULING-001/ARCHITECTURE.md`.

A aprovação de Emily deve referenciar o **SHA exato do commit R2**, não apenas a branch.

## 15. Fora do MVP

Pagamentos/cobrança, convênios, prontuário, prescrição, telemedicina, notificações transacionais reais, multi-clínica avançado, IA clínica e integrações externas irreversíveis.

**Nenhum backend é implementado por este artefato.**
