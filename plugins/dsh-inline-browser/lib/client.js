window.__ModuleLoader__.load({ id: "mcf-dsh-inline-browser", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
const React = require("react");
function requestedUrl(block) {
  try {
    const value = block;
    const live = value?.args?.text?.("url");
    if (typeof live === "string" && live !== "") return live;
    const raw = value?.argsRaw ?? value?.call?.argsRaw;
    if (raw) {
      const parsed = JSON.parse(raw);
      return typeof parsed.url === "string" ? parsed.url : "";
    }
  } catch {}
  return "";
}
function BrowserInlineRow({ block, callId, sessionId }) {
  const [frame, setFrame] = React.useState(null);
  const [state, setState] = React.useState({});
  const running = !(typeof block === "object" && block !== null && "kind" in block);
  React.useEffect(() => {
    const source = new EventSource("/mcf-dsh-inline-browser/stream?callId=" + encodeURIComponent(callId) + "&sessionId=" + encodeURIComponent(sessionId));
    const onFrame = (event) => { try { setFrame(JSON.parse(event.data)); } catch {} };
    const onState = (event) => { try { setState(JSON.parse(event.data)); } catch {} };
    source.addEventListener("frame", onFrame);
    source.addEventListener("state", onState);
    return () => {
      source.removeEventListener("frame", onFrame);
      source.removeEventListener("state", onState);
      source.close();
    };
  }, [callId, sessionId]);
  const url = state.url || frame?.url || requestedUrl(block);
  return React.createElement("section", {
    "aria-label": "Browser ao vivo",
    "data-mcf-inline-browser": "",
    "data-mcf-session": sessionId,
    style: { border: "1px solid var(--dsw-alias-border-l3)", borderRadius: 10, overflow: "hidden", background: "var(--dsw-alias-bg-layer-1)", marginTop: 6, marginBottom: 6 }
  },
    React.createElement("header", { style: { display: "flex", alignItems: "center", gap: 8, minHeight: 36, padding: "0 10px", borderBottom: "1px solid var(--dsw-alias-border-l3)" } },
      React.createElement("strong", null, "Browser ao vivo"),
      React.createElement("span", { style: { fontSize: 12, opacity: .75 } }, state.error ? "Indisponível" : running ? "Executando no Browser" : "Browser concluído"),
      React.createElement("span", { style: { marginLeft: "auto", fontSize: 11, opacity: .6 } }, state.tabCount !== undefined ? state.tabCount + " aba(s)" : "")
    ),
    React.createElement("div", { style: { padding: 8 } },
      React.createElement("div", { title: url, style: { fontSize: 11, opacity: .72, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 6 } }, url || "Abrindo o navegador…"),
      frame
        ? React.createElement("img", { src: "data:image/jpeg;base64," + frame.data, alt: "Visualização ao vivo do navegador desta conversa", "data-mcf-browser-frame-session": sessionId, style: { display: "block", width: "100%", height: "auto", maxHeight: 520, objectFit: "contain", borderRadius: 7 } })
        : React.createElement("div", { style: { minHeight: 180, display: "grid", placeItems: "center", borderRadius: 7, background: "var(--dsw-alias-bg-layer-2)", fontSize: 12, opacity: .72, textAlign: "center", padding: 20 } }, state.error || "Aguardando o primeiro frame…")
    )
  );
}
function apply(ctx) {
  if (typeof document !== "undefined") document.documentElement.dataset.mcfInlineLoaded = "1";
  console.log("[mcf-dsh-inline-browser] client apply");
  ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({ name: "tool.call.toolview", key: "browser_open" }, BrowserInlineRow));
}
exports.inject = ["slots"];
exports.apply = apply;
return module.exports;
} });