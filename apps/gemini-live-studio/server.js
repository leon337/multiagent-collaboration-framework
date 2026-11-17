'use strict';
/* Gemini Live Studio — local-only backend. No external dependencies. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {makeVisionAdapter}=require('./vision-adapter.cjs');
const {fetchCatalog}=require('./capability-router.cjs');
const {BrowserGateway}=require('./mcp-playwright-gateway.cjs');
const ROOT=__dirname, PUBLIC=path.join(ROOT,'public'), PRIVATE=path.join(ROOT,'.private');
const KEY_FILE=path.join(PRIVATE,'api-key.json');
const PORT=Number(process.env.PORT||18371), HOST='127.0.0.1';
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const safeFiles={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/telemetry.js':'telemetry.js','/media-policy.js':'media-policy.js','/vision-ui.js':'vision-ui.js','/playwright-tools.js':'playwright-tools.js','/voice-approval.js':'voice-approval.js','/capture-worklet.js':'capture-worklet.js','/style.css':'style.css'};
let actionAt=0,visionBusy=false,visionAt=0,catalogCache=null;
const browserBridge=new BrowserGateway();

function scopedCatalog(key){
 const fingerprint=require('node:crypto').createHash('sha256').update(key).digest('hex');
 if(catalogCache&&catalogCache.fingerprint===fingerprint&&Date.now()-catalogCache.at<180000)
  return Promise.resolve(catalogCache.models);
 return fetchCatalog(key).then(models=>{
  catalogCache={fingerprint,at:Date.now(),models};return models;
 });
}
const vision=makeVisionAdapter({catalogFn:scopedCatalog});
async function boundedJson(req,limit){
 const contentLength=Number(req.headers['content-length']||0);
 if(contentLength>limit)throw Object.assign(Error('Arquivo maior que o limite de 24 MB para vídeo / 8 MB para imagem.'),{status:413});
 const chunks=[];let size=0;
 for await(const chunk of req){
  size+=chunk.length;
  if(size>limit)throw Object.assign(Error('Carga acima do limite local.'),{status:413});
  chunks.push(chunk);
 }
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(Error('JSON inválido.'),{status:400});}
}
function getKey(){try{const k=JSON.parse(fs.readFileSync(KEY_FILE,'utf8')).key;return typeof k==='string'?k:null;}catch{return null;}}
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
function body(req){return new Promise((ok,fail)=>{let b='';req.on('data',x=>{b+=x;if(b.length>16384){fail(Error('Corpo excedeu limite'));req.destroy();}});req.on('end',()=>{try{ok(JSON.parse(b||'{}'));}catch{fail(Error('JSON inválido'));}});req.on('error',fail);});}
function errorMessage(payload,fallback){return payload?.error?.message||fallback;}
async function google(url,key,method='GET',payload){let response;try{response=await fetch(url,{method,headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(12000)});}catch(e){throw Object.assign(Error('Falha de rede até a API Google: '+e.message),{status:502});}const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(Error(errorMessage(data,'Google HTTP '+response.status)),{status:response.status===401||response.status===403?403:502});return data;}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Permissions-Policy','camera=(self), microphone=(self), display-capture=(self)');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' wss://generativelanguage.googleapis.com https://generativelanguage.googleapis.com; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'");
 const u=new URL(req.url||'/', 'http://localhost');
 if(req.method==='GET'&&safeFiles[u.pathname]){const fp=path.join(PUBLIC,safeFiles[u.pathname]);try{const data=fs.readFileSync(fp);res.writeHead(200,{'Content-Type':TYPES[path.extname(fp)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{json(res,404,{error:'Interface não encontrada'});}return;}
 if(u.pathname.startsWith('/api/')){
  const origin=req.headers.origin;
  if(origin && origin!==('http://'+HOST+':'+PORT) && origin!==('http://localhost:'+PORT)){return json(res,403,{error:'Origem não permitida'});}
  if(req.method==='GET'&&u.pathname==='/api/status')return json(res,200,{ok:true,configured:!!getKey(),host:HOST,port:PORT});
  if(req.method==='POST'&&u.pathname==='/api/key'){try{const b=await body(req);const key=String(b.key||'').trim();if(!/^[A-Za-z0-9._-]{20,512}$/.test(key))return json(res,400,{error:'A chave deve ter entre 20 e 512 caracteres, sem espaços ou caracteres especiais não permitidos.'});await google('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1',key);fs.mkdirSync(PRIVATE,{recursive:true,mode:0o700});fs.chmodSync(PRIVATE,0o700);fs.writeFileSync(KEY_FILE,JSON.stringify({key}),{mode:0o600});fs.chmodSync(KEY_FILE,0o600);return json(res,200,{ok:true,configured:true});}catch(e){return json(res,e.status||400,{error:e.message});}}
  if(req.method==='DELETE'&&u.pathname==='/api/key'){try{fs.rmSync(KEY_FILE,{force:true});return json(res,200,{ok:true,configured:false});}catch(e){return json(res,500,{error:e.message});}}
  // Experimental F3 browser gateway. Never bind to non-loopback interfaces.
  // Model supplies request data; only the human-facing UI may approve mutations.
  if(req.method==='GET'&&u.pathname==='/api/browser/status')
   return json(res,200,{...browserBridge.status(),runtime:'MCP Playwright 0.0.85 isolated'});
  if(req.method==='POST'&&u.pathname.startsWith('/api/browser/')){
   if(req.headers.origin!==('http://'+HOST+':'+PORT)&&req.headers.origin!==('http://localhost:'+PORT))
    return json(res,403,{error:'Confirmação MCP exige a origem local da interface.'});
   if(req.headers['content-type']!=='application/json')
    return json(res,415,{error:'Content-Type deve ser application/json.'});
   if(req.headers['x-mcf-ui-intent']!=='playwright-mcp-tool')
    return json(res,403,{error:'Requisição MCP sem intenção declarada da interface.'});
   try{
    const data=await boundedJson(req,8192);
    if(u.pathname==='/api/browser/prepare')
     return json(res,200,browserBridge.prepare(data));
    if(u.pathname==='/api/browser/decision')
     return json(res,200,await browserBridge.decide(data));
    if(u.pathname==='/api/browser/end')
     return json(res,200,{closed:await browserBridge.endSession(data.sessionId)});
   }catch(e){return json(res,[400,403,404,409,410,415,503].includes(e.status)?e.status:502,
     {error:e.message||'Falha na ferramenta MCP Playwright.'});}
  }
  if(req.method==='GET'&&u.pathname==='/api/vision/models'){
   const key=getKey();if(!key)return json(res,401,{error:'Configure uma chave Gemini.'});
   try{
    const models=await scopedCatalog(key);
    return json(res,200,{models,costVerified:false,mediaSupport:'unverified_by_catalog',
      automaticFallback:false,catalogSource:'Google models.list generateContent'});
   }catch(e){return json(res,e.status===429?429:502,{error:e.message});}
  }
  if(req.method==='POST'&&u.pathname==='/api/vision/analyze'){
   if(req.headers['content-type']!=='application/json'||req.headers['x-mcf-user-consent']!=='yes')
    return json(res,415,{error:'Envio multimodal requer JSON e confirmação explícita.'});
   const key=getKey();if(!key)return json(res,401,{error:'Configure uma chave Gemini.'});
   if(visionBusy)return json(res,429,{error:'Existe uma análise em andamento. Aguarde a conclusão.'});
   if(Date.now()-visionAt<1600)return json(res,429,{error:'Aguarde antes de iniciar outra análise.'});
   visionBusy=true;visionAt=Date.now();
   try{
    const input=await boundedJson(req,33*1024*1024);
    const result=await vision.analyze(input,key);
    return json(res,200,result);
   }catch(e){return json(res,[400,401,413,415,422,429,504].includes(e.status)?e.status:502,
     {error:e.message||'Não foi possível analisar a mídia.'});}
   finally{visionBusy=false;}
  }
  if(req.method==='POST'&&u.pathname==='/api/token'){
    const key=getKey();if(!key)return json(res,401,{error:'Cadastre sua chave na área de configurações.'});
    if(Date.now()-actionAt<700)return json(res,429,{error:'Aguarde um instante para criar outra sessão.'}); actionAt=Date.now();
    try{const now=Date.now();const data=await google('https://generativelanguage.googleapis.com/v1beta/auth_tokens',key,'POST',{uses:1,newSessionExpireTime:new Date(now+60000).toISOString(),expireTime:new Date(now+30*60*1000).toISOString()});if(!data.name)throw Error('Serviço não retornou token temporário.');return json(res,200,{token:data.name,expiresIn:60});}catch(e){return json(res,e.status||502,{error:e.message});}
  }
  return json(res,404,{error:'Rota não encontrada'});
 }
 json(res,404,{error:'Não encontrado'});
});
server.listen(PORT,HOST,()=>console.log('Gemini Live Studio http://'+HOST+':'+PORT));
process.once('SIGTERM',()=>{browserBridge.close().finally(()=>server.close());});
process.once('SIGINT',()=>{browserBridge.close().finally(()=>server.close());});
