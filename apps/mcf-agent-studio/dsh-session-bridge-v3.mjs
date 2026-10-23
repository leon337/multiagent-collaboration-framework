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
export const inject=['sessionController','workspaceController','workspaceRegistry'];

const HOME='/home/leo/MCF MISSIONS/mcf-chatgpt-workspace/apps/mcf-agent-studio';
const DATA=join(HOME,'.data');
const TOKEN_FILE=join(DATA,'dsh-bridge-token');
const SESSION_FILE=join(DATA,'dsh-planner-session.json');
const LAB_FILE=join(DATA,'dsh-trainee-session.json');
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
  let lab={sessionId:null,messages:[],startedAt:null,updatedAt:null};
  try {
    const existing=JSON.parse(readFileSync(LAB_FILE,'utf8'));
    if(existing && typeof existing==='object'
      && (existing.sessionId===null || /^session-[a-f0-9-]{36}$/.test(existing.sessionId))
      && Array.isArray(existing.messages)){
      lab={sessionId:existing.sessionId,messages:existing.messages.slice(-80)
        .filter(m=>typeof m.text==='string'&&['user','agent'].includes(m.role))
        .map(m=>({role:m.role,text:m.text.slice(0,4000),at:m.at})),
        startedAt:existing.startedAt||null,updatedAt:existing.updatedAt||null};
    }
  } catch {}
  const persistLab=()=>writeFile(LAB_FILE,JSON.stringify(lab,null,2)+'\n',{mode:0o600});

  // DSH Workspaces are registry entities, not arbitrary folders.
  // A Session only joins a workspace when its stored cwd equals the
  // canonical workspace path AND its id is attached to the registry account.
  // Never rewrite DSH session headers or edit registry persistence directly.
  async function workspaceInspection(){
    const entity=await ctx.workspaceRegistry.resolveByPath(HOME);
    const sessions=await ctx.sessionController.list({});
    const match=sessions.items.filter(row=>row.cwd===HOME&&row.origin!=='subagent');
    const ids=new Set(entity?.sessionIds??[]);
    return {
      workspace:entity?{id:entity.id,title:entity.title,path:entity.path,sessionIds:[...entity.sessionIds]}:null,
      matching:match.map(row=>({id:row.sessionId,accounted:ids.has(row.sessionId),running:row.running})),
      otherPathsCount:sessions.items.filter(row=>row.cwd!==HOME).length,
      totalSessions:sessions.items.length,
      expected:{plannerSessionId:sessionId,labSessionId:lab.sessionId},
      nativeRegistry:true
    };
  }
  async function workspaceEnsure(){
    // Idempotent native Workspace Controller, existing real directory only.
    const registered=await ctx.workspaceController.create({path:HOME});
    const workspaceId=registered.workspace.workspaceId;
    if(registered.created){
      await ctx.workspaceController.rename({
        workspaceId,title:'MCF Agent Studio — Agentes'
      });
    }
    const entity=ctx.workspaceRegistry.get(workspaceId);
    if(!entity)throw Error('DSH não confirmou o registro do Workspace');
    const sessions=await ctx.sessionController.list({});
    const matches=sessions.items.filter(row=>row.cwd===HOME&&row.origin!=='subagent');
    const attached=[];
    for(const row of matches){
      // attachSession checks persisted header cwd against canonical path.
      await entity.attachSession(row.sessionId);
      attached.push(row.sessionId);
    }
    const inspected=await workspaceInspection();
    const missing=attached.filter(id=>!inspected.workspace.sessionIds.includes(id));
    if(missing.length)throw Error('Registro DSH não confirmou '+missing.length+' sessões: '+missing.join(','));
    return {...inspected,created:registered.created,attachedSessionIds:attached};
  }
  async function sessionLocation(){
    const workspace=await ctx.workspaceRegistry.resolveByPath(HOME);
    if(!workspace)throw Error('MCF Agent Studio sem workspace registrado no DSH; use a recuperação nativa antes de criar sessões.');
    return {workspaceId:workspace.id};
  }

  async function ensureLab(){
    const created=await ctx.sessionController.create({
      ...(lab.sessionId?{sessionId:lab.sessionId}:{}),
      ...(await sessionLocation()),agentPreset:'hello-world-agent'
    });
    if(!created?.sessionId||created.agentPreset!=='hello-world-agent')
      throw Error('DSH não montou o Hello World Agent');
    lab.sessionId=created.sessionId;
    lab.startedAt ||= new Date().toISOString();
    lab.updatedAt=new Date().toISOString();
    await persistLab();
    return created.sessionId;
  }


  async function ensureSession() {
    const result=await ctx.sessionController.create({
      ...(sessionId?{sessionId}:{}),...(await sessionLocation()),agentPreset:PRESET
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
      } else if (preset === 'mcf-studio-lab') {
        id=await ensureLab();
      } else if (preset === 'hello-world-agent' || preset === 'mcf-studio-preview') {
        // A fresh session is mandatory to validate the mounted preset revision.
        const created = await ctx.sessionController.create({
          ...(await sessionLocation()), agentPreset: preset
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
      if(req.method==='GET'&&req.url==='/workspace/status')
        return response(res,200,await workspaceInspection());
      if(req.method==='POST'&&req.url==='/workspace/ensure')
        return response(res,200,await workspaceEnsure());
      if(req.method==='GET'&&req.url==='/lab/status'){
        return response(res,200,{ready:true,preset:'hello-world-agent',
          sessionId:lab.sessionId,startedAt:lab.startedAt,updatedAt:lab.updatedAt,
          messages:lab.messages,running});
      }
      if(req.method==='POST'&&req.url==='/lab/reset'){
        if(running)return reject(res,409,'Aguarde o término da resposta atual');
        lab={sessionId:null,messages:[],startedAt:null,updatedAt:null};
        await persistLab();
        return response(res,200,{reset:true,sessionId:null,messages:[]});
      }
      if(req.method==='POST'&&req.url==='/lab/message'){
        const body=await json(req);
        if(typeof body.text!=='string'||body.text.trim().length<1||body.text.length>2000)
          return reject(res,400,'Mensagem inválida (máximo 2000 caracteres)');
        const started=Date.now();
        const answer=await complete(body.text.trim(),'mcf-studio-lab');
        const at=new Date().toISOString();
        lab.messages.push({role:'user',text:body.text.trim(),at});
        lab.messages.push({role:'agent',text:answer.answer,at:new Date().toISOString()});
        lab.messages=lab.messages.slice(-80);
        lab.updatedAt=new Date().toISOString();
        await persistLab();
        return response(res,200,{sessionId:answer.sessionId,preset:'hello-world-agent',
          answer:answer.answer,elapsedMs:Date.now()-started,count:lab.messages.length});
      }
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
