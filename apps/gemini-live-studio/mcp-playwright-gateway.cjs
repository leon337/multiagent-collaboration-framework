'use strict';
/* Experimental F3 browser boundary. Real @playwright/mcp via MCP SDK/stdin.
 * Only a reviewed subset of MCP tools is exposed to Gemini Live.
 * Live model never receives MCP credentials or an arbitrary command channel.
 */
const crypto=require('node:crypto');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {Client}=require('@modelcontextprotocol/sdk/client/index.js');
const {StdioClientTransport}=require('@modelcontextprotocol/sdk/client/stdio.js');

const MAP=Object.freeze({
 playwright_navigate:'browser_navigate',
 playwright_snapshot:'browser_snapshot',
 playwright_find:'browser_find',
 playwright_click:'browser_click',
 playwright_type:'browser_type',
 playwright_tabs:'browser_tabs',
 playwright_close:'browser_close'
});
const READ=new Set(['playwright_snapshot','playwright_find','playwright_tabs']);
const REQUIRES_APPROVAL=new Set(['playwright_navigate','playwright_click','playwright_type','playwright_close']);
const TTL_MS=45000,RESULT_LIMIT=6500,RECEIPT_LIMIT=80;
// Navigate to any HTTPS public website only after a one-time human approval.
// No domain is implicitly granted by a hard-coded allowlist. Real network
// isolation is NOT provided by the Playwright --allowed-origins convenience flag.

