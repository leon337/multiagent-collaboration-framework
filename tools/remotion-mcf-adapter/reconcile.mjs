// Read-only local/remote parity: never fetch/checkout/reset, never exposes credentials.
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";

const root=process.env.REMOTION_WORKSPACES_ROOT || join(homedir(),"Projetos");
const repos=[
  {id:"studio",path:process.env.REMOTION_STUDIO_DIR || join(root,"remotion-studio"),expected:"leon337/mcf-remotion-studio",remoteRef:"refs/heads/main"},
  {id:"mcp",path:process.env.REMOTION_MCP_ROOT || join(root,"remotion-mcp"),expected:"leon337/mcf-remotion-mcp",remoteRef:"refs/heads/main"},
  {id:"mcf",path:process.env.MCF_WORKTREE_DIR || join(root,"mcf-remotion-f4-20261117"),expected:"leon337/multiagent-collaboration-framework",remoteRef:"refs/heads/feat/mcf-remotion-video-engine-f4"},
];
function command(path,args,timeout=12000){
 const p=spawnSync("git",["-C",path,...args],{encoding:"utf8",timeout,maxBuffer:100000});
 if(p.status!==0)throw Error(String(p.stderr||p.error||"GIT_FAILED").slice(0,120));
 return String(p.stdout).trim();
}
function remoteMatches(remote,expected){
 // Permit HTTPS or SSH GitHub URLs only.
 return [
  "https://github.com/"+expected+".git",
  "https://github.com/"+expected,
  "git@github.com:"+expected+".git",
  "ssh://git@github.com/"+expected+".git",
 ].includes(remote);
}
export function reconcileRepo(item) {
 const r={id:item.id,repository:item.expected,localPresent:false,remoteConfigured:false,localSha:null,remoteSha:null,clean:null,parity:"UNVERIFIED",reason:null};
 if(!existsSync(item.path)){r.reason="WORKTREE_NOT_FOUND";return r}
 r.localPresent=true;
 try {
  const url=command(item.path,["remote","get-url","origin"]);
  if(!remoteMatches(url,item.expected))throw Error("UNEXPECTED_REMOTE_ORIGIN");
  r.remoteConfigured=true;
  r.localSha=command(item.path,["rev-parse","HEAD"]);
  r.clean=command(item.path,["status","--porcelain"]).length===0;
  const line=command(item.path,["ls-remote","origin",item.remoteRef]);
  const sha=line.split(/\s+/)[0];
  if(!/^[0-9a-f]{40}$/.test(sha))throw Error("REMOTE_REF_NOT_FOUND");
  r.remoteSha=sha;
  r.parity=sha===r.localSha?(r.clean?"SYNCED_CLEAN":"SYNCED_DIRTY"):"MISMATCH_NEEDS_COMPARE";
 } catch(e) {
  r.reason=String(e.message||e).slice(0,120);
 }
 return r;
}
export function reconcileAll(items=repos){
 return {
  schema:"mcf-remotion-reconciliation/v1",
  observedAt:new Date().toISOString(),
  mode:"READ_ONLY",
  repos:items.map(reconcileRepo),
 };
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]){
 const report=reconcileAll();
 console.log(JSON.stringify(report,null,2));
 if(report.repos.some(x=>x.parity!=="SYNCED_CLEAN"))process.exitCode=2;
}
