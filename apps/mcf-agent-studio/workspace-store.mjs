import {mkdir,readFile,writeFile,readdir,rename,open,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';

const MODES=['fixed','echo','instructed'];
const TOOLSET=['calculator','clock'];
const STEPS=['objetivo','comportamento','ferramentas','workspace','testes','revisao'];
const clone=v=>JSON.parse(JSON.stringify(v));
function bad(message,code=422){const err=new Error(message);err.status=code;throw err}
const trim=(v,n,label,allowEmpty=false)=>{
 if(typeof v!=='string'||v.length>n||(!allowEmpty&&!v.trim()))bad('Campo inválido: '+label);
 return v.trim();
};
function validated(input){
 if(!input||typeof input!=='object'||Array.isArray(input))bad('Configuração inválida');
 const tools=input.tools??[];
 if(!Array.isArray(tools)||tools.some(t=>!TOOLSET.includes(t)))bad('Ferramentas não permitidas');
 const mode=input.mode??'instructed';
 if(!MODES.includes(mode))bad('Modo inválido');
 return {
  name:trim(input.name,80,'nome'),
  objective:trim(input.objective??'',1200,'objetivo',true),
  tone:trim(input.tone??'Claro e profissional',120,'tom'),
  mode,
  response:trim(input.response??'Olá! Como posso ajudar?',400,'resposta'),
  instructions:trim(input.instructions??'',2500,'instruções',true),
  tools:[...new Set(tools)],
  testPrompt:trim(input.testPrompt??'Olá! Qual é sua função?',1000,'teste'),
 };
}
function validStep(step){if(!STEPS.includes(step))bad('Etapa inexistente');return step}
async function atomic(path,obj){
 const tmp=path+'.'+randomUUID()+'.tmp';
 await writeFile(tmp,JSON.stringify(obj,null,2)+'\n',{mode:0o600});
 await rename(tmp,path);
}
const checklist=w=>({
 objective:Boolean(w.config.objective.trim()),
 behavior:Boolean(w.config.instructions.trim()),
 toolsReviewed:w.completed.includes('ferramentas'),
 workspace:true,
 tested:w.tests.length>0,
 readyForReview:w.completed.includes('revisao'),
 liveInstalled:false
});
export function createWorkspaceStore(base){
 const root=resolve(base);
 const queues=new Map();
 const ensure=()=>mkdir(root,{recursive:true,mode:0o700});
 const folder=id=>{
  if(typeof id!=='string'||!/^agent-[a-f0-9-]{36}$/.test(id))bad('Identificador de workspace inválido');
  return join(root,id);
 };
 async function load(id){
  const file=join(folder(id),'agent.json');
  try{
   const data=JSON.parse(await readFile(file,'utf8'));
   if(data.id!==id||data.schemaVersion!==1)bad('Workspace inconsistente',500);
   return data;
  }catch(err){
   if(err.code==='ENOENT')bad('Workspace não encontrado',404);
   throw err;
  }
 }
 async function locked(id,fn){
  const prev=queues.get(id)||Promise.resolve();
  let release;
  const current=new Promise(ok=>{release=ok});
  queues.set(id,current);
  try{await prev;return await fn()}
  finally{release();if(queues.get(id)===current)queues.delete(id)}
 }
 async function save(w){
  const loc=folder(w.id);
  await mkdir(loc,{recursive:true,mode:0o700});
  await atomic(join(loc,'agent.json'),w);
  await mkdir(join(loc,'versions'),{recursive:true,mode:0o700});
  await atomic(join(loc,'versions',String(w.revision).padStart(4,'0')+'.json'),{
    revision:w.revision,updatedAt:w.updatedAt,config:w.config,step:w.step
  });
  const text=[
   '# '+w.config.name,
   '',
   'Workspace '+w.id+' — MCF Agent Studio',
   '',
   'Objetivo: '+(w.config.objective||'(não definido)'),
   '',
   'Estado: RASCUNHO ISOLADO — não registrado/publicado no DSH.',
   '',
   'Etapa atual: '+w.step,
   '',
   'Este workspace mantém histórico versionado e só pode ser alterado pelo Guided Builder local.',
   '',
   'Configuração: agent.json. Histórico: versions/*.json.',
   ''
  ].join('\n');
  await writeFile(join(loc,'README.md'),text,{mode:0o600});
 }
 return {
  root,
  async list(){
   await ensure();
   const ids=await readdir(root,{withFileTypes:true});
   const workspaces=[];
   for(const x of ids){
    if(!x.isDirectory()||!/^agent-[a-f0-9-]{36}$/.test(x.name))continue;
    try{
     const w=await load(x.name);
     workspaces.push({id:w.id,name:w.config.name,objective:w.config.objective,
       source:w.source,updatedAt:w.updatedAt,revision:w.revision,step:w.step});
    }catch{}
   }
   return workspaces.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  },
  load,
  async create({kind,name,seed}={}){
   if(!['new','modify'].includes(kind))bad('Escolha criar ou modificar');
   const id='agent-'+randomUUID();
   const now=new Date().toISOString();
   const config=validated({
     name:trim(name,80,'nome'),
     objective:'',tone:'Claro e profissional',
     mode:kind==='modify'?(seed?.mode||'instructed'):'instructed',
     response:kind==='modify'?(seed?.response||'Olá! Como posso ajudar?'):'Olá! Como posso ajudar?',
     instructions:kind==='modify'?(seed?.instructions||''):'',
     tools:kind==='modify'?(seed?.tools||[]):[],
     testPrompt:'Olá! Qual é sua função?'
   });
   const w={schemaVersion:1,id,kind,source:kind==='modify'?'hello-world-agent':null,
     step:'objetivo',completed:[],revision:1,createdAt:now,updatedAt:now,
     config,tests:[],guidance:[],publication:'draft-only'};
   await ensure();await save(w);return {...w,checklist:checklist(w)};
  },
  async get(id){const w=await load(id);return {...w,checklist:checklist(w)}},
  async update(id,req){
   return locked(id,async()=>{
    const w=await load(id);
    const step=validStep(req.step??w.step);
    const config=validated({...w.config,...req.config});
    w.config=config;w.step=step;
    if(req.markComplete===true){
      const completed=validStep(req.completedStep??step);
      if(!w.completed.includes(completed))w.completed.push(completed);
    }
    w.revision++;w.updatedAt=new Date().toISOString();
    await save(w);return {...w,checklist:checklist(w)};
   });
  },
  async addGuidance(id,question,advice){
   return locked(id,async()=>{
     const w=await load(id);
     w.guidance??=[];
     w.guidance.push({at:new Date().toISOString(),question:trim(question,700,'pergunta'),
       advice:trim(advice,1000,'orientação')});
     w.guidance=w.guidance.slice(-25);
     w.updatedAt=new Date().toISOString();
     await atomic(join(folder(id),'agent.json'),w);
     return w.guidance.length;
   });
  },
  async test(id,prompt,simulate){
   return locked(id,async()=>{
    const w=await load(id);
    trim(prompt,1000,'mensagem de teste');
    const answer=await simulate(prompt,w.config);
    const item={at:new Date().toISOString(),message:prompt,answer:answer.answer,
      channel:answer.channel,passed:typeof answer.answer==='string'&&answer.answer.length>0};
    w.tests.push(item);w.tests=w.tests.slice(-20);
    w.updatedAt=item.at;
    await atomic(join(folder(id),'agent.json'),w);
    return {result:item,checklist:checklist(w)};
   });
  }
 };
}
