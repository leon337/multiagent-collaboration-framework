window.__ModuleLoader__.load({ id: "mcf-dsh-inline-browser", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
const React = require("react");

function BrowserFixedView({ sessionId }) {
  const [frame, setFrame] = React.useState(null);
  const [state, setState] = React.useState({ status: "waiting" });
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    const source = new EventSource("/mcf-dsh-inline-browser/stream?sessionId=" + encodeURIComponent(sessionId));
    const onFrame = (event) => { try { setFrame(JSON.parse(event.data)); } catch {} };
    const onState = (event) => { try { setState(JSON.parse(event.data)); } catch {} };
    source.addEventListener("frame", onFrame);
    source.addEventListener("state", onState);
    return () => source.close();
  }, [sessionId]);

  const label = state.status === "ready"
    ? "Browser ativo"
    : state.status === "error"
      ? "Browser indisponível"
      : "Aguardando navegador";

  return React.createElement("section", {
    "aria-label": "Navegador do agente",
    "data-mcf-fixed-browser-view": "",
    "data-mcf-session": sessionId,
    style: { border: "1px solid var(--dsw-alias-border-l3)", borderRadius: 12, overflow: "hidden", background: "var(--dsw-alias-bg-layer-1)" }
  },
    React.createElement("button", {
      type: "button",
      onClick: () => setCollapsed(v => !v),
      style: { width: "100%", minHeight: 38, padding: "0 12px", display: "flex", alignItems: "center", gap: 8, border: 0, borderBottom: collapsed ? 0 : "1px solid var(--dsw-alias-border-l3)", background: "transparent", color: "var(--dsw-alias-label-primary)", cursor: "pointer", textAlign: "left" }
    },
      React.createElement("strong", null, "🌐 Browser do agente"),
      React.createElement("span", { style: { fontSize: 12, opacity: .72 } }, label),
      React.createElement("span", { style: { marginLeft: "auto", fontSize: 12, opacity: .65 } }, collapsed ? "Mostrar" : "Minimizar")
    ),
    !collapsed && React.createElement("div", { style: { padding: 8 } },
      React.createElement("div", { style: { fontSize: 11, opacity: .72, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 6 }, title: state.url || "" }, state.url || "A sessão do navegador será vinculada automaticamente a esta conversa."),
      frame
        ? React.createElement("img", { src: "data:image/jpeg;base64," + frame.data, alt: "Navegador ao vivo desta conversa", "data-mcf-browser-frame-session": sessionId, style: { display: "block", width: "100%", height: "auto", maxHeight: 420, objectFit: "contain", borderRadius: 8 } })
        : React.createElement("div", { style: { minHeight: 120, display: "grid", placeItems: "center", borderRadius: 8, background: "var(--dsw-alias-bg-layer-2)", fontSize: 12, opacity: .72, textAlign: "center", padding: 16 } }, state.message || state.error || "Aguardando o primeiro navegador desta conversa…")
    )
  );
}

function apply(ctx) {
  ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register(
    { name: "conversation.composer.dock", id: "mcf-browser-fixed", order: -100 },
    ({ session }) => React.createElement(BrowserFixedView, { sessionId: session.id })
  ));
}
exports.inject = ["slots"];
exports.apply = apply;
return module.exports;
} });