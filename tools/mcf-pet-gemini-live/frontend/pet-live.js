"use strict";
/* The existing Pet is the visual interface. Gemini Live runs within the
 * existing MESTRE Agent. Start/Stop are explicit, no wake word or tools.
 */
(() => {
  const $=id=>document.getElementById(id);
  const start=$("petLiveStart"),stop=$("petLiveStop"),test=$("petLiveTest");
  if(!start||!stop||!test)return;
  let active=false,ready=false,starting=false,stream=null,ctx=null,source=null;
  let worklet=null,silent=null,socket=null,timer=null,playback=null,lastStart=0;
  let sent=0,received=0,toolInvocations=0,proposalsCreated=0;
  const toolStatus=$("petLiveToolStatus");
  const toolsToggle=$("petLiveAllowTools");
  const proposalsToggle=$("petLiveAllowProposals");
  const backgroundToggle=$("petLiveBackgroundAudio");
  const backgroundStatus=$("petLiveBackgroundStatus");
  let microphonePausedForBackground=false;
  if(toolsToggle&&proposalsToggle){
    proposalsToggle.disabled=!toolsToggle.checked;
    toolsToggle.addEventListener("change",()=>{
      if(!toolsToggle.checked)proposalsToggle.checked=false;
      proposalsToggle.disabled=!toolsToggle.checked;
    });
  }
  const allowedState={idle:"● Desligado",starting:"◌ Conectando",listening:"● Ouvindo",
    thinking:"◌ Raciocinando",speaking:"● Falando",interrupted:"↪ Interrompido"};
  const $state=$("petLiveStatus");
  const playerTitle=$("petLiveAudioStatus");
  const transcript=$("petLiveTranscript");
  const controls=[$("petTalkMic"),$("petTalkSend")];
  function status(name,message) {
    $state.textContent=message||allowedState[name]||name;
    $state.dataset.state=name;
  }
  function syncBackgroundAudio(){
    if(!active)return;
    // A hidden tab keeps its established Gemini WebSocket. Without explicit
    // consent, microphone tracks are muted AND outgoing PCM is blocked.
    // Opt-in enables speaking/listening while using other tabs.
    const hidden=document.hidden===true;
    const backgroundConsent=backgroundToggle?.checked===true;
    const shouldCapture=!hidden||backgroundConsent;
    microphonePausedForBackground=!shouldCapture;
    for(const track of stream?.getAudioTracks?.()||[]){
      if(track.readyState==="live")track.enabled=shouldCapture;
    }
    if(backgroundStatus){
      backgroundStatus.dataset.state=hidden
        ? (shouldCapture?"background-on":"background-muted")
        : "foreground";
      backgroundStatus.textContent=hidden
        ? (shouldCapture
          ? "🎙 Live conectado em segundo plano · microfone ativo por sua escolha."
          : "🔇 Live conectado · microfone silenciado enquanto a aba está oculta.")
        : "● Live conectado · microfone ativo na aba visível.";
    }
    if(!hidden&&ctx?.state==="suspended"){
      // Browser may suspend AudioContext while the tab is hidden.
      ctx.resume().catch(()=>{});
    }
    if(hidden&&ready){
      status("listening",shouldCapture
        ? "● Live em segundo plano · microfone ativo"
        : "● Live conectado · microfone silenciado");
    }else if(!hidden&&ready){
      status("listening","● Live conectado · microfone ativo");
    }
  }
  function line(text,who) {
    if(!text||!text.trim())return;
    const node=document.createElement("p");
    const name=document.createElement("strong");
    name.textContent=who==="user"?"Você: ":"MESTRE: ";
    node.append(name,document.createTextNode(text.slice(0,550)));
    transcript.append(node);
    while(transcript.childElementCount>25)transcript.removeChild(transcript.firstChild);
    transcript.scrollTop=transcript.scrollHeight;
  }
  function setOtherButtons(disabled) {
    for(const control of controls)if(control)control.disabled=disabled;
  }
  function stateHint(state) {
    // Only fixed allowlisted state names are ever sent to the Pet.
    const valid=["ocioso","ouvindo","raciocinando","executando","concluido","erro"];
    if(!valid.includes(state))return;
    const auth=window.McfPetAuth;
    if(typeof auth?.request!=="function")return;
    auth.request("state",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({state}),cache:"no-store"
    }).catch(()=>{});
  }
  class PCMPlayback {
    constructor(context){
      this.ctx=context;
      this.queueAt=0;
      this.nodes=new Set();
      this.received=0;
      this.complete=false;
      this.drainTimer=null;
    }
    push(base64){
      if(typeof base64!=="string"||base64.length>3_000_000)return;
      let raw;
      try{raw=atob(base64)}catch(_){return}
      if(raw.length<2||raw.length%2)return;
      const samples=raw.length/2;
      if(samples>900_000)return;
      const buffer=this.ctx.createBuffer(1,samples,24000);
      const view=buffer.getChannelData(0);
      for(let i=0;i<samples;i++){
        const pcm=(raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8));
        view[i]=((pcm&0x8000)?pcm-65536:pcm)/32768;
      }
      const node=this.ctx.createBufferSource();
      node.buffer=buffer;
      node.connect(this.ctx.destination);
      const when=Math.max(this.ctx.currentTime+0.08,this.queueAt||0);
      node.start(when);
      this.queueAt=when+buffer.duration;
      this.nodes.add(node);
      node.onended=()=>{
        this.nodes.delete(node);
        try{node.disconnect()}catch(_){}
        if(this.complete&&!this.nodes.size&&active){
          status("listening");
          playerTitle.textContent="Pode falar novamente";
          stateHint("ouvindo");
        }
      };
      this.received++;
      this.complete=false;
      status("speaking");
      playerTitle.textContent="🔊 Voz Gemini Live";
      stateHint("executando");
    }
    finish(){this.complete=true}
    clear() {
      this.complete=false;
      for(const node of this.nodes) {
        try{node.stop()}catch(_){}
        try{node.disconnect()}catch(_){}
      }
      this.nodes.clear();
      this.queueAt=0;
    }
  }
  function encodePCM(samples,rate){
    if(!samples||samples.length<32||rate<8000)return null;
    const target=Math.max(1,Math.floor(samples.length*16000/rate));
    if(target>5500)return null;
    const bytes=new Uint8Array(target*2);
    for(let i=0;i<target;i++){
      const pos=i*rate/16000,low=Math.floor(pos),fraction=pos-low;
      const a=samples[low]||0,b=samples[Math.min(low+1,samples.length-1)]||0;
      const value=Math.round(Math.max(-1,Math.min(1,a*(1-fraction)+b*fraction))*32767);
      bytes[2*i]=value&255;
      bytes[2*i+1]=(value>>8)&255;
    }
    let binary="";
    for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  function micFrame(ev){
    if(!active||!ready||!socket||socket.readyState!==WebSocket.OPEN)return;
    if(microphonePausedForBackground)return;
    if(socket.bufferedAmount>350000)return; // bounded backpressure
    const frame=ev.data;
    const encoded=encodePCM(frame.samples,frame.rate);
    if(encoded&&encoded.length<=14500){
      socket.send(JSON.stringify({type:"audio",data:encoded}));
      sent++;
    }
  }
  function remoteURL(){
    const h=location.hostname.toLowerCase();
    if(h==="127.0.0.1"||h==="localhost"){
      return "ws://"+h+":8878/api/pet-live/ws";
    }
    if(h==="mcf-leo-n43sm.tail582305.ts.net"&&location.protocol==="https:"){
      return "wss://mcf-leo-n43sm.tail582305.ts.net:8466/api/pet-live/ws";
    }
    throw Error("Origem não autorizada para Gemini Live.");
  }
  function onMessage(raw){
    let message;
    try{message=JSON.parse(raw)}catch(_){return}
    if(!message||!active)return;
    switch(message.type){
      case "ready":
        ready=true;
        if(toolStatus){
          const proposed=message.tool_scope==="read_and_propose";
          const enabled=proposed||message.tool_scope==="read_only";
          toolStatus.textContent=proposed
            ? "📝 Consultas e propostas para revisão habilitadas. Nenhuma ação será executada."
            : enabled?"🔎 Consultas operacionais habilitadas: somente leitura"
            : "🔒 Ferramentas desligadas nesta conversa";
        }
        test.disabled=false;
        status("listening");
        syncBackgroundAudio();
        stateHint("ouvindo");
        $("petLiveModel").textContent=String(message.model||"Gemini Live");
        break;
      case "audio":
        received++;
        playback?.push(message.data);
        break;
      case "tool_started":
        if(toolStatus){
          const name=String(message.name||"").slice(0,55);
          toolStatus.textContent=name==="mcf_prepare_proposal"
            ? "📝 Salvando uma proposta para revisão…"
            : "🔎 Consultando "+name+"…";
        }
        break;
      case "tool_result":
        toolInvocations++;
        if(toolStatus){
          const name=String(message.name||"").slice(0,55);
          const drafted=name==="mcf_prepare_proposal";
          const label=message.ok===true
            ? (drafted?"rascunho salvo":"verificada")
            : "indisponível";
          const rid=String(message.receipt_id||"").slice(0,32);
          toolStatus.textContent=(drafted?"📝 ":"🔎 ")+name+": "+label+
            (rid?" · recibo "+rid:"");
          toolStatus.dataset.lastOutcome=message.ok===true?"pass":"fail";
        }
        break;
      case "proposal_created":
        proposalsCreated++;
        if(toolStatus)toolStatus.textContent="📝 Proposta salva para revisão: "+
          String(message.title||"").slice(0,100)+". Sem execução autorizada.";
        window.McfPetProposals?.refresh?.();
        break;
      case "user_text":
        line(message.text,"user");
        status("thinking");
        stateHint("raciocinando");
        break;
      case "assistant_text":line(message.text,"assistant");break;
      case "interrupted":
        playback?.clear();
        status("interrupted");
        stateHint("ouvindo");
        break;
      case "generation_complete":
      case "turn_complete":
        playback?.finish();
        if(!playback?.nodes?.size){status("listening");stateHint("ouvindo")}
        break;
      case "notice":
        playerTitle.textContent=String(message.message||"Aviso Gemini Live").slice(0,160);
        break;
      case "error":
        playerTitle.textContent=String(message.message||"Falha Gemini Live").slice(0,170);
        status("idle","● Falha de conexão");
        end(false);
        break;
      case "ended":
        if(active)end(false);
        break;
    }
  }
  async function begin(){
    if(active||starting)return;
    if(!window.AudioWorkletNode||!navigator.mediaDevices?.getUserMedia){
      status("idle","Microfone seguro e AudioWorklet requeridos (HTTPS ou localhost).");
      return;
    }
    starting=true;active=true;ready=false;
    start.disabled=true;stop.disabled=false;test.disabled=true;
    setOtherButtons(true);
    if(toolsToggle)toolsToggle.disabled=true;
    if(proposalsToggle)proposalsToggle.disabled=true;
    if(backgroundToggle)backgroundToggle.disabled=true;
    toolInvocations=0;
    proposalsCreated=0;
    if(toolStatus)toolStatus.textContent="Preparando conexão segura de leitura…";
    status("starting");
    try{
      // Audio context created during direct click, allowing autoplay on mobile.
      ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:"interactive"});
      await ctx.resume();
      playback=new PCMPlayback(ctx);
      stream=await navigator.mediaDevices.getUserMedia({
        audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      // A tab may become hidden during the permission prompt. Do not allow
      // audio capture/transmission while hidden unless the user opted in.
      syncBackgroundAudio();
      await ctx.audioWorklet.addModule("/pet-live-worklet.js");
      source=ctx.createMediaStreamSource(stream);
      worklet=new AudioWorkletNode(ctx,"mcf-pet-microphone");
      worklet.port.onmessage=micFrame;
      silent=ctx.createGain();
      silent.gain.value=0;
      source.connect(worklet);
      worklet.connect(silent);
      silent.connect(ctx.destination);
      const auth=window.McfPetAuth;
      if(typeof auth?.request!=="function")
        throw Error("A sessão protegida do Pet ainda não está pronta.");
      const toolScope=toolsToggle?.checked!==true?"conversation":
        proposalsToggle?.checked===true?"read_and_propose":"read_only";
      const response=await auth.request("live-ticket",{
        method:"POST",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({scope:toolScope})
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok){
        if(response.status===403)
          throw Error("Autenticação do Pet rejeitada. Reabra o painel para recuperar a sessão.");
        if(response.status===503)
          throw Error("Gateway Gemini Live indisponível. Utilize a conversa por turnos.");
        throw Error("Não foi possível validar a sessão Gemini Live.");
      }
      if(body.ready!==true||typeof body.ticket!=="string")
        throw Error("O gateway não retornou um ticket Live válido.");
      const choice=$("petLiveVoice").value;
      const voice=["Fenrir","Puck","Kore","Aoede","Zephyr"].includes(choice)?choice:"Fenrir";
      if(body.tool_scope!==toolScope ||
         body.tools_enabled!==(toolScope!=="conversation") ||
         body.proposal_drafts_enabled!==(toolScope==="read_and_propose"))
        throw Error("O ticket não confirmou a permissão solicitada.");
      socket=new WebSocket(remoteURL()+"?voice="+encodeURIComponent(voice)+
            "&scope="+encodeURIComponent(toolScope),
            ["mcf-pet-live","ticket."+body.ticket]);
      socket.onmessage=e=>onMessage(e.data);
      socket.onerror=()=>{if(active){status("idle","Falha na conexão Live");end(false)}};
      socket.onclose=()=>{if(active)end(false)};
      timer=setTimeout(()=>end(false),Math.min(body.seconds||300,300)*1000);
    }catch(err){
      status("idle",String(err.message||"Não foi possível iniciar Gemini Live.").slice(0,170));
      end(false);
    }finally{starting=false}
  }
  function end(announce=true){
    if(!active&&!socket&&!stream)return;
    active=false;ready=false;
    microphonePausedForBackground=false;
    clearTimeout(timer);timer=null;
    try{if(socket?.readyState===WebSocket.OPEN)
      socket.send(JSON.stringify({type:"stop"}))}catch(_){}
    try{socket?.close()}catch(_){}
    socket=null;
    playback?.clear();
    playback=null;
    if(worklet){worklet.port.onmessage=null;try{worklet.disconnect()}catch(_){}}
    try{source?.disconnect()}catch(_){}
    try{silent?.disconnect()}catch(_){}
    stream?.getTracks().forEach(track=>track.stop());
    stream=null;worklet=source=silent=null;
    if(ctx){ctx.close().catch(()=>{});ctx=null}
    start.disabled=false;stop.disabled=true;test.disabled=true;
    if(toolsToggle)toolsToggle.disabled=false;
    if(proposalsToggle)proposalsToggle.disabled=!toolsToggle?.checked;
    if(backgroundToggle){
      backgroundToggle.disabled=false;
      backgroundToggle.checked=false; // opt-in is ALWAYS per session
    }
    if(backgroundStatus){
      backgroundStatus.dataset.state="offline";
      backgroundStatus.textContent="● Sessão encerrada · sem captura de microfone.";
    }
    setOtherButtons(false);
    stateHint("ocioso");
    playerTitle.textContent="Áudio encerrado. O microfone foi desligado.";
    if(announce)status("idle","● Encerrado por você");
    else if($state.dataset.state!=="idle")status("idle","● Sessão encerrada");
  }
  start.addEventListener("click",begin);
  stop.addEventListener("click",()=>end(true));
  test.addEventListener("click",()=>{
    if(ready&&socket?.readyState===WebSocket.OPEN){
      socket.send(JSON.stringify({type:"text",
        text:"MESTRE, diga em português brasileiro: a conversa de voz do Pet está conectada."}));
      status("thinking","◌ Testando resposta ao vivo...");
    }
  });
  // Navigation/closing the page still stops capture and releases the socket.
  // Hiding the tab never calls end() or closes the WebSocket.
  window.addEventListener("pagehide",()=>end(false));
  document.addEventListener("visibilitychange",syncBackgroundAudio);
  window.McfPetLiveStatus=()=>({
    active,ready,pcmFramesSent:sent,pcmAudioChunks:received,
    toolInvocations,proposalsCreated,
    readOnlyToolsSelected:toolsToggle?.checked===true,
    proposalsSelected:proposalsToggle?.checked===true,
    backgroundAudioConsented:backgroundToggle?.checked===true,
    microphonePausedForBackground,
    microphoneTrackEnabled:stream?.getAudioTracks?.()[0]?.enabled??false,
    visibilityState:document.visibilityState
  });
})();
