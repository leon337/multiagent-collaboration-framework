import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import {Pool} from "pg";
import {createApi} from "../src/api.mjs";
import {createAppointment,createAvailabilityException,createAvailabilityRule,createBlock,removeBlock} from "../src/application.mjs";

const DATABASE_URL=process.env.DATABASE_URL;
const enabled=Boolean(DATABASE_URL);
let pool,admin,schema,fx;

const ctx=()=>({actorId:fx.actorId,actorType:"USER",clinicId:fx.clinicId,role:"CLINIC_ADMIN",requestId:crypto.randomUUID(),correlationId:crypto.randomUUID()});
const uuid=()=>crypto.randomUUID();
const sqlName=name=>'"'+name.replaceAll('"','""')+'"';

async function http(api,method,url,bodyValue){
  const req={method,url,headers:{}};
  if(bodyValue!==undefined)req.body=JSON.stringify(bodyValue);
  const res={status:0,body:"",writeHead(status){this.status=status;},end(body){this.body=body??"";}};
  const originalBody=req.body;
  const iterable=async function*(){if(originalBody)yield Buffer.from(originalBody);};
  req[Symbol.asyncIterator]=iterable;
  await api(req,res);
  return{status:res.status,body:res.body,json:()=>JSON.parse(res.body)};
}

async function cleanup(){
  if(!schema)return;
  await pool?.end().catch(()=>{});
  await admin?.query("DROP SCHEMA IF EXISTS "+sqlName(schema)+" CASCADE").catch(()=>{});
  await admin?.end().catch(()=>{});
}

async function seed(){
  fx={actorId:uuid(),clinicId:uuid(),professionalId:uuid(),patientId:uuid(),serviceId:uuid()};
  await pool.query("INSERT INTO clinics(id,name,timezone) VALUES($1,$2,$3)",[fx.clinicId,"Gate Clinic","America/Recife"]);
  await pool.query("INSERT INTO professionals(id,clinic_id,name) VALUES($1,$2,$3)",[fx.professionalId,fx.clinicId,"Gate Professional"]);
  await pool.query("INSERT INTO patients(id,clinic_id,name) VALUES($1,$2,$3)",[fx.patientId,fx.clinicId,"Gate Patient"]);
  await pool.query("INSERT INTO services(id,clinic_id,name,duration_minutes) VALUES($1,$2,$3,$4)",[fx.serviceId,fx.clinicId,"Gate Service",30]);
  await pool.query("INSERT INTO availability_rules(clinic_id,professional_id,weekday,local_start_time,local_end_time,timezone,valid_from) VALUES($1,$2,$3,$4,$5,$6,$7)",[fx.clinicId,fx.professionalId,1,"08:00","18:00","America/Recife","2026-10-05"]);
}

test.before(async()=>{
  if(!enabled)return;
  schema="mcf_clinic_gate_"+crypto.randomBytes(8).toString("hex");
  admin=new Pool({connectionString:DATABASE_URL,max:2});
  await admin.query("CREATE SCHEMA "+sqlName(schema));
  pool=new Pool({connectionString:DATABASE_URL,max:12,options:"-c search_path="+schema+",public"});
  await pool.query(fs.readFileSync(new URL("../sql/001_init.sql",import.meta.url),"utf8"));
  await seed();
});
test.after(cleanup);

test("DST gap and overlap are rejected at AvailabilityRule creation",{skip:!enabled},async()=>{
  const clinicId=uuid(),professionalId=uuid(),actorId=uuid();
  await pool.query("INSERT INTO clinics(id,name,timezone) VALUES($1,$2,$3)",[clinicId,"DST Clinic","America/New_York"]);
  await pool.query("INSERT INTO professionals(id,clinic_id,name) VALUES($1,$2,$3)",[professionalId,clinicId,"DST Professional"]);
  const make=(validFrom,start,end)=>createAvailabilityRule(pool,{actorId,clinicId,role:"CLINIC_ADMIN",actorType:"USER",requestId:uuid(),correlationId:uuid()},{professionalId,weekday:0,localStartTime:start,localEndTime:end,timezone:"America/New_York",validFrom});
  await assert.rejects(make("2026-03-08","02:30","03:30"),e=>e?.code==="INVALID_DATETIME");
  await assert.rejects(make("2026-11-01","01:30","02:30"),e=>e?.code==="INVALID_DATETIME");
});

test("availability precedence is proven with OPEN, CLOSED and ScheduleBlock",{skip:!enabled},async()=>{
  await createAvailabilityException(pool,ctx(),{professionalId:fx.professionalId,localDate:"2026-10-05",type:"OPEN",intervals:[{start:"08:00",end:"22:00"}],reason:"precedence-open"});
  const opened=await createAppointment(pool,ctx(),{professionalId:fx.professionalId,patientId:fx.patientId,serviceId:fx.serviceId,startAt:"2026-10-05T19:00:00-03:00"});
  assert.ok(opened.id);
  const block=await createBlock(pool,ctx(),{scopeType:"PROFESSIONAL",professionalId:fx.professionalId,startAt:"2026-10-05T20:00:00-03:00",endAt:"2026-10-05T20:30:00-03:00",reason:"precedence-block"});
  await assert.rejects(createAppointment(pool,ctx(),{professionalId:fx.professionalId,patientId:fx.patientId,serviceId:fx.serviceId,startAt:"2026-10-05T20:00:00-03:00"}),e=>e?.code==="SCHEDULE_BLOCKED"||e?.code==="SCHEDULE_CONFLICT");
  await removeBlock(pool,ctx(),block.id);
  await pool.query("DELETE FROM appointments WHERE id=$1",[opened.id]);
  await pool.query("DELETE FROM availability_exceptions WHERE clinic_id=$1 AND professional_id=$2 AND local_date=$3",[fx.clinicId,fx.professionalId,"2026-10-05"]);
  await createAvailabilityException(pool,ctx(),{professionalId:fx.professionalId,localDate:"2026-10-12",type:"CLOSED",intervals:[],reason:"precedence-closed"});
  await assert.rejects(createAppointment(pool,ctx(),{professionalId:fx.professionalId,patientId:fx.patientId,serviceId:fx.serviceId,startAt:"2026-10-12T10:00:00-03:00"}),e=>e?.code==="AVAILABILITY_VIOLATION");
  await pool.query("DELETE FROM availability_exceptions WHERE clinic_id=$1 AND professional_id=$2",[fx.clinicId,fx.professionalId]);
});

