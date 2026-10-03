import {Temporal} from "@js-temporal/polyfill";

export const APPOINTMENT_STATES=Object.freeze(["SCHEDULED","CONFIRMED","COMPLETED","CANCELLED"]);
export const ACTIVE_APPOINTMENT_STATES=new Set(["SCHEDULED","CONFIRMED"]);
export const ROLES=new Set(["CLINIC_ADMIN","STAFF"]);

export class DomainError extends Error{
  constructor(code,message,status=409,details={}){super(message);this.code=code;this.status=status;this.details=details;}
}

export function requireRole(ctx,allowed=[...ROLES]){
  if(!ctx?.actorId||!ctx?.clinicId)throw new DomainError("UNAUTHENTICATED","Authenticated tenant context is required.",401);
  if(!ROLES.has(ctx.role)||!allowed.includes(ctx.role))throw new DomainError("FORBIDDEN","The actor is not permitted to perform this operation.",403);
  return ctx;
}

export function parseLocalDate(value){
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new DomainError("VALIDATION_ERROR","localDate must be YYYY-MM-DD.",422);
  try{return Temporal.PlainDate.from(value);}catch{throw new DomainError("VALIDATION_ERROR","localDate must be a valid calendar date.",422);}
}

export function parseRfc3339(value){
  if(typeof value!=="string"||!/[zZ]|[+-]\d{2}:?\d{2}$/.test(value))throw new DomainError("INVALID_DATETIME","Timestamp must be RFC 3339 with an explicit offset.",400);
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))throw new DomainError("INVALID_DATETIME","Timestamp is invalid.",400);
  return d;
}

export function interval(start,durationMinutes){
  if(!Number.isInteger(durationMinutes)||durationMinutes<=0)throw new DomainError("VALIDATION_ERROR","Service duration must be a positive integer in minutes.",422);
  const end=new Date(start.getTime()+durationMinutes*60000);
  if(end<=start)throw new DomainError("VALIDATION_ERROR","Appointment interval must be non-empty.",422);
  return{startAtUtc:start,endAtUtc:end};
}

export function assertTransition(from,to){
  const allowed={SCHEDULED:new Set(["CONFIRMED","CANCELLED","COMPLETED"]),CONFIRMED:new Set(["CANCELLED","COMPLETED"]),COMPLETED:new Set(),CANCELLED:new Set()};
  if(!APPOINTMENT_STATES.includes(from)||!APPOINTMENT_STATES.includes(to)||!allowed[from].has(to))throw new DomainError("INVALID_STATE_TRANSITION","Requested appointment state transition is not allowed.");
}

export function assertAppointmentReschedulable(status){
  if(status!=="SCHEDULED"&&status!=="CONFIRMED")throw new DomainError("INVALID_STATE_TRANSITION","Only SCHEDULED or CONFIRMED appointments can be rescheduled.");
}

export function normalizeIntervals(intervals){
  if(!Array.isArray(intervals))throw new DomainError("VALIDATION_ERROR","Intervals must be an array.",422);
  const sorted=intervals.map(x=>{
    if(!x?.start||!x?.end||x.start>=x.end)throw new DomainError("VALIDATION_ERROR","Availability intervals must be ordered and non-empty.",422);
    return{start:x.start,end:x.end};
  }).sort((a,b)=>a.start.localeCompare(b.start));
  const out=[];
  for(const item of sorted){
    const last=out.at(-1);
    if(!last||item.start>last.end)out.push({...item});
    else if(item.end>last.end)last.end=item.end;
  }
  return out;
}

export function isFullyCovered(targetStart,targetEnd,windows){
  let cursor=targetStart.getTime(),end=targetEnd.getTime();
  for(const w of windows){
    if(w.startAtUtc.getTime()>cursor)return false;
    if(w.endAtUtc.getTime()>cursor)cursor=w.endAtUtc.getTime();
    if(cursor>=end)return true;
  }
  return false;
}

export function validateIanaTimezone(timezone){
  if(typeof timezone!=="string"||!timezone.trim())throw new DomainError("VALIDATION_ERROR","timezone must be an IANA timezone identifier.",422);
  try{new Intl.DateTimeFormat("en-US",{timeZone:timezone}).format();}catch{throw new DomainError("VALIDATION_ERROR","timezone must be a valid IANA timezone identifier.",422);}
  return timezone;
}
