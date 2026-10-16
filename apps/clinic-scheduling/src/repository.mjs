const q=async(db,text,params=[]) => (await db.query(text,params)).rows;

export async function withTx(pool,fn){
  const client=await pool.connect();
  try{await client.query("BEGIN");const result=await fn(client);await client.query("COMMIT");return result;}
  catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
  finally{client.release();}
}

export const lockClinicShared=(db,clinicId)=>q(db,"SELECT pg_advisory_xact_lock_shared(hashtextextended($1,0))",["clinic:"+clinicId]);
export const lockClinicExclusive=(db,clinicId)=>q(db,"SELECT pg_advisory_xact_lock(hashtextextended($1,0))",["clinic:"+clinicId]);
export const lockProfessionalExclusive=(db,clinicId,professionalId)=>q(db,"SELECT pg_advisory_xact_lock(hashtextextended($1,0))",["professional:"+clinicId+":"+professionalId]);
export const lockScheduleScope=async(db,clinicId,professionalId,{clinicExclusive=false}={})=>{
  if(clinicExclusive)return lockClinicExclusive(db,clinicId);
  await lockClinicShared(db,clinicId);
  return lockProfessionalExclusive(db,clinicId,professionalId);
};

export function isScheduleConflict(error){return error?.code==="23P01"&&error?.constraint==="appointments_no_overlap";}

export function isUniqueViolation(error,constraint){return error?.code==="23505"&&error?.constraint===constraint;}

export const clinicById=(db,clinicId)=>q(db,"SELECT id,timezone FROM clinics WHERE id=$1",[clinicId]);
export const professionalByTenant=(db,id,clinicId)=>q(db,"SELECT * FROM professionals WHERE id=$1 AND clinic_id=$2",[id,clinicId]);
export const patientByTenant=(db,id,clinicId)=>q(db,"SELECT * FROM patients WHERE id=$1 AND clinic_id=$2",[id,clinicId]);
export const serviceByTenant=(db,id,clinicId)=>q(db,"SELECT * FROM services WHERE id=$1 AND clinic_id=$2",[id,clinicId]);

export async function referencesInTenant(db,{clinicId,professionalId,patientId,serviceId}){
  const row=(await q(db,"SELECT (SELECT clinic_id FROM professionals WHERE id=$1) professional_clinic,(SELECT clinic_id FROM patients WHERE id=$2) patient_clinic,(SELECT clinic_id FROM services WHERE id=$3) service_clinic",[professionalId,patientId,serviceId]))[0];
  if(row.professional_clinic!==clinicId||row.patient_clinic!==clinicId||row.service_clinic!==clinicId)return false;
  return true;
}

export const appointmentByTenant=(db,id,clinicId)=>q(db,"SELECT * FROM appointments WHERE id=$1 AND clinic_id=$2",[id,clinicId]);
export const appointmentWithService=(db,id,clinicId)=>q(db,"SELECT a.*,s.duration_minutes FROM appointments a JOIN services s ON s.id=a.service_id AND s.clinic_id=a.clinic_id WHERE a.id=$1 AND a.clinic_id=$2",[id,clinicId]);

export const availabilityRules=(db,clinicId,professionalId)=>q(db,"SELECT weekday,local_start_time,local_end_time,timezone,valid_from,valid_until FROM availability_rules WHERE clinic_id=$1 AND professional_id=$2",[clinicId,professionalId]);
export const availabilityExceptions=(db,clinicId,professionalId)=>q(db,"SELECT local_date,type,intervals FROM availability_exceptions WHERE clinic_id=$1 AND professional_id=$2 ORDER BY local_date",[clinicId,professionalId]);
export const blocksForInterval=(db,clinicId,professionalId,start,end)=>q(db,"SELECT 1 FROM schedule_blocks WHERE clinic_id=$1 AND start_at_utc<$3 AND end_at_utc>$2 AND(scope_type='CLINIC' OR(scope_type='PROFESSIONAL' AND professional_id=$4)) LIMIT 1",[clinicId,start,end,professionalId]);

export const appointmentsForInterval=(db,clinicId,professionalId,start,end)=>q(db,"SELECT id FROM appointments WHERE clinic_id=$1 AND professional_id=$2 AND start_at_utc<$4 AND end_at_utc>$3 AND status IN('SCHEDULED','CONFIRMED') LIMIT 1",[clinicId,professionalId,start,end]);
export const appointmentsForClinicInterval=(db,clinicId,start,end)=>q(db,"SELECT id FROM appointments WHERE clinic_id=$1 AND start_at_utc<$3 AND end_at_utc>$2 AND status IN('SCHEDULED','CONFIRMED') LIMIT 1",[clinicId,start,end]);

export const insertAppointment=(db,p)=>q(db,"INSERT INTO appointments(clinic_id,professional_id,patient_id,service_id,start_at_utc,end_at_utc,timezone,status) VALUES($1,$2,$3,$4,$5,$6,$7,'SCHEDULED') RETURNING *",p);
export const updateAppointmentInterval=(db,p)=>q(db,"UPDATE appointments SET start_at_utc=$1,end_at_utc=$2,updated_at=now() WHERE id=$3 AND clinic_id=$4 RETURNING *",p);
export const updateAppointmentState=(db,p)=>q(db,"UPDATE appointments SET status=$1,cancellation_reason=CASE WHEN $1='CANCELLED' THEN $2 ELSE cancellation_reason END,updated_at=now() WHERE id=$3 AND clinic_id=$4 RETURNING *",p);

export const insertAvailabilityRule=(db,p)=>q(db,"INSERT INTO availability_rules(clinic_id,professional_id,weekday,local_start_time,local_end_time,timezone,valid_from,valid_until) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",p);
export const insertAvailabilityException=(db,p)=>q(db,"INSERT INTO availability_exceptions(clinic_id,professional_id,local_date,type,intervals,reason) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",p);

export const insertBlock=(db,p)=>q(db,"INSERT INTO schedule_blocks(clinic_id,scope_type,professional_id,start_at_utc,end_at_utc,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",p);
export const blockByTenant=(db,id,clinicId)=>q(db,"SELECT * FROM schedule_blocks WHERE id=$1 AND clinic_id=$2",[id,clinicId]);
export const deleteBlock=(db,id,clinicId)=>db.query("DELETE FROM schedule_blocks WHERE id=$1 AND clinic_id=$2",[id,clinicId]);

export const listEntity=(db,table,clinicId)=>q(db,"SELECT * FROM "+table+" WHERE clinic_id=$1 ORDER BY created_at DESC",[clinicId]);
export const createEntity=(db,entity,clinicId,input)=>{
  const table={professional:"professionals",patient:"patients",service:"services"}[entity];
  if(entity==="service")return q(db,"INSERT INTO services(clinic_id,name,duration_minutes) VALUES($1,$2,$3) RETURNING *",[clinicId,input.name.trim(),input.durationMinutes]);
  return q(db,"INSERT INTO "+table+"(clinic_id,name) VALUES($1,$2) RETURNING *",[clinicId,input.name.trim()]);
};

export const scheduleForDay=(db,clinicId,professionalId,timezone,localDate)=>q(db,"SELECT id,professional_id,patient_id,service_id,start_at_utc,end_at_utc,timezone,status FROM appointments WHERE clinic_id=$1 AND professional_id=$2 AND(start_at_utc AT TIME ZONE $3)::date=$4::date ORDER BY start_at_utc",[clinicId,professionalId,timezone,localDate]);
