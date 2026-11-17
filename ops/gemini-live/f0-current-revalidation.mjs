/**
 * MCF F0.2/F0.3: reproducible, read-only live inventory and model metadata probe.
 * Never logs, writes or exports provider credentials, local media, prompt or tokens.
 * Run from a clean trusted checkout; target process restricted to loopback.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const MODELS=Object.freeze([
 'gemini-2.5-flash-native-audio-preview-12-2025',
 'gemini-3.8-live',
 'gemini-3.8-live-extended-thinking',
 'gemini-3.1-flash-live-preview',
 'gemini-3.5-transcribe-live',
 'gemini-3.5-live-translate-preview'
]);

function fileHash(filename){return createHash('sha256').update(fs.readFileSync(filename)).digest('hex');}
function fmtStat(filename){
 try {const info=fs.statSync(filename);return {present:true,owner_uid:info.uid,mode:(info.mode&0o777).toString(8).padStart(3,'0'),is_file:info.isFile()};}
 catch{return {present:false};}
}
export function metadataOnly(response,id){
 const methods=response&&typeof response==='object'&&Array.isArray(response.supportedGenerationMethods)
   ?response.supportedGenerationMethods.filter(x=>typeof x==='string'&&x.length<50):[];
 return {model:id,metadata_http_status:200,supported_methods:methods,limits:{
  physical_audio:'NOT_VERIFIED',physical_video:'NOT_VERIFIED',
  tools:'NOT_VERIFIED',cost:'NOT_VERIFIED',quota:'NOT_VERIFIED'
 }};
}
export async function probeModels(key,request=fetch){
 if(typeof key!=='string'||!key)throw Error('SECRET_UNAVAILABLE');
 return Promise.all(MODELS.map(async model=>{
  try {
   const response=await request('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model),{
    headers:{'x-goog-api-key':key},signal:AbortSignal.timeout(11000)});
   if(!response.ok)return {model,metadata_http_status:response.status,
    supported_methods:[],limits:{capabilities:'NOT_VERIFIED'}};
   return metadataOnly(await response.json(),model);
  }catch(e){return {model,metadata_http_status:'NETWORK_ERROR',
    error_class:e.name||'NETWORK_ERROR',supported_methods:[]};}
 }));
}
async function httpResult(url,extra={},request=fetch){
 try {const response=await request(url,{signal:AbortSignal.timeout(5000),...extra});return response.status;}
 catch{return 'UNAVAILABLE';}
}
function guardLivePath(repo,live){
 if(!live||!fs.existsSync(path.join(live,'server.js')))throw Error('LIVE_DIRECTORY_MISSING');
 const base=path.resolve(repo),candidate=path.resolve(live);
 if(candidate===base)throw Error('LIVE_AND_SOURCE_NOT_ISOLATED');
}
export async function revalidate({repository=process.cwd(),liveDir,secretFile,servicePort=18377,request=fetch}={}){
 if(!Number.isInteger(servicePort)||servicePort<1024||servicePort>65535)throw Error('INVALID_LOCAL_PORT');
 guardLivePath(repository,liveDir);
 const gitSha=execFileSync('git',['-C',repository,'rev-parse','HEAD'],{encoding:'utf8',timeout:5000}).trim();
 if(!/^[a-f0-9]{40}$/.test(gitSha))throw Error('INVALID_GIT_SHA');
 const repoApp=path.join(repository,'apps/gemini-live-studio');
 const srcServer=path.join(repoApp,'server.js');
 const liveServer=path.join(liveDir,'server.js');
 const key=secretFile||path.join(liveDir,'.private/api-key.json');
 const creds=fmtStat(key),keyDir=fmtStat(path.dirname(key));
 const keyProtected=creds.present&&creds.is_file&&creds.mode==='600'
  &&keyDir.present&&keyDir.mode==='700';
 const liveDependency=JSON.parse(fs.readFileSync(path.join(liveDir,'package.json'),'utf8'));
 const codeHash=fileHash(srcServer),runtimeHash=fileHash(liveServer);
 const url='http://127.0.0.1:'+servicePort;
 const [status,forbiddenOrigin,privatePath]=await Promise.all([
  httpResult(url+'/api/status',{},request),
  httpResult(url+'/api/status',{headers:{Origin:'https://external.invalid'}},request),
  httpResult(url+'/.private/api-key.json',{},request)
 ]);
 const metadata=keyProtected?await probeModels(JSON.parse(fs.readFileSync(key,'utf8')).key,request):[];
 const codeMatches=codeHash===runtimeHash;
 const result={
  schema:'mcf-f0-live-revalidation/v1',
  observed_at_utc:new Date().toISOString(),
  source_commit_sha:gitSha,environment:'authorized_local_linux_host',
  application:{name:liveDependency.name,dependency_versions:liveDependency.dependencies||{},
   node:process.version,source_server_sha256:codeHash,runtime_server_sha256:runtimeHash,
   runtime_source_matches_current_main:codeMatches,service_binding:'127.0.0.1',
   service_port:servicePort,service_http_status:status,
   foreign_origin_http_status:forbiddenOrigin,private_path_http_status:privatePath},
  credential_metadata:{key_file_mode:creds.mode||null,key_parent_directory_mode:keyDir.mode||null,
   locally_protected_permissions:keyProtected,credential_material_included:false,
   credential_rotation_status:'NOT_VERIFIED'},
  model_metadata:{endpoint:'GET v1beta/models/{id}',results:metadata,
   supported_generation_methods_only:true,
   quota_and_pricing_certified:false},
  F0_2_technical_pass:codeMatches&&status===200&&forbiddenOrigin===403&&privatePath===404&&keyProtected,
  F0_3_metadata_pass:metadata.length===MODELS.length&&metadata.every(x=>x.metadata_http_status===200),
  F0_3_full_qualification_pass:false,
  F0_4_full_security_pass:false,
  F0_5_physical_hardware_pass:false,
  F0_8_formal_gate_pass:false
 };
 return result;
}
if(fileURLToPath(import.meta.url)===process.argv[1]){
 const liveDir=process.env.MCF_LIVE_STUDIO_DIR;
 const servicePort=Number(process.env.MCF_LIVE_STUDIO_PORT||18377);
 revalidate({liveDir,secretFile:process.env.MCF_GEMINI_KEY_FILE,servicePort}).then(r=>{
  console.log(JSON.stringify(r,null,2));
  if(!r.F0_2_technical_pass||!r.F0_3_metadata_pass)process.exitCode=1;
 }).catch(e=>{console.error('F0_REVALIDATION_FAILED',e.message);process.exitCode=1;});
}
