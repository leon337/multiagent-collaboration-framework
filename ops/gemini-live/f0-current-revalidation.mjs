/**
 * MCF F0.2/F0.3: reproducible, read-only live inventory and model metadata probe.
 * No keys, tokens, raw audio, personal media or prompt content in output.
 * Security claims fail closed if source, listener, process or credential proof is missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const MODELS=Object.freeze([
 'gemini-2.5-flash-native-audio-preview-12-2025',
 'gemini-3.8-live','gemini-3.8-live-extended-thinking',
 'gemini-3.1-flash-live-preview','gemini-3.5-transcribe-live',
 'gemini-3.5-live-translate-preview'
]);
const fileHash=filename=>createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
function fileInfo(filename){
 try {
  const stat=fs.statSync(filename);
  return {present:true,owner_uid:stat.uid,mode:(stat.mode&0o777).toString(8).padStart(3,'0'),is_file:stat.isFile()};
 }catch{return {present:false};}
}
export function metadataOnly(data,model){
 const methods=data?.supportedGenerationMethods;
 if(data?.name!=='models/'+model||!Array.isArray(methods)||methods.length<1||
    !methods.every(x=>typeof x==='string'&&/^[A-Za-z0-9_]{1,50}$/.test(x))){
  return {model,metadata_http_status:'INVALID_METADATA',supported_methods:[],limits:{capabilities:'NOT_VERIFIED'}};
 }
 return {model,metadata_http_status:200,supported_methods:methods,limits:{
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
   if(!response.ok)return {model,metadata_http_status:response.status,supported_methods:[],limits:{capabilities:'NOT_VERIFIED'}};
   return metadataOnly(await response.json(),model);
  }catch(e){return {model,metadata_http_status:'NETWORK_ERROR',
    error_class:e?.name||'NETWORK_ERROR',supported_methods:[]};}
 }));
}
export function parseListeners(ssText,port){
 const matches=[];
 for(const line of String(ssText||'').split('\n')){
  const match=/^\s*LISTEN\s+\d+\s+\d+\s+(\S+)\s+\S+.*?pid=(\d+)/.exec(line);
  if(!match)continue;
  const token=':'+port;
  if(match[1].endsWith(token))matches.push({address:match[1].slice(0,-token.length),pid:Number(match[2])});
 }
 return {matches,loopback_only:matches.length===1&&matches[0].address==='127.0.0.1'};
}
function inspectListener(liveDir,port){
 try {
  const ss=execFileSync('ss',['-H','-ltnp'],{encoding:'utf8',timeout:5000});
  const observed=parseListeners(ss,port);
  if(!observed.loopback_only)return {listener_verified:false,process_verified:false,binding:'UNKNOWN'};
  const pid=observed.matches[0].pid;
  const command=fs.readFileSync('/proc/'+pid+'/cmdline','utf8').split('\0').filter(Boolean);
  const workDir=fs.realpathSync('/proc/'+pid+'/cwd');
  const matchDir=workDir===fs.realpathSync(liveDir);
  const scripts=command.slice(1).filter(a=>path.basename(a)==='server.js');
  const scriptMatch=scripts.length===1&&
    path.resolve(workDir,scripts[0])===fs.realpathSync(path.join(liveDir,'server.js'));
  const isNode=/^node(?:js)?$/.test(path.basename(command[0]||''));
  return {listener_verified:true,process_verified:matchDir&&scriptMatch&&isNode,binding:'127.0.0.1'};
 }catch{return {listener_verified:false,process_verified:false,binding:'UNKNOWN'};}
}
async function httpStatus(url,extra={},request=fetch){
 try{return (await request(url,{signal:AbortSignal.timeout(5000),...extra})).status;}
 catch{return 'UNAVAILABLE';}
}
export function readKeySecurely(filename){
 try{
  const data=JSON.parse(fs.readFileSync(filename,'utf8'));
  if(typeof data.key!=='string'||!/^[A-Za-z0-9_.-]{8,256}$/.test(data.key))throw Error('NO_KEY');
  return data.key;
 }catch{
  // Never propagate JSON.parse SyntaxError: modern Node may include private source bytes.
  throw Error('CREDENTIAL_NOT_READABLE');
 }
}
export function checkCredential(file){
 try{
  const real=fs.realpathSync(file);
  const target=fileInfo(real),linkDir=fileInfo(path.dirname(file)),realDir=fileInfo(path.dirname(real));
  const protectedModes=target.mode==='600'&&target.is_file&&realDir.mode==='700'
   &&linkDir.mode==='700'&&target.owner_uid===realDir.owner_uid
   &&target.owner_uid===linkDir.owner_uid&&target.owner_uid===process.getuid();
  return {protectedModes,credential_metadata:{
   key_file_mode:target.mode||null,key_target_parent_mode:realDir.mode||null,
   key_link_parent_mode:linkDir.mode||null,
   link_resolves_to_separate_target:path.resolve(file)!==real,
   locally_protected_permissions:protectedModes,
   credential_material_included:false,credential_rotation_status:'NOT_VERIFIED'}};
 }catch{return {protectedModes:false,credential_metadata:{
  locally_protected_permissions:false,credential_material_included:false,
  credential_rotation_status:'NOT_VERIFIED'}};}
}
export async function revalidate({repository=process.cwd(),liveDir,secretFile,servicePort=18377,request=fetch}={}){
 if(!Number.isInteger(servicePort)||servicePort<1024||servicePort>65535)throw Error('INVALID_LOCAL_PORT');
 if(!liveDir||!fs.existsSync(path.join(liveDir,'server.js')))throw Error('LIVE_DIRECTORY_MISSING');
 if(fs.realpathSync(repository)===fs.realpathSync(liveDir))throw Error('LIVE_AND_SOURCE_NOT_ISOLATED');
 const gitSha=execFileSync('git',['-C',repository,'rev-parse','HEAD'],{encoding:'utf8',timeout:5000}).trim();
 if(!/^[a-f0-9]{40}$/.test(gitSha))throw Error('INVALID_GIT_SHA');
 const repoApp=path.join(repository,'apps/gemini-live-studio');
 const srcServer=path.join(repoApp,'server.js');
 const liveServer=path.join(liveDir,'server.js');
 const secret=secretFile||path.join(liveDir,'.private/api-key.json');
 const credential=checkCredential(secret);
 const liveDependency=JSON.parse(fs.readFileSync(path.join(liveDir,'package.json'),'utf8'));
 const codeHash=fileHash(srcServer),runtimeHash=fileHash(liveServer);
 const listener=inspectListener(liveDir,servicePort);
 const url='http://127.0.0.1:'+servicePort;
 const [status,foreignOrigin,privatePath]=await Promise.all([
  httpStatus(url+'/api/status',{},request),
  httpStatus(url+'/api/status',{headers:{Origin:'https://external.invalid'}},request),
  httpStatus(url+'/.private/api-key.json',{},request)
 ]);
 const models=credential.protectedModes?await probeModels(readKeySecurely(secret),request):[];
 const result={
  schema:'mcf-f0-live-revalidation/v1',
  observed_at_utc:new Date().toISOString(),
  source_commit_sha:gitSha,environment:'authorized_local_linux_host',
  application:{name:liveDependency.name,dependency_versions:liveDependency.dependencies||{},
   node:process.version,source_server_sha256:codeHash,runtime_server_sha256:runtimeHash,
   on_disk_source_hashes_equal:codeHash===runtimeHash,
   process_cwd_and_command_verified:listener.process_verified,
   live_code_loaded_in_memory_proven:false,
   listener_ipv4_loopback_verified:listener.listener_verified,
   service_binding:listener.binding,service_port:servicePort,
   service_http_status:status,foreign_origin_http_status:foreignOrigin,
   private_path_http_status:privatePath},
  credential_metadata:credential.credential_metadata,
  model_metadata:{endpoint:'GET v1beta/models/{id}',results:models,
   supported_generation_methods_only:true,quota_and_pricing_certified:false},
  F0_2_technical_pass:codeHash===runtimeHash&&listener.listener_verified&&listener.process_verified
   &&status===200&&foreignOrigin===403&&privatePath===404&&credential.protectedModes,
  F0_3_metadata_pass:models.length===MODELS.length&&models.every(x=>x.metadata_http_status===200),
  F0_3_full_qualification_pass:false,F0_4_full_security_pass:false,
  F0_5_physical_hardware_pass:false,F0_8_formal_gate_pass:false
 };
 return result;
}
if(fileURLToPath(import.meta.url)===process.argv[1]){
 revalidate({liveDir:process.env.MCF_LIVE_STUDIO_DIR,
  secretFile:process.env.MCF_GEMINI_KEY_FILE,
  servicePort:Number(process.env.MCF_LIVE_STUDIO_PORT||18377)}).then(r=>{
  console.log(JSON.stringify(r,null,2));
  if(!r.F0_2_technical_pass||!r.F0_3_metadata_pass)process.exitCode=1;
 }).catch(e=>{
  // Never print raw parsing errors from credential data or provider responses.
  console.error('F0_REVALIDATION_FAILED',/^(CREDENTIAL_|SECRET_|INVALID_|LIVE_|NO_)/.test(e?.message||'')
   ?e.message:'REVALIDATION_FAILED');
  process.exitCode=1;
 });
}
