'use strict';
// F2.3 — deterministic, key-scoped capability discovery. Listing a method is
// not proof of image/video quality or quota; never auto-switch providers/keys.
const BASE='https://generativelanguage.googleapis.com/v1beta';
const MODEL_ID=/^gemini-[A-Za-z0-9._-]{1,90}$/;
function validModelId(value){return typeof value==='string'&&MODEL_ID.test(value);}
function supportedModel(m){
 return Boolean(m&&typeof m.name==='string'&&m.name.startsWith('models/')&&
   validModelId(m.name.slice(7))&&
   (m.supportedGenerationMethods||m.supportedActions||[]).includes('generateContent'));
}
function sanitizeCatalog(models){
 const seen=new Set(),out=[];
 for(const m of models||[]){
  if(!supportedModel(m))continue;
  const id=m.name.slice(7);
  if(seen.has(id))continue;
  seen.add(id);
  out.push({id,label:String(m.displayName||id).slice(0,100),
   endpoint:'generateContent',methodVerified:true,
   imageVerified:false,videoVerified:false,
   inputTokenLimit:Number.isSafeInteger(m.inputTokenLimit)?m.inputTokenLimit:null,
   outputTokenLimit:Number.isSafeInteger(m.outputTokenLimit)?m.outputTokenLimit:null});
 }
 return out.sort((a,b)=>a.id.localeCompare(b.id));
}
async function fetchCatalog(key,{fetchFn=fetch,timeoutMs=12500,maxPages=3}={}){
 if(!key)throw Object.assign(Error('Chave do Gemini não configurada.'),{status:401});
 const seen=new Set(),all=[];let token='';
 for(let p=0;p<maxPages;p++){
  const u=new URL(BASE+'/models');
  u.searchParams.set('pageSize','100');
  if(token)u.searchParams.set('pageToken',token);
  const res=await fetchFn(u.toString(),{headers:{'x-goog-api-key':key},signal:AbortSignal.timeout(timeoutMs)});
  if(!res.ok)throw Object.assign(Error('Não foi possível consultar o catálogo do Google ('+res.status+').'),{status:res.status===429?429:502});
  const data=await res.json();
  all.push(...(Array.isArray(data.models)?data.models:[]));
  token=String(data.nextPageToken||'');
  if(!token||seen.has(token))break;
  seen.add(token);
 }
 return sanitizeCatalog(all);
}
function route({model,kind,catalog}){
 if(!['image','video'].includes(kind))throw Object.assign(Error('Tipo de análise não autorizado.'),{status:400});
 if(!validModelId(model))throw Object.assign(Error('Modelo inválido.'),{status:400});
 const match=(catalog||[]).find(m=>m.id===model&&m.methodVerified);
 if(!match)throw Object.assign(Error('Modelo não verificado na chave atual para generateContent.'),{status:422});
 return {model,kind,endpoint:'generateContent',verifiedBy:'models.list',
  mediaCapability:'experimental_not_yet_verified',automaticFallback:false,costVerified:false};
}
module.exports={validModelId,sanitizeCatalog,fetchCatalog,route};
