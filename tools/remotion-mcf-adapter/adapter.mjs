import { readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const READ = new Set([
  "remotion_health","remotion_list_compositions","remotion_get_project",
  "remotion_job_status","remotion_list_jobs","remotion_voice_providers",
]);
const WRITE = new Set([
  "remotion_create_project","remotion_edit_scene","remotion_preview",
  "remotion_render","remotion_enqueue_job","remotion_cancel_job",
  "remotion_voice_synthesize","remotion_voice_build_track",
]);
const defaultToken = join(homedir(),"Projetos","remotion-mcp",".secrets","mcp-token");

export class McfRemotionAdapter {
  constructor({ url="http://127.0.0.1:4777/mcp", tokenFile=defaultToken, authorizeWrite=null }={}) {
    const target = new URL(url);
    if(target.protocol!=="http:" || !["127.0.0.1","localhost"].includes(target.hostname) || target.pathname!=="/mcp") {
      throw new Error("F4_LOCAL_ONLY: remote exposure not authorized");
    }
    this.url=target;
    this.tokenFile=tokenFile;
    this.authorizeWrite=authorizeWrite;
    this.client=null;
  }
  async connect(){
    const info=statSync(this.tokenFile);
    if((info.mode & 0o077)!==0) throw new Error("TOKEN_PERMISSIONS_TOO_OPEN");
    const token=readFileSync(this.tokenFile,"utf8").trim();
    if(!/^[0-9a-f]{64}$/.test(token)) throw new Error("INVALID_TOKEN");
    const client=new Client({name:"mcf-remotion-local-adapter",version:"0.1.0"},{versionNegotiation:{mode:"auto"}});
    const transport=new StreamableHTTPClientTransport(this.url,{requestInit:{headers:{Authorization:"Bearer "+token}}});
    await client.connect(transport);
    this.client=client;
    return {protocolEra:client.getProtocolEra(), connected:true};
  }
  async dispatch({operation,args={},authorizationContext=null}){
    if(!this.client)throw new Error("ADAPTER_DISCONNECTED");
    if(!READ.has(operation) && !WRITE.has(operation))throw new Error("OPERATION_NOT_ALLOWLISTED");
    if(WRITE.has(operation)){
      if(typeof this.authorizeWrite!=="function")throw new Error("MCF_HDF_PERMISSION_ENGINE_NOT_CONNECTED");
      const permitted=await this.authorizeWrite({operation,args,authorizationContext});
      if(permitted!==true)throw new Error("MCF_GATE_DENIED");
    }
    const result=await this.client.callTool({name:operation,arguments:args});
    const content=result.content?.find(x=>x.type==="text");
    if(!content || content.type!=="text") throw new Error("INVALID_MCP_RESULT");
    const parsed=JSON.parse(content.text);
    if(result.isError || !parsed.ok)throw new Error("MCP_TOOL_FAILED: "+String(parsed.error||"unknown").slice(0,200));
    const payload=parsed.data;
    const observedAt=new Date().toISOString();
    const receipt={
      protocol:"mcf-remotion-adapter-receipt/v1",
      operation, observedAt,
      status:"VALID_LOCAL_MCP_RESPONSE",
      outputSha256:createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
      jobId:payload?.id ?? null,
    };
    return {payload,receipt};
  }
  async close(){if(this.client){await this.client.close();this.client=null}}
}