test("cross-tenant runtime isolation rejects foreign resources",{skip:!enabled},async()=>{
  const other={clinicId:uuid(),professionalId:uuid(),patientId:uuid(),serviceId:uuid()};
  await pool.query("INSERT INTO clinics(id,name,timezone) VALUES($1,$2,$3)",[other.clinicId,"Other Clinic","America/Recife"]);
  await pool.query("INSERT INTO professionals(id,clinic_id,name) VALUES($1,$2,$3)",[other.professionalId,other.clinicId,"Other Professional"]);
  await pool.query("INSERT INTO patients(id,clinic_id,name) VALUES($1,$2,$3)",[other.patientId,other.clinicId,"Other Patient"]);
  await pool.query("INSERT INTO services(id,clinic_id,name,duration_minutes) VALUES($1,$2,$3,$4)",[other.serviceId,other.clinicId,"Other Service",30]);
  await assert.rejects(createAppointment(pool,ctx(),{professionalId:other.professionalId,patientId:other.patientId,serviceId:other.serviceId,startAt:"2026-10-05T10:00:00-03:00"}),e=>e?.code==="NOT_FOUND");
});

test("audit failure proves domain mutation rolls back",{skip:!enabled},async()=>{
  await pool.query("CREATE OR REPLACE FUNCTION fail_gate_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced audit failure'; END; $$");
  await pool.query("CREATE TRIGGER gate_fail_audit BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION fail_gate_audit()");
  const startAt="2026-10-19T10:00:00-03:00";
  try{
    await assert.rejects(createAppointment(pool,ctx(),{professionalId:fx.professionalId,patientId:fx.patientId,serviceId:fx.serviceId,startAt}),/forced audit failure/);
  }finally{
    await pool.query("DROP TRIGGER IF EXISTS gate_fail_audit ON audit_events");
    await pool.query("DROP FUNCTION IF EXISTS fail_gate_audit()");
  }
  const persisted=await pool.query("SELECT count(*)::int AS count FROM appointments WHERE clinic_id=$1 AND start_at_utc=$2::timestamptz",[fx.clinicId,"2026-10-19T13:00:00Z"]);
  assert.equal(persisted.rows[0].count,0);
});

test("HTTP smoke covers CRUD and appointment lifecycle on PostgreSQL",{skip:!enabled},async()=>{
  const previous=process.env.MCF_AUTH_PROVIDER;
  process.env.MCF_AUTH_PROVIDER="data:text/javascript,export default async()=>({actorId:"+JSON.stringify(fx.actorId)+",clinicId:"+JSON.stringify(fx.clinicId)+",role:'CLINIC_ADMIN'})";
  try{
    const api=createApi(pool);
    const professional=await http(api,"POST","/api/v1/professionals",{name:"Smoke Professional"});
    assert.equal(professional.status,201);
    const patient=await http(api,"POST","/api/v1/patients",{name:"Smoke Patient"});
    assert.equal(patient.status,201);
    const service=await http(api,"POST","/api/v1/services",{name:"Smoke Service",durationMinutes:30});
    assert.equal(service.status,201);
    const rule=await http(api,"POST","/api/v1/availability/rules",{professionalId:professional.json().data.id,weekday:1,localStartTime:"08:00",localEndTime:"18:00",timezone:"America/Recife",validFrom:"2026-10-05"});
    assert.equal(rule.status,201);
    const appointment=await http(api,"POST","/api/v1/appointments",{professionalId:professional.json().data.id,patientId:patient.json().data.id,serviceId:service.json().data.id,startAt:"2026-10-05T10:00:00-03:00"});
    assert.equal(appointment.status,201);
    const id=appointment.json().data.id;
    assert.equal((await http(api,"POST",`/api/v1/appointments/${id}/confirm`)).status,200);
    assert.equal((await http(api,"POST",`/api/v1/appointments/${id}/reschedule`,{newStartAt:"2026-10-05T10:30:00-03:00"})).status,200);
    assert.equal((await http(api,"POST",`/api/v1/appointments/${id}/cancel`,{reason:"smoke"})).status,200);
    assert.equal((await http(api,"GET",`/api/v1/schedule?professionalId=${professional.json().data.id}&localDate=2026-10-05`)).status,200);
    const block=await http(api,"POST","/api/v1/schedule-blocks",{scopeType:"PROFESSIONAL",professionalId:professional.json().data.id,startAt:"2026-10-05T14:00:00-03:00",endAt:"2026-10-05T14:30:00-03:00",reason:"smoke"});
    assert.equal(block.status,201);
    assert.equal((await http(api,"DELETE",`/api/v1/schedule-blocks/${block.json().data.id}`)).status,200);
  }finally{
    if(previous===undefined)delete process.env.MCF_AUTH_PROVIDER;else process.env.MCF_AUTH_PROVIDER=previous;
  }
});
