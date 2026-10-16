CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE clinics(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  timezone text NOT NULL CHECK(timezone <> ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, timezone)
);

CREATE TABLE professionals(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, clinic_id)
);

CREATE TABLE patients(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, clinic_id)
);

CREATE TABLE services(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  name text NOT NULL,
  duration_minutes integer NOT NULL CHECK(duration_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, clinic_id)
);

CREATE TABLE availability_rules(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  weekday smallint NOT NULL CHECK(weekday BETWEEN 0 AND 6),
  local_start_time time NOT NULL,
  local_end_time time NOT NULL,
  timezone text NOT NULL CHECK(timezone <> ''),
  valid_from date NOT NULL,
  valid_until date,
  CHECK(local_start_time < local_end_time),
  CHECK(valid_until IS NULL OR valid_until >= valid_from),
  FOREIGN KEY(clinic_id, timezone) REFERENCES clinics(id, timezone) ON DELETE RESTRICT,
  FOREIGN KEY(professional_id, clinic_id) REFERENCES professionals(id, clinic_id) ON DELETE RESTRICT
);

CREATE TABLE availability_exceptions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  professional_id uuid NOT NULL,
  local_date date NOT NULL,
  type text NOT NULL CHECK(type IN('OPEN','CLOSED')),
  intervals jsonb NOT NULL DEFAULT '[]'::jsonb,
  reason text,
  FOREIGN KEY(professional_id, clinic_id) REFERENCES professionals(id, clinic_id) ON DELETE RESTRICT,
  UNIQUE(clinic_id, professional_id, local_date)
);

CREATE TABLE schedule_blocks(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  scope_type text NOT NULL CHECK(scope_type IN('PROFESSIONAL','CLINIC')),
  professional_id uuid,
  start_at_utc timestamptz NOT NULL,
  end_at_utc timestamptz NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(start_at_utc < end_at_utc),
  CHECK((scope_type='PROFESSIONAL' AND professional_id IS NOT NULL) OR
        (scope_type='CLINIC' AND professional_id IS NULL)),
  FOREIGN KEY(professional_id, clinic_id) REFERENCES professionals(id, clinic_id) ON DELETE RESTRICT
);

CREATE TABLE appointments(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  professional_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  service_id uuid NOT NULL,
  start_at_utc timestamptz NOT NULL,
  end_at_utc timestamptz NOT NULL,
  timezone text NOT NULL CHECK(timezone <> ''),
  status text NOT NULL DEFAULT 'SCHEDULED' CHECK(status IN('SCHEDULED','CONFIRMED','COMPLETED','CANCELLED')),
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(start_at_utc < end_at_utc),
  FOREIGN KEY(professional_id, clinic_id) REFERENCES professionals(id, clinic_id) ON DELETE RESTRICT,
  FOREIGN KEY(patient_id, clinic_id) REFERENCES patients(id, clinic_id) ON DELETE RESTRICT,
  FOREIGN KEY(service_id, clinic_id) REFERENCES services(id, clinic_id) ON DELETE RESTRICT,
  FOREIGN KEY(clinic_id, timezone) REFERENCES clinics(id, timezone) ON DELETE RESTRICT
);

ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist(
    professional_id WITH =,
    tstzrange(start_at_utc, end_at_utc, '[)') WITH &&
  )
  WHERE(status IN('SCHEDULED','CONFIRMED'));

CREATE TABLE audit_events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at_utc timestamptz NOT NULL DEFAULT now(),
  actor_id uuid NOT NULL,
  actor_type text NOT NULL,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  correlation_id uuid,
  request_id uuid,
  before jsonb,
  after jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  schema_version text NOT NULL DEFAULT '1'
);

CREATE INDEX appointments_schedule_idx ON appointments(clinic_id, professional_id, start_at_utc);
CREATE INDEX blocks_schedule_idx ON schedule_blocks(clinic_id, start_at_utc, end_at_utc);
CREATE INDEX audit_clinic_time_idx ON audit_events(clinic_id, occurred_at_utc);

CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only';
END;
$$;

CREATE TRIGGER audit_events_append_only
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

REVOKE UPDATE, DELETE ON audit_events FROM PUBLIC;

CREATE OR REPLACE VIEW v_effective_availability AS
SELECT ar.clinic_id,
       ar.professional_id,
       (d.local_date + ar.local_start_time) AT TIME ZONE ar.timezone AS start_at_utc,
       (d.local_date + ar.local_end_time) AT TIME ZONE ar.timezone AS end_at_utc
FROM availability_rules ar
CROSS JOIN LATERAL generate_series(
  ar.valid_from::timestamp,
  COALESCE(ar.valid_until::timestamp, ar.valid_from::timestamp + interval '366 days'),
  interval '1 day'
) d(local_date)
WHERE EXTRACT(DOW FROM d.local_date)::int = ar.weekday;
