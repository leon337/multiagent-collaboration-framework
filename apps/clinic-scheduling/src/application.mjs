import {Temporal} from "@js-temporal/polyfill";
import {DomainError,assertAppointmentReschedulable,assertTransition,interval,isFullyCovered,normalizeIntervals,parseLocalDate,parseRfc3339,requireRole,validateIanaTimezone} from "./domain.mjs";
import {appendAudit} from "./audit.mjs";
import {withTx,isScheduleConflict,isUniqueViolation,clinicById,professionalByTenant,serviceByTenant,referencesInTenant,appointmentByTenant,appointmentWithService,availabilityRules,availabilityExceptions,blocksForInterval,appointmentsForInterval,appointmentsForClinicInterval,lockScheduleScope,insertAppointment,updateAppointmentInterval,updateAppointmentState,insertAvailabilityRule,insertAvailabilityException,insertBlock,blockByTenant,deleteBlock,listEntity,createEntity,scheduleForDay} from "./repository.mjs";

function localDayInterval(localDate,timezone){
  try{
    const s=Temporal.ZonedDateTime.from({timeZone:timezone,year:localDate.year,month:localDate.month,day:localDate.day,hour:0,minute:0},{disambiguation:"reject"});
    const next=localDate.add({days:1});
    const e=Temporal.ZonedDateTime.from({timeZone:timezone,year:next.year,month:next.month,day:next.day,hour:0,minute:0},{disambiguation:"reject"});
    return{startAtUtc:new Date(Number(s.epochMilliseconds)),endAtUtc:new Date(Number(e.epochMilliseconds))};
  }catch{throw new DomainError("INVALID_DATETIME","Local calendar day is invalid or ambiguous for the clinic timezone.",400);}
}

function datesFor(start,end,timezone){
  const a=Temporal.Instant.from(start.toISOString()).toZonedDateTimeISO(timezone).toPlainDate();
  const b=Temporal.Instant.from(end.toISOString()).toZonedDateTimeISO(timezone).toPlainDate();
  const out=[];for(let d=a;;d=d.add({days:1})){out.push(d);if(Temporal.PlainDate.compare(d,b)>=0)break;}return out;
}

function localInterval(date,raw,timezone){
  const [sh,sm]=raw.start.split(":").map(Number),[eh,em]=raw.end.split(":").map(Number);
  try{
    const s=Temporal.ZonedDateTime.from({timeZone:timezone,year:date.year,month:date.month,day:date.day,hour:sh,minute:sm},{disambiguation:"reject"});
    const e=Temporal.ZonedDateTime.from({timeZone:timezone,year:date.year,month:date.month,day:date.day,hour:eh,minute:em},{disambiguation:"reject"});
    if(e.epochNanoseconds<=s.epochNanoseconds)throw new DomainError("INVALID_DATETIME","Local availability interval is invalid or crosses a DST boundary.",400);
    return{startAtUtc:new Date(Number(s.epochMilliseconds)),endAtUtc:new Date(Number(e.epochMilliseconds))};
  }catch(e){if(e instanceof DomainError)throw e;throw new DomainError("INVALID_DATETIME","Local availability interval is invalid or ambiguous for the clinic timezone.",400);}
}

async function effectiveAvailability(db,ctx,professionalId,start,end){
  const clinic=(await clinicById(db,ctx.clinicId))[0];
  if(!clinic)throw new DomainError("NOT_FOUND","Clinic was not found.",404);
  const dates=datesFor(start,end,clinic.timezone);
  const rules=await availabilityRules(db,ctx.clinicId,professionalId);
  const exceptions=await availabilityExceptions(db,ctx.clinicId,professionalId);
  const ex=new Map(exceptions.map(x=>[new Date(x.local_date).toISOString().slice(0,10),x]));
  const windows=[];
  for(const date of dates){
    const key=date.toString(),exception=ex.get(key);let locals=[];
    if(exception?.type==="OPEN")locals=normalizeIntervals(exception.intervals);
    else if(exception?.type!=="CLOSED"){
      const wd=date.dayOfWeek%7;
      locals=normalizeIntervals(rules.filter(r=>Number(r.weekday)===wd&&key>=new Date(r.valid_from).toISOString().slice(0,10)&&(!r.valid_until||key<=new Date(r.valid_until).toISOString().slice(0,10))).map(r=>({start:String(r.local_start_time).slice(0,5),end:String(r.local_end_time).slice(0,5),timezone:r.timezone})));
    }
    for(const local of locals)windows.push(localInterval(date,local,local.timezone||clinic.timezone));
  }
  return windows.sort((a,b)=>a.startAtUtc-b.startAtUtc);
}

