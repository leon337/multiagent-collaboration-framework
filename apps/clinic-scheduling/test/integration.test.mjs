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

async function httpJson(api,method,path,bodyValue){
  const req={
    method,
    url:path,
    headers:{"content-type":"application/json"},
    async *[Symbol.asyncIterator](){if(bodyValue)yield JSON.stringify(bodyValue);}
  };
  return new Promise((resolve,reject)=>{
    const res={writeHead(status){this.status=status;},end(body){this.body=body;resolve(this);}};
    Promise.resolve(api(req,res)).catch(reject);
  });
}

test("HTTP availability validation rejects invalid inputs with 422 VALIDATION_ERROR",{skip:!enabled},async()=>{
  const previous=process.env.MCF_AUTH_PROVIDER;
  process.env.MCF_AUTH_PROVIDER="data:text/javascript,export default async()=>({actorId:"+JSON.stringify(crypto.randomUUID())+",clinicId:"+JSON.stringify(fixture.clinicId)+",role:'CLINIC_ADMIN'})";
  try{
    const api=createApi(pool);
    const cases=[
      ["invalid validFrom",{professionalId:fixture.professionalId,weekday:1,localStartTime:"08:00",localEndTime:"18:00",timezone:"America/Recife",validFrom:"2026-02-31"}],
      ["invalid weekday",{professionalId:fixture.professionalId,weekday:7,localStartTime:"08:00",localEndTime:"18:00",timezone:"America/Recife",validFrom:"2026-10-05"}],
      ["validUntil before validFrom",{professionalId:fixture.professionalId,weekday:1,localStartTime:"08:00",localEndTime:"18:00",timezone:"America/Recife",validFrom:"2026-10-10",validUntil:"2026-10-09"}]
    ];
    for(const [label,payload] of cases){
      const response=await httpJson(api,"POST","/api/v1/availability/rules",payload);
      assert.equal(response.status,422,label+" "+response.body);
      assert.equal(JSON.parse(response.body).error.code,"VALIDATION_ERROR",label);
    }
    const invalidOpen=[
      {professionalId:fixture.professionalId,localDate:"2026-10-05",type:"OPEN",intervals:[{start:"9:00",end:"10:00"}]},
      {professionalId:fixture.professionalId,localDate:"2026-10-06",type:"OPEN",intervals:[{start:"08:00",end:"25:00"}]},
      {professionalId:fixture.professionalId,localDate:"2026-10-07",type:"OPEN",intervals:[{start:"11:00",end:"10:00"}]}
    ];
    for(const payload of invalidOpen){
      const response=await httpJson(api,"POST","/api/v1/availability/exceptions",payload);
      assert.equal(response.status,422,response.body);
      assert.equal(JSON.parse(response.body).error.code,"VALIDATION_ERROR");
    }
  }finally{
    if(previous===undefined)delete process.env.MCF_AUTH_PROVIDER;else process.env.MCF_AUTH_PROVIDER=previous;
  }
});

