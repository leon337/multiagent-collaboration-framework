'use strict';
const crypto=require('node:crypto');
const router=require('./capability-router.cjs');
const ROOT='https://generativelanguage.googleapis.com';
const IMAGE_MAX=8*1024*1024,VIDEO_MAX=24*1024*1024;
const IMAGE_MIMES=new Set(['image/jpeg','image/png','image/webp']);
const VIDEO_MIMES=new Set(['video/mp4','video/webm','video/quicktime']);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const requestError=(message,status=400)=>Object.assign(Error(message),{status});
function mimeMatches(bytes,mime){
 if(mime==='image/jpeg')return bytes.length>=4&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 if(mime==='image/png')return bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
 if(mime==='image/webp')return bytes.length>=12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
 if(mime==='video/webm')return bytes.length>=4&&bytes.subarray(0,4).equals(Buffer.from('1a45dfa3','hex'));
 if(mime==='video/mp4'||mime==='video/quicktime')
  return bytes.length>=12&&bytes.toString('ascii',4,8)==='ftyp';
 return false;
}
function validatePayload(v){
 if(!v||typeof v!=='object'||v.consent!==true)throw requestError('Confirme o envio desta mídia para a análise especializada.');
 const kind=String(v.kind||''),mime=String(v.mimeType||'');
 const mimeAllowed=kind==='image'?IMAGE_MIMES:kind==='video'?VIDEO_MIMES:null;
 if(!mimeAllowed||!mimeAllowed.has(mime))throw requestError('Tipo ou formato de arquivo não permitido.');
 const data=String(v.base64||'');
 const max=kind==='image'?IMAGE_MAX:VIDEO_MAX;
 if(data.length<20||data.length>Math.ceil(max*4/3)+4||!(/^[A-Za-z0-9+/]+={0,2}$/.test(data))||data.length%4!==0)
  throw requestError('Conteúdo em Base64 inválido ou maior que o limite.',413);
 const bytes=Buffer.from(data,'base64');
 if(!bytes.length||bytes.length>max||!mimeMatches(bytes,mime))throw requestError('Assinatura de mídia inválida ou arquivo acima do limite.',413);
 const prompt=String(v.prompt||'').trim();
 if(prompt.length<5||prompt.length>2200)throw requestError('Informe uma pergunta de 5 a 2.200 caracteres.');
 const model=String(v.model||'');
 if(!router.validModelId(model))throw requestError('Selecione um modelo Gemini válido.');
 return {kind,mime,prompt,model,bytes};
}
async function apiFetch(fetchFn,url,options,timeout=25000){
 if(!url.startsWith(ROOT+'/'))throw requestError('Destino do provedor não autorizado.',500);
 let response;
 try{response=await fetchFn(url,{...options,signal:AbortSignal.timeout(timeout),redirect:'error'});}
 catch(e){throw requestError('Falha de comunicação com Gemini ('+(e?.name==='TimeoutError'?'timeout':'rede')+').',502);}
 if(!response.ok){throw requestError(
  response.status===429?'Limite de uso da chave/projeto (429). Nenhuma troca de modelo ou chave foi feita.':
  'API Gemini retornou '+response.status+'; confirme modelo, formato, cota e permissões.',
  response.status===429?429:response.status===400||response.status===404?422:502);}
 return response;
}
async function uploadVideo({fetchFn,key,mime,bytes}){
 const start=await apiFetch(fetchFn,ROOT+'/upload/v1beta/files',{
  method:'POST',
  headers:{'x-goog-api-key':key,'Content-Type':'application/json',
   'X-Goog-Upload-Protocol':'resumable','X-Goog-Upload-Command':'start',
   'X-Goog-Upload-Header-Content-Length':String(bytes.length),
   'X-Goog-Upload-Header-Content-Type':mime},
  body:JSON.stringify({file:{display_name:'mcf-f2-temporary-analysis'}})
 },22000);
 const uploadUrl=start.headers.get('x-goog-upload-url')||'';
 if(!uploadUrl.startsWith(ROOT+'/'))
  throw requestError('URL de upload do provedor não confiável.',502);
 let done;
 try{
  done=await apiFetch(fetchFn,uploadUrl,{
   method:'POST',headers:{'x-goog-api-key':key,'Content-Type':mime,
    'X-Goog-Upload-Offset':'0','X-Goog-Upload-Command':'upload, finalize'},body:bytes
  },120000);
 }catch(e){
  throw requestError('Finalização do vídeo incerta: arquivo remoto pode ter sido criado sem exclusão confirmada. '+e.message,e.status||502);
 }
 const info=await done.json().catch(()=>({}));
 const file=info.file||{};
 if(!/^files\/[A-Za-z0-9_-]{2,200}$/.test(String(file.name||'')))
  throw requestError('Upload sem identificador remoto válido; exclusão não pode ser confirmada.',502);
 const uri=String(file.uri||'');
 const safeUri=uri.startsWith(ROOT+'/')?uri:null;
 // Retain validated file name so outer finally can delete even on invalid URI.
 return {name:file.name,uri:safeUri,state:String(file.state||''),mime};
}
async function awaitActive({fetchFn,key,file,maxPolls=45}){
 for(let i=0;i<maxPolls;i++){
  if(file.state==='ACTIVE')return file;
  if(file.state==='FAILED')throw requestError('O Google não conseguiu processar este vídeo.',502);
  await wait(1600);
  const response=await apiFetch(fetchFn,ROOT+'/v1beta/'+file.name,{headers:{'x-goog-api-key':key}},12000);
  const meta=await response.json();
  file.state=String(meta.state||'');
 }
 throw requestError('O Google ainda está processando o vídeo. Tente um arquivo menor.',504);
}
async function deleteRemote({fetchFn,key,file}){
 if(!file?.name)return false;
 try{
  const resp=await fetchFn(ROOT+'/v1beta/'+file.name,{
   method:'DELETE',headers:{'x-goog-api-key':key},signal:AbortSignal.timeout(12000),redirect:'error'
  });
  return resp.ok;
 }catch{return false;}
}
function extractText(data){
 const parts=data?.candidates?.[0]?.content?.parts||[];
 return parts.filter(p=>p&&!p.thought&&typeof p.text==='string').map(p=>p.text).join('\n').slice(0,14000);
}
async function generate({fetchFn,key,kind,mime,model,prompt,bytes,file}){
 const mediaPart=kind==='image'
  ?{inlineData:{mimeType:mime,data:bytes.toString('base64')}}
  :{fileData:{mimeType:mime,fileUri:file.uri}};
 const req={contents:[{role:'user',parts:[{text:prompt},mediaPart]}],
  generationConfig:{maxOutputTokens:1536,temperature:0.2}};
 const resp=await apiFetch(fetchFn,
  ROOT+'/v1beta/models/'+model+':generateContent',
  {method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify(req)},65000);
 const data=await resp.json();
 const result=extractText(data);
 if(!result)throw requestError('O modelo não retornou texto de análise; verifique bloqueios e suporte.',502);
 return {text:result,usage:{totalTokens:Number.isSafeInteger(data?.usageMetadata?.totalTokenCount)?data.usageMetadata.totalTokenCount:null},
  finishReason:String(data?.candidates?.[0]?.finishReason||'UNKNOWN')};
}
function makeVisionAdapter({fetchFn=fetch,catalogFn=router.fetchCatalog}={}){
 return {
  async models(key){return catalogFn(key,{fetchFn});},
  async analyze(raw,key){
   if(!key)throw requestError('Chave Gemini não configurada.',401);
   const input=validatePayload(raw);
   const catalog=await catalogFn(key,{fetchFn});
   const decision=router.route({model:input.model,kind:input.kind,catalog});
   const traceId=crypto.randomUUID();let uploaded=null,deleted=null,generated=null,failure=null;
   try{
    if(input.kind==='video'){
     uploaded=await uploadVideo({fetchFn,key,mime:input.mime,bytes:input.bytes});
     if(!uploaded.uri)throw requestError('O Google retornou URI inválida; exclusão remota será tentada.',502);
     await awaitActive({fetchFn,key,file:uploaded});
    }
    generated=await generate({...input,key,fetchFn,file:uploaded});
   }catch(e){failure=e;
   }finally{
    if(uploaded)deleted=await deleteRemote({fetchFn,key,file:uploaded});
   }
   if(failure){
    if(uploaded&&!deleted)failure.message+=' ATENÇÃO: exclusão do arquivo remoto não confirmada.';
    throw failure;
   }
   return {traceId,model:decision.model,kind:input.kind,
    capability:'verified_for_this_request',verificationScope:'this_request_only',source:'Gemini generateContent (not Live)',
    content:generated.text,usage:generated.usage,finishReason:generated.finishReason,
    uploadedToGoogleFiles:input.kind==='video',remoteFileDeleted:deleted,
    costEstimate:null,autoFallback:false,rawMediaRetainedLocally:false};
  }
 };
}
module.exports={makeVisionAdapter,validatePayload,mimeMatches,extractText,IMAGE_MAX,VIDEO_MAX};
