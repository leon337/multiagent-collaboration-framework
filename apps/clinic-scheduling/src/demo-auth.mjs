import crypto from "node:crypto";

const ACTOR_ID="00000000-0000-4000-8000-000000000001";
const CLINIC_ID="00000000-0000-4000-8000-000000000010";

export default async function authenticateRequest(req){
  return {
    actorId:ACTOR_ID,
    clinicId:CLINIC_ID,
    role:"CLINIC_ADMIN",
    actorType:"USER",
    requestId:req.headers["x-request-id"]||crypto.randomUUID(),
    correlationId:req.headers["x-correlation-id"]||null
  };
}
