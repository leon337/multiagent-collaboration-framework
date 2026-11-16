"use strict";
/* MCF Pet Conversacional: push-to-talk, user-initiated chat and local TTS.
 * No auto recording, tool execution, mission writes, or hidden audio capture. */
(() => {
  const $ = id => document.getElementById(id);
  const path = "/api/pet-voice/";
  let csrf = "";
  let sessionExpiresAt = 0;
  let sessionRefresh = null;
  window.McfPetAuth = Object.freeze({getCsrf: () => csrf});

  // The server issues sessions valid for one hour. A page may outlive this
  // interval or the server can restart and lose its in-memory session map.
  // Refresh only on demand; no background recording, no auth bypass.
  async function renewSession() {
    if (sessionRefresh) return sessionRefresh;
    sessionRefresh = (async () => {
      const response = await fetch(path + "session", {
        method: "GET", credentials: "same-origin", cache: "no-store"
      });
      if (!response.ok) throw new Error("Não foi possível renovar a sessão segura.");
      const data = await response.json();
      if (typeof data.csrf !== "string" || data.csrf.length < 24) {
        throw new Error("O servidor retornou uma sessão inválida.");
      }
      csrf = data.csrf;
      const lifetime = Number(data.expires_in);
      const seconds = Number.isFinite(lifetime) && lifetime > 60 ? lifetime : 3600;
      sessionExpiresAt = Date.now() + seconds * 1000;
      return data;
    })();
    try {
      return await sessionRefresh;
    } catch (err) {
      csrf = "";
      sessionExpiresAt = 0;
      throw err;
    } finally {
      sessionRefresh = null;
    }
  }

  async function authenticatedFetch(endpoint, options) {
    // Renew shortly before expiry; this also covers suspended browser tabs.
    if (!csrf || Date.now() + 30_000 >= sessionExpiresAt) {
      await renewSession();
    }
    const submit = () => fetch(path + endpoint, {
      ...options,
      credentials: "same-origin",
      headers: {...options.headers, "X-MCF-Pet-CSRF": csrf}
    });
    const first = await submit();
    if (first.status !== 403) return first;
    // Only INVALID_SESSION confirms the server rejected the request before
    // processing its body. Other 403 responses must never be retried.
    const problem = await first.clone().json().catch(() => ({}));
    if (problem?.error !== "INVALID_SESSION") return first;
    await renewSession();
    // Reuse the same Blob / request_id. Never retry network timeouts or 5xx.
    return submit();
  }
  let recording = null;
  let busy = false;
  let audioUrl = null;
  let recordingTimeout = null;

  function note(message, level = "info") {
    const el = $("petTalkStatus");
    el.textContent = message;
    el.dataset.level = level;
  }
  function safeHTMLNode(tag, cls, value) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    node.textContent = value;
    return node;
  }
  function appendMessage(role, content) {
    const log = $("petTalkLog");
    const entry = safeHTMLNode("div", "pet-talk-entry " + (role === "user" ? "from-user" : "from-mestre"), "");
    entry.appendChild(safeHTMLNode("strong", "", role === "user" ? "Você" : "MESTRE"));
    entry.appendChild(safeHTMLNode("p", "", content));
    log.appendChild(entry);
    while (log.children.length > 10) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
  }
  function setBusy(value) {
    busy = value;
    $("petTalkSend").disabled = value || !csrf;
    $("petTalkMic").disabled = value || !csrf;
    $("petTalkText").disabled = value;
  }
  function setState(name) {
    if (!csrf) return Promise.resolve();
    return authenticatedFetch("state", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({state:name}),
      cache: "no-store"
    }).catch(() => {});
  }
  async function connect() {
    try {
      await renewSession();
      const status = await fetch(path + "status", {cache:"no-store"});
      const info = status.ok ? await status.json() : {};
      const good = info.chat_configured === true;
      $("petTalkReady").textContent = good ? "Chat MESTRE disponível" : "MESTRE sem chave de chat ativa";
      $("petTalkReady").className = "tag " + (good ? "ok" : "warn");
      $("petVoiceHubChoice").disabled = info.voicehub_dispatcher_available !== true;
      if (info.voicehub_dispatcher_available !== true) {
        $("petVoiceHubChoice").textContent = "VoiceHub (despachante indisponível)";
      }
      note(good ? "Pronto. Digite uma mensagem ou toque no microfone." :
        "A transcrição local pode funcionar, mas o chat do MESTRE precisa de credencial configurada.",good?"info":"warn");
      setBusy(false);
    } catch (_) {
      csrf = "";
      $("petTalkReady").textContent = "Conexão indisponível";
      $("petTalkReady").className = "tag bad";
      note("Não foi possível inicializar a sessão local. Recarregue o painel.", "error");
      setBusy(false);
    }
  }
  async function jsonPost(endpoint, payload, timeout = 110_000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await authenticatedFetch(endpoint, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload),
        signal:controller.signal,
        cache:"no-store"
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || data.error || "A operação falhou.");
      return data;
    } finally { clearTimeout(timer); }
  }
  function resetPlayer() {
    const audio = $("petTalkPlayer");
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audio.hidden = true;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = null;
  }
  async function speak(text) {
    if (!$("petTalkSpeak").checked) {
      note("Resposta recebida em texto. A leitura em voz está desativada.");
      setTimeout(() => {setState("ocioso");}, 1800);
      return;
    }
    const mode = $("petTalkVoiceMode").value;
    const voice = $("petTalkVoice").value;
    note(mode === "voicehub" ? "Enviando ao VoiceHub…" : "Gerando voz local em português…");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 67_000);
    try {
      const response = await authenticatedFetch("speak",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({text:text.slice(0,880),mode,voice}),
        signal:controller.signal,cache:"no-store"
      });
      if (mode === "voicehub") {
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.message || "VoiceHub indisponível.");
        note("Resposta encaminhada à fila do VoiceHub. Reprodução não confirmada.");
        setTimeout(() => setState("ocioso"), 1600);
        return;
      }
      if(!response.ok || !(response.headers.get("Content-Type")||"").startsWith("audio/wav")){
        const err=await response.json().catch(()=>({}));
        throw new Error(err.message || "A voz local não respondeu.");
      }
      const blob=await response.blob();
      if(blob.size>3_500_000 || blob.size<500)throw new Error("Áudio fora dos limites.");
      resetPlayer();
      const player=$("petTalkPlayer");
      audioUrl=URL.createObjectURL(blob);
      player.src=audioUrl;
      player.hidden=false;
      player.onended=()=>{note("Conversa concluída.");setState("ocioso");};
      try {
        await player.play();
        note("🔊 MESTRE está falando pelo navegador.");
      } catch (_) {
        note("Áudio pronto. Clique em ▶ para ouvir a resposta.", "warn");
        setState("concluido");
      }
    } catch (err) {
      note("Resposta em texto disponível. Voz: "+(err.message||"serviço indisponível"),"warn");
      setState("erro");
    } finally {
      clearTimeout(timer);
    }
  }
  async function send(text) {
    if (!csrf || busy || recording) return;
    const message=String(text||"").trim();
    if (!message || message.length>700) {
      note("Escreva uma mensagem de 1 a 700 caracteres.", "warn");
      return;
    }
    resetPlayer();
    setBusy(true);
    appendMessage("user",message);
    $("petTalkText").value="";
    note("MESTRE está preparando a resposta…");
    await setState("raciocinando");
    const requestId=crypto.randomUUID();
    try {
      const response=await jsonPost("chat", {text:message,request_id:requestId});
      appendMessage("assistant",response.reply);
      if (response.fallback === true) note("Resposta produzida pelo modelo de contingência.");
      await speak(response.reply);
    } catch (err) {
      const message=err.name === "AbortError" ?
        "A consulta excedeu o tempo. Não reenvie imediatamente: a resposta pode ainda estar sendo processada." :
        (err.message || "Erro de comunicação.");
      note(message,"error");
      appendMessage("assistant","Não foi possível confirmar uma resposta. "+message);
      await setState("erro");
    } finally {
      setBusy(false);
      $("petTalkText").focus();
    }
  }

  function stopRecording() {
    if (!recording) return;
    const item=recording;
    clearTimeout(recordingTimeout);
    if(item.recorder.state==="recording")item.recorder.stop();
    $("petTalkMic").textContent="🎙 Falar";
    note("Processando a gravação local…");
  }
  async function transcribe(blob, mime) {
    if(!csrf || blob.size>4_500_000 || blob.size<500) {
      note("Áudio inválido ou muito longo. Tente falar por menos tempo.","warn");
      await setState("erro");
      return;
    }
    setBusy(true);
    note("Transcrevendo sua voz localmente (Vosk PT-BR)…");
    await setState("raciocinando");
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),36_000);
    try {
      const res=await authenticatedFetch("stt",{
        method:"POST",
        headers:{"Content-Type":mime.split(";",1)[0]},
        body:blob,signal:controller.signal,cache:"no-store"
      });
      const payload=await res.json();
      if(!res.ok || !payload.ok)throw new Error(payload.message||"Transcrição não reconhecida.");
      const recognized=String(payload.text||"").trim();
      if (!recognized) {
        note("Não reconheci palavras. Tente novamente mais próximo do microfone.","warn");
        setState("ocioso");
        return;
      }
      $("petTalkText").value=recognized;
      note("Transcrição: "+recognized);
    } catch (err) {
      note("Falha na transcrição: "+(err.message||"tente novamente"),"error");
      setState("erro");
      return;
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
    const text=$("petTalkText").value.trim();
    if(text) send(text);
  }

  async function startRecording() {
    if(recording || busy || !csrf)return;
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      note("Microfone exige navegador compatível e HTTPS/localhost.","warn");return;
    }
    let stream=null;
    try {
      // Permission is requested only by the explicit microphone-button click.
      stream=await navigator.mediaDevices.getUserMedia({
        audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},
        video:false
      });
      if(typeof MediaRecorder==="undefined")throw new Error("MediaRecorder indisponível.");
      const mime=["audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus"]
        .find(t=>MediaRecorder.isTypeSupported(t));
      const recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
      const chunks=[];
      const item={recorder,stream,chunks};
      recording=item;
      recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
      recorder.onerror=()=>note("Falha ao gravar.","error");
      recorder.onstop=()=>{
        clearTimeout(recordingTimeout);
        stream.getTracks().forEach(t=>t.stop());
        if(recording===item)recording=null;
        $("petTalkMic").textContent="🎙 Falar";
        if(chunks.length) transcribe(new Blob(chunks,{type:recorder.mimeType||"audio/webm"}),
                                    recorder.mimeType||"audio/webm");
        else {note("O microfone não retornou áudio.","warn");setState("ocioso");}
      };
      recorder.start(250);
      $("petTalkMic").textContent="■ Parar e enviar";
      note("🎙 Microfone ativo. Fale agora e clique em ‘Parar e enviar’.");
      await setState("ouvindo");
      recordingTimeout=setTimeout(()=>{if(recording===item)stopRecording();},23_000);
    } catch (err) {
      stream?.getTracks().forEach(t=>t.stop());
      recording=null;
      note("Microfone: "+(err.message||"permissão não concedida"),"warn");
    }
  }
  $("petTalkForm").addEventListener("submit",e=>{
    e.preventDefault();
    send($("petTalkText").value);
  });
  $("petTalkMic").addEventListener("click",()=>recording?stopRecording():startRecording());
  $("petTalkVoiceMode").addEventListener("change",()=>{
    $("petTalkVoice").disabled=$("petTalkVoiceMode").value==="voicehub";
  });
  $("petTalkPlayer").addEventListener("play",()=>setState("executando"));
  $("petTalkPlayer").addEventListener("pause",()=>{
    if($("petTalkPlayer").ended)setState("ocioso");
  });
  window.addEventListener("pagehide",()=>{
    if (recording) stopRecording();
    if(audioUrl) URL.revokeObjectURL(audioUrl);
  });
  connect();
})();
