/**
 * Local bridge to a dedicated DSH Agent Studio session.
 * Runs INSIDE DSH as a Cordis plugin, with the native sessionController.
 * Does not read, copy, or reimplement any LLM credential.
 */
import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

export const name='mcf-agent-studio-session-bridge';
export const inject=['sessionController'];

const HOME='/home/leo/MCF MISSIONS/mcf-chatgpt-workspace/apps/mcf-agent-studio';
const DATA=join(HOME,'.data');
const TOKEN_FILE=join(DATA,'dsh-bridge-token');
const SESSION_FILE=join(DATA,'dsh-planner-session.json');
const PORT=4319;
const HOST='127.0.0.1';
const PRESET='mcf-studio-brain';

function sessionEventText(event) {
  if(event.type!=='assistant/message')return '';
  const message=event.data?.message;
  const content=message?.content;
  if(typeof content==='string')return content;
  if(!Array.isArray(content))return '';
  return content.filter(p=>p?.type==='text' && typeof p.text==='string').map(p=>p.text).join('\n').trim();
}
function endAsText(events) {
  const meaningful=events.map(sessionEventText).filter(Boolean);
  return meaningful[meaningful.length-1]||'';
}
function reject(res,status,message){
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(JSON.stringify({error:message}));
}
function response(res,status,body){
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(JSON.stringify(body));
}
async function json(req){
  let data='';
  for await(const chunk of req){data+=chunk; if(data.length>10000)throw Error('Pedido muito grande');}
  return JSON.parse(data||'{}');
}
export function apply(ctx){
  mkdirSync(DATA,{recursive:true,mode:0o700});
  const token=randomBytes(32).toString('hex');
  writeFileSync(TOKEN_FILE,token,{mode:0o600});
  let sessionId=null;
  if(existsSync(SESSION_FILE)){
    try{
      const id=JSON.parse(readFileSync(SESSION_FILE,'utf8')).sessionId;
      if(typeof id==='string'&&/^session-[a-f0-9-]{36}$/.test(id))sessionId=id;
    }catch{}
  }
  let running=false;
  let connected=false;

  async function ensureSession() {
    const cwd=HOME;
    const result=await ctx.sessionController.create({
      ...(sessionId?{sessionId}:{}),cwd,agentPreset:PRESET
    });
    if(!result?.sessionId)throw Error('DSH não criou uma sessão válida');
    if(result.agentPreset!==PRESET)throw Error('Preset inesperado na sessão do DSH');
    sessionId=result.sessionId;
    await writeFile(SESSION_FILE,JSON.stringify({sessionId,preset:PRESET},null,2)+'\n',{mode:0o600});
    connected=true;
    return sessionId;
  }

  async function complete(prompt, preset = PRESET) {
    if(running)throw Object.assign(Error('A sessão do Studio já processa outra mensagem'),{status:409});
    running=true;
    let dispose=()=>{};
    try{
      let id;
      if (preset === PRESET) {
        id = await ensureSession();
      } else if (preset === 'hello-world-agent' || preset === 'mcf-studio-preview') {
        // A fresh session is mandatory to validate the mounted preset revision.
        const created = await ctx.sessionController.create({
          cwd: HOME, agentPreset: preset
        });
        if (!created?.sessionId || created.agentPreset !== preset)
          throw Error('DSH não montou o preset solicitado');
        id = created.sessionId;
      } else throw Error('Preset não autorizado');

      // Only accept messages from the dedicated private session.
      const events=[];
      let ready;
      let aborted=false;
      const result=new Promise((resolve,reject)=>{ready={resolve,reject}});
      const timer=setTimeout(()=>{aborted=true; ready.reject(Object.assign(Error('Sessão DSH excedeu o tempo de resposta'),{status:504}));},85000);
      // Listen BEFORE prompt admission: never miss a fast answer or turn/end.
      dispose=ctx.on('session/event',(session,event)=>{
        if(session.id!==id || aborted)return;
        if(event.type==='assistant/message')events.push(event);
        if(event.type==='turn/end'){
          const reply=endAsText(events);
          if(reply)ready.resolve({sessionId:id,answer:reply,origin:'dsh-session',preset});
          else ready.reject(Object.assign(Error('A sessão DSH terminou sem resposta textual'),{status:502}));
        }
      });
      try{
        const receipt=await ctx.sessionController.prompt({
          sessionId:id,
          requestId:'studio-'+randomUUID(),
          mode:'queue',
          content:[{type:'text',text:prompt}]
        },new AbortController().signal);
        if(receipt?.accepted!==true)throw Error('DSH não admitiu a mensagem');
        return await result;
      }finally{clearTimeout(timer);}
    }finally{dispose();running=false;}
  }

  const server=createServer(async (req,res)=>{
    // Defense in depth: only host-local Studio calls with per-run secret.
    if(req.socket.remoteAddress!=='127.0.0.1'
      ||req.headers.host!=='127.0.0.1:'+PORT
      ||req.headers['x-agent-studio-bridge']!==token) return reject(res,403,'Acesso restrito ao Agent Studio local');
    try{
      if(req.method==='GET'&&req.url==='/status'){
        return response(res,200,{ready:true,connected,sessionId,agentPreset:PRESET,running});
      }
      if(req.method==='POST'&&req.url==='/chat'){
        const body=await json(req);
        if(typeof body.prompt!=='string'||body.prompt.length>6500||!body.prompt.trim())return reject(res,400,'Mensagem inválida');
        const answer=await complete(body.prompt);
        return response(res,200,answer);
      }
      if(req.method==='POST'&&req.url==='/validate-hello-world'){
        const body=await json(req);
        if(typeof body.prompt!=='string'||body.prompt.length>200||!body.prompt.trim())
          return reject(res,400,'Mensagem de teste inválida');
        const result=await complete(body.prompt, 'hello-world-agent');
        return response(res,200,result);
      }
      if(req.method==='POST'&&req.url==='/preview-chat'){
        const body=await json(req);
        if(typeof body.prompt!=='string'||body.prompt.length>4000||!body.prompt.trim())
          return reject(res,400,'Mensagem de prévia inválida');
        const result=await complete(body.prompt, 'mcf-studio-preview');
        return response(res,200,result);
      }
      return reject(res,404,'Rota não encontrada');
    }catch(e){
      ctx.logger.warn('agent-studio-bridge: '+String(e?.message||e));
      return reject(res,e.status||502,String(e?.message||'DSH falhou'));
    }
  });
  server.on('error',e=>ctx.logger.error('agent-studio-bridge servidor: '+String(e)));
  server.listen(PORT,HOST,()=>ctx.logger.info('Agent Studio DSH session bridge online em '+HOST+':'+PORT));
  ctx.effect(()=>()=>new Promise(resolve=>server.close(resolve)),'Agent Studio bridge HTTP lifecycle');
  ctx.logger.info('Agent Studio bridge plugin mounted');
}
export default {name,inject,apply};
