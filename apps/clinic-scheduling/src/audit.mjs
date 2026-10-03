export async function appendAudit(db,ctx,action,entityType,entityId,before,after){
  await db.query(
    "INSERT INTO audit_events(actor_id,actor_type,clinic_id,action,entity_type,entity_id,correlation_id,request_id,before,after,metadata,schema_version) VALUES($1,'USER',$2,$3,$4,$5,$6,$7,$8,$9,$10,'1')",
    [ctx.actorId,ctx.clinicId,action,entityType,entityId,ctx.correlationId||null,ctx.requestId||null,before,after,{}]
  );
}
