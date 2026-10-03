import { Temporal } from "@js-temporal/polyfill";
import { DomainError,assertAppointmentReschedulable,assertTransition,interval,isFullyCovered,normalizeIntervals,parseRfc3339,requireRole } from "./domain.mjs";
import { isScheduleConflict } from "./db.mjs";
import { query,queryOne,withTx } from "./repository.mjs";
import { appendAudit } from "./audit.mjs";

function datesFor(start,end,timezone){
  const a=Temporal.Instant.from(start.toISOString()).toZonedDateTimeISO(timezone).toPlainDate();
  const b=Temporal.Instant.from(end.toISOString()).toZonedDateTimeISO(timezone).toPlainDate();
  const out=[];for(let d=a;;d=d.add({days:1})){out.push(d);if(Temporal.PlainDate.compare(d,b)>=0)break;}return out;
}
function localInterval(date,raw,timezone){
  const [sh,sm]=raw.start.split(":").map(Number),[eh,em]=raw.end.split(":").map(Number);
  try{
    const s=Temporal.ZonedDateTime.from({timeZone:timezone,year:date.year,month:date.month,day:date.day,hour:sh,minute:sm,disambiguation:"reject"});
    const e=Temporal.ZonedDateTime.from({timeZone:timezone,year:date.year,month:date.month,day:date.day,hour:eh,minute:em,disambiguation:"reject"});
    if(e.epochNanoseconds<=s.epochNanoseconds)throw new DomainError("INVALID_DATETIME","Local availability interval is invalid.",400);
    return{startAtUtc:new Date(Number(s.epochMilliseconds)),endAtUtc:new Date(Number(e.epochMilliseconds))};
  }catch(e){if(e instanceof DomainError)throw e;throw new DomainError("INVALID_DATETIME","Local availability interval is invalid or ambiguous for the clinic timezone.",400);}
}
async function clinicTimezone(db,clinicId){
  const c=await queryOne(db,"SELECT timezone FROM clinics WHERE id=$1",[clinicId]);
  if(!c)throw new DomainError("NOT_FOUND","Clinic was not found.",404);
  return c.timezone;
}
async function availabilityWindows(db,ctx,professionalId,start,end){
  const timezone=await clinicTimezone(db,ctx.clinicId);
  const dates=datesFor(start,end,timezone);
  const rules=await query(db,"SELECT weekday,local_start_time,local_end_time,valid_from,valid_until FROM availability_rules WHERE clinic_id=$1 AND professional_id=$2",[ctx.clinicId,professionalId]);
  const exceptions=await query(db,"SELECT local_date,type,intervals FROM availability_exceptions WHERE clinic_id=$1 AND professional_id=$2 ORDER BY local_date",[ctx.clinicId,professionalId]);
  const ex=new Map(exceptions.map(x=>[String(x.local_date).slice(0,10),x]));
  const windows=[];
  for(const date of dates){
    const key=date.toString(),exception=ex.get(key);let locals=[];
    if(exception?.type==="OPEN")locals=normalizeIntervals(exception.intervals);
    else if(exception?.type!=="CLOSED"){
      const wd=date.dayOfWeek%7;
      locals=normalizeIntervals(rules.filter(r=>Number(r.weekday)===wd&&key>=String(r.valid_from).slice(0,10)&&(!r.valid_until||key<=String(r.valid_until).slice(0,10))).map(r=>({start:String(r.local_start_time).slice(0,5),end:String(r.local_end_time).slice(0,5)})));
    }
    for(const local of locals)windows.push(localInterval(date,local,timezone));
  }
  return windows.sort((a,b)=>a.startAtUtc-b.startAtUtc);
}
async function assertAvailable(db,ctx,professionalId,start,end){
  if(!isFullyCovered(start,end,await availabilityWindows(db,ctx,professionalId,start,end)))throw new DomainError("AVAILABILITY_VIOLATION","The requested interval is outside effective availability.");
  const blocked=await query(db,"SELECT 1 FROM schedule_blocks WHERE clinic_id=$1 AND start_at_utc<$3 AND end_at_utc>$2 AND(scope_type='CLINIC' OR(scope_type='PROFESSIONAL' AND professional_id=$4)) LIMIT 1",[ctx.clinicId,start,end,professionalId]);
  if(blocked[0])throw new DomainError("SCHEDULE_BLOCKED","The requested interval is blocked.");
}
async function refs(db,ctx,professionalId,patientId,serviceId){
  const r=await queryOne(db,"SELECT (SELECT clinic_id FROM professionals WHERE id=$1) professional_clinic,(SELECT clinic_id FROM patients WHERE id=$2) patient_clinic,(SELECT clinic_id FROM services WHERE id=$3) service_clinic",[professionalId,patientId,serviceId]);
  if(!r||r.professional_clinic!==ctx.clinicId||r.patient_clinic!==ctx.clinicId||r.service_clinic!==ctx.clinicId)throw new DomainError("NOT_FOUND","One or more referenced resources were not found in the tenant.",404);
}
export async function createAppointment(pool,ctx,input){
  requireRole(ctx);const start=parseRfc3339(input.startAt);
  return withTx(pool,async db=>{
    await refs(db,ctx,input.professionalId,input.patientId,input.serviceId);
    const service=await queryOne(db,"SELECT duration_minutes FROM services WHERE id=$1 AND clinic_id=$2",[input.serviceId,ctx.clinicId]);
    if(!service)throw new DomainError("NOT_FOUND","Service was not found.",404);
    const timezone=await clinicTimezone(db,ctx.clinicId),x=interval(start,service.duration_minutes);
    await assertAvailable(db,ctx,input.professionalId,x.startAtUtc,x.endAtUtc);
    try{
      const a=await queryOne(db,"INSERT INTO appointments(clinic_id,professional_id,patient_id,service_id,start_at_utc,end_at_utc,timezone,status) VALUES($1,$2,$3,$4,$5,$6,$7,'SCHEDULED') RETURNING *",[ctx.clinicId,input.professionalId,input.patientId,input.serviceId,x.startAtUtc,x.endAtUtc,timezone]);
      await appendAudit(db,ctx,"APPOINTMENT_CREATED","Appointment",a.id,null,a);return a;
    }catch(e){if(isScheduleConflict(e))throw new DomainError("SCHEDULE_CONFLICT","The requested interval conflicts with an existing schedule.");throw e;}
  });
}
export async function rescheduleAppointment(pool,ctx,input){
  requireRole(ctx);const start=parseRfc3339(input.newStartAt);
  return withTx(pool,async db=>{
    const a=await queryOne(db,"SELECT a.*,s.duration_minutes FROM appointments a JOIN services s ON s.id=a.service_id WHERE a.id=$1 AND a.clinic_id=$2",[input.appointmentId,ctx.clinicId]);
    if(!a)throw new DomainError("NOT_FOUND","Appointment was not found.",404);assertAppointmentReschedulable(a.status);
    const x=interval(start,a.duration_minutes);await assertAvailable(db,ctx,a.professional_id,x.startAtUtc,x.endAtUtc);
    try{const updated=await queryOne(db,"UPDATE appointments SET start_at_utc=$1,end_at_utc=$2,updated_at=now() WHERE id=$3 AND clinic_id=$4 RETURNING *",[x.startAtUtc,x.endAtUtc,a.id,ctx.clinicId]);await appendAudit(db,ctx,"APPOINTMENT_RESCHEDULED","Appointment",a.id,a,updated);return updated;}
    catch(e){if(isScheduleConflict(e))throw new DomainError("SCHEDULE_CONFLICT","The requested interval conflicts with an existing schedule.");throw e;}
  });
}
export async function transitionAppointment(pool,ctx,input){
  requireRole(ctx);return withTx(pool,async db=>{
    const a=await queryOne(db,"SELECT * FROM appointments WHERE id=$1 AND clinic_id=$2",[input.appointmentId,ctx.clinicId]);
    if(!a)throw new DomainError("NOT_FOUND","Appointment was not found.",404);assertTransition(a.status,input.to);
    const updated=await queryOne(db,"UPDATE appointments SET status=$1,cancellation_reason=CASE WHEN $1='CANCELLED' THEN $2 ELSE cancellation_reason END,updated_at=now() WHERE id=$3 AND clinic_id=$4 RETURNING *",[input.to,input.reason||null,a.id,ctx.clinicId]);
    await appendAudit(db,ctx,"APPOINTMENT_"+input.to,"Appointment",a.id,a,updated);return updated;
  });
}
export async function getSchedule(pool,ctx,input){
  requireRole(ctx);if(!/^\d{4}-\d{2}-\d{2}$/.test(input.localDate||""))throw new DomainError("VALIDATION_ERROR","localDate must be YYYY-MM-DD.",422);
  const p=await queryOne(pool,"SELECT id FROM professionals WHERE id=$1 AND clinic_id=$2",[input.professionalId,ctx.clinicId]);if(!p)throw new DomainError("NOT_FOUND","Professional was not found.",404);
  const timezone=await clinicTimezone(pool,ctx.clinicId);
  return query(pool,"SELECT id,professional_id,patient_id,service_id,start_at_utc,end_at_utc,timezone,status FROM appointments WHERE clinic_id=$1 AND professional_id=$2 AND(start_at_utc AT TIME ZONE $3)::date=$4::date ORDER BY start_at_utc",[ctx.clinicId,input.professionalId,timezone,input.localDate]);
}
export async function createAvailabilityRule(pool,ctx,input){
  requireRole(ctx);normalizeIntervals([{start:input.localStartTime,end:input.localEndTime}]);const timezone=await clinicTimezone(pool,ctx.clinicId);if(input.timezone!==timezone)throw new DomainError("VALIDATION_ERROR","Availability timezone must match the clinic timezone.",422);
  const d=Temporal.PlainDate.from(input.validFrom);localInterval(d,{start:input.localStartTime,end:input.localEndTime},timezone);
  return withTx(pool,async db=>{const p=await queryOne(db,"SELECT id FROM professionals WHERE id=$1 AND clinic_id=$2",[input.professionalId,ctx.clinicId]);if(!p)throw new DomainError("NOT_FOUND","Professional was not found.",404);
    const r=await queryOne(db,"INSERT INTO availability_rules(clinic_id,professional_id,weekday,local_start_time,local_end_time,timezone,valid_from,valid_until) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",[ctx.clinicId,input.professionalId,input.weekday,input.localStartTime,input.localEndTime,timezone,input.validFrom,input.validUntil||null]);await appendAudit(db,ctx,"AVAILABILITY_CHANGED","AvailabilityRule",r.id,null,r);return r;});
}
export async function createAvailabilityException(pool,ctx,input){
  requireRole(ctx);const intervals=input.type==="OPEN"?normalizeIntervals(input.intervals):[];if(!["OPEN","CLOSED"].includes(input.type))throw new DomainError("VALIDATION_ERROR","Exception type must be OPEN or CLOSED.",422);
  return withTx(pool,async db=>{const p=await queryOne(db,"SELECT id FROM professionals WHERE id=$1 AND clinic_id=$2",[input.professionalId,ctx.clinicId]);if(!p)throw new DomainError("NOT_FOUND","Professional was not found.",404);
    try{const r=await queryOne(db,"INSERT INTO availability_exceptions(clinic_id,professional_id,local_date,type,intervals,reason) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",[ctx.clinicId,input.professionalId,input.localDate,input.type,JSON.stringify(intervals),input.reason||null]);await appendAudit(db,ctx,"AVAILABILITY_EXCEPTION_CHANGED","AvailabilityException",r.id,null,r);return r;}
    catch(e){if(e?.code==="23505")throw new DomainError("VALIDATION_ERROR","An availability exception already exists for this professional and date.",422);throw e;}
  });
}
export async function createBlock(pool,ctx,input){
  requireRole(ctx);if(input.scopeType==="PROFESSIONAL"&&!input.professionalId)throw new DomainError("VALIDATION_ERROR","professionalId is required for PROFESSIONAL blocks.",422);if(input.scopeType==="CLINIC"&&input.professionalId)throw new DomainError("VALIDATION_ERROR","professionalId is forbidden for CLINIC blocks.",422);if(!["PROFESSIONAL","CLINIC"].includes(input.scopeType))throw new DomainError("VALIDATION_ERROR","scopeType must be PROFESSIONAL or CLINIC.",422);
  const start=parseRfc3339(input.startAt),end=parseRfc3339(input.endAt);if(end<=start)throw new DomainError("VALIDATION_ERROR","Block interval must be non-empty.",422);
  return withTx(pool,async db=>{if(input.professionalId&&!await queryOne(db,"SELECT id FROM professionals WHERE id=$1 AND clinic_id=$2",[input.professionalId,ctx.clinicId]))throw new DomainError("NOT_FOUND","Professional was not found.",404);
    const b=await queryOne(db,"INSERT INTO schedule_blocks(clinic_id,scope_type,professional_id,start_at_utc,end_at_utc,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",[ctx.clinicId,input.scopeType,input.professionalId||null,start,end,input.reason||null,ctx.actorId]);await appendAudit(db,ctx,"SCHEDULE_BLOCK_CREATED","ScheduleBlock",b.id,null,b);return b;});
}
export async function removeBlock(pool,ctx,id){
  requireRole(ctx);return withTx(pool,async db=>{const b=await queryOne(db,"SELECT * FROM schedule_blocks WHERE id=$1 AND clinic_id=$2",[id,ctx.clinicId]);if(!b)throw new DomainError("NOT_FOUND","Schedule block was not found.",404);
    await db.query("DELETE FROM schedule_blocks WHERE id=$1 AND clinic_id=$2",[id,ctx.clinicId]);await appendAudit(db,ctx,"SCHEDULE_BLOCK_REMOVED","ScheduleBlock",id,b,null);return b;});
}
export async function crudEntity(pool,ctx,entity,method,input){
  requireRole(ctx);const tables={professional:"professionals",patient:"patients",service:"services"},table=tables[entity];if(!table)throw new DomainError("INVALID_REQUEST","Unsupported entity.",400);
  if(method==="list")return query(pool,"SELECT * FROM "+table+" WHERE clinic_id=$1 ORDER BY created_at DESC",[ctx.clinicId]);
  if(typeof input.name!=="string"||!input.name.trim())throw new DomainError("VALIDATION_ERROR","name is required.",422);
  if(entity==="service"&&(!Number.isInteger(input.durationMinutes)||input.durationMinutes<=0))throw new DomainError("VALIDATION_ERROR","durationMinutes must be positive.",422);
  const rows=entity==="service"?await query(pool,"INSERT INTO services(clinic_id,name,duration_minutes) VALUES($1,$2,$3) RETURNING *",[ctx.clinicId,input.name.trim(),input.durationMinutes]):await query(pool,"INSERT INTO "+table+"(clinic_id,name) VALUES($1,$2) RETURNING *",[ctx.clinicId,input.name.trim()]);
  return rows[0];
}
