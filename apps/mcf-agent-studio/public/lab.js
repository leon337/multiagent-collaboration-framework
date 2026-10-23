'use strict';
const $=id=>document.getElementById(id);
const form=$('chatForm'), input=$('messageInput'), submit=$('sendButton');
const state={online:false,busy:false,sessionId:null,messages:[]};
const dateTime=iso=>{
 try{return new Date(iso).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}catch{return '';}
};
async function request(path,method='GET',value){
 const opts={method,headers:{'accept':'application/json'}};
 if(value!==undefined){opts.headers['content-type']='application/json';opts.body=JSON.stringify(value)}
 let response;
 try{response=await fetch(path,opts)}catch{throw Error('Sem conexão com o Agent Studio. Verifique se o serviço está ativo.')}
 let body;try{body=await response.json()}catch{throw Error('Servidor respondeu em formato inválido')}
 if(!response.ok)throw Error(body.error||'Falha na comunicação com o agente');
 return body;
}
function online(connected,label){
 state.online=connected;
 for(const el of [$('connection'),$('liveBadge')])el.dataset.online=String(connected);
 $('connectionLabel').textContent=label;
 $('liveBadge').lastChild.textContent=' '+(connected?'DSH conectado':'DSH desconectado');
 submit.disabled=state.busy||!connected;
 input.disabled=state.busy||!connected;
}
function showError(text){
 $('errorMessage').textContent=text;
 $('errorMessage').classList.toggle('hidden',!text);
}
function updateMeta(snapshot={}){
 $('sessionId').textContent=state.sessionId?state.sessionId:'Ainda não iniciada';
 $('messageCount').textContent=String(state.messages.length);
 if(snapshot.draftRevision!==undefined){
  $('draftRevision').textContent='r'+snapshot.draftRevision;
  $('noticeText').textContent=snapshot.draftPublished
   ? 'Você está testando o agente publicado no DSH. Para aplicar futuras alterações, inicie uma nova conversa.'
   : 'Este chat usa o preset publicado no DSH. Há um rascunho no Studio que pode ser diferente; alterações só chegam aqui após publicar e abrir nova conversa.';
 }
}
function scrollBottom(){
 const area=$('chatScroll');area.scrollTop=area.scrollHeight;
}

// Safe Markdown/math subset: DOM text nodes only, never model-generated HTML.
function plainMath(input){
 return input
   .replace(/\\(?:text|mathrm|operatorname)\s*\{([^{}]*)\}/g,'$1')
   .replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,'($1 ÷ $2)')
   .replace(/\\sqrt\s*\{([^{}]*)\}/g,'√($1)')
   .replace(/\\times\b/g,'×').replace(/\\cdot\b/g,'·')
   .replace(/\\div\b/g,'÷').replace(/\\approx\b/g,'≈')
   .replace(/\\leq\b/g,'≤').replace(/\\geq\b/g,'≥')
   .replace(/\\neq\b/g,'≠').replace(/\\pi\b/g,'π')
   .replace(/\\(?:left|right)\b/g,'')
   .replace(/\\[,;!]/g,' ')
   .replace(/[ \t]{2,}/g,' ').trim();
}
function formattedAgentText(element,text){
 const source=String(text??'').replace(/\r\n?/g,'\n');
 for(const part of source.slice(0,16000).split(/\n{2,}/)){
   const paragraph=document.createElement('div');
   paragraph.className='lab-paragraph';
   const tokens=/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\*\*([^\n*]+)\*\*|\x60([^\x60\n]+)\x60|\*([^\n*]+)\*/g;
   let cursor=0,match;
   while((match=tokens.exec(part))!==null){
     if(match.index>cursor)paragraph.append(document.createTextNode(part.slice(cursor,match.index)));
     let node;
     if(match[1]!==undefined||match[2]!==undefined){
       node=document.createElement('span');
       node.className='lab-math';
       node.textContent=plainMath(match[1]??match[2]);
       node.setAttribute('aria-label','Expressão matemática');
     }else if(match[3]!==undefined){
       node=document.createElement('strong');node.textContent=match[3];
     }else if(match[4]!==undefined){
       node=document.createElement('code');node.textContent=match[4];
     }else{
       node=document.createElement('em');node.textContent=match[5];
     }
     paragraph.append(node);
     cursor=tokens.lastIndex;
   }
   if(cursor<part.length)paragraph.append(document.createTextNode(part.slice(cursor)));
   element.append(paragraph);
 }
}

