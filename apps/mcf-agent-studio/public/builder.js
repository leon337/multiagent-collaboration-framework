'use strict';
const $=id=>document.getElementById(id);
const order=['objetivo','comportamento','ferramentas','workspace','testes','revisao'];
const titles=['Defina o propósito','Modele o comportamento','Escolha as ferramentas','Organize o workspace','Teste a experiência','Revise e evolua'];
const descriptions=[
 'O que seu agente resolve, para quem e com qual resultado esperado?',
 'Defina a personalidade, regras e forma de responder. Você pode melhorar depois.',
 'Comece com poucas ferramentas e libere somente as necessárias.',
 'Cada agente possui pasta, configuração e histórico de revisões isolados.',
 'Experimente diferentes mensagens. Os testes usam o rascunho; não publicam nada.',
 'Confira o contrato antes de decidir se o agente está pronto para a próxima etapa.'
];
const questions=[
 ['Me ajude a definir um objetivo claro','Que informações faltam no escopo?'],
 ['Como posso escrever boas instruções?','Quais limites devo definir?'],
 ['Quando uma calculadora seria útil?','Como evitar permissões excessivas?'],
 ['Explique a diferença entre workspace e sessão DSH','Como ficam as versões?'],
 ['Quais cenários de teste são importantes?','Como identificar erros do agente?'],
 ['O que devo validar antes de publicar?','Quais riscos faltam avaliar?']
];
let model=null,busy=false,workspaceList=[];
const node=(tag,cls,text)=>{
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(text!==undefined)e.textContent=text;
 return e;
};
function toast(text,error=false){
 const el=$('toast');
 el.textContent=text;el.classList.remove('hidden');el.classList.toggle('error',error);
 clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add('hidden'),4800);
}
async function api(path,method='GET',data){
 const opt={method,headers:{accept:'application/json'}};
 if(data!==undefined){opt.headers['content-type']='application/json';opt.body=JSON.stringify(data)}
 let response;try{response=await fetch(path,opt)}catch{throw Error('O Agent Studio não respondeu. Verifique o serviço local.')}
 let json;try{json=await response.json()}catch{throw Error('Resposta inválida do serviço')}
 if(!response.ok)throw Error(json.error||'Falha HTTP '+response.status);
 return json;
}
function setBusy(value){
 busy=value;
 for(const id of ['nextButton','backButton','coachSend']){
  const e=$(id);if(e)e.disabled=value;
 }
 document.querySelectorAll('.step-button').forEach(b=>b.disabled=value);
}
function field(label,id,value,options={}){
 const holder=node('label','field');
 holder.append(node('span','',label));
 const element=document.createElement(options.type==='textarea'?'textarea':options.type==='select'?'select':'input');
 element.id=id;element.name=id;
 if(options.type==='textarea'){element.rows=options.rows||4;}
 else if(options.type==='select'){
  for(const [key,title] of options.choices||[]){
   const option=node('option','',title);option.value=key;element.append(option);
  }
 }else{
  element.type='text';element.maxLength=options.max||200;
 }
 element.value=value??'';
 if(options.required)element.required=true;
 if(options.placeholder)element.placeholder=options.placeholder;
 holder.append(element);
 if(options.help)holder.append(node('small','',options.help));
 return holder;
}
function toolItem(id,title,desc,checked){
 const row=node('div','tool-choice'),label=node('label');
 const input=document.createElement('input');input.type='checkbox';input.id=id;input.checked=checked;
 label.append(node('strong','',title),node('small','',desc));row.append(input,label);
 return row;
}
function summaryItem(label,value){
 const e=node('div','summary-item');e.append(node('small','',label),node('strong','',String(value||'Não definido')));return e;
}
function setHints(index){
 $('coachHint').textContent=[
  'Um bom agente começa por um problema específico. Descreva o que deverá fazer e quem será beneficiado.',
  'Pense como o agente deve falar, quando pedir esclarecimentos e como evitar decisões precipitadas.',
  'Permissões mínimas tornam o agente mais previsível. Nem toda tarefa exige ferramentas.',
  'Um workspace é a pasta própria do agente. Alterações e versões ficam registradas sem atingir outros agentes.',
  'Teste situações normais e casos extremos. Compare o resultado com o comportamento desejado.',
  'Você está revisando um rascunho isolado. Publicar é um procedimento diferente e deve passar por validação.'
 ][index];
 const holder=$('coachSuggestions');holder.replaceChildren();
 for(const question of questions[index]){
  const b=node('button','',question);b.type='button';
  b.addEventListener('click',()=>askCoach(question));
  holder.append(b);
 }
}
function renderFields(){
 if(!model)return;
 const i=order.indexOf(model.step),c=model.config;
 $('stepLabel').textContent='ETAPA '+(i+1)+' DE 6';
 $('stepTitle').textContent=titles[i];$('stepDescription').textContent=descriptions[i];
 const fields=$('fields');fields.replaceChildren();
 const group=node('div','form-fields');fields.append(group);
 if(i===0){
  group.append(field('Nome do agente','fName',c.name,{required:true,max:80,placeholder:'Ex.: Assistente de Orçamentos'}));
  group.append(field('Qual problema ele vai resolver?','fObjective',c.objective,{type:'textarea',rows:5,required:true,max:1200,placeholder:'Ex.: calcular custos de serralheria com medidas e preços informados pelo usuário'}));
  group.append(node('p','field-hint','Defina um objetivo mensurável. Poderemos aprimorar os detalhes nos próximos passos.'));
 }else if(i===1){
  group.append(field('Estilo de comunicação','fTone',c.tone,{max:120,required:true,placeholder:'Ex.: técnico, claro e respeitoso'}));
  group.append(field('Forma de responder','fMode',c.mode,{type:'select',choices:[['instructed','Conversacional com IA'],['fixed','Resposta fixa'],['echo','Repetir mensagem (eco)']]}));
  group.append(field('Instruções e limites','fInstructions',c.instructions,{type:'textarea',rows:7,max:2500,help:'Inclua: papel, contexto, regras, quando pedir dados, formato de saída e limitações.'}));
  group.append(field('Resposta padrão','fResponse',c.response,{max:400,help:'Usada diretamente no modo resposta fixa e como fallback de configuração.'}));
 }else if(i===2){
  const tools=node('div','tool-grid');
  tools.append(toolItem('fCalculator','Calculadora','Permite cálculos numéricos locais, sem acesso a arquivos.',c.tools.includes('calculator')));
  tools.append(toolItem('fClock','Relógio','Fornece data e hora local quando necessário.',c.tools.includes('clock')));
  group.append(tools,node('p','field-hint','Neste MVP, só existem essas duas ferramentas aprovadas. Instalação de ferramentas externas requer nova validação de segurança.'));
 }else if(i===3){
  group.append(summaryItem('Workspace ID',model.id));
  group.append(summaryItem('Nome do agente',c.name));
  group.append(summaryItem('Tipo de projeto',model.kind==='modify'?'Evolução isolada do Hello World':'Novo agente — rascunho'));
  group.append(summaryItem('Revisão persistida','r'+model.revision));
  group.append(node('p','field-hint','A pasta é criada automaticamente no armazenamento privado do Agent Studio, com agent.json, README.md e versões numeradas. Não há edição manual de caminhos.'));
 }else if(i===4){
  group.append(field('Mensagem de teste','fTest',c.testPrompt,{type:'textarea',rows:3,max:1000,placeholder:'Olá! Como você pode me ajudar?'}));
  const actions=node('div','inline-actions'),btn=node('button','button ghost test-btn','Executar teste seguro ↗');
  btn.type='button';btn.id='simulateBtn';btn.addEventListener('click',runTest);actions.append(btn);group.append(actions);
  const list=node('div','',undefined);list.id='testResults';
  if(model.tests?.length)for(const t of model.tests.slice(-3).reverse()){
   const box=node('div','test-feedback');box.append(node('small','',t.channel+' • '+new Date(t.at).toLocaleString('pt-BR')),node('strong','',t.message),node('p','',t.answer));
   list.append(box);
  }
  group.append(list,node('p','field-hint','A simulação usa o rascunho do workspace; se o modo for conversacional, a IA usa uma sessão de prévia do DSH. Isso não demonstra a instalação de um novo preset.'));
 }else if(i===5){
  const summary=node('div','summary-grid');
  summary.append(summaryItem('Objetivo',c.objective),summaryItem('Modo',({fixed:'Resposta fixa',echo:'Eco',instructed:'Conversacional'}[c.mode])),
    summaryItem('Comportamento',c.instructions||'Instruções não definidas'),summaryItem('Ferramentas',c.tools.join(', ')||'Nenhuma'),
    summaryItem('Testes realizados',String(model.tests.length)),
    summaryItem('Histórico de versões','r1 → r'+model.revision));
  group.append(summary);
  group.append(node('div','warning',model.kind==='new'
   ?'Este é um agente novo em rascunho. A instalação de um preset novo no DSH ainda NÃO é automatizada neste MVP; nenhuma publicação será realizada.'
   :'Este workspace é uma simulação isolada de evolução do Hello World. O preset ativo continua intacto. A publicação real só pode ser executada no editor técnico, com confirmação e verificação do DSH.'));
  const actions=node('div','inline-actions');
  const link=node('a','','Abrir editor técnico ↗');link.href='/';actions.append(link);
  const lab=node('a','','Conversar com o agente publicado ↗');lab.href='/lab';actions.append(lab);
  if(model.kind==='modify'){const hand=node('button','button primary','Enviar proposta ao editor para revisão →');hand.type='button';hand.addEventListener('click',sendToEditor);actions.append(hand);}
  group.append(actions);
 }
 $('backButton').textContent=i===0?'← Início':'← Etapa anterior';
 $('nextButton').textContent=i===5?'Concluir revisão ✓':'Salvar e continuar →';
 $('revisionBadge').textContent='Rascunho isolado • r'+model.revision;
 $('wizardTitle').textContent=model.config.name;
 $('wizardSubtitle').textContent=model.kind==='modify'?'Evolução do Hello World, sem aplicar mudanças no DSH':'Criação de um agente com workspace independente';
 $('wizardKind').textContent=model.kind==='modify'?'EVOLUÇÃO GUIADA':'CRIAÇÃO GUIADA';
 const track=$('stepTrack');track.replaceChildren();
 order.forEach((step,index)=>{
  const b=node('button','step-button'+(i===index?' active':'')+(model.completed.includes(step)?' done':''),undefined);
  b.type='button';b.setAttribute('aria-current',i===index?'step':'false');
  b.append(node('span','step-num',model.completed.includes(step)?'✓':'0'+(index+1)),node('span','step-name',['Objetivo','Comportamento','Ferramentas','Workspace','Testes','Revisão'][index]));
  b.disabled=false;
  b.addEventListener('click',async()=>{if(busy)return;await navigate(step)});
  track.append(b);
 });
 setHints(i);
}
function collectConfig(){
 const c={...model.config},i=order.indexOf(model.step);
 if(i===0){c.name=$('fName').value.trim();c.objective=$('fObjective').value.trim();}
 if(i===1){c.tone=$('fTone').value.trim();c.mode=$('fMode').value;c.instructions=$('fInstructions').value.trim();c.response=$('fResponse').value.trim();}
 if(i===2){c.tools=[...($('fCalculator').checked?['calculator']:[]),...($('fClock').checked?['clock']:[])];}
 if(i===4){c.testPrompt=$('fTest').value.trim();}
 return c;
}
async function saveCurrent(target,complete=true,requireCompletion=true){
 if(!model)return;
 const c=collectConfig(),currentIndex=order.indexOf(model.step);
 if(requireCompletion&&currentIndex===0&&(!c.name||!c.objective))throw Error('Informe o nome e o objetivo do agente antes de continuar.');
 if(requireCompletion&&currentIndex===1&&(!c.tone||!c.response))throw Error('Informe o tom e a resposta padrão.');
 if(requireCompletion&&currentIndex===4&&!c.testPrompt)throw Error('Preencha uma mensagem de teste.');
 model=await api('/api/builder/workspaces/'+model.id,'PATCH',{config:c,step:target,markComplete:complete,completedStep:model.step});
}
async function navigate(target){
 if(busy||!model)return;
 setBusy(true);
 try{
  const i=order.indexOf(model.step);
  // Can return to completed steps; do not skip prerequisites on first access.
  const targetIndex=order.indexOf(target);
  if(targetIndex>i+1&&!model.completed.includes(target))
   throw Error('Conclua as etapas anteriores antes de avançar.');
  await saveCurrent(target,false);
  renderFields();renderList();
 }catch(e){toast(e.message,true)}
 finally{setBusy(false)}
}
function renderList(){
 const list=$('workspaceList');list.replaceChildren();
 const recent=$('recentWorkspaces');if(recent)recent.replaceChildren();
 if(!workspaceList.length){list.append(node('p','aside-note','Nenhum agente criado ainda.'));return}
 for(const w of workspaceList){
  const btn=node('button','workspace-link'+(model?.id===w.id?' active':''));
  btn.type='button';btn.append(node('strong','',w.name),node('small','',w.source?'Evolução • r'+w.revision:'Novo agente • r'+w.revision));
  btn.addEventListener('click',()=>openWorkspace(w.id));
  list.append(btn);
  if(recent){
   const resume=node('button','recent-item');
   resume.type='button';
   resume.append(node('span','',w.source?'Evolução do Hello World':'Novo agente'),
     node('strong','',w.name),node('small','','r'+w.revision+' • '+({objetivo:'Objetivo',comportamento:'Comportamento',ferramentas:'Ferramentas',workspace:'Workspace',testes:'Testes',revisao:'Revisão'}[w.step]||'Rascunho')));
   resume.addEventListener('click',()=>openWorkspace(w.id));
   recent.append(resume);
  }
 }
}
async function listWorkspaces(){
 const data=await api('/api/builder/workspaces');
 workspaceList=data.items;renderList();
}
async function openWorkspace(id){
 if(busy)return;
 setBusy(true);
 try{
  if(model&&model.id!==id)await saveCurrent(model.step,false,false);
  model=await api('/api/builder/workspaces/'+id);
  history.replaceState({},'', '/builder?workspace='+encodeURIComponent(id));
  $('startScreen').classList.add('hidden');$('wizardScreen').classList.remove('hidden');
  $('coachMessages').replaceChildren();
  for(const entry of (model.guidance||[])){
   coachMessage(entry.question,'user');coachMessage(entry.advice,'architect');
  }
  renderFields();await listWorkspaces();
  document.querySelector('.page').scrollIntoView({block:'start'});
 }catch(e){toast(e.message,true)}
 finally{setBusy(false)}
}
async function create(kind){
 if(busy)return;
 setBusy(true);
 try{
  const created=await api('/api/builder/workspaces','POST',{kind,name:kind==='modify'?'Evolução do Hello World':'Meu novo agente'});
  await openWorkspaceAfterCreate(created);
 }catch(e){toast(e.message,true)}
 finally{setBusy(false)}
}
async function openWorkspaceAfterCreate(created){
 model=created;history.replaceState({},'','/builder?workspace='+encodeURIComponent(created.id));
 $('startScreen').classList.add('hidden');$('wizardScreen').classList.remove('hidden');
 $('coachMessages').replaceChildren();renderFields();await listWorkspaces();
}
async function sendToEditor(){
 if(busy||!model)return;
 setBusy(true);
 try{
  await saveCurrent('revisao',true);
  const ready=await api('/api/builder/workspaces/'+model.id+'/handoff','POST',{});
  toast('Proposta enviada para revisão; nada foi aplicado.');
  window.location.assign(ready.redirect);
 }catch(e){toast(e.message,true)}
 finally{setBusy(false)}
}
async function runTest(){
 if(busy)return;
 const message=$('fTest')?.value.trim();
 if(!message){toast('Escreva uma mensagem para testar.',true);return}
 setBusy(true);
 try{
  await saveCurrent('testes',false);
  const res=await api('/api/builder/workspaces/'+model.id+'/test','POST',{message});
  model=await api('/api/builder/workspaces/'+model.id);
  renderFields();
  toast('Simulação executada no rascunho. Agente publicado preservado.');
 }catch(e){toast(e.message,true)}
 finally{setBusy(false)}
}
function coachMessage(text,role){
 const e=node('div','coach-message '+role,text);$('coachMessages').append(e);
 $('coachMessages').scrollTop=$('coachMessages').scrollHeight;
}
async function askCoach(text){
 if(busy||!model||!text.trim())return;
 setBusy(true);coachMessage(text,'user');$('coachInput').value='';
 try{
  // Persist current answers before asking for context-specific advice.
  await saveCurrent(model.step,false,false);
  const answer=await api('/api/builder/workspaces/'+model.id+'/mentor','POST',{question:text});
  coachMessage(answer.advice,'architect');$('mentorConnection').dataset.online='true';
 }catch(e){coachMessage('Não consegui consultar o DSH: '+e.message,'architect');toast('Falha do orientador DSH.',true)}
 finally{setBusy(false)}
}
$('createChoice').addEventListener('click',()=>create('new'));
$('modifyChoice').addEventListener('click',()=>create('modify'));
$('startAnother').addEventListener('click',async()=>{
 if(!confirm('Voltar ao início para escolher um novo workspace? O atual continuará salvo.'))return;
 if(model){
  try{await saveCurrent(model.step,false,false)}
  catch(e){toast('Confira o rascunho antes de sair: '+e.message,true);return}
 }
 model=null;history.replaceState({},'','/builder');
 $('wizardScreen').classList.add('hidden');$('startScreen').classList.remove('hidden');renderList();
});
$('wizardForm').addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!model)return;
 const i=order.indexOf(model.step);
 setBusy(true);
 try{
  await saveCurrent(order[Math.min(i+1,5)],true);
  if(i===5)toast('Revisão concluída. Workspace preservado em rascunho.','success');
  renderFields();await listWorkspaces();
 }catch(err){toast(err.message,true)}
 finally{setBusy(false)}
});
$('backButton').addEventListener('click',async()=>{
 if(busy||!model)return;
 const i=order.indexOf(model.step);
 if(i===0){$('startAnother').click();return}
 await navigate(order[i-1]);
});
$('coachForm').addEventListener('submit',e=>{
 e.preventDefault();const prompt=$('coachInput').value.trim();if(prompt)askCoach(prompt);
});
(async()=>{
 try{
  const [status]=await Promise.all([api('/api/dsh/status'),listWorkspaces()]);
  const resume=new URLSearchParams(location.search).get('workspace');
  if(resume&&/^agent-[a-f0-9-]{36}$/.test(resume))await openWorkspace(resume);
  $('mentorConnection').dataset.online=String(status.connected);
  $('mentorConnection').lastChild.textContent=status.connected?' DSH conectado':' DSH indisponível';
 }catch(e){$('mentorConnection').dataset.online='false';$('mentorConnection').lastChild.textContent=' Conexão indisponível';toast(e.message,true)}
})();
