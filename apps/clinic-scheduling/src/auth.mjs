import crypto from "node:crypto";
import {DomainError} from "./domain.mjs";

function providerError(message){return new DomainError("UNAUTHENTICATED",message,401);}

export async function authenticateRequest(req){
  const providerPath=process.env.MCF_AUTH_PROVIDER;
  if(!providerPath)throw providerError("Authenticated context provider is not configured.");
  let provider;
  try{provider=(await import(providerPath)).default ?? (await import(providerPath)).authenticateRequest;}catch{throw providerError("Authenticated context provider is unavailable.");}
  if(typeof provider!=="function")throw providerError("Authenticated context provider is invalid.");
  const principal=await provider(req);
  if(!principal?.actorId||!principal?.clinicId||!principal?.role)throw providerError("Authenticated principal is incomplete.");
  if(!["CLINIC_ADMIN","STAFF"].includes(principal.role))throw new DomainError("FORBIDDEN","The authenticated actor is not permitted.",403);
  const suppliedRequestId=principal.requestId??req.headers["x-request-id"];
  const requestId=typeof suppliedRequestId==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(suppliedRequestId)
    ? suppliedRequestId
    : crypto.randomUUID();
  const suppliedCorrelationId=principal.correlationId??req.headers["x-correlation-id"];
  const correlationId=typeof suppliedCorrelationId==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(suppliedCorrelationId)
    ? suppliedCorrelationId
    : crypto.randomUUID();
  return Object.freeze({
    actorId:principal.actorId,
    clinicId:principal.clinicId,
    role:principal.role,
    actorType:principal.actorType??"USER",
    requestId,
    correlationId
  });
}