async function assertAvailable(db,ctx,professionalId,start,end){
  if(!isFullyCovered(start,end,await effectiveAvailability(db,ctx,professionalId,start,end)))throw new DomainError("AVAILABILITY_VIOLATION","The requested interval is outside effective availability.");
  if((await blocksForInterval(db,ctx.clinicId,professionalId,start,end))[0])throw new DomainError("SCHEDULE_BLOCKED","The requested interval is blocked.");
}

export async function createAppointment(pool,ctx,input){
  requireRole(ctx);const start=parseRfc3339(input.startAt);
  return withTx(pool,async db=>{
    const clinic=(await clinicById(db,ctx.clinicId))[0];
    if(!clinic)throw new DomainError("NOT_FOUND","Clinic was not found.",404);
    if(!await referencesInTenant(db,{clinicId:ctx.clinicId,professionalId:input.professionalId,patientId:input.patientId,serviceId:input.serviceId}))throw new DomainError("NOT_FOUND","One or more referenced resources were not found in the tenant.",404);
    await lockScheduleScope(db,ctx.clinicId,input.professionalId);
    const service=(await serviceByTenant(db,input.serviceId,ctx.clinicId))[0];
    if(!service)throw new DomainError("NOT_FOUND","Service was not found.",404);
    const x=interval(start,service.duration_minutes);
    await assertAvailable(db,ctx,input.professionalId,x.startAtUtc,x.endAtUtc);
    try{
      const a=(await insertAppointment(db,[ctx.clinicId,input.professionalId,input.patientId,input.serviceId,x.startAtUtc,x.endAtUtc,clinic.timezone]))[0];
      await appendAudit(db,{actorId:ctx.actorId,actorType:ctx.actorType,clinicId:ctx.clinicId,action:"APPOINTMENT_CREATED",entityType:"Appointment",entityId:a.id,requestId:ctx.requestId,correlationId:ctx.correlationId,after:a});
      return a;
    }catch(e){if(isScheduleConflict(e))throw new DomainError("SCHEDULE_CONFLICT","The requested interval conflicts with an existing schedule.");throw e;}
  });
}

export async function rescheduleAppointment(pool,ctx,input){
  requireRole(ctx);const start=parseRfc3339(input.newStartAt);
  return withTx(pool,async db=>{
    const a=(await appointmentWithService(db,input.appointmentId,ctx.clinicId))[0];
    if(!a)throw new DomainError("NOT_FOUND","Appointment was not found.",404);
    assertAppointmentReschedulable(a.status);
    await lockScheduleScope(db,ctx.clinicId,a.professional_id);
    const x=interval(start,a.duration_minutes);
    await assertAvailable(db,ctx,a.professional_id,x.startAtUtc,x.endAtUtc);
    try{
      const updated=(await updateAppointmentInterval(db,[x.startAtUtc,x.endAtUtc,a.id,ctx.clinicId]))[0];
      await appendAudit(db,{actorId:ctx.actorId,actorType:ctx.actorType,clinicId:ctx.clinicId,action:"APPOINTMENT_RESCHEDULED",entityType:"Appointment",entityId:a.id,requestId:ctx.requestId,correlationId:ctx.correlationId,before:a,after:updated});
      return updated;
    }catch(e){if(isScheduleConflict(e))throw new DomainError("SCHEDULE_CONFLICT","The requested interval conflicts with an existing schedule.");throw e;}
  });
}

export async function transitionAppointment(pool,ctx,input){
  requireRole(ctx);
  return withTx(pool,async db=>{
    const a=(await appointmentByTenant(db,input.appointmentId,ctx.clinicId))[0];
    if(!a)throw new DomainError("NOT_FOUND","Appointment was not found.",404);
    assertTransition(a.status,input.to);
    const updated=(await updateAppointmentState(db,[input.to,input.reason||null,a.id,ctx.clinicId]))[0];
    await appendAudit(db,{actorId:ctx.actorId,actorType:ctx.actorType,clinicId:ctx.clinicId,action:"APPOINTMENT_"+input.to,entityType:"Appointment",entityId:a.id,requestId:ctx.requestId,correlationId:ctx.correlationId,before:a,after:updated});
    return updated;
  });
}

