import {randomUUID} from "node:crypto";
const ACTOR_ID="00000000-0000-0000-0000-000000000001";
const CLINIC_ID="00000000-0000-0000-0000-000000000101";
export const DEMO_IDS=Object.freeze({actorId:ACTOR_ID,clinicId:CLINIC_ID});
export default async function authenticateRequest(req){
  return {actorId:ACTOR_ID,clinicId:CLINIC_ID,role:"CLINIC_ADMIN",actorType:"DEMO_USER",
    requestId:req.headers["x-request-id"]||randomUUID(),correlationId:req.headers["x-correlation-id"]||randomUUID()};
}