function addMessage(item,temporary=false){
 const node=document.createElement('article');node.className='message '+item.role+(temporary?' pending':'');
 const avatar=document.createElement('span');avatar.className='avatar';avatar.textContent=item.role==='user'?'Você'.slice(0,1):'✳';avatar.setAttribute('aria-hidden','true');
 const body=document.createElement('div');body.className='content';
 const who=document.createElement('div');who.className='who';who.textContent=item.role==='user'?'Você':'Hello World Agent';
 const bubble=document.createElement('div');bubble.className='bubble';
 if(item.role==='agent'&&!temporary)formattedAgentText(bubble,item.text);
 else bubble.textContent=item.text;
 const meta=document.createElement('div');meta.className='meta';meta.textContent=temporary?'Processando na sessão DSH':dateTime(item.at);
 body.append(who,bubble,meta);node.append(avatar,body);$('messages').append(node);
 $('emptyState').classList.toggle('hidden',true);
 scrollBottom();
 return node;
}
function renderAll(){
 $('messages').replaceChildren();
 $('emptyState').classList.toggle('hidden',state.messages.length>0);
 for(const item of state.messages)addMessage(item);
 updateMeta();
}
async function refresh(){
 try{
  const data=await request('/api/lab/status');
  state.sessionId=data.sessionId||null;
  state.messages=Array.isArray(data.messages)?data.messages:[];
  online(true,'Conectado · Hello World Agent');
  updateMeta(data);renderAll();showError('');
 }catch(e){
  online(false,'Falha de conexão com DSH');
  showError(e.message);
 }
}
async function sendMessage(text){
 if(state.busy||!state.online)return;
 if(!text||text.length>2000)return;
 state.busy=true;showError('');submit.disabled=true;input.disabled=true;
 input.value='';$('chars').textContent='0 / 2000';
 addMessage({role:'user',text,at:new Date().toISOString()});
 const pending=addMessage({role:'agent',text:'O agente está respondendo…',at:new Date().toISOString()},true);
 try{
  const result=await request('/api/lab/message','POST',{text});
  state.sessionId=result.sessionId;
  pending.remove();
  const at=new Date().toISOString();
  addMessage({role:'agent',text:result.answer,at});
  state.messages.push({role:'user',text,at},{role:'agent',text:result.answer,at});
  updateMeta();
 }catch(e){
  pending.remove();showError(e.message);
  // Rehydrate from persistent DSH state in case the request was accepted but response was lost.
  await refresh();
 }finally{
  state.busy=false;input.disabled=!state.online;submit.disabled=!state.online;
  if(state.online)input.focus();scrollBottom();
 }
}
async function newConversation(){
 if(state.busy)return;
 if(state.messages.length>0&&!window.confirm('Iniciar uma nova conversa? O histórico atual deixará de aparecer neste laboratório.'))return;
 state.busy=true;showError('');
 try{
  await request('/api/lab/reset','POST',{confirmation:'NOVA CONVERSA'});
  state.sessionId=null;state.messages=[];renderAll();
 }catch(e){showError(e.message)}finally{state.busy=false;await refresh();input.focus()}
}
form.addEventListener('submit',e=>{e.preventDefault();sendMessage(input.value.trim())});
input.addEventListener('keydown',e=>{
 if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit();}
});
input.addEventListener('input',()=>{$('chars').textContent=input.value.length+' / 2000'});
$('newConversation').addEventListener('click',newConversation);
$('newConversationSide').addEventListener('click',newConversation);
document.querySelectorAll('[data-example]').forEach(el=>{
 el.addEventListener('click',()=>{if(!state.online||state.busy)return;input.value=el.dataset.example;$('chars').textContent=input.value.length+' / 2000';input.focus()});
});
refresh();
