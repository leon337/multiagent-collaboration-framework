import {strict as assert} from "node:assert";
import {McfRemotionAdapter} from "./adapter.mjs";

const a=new McfRemotionAdapter();
try{
 const status=await a.connect();
 assert.equal(status.protocolEra,"modern");
 const health=await a.dispatch({operation:"remotion_health",args:{}});
 assert.equal(health.payload.renderer,"Chrome + ANGLE");
 const jobs=await a.dispatch({operation:"remotion_list_jobs",args:{limit:50}});
 assert.ok(jobs.payload.jobs.some(x=>x.projectId==="primeiro-video-mcf" && x.status==="completed"),"First video not found");
 let denied=false;
 try{await a.dispatch({operation:"remotion_create_project",args:{id:"unauthorized",title:"Blocked"}});}
 catch(e){denied=String(e).includes("MCF_HDF_PERMISSION_ENGINE_NOT_CONNECTED")}
 assert.equal(denied,true);
 console.log("MCF_REMOTION_F4_SMOKE_PASS",JSON.stringify({status,host:health.payload.host,localVideoVerified:true,writeDenied:true,receipt:jobs.receipt}));
}catch(e){console.error("MCF_REMOTION_F4_SMOKE_FAIL",e);process.exitCode=1;}
finally{await a.close();}
