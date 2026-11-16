'use strict';
const $=id=>document.getElementById(id);
const f0tel=(kind,details={})=>window.MCFLiveTelemetry?.record(kind,details);
const MODEL_25='gemini-2.5-flash-native-audio-preview-12-2025';
const MODEL_38='gemini-3.8-live';
const MODEL_EXT='gemini-3.8-live-extended-thinking';
const WS='wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=';
const state={socket:null,connected:false,connecting:false,wantConnected:false,micStream:null,micCtx:null,micNode:null,micSource:null,cameraStream:null,screenStream:null,frameTimer:null,frameSource:null,audioCtx:null,nextPlay:0,sources:new Set(),muted:false,micRms:0,started:0,timer:null,events:[],transcript:[],tools:0,tokens:0,notes:[],resumeHandle:null,retries:0,pendingMic:false};
const ui={model:$('model'),btn:$('connect'),stop:$('disconnect'),mic:$('mic'),camera:$('camera'),screen:$('screen'),mute:$('mute'),msg:$('messages')};
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),3600);}
function log(type,detail){const e={at:new Date().toISOString(),type,detail:String(detail)};state.events.push(e);if(state.events.length>2000)state.events.shift();const div=document.createElement('div');div.className='event';const t=document.createElement('time');t.textContent=new Date(e.at).toLocaleTimeString('pt-BR');const strong=document.createElement('strong');strong.textContent=type;const s=document.createElement('span');s.textContent=e.detail;div.append(t,strong,s);$('events').prepend(div);while($('events').children.length>450)$('events').lastElementChild.remove();}
function bubble(role,text){if(!text?.trim())return;const welcome=ui.msg.querySelector('.welcome');if(welcome)welcome.remove();const div=document.createElement('div');div.className='bubble '+role;const who=document.createElement('span');who.className='who';who.textContent=role==='user'?'VOCÊ':role==='model'?'GEMINI':'SISTEMA';div.append(who,document.createTextNode(text.trim()));ui.msg.append(div);ui.msg.scrollTop=ui.msg.scrollHeight;state.transcript.push({at:new Date().toISOString(),role,text:text.trim()});}
function status(text,color){const s=$('connectionStatus');s.replaceChildren();const dot=document.createElement('i');dot.className='dot '+color;s.append(dot,document.createTextNode(text));$('orbStatus').textContent=text;$('metricSession').textContent=text.toUpperCase();$('voiceOrb').classList.toggle('active',color==='green');}
function setButtons(ready){state.connected=ready;ui.btn.disabled=ready||state.connecting;ui.stop.disabled=!ready&&!state.connecting;for(const el of [ui.mic,ui.camera,ui.screen,ui.mute,$('send'),$('uploadImage')])el.disabled=!ready;ui.model.disabled=ready||state.connecting;updateStreamMetrics();}
function updateStreamMetrics(){const n=Number(!!state.micStream)+Number(!!state.cameraStream)+Number(!!state.screenStream);$('metricStreams').textContent=n+' / 3';for(const [el,on] of [[ui.mic,!!state.micStream],[ui.camera,!!state.cameraStream],[ui.screen,!!state.screenStream],[ui.mute,state.muted]]){el.classList.toggle('on',on);el.querySelector('small').textContent=el===ui.mute?(on?'OFF':'ON'):(on?'ON':'OFF');}}
function send(data){if(!state.socket||state.socket.readyState!==WebSocket.OPEN||!state.connected)return false;if(state.socket.bufferedAmount>1200000){log('REDE','Buffer cheio: um frame de mídia foi descartado.');return false;}state.socket.send(JSON.stringify(data));return true;}
function bytesToBase64(bytes){let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str);}
function base64ToBytes(b64){const raw=atob(b64);const arr=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i);return arr;}
async function api(url,method='GET',body){const r=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'});let data;try{data=await r.json();}catch{data={};}if(!r.ok)throw Error(data.error||'Falha HTTP '+r.status);return data;}
async function refreshKey(){try{const result=await api('/api/status');const configured=result.configured;$('keyChip').innerHTML=configured?'<i class="dot green"></i> API configurada':'<i class="dot amber"></i> API não configurada';$('keyState').textContent=configured?'● Chave cadastrada e protegida no backend local':'○ Nenhuma chave API cadastrada';}catch(e){$('keyState').textContent='Servidor indisponível: '+e.message;}}
function openKey(){$('keyFeedback').textContent='';$('apiKey').value='';$('keyDialog').showModal();$('apiKey').focus();}
for(const id of ['keyButton','openKeySide','openKeySettings'])$(id).addEventListener('click',openKey);
$('closeKey').onclick=()=>$('keyDialog').close();
$('toggleSecret').onclick=()=>$('apiKey').type=$('apiKey').type==='password'?'text':'password';
$('keyForm').onsubmit=async ev=>{ev.preventDefault();$('saveKey').disabled=true;$('keyFeedback').textContent='Validando com o Google...';try{await api('/api/key','POST',{key:$('apiKey').value.trim()});$('apiKey').value='';$('keyDialog').close();await refreshKey();toast('Chave validada e salva localmente.');log('SEGURANÇA','Chave validada e configurada (valor oculto).');}catch(e){$('keyFeedback').textContent=e.message;log('ERRO','Falha na validação da chave: '+e.message);}finally{$('saveKey').disabled=false;}};
$('deleteKey').onclick=async()=>{if(!confirm('Remover a chave API salva neste computador?'))return;await api('/api/key','DELETE');await refreshKey();toast('Chave removida.');};
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+b.dataset.view));$('crumb').textContent=b.textContent.trim().toUpperCase();});
function modelChanged(){const m=ui.model.value,is25=m===MODEL_25,is38=m===MODEL_38;$('affective').disabled=!is25;$('proactive').disabled=!is25;$('proactiveHint').textContent=is25?'Opcional no Gemini 2.5':'Ativo internamente no Gemini 3.8; não configurável';$('affectiveHint').textContent=is25?'Exclusivo do Gemini 2.5 Flash Live':'Não disponível neste modelo';$('thinking').disabled=is38;$('thinkingHint').textContent=is25?'Orçamento de pensamento em tokens':is38?'Modelo de baixa latência: ajuste indisponível':'Pensamento estendido configurável';$('modelHint').textContent=is25?'Native audio · diálogo afetivo · proatividade':is38?'Native audio · baixa latência':'Native audio · raciocínio em segundo plano';}
ui.model.onchange=modelChanged;modelChanged();
$('silence').oninput=()=>$('silenceValue').textContent=$('silence').value;
function setupConfig(){
 const model=ui.model.value,is25=model===MODEL_25,isExt=model===MODEL_EXT;
 const setup={model:'models/'+model,generationConfig:{responseModalities:['AUDIO']},systemInstruction:{parts:[{text:'Você é um agente de IA de laboratório multimodal. Converse prioritariamente em português brasileiro, com clareza. Seja rigoroso sobre ferramentas disponíveis: hora local, notas locais na sessão, estado da sessão; nunca alegue acesso a funções não implementadas. Se houver câmera ou compartilhamento de tela, comente apenas o que de fato receber. Respeite o controle do usuário sobre dados e dispositivos.'}]},realtimeInputConfig:{automaticActivityDetection:{disabled:!$('vad').checked,silenceDurationMs:Number($('silence').value)}}};
 setup.generationConfig.speechConfig={voiceConfig:{prebuiltVoiceConfig:{voiceName:$('voice').value}}};
 if($('transIn').checked)setup.inputAudioTranscription={};
 if($('transOut').checked)setup.outputAudioTranscription={};
 if(is25){if($('affective').checked)setup.generationConfig.enableAffectiveDialog=true;if($('proactive').checked)setup.proactivity={proactiveAudio:true};if($('thinking').value!=='default')setup.generationConfig.thinkingConfig={thinkingBudget:{low:512,medium:1024,high:2048}[$('thinking').value]};}
 if(isExt)setup.generationConfig.thinkingConfig={thinkingLevel:$('thinking').value==='default'?'LOW':$('thinking').value.toUpperCase(),includeThoughts:true};
 const tools=[];if($('tools').checked)tools.push({functionDeclarations:[{name:'get_current_time',description:'Obter data e hora local atuais do navegador do usuário, sem acesso a arquivos.'},{name:'remember_session_note',description:'Guardar uma nota de texto somente em memória da sessão atual.',parameters:{type:'OBJECT',properties:{note:{type:'STRING',description:'Texto da nota'}},required:['note']}},{name:'list_session_notes',description:'Consultar notas guardadas apenas na sessão atual.'},{name:'get_session_state',description:'Consultar os recursos ativos do Gemini Live Studio'}]});
 if($('grounding').checked)tools.push({googleSearch:{}});
 if(tools.length)setup.tools=tools;
 if($('compression').checked)setup.contextWindowCompression={slidingWindow:{}};
 if($('resumption').checked)setup.sessionResumption=state.resumeHandle?{handle:state.resumeHandle}:{};
 return setup;
}
async function connect(retry=false){
 if(state.connecting||state.connected)return;
 if(!retry){state.wantConnected=true;state.retries=0;state.resumeHandle=null;}
 state.f0ConnectAt=performance.now();f0tel('connect_attempt',{model:ui.model.value});state.connecting=true;setButtons(false);status(retry?'Reconectando...':'Autenticando...','amber');$('orbSub').textContent='Solicitando token temporário';
 try{
  const {token}=await api('/api/token','POST');
  if(!state.wantConnected)return;
  const ws=new WebSocket(WS+encodeURIComponent(token));state.socket=ws;
  ws.onopen=()=>{if(!state.wantConnected){ws.close();return;}status('Negociando sessão...','amber');ws.send(JSON.stringify({setup:setupConfig()}));log('CONEXÃO','WebSocket seguro aberto · '+ui.model.value);f0tel('ws_open',{elapsed_ms:performance.now()-state.f0ConnectAt});};
  ws.binaryType='arraybuffer';ws.onmessage=async e=>{try{const raw=typeof e.data==='string'?e.data:e.data instanceof Blob?await e.data.text():new TextDecoder().decode(e.data);handleMessage(JSON.parse(raw));}catch(err){log('ERRO','Evento inválido: '+err.message);}};
  ws.onerror=()=>log('ERRO','Erro na conexão WebSocket (verifique rede/chave/modelo).');
  ws.onclose=e=>{if(state.socket!==ws)return;state.socket=null;state.connecting=false;state.connected=false;setButtons(false);clearPlay();log('CONEXÃO','Socket encerrado: '+e.code+' '+(e.reason||''));f0tel('disconnect',{code:e.code});if(state.wantConnected&&$('resumption').checked&&state.resumeHandle&&state.retries<3){state.retries++;status('Retomando sessão...','amber');setTimeout(()=>connect(true),1000+state.retries*400);}else{state.wantConnected=false;status('Desconectado','gray');$('orbSub').textContent='Inicie uma nova sessão';stopMic();stopCamera();stopScreen();}};
 }catch(e){state.connecting=false;state.wantConnected=false;setButtons(false);status('Falha na conexão','amber');$('orbSub').textContent='Confira credenciais e cota';log('ERRO',e.message);toast(e.message);if(/chave|Cadastre/i.test(e.message))openKey();}
}
function handleMessage(msg){
 if(msg.setupComplete){f0tel('setup_complete',{latency_ms:performance.now()-state.f0ConnectAt});state.connecting=false;state.connected=true;state.retries=0;setButtons(true);status('Sessão ao vivo','green');$('orbSub').textContent='Interaja por voz, texto ou imagem';if(!state.started)state.started=Date.now();log('SESSÃO','Configuração aceita · '+ui.model.value);return;}
 const update=msg.sessionResumptionUpdate;if(update?.newHandle||update?.token)state.resumeHandle=update.newHandle||update.token;
 if(msg.goAway)log('SESSÃO','Servidor solicitou reconexão em breve.');
 if(msg.usageMetadata){state.tokens=msg.usageMetadata.totalTokenCount??state.tokens;$('metricTokens').textContent=Number(state.tokens).toLocaleString('pt-BR');f0tel('tokens',{total_tokens:Number(state.tokens)});}
 if(msg.toolCall)handleTools(msg.toolCall);
 if(msg.toolCallCancellation)log('FERRAMENTA','Chamadas canceladas pelo modelo.');
 if(msg.serverContent){
  const content=msg.serverContent;
  if(content.interrupted){clearPlay();log('ÁUDIO','Resposta interrompida pelo usuário.');}
  if(content.inputTranscription?.text)bubble('user',content.inputTranscription.text);
  if(content.outputTranscription?.text)bubble('model',content.outputTranscription.text);
  for(const part of content.modelTurn?.parts||[]){if(part.inlineData?.data)playAudio(part.inlineData.data);if(part.text)bubble('model',part.text);}
  if(content.turnComplete)log('SESSÃO','Turno concluído.');
 }
 if(msg.error)log('ERRO',JSON.stringify(msg.error));
}
function handleTools(call){const results=[];for(const c of call.functionCalls||[]){let response;try{switch(c.name){
 case 'get_current_time':response={localTime:new Date().toLocaleString('pt-BR'),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone};break;
 case 'remember_session_note':{const note=String(c.args?.note||'').slice(0,1200);if(!note)throw Error('Nota vazia');state.notes.push(note);response={saved:true,index:state.notes.length};break;}
 case 'list_session_notes':response={notes:state.notes.slice(-50)};break;
 case 'get_session_state':response={model:ui.model.value,microphone:!!state.micStream,camera:!!state.cameraStream,screen:!!state.screenStream,notes:state.notes.length};break;
 default:response={error:'Função não autorizada nesta aplicação.'};
 }}catch(e){response={error:e.message};}state.tools++;f0tel('tool_call',{count:1});$('metricTools').textContent=String(state.tools);log('FERRAMENTA',c.name+' → '+JSON.stringify(response).slice(0,350));results.push({id:c.id,name:c.name,response});}if(results.length)send({toolResponse:{functionResponses:results}});}
