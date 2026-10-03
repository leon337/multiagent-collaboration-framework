import {DomainError} from "./domain.mjs";

function providerError(message){return new DomainError("UNAUTHENTICATED",message,401);}

export async function authenticateRequest(req){
  const providerPath=process.env.MCF_DEMO_MODE==="1"?"./demo-auth.mjs":process.env.MCF_AUTH_PROVIDER;
  if(!providerPath)throw providerError("Authenticated context provider is not configured.");
  let provider;
  try{provider=(await import(providerPath)).default ?? (await import(providerPath)).authenticateRequest;}catch{throw providerError("Authenticated context provider is unavailable.");}
  if(typeof provider!=="function")throw providerError("Authenticated context provider is invalid.");
  const principal=await provider(req);
  if(!principal?.actorId||!principal?.clinicId||!principal?.role)throw providerError("Authenticated principal is incomplete.");
  if(!["CLINIC_ADMIN","STAFF"].includes(principal.role))throw new DomainError("FORBIDDEN","The authenticated actor is not permitted.",403);
  return Object.freeze({
    actorId:principal.actorId,
    clinicId:principal.clinicId,
    role:principal.role,
    actorType:principal.actorType??"USER",
    requestId:principal.requestId??req.headers["x-request-id"]??null,
    correlationId:principal.correlationId??req.headers["x-correlation-id"]??null
  });
}
