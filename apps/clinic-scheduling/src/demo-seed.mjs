import {DEMO_IDS} from "./demo-auth.mjs";
export async function ensureDemoData(pool){
  const c=DEMO_IDS;
  await pool.query("INSERT INTO clinics(id,name,timezone) VALUES($1,'Clínica Horizonte','America/Recife') ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,timezone=EXCLUDED.timezone",[c.clinicId]);
  const professional="00000000-0000-0000-0000-000000000201",patient="00000000-0000-0000-0000-000000000301",service="00000000-0000-0000-0000-000000000401";
  await pool.query("INSERT INTO professionals(id,clinic_id,name) VALUES($1,$2,'Dra. Marina Costa') ON CONFLICT(id) DO NOTHING",[professional,c.clinicId]);
  await pool.query("INSERT INTO patients(id,clinic_id,name) VALUES($1,$2,'Ana Beatriz Lima') ON CONFLICT(id) DO NOTHING",[patient,c.clinicId]);
  await pool.query("INSERT INTO services(id,clinic_id,name,duration_minutes) VALUES($1,$2,'Consulta clínica',30) ON CONFLICT(id) DO NOTHING",[service,c.clinicId]);
  await pool.query("INSERT INTO availability_rules(clinic_id,professional_id,weekday,local_start_time,local_end_time,timezone,valid_from) VALUES($1,$2,1,'08:00','17:00','America/Recife','2026-01-01') ON CONFLICT DO NOTHING",[c.clinicId,professional]);
  return {clinicId:c.clinicId,professionalId:professional,patientId:patient,serviceId:service};
}