function playAudio(base64){
 if(state.f0LastPromptAt){f0tel('first_audio',{latency_ms:performance.now()-state.f0LastPromptAt});state.f0LastPromptAt=null;}
 if(state.muted)return;
 try{if(!state.audioCtx)state.audioCtx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:24000});const ctx=state.audioCtx;ctx.resume().catch(()=>{});const b=base64ToBytes(base64);const frames=Math.floor(b.length/2);if(!frames)return;const buffer=ctx.createBuffer(1,frames,24000),dst=buffer.getChannelData(0);const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);for(let i=0;i<frames;i++)dst[i]=dv.getInt16(i*2,true)/32768;const source=ctx.createBufferSource();source.buffer=buffer;source.connect(ctx.destination);const t=Math.max(ctx.currentTime+.035,state.nextPlay);source.start(t);state.nextPlay=t+buffer.duration;state.sources.add(source);source.onended=()=>state.sources.delete(source);}catch(e){log('ERRO','Reprodução: '+e.message);}
}
function clearPlay(){for(const s of state.sources)try{s.stop();}catch{}state.sources.clear();state.nextPlay=0;}
function downsample(input,inputRate,outputRate){const ratio=inputRate/outputRate,n=Math.floor(input.length/ratio),out=new Int16Array(n);for(let i=0;i<n;i++){const start=Math.floor(i*ratio),end=Math.min(input.length,Math.floor((i+1)*ratio));let sum=0;for(let j=start;j<end;j++)sum+=input[j];const x=Math.max(-1,Math.min(1,sum/Math.max(1,end-start)));out[i]=x<0?x*32768:x*32767;}return new Uint8Array(out.buffer);}
async function startMic(){
 if(!state.connected)return toast('Inicie uma sessão primeiro.');
 try{await state.audioCtx?.resume();const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});state.micStream=stream;const ctx=new AudioContext();state.micCtx=ctx;const source=ctx.createMediaStreamSource(stream);const proc=ctx.createScriptProcessor(4096,1,1);state.micSource=source;state.micNode=proc;source.connect(proc);proc.connect(ctx.destination);if(!$('vad').checked)send({realtimeInput:{activityStart:{}}});
 proc.onaudioprocess=ev=>{if(!state.connected)return;const input=ev.inputBuffer.getChannelData(0);let sum=0;for(const n of input)sum+=n*n;state.micRms=Math.sqrt(sum/input.length);const pcm=downsample(input,ctx.sampleRate,16000);send({realtimeInput:{audio:{mimeType:'audio/pcm;rate=16000',data:bytesToBase64(pcm)}}});for(const out of ev.outputBuffer.getChannelData(0).keys())ev.outputBuffer.getChannelData(0)[out]=0;};
 stream.getTracks().forEach(t=>t.onended=()=>stopMic());updateStreamMetrics();log('MÍDIA','Microfone conectado · PCM 16kHz');}catch(e){log('ERRO','Microfone: '+e.message);toast('Microfone: '+e.message);stopMic();}
}
function stopMic(){if(state.micStream&&state.connected)send({realtimeInput:$('vad').checked?{audioStreamEnd:true}:{activityEnd:{}}});if(state.micNode){state.micNode.disconnect();state.micNode.onaudioprocess=null;}state.micSource?.disconnect();state.micStream?.getTracks().forEach(t=>t.stop());state.micCtx?.close().catch(()=>{});state.micStream=null;state.micNode=null;state.micSource=null;state.micCtx=null;state.micRms=0;updateStreamMetrics();}
const frameCanvas=document.createElement('canvas');frameCanvas.width=640;frameCanvas.height=360;const frameCtx=frameCanvas.getContext('2d');
function videoFrame(){if(!state.connected||!state.frameSource||state.frameSource.readyState<2)return;try{frameCtx.drawImage(state.frameSource,0,0,640,360);const jpg=frameCanvas.toDataURL('image/jpeg',.62).split(',')[1];send({realtimeInput:{video:{mimeType:'image/jpeg',data:jpg}}});}catch(e){log('ERRO','Frame: '+e.message);}}
function selectVideo(){const stream=state.screenStream||state.cameraStream;if(!stream){clearInterval(state.frameTimer);state.frameTimer=null;state.frameSource=null;$('mediaFrame').hidden=true;return;}$('preview').srcObject=stream;state.frameSource=$('preview');$('mediaFrame').hidden=false;$('mediaLabel').textContent=state.screenStream?'TELA':'CÂMERA';if(!state.frameTimer)state.frameTimer=setInterval(videoFrame,1000);}
async function startCamera(){if(!state.connected)return;try{const stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720}},audio:false});state.cameraStream=stream;stream.getTracks().forEach(t=>t.onended=stopCamera);selectVideo();updateStreamMetrics();log('MÍDIA','Câmera ativada · JPEG 1 frame/s');}catch(e){log('ERRO','Câmera: '+e.message);toast('Câmera: '+e.message);}}
function stopCamera(){state.cameraStream?.getTracks().forEach(t=>t.stop());state.cameraStream=null;selectVideo();updateStreamMetrics();}
async function startScreen(){if(!state.connected)return;try{const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:1},audio:false});state.screenStream=stream;stream.getTracks().forEach(t=>t.onended=stopScreen);selectVideo();updateStreamMetrics();log('MÍDIA','Compartilhamento de tela ativado · JPEG 1 frame/s');}catch(e){log('ERRO','Tela: '+e.message);toast('Tela: '+e.message);}}
function stopScreen(){state.screenStream?.getTracks().forEach(t=>t.stop());state.screenStream=null;selectVideo();updateStreamMetrics();}
function disconnect(){state.wantConnected=false;state.connected=false;state.connecting=false;state.resumeHandle=null;state.started=0;stopMic();stopCamera();stopScreen();clearPlay();state.socket?.close(1000,'Encerrado pelo usuário');state.socket=null;setButtons(false);status('Desconectado','gray');$('orbSub').textContent='Inicie uma nova sessão';log('SESSÃO','Sessão encerrada pelo usuário.');}
ui.btn.onclick=()=>connect(false);ui.stop.onclick=disconnect;ui.mic.onclick=()=>state.micStream?stopMic():startMic();ui.camera.onclick=()=>state.cameraStream?stopCamera():startCamera();ui.screen.onclick=()=>state.screenStream?stopScreen():startScreen();ui.mute.onclick=()=>{state.muted=!state.muted;if(state.muted)clearPlay();updateStreamMetrics();};
function sendPrompt(text){const clean=String(text||'').trim();if(!clean)return;if(!state.connected)return toast('Inicie uma sessão.');if(!send({clientContent:{turns:[{role:'user',parts:[{text:clean}]}],turnComplete:true}}))return toast('Não foi possível enviar.');state.f0LastPromptAt=performance.now();f0tel('text_sent',{bytes:clean.length});bubble('user',clean);$('prompt').value='';log('TEXTO','Mensagem enviada ('+clean.length+' caracteres)');}
$('uploadImage').onclick=()=>$('imageFile').click();
$('imageFile').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;if(!state.connected)return toast('Inicie uma sessão primeiro.');if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>12*1024*1024)return toast('Escolha uma imagem PNG, JPEG ou WebP de até 12 MB.');try{const blobURL=URL.createObjectURL(f);const img=new Image();await new Promise((ok,fail)=>{img.onload=ok;img.onerror=fail;img.src=blobURL;});URL.revokeObjectURL(blobURL);const scale=Math.min(1,1024/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);const data=c.toDataURL('image/jpeg',.77).split(',')[1];const prompt='Analise esta imagem enviada pelo usuário.';if(send({clientContent:{turns:[{role:'user',parts:[{inlineData:{mimeType:'image/jpeg',data}},{text:prompt}]}],turnComplete:true}})){bubble('user','[Imagem: '+f.name+'] '+prompt);log('IMAGEM','Arquivo enviado: '+f.name+' ('+c.width+'x'+c.height+')');}else toast('Falha ao enviar imagem.');}catch(err){toast('Não foi possível ler a imagem.');log('ERRO',err.message);}};
$('send').onclick=()=>sendPrompt($('prompt').value);$('prompt').onkeydown=e=>{if(e.key==='Enter')sendPrompt(e.target.value);};document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{document.querySelector('[data-view="live"]').click();sendPrompt(b.dataset.prompt);});
$('clearChat').onclick=()=>{ui.msg.replaceChildren();state.transcript=[];log('UI','Histórico visual limpo.');};
$('clearEvents').onclick=()=>{$('events').replaceChildren();state.events=[];};
$('export').onclick=()=>{const exportData={generatedAt:new Date().toISOString(),model:ui.model.value,events:state.events,transcript:state.transcript,tools:state.tools,usageTokens:state.tokens,notes:state.notes,telemetry:window.MCFLiveTelemetry?.snapshot()};const blob=new Blob([JSON.stringify(exportData,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='gemini-live-session-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);};
const canvas=$('visualizer'),vctx=canvas.getContext('2d');function visualize(){const w=canvas.width,h=canvas.height;vctx.clearRect(0,0,w,h);const level=state.micStream?Math.min(.9,state.micRms*8):state.sources.size?.24:.05;for(let x=0;x<w;x+=6){const ripple=Math.pow(Math.sin(x*.027+Date.now()*.002),2);const side=Math.pow(Math.max(0,1-Math.abs(x-w/2)/(w/2)),1.4);const height=3+(level*38+4)*side*ripple;vctx.fillStyle='rgba(182,158,248,'+(.25+side*.65)+')';vctx.fillRect(x,h/2-height/2,3,height);}requestAnimationFrame(visualize);}visualize();
setInterval(()=>{if(state.started&&state.wantConnected){const sec=Math.floor((Date.now()-state.started)/1000);$('sessionTimer').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}else $('sessionTimer').textContent='00:00';},1000);
window.addEventListener('beforeunload',()=>{state.wantConnected=false;state.socket?.close();stopMic();stopCamera();stopScreen();});
refreshKey();status('Desconectado','gray');log('SISTEMA','Gemini Live Studio pronto. Nenhuma mídia é capturada até solicitação do usuário.');
