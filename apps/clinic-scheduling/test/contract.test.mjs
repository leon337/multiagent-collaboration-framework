import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root=new URL("..",import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),"utf8");
const sql=read("sql/001_init.sql");
const repo=read("src/repository.mjs");
const app=read("src/application.mjs");
const api=read("src/api.mjs");
const auth=read("src/auth.mjs");
const server=read("src/server.mjs");

test("appointment stores timezone snapshot and clinic-linked rule timezone",()=>{
  assert.match(sql,/appointments\([\s\S]*timezone text NOT NULL/);
  assert.match(sql,/FOREIGN KEY\(clinic_id, timezone\) REFERENCES clinics\(id, timezone\)/);
  assert.match(repo,/INSERT INTO appointments\(clinic_id,professional_id,patient_id,service_id,start_at_utc,end_at_utc,timezone,status\)/);
  assert.match(app,/clinic\.timezone/);
});

test("availability exceptions are unique per tenant professional date",()=>{
  assert.match(sql,/UNIQUE\(clinic_id, professional_id, local_date\)/);
  assert.match(app,/availability_exceptions_clinic_id_professional_id_local_date_key/);
});

test("audit is structurally append-only",()=>{
  assert.match(sql,/CREATE TRIGGER audit_events_append_only/);
  assert.match(sql,/BEFORE UPDATE OR DELETE ON audit_events/);
  assert.match(sql,/REVOKE UPDATE, DELETE ON audit_events FROM PUBLIC/);
  assert.doesNotMatch(repo,/UPDATE audit_events|DELETE FROM audit_events/);
  assert.match(app,/appendAudit/);
});

test("authentication is a boundary, not client-selected tenant headers",()=>{
  assert.match(api,/authenticateRequest\(req\)/);
  assert.match(auth,/MCF_AUTH_PROVIDER/);
  assert.doesNotMatch(server,/x-actor-id|x-clinic-id|x-role/);
  assert.doesNotMatch(api,/x-actor-id|x-clinic-id|x-role/);
});

test("repository/application/audit/database boundaries are explicit",()=>{
  assert.match(app,/from "\.\/repository\.mjs"/);
  assert.match(app,/from "\.\/audit\.mjs"/);
  assert.match(repo,/db\.query/);
  assert.match(api,/from "\.\/application\.mjs"/);
  assert.doesNotMatch(app,/CREATE TABLE|INSERT INTO audit_events|SELECT .* FROM professionals/);
});