export async function getSchedule(pool,ctx,input){
  requireRole(ctx);
  const localDate=parseLocalDate(input.localDate);
  const p=(await professionalByTenant(pool,input.professionalId,ctx.clinicId))[0];
  if(!p)throw new DomainError("NOT_FOUND","Professional was not found.",404);
  const c=(await clinicById(pool,ctx.clinicId))[0];
  return scheduleForDay(pool,ctx.clinicId,input.professionalId,c.timezone,localDate.toString());
}

export async function createAvailabilityRule(pool,ctx,input){
  requireRole(ctx);
  const timezone=validateIanaTimezone(input.timezone);
  const validFrom=parseLocalDate(input.validFrom);
  const validUntil=input.validUntil?parseLocalDate(input.validUntil):null;
  if(validUntil&&Temporal.PlainDate.compare(validUntil,validFrom)<0)throw new DomainError("VALIDATION_ERROR","validUntil must be on or after validFrom.",422);
  if(!Number.isInteger(input.weekday)||input.weekday<0||input.weekday>6)throw new DomainError("VALIDATION_ERROR","weekday must be an integer between 0 and 6.",422);
  normalizeIntervals([{start:input.localStartTime,end:input.localEndTime}]);
  localInterval(validFrom,{start:input.localStartTime,end:input.localEndTime},timezone);
  return withTx(pool,async db=>{
    const clinic=(await clinicById(db,ctx.clinicId))[0];
    if(!clinic)throw new DomainError("NOT_FOUND","Clinic was not found.",404);
    if(clinic.timezone!==timezone)throw new DomainError("VALIDATION_ERROR","AvailabilityRule timezone must equal the clinic IANA timezone.",422);
    if(!(await professionalByTenant(db,input.professionalId,ctx.clinicId))[0])throw new DomainError("NOT_FOUND","Professional was not found.",404);
    await lockScheduleScope(db,ctx.clinicId,input.professionalId);
    const r=(await insertAvailabilityRule(db,[ctx.clinicId,input.professionalId,input.weekday,input.localStartTime,input.localEndTime,timezone,validFrom.toString(),validUntil?.toString()||null]))[0];
    await appendAudit(db,{actorId:ctx.actorId,actorType:ctx.actorType,clinicId:ctx.clinicId,action:"AVAILABILITY_CHANGED",entityType:"AvailabilityRule",entityId:r.id,requestId:ctx.requestId,correlationId:ctx.correlationId,after:r});
    return r;
  });
}

export async function createAvailabilityException(pool,ctx,input){
  requireRole(ctx);
  if(!["OPEN","CLOSED"].includes(input.type))throw new DomainError("VALIDATION_ERROR","Exception type must be OPEN or CLOSED.",422);
  const intervals=input.type==="OPEN"?normalizeIntervals(input.intervals):[];
  const localDate=parseLocalDate(input.localDate);
  return withTx(pool,async db=>{
    const clinic=(await clinicById(db,ctx.clinicId))[0];
    if(!clinic)throw new DomainError("NOT_FOUND","Clinic was not found.",404);
    if(!(await professionalByTenant(db,input.professionalId,ctx.clinicId))[0])throw new DomainError("NOT_FOUND","Professional was not found.",404);
    await lockScheduleScope(db,ctx.clinicId,input.professionalId);
    if(input.type==="CLOSED"){
      const day=localDayInterval(localDate,clinic.timezone);
      if((await appointmentsForInterval(db,ctx.clinicId,input.professionalId,day.startAtUtc,day.endAtUtc))[0])throw new DomainError("AVAILABILITY_VIOLATION","The closed exception conflicts with an existing appointment.");
    }
    try{
      const r=(await insertAvailabilityException(db,[ctx.clinicId,input.professionalId,localDate.toString(),input.type,JSON.stringify(intervals),input.reason||null]))[0];
      await appendAudit(db,{actorId:ctx.actorId,actorType:ctx.actorType,clinicId:ctx.clinicId,action:"AVAILABILITY_EXCEPTION_CHANGED",entityType:"AvailabilityException",entityId:r.id,requestId:ctx.requestId,correlationId:ctx.correlationId,after:r});
      return r;
    }catch(e){if(isUniqueViolation(e,"availability_exceptions_clinic_id_professional_id_local_date_key"))throw new DomainError("VALIDATION_ERROR","An availability exception already exists for this clinic, professional and local date.",422);throw e;}
  });
}

