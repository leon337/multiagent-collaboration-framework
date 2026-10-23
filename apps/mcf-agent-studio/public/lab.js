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
 return String(input)
   .replace(/\\\$/g,'$')
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
// Render Markdown safely as DOM nodes: headings, lists, quotes, code and math.
// No innerHTML or remote scripts. Unknown markup stays literal.
function renderInline(container,source){
 const value=String(source??'').replace(/R\\\$/g,'R$');
 const tokens=/\\\(([\s\S]*?)\\\)|\*\*(.+?)\*\*|__([^_\n]+)__|\x60([^\x60\n]+)\x60|\*([^*\n]+)\*|(?<!\*)_([^_\n]+)_(?!_)/g;
 let cursor=0,match;
 while((match=tokens.exec(value))!==null){
  if(match.index>cursor)container.append(document.createTextNode(value.slice(cursor,match.index)));
  let node;
  if(match[1]!==undefined){
   node=document.createElement('span');
   node.className='lab-math';
   node.textContent=plainMath(match[1]);
   node.setAttribute('aria-label','Expressão matemática');
  }else if(match[2]!==undefined||match[3]!==undefined){
   node=document.createElement('strong');node.textContent=match[2]??match[3];
  }else if(match[4]!==undefined){
   node=document.createElement('code');node.textContent=match[4];
  }else{
   node=document.createElement('em');node.textContent=match[5]??match[6];
  }
  container.append(node);
  cursor=tokens.lastIndex;
 }
 if(cursor<value.length)container.append(document.createTextNode(value.slice(cursor)));
}
function formattedAgentText(element,text){
 const source=String(text??'').replace(/\r\n?/g,'\n').slice(0,16000);
 const lines=source.split('\n');
 const heading=/^(#{1,6})[ \t]+(.+)$/;
 const unordered=/^[ \t]*[-*+][ \t]+(.+)$/;
 const ordered=/^[ \t]*([0-9]{1,3})\.[ \t]+(.+)$/;
 const quote=/^[ \t]*>[ \t]?(.*)$/;
 const mathBegin=/^[ \t]*(\\\[|\$\$)[ \t]*$/;
 const fence=/^[ \t]*(\x60{3,}|~{3,})(.*)$/;
 const horizontal=/^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*$/;
 let i=0;
 const boundary=line=>!line.trim()||heading.test(line)||unordered.test(line)
   ||ordered.test(line)||quote.test(line)||mathBegin.test(line)
   ||fence.test(line)||horizontal.test(line);
 function appendParagraph(parent,values){
  const p=document.createElement('p');p.className='lab-paragraph';
  values.forEach((line,index)=>{
   if(index)p.append(document.createElement('br'));
   renderInline(p,line.replace(/[ \t]+$/,''));
  });
  parent.append(p);
 }
 function appendMath(parent,expression){
  const container=document.createElement('div');
  container.className='lab-display-math';container.setAttribute('role','math');
  container.textContent=plainMath(expression);parent.append(container);
 }
 while(i<lines.length){
  const line=lines[i];
  if(!line.trim()){i++;continue;}
  const openMath=line.match(mathBegin);
  if(openMath){
   const expected=openMath[1]==='\\['?'\\]':'$$';
   const body=[];i++;
   while(i<lines.length&&lines[i].trim()!==expected){body.push(lines[i]);i++;}
   if(i<lines.length)i++;
   appendMath(element,body.join(' '));continue;
  }
  const singleMath=line.match(/^[ \t]*\\\[(.*?)\\\][ \t]*$/);
  if(singleMath){appendMath(element,singleMath[1]);i++;continue;}
  const head=line.match(heading);
  if(head){
   const h=document.createElement('h'+Math.min(Number(head[1].length)+1,6));
   h.className='lab-heading';renderInline(h,head[2]);
   element.append(h);i++;continue;
  }
  const fenceStart=line.match(fence);
  if(fenceStart){
   const code=[];i++;
   while(i<lines.length&&!new RegExp('^[ \\t]*'+fenceStart[1][0]+'{'+fenceStart[1].length+',}[ \\t]*$').test(lines[i])){
    code.push(lines[i]);i++;
   }
   if(i<lines.length)i++;
   const pre=document.createElement('pre'),node=document.createElement('code');
   node.textContent=code.join('\n');pre.append(node);element.append(pre);continue;
  }
  if(horizontal.test(line)){element.append(document.createElement('hr'));i++;continue;}
  if(quote.test(line)){
   const quoted=[];
   while(i<lines.length){
    const match=lines[i].match(quote);if(!match)break;
    quoted.push(match[1]);i++;
   }
   const block=document.createElement('blockquote');block.className='lab-quote';
   formattedAgentText(block,quoted.join('\n'));
   element.append(block);continue;
  }
  const m=line.match(unordered),orderedMatch=m?null:line.match(ordered);
  if(m||orderedMatch){
   const type=m?'ul':'ol',list=document.createElement(type);list.className='lab-list';
   if(orderedMatch)list.start=Number(orderedMatch[1]);
   while(i<lines.length){
    const found=type==='ul'?lines[i].match(unordered):lines[i].match(ordered);
    if(!found)break;
    const li=document.createElement('li');
    renderInline(li,found[type==='ul'?1:2]);
    list.append(li);i++;
   }
   element.append(list);continue;
  }
  const paragraph=[];
  while(i<lines.length&&!boundary(lines[i])){
   paragraph.push(lines[i]);i++;
  }
  if(paragraph.length)appendParagraph(element,paragraph);
  else{appendParagraph(element,[lines[i]]);i++;}
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