const reportError=(message,status=400)=>Object.assign(Error(message),{status});
const restrictedHost=h=>{
 const host=String(h||'').toLowerCase().replace(/^\[|\]$/g,'').replace(/\.+$/,'');
 if(!host||host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||
    host.endsWith('.internal')||host.endsWith('.test')||host.endsWith('.invalid')||
    host.endsWith('.lan')||host.endsWith('.home')||host.endsWith('.corp')||
    host.endsWith('.arpa')||host.endsWith('.onion'))return true;
 if(/^\d+\.\d+\.\d+\.\d+$/.test(host)){
  const octets=host.split('.').map(Number);
  return octets.length!==4||octets.some(x=>x>255)||
   octets[0]===0||octets[0]===10||octets[0]===127||octets[0]>=224||
   (octets[0]===172&&octets[1]>=16&&octets[1]<=31)||
   (octets[0]===192&&octets[1]===168)||
   (octets[0]===169&&octets[1]===254)||
   (octets[0]===100&&octets[1]>=64&&octets[1]<=127)||
   (octets[0]===192&&octets[1]===0)||
   (octets[0]===198&&octets[1]>=18&&octets[1]<=19);
 }
 if(host.includes(':'))return true; // IPv6 blocked in experimental browser scope
 if(!host.includes('.'))return true;
 return false;
};
function publicUrl(value){
 let u;
 try{u=new URL(String(value||''));}catch{throw reportError('URL inválida.');}
 if(u.protocol!=='https:'||u.username||u.password||u.port||restrictedHost(u.hostname))
  throw reportError('A navegação F3 aceita apenas HTTPS público sem credenciais ou porta customizada.');
 if(u.href.length>1500)throw reportError('URL longa demais.');
 return u;
}
function samePublicWebsite(observed,requested){
 try{
  const o=publicUrl(observed.href),r=publicUrl(requested.href);
  const host=h=>h.toLowerCase().replace(/^www\./,'');
  return o.origin===r.origin||host(o.hostname)===host(r.hostname);
 }catch{return false;}
}
function cleanText(value,limit=RESULT_LIMIT){
 return String(value||'').replace(/AIza[A-Za-z0-9_-]{25,}/g,'[GOOGLE_KEY_REDACTED]')
  .replace(/sk-[A-Za-z0-9_-]{25,}/g,'[TOKEN_REDACTED]')
  .replace(/Bearer\s+[A-Za-z0-9._~-]{15,}/gi,'Bearer [REDACTED]')
  .replace(/\u0000/g,'').slice(0,limit);
}
function argumentsFor(name,args={}){
 if(!Object.hasOwn(MAP,name))throw reportError('Ferramenta não disponível neste gateway.');
 if(!args||Array.isArray(args)||typeof args!=='object')throw reportError('Argumentos inválidos.');
 const fail=()=>{throw reportError('Argumentos inválidos para '+name);};
 const ensureString=(x,max=160)=>typeof x==='string'&&x.trim().length>0&&x.length<=max;
 if(name==='playwright_navigate'){
  if(!ensureString(args.url,1500))fail();
  return {url:publicUrl(args.url).toString()};
 }
 if(name==='playwright_snapshot'){
  if(args.depth!==undefined&&(!Number.isSafeInteger(args.depth)||args.depth<1||args.depth>7))fail();
  return args.depth===undefined?{}:{depth:args.depth};
 }
 if(name==='playwright_find'){
  if(!ensureString(args.text,120))fail();
  return {text:args.text,maxResults:Math.min(10,Math.max(1,Number(args.maxResults)||5))};
 }
 if(name==='playwright_click'){
  if(!ensureString(args.target,250))fail();
  return {target:args.target,element:ensureString(args.element,150)?args.element:'Elemento indicado no snapshot'};
 }
 if(name==='playwright_type'){
  if(!ensureString(args.target,250)||typeof args.text!=='string'||args.text.length>350)fail();
  if(/password|senha|token|secret|api.key/i.test(args.target+' '+(args.element||'')))
   throw reportError('O gateway não digita senhas ou segredos em campos sensíveis.');
  return {target:args.target,text:args.text,
   element:ensureString(args.element,150)?args.element:'Campo indicado no snapshot',
   submit:args.submit===true};
 }
 if(name==='playwright_tabs'){
  if(args.action&&args.action!=='list')fail();
  return {action:'list'};
 }
 return {};
}
function gateSummary(name,args){
 if(name==='playwright_navigate')return 'NAVEGAR no navegador isolado para '+publicUrl(args.url).origin+'. URL completa: '+publicUrl(args.url).toString().slice(0,160);
 if(name==='playwright_click')return 'CLICAR no alvo "'+cleanText(args.element||args.target,90)+'". Um clique pode enviar formulários, publicar ou alterar dados.';
 if(name==='playwright_type')return 'DIGITAR '+args.text.length+' caracteres no alvo "'+cleanText(args.element||args.target,90)+'"'+(args.submit?' e ENVIAR formulário.':'. O conteúdo digitado não aparece no registro.');
 if(name==='playwright_close')return 'ENCERRAR navegador isolado e descartar perfil da sessão.';
 return 'CONSULTAR o navegador isolado sem alterar a página.';
}
function outputText(result){
 const entries=(result?.content||[]).filter(x=>x.type==='text'&&typeof x.text==='string').map(x=>x.text);
 return cleanText(entries.join('\n'),RESULT_LIMIT);
}
function observedUrl(text){
 const m=String(text||'').match(/Page URL:\s*(https?:\/\/[^\s]+)/);
 if(!m)return null;
 try{return new URL(m[1]);}catch{return null;}
}
class BrowserGateway{
 constructor({clientFactory,transportFactory,clock=()=>Date.now(),interactionOrigins}={}){
  this.clock=clock;this.clientFactory=clientFactory;this.transportFactory=transportFactory;
  // Interaction allowed only in a synthetic playground before F3 gate.
  this.interactionOrigins=new Set(interactionOrigins||['https://demo.playwright.dev']);
  // Navigation has no static allowlist. Every destination is validated and
  // requires explicit approval; click/type remain TodoMVC-only.
  this.client=null;this.transport=null;this.starting=null;this.startingClient=null;this.outputDir=null;
  this.activeOrigin=null;this.currentUrl=null;this.pending=new Map();this.busy=false;
  this.receipts=[];this.calls=0;this.session=null;this.epoch=0;this.currentUrl=null;
 }
 status(){return {provider:'@playwright/mcp',mode:'isolated_headless_local',
  ready:!!this.client,activeOrigin:this.activeOrigin,navigationPolicy:'public_https_per_request',approvedSites:null,
  toolNames:Object.keys(MAP),disabledTools:['browser_evaluate','browser_run_code_unsafe','browser_file_upload','browser_network_request','browser_network_requests'],
  approvalsPending:this.pending.size,receiptCount:this.receipts.length};
 }
 _receipt(data){
  const r={receiptId:crypto.randomUUID(),utc:new Date().toISOString(),...data};
  this.receipts.push(r);if(this.receipts.length>RECEIPT_LIMIT)this.receipts.shift();
  return r.receiptId;
 }
 async start(){
  if(this.client)return;
  if(this.starting)return this.starting;
  const epoch=this.epoch;
  this.starting=(async()=>{
   const ownDir=fs.mkdtempSync(path.join(os.tmpdir(),'mcf-playwright-mcp-'));
   this.outputDir=ownDir;fs.chmodSync(ownDir,0o700);
   const client=this.clientFactory?this.clientFactory():
    new Client({name:'mcf-gemini-live-playwright-gateway',version:'0.1.0'},{capabilities:{}});
   this.startingClient=client;
   const transport=this.transportFactory?this.transportFactory():new StdioClientTransport({
    command:process.execPath,
    args:[path.join(__dirname,'node_modules/@playwright/mcp/cli.js'),
     '--headless','--isolated','--browser=chrome','--block-service-workers',
     '--image-responses=omit','--idle-timeout=60000',
     // MCP allowed-origins is not a security boundary and would prevent
     // user-approved domains. Keep validation and human consent in gateway.
     '--output-dir',this.outputDir],
    cwd:this.outputDir,
    env:{PATH:process.env.PATH||'/usr/bin:/bin',HOME:process.env.HOME||'/tmp',
      LANG:'C.UTF-8',XDG_RUNTIME_DIR:process.env.XDG_RUNTIME_DIR||''}
   });
   try{
    await client.connect(transport);
    const list=await client.listTools();
    const names=new Set(list.tools.map(t=>t.name));
    for(const n of Object.values(MAP))if(!names.has(n))throw Error('MCP Playwright sem ferramenta requerida: '+n);
    if(epoch!==this.epoch)throw reportError('MCP cancelado durante a inicialização.',409);
    this.client=client;this.transport=transport;
    if(this.startingClient===client)this.startingClient=null;
   }catch(e){
    await client.close().catch(()=>{});
    if(this.startingClient===client)this.startingClient=null;
    if(this.outputDir===ownDir)this.outputDir=null;
    fs.rmSync(ownDir,{recursive:true,force:true});
    throw reportError('Falha ou cancelamento MCP: '+cleanText(e.message,150),e.status===409?409:503);
   }
  })().finally(()=>this.starting=null);
  return this.starting;
 }
 prepare({sessionId,name,args}){
  if(typeof sessionId!=='string'||!/^[a-f0-9-]{36}$/i.test(sessionId))throw reportError('Sessão inválida.',403);
  if(this.session&&sessionId!==this.session)throw reportError('Outra sessão já controla o navegador isolado.',409);
  // Expire abandoned approvals when a new request arrives, independent of
  // whether the user ever returns to click the old dialog.
  for(const [id,p] of this.pending){
   if(this.clock()-p.created>TTL_MS){
    this.pending.delete(id);
    this._receipt({tool:p.name,status:'EXPIRED',session:'scoped',origin:this.activeOrigin});
   }
  }
  if(this.pending.size>0||this.busy)throw reportError('Outra ação está aguardando aprovação ou execução.',409);
  const values=argumentsFor(name,args);
  if(name==='playwright_click'||name==='playwright_type'){
   const url=this.currentUrl&&new URL(this.currentUrl);
   if(!this.interactionOrigins.has(this.activeOrigin)||!url||!/^\/todomvc\/?$/.test(url.pathname))
    throw reportError('Clique/digitação limitados à página /todomvc/ do laboratório.',403);
   if(!/^e\d{1,5}$/.test(values.target))
    throw reportError('O alvo deve ser uma referência de snapshot, não um seletor arbitrário.',403);
  }
  if(name!=='playwright_navigate'&&!this.activeOrigin&&name!=='playwright_close')
   throw reportError('Navegue primeiro para um endereço aprovado.',409);
  const requestId=crypto.randomUUID();
  const approvalNeeded=REQUIRES_APPROVAL.has(name);
  this.session=sessionId;
  this.pending.set(requestId,{name,args:values,sessionId,approvalNeeded,created:this.clock()});
  return {requestId,name,summary:gateSummary(name,values),approvalNeeded,
    expiresInSec:Math.floor(TTL_MS/1000),scope:'ISOLATED_BROWSER_ONLY'};
 }
 async decide({sessionId,requestId,allow}){
  const p=this.pending.get(requestId);
  if(!p||p.sessionId!==sessionId)throw reportError('Solicitação não encontrada nesta sessão.',404);
  this.pending.delete(requestId); // one-time receipt, even on failure
  if(this.clock()-p.created>TTL_MS)throw reportError('Solicitação expirada sem execução.',410);
  if(p.approvalNeeded&&allow!==true){
   return {status:'DENIED',tool:p.name,receiptId:this._receipt({tool:p.name,status:'DENIED',session:'scoped',origin:this.activeOrigin})};
  }
  if(this.busy)throw reportError('Browser ocupado.',409);
  this.busy=true;let resultText='',status='ERROR',error=null,start=this.clock();
  const epoch=this.epoch;
  const current=()=>epoch===this.epoch&&this.session===sessionId;
  try{
   if(p.name==='playwright_navigate'){this.activeOrigin=null;this.currentUrl=null;}
   if(p.name!=='playwright_close'||this.client)await this.start();
   if(!current())throw reportError('A sessão MCP foi cancelada antes do envio.',409);
   let outcome;
   if(p.name==='playwright_close'){
    await this.close();
    status='SUCCESS';resultText='Navegador isolado encerrado. O perfil desta sessão foi descartado.';
   }else{
    // Read actual page before a mutating tool. Model-supplied description
    // and page URL from a previous navigation are not authorization.
    if(p.name==='playwright_click'||p.name==='playwright_type'){
     const preflight=await this.client.callTool({name:'browser_snapshot',arguments:{depth:7}},undefined,{timeout:12000});
     if(!current())throw reportError('Sessão cancelada antes do preflight.',409);
     const raw=outputText(preflight),actual=observedUrl(raw);
     if(preflight?.isError||!actual||actual.origin!=='https://demo.playwright.dev'||!/^\/todomvc\/?$/.test(actual.pathname))
      throw reportError('Página mudou: interação cancelada por escopo inválido.',403);
     const matching=raw.split('\n').find(line=>line.includes('[ref='+p.args.target+']'));
     if(!matching||!/^e\d{1,5}$/.test(p.args.target))
      throw reportError('Ref não está presente no snapshot atual.',409);
     if(/password|senha|token|secret|api.?key|credit|pagamento|email/i.test(matching))
      throw reportError('Campo sensível no snapshot; operação bloqueada.',403);
     this.currentUrl=actual.href;
    }
    outcome=await this.client.callTool({name:MAP[p.name],arguments:p.args},undefined,{timeout:25000});
    if(!current())throw reportError('O resultado chegou depois do cancelamento; efeito indeterminado.',409);
    resultText=outputText(outcome);
    status=outcome?.isError?'ERROR':'SUCCESS';
    if(status==='SUCCESS'){
     if(p.name==='playwright_navigate'){
      const observed=observedUrl(resultText);
      const expected=publicUrl(p.args.url);
      if(!observed||!samePublicWebsite(observed,expected)){
       await this.close();
       status='BLOCKED';resultText='Redirecionamento não autorizado. Navegador isolado encerrado sem retornar conteúdo.';
      }else{this.activeOrigin=observed.origin;this.currentUrl=observed.href;}
     }else if(this.activeOrigin){
      const observed=observedUrl(resultText);
      if(observed&&observed.origin!==this.activeOrigin){
       await this.close();
       status='BLOCKED';resultText='Página navegou fora da origem aprovada. Navegador isolado encerrado.';
      }else if(observed){this.currentUrl=observed.href;}
     }
    }
   }
  }catch(e){
   error=cleanText(e.message,170);
   status='UNKNOWN';resultText='Execução interrompida ou indeterminada. Não repetir automaticamente. '+error;
   await this.close();
  }finally{
   this.busy=false;
  }
  const receiptId=this._receipt({tool:p.name,status,session:'scoped',durationMs:this.clock()-start,
    origin:this.activeOrigin,error});
  return {status,tool:p.name,receiptId,output:resultText,
   untrustedContent:true,automaticRetry:false};
 }
 async endSession(sessionId){
  if(!this.session||sessionId===this.session){
   this.pending.clear();await this.close();this.session=null;
   return true;
  }
  return false;
 }
 async close(){
  this.epoch++;
  const old=this.client,starting=this.startingClient;
  this.client=null;this.transport=null;this.startingClient=null;
  this.pending.clear();this.activeOrigin=null;this.currentUrl=null;
  if(old)await old.close().catch(()=>{});
  if(starting&&starting!==old)await starting.close().catch(()=>{});
  if(this.outputDir){fs.rmSync(this.outputDir,{recursive:true,force:true});this.outputDir=null;}
 }
}
module.exports={BrowserGateway,MAP,argumentsFor,publicUrl,cleanText,observedUrl,outputText};
