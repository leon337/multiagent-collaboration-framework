/* F0 only: read local key privately, query model metadata. Output contains no secrets. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const now=new Date().toISOString();
(async()=>{
 const key=JSON.parse(fs.readFileSync(path.join(root,'.private/api-key.json'),'utf8')).key;
 const selected=['gemini-2.5-flash-native-audio-preview-12-2025','gemini-3.8-live','gemini-3.8-live-extended-thinking','gemini-3.1-flash-live-preview','gemini-3.5-transcribe-live','gemini-3.5-live-translate-preview'];
 const results=[];
 for(const id of selected){
  let status='NOT_CHECKED', methods=[];
  try{
   const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(id),{headers:{'x-goog-api-key':key},signal:AbortSignal.timeout(9000)});
   status=String(r.status);
   if(r.ok){const o=await r.json();methods=o.supportedGenerationMethods||[];}
  }catch{status='NETWORK_ERROR';}
  results.push({model:id,metadata_http_status:status,methods});
 }
 const out={verified_at_utc:now,backend:'v1beta/models/{id}',models:results,classification:'Public model metadata per credential; 200 does not guarantee all modalities/function calls.'};
 fs.writeFileSync(path.join(__dirname,'MODEL-PROBE.json'),JSON.stringify(out,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify(out));
})().catch(e=>{console.error('MODEL_PROBE_FAILED',e.name);process.exitCode=1;});