test("invalid availability inputs do not persist rows",{skip:!enabled},async()=>{
  const rulesBefore=Number((await pool.query("SELECT count(*) FROM availability_rules WHERE clinic_id=$1",[fixture.clinicId])).rows[0].count);
  const exceptionsBefore=Number((await pool.query("SELECT count(*) FROM availability_exceptions WHERE clinic_id=$1",[fixture.clinicId])).rows[0].count);
  await assert.rejects(()=>createAvailabilityRule(pool,ctx(),{professionalId:fixture.professionalId,weekday:7,localStartTime:"08:00",localEndTime:"18:00",timezone:"America/Recife",validFrom:"2026-02-31"}),e=>e.code==="VALIDATION_ERROR"&&e.status===422);
  await assert.rejects(()=>createAvailabilityException(pool,ctx(),{professionalId:fixture.professionalId,localDate:"2026-10-08",type:"OPEN",intervals:[{start:"8:00",end:"09:00"}]}),e=>e.code==="VALIDATION_ERROR"&&e.status===422);
  assert.equal(Number((await pool.query("SELECT count(*) FROM availability_rules WHERE clinic_id=$1",[fixture.clinicId])).rows[0].count),rulesBefore);
  assert.equal(Number((await pool.query("SELECT count(*) FROM availability_exceptions WHERE clinic_id=$1",[fixture.clinicId])).rows[0].count),exceptionsBefore);
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
    const appointmentResult=results[0];
    const ruleResult=results[1];
    assert.equal(ruleResult.status,"fulfilled",JSON.stringify(results));
    if(appointmentResult.status==="rejected"){
      assert.equal(appointmentResult.reason?.code,"AVAILABILITY_VIOLATION",JSON.stringify(results));
    }else{
      const rule=(await pool.query("SELECT 1 FROM availability_rules WHERE clinic_id=$1 AND professional_id=$2 AND weekday=$3 AND valid_from=$4",[fixture.clinicId,fixture.professionalId,2,"2026-10-06"])).rows;
      assert.equal(rule.length,1,"Appointment succeeded without the concurrent AvailabilityRule being committed first.");
    }
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


test("error responses always include a non-null requestId",{skip:!enabled},async()=>{
  const previous=process.env.MCF_AUTH_PROVIDER;
  process.env.MCF_AUTH_PROVIDER="data:text/javascript,export default async()=>({actorId:"+JSON.stringify(crypto.randomUUID())+",clinicId:"+JSON.stringify(fixture.clinicId)+",role:'CLINIC_ADMIN'})";
  try{
    const response=await httpJson(createApi(pool),"POST","/api/v1/availability/rules",{professionalId:fixture.professionalId,weekday:7,localStartTime:"08:00",localEndTime:"18:00",timezone:"America/Recife",validFrom:"2026-10-05"});
    const body=JSON.parse(response.body);
    assert.equal(response.status,422);
    assert.equal(body.error.code,"VALIDATION_ERROR");
    assert.match(body.error.requestId,/^[0-9a-f-]{36}$/);
  }finally{
    if(previous===undefined)delete process.env.MCF_AUTH_PROVIDER;else process.env.MCF_AUTH_PROVIDER=previous;
  }
});

test("audit_events rejects runtime UPDATE and DELETE",{skip:!enabled},async()=>{
  const row=(await pool.query("INSERT INTO audit_events(actor_id,actor_type,clinic_id,action,entity_type,entity_id,request_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",[fixture.actorId,"USER",fixture.clinicId,"QA_AUDIT_MUTATION","Professional",fixture.professionalId,crypto.randomUUID()])).rows[0];
  await assert.rejects(()=>pool.query("UPDATE audit_events SET action='MUTATED' WHERE id=$1",[row.id]),/audit_events is append-only/);
  await assert.rejects(()=>pool.query("DELETE FROM audit_events WHERE id=$1",[row.id]),/audit_events is append-only/);
  assert.equal((await pool.query("SELECT action FROM audit_events WHERE id=$1",[row.id])).rows[0].action,"QA_AUDIT_MUTATION");
});

test("appendAudit failure rolls back appointment and audit atomically",{skip:!enabled},async()=>{
  const beforeAppointments=Number((await pool.query("SELECT count(*) FROM appointments WHERE clinic_id=$1",[fixture.clinicId])).rows[0].count);
  const beforeAudit=Number((await pool.query("SELECT count(*) FROM audit_events WHERE clinic_id=$1",[fixture.clinicId])).rows[0].count);
  process.env.MCF_TEST_FAIL_APPEND_AUDIT="1";
  try{
    await assert.rejects(()=>createAppointment(pool,ctx(),{professionalId:fixture.professionalId,patientId:fixture.patientId,serviceId:fixture.serviceId,startAt:"2026-10-05T15:00:00-03:00"}),/MCF_TEST_APPEND_AUDIT_FAILURE/);
  }finally{delete process.env.MCF_TEST_FAIL_APPEND_AUDIT;}
  assert.equal(Number((await pool.query("SELECT count(*) FROM appointments WHERE clinic_id=$1",[fixture.clinicId])).rows[0].count),beforeAppointments);
  assert.equal(Number((await pool.query("SELECT count(*) FROM audit_events WHERE clinic_id=$1",[fixture.clinicId])).rows[0].count),beforeAudit);
});

test("ScheduleBlock has precedence over CLOSED exception and rule for booking",{skip:!enabled},async()=>{
  const day="2026-10-12";
  await createAvailabilityRule(pool,ctx(),{professionalId:fixture.professionalId,weekday:1,localStartTime:"08:00",localEndTime:"18:00",timezone:"America/Recife",validFrom:day});
  await createAvailabilityException(pool,ctx(),{professionalId:fixture.professionalId,localDate:day,type:"CLOSED",intervals:[]});
  await createBlock(pool,ctx(),{scopeType:"PROFESSIONAL",professionalId:fixture.professionalId,startAt:day+"T10:00:00-03:00",endAt:day+"T10:30:00-03:00",reason:"precedence"});
  await assert.rejects(()=>createAppointment(pool,ctx(),{professionalId:fixture.professionalId,patientId:fixture.patientId,serviceId:fixture.serviceId,startAt:day+"T10:00:00-03:00"}),e=>e.code==="SCHEDULE_BLOCKED");
  await pool.query("DELETE FROM schedule_blocks WHERE clinic_id=$1",[fixture.clinicId]);
  await pool.query("DELETE FROM availability_exceptions WHERE clinic_id=$1",[fixture.clinicId]);
  await pool.query("DELETE FROM availability_rules WHERE clinic_id=$1 AND valid_from=$2",[fixture.clinicId,day]);
});

test("DST gap and overlap are rejected and timezone snapshot is stored on appointment",{skip:!enabled},async()=>{
  await assert.rejects(()=>createAvailabilityRule(pool,ctx(),{professionalId:fixture.professionalId,weekday:0,localStartTime:"02:30",localEndTime:"03:30",timezone:"America/New_York",validFrom:"2026-03-08"}),e=>e.code==="INVALID_DATETIME");
  await assert.rejects(()=>createAvailabilityRule(pool,ctx(),{professionalId:fixture.professionalId,weekday:0,localStartTime:"01:30",localEndTime:"02:30",timezone:"America/New_York",validFrom:"2026-11-01"}),e=>e.code==="INVALID_DATETIME");
  const day="2026-10-13";
  await createAvailabilityRule(pool,ctx(),{professionalId:fixture.professionalId,weekday:2,localStartTime:"08:00",localEndTime:"18:00",timezone:"America/Recife",validFrom:day});
  const a=await createAppointment(pool,ctx(),{professionalId:fixture.professionalId,patientId:fixture.patientId,serviceId:fixture.serviceId,startAt:day+"T10:00:00-03:00"});
  assert.equal(a.timezone,"America/Recife");
  await pool.query("DELETE FROM appointments WHERE id=$1",[a.id]);
  await pool.query("DELETE FROM availability_rules WHERE clinic_id=$1 AND valid_from=$2",[fixture.clinicId,day]);
});

test("cross-tenant access is rejected and CRUD/HTTP smoke completes end-to-end",{skip:!enabled},async()=>{
  const tenant2={clinicId:crypto.randomUUID(),professionalId:crypto.randomUUID(),patientId:crypto.randomUUID(),serviceId:crypto.randomUUID(),actorId:crypto.randomUUID()};
  await pool.query("INSERT INTO clinics(id,name,timezone) VALUES($1,$2,$3)",[tenant2.clinicId,"Tenant 2","America/Recife"]);
  await pool.query("INSERT INTO professionals(id,clinic_id,name) VALUES($1,$2,$3)",[tenant2.professionalId,tenant2.clinicId,"T2 Professional"]);
  await pool.query("INSERT INTO patients(id,clinic_id,name) VALUES($1,$2,$3)",[tenant2.patientId,tenant2.clinicId,"T2 Patient"]);
  await pool.query("INSERT INTO services(id,clinic_id,name,duration_minutes) VALUES($1,$2,$3,$4)",[tenant2.serviceId,tenant2.clinicId,"T2 Service",30]);
  const foreignCtx={actorId:fixture.actorId,actorType:"USER",clinicId:fixture.clinicId,role:"CLINIC_ADMIN",requestId:crypto.randomUUID(),correlationId:crypto.randomUUID()};
  await assert.rejects(()=>createAppointment(pool,foreignCtx,{professionalId:tenant2.professionalId,patientId:tenant2.patientId,serviceId:tenant2.serviceId,startAt:"2026-10-05T16:00:00-03:00"}),e=>e.code==="NOT_FOUND");
  const previous=process.env.MCF_AUTH_PROVIDER;
  process.env.MCF_AUTH_PROVIDER="data:text/javascript,export default async()=>({actorId:"+JSON.stringify(fixture.actorId)+",clinicId:"+JSON.stringify(fixture.clinicId)+",role:'CLINIC_ADMIN'})";
  try{
    const api=createApi(pool);
    const pro=await httpJson(api,"POST","/api/v1/professionals",{name:"Smoke Professional"});
    const pat=await httpJson(api,"POST","/api/v1/patients",{name:"Smoke Patient"});
    const svc=await httpJson(api,"POST","/api/v1/services",{name:"Smoke Service",durationMinutes:30});
    assert.equal(pro.status,201);assert.equal(pat.status,201);assert.equal(svc.status,201);
    const pid=JSON.parse(pro.body).data.id,patid=JSON.parse(pat.body).data.id,sid=JSON.parse(svc.body).data.id;
    const day="2026-10-19";
    const rule=await httpJson(api,"POST","/api/v1/availability/rules",{professionalId:pid,weekday:1,localStartTime:"08:00",localEndTime:"18:00",timezone:"America/Recife",validFrom:day});
    assert.equal(rule.status,201);
    const ap=await httpJson(api,"POST","/api/v1/appointments",{professionalId:pid,patientId:patid,serviceId:sid,startAt:day+"T10:00:00-03:00"});
    assert.equal(ap.status,201);
    const aid=JSON.parse(ap.body).data.id;
    const sched=await httpJson(api,"GET","/api/v1/schedule?professionalId="+pid+"&localDate="+day);
    assert.equal(sched.status,200);
    const block=await httpJson(api,"POST","/api/v1/schedule-blocks",{scopeType:"PROFESSIONAL",professionalId:pid,startAt:day+"T11:00:00-03:00",endAt:day+"T11:30:00-03:00",reason:"smoke"});
    assert.equal(block.status,409);
    const cancel=await httpJson(api,"POST","/api/v1/appointments/"+aid+"/cancel",{reason:"smoke"});
    assert.equal(cancel.status,200);
    const block2=await httpJson(api,"POST","/api/v1/schedule-blocks",{scopeType:"PROFESSIONAL",professionalId:pid,startAt:day+"T11:00:00-03:00",endAt:day+"T11:30:00-03:00",reason:"smoke"});
    assert.equal(block2.status,201);
    const bid=JSON.parse(block2.body).data.id;
    const del=await httpJson(api,"DELETE","/api/v1/schedule-blocks/"+bid);
    assert.equal(del.status,200);
  }finally{
    if(previous===undefined)delete process.env.MCF_AUTH_PROVIDER;else process.env.MCF_AUTH_PROVIDER=previous;
  }
});
