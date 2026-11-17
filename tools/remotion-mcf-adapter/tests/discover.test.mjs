import {test} from "node:test";
import {strict as assert} from "node:assert";
import {discover} from "../discover.mjs";

test("discovery reads health and voices only, no writes",async()=>{
 const invoked=[];
 const adapter={
  async connect(){return {connected:true}},
  async dispatch({operation}){
   invoked.push(operation);
   if(operation==="remotion_health")return {payload:{host:"test-host"}};
   if(operation==="remotion_voice_providers")return {payload:{configured:true,providers:[{model:"gemini-2.5-flash-native-audio-preview-12-2025"}]}};
   throw Error("PROHIBITED");
  },
  async close(){},
 };
 const result=await discover({createAdapter:()=>adapter});
 assert.equal(result.availability,"LOCAL_READ_VERIFIED");
 assert.deepEqual(invoked,["remotion_health","remotion_voice_providers"]);
 assert.match(result.permission,/WITHOUT_HDF/);
});
test("discovery reports unavailable host truthfully",async()=>{
 const report=await discover({createAdapter:()=>({async connect(){throw Error("offline")},async close(){}})});
 assert.equal(report.availability,"UNAVAILABLE");
 assert.equal(report.reason,"offline");
});
