export async function appendAudit(db,event){
  await db.query(
    "INSERT INTO audit_events(actor_id,actor_type,clinic_id,action,entity_type,entity_id,correlation_id,request_id,before,after,metadata,schema_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
    [event.actorId,event.actorType,event.clinicId,event.action,event.entityType,event.entityId,event.correlationId??null,event.requestId??null,event.before??null,event.after??null,event.metadata??{},event.schemaVersion??"1"]
  );
}
