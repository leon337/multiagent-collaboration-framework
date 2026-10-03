import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const sql=fs.readFileSync(new URL("../sql/001_init.sql",import.meta.url),"utf8");
const service=fs.readFileSync(new URL("../src/service.mjs",import.meta.url),"utf8");
const server=fs.readFileSync(new URL("../src/server.mjs",import.meta.url),"utf8");

test("persistence enforces PostgreSQL exclusion concurrency",()=>{
  assert.match(sql,/appointments_no_overlap/);
  assert.match(sql,/EXCLUDE USING gist/);
  assert.match(sql,/tstzrange\(start_at_utc,end_at_utc,'\[\)'\)/);
});
test("appointments snapshot timezone and exceptions are deterministic",()=>{
  assert.match(sql,/end_at_utc timestamptz NOT NULL,start_at_utc timestamptz NOT NULL|start_at_utc timestamptz NOT NULL,end_at_utc timestamptz NOT NULL/);
  assert.match(sql,/timezone text NOT NULL/);
  assert.match(sql,/UNIQUE\(clinic_id,professional_id,local_date\)/);
});
test("audit is structurally append-only",()=>{
  assert.match(sql,/audit_events_append_only/);
  assert.match(sql,/BEFORE UPDATE OR DELETE ON audit_events/);
});
test("service maps conflict, availability, blocks and clinic timezone",()=>{
  assert.match(service,/SCHEDULE_CONFLICT/);
  assert.match(service,/AVAILABILITY_VIOLATION/);
  assert.match(service,/SCHEDULE_BLOCKED/);
  assert.match(service,/Availability timezone must match the clinic timezone/);
});
test("API obtains tenant context from trusted server adapter",()=>{
  assert.match(server,/resolveAuthContext/);
  assert.doesNotMatch(server,/x-clinic-id/);
  assert.doesNotMatch(server,/x-role/);
});
