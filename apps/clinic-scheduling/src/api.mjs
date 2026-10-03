import crypto from "node:crypto";
import {DomainError} from "./domain.mjs";
import {authenticateRequest} from "./auth.mjs";
import {createAppointment,rescheduleAppointment,transitionAppointment,getSchedule,getContext,crudEntity,createAvailabilityRule,createAvailabilityException,createBlock,removeBlock} from "./application.mjs";

const json=(res,status,body)=>{res.writeHead(status,{"content-type":"application/json; charset=utf-8"});res.end(JSON.stringify(body));};
async function body(req){let s="";for await(const c of req)s+=c;if(!s)return{};try{return JSON.parse(s)}catch{throw new DomainError("INVALID_REQUEST","Request body must be valid JSON.",400)}}

export function createApi(pool){
  return async function handle(req,res){
    try{
      const u=new URL(req.url,"http://localhost"),p=u.pathname.split("/").filter(Boolean);
      if(req.method==="GET"&&p[0]==="health")return json(res,200,{ok:true});
      if(p[0]!=="api"||p[1]!=="v1")return json(res,404,{error:{code:"NOT_FOUND",message:"Route not found."}});
      const ctx=await authenticateRequest(req);
      if(req.method==="POST"&&p[2]==="appointments"&&p.length===3)return json(res,201,{data:await createAppointment(pool,ctx,await body(req))});
      if(req.method==="POST"&&p[2]==="appointments"&&p[4]==="reschedule")return json(res,200,{data:await rescheduleAppointment(pool,ctx,{appointmentId:p[3],...(await body(req))})});
      if(req.method==="POST"&&p[2]==="appointments"&&p[4]==="cancel"){const b=await body(req);return json(res,200,{data:await transitionAppointment(pool,ctx,{appointmentId:p[3],to:"CANCELLED",reason:b.reason||null})});}
      if(req.method==="POST"&&p[2]==="appointments"&&p[4]==="confirm")return json(res,200,{data:await transitionAppointment(pool,ctx,{appointmentId:p[3],to:"CONFIRMED"})});
      if(req.method==="POST"&&p[2]==="appointments"&&p[4]==="complete")return json(res,200,{data:await transitionAppointment(pool,ctx,{appointmentId:p[3],to:"COMPLETED"})});
      if(req.method==="GET"&&p[2]==="schedule")return json(res,200,{data:await getSchedule(pool,ctx,{professionalId:u.searchParams.get("professionalId"),localDate:u.searchParams.get("localDate")})});
      if(req.method==="POST"&&p[2]==="availability"&&p[3]==="rules")return json(res,201,{data:await createAvailabilityRule(pool,ctx,await body(req))});
      if(req.method==="POST"&&p[2]==="availability"&&p[3]==="exceptions")return json(res,201,{data:await createAvailabilityException(pool,ctx,await body(req))});
      if(req.method==="POST"&&p[2]==="schedule-blocks")return json(res,201,{data:await createBlock(pool,ctx,await body(req))});
      if(req.method==="DELETE"&&p[2]==="schedule-blocks"&&p[3])return json(res,200,{data:await removeBlock(pool,ctx,p[3])});
      if((req.method==="GET"||req.method==="POST")&&p[2]&&["professionals","patients","services"].includes(p[2])){
        const entity=p[2].slice(0,-1);
        return json(res,req.method==="POST"?201:200,{data:await crudEntity(pool,ctx,entity,req.method==="GET"?"list":"create",req.method==="POST"?await body(req):{})});
      }
      return json(res,404,{error:{code:"NOT_FOUND",message:"Route not found."}});
    }catch(e){
      const de=e instanceof DomainError?e:new DomainError("INTERNAL_ERROR","Unexpected server error.",500);
      return json(res,de.status,{error:{code:de.code,message:de.message,requestId:e?.requestId??null,details:de.details}});
    }
  };
}
