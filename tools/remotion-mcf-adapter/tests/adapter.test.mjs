import {test} from "node:test";
import {strict as assert} from "node:assert";
import {McfRemotionAdapter} from "../adapter.mjs";
test("reject remote endpoint",()=>{
 assert.throws(()=>new McfRemotionAdapter({url:"https://example.com/mcp"}),/F4_LOCAL_ONLY/);
});
test("missing MCF dispatcher doesn't grant write",async()=>{
 const instance=new McfRemotionAdapter();
 instance.client={callTool:async()=>{throw new Error("must not execute")}};
 await assert.rejects(()=>instance.dispatch({operation:"remotion_enqueue_job",args:{}}),/MCF_HDF_PERMISSION_ENGINE_NOT_CONNECTED/);
});
test("deny unregistered MCP operations",async()=>{
 const instance=new McfRemotionAdapter();
 instance.client={callTool:async()=>{throw new Error("must not execute")}};
 await assert.rejects(()=>instance.dispatch({operation:"shell_execute",args:{}}),/OPERATION_NOT_ALLOWLISTED/);
});

test("Gemini voice generation requires a real MCF permission gate",async()=>{
 const instance=new McfRemotionAdapter();
 instance.client={callTool:async()=>{throw new Error("must not execute")}};
 await assert.rejects(
   ()=>instance.dispatch({operation:"remotion_voice_build_track",args:{projectId:"primeiro-video-mcf"}}),
   /MCF_HDF_PERMISSION_ENGINE_NOT_CONNECTED/);
});