export async function createBlock(pool,ctx,input){
  requireRole(ctx);
  if(input.scopeType==="PROFESSIONAL"&&!input.professionalId)throw new DomainError("VALIDATION_ERROR","professionalId is required for PROFESSIONAL blocks.",422);
  if(input.scopeType==="CLINIC"&&input.professionalId)throw new DomainError("VALIDATION_ERROR","professionalId is forbidden for CLINIC blocks.",422);
  if(!["PROFESSIONAL","CLINIC"].includes(input.scopeType))throw new DomainError("VALIDATION_ERROR","scopeType must be PROFESSIONAL or CLINIC.",422);
  const start=parseRfc3339(input.startAt),end=parseRfc3339(input.endAt);if(end<=start)throw new DomainError("VALIDATION_ERROR","Block interval must be non-empty.",422);
  return withTx(pool,async db=>{
    if(input.professionalId&&!(await professionalByTenant(db,input.professionalId,ctx.clinicId))[0])throw new DomainError("NOT_FOUND","Professional was not found.",404);
    if(input.scopeType==="CLINIC")await lockScheduleScope(db,ctx.clinicId,null,{clinicExclusive:true});
    else await lockScheduleScope(db,ctx.clinicId,input.professionalId);
    const conflicting=input.scopeType==="CLINIC"
      ? await appointmentsForClinicInterval(db,ctx.clinicId,start,end)
      : await appointmentsForInterval(db,ctx.clinicId,input.professionalId,start,end);
    if(conflicting[0])throw new DomainError("SCHEDULE_CONFLICT","The block interval conflicts with an existing appointment.");
    const b=(await insertBlock(db,[ctx.clinicId,input.scopeType,input.professionalId||null,start,end,input.reason||null,ctx.actorId]))[0];
    await appendAudit(db,{actorId:ctx.actorId,actorType:ctx.actorType,clinicId:ctx.clinicId,action:"SCHEDULE_BLOCK_CREATED",entityType:"ScheduleBlock",entityId:b.id,requestId:ctx.requestId,correlationId:ctx.correlationId,after:b});
    return b;
  });
}

export async function removeBlock(pool,ctx,id){
  requireRole(ctx);
  return withTx(pool,async db=>{
    const b=(await blockByTenant(db,id,ctx.clinicId))[0];
    if(!b)throw new DomainError("NOT_FOUND","Schedule block was not found.",404);
    if(b.scope_type==="CLINIC")await lockScheduleScope(db,ctx.clinicId,null,{clinicExclusive:true});
    else await lockScheduleScope(db,ctx.clinicId,b.professional_id);
    await deleteBlock(db,id,ctx.clinicId);
    await appendAudit(db,{actorId:ctx.actorId,actorType:ctx.actorType,clinicId:ctx.clinicId,action:"SCHEDULE_BLOCK_REMOVED",entityType:"ScheduleBlock",entityId:id,requestId:ctx.requestId,correlationId:ctx.correlationId,before:b});
    return b;
  });
}

export async function crudEntity(pool,ctx,entity,method,input){
  requireRole(ctx);
  const table={professional:"professionals",patient:"patients",service:"services"}[entity];
  if(!table)throw new DomainError("INVALID_REQUEST","Unsupported entity.",400);
  if(method==="list")return listEntity(pool,table,ctx.clinicId);
  if(typeof input.name!=="string"||!input.name.trim())throw new DomainError("VALIDATION_ERROR","name is required.",422);
  if(entity==="service"&&(!Number.isInteger(input.durationMinutes)||input.durationMinutes<=0))throw new DomainError("VALIDATION_ERROR","durationMinutes must be positive.",422);
  return createEntity(pool,entity,ctx.clinicId,input).then(x=>x[0]);
}
