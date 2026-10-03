import crypto from "node:crypto";
import { DomainError } from "./domain.mjs";

export function resolveAuthContext(req){
  const raw=process.env.MCF_AUTH_CONTEXT;
  if(!raw) throw new DomainError("UNAUTHENTICATED","Authenticated tenant context is required.",401);
  let ctx;
  try{ctx=JSON.parse(raw);}catch{throw new DomainError("INTERNAL_ERROR","Invalid server auth context.",500);}
  if(!ctx?.actorId||!ctx?.clinicId||!ctx?.role) throw new DomainError("INTERNAL_ERROR","Incomplete server auth context.",500);
  return Object.freeze({actorId:ctx.actorId,clinicId:ctx.clinicId,role:ctx.role,requestId:req.headers["x-request-id"]||crypto.randomUUID(),correlationId:req.headers["x-correlation-id"]||null});
}
