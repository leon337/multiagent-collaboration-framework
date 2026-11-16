"use strict";
/* MCF Pet MESTRE: one-way observation. No POST, sockets, microphone or execution commands. */
(() => {
  const $ = id => document.getElementById(id);
  const EXPRESSIONS = Object.freeze({
    ocioso: "Ocioso", ouvindo: "Ouvindo", raciocinando: "Raciocinando",
    executando: "Executando", concluido: "Concluído", erro: "Erro / Bloqueio"
  });
  const STATUS = Object.freeze({
    online: ["Pet ativo", "ok", "Estado confirmado pelo processo do mascote."],
    telemetry_unverified: ["Ativo, aguardando telemetria", "warn", "O serviço está ativo, mas o estado visual ainda não foi confirmado."],
    degraded: ["Comunicação UDP indisponível", "warn", "O serviço está ativo, porém a recepção de estados não foi detectada."],
    offline: ["Pet desligado", "bad", "O serviço do mascote não está ativo."],
    unknown: ["Estado indisponível", "warn", "O serviço não pôde ser consultado com segurança."]
  });
  let pending = false;
  function setText(id, content) {
    const node = $(id);
    if (node) node.textContent = content === undefined || content === null || content === "" ? "—" : String(content);
  }
  function formatTime(value) {
    if (!value) return "Sem registro";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Sem registro" : date.toLocaleString("pt-BR");
  }
  function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "Não disponível";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return (days ? days + "d " : "") + hours + "h " + minutes + "min";
  }
  function render(data) {
    const valid = data && data.schema === "mcf-pet-observation/v1";
    const pet = valid && data.pet && typeof data.pet === "object" ? data.pet : {};
    const voice = valid && data.voicehub && typeof data.voicehub === "object" ? data.voicehub : {};
    const status = Object.prototype.hasOwnProperty.call(STATUS, pet.status) ? pet.status : "unknown";
    const tuple = STATUS[status];

    const badge = $("petServiceBadge");
    badge.className = "tag " + tuple[1];
    badge.textContent = tuple[0];
    const dot = $("petStatusDot");
    dot.className = "pet-dot " + (status === "online" ? "online" : status === "offline" ? "offline" : "");
    $("petPortrait").dataset.petStatus = status;
    setText("petSummary", status === "online" && pet.process_source === "desktop"
      ? "Pet original em execução na área de trabalho; processo e telemetria confirmados."
      : tuple[2]);
    setText("petProcess", Number.isInteger(pet.pid) && pet.pid > 0 ? "PID " + pet.pid : "Sem processo confirmado");
    setText("petServiceState", pet.service_active === true ? "Ativo via systemd"
      : pet.process_source === "desktop" ? "Pet aberto manualmente"
      : pet.service_active === false ? "Inativo" : "Desconhecido");
    setText("petUDP", pet.udp_listening === true ? "127.0.0.1:18765" : pet.udp_listening === false ? "Não detectado" : "Indisponível");
    setText("petTime", formatTime(pet.updated_at));
    setText("petUptime", formatDuration(pet.uptime_seconds));
    setText("petRestarts", Number.isInteger(pet.restarts) ? String(pet.restarts) : "Indisponível");
    setText("petCheckedAt", "Última observação: " + formatTime(data && data.checked_at));

    const current = pet.state_verified === true &&
      typeof pet.state === "string" && Object.prototype.hasOwnProperty.call(EXPRESSIONS, pet.state)
      ? pet.state : null;
    $("petPortrait").dataset.petState = current || "desconhecido";
    const avatar = $("petAvatar");
    // Only local, statically allowlisted original art. No server-origin URL is consumed here.
    const selected = current || "ocioso";
    const desiredSrc = "/pet-assets/pet-" + selected + ".png";
    if (avatar.getAttribute("src") !== desiredSrc) avatar.setAttribute("src", desiredSrc);
    avatar.alt = current ? "Pet MESTRE original no estado " + EXPRESSIONS[current]
                         : "Ilustração original do Pet MESTRE; estado não confirmado";
    setText("petExpression", current ? "Expressão atual: " + EXPRESSIONS[current]
                                      : "Expressão não confirmada");
    setText("petPreviewNote", current ? "Imagem original associada à telemetria confirmada"
                                     : "Prévia do avatar original; não representa um estado verificado");
    $("petStates").querySelectorAll("[data-pet-state]").forEach(chip => {
      const active = chip.dataset.petState === current;
      chip.dataset.active = String(active);
      if (active) chip.setAttribute("aria-current", "true");
      else chip.removeAttribute("aria-current");
    });

    if (voice.api_ok === true && voice.service_active === true) {
      setText("petVoice", "VoiceHub saudável");
      setText("petVoiceDetail", voice.speech_dispatcher_running === true ?
        "Despachante de fala ativo" : "API responde; despachante não confirmado");
    } else if (voice.service_active === false) {
      setText("petVoice", "VoiceHub desligado");
      setText("petVoiceDetail", "Serviço de voz não está ativo");
    } else {
      setText("petVoice", "VoiceHub não verificado");
      setText("petVoiceDetail", "Sem prova de saúde da API local");
    }
  }
  async function load() {
    if (pending) return;
    pending = true;
    try {
      const res = await fetch("/api/v1/pet", {
        method: "GET", cache: "no-store",
        headers: {Accept: "application/json"}
      });
      if (!res.ok) throw new Error("Unable to read pet observer");
      const data = await res.json();
      render(data);
    } catch (_) {
      render({schema:"mcf-pet-observation/v1",pet:{status:"unknown",state_verified:false},
              voicehub:{api_ok:null,status:"unverified"}});
    } finally {
      pending = false;
    }
  }
  load();
  setInterval(load,5000);
  const refresh = $("refresh");
  if (refresh) refresh.addEventListener("click",load);
})();
