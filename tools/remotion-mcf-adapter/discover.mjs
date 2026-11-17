import { pathToFileURL } from "node:url";
import { McfRemotionAdapter } from "./adapter.mjs";

// No action here can create videos, consume Gemini quota, or grant MCF write permission.
export async function discover({createAdapter=()=>new McfRemotionAdapter()}={}) {
  const result={
    schema:"mcf-remotion-discovery/v1",
    capabilityId:"mcf.remotion.video.local.v1",
    skillId:"MCF-REMOTION-VIDEO-PRODUCE",
    repositoryRefs:{
      mcf:"leon337/multiagent-collaboration-framework",
      studio:"leon337/mcf-remotion-studio",
      worker:"leon337/mcf-remotion-mcp",
    },
    observedAt:new Date().toISOString(),
    availability:"UNAVAILABLE",
    permission:"MCF_WRITES_DENIED_WITHOUT_HDF",
    host:null,
    voice:null,
    reason:null,
  };
  let adapter;
  try {
    adapter=createAdapter();
    const status=await adapter.connect();
    if(!status.connected)throw Error("MCP_NOT_CONNECTED");
    const health=await adapter.dispatch({operation:"remotion_health",args:{}});
    result.host=String(health.payload?.host || "unknown");
    const voices=await adapter.dispatch({operation:"remotion_voice_providers",args:{}});
    result.voice={
      configured:Boolean(voices.payload?.configured),
      models:(voices.payload?.providers || []).map(x=>x.model),
      note:"Catalog only; live model/quota availability must be tested separately",
    };
    result.availability="LOCAL_READ_VERIFIED";
  } catch(error) {
    result.reason=String(error?.message||error).slice(0,160);
  } finally {
    try{await adapter?.close()}catch{}
  }
  return result;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const report=await discover();
  console.log(JSON.stringify(report,null,2));
  if(report.availability!=="LOCAL_READ_VERIFIED")process.exitCode=2;
}
