import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import {Pool} from "pg";
import {createAppointment,createBlock,createAvailabilityException,createAvailabilityRule} from "../src/application.mjs";
import {createApi} from "../src/api.mjs";

const DATABASE_URL=process.env.DATABASE_URL;
const enabled=Boolean(DATABASE_URL);
let pool;
let admin;
let schema;
let fixture;

const ctx=()=>({
  actorId:fixture.actorId,
  actorType:"USER",
  clinicId:fixture.clinicId,
  role:"CLINIC_ADMIN",
  requestId:crypto.randomUUID(),
  correlationId:crypto.randomUUID()
});

function sqlName(name){return '"' + name.replaceAll('"','""') + '"';}

async function cleanup(){
  if(!schema)return;
  await pool?.end().catch(()=>{});
  await admin?.query("DROP SCHEMA IF EXISTS "+sqlName(schema)+" CASCADE").catch(()=>{});
  await admin?.end().catch(()=>{});
}

async function seed(){
  fixture={
    actorId:crypto.randomUUID(),
    clinicId:crypto.randomUUID(),
    professionalId:crypto.randomUUID(),
    patientId:crypto.randomUUID(),
    serviceId:crypto.randomUUID()
  };
  await pool.query("INSERT INTO clinics(id,name,timezone) VALUES($1,$2,$3)",[fixture.clinicId,"Integration Clinic","America/Recife"]);
  await pool.query("INSERT INTO professionals(id,clinic_id,name) VALUES($1,$2,$3)",[fixture.professionalId,fixture.clinicId,"Integration Professional"]);
  await pool.query("INSERT INTO patients(id,clinic_id,name) VALUES($1,$2,$3)",[fixture.patientId,fixture.clinicId,"Integration Patient"]);
  await pool.query("INSERT INTO services(id,clinic_id,name,duration_minutes) VALUES($1,$2,$3,$4)",[fixture.serviceId,fixture.clinicId,"Integration Service",30]);
  await pool.query("INSERT INTO availability_rules(clinic_id,professional_id,weekday,local_start_time,local_end_time,timezone,valid_from) VALUES($1,$2,$3,$4,$5,$6,$7)",[fixture.clinicId,fixture.professionalId,1,"08:00","18:00","America/Recife","2026-10-05"]);
}

test.before(async()=>{
  if(!enabled)return;
  schema="mcf_clinic_test_"+crypto.randomBytes(8).toString("hex");
  admin=new Pool({connectionString:DATABASE_URL,max:2});
  await admin.query("CREATE SCHEMA "+sqlName(schema));
  const migration=fs.readFileSync(new URL("../sql/001_init.sql",import.meta.url),"utf8");
  pool=new Pool({
    connectionString:DATABASE_URL,
    max:12,
    options:"-c search_path="+schema+",public"
  });
  await pool.query(migration);
  await seed();
});

test.after(cleanup);

test("HTTP GetSchedule rejects a calendrically invalid YYYY-MM-DD with 422 VALIDATION_ERROR",{skip:!enabled},async()=>{
  const provider="data:text/javascript,export default async()=>({actorId:"+JSON.stringify(crypto.randomUUID())+",clinicId:"+JSON.stringify(fixture.clinicId)+",role:'CLINIC_ADMIN'})";
  const previous=process.env.MCF_AUTH_PROVIDER;
  process.env.MCF_AUTH_PROVIDER=provider;
  try{
    const api=createApi(pool);
    const req={method:"GET",url:"/api/v1/schedule?professionalId="+fixture.professionalId+"&localDate=2026-02-31",headers:{}};
    const response=await new Promise((resolve,reject)=>{
      const res={
        writeHead(status){this.status=status;},
        end(body){this.body=body;resolve(this);}
      };
      Promise.resolve(api(req,res)).catch(reject);
    });
    assert.equal(response.status,422);
    assert.equal(JSON.parse(response.body).error.code,"VALIDATION_ERROR");
  }finally{
    if(previous===undefined)delete process.env.MCF_AUTH_PROVIDER;else process.env.MCF_AUTH_PROVIDER=previous;
  }
});

