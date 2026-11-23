'use strict';
const $=id=>document.getElementById(id);
const form=$('chatForm'),input=$('messageInput'),submit=$('sendButton');
const KEY='mcf-google-drive-agent-chat-v1';
const ACTIVE_JOB_KEY='mcf-google-drive-agent-active-job-v1';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const state={online:false,busy:false,sessionId:null,messages:[]};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(saved))state.messages=saved.slice(-80).filter(x=>x&&['user','agent'].includes(x.role)&&typeof x.text==='string');}catch{}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state.messages.slice(-80)));}catch{}}
async function request(path,method='GET',value){
 const opts={method,headers:{accept:'application/json'}};
 if(value!==undefined){opts.headers['content-type']='application/json';opts.body=JSON.stringify(value);}
 let response;try{response=await fetch(path,opts);}catch{throw Error('Sem conexão com o MCF Agent Studio.');}
 let body;try{body=await response.json();}catch{throw Error('Resposta inválida do servidor.');}
 if(!response.ok)throw Error(body.error||'Falha na comunicação com o agente.');
 return body;
}
function online(yes,label){
 state.online=yes;
 for(const el of [$('connection'),$('liveBadge')])el.dataset.online=String(yes);
 $('connectionLabel').textContent=label;
 $('liveBadge').lastChild.textContent=' '+(yes?'DSH conectado':'DSH desconectado');
 submit.disabled=state.busy||!yes;input.disabled=state.busy||!yes;
 $('verifyButton').disabled=state.busy||!yes;
}
function showError(text){$('errorMessage').textContent=text;$('errorMessage').classList.toggle('hidden',!text);}
function renderMessage(item,pending=false){
 const node=document.createElement('article');node.className='message '+item.role+(pending?' pending':'');
 const avatar=document.createElement('span');avatar.className='avatar';avatar.textContent=item.role==='user'?'V':'✳';avatar.setAttribute('aria-hidden','true');
 const body=document.createElement('div');body.className='content';
 const who=document.createElement('div');who.className='who';who.textContent=item.role==='user'?'Você':'MCF Google Drive Agent';
 const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=item.text;
 const meta=document.createElement('div');meta.className='meta';meta.textContent=pending?'Processando na sessão DSH':new Date(item.at||Date.now()).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
 body.append(who,bubble,meta);node.append(avatar,body);$('messages').append(node);$('emptyState').classList.add('hidden');
 $('messageCount').textContent=String(state.messages.length);$('chatScroll').scrollTop=$('chatScroll').scrollHeight;
 return node;
}
function renderAll(){
 $('messages').replaceChildren();$('emptyState').classList.toggle('hidden',state.messages.length>0);
 state.messages.forEach(x=>renderMessage(x));$('messageCount').textContent=String(state.messages.length);
}
async function refresh(){
 try{
  const x=await request('/api/google-drive/status');
  state.sessionId=x.sessionId||null;
  $('sessionId').textContent=state.sessionId||'Aguardando sessão';
  $('noticeText').textContent=x.ready?'Sessão do preset mcf-google-drive-agent pronta. Use “Verificar OAuth” para validar a conta antes de operar.':'O preset Google Drive ainda não está pronto.';
  online(Boolean(x.ready),'Conectado · MCF Google Drive Agent');renderAll();showError('');
 }catch(e){online(false,'Falha de conexão com DSH');showError(e.message);}
}
async function waitForJob(jobId){
 const started=Date.now();let delayMs=900,lastError='';
 while(Date.now()-started<16*60*1000){
  try{
   const job=await request('/api/google-drive/jobs/'+jobId);
   if(job.status==='completed')return job;
   if(['failed','interrupted'].includes(job.status)){localStorage.removeItem(ACTIVE_JOB_KEY);throw Error(job.error||'A execução terminou sem resposta.');}
   if(!['queued','running'].includes(job.status))throw Error('Estado de execução desconhecido.');
   lastError='';
  }catch(e){
   if(/trabalho não encontrado|expirado|Estado de execução/.test(e.message)){localStorage.removeItem(ACTIVE_JOB_KEY);throw e;}
   lastError=e.message;
  }
  if(lastError)showError('Aguardando reconexão com a execução DSH…');
  await sleep(delayMs);delayMs=Math.min(2500,Math.round(delayMs*1.25));
 }
 throw Error('A execução continua sem confirmação após 16 minutos. O trabalho permanece registrado no DSH; consulte a sessão antes de reenviar.');
}
async function receiveJob(jobId,pending){
 const result=await waitForJob(jobId);
 localStorage.removeItem(ACTIVE_JOB_KEY);
 pending?.remove();
 state.sessionId=result.sessionId||state.sessionId;
 $('sessionId').textContent=state.sessionId||'Sessão ativa';
 state.messages.push({role:'agent',text:String(result.answer||'O agente não retornou texto.'),at:new Date().toISOString()});
 state.messages=state.messages.slice(-80);save();renderAll();showError('');
}
async function sendMessage(text){
 if(state.busy||!state.online||!text||text.length>4000)return;
 state.busy=true;showError('');submit.disabled=true;input.disabled=true;
 input.value='';$('chars').textContent='0 / 4000';
 const user={role:'user',text,at:new Date().toISOString()};state.messages.push(user);save();renderAll();
 const pending=renderMessage({role:'agent',text:'Mensagem recebida pelo DSH. Aguardando a conclusão do agente…',at:new Date().toISOString()},true);
 try{
  const accepted=await request('/api/google-drive/message','POST',{text});
  if(!accepted.jobId)throw Error('O DSH não confirmou o identificador do trabalho.');
  localStorage.setItem(ACTIVE_JOB_KEY,accepted.jobId);
  await receiveJob(accepted.jobId,pending);
 }catch(e){
  pending.remove();showError(e.message);
 }finally{
  state.busy=false;submit.disabled=!state.online;input.disabled=!state.online;input.focus();
 }
}
async function resumePendingJob(){
 const jobId=localStorage.getItem(ACTIVE_JOB_KEY);
 if(!jobId||state.busy)return;
 state.busy=true;online(state.online,'Recuperando resposta DSH…');
 const pending=renderMessage({role:'agent',text:'Recuperando a resposta da sessão DSH…',at:new Date().toISOString()},true);
 try{await receiveJob(jobId,pending);}
 catch(e){pending.remove();showError(e.message);}
 finally{state.busy=false;online(state.online,state.online?'DSH conectado':'DSH desconectado');}
}
form.addEventListener('submit',e=>{e.preventDefault();const text=input.value.trim();if(text)sendMessage(text);});
input.addEventListener('input',()=>$('chars').textContent=input.value.length+' / 4000');
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit();}});
$('verifyButton').addEventListener('click',()=>sendMessage('Verifique sua autenticação OAuth usando mcf_google_drive_status. Informe a conta, accountMatches e o escopo efetivo.'));
$('newConversation').addEventListener('click',async()=>{
 if(state.busy)return;
 if(!confirm('Iniciar uma nova sessão DSH? O histórico desta tela será limpo; a sessão anterior continuará preservada no DSH.'))return;
 state.busy=true;online(state.online,'Criando nova sessão…');
 try{const x=await request('/api/google-drive/reset','POST',{confirmation:'NOVA CONVERSA'});state.sessionId=x.sessionId;state.messages=[];save();renderAll();showError('');await refresh();}
 catch(e){showError(e.message);}
 finally{state.busy=false;online(state.online,state.online?'DSH conectado':'DSH desconectado');}
});
document.querySelectorAll('[data-example]').forEach(b=>b.addEventListener('click',()=>sendMessage(b.dataset.example)));
renderAll();refresh().then(resumePendingJob);