test("real PostgreSQL concurrent Appointment x ScheduleBlock leaves exactly one committed and never an invalid overlap",{skip:!enabled},async()=>{
  const startAt="2026-10-05T10:00:00-03:00";
  const endAt="2026-10-05T10:30:00-03:00";
  for(let round=0;round<12;round++){
    const results=await Promise.allSettled([
      createAppointment(pool,ctx(),{professionalId:fixture.professionalId,patientId:fixture.patientId,serviceId:fixture.serviceId,startAt}),
      createBlock(pool,ctx(),{scopeType:"PROFESSIONAL",professionalId:fixture.professionalId,startAt,endAt,reason:"race-test"})
    ]);
    const fulfilled=results.filter(x=>x.status==="fulfilled");
    const rejected=results.filter(x=>x.status==="rejected");
    assert.equal(fulfilled.length,1,JSON.stringify(results));
    assert.equal(rejected.length,1,JSON.stringify(results));
    assert.ok(["SCHEDULE_CONFLICT","SCHEDULE_BLOCKED"].includes(rejected[0].reason?.code),JSON.stringify(results));
    await pool.query("DELETE FROM appointments WHERE clinic_id=$1",[fixture.clinicId]);
    await pool.query("DELETE FROM schedule_blocks WHERE clinic_id=$1",[fixture.clinicId]);
  }
  const overlap=await pool.query("SELECT count(*)::int AS count FROM appointments a JOIN schedule_blocks b ON b.clinic_id=a.clinic_id AND b.start_at_utc<a.end_at_utc AND b.end_at_utc>a.start_at_utc WHERE a.clinic_id=$1 AND a.status IN('SCHEDULED','CONFIRMED')",[fixture.clinicId]);
  assert.equal(overlap.rows[0].count,0);
});

test("real PostgreSQL concurrent Appointment x CLOSED AvailabilityException leaves exactly one committed",{skip:!enabled},async()=>{
  const startAt="2026-10-05T11:00:00-03:00";
  for(let round=0;round<12;round++){
    const results=await Promise.allSettled([
      createAppointment(pool,ctx(),{professionalId:fixture.professionalId,patientId:fixture.patientId,serviceId:fixture.serviceId,startAt}),
      createAvailabilityException(pool,ctx(),{professionalId:fixture.professionalId,localDate:"2026-10-05",type:"CLOSED",intervals:[],reason:"race-test"})
    ]);
    const fulfilled=results.filter(x=>x.status==="fulfilled");
    const rejected=results.filter(x=>x.status==="rejected");
    assert.equal(fulfilled.length,1,JSON.stringify(results));
    assert.equal(rejected.length,1,JSON.stringify(results));
    assert.ok(["AVAILABILITY_VIOLATION","SCHEDULE_CONFLICT"].includes(rejected[0].reason?.code),JSON.stringify(results));
    await pool.query("DELETE FROM appointments WHERE clinic_id=$1",[fixture.clinicId]);
    await pool.query("DELETE FROM availability_exceptions WHERE clinic_id=$1",[fixture.clinicId]);
  }
});

test("real PostgreSQL concurrent Appointment x AvailabilityRule is serialized",{skip:!enabled},async()=>{
  const startAt="2026-10-06T11:00:00-03:00";
  for(let round=0;round<12;round++){
    const results=await Promise.allSettled([
      createAppointment(pool,ctx(),{professionalId:fixture.professionalId,patientId:fixture.patientId,serviceId:fixture.serviceId,startAt}),
      createAvailabilityRule(pool,ctx(),{
        professionalId:fixture.professionalId,
        weekday:2,
        localStartTime:"08:00",
        localEndTime:"18:00",
        timezone:"America/Recife",
        validFrom:"2026-10-06"
      })
    ]);
    const fulfilled=results.filter(x=>x.status==="fulfilled");
    const rejected=results.filter(x=>x.status==="rejected");
    assert.equal(fulfilled.length,1,JSON.stringify(results));
    assert.equal(rejected.length,1,JSON.stringify(results));
    assert.ok(["AVAILABILITY_VIOLATION"].includes(rejected[0].reason?.code),JSON.stringify(results));
    await pool.query("DELETE FROM appointments WHERE clinic_id=$1",[fixture.clinicId]);
    await pool.query("DELETE FROM availability_rules WHERE clinic_id=$1 AND weekday=$2 AND valid_from=$3",[fixture.clinicId,2,"2026-10-06"]);
  }
});

test("real PostgreSQL transaction advisory lock is held until commit",{skip:!enabled},async()=>{
  const holder=await pool.connect();
  try{
    await holder.query("BEGIN");
    await holder.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",["professional:"+fixture.clinicId+":"+fixture.professionalId]);
    let finished=false;
    const pending=createBlock(pool,ctx(),{
      scopeType:"PROFESSIONAL",
      professionalId:fixture.professionalId,
      startAt:"2026-10-05T12:00:00-03:00",
      endAt:"2026-10-05T12:30:00-03:00",
      reason:"lock-test"
    }).then(()=>{finished=true;});
    await new Promise(resolve=>setTimeout(resolve,100));
    assert.equal(finished,false);
    await holder.query("COMMIT");
    await pending;
    await pool.query("DELETE FROM schedule_blocks WHERE clinic_id=$1",[fixture.clinicId]);
  }finally{holder.release();}
});
